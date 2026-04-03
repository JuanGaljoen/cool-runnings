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
  /login              # Public auth page
  /dashboard          # Protected — all app pages live here
    /page.tsx         # Main dashboard (stock overview + recent movements)
    /stock            # Record production runs, dispatches, adjustments
    /products         # Product catalogue CRUD
    /reports          # Date-range reports + CSV export
    /settings         # Admin only — user management
    /layout.tsx       # Persistent nav layout for all dashboard pages
/components           # Shared UI components
/lib
  /supabase           # Supabase client (browser + server + middleware)
  /actions            # Server actions
  /helpers            # Utility functions
/types                # TypeScript interfaces and enums
```

## Database tables

### profiles
Extends Supabase auth.users.
- id (uuid, PK)
- auth_user_id (uuid, FK → auth.users)
- full_name (text)
- role (enum: 'admin' | 'staff')
- created_at (timestamp)

### products
- id (uuid, PK)
- name (text) — e.g. "5kg Bag", "10kg Bag", "Block Ice", "Crushed Ice"
- sku (text, unique)
- unit (text) — e.g. "bag", "block"
- low_stock_threshold (int) — alert when stock_levels.quantity falls below this
- is_active (bool)
- created_at (timestamp)

### stock_levels
One row per product. Kept in sync automatically via a Postgres trigger.
- id (uuid, PK)
- product_id (uuid, FK → products)
- quantity (int)
- updated_at (timestamp)

### stock_movements
Full audit log of every stock change.
- id (uuid, PK)
- product_id (uuid, FK → products)
- created_by (uuid, FK → profiles)
- movement_type (enum: 'production' | 'dispatch' | 'adjustment')
- quantity (int) — always positive; direction determined by movement_type
- note (text, nullable)
- created_at (timestamp)

**Trigger:** On every insert to stock_movements, update stock_levels.quantity:
- production → add quantity
- dispatch → subtract quantity
- adjustment → subtract quantity

### clients (Phase 2 — do not build yet, table exists in DB)
- id, company_name, contact_name, email, phone, is_active, created_at

### orders (Phase 2 — do not build yet, table exists in DB)
- id, client_id (FK), fulfilled_by (FK → profiles), status (enum: 'pending' | 'confirmed' | 'dispatched' | 'cancelled'), notes, created_at, updated_at

### order_items (Phase 2 — do not build yet, table exists in DB)
- id, order_id (FK), product_id (FK), quantity_ordered, quantity_dispatched

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
- Server actions live in /lib/actions and are named verb-noun (e.g. createProduct, recordMovement).

## UI conventions
- Use shadcn/ui components throughout. Do not use other component libraries.
- Coloured badges for movement types: green = production, blue = dispatch, amber = adjustment.
- Amber highlight on stock rows where quantity < low_stock_threshold.
- Red highlight / badge where quantity = 0.
- Toast notifications (shadcn toast) for all form submissions.
- All data tables should support basic sorting where useful.
- The app must be mobile-responsive — the sidebar collapses to a hamburger on small screens.

## Phase 2 (do not build — for context only)
Phase 2 adds a client-facing order portal. Clients register and log in separately, 
place orders, and track order status. Stock deducts automatically on dispatch.
The clients, orders, and order_items tables are already in the DB schema so Phase 2 
requires no breaking changes to the data model.

## What NOT to do
- Do not use the Pages Router — App Router only.
- Do not use any UI library other than shadcn/ui.
- Do not write raw SQL in components — use Supabase client methods or server actions.
- Do not store sensitive logic client-side — use server actions for all DB writes.
- Do not build Phase 2 features unless explicitly asked.