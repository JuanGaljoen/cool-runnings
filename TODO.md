# Project TODOs

Running list of follow-ups, deferred fixes, and ideas. Add new items at the
top of the relevant section. Strike or remove items when shipped.

## Security follow-ups

- **Tighten RLS so reps can only read their own data via the REST API.**
  Currently rep restrictions are app-layer only (page filters + UI gates).
  A rep with their JWT could call the Supabase REST API directly and read
  other reps' clients/movements. Acceptable for an internal trusted team
  but should be locked down before any external-facing rollout. Approach:
  add row-level policies on `clients` and `stock_movements` that check
  `(role='rep' AND rep_id = auth.uid()) OR is_admin() OR is_staff()`.

- **Host header injection in invite + password reset emails** (HIGH #4 from
  security review). `app/login/actions.ts:33-35` and
  `app/dashboard/settings/actions.ts:16-19` build email redirect URLs from
  the request's Host header. Switch to `process.env.NEXT_PUBLIC_SITE_URL`.

- **Wrong wrapper on admin-only actions** (HIGH #5). `products/actions.ts`
  and `clients/actions.ts` use `protectedAction` for create/update/archive,
  but per CLAUDE.md these are admin-only. RLS catches it at the DB layer
  (defense-in-depth gap). Swap to `adminAction`.

- **Last-admin deletion not prevented** (HIGH #6). `deleteUser` blocks
  self-deletion but doesn't prevent deleting the only remaining admin.
  Count admins before allowing deletion.

- **CSV formula injection** (MEDIUM #8). Cells starting with `=`, `+`, `-`,
  or `@` execute as formulas in Excel. Currently low risk (admin-managed
  product/client names) but `note` and free-text fields come from staff.
  Mitigation: prefix any cell starting with those chars with a single quote.

- **Login form input not validated** (MEDIUM #7). `app/login/actions.ts`
  casts `formData.get('email')` to string without checking. Supabase
  rejects invalid input cleanly, so impact is minor — still worth a
  zod parse for consistency.

## Code quality

- **Pre-existing lint errors in `app/dashboard/stock/history/page.tsx`** —
  unused `fromStr` and `toStr` variables. Either use them or remove them.
  These pre-date the pricing/rep work; visible in `npm run lint`.

## Future product features

- **Rep self-service** — reps can edit their own profile (name/email/phone).
  Currently disabled by design; revisit when reps actively use the portal.

- **Per-product commission rates** — instead of a flat
  `commission_per_unit` on the rep, store rates per (rep, product) pair.
  Useful if Block Ice ever ships at different margins than bagged ice.

- **Multi-rep per client** — if a client is shared between reps, switch
  `clients.rep_id` to a junction table (`client_reps`).

- **Snapshot price/commission at time of sale** — currently revenue and
  commission are computed against *current* product price and rep rate.
  If rates change, history retroactively changes. For accounting integrity,
  snapshot `unit_price_at_sale` and `commission_per_unit_at_sale` onto
  each `stock_movements` row.

- **Phase 2 — Client ordering portal** (already planned).

- **Phase 3 — Driver route management** (already planned).

## DevEx

- **CI on PRs** — `next lint && tsc --noEmit && next build`. Currently the
  PostToolUse hook protects local edits, but pushed commits hit `main`
  unchecked.

- **Upgrade Supabase to Pro before production launch** — free tier
  auto-pauses after 7 days. The GitHub Actions keep-alive workflow holds
  things up for now; switch to Pro when a real client starts using it.
