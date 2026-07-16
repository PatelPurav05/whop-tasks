# Local demo seed

This seed is only for the Docker PostgreSQL development database. It refuses to run with `NODE_ENV=production` or against a non-loopback database host.

After PostgreSQL is running and migrations are applied:

```bash
npx tsx scripts/seed.ts
```

The script loads `.env.local` first, falls back to `.env`, and can be rerun safely. It uses stable emails, campaign slugs, and ledger idempotency keys so reruns do not duplicate users, campaigns, claims, submissions, payouts, or demo-credit grants.

## Local-only credentials

| Account | Email | Password |
| --- | --- | --- |
| Maya Chen | `maya@whoptasks.local` | `WhopTasksDemo!2026` |
| Jordan Ellis | `jordan@whoptasks.local` | `WhopTasksDemo!2026` |

These credentials are intentionally public, shared demo credentials. Never reuse them outside local development. Both accounts can use the Earn and Business workspaces; neither account has an exclusive role.

Each account receives $1,000.00 in simulated wallet credits. The 10 seeded campaigns cover user research, content, QA testing, community, and sales research, with empty, nearly-full, pending-review, changes-requested, and completed/paid examples. No real money is accepted, held, transferred, or withdrawn.
