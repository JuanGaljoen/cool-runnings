# Project Context — Ice Inventory Management System

## What this is
A web-based inventory management system for an ice manufacturing company.
One factory, one location. A small internal team (3–10 staff) manage stock day-to-day.
Built and hosted by the developer on behalf of the client.

## Project notes
Deferred items, security follow-ups, and future ideas live in `TODO.md` at
the project root. When you finish a task that closes a TODO, strike or
remove the entry there. When you encounter something worth deferring, add
it to the appropriate section in `TODO.md` rather than leaving a comment.

## Tech stack
- **Framework:** Next.js 14 (App Router, TypeScript)
- **UI:** Tailwind CSS + shadcn/ui components
- **Database:** Supabase (Postgres)
- **Auth:** Supabase Auth (@supabase/ssr)
- **Forms:** react-hook-form + zod
- **Charts:** recharts
- **Hosting:** Vercel (frontend) + Supabase (database)

## Folder structure
```
/app
  /login              # Public auth page (+ actions.ts)
  /dashboard          # Protected — all app pages live here
    /page.tsx         # Main dashboard (stock overview + recent movements)
    /stock            # Record production runs, dispatches, adjustments (+ actions.ts)
    /products         # Product catalogue CRUD (+ actions.ts)
    /clients          # Client CRUD — referenced by dispatch movements (+ actions.ts)
    /reports          # Date-range reports + CSV export (+ actions.ts)
    /settings         # Admin only — user management (+ actions.ts)
    /layout.tsx       # Persistent nav layout for all dashboard pages
/components           # Shared UI components
/lib
  /supabase           # Supabase clients (admin, browser, server, middleware)
  /schemas            # Shared zod schemas (product, movement, invite, client)
  auth-helpers.ts     # protectedAction / adminAction / validate wrappers
  movement-constants.ts
  utils.ts
/types                # TypeScript interfaces and enums
```

## Database tables

### profiles
Extends Supabase auth.users — `id` is both the PK and FK to `auth.users(id)` (no separate auth_user_id column). A row is auto-created via `handle_new_user` trigger on insert into `auth.users`.
- id (uuid, PK, FK → auth.users on delete cascade)
- full_name (text)
- role (enum: 'admin' | 'staff' | 'rep', default 'staff')
- commission_per_unit (numeric(10,2), default 1.00, check ≥ 0) — only meaningful for reps; the per-unit commission paid on dispatches to that rep's clients
- created_at (timestamp)
- updated_at (timestamp)

**Trigger:** `prevent_role_self_escalation` blocks any role change unless the caller is an admin or the service role (detected via `auth.role() = 'service_role'`). Required because RLS allows users to update their own profile but is row-level, not column-level.

### products
- id (uuid, PK)
- name (text) — e.g. "5kg Bag", "10kg Bag", "Block Ice", "Crushed Ice"
- unit (text) — e.g. "bag", "block"
- low_stock_threshold (int) — alert when stock_levels.quantity falls below this
- unit_price (numeric(10,2), default 0, check ≥ 0) — sale price in ZAR; **admin-visible only**
- is_active (bool)
- created_at (timestamp)
- updated_at (timestamp)

### stock_levels
One row per product. Kept in sync automatically via a Postgres trigger. Has a `stock_non_negative` CHECK constraint (`quantity >= 0`) — dispatches/adjustments that would push stock below zero are rejected at the DB layer.
- id (uuid, PK)
- product_id (uuid, FK → products, unique)
- quantity (int, default 0, check ≥ 0)
- updated_at (timestamp)

### stock_movements
Full audit log of every stock change. Append-only.
- id (uuid, PK)
- product_id (uuid, FK → products on delete restrict)
- created_by (uuid, FK → profiles on delete restrict)
- client_id (uuid, FK → clients on delete set null, nullable) — required for dispatches
- movement_type (enum: 'production' | 'dispatch' | 'adjustment')
- quantity (int, check > 0) — always positive; direction determined by movement_type
- adjustment_reason (text, nullable, check in 'damaged' | 'stocktake' | 'write_off' | 'theft' | 'other') — required for adjustments
- note (text, nullable)
- created_at (timestamp)

**Trigger:** `apply_stock_movement` runs on every insert and updates stock_levels.quantity:
- production → add quantity
- dispatch → subtract quantity
- adjustment → subtract quantity

The `stock_non_negative` constraint on stock_levels guards against pushes that would go below zero (race-safe — relying on this rather than the app-level pre-check).

### clients
Internal CRUD for the customers staff dispatch ice to. Dispatch movements require a client.
- id (uuid, PK)
- company_name (text)
- contact_name (text, nullable)
- email (text, nullable)
- phone (text, nullable)
- rep_id (uuid, FK → profiles on delete set null, nullable) — assigned sales rep (admin-managed)
- is_active (bool, default true)
- created_at (timestamp)

