# Whop Tasks

Whop Tasks is a local-first marketplace for funded, structured internet work. One account can earn by completing tasks or operate as a business that funds campaigns and reviews proof.

## Local setup

Requirements:

- Node.js 20.9 or newer
- Docker with Docker Compose

```bash
npm install
cp .env.example .env.local
npm run demo:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`npm run demo:setup` is idempotent. It starts PostgreSQL, applies migrations, and loads the complete demo inventory. Before sharing an environment, replace `BETTER_AUTH_SECRET` with at least 32 random characters.

## Demo accounts

Both accounts can use Earn and Business workspaces:

- `maya@whoptasks.local` / `WhopTasksDemo!2026`
- `jordan@whoptasks.local` / `WhopTasksDemo!2026`

Suggested demo:

1. Sign in as Maya and publish a one-slot campaign from Business.
2. In a second browser profile, sign in as Jordan, claim the public task, and submit its generated proof form.
3. Return to Maya, open the review queue, and choose **Approve and pay**.
4. Confirm Maya's escrow decreased and Jordan's Earnings balance increased by the reward.

## Foundation commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio
```

Playwright starts its own local Next.js server. Install Chromium once with `npx playwright install chromium`.

Use `docker compose down` to stop PostgreSQL without deleting its named volume.

## Architecture

- Next.js App Router and strict TypeScript
- Whop Frosted UI through `@whop/react`
- Better Auth email and password sessions
- PostgreSQL 17 with Drizzle ORM and versioned migrations
- Plain TypeScript services for campaigns, claims, submissions, notifications, private proof files, and double-entry demo escrow
- Private local uploads under `.data/uploads`

The database is the source of truth for ownership, campaign status, capacity, claim expiry, review transitions, and balances. UI code must call authenticated server actions or route handlers, which then call the service layer.

## Simulated money

All balances, escrow reservations, payouts, and refunds are demo-only ledger entries. No real funds are accepted, held, transferred, or withdrawn.

## Brand source

`PRODUCT.md`, `DESIGN.md`, and `DESIGN.json` record the approved product and visual context. Exact source assets and the v2.7 guidelines live under `brand-source`; the limited app-ready subset lives under `public/brand`.
