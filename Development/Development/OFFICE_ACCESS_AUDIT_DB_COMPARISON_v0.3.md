# GY-GY Club — OFFICE access audit: code ↔ Supabase

**Version:** 0.3  
**Date:** 2026-11-13  
**Mode:** read-only inspection; no database, repository, storage, or deployment changes made.  
**Supabase project:** `momzokofmunrbwgtwepi` (`My Project GY-GYclub`)  
**Code baseline:** uploaded archive `gygy-club-core-main (5).zip`.

## 1. Executive result

The live Supabase policies do not yet implement the intended OFFICE role/permission model. Several tables used by OFFICE have permissive policies that allow public/anonymous operations, while other policies treat any authenticated account as an OFFICE employee. These controls are not equivalent to the agreed model of staff-only Supabase Auth plus explicit per-user permissions and data scopes.

**Important interpretation:** in PostgreSQL RLS, a policy whose target role is `public` applies to both `anon` and `authenticated`. Permissive policies are combined with OR. A restrictive policy added later would not cancel an existing permissive `true` policy.

## 2. Confirmed code-to-database comparisons

| Code page / module | Observed operation | Supabase object | Current live policy finding | Assessment |
|---|---|---|---|---|
| `revenue.html`, income ledger pages | Read income records | `income_entries` | `SELECT USING true`; public `INSERT WITH CHECK true`; `UPDATE` checks only `auth.role()='authenticated'` | **Critical**: finance/order ledger is not restricted to Finance permissions. |
| `expense.html`, `expense-ledger.html`, expense journal | Read/write expense records | `expense_entries` | Public `SELECT true` and public `INSERT true` | **Critical**: expenses and cost data are publicly readable/writable at the RLS layer. |
| `warehouse.html`, production modules, Atelier order processing | Read/write stock | `warehouse_stock` | `ALL USING true WITH CHECK true` plus public SELECT | **Critical**: public can modify stock rows directly. |
| `warehouse.html`, production / order consumption | Read/write stock movements | `warehouse_movements` | Public `SELECT true` and `INSERT true` | **High**: operational movement history is public and can be forged. |
| `suppliers.html`, supplier order workflow | Read suppliers | `suppliers` | Public `SELECT true`, public `INSERT true`; UPDATE only checks authenticated | **High**: supplier contact data is publicly readable; anyone can create supplier rows. |
| `suppliers.html` | Read/write purchase orders and line items | `supplier_orders`, `supplier_order_items` | `ALL` policy targets public but predicate is only `auth.role()='authenticated'` | **High**: any authenticated account is treated as authorized procurement staff. |
| `suppliers.html` | Receive supplier order; creates stock/expense effects | `receive_supplier_order(uuid)` | EXECUTE denied to anon, granted to authenticated; function is SECURITY INVOKER and has no explicit OFFICE permission check in inspected body | **High**: any authenticated user who can reach the RPC may attempt receipt; must be restricted by a specific permission and scope. |
| `store.html`, `store-admin.html` | Public catalogue read; staff item management | `store_items` | Public SELECT, public INSERT, public DELETE all have `true` policies | **Critical**: public catalogue requirement is valid, but public create/delete is not. |
| `store-admin.html` | Read catalogue including staff note | `store_items.staff_note` | Table-level public SELECT; column is present in the table | **Critical**: staff-only note is exposed by table SELECT; RLS cannot hide a column. Need safe public view/API or column privileges. |
| `production.html` | Read/write production norms | `production_norms` | Public `ALL true` and public SELECT | **Critical**: public can alter production recipes/norms. |
| `production.html` | Read/create production batches | `production_batches` | Public SELECT true and INSERT true | **High**: cost-bearing production records can be read and new rows inserted publicly. |
| `production-pricing.html`, `core/pricing.js` | Read pricing params; staff edits | `pricing_params` | Public SELECT true; INSERT/UPDATE predicate only authenticated | **Medium/High**: public read may be intentional for price calculation, but write rights need named OFFICE permission, not generic authentication. |
| `atelier.html`, gallery | Public print catalogue and likes; staff print management | `club_prints` | An `ALL USING true WITH CHECK true` policy exists, alongside narrower public-like policies | **Critical**: broad ALL policy overrides the intended distinction; public write/delete is possible at RLS layer. |
| `product-photos.html`, gallery | Product photo metadata | `product_photos` | `ALL` policy target public, predicate only authenticated | **High**: any authenticated account is treated as authorized. |
| `atelier.html` / public store images | Upload/read images | Storage `objects` in `club-prints`, `store-items` | Public INSERT upload policies; public SELECT; authenticated delete for `club-prints` | **High**: public uploads may be intended for some flows but must be constrained by purpose, path, size/type and moderation. Current policies only restrict bucket/extension in upload checks. |

## 3. Function and trigger findings

The following functions are currently executable by `anon` and `authenticated` and use `SECURITY DEFINER`:

