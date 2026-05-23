# cabal-co-op — agent notes

Read [README.md](./README.md) before changing structure. This is a field ecology, not an anonymous content platform.

Live structures only:
- landing
- doorway
- artifact
- quip
- intimate thread
- decay
- storage

Treat users, auth URLs, role checks, admin language, and generic platform scaffolding as legacy residue. Do not extend that residue by default.

Every new file, route, table, env var, dependency, or abstraction must name which live structure it serves. If it serves none of them, do not add it.

Prefer removal, consolidation, or direct repair before abstraction.

Do not flatten intentional friction into UX cleanup. Upload pause, ephemerality, decay, and compost are part of the design, not missing polish.

Before claiming completion, verify against the matter directly: inspect the touched files, run the relevant checks, and report uncertainty plainly if proof is partial.

## Deployment shape

- Frontend: Vite + React, deployed as Vercel static.
- API: tRPC running on Vercel functions under `api/`.
- Database: Supabase Postgres (`DATABASE_URL`).
- File storage: Supabase Storage bucket `cabal-storage`.
- Cron: Vercel cron hits `/api/cron/decay` hourly.

## Required env vars

- `DATABASE_URL` — Supabase Postgres connection string
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — for server-side storage writes
- `CRON_SECRET` — for authenticating decay cron requests
