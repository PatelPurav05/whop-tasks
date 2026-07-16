import { and, eq, sql } from "drizzle-orm";
import { db, type DatabaseTransaction } from "@/db";
import {
  ledgerEntries,
  ledgerTransactions,
  walletAccounts,
} from "@/db/schema";
import { assertDomain } from "./errors";

type LedgerKind =
  | "demo_grant"
  | "escrow_reservation"
  | "payout"
  | "refund";

type LedgerPosting = {
  accountId: string;
  amountCents: number;
};

type TransactionContext = {
  actorUserId?: string;
  campaignId?: string;
  submissionId?: string;
};

async function ensureSystemAccount(
  tx: DatabaseTransaction,
): Promise<typeof walletAccounts.$inferSelect> {
  await tx
    .insert(walletAccounts)
    .values({
      kind: "system",
      label: "demo-clearing",
    })
    .onConflictDoNothing();

  const [account] = await tx
    .select()
    .from(walletAccounts)
    .where(
      and(
        eq(walletAccounts.kind, "system"),
        eq(walletAccounts.label, "demo-clearing"),
      ),
    )
    .limit(1);

  assertDomain(account, "NOT_FOUND", "Clearing account is unavailable");
  return account;
}

export async function ensureUserWallet(
  tx: DatabaseTransaction,
  userId: string,
): Promise<typeof walletAccounts.$inferSelect> {
  await tx
    .insert(walletAccounts)
    .values({
      kind: "user",
      userId,
      label: `Wallet ${userId}`,
    })
    .onConflictDoNothing();

  const [account] = await tx
    .select()
    .from(walletAccounts)
    .where(
      and(eq(walletAccounts.kind, "user"), eq(walletAccounts.userId, userId)),
    )
    .limit(1);

  assertDomain(account, "NOT_FOUND", "User wallet is unavailable");
  return account;
}

export async function ensureCampaignEscrow(
  tx: DatabaseTransaction,
  campaignId: string,
): Promise<typeof walletAccounts.$inferSelect> {
  await tx
    .insert(walletAccounts)
    .values({
      kind: "escrow",
      campaignId,
      label: `Campaign escrow ${campaignId}`,
    })
    .onConflictDoNothing();

  const [account] = await tx
    .select()
    .from(walletAccounts)
    .where(
      and(
        eq(walletAccounts.kind, "escrow"),
        eq(walletAccounts.campaignId, campaignId),
      ),
    )
    .limit(1);

  assertDomain(account, "NOT_FOUND", "Campaign escrow is unavailable");
  return account;
}

async function lockAccounts(
  tx: DatabaseTransaction,
  accountIds: string[],
): Promise<void> {
  const orderedIds = [...new Set(accountIds)].sort();
  await tx.execute(
    sql`select id from ${walletAccounts}
        where ${walletAccounts.id} in (${sql.join(
          orderedIds.map((id) => sql`${id}::uuid`),
          sql`, `,
        )})
        order by id
        for update`,
  );
}

async function getBalanceInTransaction(
  tx: DatabaseTransaction,
  accountId: string,
): Promise<number> {
  const [row] = await tx
    .select({
      balance: sql<number>`coalesce(sum(${ledgerEntries.amountCents}), 0)`,
    })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.accountId, accountId));

  return Number(row?.balance ?? 0);
}

async function postBalancedTransaction(
  tx: DatabaseTransaction,
  input: {
    kind: LedgerKind;
    idempotencyKey: string;
    postings: LedgerPosting[];
    context?: TransactionContext;
  },
): Promise<string> {
  const existing = await tx
    .select({ id: ledgerTransactions.id })
    .from(ledgerTransactions)
    .where(eq(ledgerTransactions.idempotencyKey, input.idempotencyKey))
    .limit(1);

  if (existing[0]) {
    return existing[0].id;
  }

  assertDomain(
    input.postings.length >= 2,
    "VALIDATION",
    "A ledger transaction needs at least two entries",
  );
  assertDomain(
    input.postings.every(
      (entry) =>
        Number.isSafeInteger(entry.amountCents) && entry.amountCents !== 0,
    ),
    "VALIDATION",
    "Ledger entries must contain non-zero integer cents",
  );

  const total = input.postings.reduce(
    (sum, entry) => sum + entry.amountCents,
    0,
  );
  assertDomain(total === 0, "VALIDATION", "Ledger entries must balance to zero");

  const [transaction] = await tx
    .insert(ledgerTransactions)
    .values({
      kind: input.kind,
      idempotencyKey: input.idempotencyKey,
      actorUserId: input.context?.actorUserId,
      campaignId: input.context?.campaignId,
      submissionId: input.context?.submissionId,
    })
    .returning({ id: ledgerTransactions.id });

  assertDomain(transaction, "NOT_FOUND", "Ledger transaction was not created");

  await tx.insert(ledgerEntries).values(
    input.postings.map((posting) => ({
      transactionId: transaction.id,
      accountId: posting.accountId,
      amountCents: posting.amountCents,
    })),
  );

  return transaction.id;
}

