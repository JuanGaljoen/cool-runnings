---
name: migrate
description: Create a Supabase database migration
disable-model-invocation: true
argument-hint: "[description of the migration]"
---

# Supabase Migration

Schema changes must originate as migration files — never as ad-hoc SQL in the
Supabase dashboard. The repo is the source of truth; running SQL directly in
the dashboard creates drift that is painful to recover from.

## Steps

1. Create the migration file:
   `supabase migration new <descriptive_snake_case_name>`
   This writes an empty file under `supabase/migrations/<timestamp>_<name>.sql`.
2. Write the SQL inside that file based on the user's description.
3. Present the SQL for review before applying.
4. After user approval, apply it: `supabase db push`
   (This applies the migration to the linked remote and records it in the
   migration history table.)
5. Regenerate types if table schemas changed:
   `npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > types/database.ts`
6. Update any affected server actions, components, or schemas.
7. Verify with `npx tsc --noEmit`.

## Rules

- Never drop tables or columns without explicit confirmation.
- Always add constraints (NOT NULL, CHECK, FK) where appropriate.
- Include comments in SQL explaining why the change is needed.
- If adding a column, consider whether it needs a default value for existing rows.
- Update the CLAUDE.md database tables section if the schema changes.
- Do not use the Supabase dashboard SQL Editor for schema changes — every
  change must be in a migration file. The dashboard is fine for reading,
  exploring data, and one-off debugging queries.
- If you discover schema drift (something in the DB that isn't in any migration
  file), capture it as a retroactive migration and use
  `supabase migration repair --status applied <timestamp>` to mark it applied.
