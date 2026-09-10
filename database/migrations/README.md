# Migrations

Manual/supporting SQL migration scripts — used **only** when something falls
outside what Prisma Migrate handles (e.g. data backfills, manual index
tuning, stored procedures/triggers, or a one-off fix on an existing
environment).

Prisma remains the primary migration tool. Regular schema migrations should
be created via `npx prisma migrate dev` from the `backend` folder, and are
stored in `backend/prisma/migrations/`. Do not duplicate those here.

## Naming convention

When a manual script is needed, name it with a timestamp prefix so order is
clear, e.g.:

```
YYYYMMDDHHMM_short_description.sql
```
