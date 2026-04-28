---
name: migrate
description: Create a Supabase database migration
disable-model-invocation: true
argument-hint: "[description of the migration]"
---

# Supabase Migration

## Steps

1. Write the SQL migration based on the user's description
2. Present the SQL for review before applying
3. After user approval, they run the SQL in the Supabase SQL Editor
4. Update `types/database.ts` if table schemas changed — run: `npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > types/database.ts`
5. Update any affected server actions, components, or schemas
6. Verify with `npx tsc --noEmit`

## Rules

- Never drop tables or columns without explicit confirmation
- Always add constraints (NOT NULL, CHECK, FK) where appropriate
- Include comments in SQL explaining why the change is needed
- If adding a column, consider whether it needs a default value for existing rows
- Update the CLAUDE.md database tables section if the schema changes