export async function getUserBalance(userId: string): Promise<number> {
  const [account] = await db
    .select({ id: walletAccounts.id })
    .from(walletAccounts)
    .where(
      and(eq(walletAccounts.kind, "user"), eq(walletAccounts.userId, userId)),
    )
    .limit(1);

  if (!account) {
    return 0;
  }

  const [row] = await db
    .select({
      balance: sql<number>`coalesce(sum(${ledgerEntries.amountCents}), 0)`,
    })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.accountId, account.id));

  return Number(row?.balance ?? 0);
}

export async function grantDemoCredits(
  userId: string,
  amountCents: number,
  grantKey: string,
): Promise<string> {
  assertDomain(
    Number.isSafeInteger(amountCents) && amountCents > 0,
    "VALIDATION",
    "Credit amount must be positive integer cents",
  );

  return await db.transaction(async (tx) => {
    const system = await ensureSystemAccount(tx);
    const wallet = await ensureUserWallet(tx, userId);
    await lockAccounts(tx, [system.id, wallet.id]);

    return await postBalancedTransaction(tx, {
      kind: "demo_grant",
      idempotencyKey: `demo-grant:${grantKey}`,
      postings: [
        { accountId: system.id, amountCents: -amountCents },
        { accountId: wallet.id, amountCents },
      ],
      context: { actorUserId: userId },
    });
  });
}

export async function reserveCampaignFunds(
  tx: DatabaseTransaction,
  input: {
    ownerId: string;
    campaignId: string;
    amountCents: number;
  },
): Promise<string> {
  const wallet = await ensureUserWallet(tx, input.ownerId);
  const escrow = await ensureCampaignEscrow(tx, input.campaignId);
  await lockAccounts(tx, [wallet.id, escrow.id]);

  const walletBalance = await getBalanceInTransaction(tx, wallet.id);
  assertDomain(
    walletBalance >= input.amountCents,
    "INSUFFICIENT_FUNDS",
    "Add funds before publishing this campaign",
    { availableCents: walletBalance, requiredCents: input.amountCents },
  );

  return await postBalancedTransaction(tx, {
    kind: "escrow_reservation",
    idempotencyKey: `campaign-publish:${input.campaignId}`,
    postings: [
      { accountId: wallet.id, amountCents: -input.amountCents },
      { accountId: escrow.id, amountCents: input.amountCents },
    ],
    context: {
      actorUserId: input.ownerId,
      campaignId: input.campaignId,
    },
  });
}

export async function paySubmissionFromEscrow(
  tx: DatabaseTransaction,
  input: {
    campaignId: string;
    submissionId: string;
    earnerId: string;
    reviewerId: string;
    amountCents: number;
  },
): Promise<string> {
  const escrow = await ensureCampaignEscrow(tx, input.campaignId);
  const earnerWallet = await ensureUserWallet(tx, input.earnerId);
  await lockAccounts(tx, [escrow.id, earnerWallet.id]);

  const escrowBalance = await getBalanceInTransaction(tx, escrow.id);
  assertDomain(
    escrowBalance >= input.amountCents,
    "INVALID_STATE",
    "Campaign escrow cannot cover this payout",
  );

  return await postBalancedTransaction(tx, {
    kind: "payout",
    idempotencyKey: `submission-payout:${input.submissionId}`,
    postings: [
      { accountId: escrow.id, amountCents: -input.amountCents },
      { accountId: earnerWallet.id, amountCents: input.amountCents },
    ],
    context: {
      actorUserId: input.reviewerId,
      campaignId: input.campaignId,
      submissionId: input.submissionId,
    },
  });
}

export async function refundCampaignEscrow(
  tx: DatabaseTransaction,
  input: {
    campaignId: string;
    ownerId: string;
  },
): Promise<string | null> {
  const escrow = await ensureCampaignEscrow(tx, input.campaignId);
  const ownerWallet = await ensureUserWallet(tx, input.ownerId);
  await lockAccounts(tx, [escrow.id, ownerWallet.id]);

  const escrowBalance = await getBalanceInTransaction(tx, escrow.id);
  if (escrowBalance === 0) {
    return null;
  }

  assertDomain(
    escrowBalance > 0,
    "INVALID_STATE",
    "Campaign escrow balance cannot be negative",
  );

  return await postBalancedTransaction(tx, {
    kind: "refund",
    idempotencyKey: `campaign-refund:${input.campaignId}`,
    postings: [
      { accountId: escrow.id, amountCents: -escrowBalance },
      { accountId: ownerWallet.id, amountCents: escrowBalance },
    ],
    context: {
      actorUserId: input.ownerId,
      campaignId: input.campaignId,
    },
  });
}
