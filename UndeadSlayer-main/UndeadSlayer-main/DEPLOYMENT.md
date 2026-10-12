# Undead Slayer — deployment configuration

The app uses **PostgreSQL** through Neon and Drizzle ORM. Never commit database credentials or session secrets to this repository.

## Required Vercel environment variables

In Vercel, open **Project → Settings → Environment Variables** and add:

- `DATABASE_URL`: The connection string from your Neon project. Keep it private. Use the pooled connection string when recommended by Neon; retain SSL parameters.
- `SESSION_SECRET`: A randomly generated secret with at least 32 characters. Generate one locally, for example with `openssl rand -base64 48`. Do not reuse your database password.

Add both variables for the **Production** environment (and Preview/Development if needed), save, then trigger **Redeploy**. Adding variables does not update an already-running deployment until it is redeployed.

## Verify database connectivity

After deployment, visit `/api/health`. A healthy response is:

```json
{"ok":true}
```

If it reports `database: "unconfigured"`, `DATABASE_URL` is not available to that deployment. If it returns a 500, check Neon connection status, URL correctness, SSL parameters, and Vercel runtime logs.

## Database schema

The app bootstraps the `users` and `game_progress` tables on first auth/save request. For a deliberate schema deploy from a trusted development environment with `DATABASE_URL` set, run:

```bash
npm install
npx drizzle-kit push
npm run typecheck
npm run build
```

Do not paste secrets into source code, commit them in `.env`, or share them in screenshots or chats. If a credential has already been shared, rotate it with Neon and update Vercel with the replacement.
