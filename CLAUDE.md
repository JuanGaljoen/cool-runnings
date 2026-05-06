# Project Context — Ice Inventory Management System

## What this is
A web-based inventory management system for an ice manufacturing company.
One factory, one location. A small internal team (3–10 staff) manage stock day-to-day.
Built and hosted by the developer on behalf of the client.

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
- role (enum: 'admin' | 'staff', default 'staff')
- created_at (timestamp)
- updated_at (timestamp)

**Trigger:** `prevent_role_self_escalation` blocks any role change unless the caller is an admin (or service role). Required because RLS allows users to update their own profile but is row-level, not column-level.

### products
- id (uuid, PK)
- name (text) — e.g. "5kg Bag", "10kg Bag", "Block Ice", "Crushed Ice"
- sku (text, unique)
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
- id, company_name, contact_name, email, phone, is_active, created_at

### orders (Phase 2 — do not build yet, table not yet created)
Planned shape: id, client_id (FK), fulfilled_by (FK → profiles), status (enum: 'pending' | 'confirmed' | 'dispatched' | 'cancelled'), notes, created_at, updated_at.

### order_items (Phase 2 — do not build yet, table not yet created)
Planned shape: id, order_id (FK), product_id (FK), quantity_ordered, quantity_dispatched.

## Auth & roles
- Auth is handled by Supabase. Use @supabase/ssr for server components and middleware.
- All /dashboard routes are protected. Unauthenticated users are redirected to /login.
- Role is stored on the profiles table, not in Supabase metadata.
- Admin users can: manage products, manage users, access settings.
- Staff users can: record stock movements, view dashboard, view reports.
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

## Pricing visibility
Pricing (`products.unit_price`) is admin-only. Defense in depth:
- **Page/server level:** queries that may surface to staff must use an explicit column allowlist that excludes `unit_price` (e.g. the products page branches on role). Never `.select('*')` on `products` for staff.
- **Server actions:** when an action's output exposes pricing, branch the query and CSV columns on `isAdmin` (see `exportMovementsCSV`, `exportStockLevelsCSV` for the pattern).
- **UI:** conditionally render price columns/cards based on the user's role. The products page, reports page, and CSV exports all already follow this.
- The DB layer does **not** currently column-restrict `unit_price` — enforcement is application-side. If pricing is ever exposed beyond trusted internal staff, harden with a `products_public` view or a column-level GRANT.

## Phase 2 (do not build — for context only)
Phase 2 adds a client-facing order portal. Clients register and log in separately,
place orders, and track order status. Stock deducts automatically on dispatch.
The orders and order_items tables are already in the DB schema so Phase 2
requires no breaking changes to the data model. (The clients table is already
in active use by the internal dispatch workflow.)

## What NOT to do
- Do not use the Pages Router — App Router only.
- Do not use any UI library other than shadcn/ui.
- Do not write raw SQL in components — use Supabase client methods or server actions.
- Do not store sensitive logic client-side — use server actions for all DB writes.
- Do not build Phase 2 features unless explicitly asked.
- Do not make schema changes via the Supabase dashboard SQL Editor. Every schema change goes through `supabase migration new` → SQL in the file → `supabase db push`. The dashboard is fine for reading and ad-hoc queries; never for `CREATE`/`ALTER`/`DROP` against `public`.
- Do not select `unit_price` (or any future price-bearing field) in queries that flow to staff users.