# cabal-co-op

Cabal Commons

A small anonymous field for writing, music, and art.

This is not a social platform. It should not grow accounts, profiles, feeds,
dashboards, analytics theater, recommendations, roles, or admin surfaces.

The load-bearing rule:

If a change does not serve landing, artifact, quip, intimate thread, decay, or storage,
do not add it.
What stays, stays because someone is still here with it.

Current Git State
As of 2026-05-11, the repo is split:

local main is ahead of origin/main by one landing-page checkpoint:
fd99f62 Improve landing page readability
origin/main is ahead of local main by one migration commit:
6e1a40f Migrate to Vercel/Supabase and refine field aesthetics
the checkpoint was also pushed to:
origin/main-page1-landing-checkpoint
Do not build over this blindly. Reconcile the branch state before treating either
local or GitHub as source of truth.

Live Deployment State
The live domain has been observed serving from Render, not Vercel:

https://cabal-is-coherent.com
x-render-origin-server: Render
X-Powered-By: Express
The live health endpoint has also reported:

{
  "ok": false,
  "db": { "ok": false, "reason": "DATABASE_URL missing" },
  "storage": { "configured": false }
}
That means the visible live site may be an older Render build. Do not assume
GitHub, local files, and the live domain are currently aligned.

Load-Bearing Mechanisms
Landing
Purpose: arrival.

File:

client/src/pages/Landing.tsx
Requirements:

dark breathing field
readable purple text
one clear entry action into the field
no extra initiation, puzzle, or marketing layer
Doorway
Purpose: choose a container.

File:

client/src/pages/Doorway.tsx
Requirements:

three doors only: writing, music, art
labels are containers, not rigid categories
each door enters the same field tuned by type
Artifact
Purpose: the thing left in the field.

Files:

client/src/components/ArtifactCard.tsx
client/src/components/NewArtifactForm.tsx
drizzle/schema.ts
server/db.ts
Data:

body text, optional
file attachment, optional
nama, optional
type: writing, music, or art
base life: seven days
purple shade
created timestamp
last interaction timestamp
Rules:

a new artifact starts alive
views extend life by 6 hours
quips extend life by 18 hours
inactivity darkens the artifact
expiration deletes the artifact and related records
Quip
Purpose: response as re-attendance.

Files:

client/src/components/QuipModal.tsx
server/db.ts
drizzle/schema.ts
Data:

parent artifact id
body text, optional
file attachment, optional
nama, optional
created timestamp
Rules:

creating a quip records interaction
creating a quip extends artifact life by 18 hours
Intimate Thread
Purpose: smaller ephemeral contact around one artifact.

Files:

client/src/components/IntimateCollaborate.tsx
server/db.ts
drizzle/schema.ts
Data:

one artifact id
session A
optional session B
messages scoped to that thread
Boundary:

no accounts
no durable identity
no global inbox
no promise of persistence beyond browser/session continuity
Decay
Purpose: make attention and absence visible.

Files:

server/db.ts
server/routers/scheduled.ts
api/cron/decay.ts
vercel.json
Rules:

shade changes every 18 hours of inactivity
artifact expires when createdAt + lifeSeconds is older than now
expiration deletes:
artifact
quips
interactions
intimate threads
intimate messages
Storage
Purpose: optional file holding.

Files:

server/storage.ts
artifact and quip upload mutations in server/routers.ts
Environment:

BUILT_IN_FORGE_API_URL
BUILT_IN_FORGE_API_KEY
Boundary:

text-first operation should still work without storage configuration
files are not the archive; expiration still controls the field's memory
Technical Shape
Frontend:

Vite
React
Wouter routes
tRPC client
Backend/API:

tRPC router in server/routers.ts
database logic in server/db.ts
Vercel API entry in api/trpc/[trpc].ts
health witness in api/health.ts
cron decay in api/cron/decay.ts
Database:

Drizzle ORM
Postgres-compatible DATABASE_URL
tables currently include:
artifacts
quips
interactions
intimate_threads
intimate_messages
Legacy residue to remove or avoid extending:

users
roles
login/auth URLs
admin permissions
generic platform scaffolding
Routes
Client routes:

/              Landing
/field         Doorway
/field/:door   Forum filtered by writing/music/art
API routes:

/api/trpc/*       tRPC API
/api/health       deployment and database health
/api/cron/decay   scheduled decay runner
Environment
Required:

DATABASE_URL
Recommended:

CRON_SECRET
Optional:

BUILT_IN_FORGE_API_URL
BUILT_IN_FORGE_API_KEY
Local Commands
The package manager recorded in package.json is pnpm.

If pnpm is on PATH:

pnpm install
pnpm check
pnpm test
pnpm build
If pnpm is not on PATH but node_modules exists locally:

./node_modules/.bin/tsc --noEmit
./node_modules/.bin/vitest run
./node_modules/.bin/vite build
Database migration command:

pnpm db:push
Deployment Shape
Preferred direction:

Vercel static frontend plus API functions
hosted Postgres/Supabase-compatible database via DATABASE_URL
Vercel cron for decay
Relevant files:

vercel.json
api/trpc/[trpc].ts
api/health.ts
api/cron/decay.ts
The old combined Node/Express server still exists:

server/_core/index.ts
server/_core/vite.ts
package.json scripts dev, build, start
If the live domain is still on Render, either intentionally maintain Render or
move the domain/deployment to the Vercel-shaped body. Do not keep both paths
half-alive.

Build Elsewhere Checklist
Pick the source of truth branch.
Reconcile local main, origin/main, and main-page1-landing-checkpoint.
Remove or quarantine legacy user/auth/admin residue.
Provision Postgres or Supabase and set DATABASE_URL.
Run Drizzle migrations.
Set CRON_SECRET.
Deploy the Vercel shape or deliberately keep the Node server shape.
Confirm /api/health or /health reports database ok: true.
Confirm the live bundle contains the expected current UI changes.
Concept Boundary
This project asks whether an online space changes when memory behaves less like
storage and more like continued attendance.

Keep it small.
Keep it legible.
Keep the mechanics visible through behavior, not explanation.
