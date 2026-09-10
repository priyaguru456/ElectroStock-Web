# Database

This folder documents and supports the ElectroStock database. It does **not** replace or duplicate the Prisma setup — it exists alongside it.

## Source of truth

- **Database engine:** MySQL (only — no PostgreSQL, no MongoDB).
- **ORM:** [Prisma](https://www.prisma.io/), configured in the `backend` service.
- **Schema of record:** [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma). This is the single, authoritative schema definition. Do not duplicate model definitions here.
- **Migrations of record:** managed by Prisma via `npx prisma migrate dev` / `npx prisma migrate deploy`, generated into `backend/prisma/migrations/`.

## What lives in this folder

| Folder | Purpose |
| --- | --- |
| [`schema/`](schema/) | Human-readable database design docs (ER diagrams, table/field notes, design decisions) — a companion to `schema.prisma`, not a copy of it. |
| [`migrations/`](migrations/) | Manual/supporting SQL scripts only, for things Prisma migrate doesn't cover (e.g. one-off data fixes, index tuning, stored procedures). Not a replacement for Prisma's own migration history. |
| [`seeds/`](seeds/) | Sample/initial data for local development and testing. |
| [`scripts/`](scripts/) | Database utility scripts (backup, restore, maintenance, etc.). |

## Setup

1. Ensure a MySQL server is running and reachable.
2. In `backend/.env`, set `DATABASE_URL` to a MySQL connection string:
   ```
   DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"
   ```
3. From `backend/`, install dependencies and apply the Prisma schema:
   ```
   npm install
   npx prisma migrate dev
   ```
4. Seed an initial SUPER_ADMIN account: `npm run prisma:seed` (see [`seeds/`](seeds/) for adding your own sample data).

## Testing

The backend test suite (`npm test` from `backend/`) runs against a **separate** database so tests never touch dev data — configured via `backend/.env.test` (`DATABASE_URL` points at `electrostock_test` instead of `electrostock`). Create and migrate it once:

```
cd backend
$env:DATABASE_URL = "mysql://USER:PASSWORD@localhost:3306/electrostock_test"   # PowerShell
npx prisma migrate deploy
```

## Docker deployment

`docker-compose.yml` at the project root runs MySQL, backend, and frontend together. Copy `.env.example` to `.env` at the root and adjust `MYSQL_ROOT_PASSWORD`/`JWT_SECRET`, then `docker compose up --build`. The backend container runs `prisma migrate deploy` automatically on startup — it applies existing migrations only, it never generates new ones (that stays a local `npx prisma migrate dev` step).

## Notes

- Prisma's `datasource` provider in `schema.prisma` is set to `mysql`, matching this project's only supported database.
- Prisma 7 requires a driver adapter for the database connection — this project uses `@prisma/adapter-mariadb` (see `backend/src/config/db.js`), not the classic `DATABASE_URL`-only connection style from older Prisma versions.
- Keep this folder in sync with the Prisma schema conceptually (design docs, ER diagrams), but never re-declare models here — `schema.prisma` remains the single source of truth.