- `complex_is_open(text)` — public status helper; likely legitimate as a public read endpoint, but keep its return surface minimal and harden function search path.
- `deliver_modules(text,text,text[])` — public function changes `moon_modules.delivered` and inserts `moon_deliveries`. This is a deliberate guest interaction, but it needs robust abuse/rate-limit and concurrency controls; current per-minute count is global and race-prone.
- `destress_bump(uuid,text)` — public counter update for approved phrases. Allowlisted counter names, but no per-visitor throttling or deduplication was found in the inspected body.
- `track_gallery_event(text,uuid,text)` — public event insertion with allowlisted values; needs abuse controls and event validation.
- `guard_closed_complex()` — trigger function is callable by public roles even though it is intended to run as a trigger. Its body bypasses the closed-complex check whenever `auth.role()='authenticated'`; this is not an OFFICE authorization check.
- `on_atelier_order_insert()` and `on_supplier_order_received()` — trigger functions also have public EXECUTE although they are internal trigger handlers; direct EXECUTE should not be exposed.

Internal helpers `try_consume_order(uuid)` and `fulfill_waiting_orders()` were not executable by anon/authenticated in the inspected grants, which is appropriate. `receive_supplier_order(uuid)` is SECURITY INVOKER and executable by authenticated but lacks a permission-specific authorization check in the inspected function body.

All inspected SECURITY DEFINER functions set `search_path=public`. This is better than an unpinned path but should be reviewed and hardened (for example, trusted schema qualification and a safe path excluding writable schemas) before further privileged functions are added.

## 4. Important policy interactions

- `club_prints`: the policy `Public access to club_prints` is `ALL` with both predicates `true`. Narrower policies for public likes or authenticated staff do not neutralize it because permissive policies combine with OR.
- `store_items`: public INSERT and DELETE policies are explicitly `true`; the public SELECT policy is expected for the catalogue, but write policies are not.
- `warehouse_stock` and `production_norms`: public ALL policies allow direct changes to operational data.
- `income_entries` and `expense_entries`: public SELECT/INSERT policies expose and permit writes to accounting records. A generic authenticated UPDATE policy does not create an OFFICE-only boundary.
- `auth.role()='authenticated'` means a PostgreSQL role check, not a check for a named OFFICE employee, role, permission, or department. It is insufficient for the target authorization model.

## 5. Data exposure confirmed from live columns

- `store_items.staff_note` exists alongside public catalogue fields; public table SELECT can expose it.
- `suppliers` contains `contact`, `contact_person`, `phone`, `messenger`, `notes`, and `website`; public SELECT makes the full row visible under the current policy.
- `warehouse_stock` contains `avg_unit_cost`; public SELECT exposes a cost field in addition to quantities and stock details.
- `production_batches` contains `materials_cost`, `labor_cost`, `overhead_cost`, `total_cost`, and `cost_per_unit`; public SELECT exposes production cost data.
- `expense_entries` contains `unit_price`, `total_price`, `delivery_cost`, and supplier references; public SELECT exposes expense details.
- `income_entries` contains `total_amount`, `cogs_amount`, `payment_amount`, shipping fields, claim notes, and `atelier_order` JSON; public SELECT exposes ledger/order data. The JSON payload should be checked for participant/customer personal data before a safe public projection is designed.

## 6. Intended access direction (not implementation)

1. Keep public catalogue reads only where required, through safe projections that omit staff notes, supplier contacts, internal costs, and private order fields.
2. Keep guest order submission as a narrowly defined public operation. Do not grant guests direct read/update access to the full accounting ledger.
3. Separate public order intake from internal ledger processing. Server-side trusted code should create internal ledger, stock, production, and cost records after validation.
4. Introduce explicit OFFICE authorization records: user ↔ active staff membership ↔ role/permission grants ↔ data scope. Role name alone must not imply finance access.
5. Split finance rights (view, enter, edit, approve, close period, export) and operational rights (procurement, receive goods, warehouse issue/adjust, production batch, catalogue management).
6. Restrict direct EXECUTE on trigger handlers and internal SECURITY DEFINER functions. Keep guest-callable functions only where they are deliberate public club interactions.
7. Review Storage buckets separately; public read can remain for published images, but upload/write paths should be restricted and moderated.
8. Treat future Launch Complex permissions as a manifest of module-specific permissions and scopes, not as a blanket OFFICE role.

## 7. Scope and limitations

- This comparison uses the uploaded code archive `gygy-club-core-main (5).zip` and live Supabase catalog/policy/function metadata queried read-only on 2026-11-13.
- It is not a full line-by-line audit of every HTML event handler or every database object. The page-to-table mapping is confirmed at the source-reference level, but some exact per-page operation semantics still need individual handler review.
- This report does not prove whether any issue has been exploited.
- No policies, grants, functions, triggers, columns, data, storage objects, repository files, or deployments were changed.

## 8. Next audit steps

1. Complete exact per-page CRUD/RPC map, including `payment-terminal.html` and all Launch Complex admin pages.
2. Inspect every view and its `security_invoker` setting, plus column-level grants and Data API exposure.
3. Inspect all Storage buckets, object policies, public/private flags, upload paths, and actual upload callers.
4. Design safe public views/API for catalogues and guest order intake before restricting shared tables.
5. Draft an implementation migration plan with staged tests and rollback; do not execute without explicit approval.
