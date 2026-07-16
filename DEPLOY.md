# Deploy Whop Tasks to Vercel

This guide gets a fully working demo live on Vercel with Postgres, private file uploads, and seeded demo accounts.

## What you need

- A [Vercel](https://vercel.com) account
- A hosted Postgres database (Neon or Vercel Postgres)
- Vercel Blob storage (for proof file uploads)

## 1. Log in to Vercel CLI

```bash
npx vercel login
```

## 2. Create Postgres

**Option A — Vercel Postgres (Neon)**

1. Open your Vercel project after the first deploy (step 4), or create a project in the dashboard.
2. Go to **Storage** → **Create Database** → **Postgres**.
3. Connect it to the project. Vercel adds `DATABASE_URL` automatically.

**Option B — Neon manually**

1. Create a free database at [neon.tech](https://neon.tech).
2. Copy the pooled connection string.
3. Add it as `DATABASE_URL` in the Vercel project environment variables.

## 3. Add Vercel Blob

1. In the Vercel project, go to **Storage** → **Create Database** → **Blob**.
2. Connect it to the project. Vercel adds `BLOB_READ_WRITE_TOKEN` automatically.

Proof file uploads require Blob on Vercel (the local filesystem is not persistent).

## 4. Deploy

From the project root:

```bash
npx vercel link
npx vercel env add BETTER_AUTH_SECRET production
# Paste at least 32 random characters

npx vercel env add BETTER_AUTH_URL production
# Use your production URL, e.g. https://whop-tasks.vercel.app
# You can update this after the first deploy if the URL changes.

npx vercel env add DEMO_SETUP_SECRET production
# Paste a long random secret for one-time demo seeding

npx vercel deploy --prod
```

`vercel.json` runs `drizzle-kit migrate` before `next build`, so schema migrations apply on each deploy.

## 5. Seed demo data

After the first successful deploy, set `BETTER_AUTH_URL` to the final production URL if needed, redeploy, then seed:

```bash
curl -X POST "https://YOUR-APP.vercel.app/api/setup-demo" \
  -H "Authorization: Bearer YOUR_DEMO_SETUP_SECRET"
```

Or from your machine with the remote database URL:

```bash
DATABASE_URL="your-neon-url" \
BETTER_AUTH_URL="https://YOUR-APP.vercel.app" \
BETTER_AUTH_SECRET="your-secret" \
DEMO_SEED_ALLOWED=true \
npm run deploy:seed
```

## Demo accounts

- `maya@whoptasks.local` / `WhopTasksDemo!2026`
- `jordan@whoptasks.local` / `WhopTasksDemo!2026`

Both accounts can use **Earn** and **Business** workspaces.

## Suggested demo flow

1. Sign in as Maya → **Business** → review a pending submission or publish a campaign.
2. Sign in as Jordan (second browser profile) → claim a task → submit proof.
3. Return as Maya → approve and pay → confirm Jordan's earnings update.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Session signing secret (32+ chars) |
| `BETTER_AUTH_URL` | Yes | Public app URL |
| `BLOB_READ_WRITE_TOKEN` | Yes on Vercel | Private proof file storage |
| `DEMO_SETUP_SECRET` | For API seed | Protects `/api/setup-demo` |
| `PRIVATE_UPLOAD_ROOT` | Local only | Defaults to `.data/uploads` |

## Troubleshooting

- **Build fails on migrate** — Confirm `DATABASE_URL` is set for Production and the database is reachable from Vercel builds.
- **Sign-in fails after deploy** — Ensure `BETTER_AUTH_URL` exactly matches the live URL (including `https://`).
- **Proof uploads fail** — Confirm Vercel Blob is connected and `BLOB_READ_WRITE_TOKEN` is present.
- **Empty marketplace** — Run the demo seed step (section 5).