### orders (Phase 2 — do not build yet, table not yet created)
Planned shape: id, client_id (FK), fulfilled_by (FK → profiles), status (enum: 'pending' | 'confirmed' | 'dispatched' | 'cancelled'), notes, created_at, updated_at.

### order_items (Phase 2 — do not build yet, table not yet created)
Planned shape: id, order_id (FK), product_id (FK), quantity_ordered, quantity_dispatched.

## Auth & roles
- Auth is handled by Supabase. Use @supabase/ssr for server components and middleware.
- All /dashboard routes are protected. Unauthenticated users are redirected to /login.
- Role is stored on the profiles table, not in Supabase metadata.
- **Admin** can: manage products, manage users (including assigning reps to clients and editing commission rates), access settings, view revenue + commission reports.
- **Staff** can: record stock movements (production / dispatch / adjustment), view dashboard, view reports (without revenue/commission). Cannot see pricing.
- **Rep** can: view what staff sees (read-only) and a per-rep "My commission" card on their dashboard summarising bags dispatched to their assigned clients × `commission_per_unit`. Cannot record movements (blocked at the action layer in `createMovement`). Cannot see pricing. Cannot manage anything.
- Hide admin-only UI elements based on role — do not just rely on route protection.

## Row Level Security
- All tables have RLS enabled.
- Authenticated users can SELECT all rows on all tables.
- Only admins can INSERT/UPDATE/DELETE on products and profiles.
- Any authenticated user can INSERT into stock_movements.
- stock_levels is updated only via the trigger — no direct user writes.

## Naming conventions
- Database: snake_case for all table and column names.
- TypeScript: camelCase for variables and functions, PascalCase for components and types.
- Files: kebab-case for filenames (e.g. stock-movements.tsx).
- Server actions are co-located with their feature route as `actions.ts` (e.g. `app/dashboard/products/actions.ts`) and named verb-noun (e.g. createProduct, recordMovement).
- Wrap server actions with `protectedAction` / `adminAction` from `lib/auth-helpers.ts` to enforce auth and role checks consistently. Use the `validate` helper for zod input parsing.

## UI conventions
- Use shadcn/ui components throughout. Do not use other component libraries.
- Coloured badges for movement types: green = production, blue = dispatch, amber = adjustment.
- Amber highlight on stock rows where quantity < low_stock_threshold.
- Red highlight / badge where quantity = 0.
- Toast notifications (shadcn toast) for all form submissions.
- All data tables should support basic sorting where useful.
- The app must be mobile-responsive — the sidebar collapses to a hamburger on small screens.
- Format ZAR values with `formatZAR(value)` from `lib/utils.ts` — never hardcode "R" prefixes or decimal formatting.

## Pricing & commission visibility
Pricing (`products.unit_price`) and commission data (`profiles.commission_per_unit`, the Commission summary card, the Rep + Commission CSV columns) are **admin-only**. Staff and reps must not see them. Defense in depth:
- **Page/server level:** queries that may surface to staff or reps must use an explicit column allowlist that excludes `unit_price` (e.g. the products page branches on role). Never `.select('*')` on `products` for non-admins.
- **Server actions:** when an action's output exposes pricing or commission, branch the query and CSV columns on `isAdmin` (see `exportMovementsCSV`, `exportStockLevelsCSV` for the pattern).
- **UI:** conditionally render price/revenue/commission columns and cards based on the user's role. The products page, reports page, and CSV exports all already follow this.
- The rep's own commission *is* visible to them on their dashboard, but only as a single "My commission" card filtered to their own clients (`clients.rep_id = auth.uid()`). Reps cannot see other reps' or admins' commission data.
- The DB layer does **not** currently column-restrict `unit_price` or `commission_per_unit` — enforcement is application-side. If data is ever exposed beyond trusted internal users, harden with views or column-level GRANTs (tracked in `TODO.md`).

## Phase 2 (do not build — for context only)
Phase 2 adds a client-facing order portal. Clients register and log in separately,
place orders, and track order status. Stock deducts automatically on dispatch.
The orders and order_items tables are not yet created — they'll be added in
Phase 2 itself. (The clients table is already in active use by the internal
dispatch workflow.)

## What NOT to do
- Do not use the Pages Router — App Router only.
- Do not use any UI library other than shadcn/ui.
- Do not write raw SQL in components — use Supabase client methods or server actions.
- Do not store sensitive logic client-side — use server actions for all DB writes.
- Do not build Phase 2 features unless explicitly asked.
- Do not make schema changes via the Supabase dashboard SQL Editor. Every schema change goes through `supabase migration new` → SQL in the file → `supabase db push`. The dashboard is fine for reading and ad-hoc queries; never for `CREATE`/`ALTER`/`DROP` against `public`.
- Do not select `unit_price` (or any future price-bearing field) in queries that flow to staff users.