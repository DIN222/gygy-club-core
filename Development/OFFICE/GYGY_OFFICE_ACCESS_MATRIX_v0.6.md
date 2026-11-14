# GY-GY Club — OFFICE Access Matrix v0.6

**Document ID:** `GYGY_OFFICE_ACCESS_MATRIX_v0.6.md`  
**Status:** AGREED CONTENT — awaiting file formatting / implementation mapping  
**Document type:** Target access-control architecture specification  
**Repository:** `DIN222/gygy-club-core`  
**Working area:** `Development/OFFICE/`

---

## 1. Purpose and status

This document records the agreed target access model for GY-GY Club OFFICE. It defines the seven access categories, the principles for granting permissions, separation of duties, data scopes, audit requirements, and technical enforcement requirements.

**This is an architecture specification, not an implementation or migration.** It does not mean that the described permissions are already enforced by the current application or Supabase configuration.

The agreed content and access categories are not to be silently redefined during technical mapping. Any proposed change to an agreed rule must be raised separately and approved before it is incorporated.

The next stage is to map this target model to actual OFFICE pages, user scenarios, operations, database objects, server enforcement points, and audit events using `OFFICE_ACCESS_AUDIT_PAGE_OPERATIONS_v0.5.md` and the read-only database comparison `OFFICE_ACCESS_AUDIT_DB_COMPARISON_v0.3.md`.

No Supabase, production application, storage, or deployment changes are authorized by this document.

## 2. Governing principles

1. **Authentication is not authorization.** A successful login confirms an authenticated session; it does not automatically grant access to OFFICE sections or operations.
2. **Default deny.** An operation is denied unless an explicit, active permission grants it.
3. **Role and permission are separate.** A category describes a person's position or relationship to the club. Permissions define the exact actions the person may perform.
4. **Least privilege.** Each person receives only the permissions and data scope needed for their assigned work.
5. **Scope is mandatory.** Access is limited by functional area, operation, relevant records, and Launch Complex where applicable.
6. **Finance is a separate security domain.** A department title, technical responsibility, or general OFFICE access does not automatically confer financial access.
7. **Separation of duties.** Creating, editing, approving, closing, deleting, and exporting are distinct operations where applicable. A person must not approve their own action where separation is required.
8. **Human-controlled governance.** AI may observe, analyze, forecast, and recommend. It must not acquire uncontrolled authority to change live club operations, access rights, or financial records.
9. **Public club functions remain available.** A public feature must not be disabled merely because it uses data also used by OFFICE. Public actions must instead use narrow, validated public interfaces.
10. **Auditability.** Sensitive operations and changes to access rights must leave an attributable audit record.
11. **Multi-complex architecture.** OFFICE must support the current and future Launch Complexes. Access to one complex does not automatically grant access to another.
12. **No implied privilege.** A page being visible, a button being present, or a user having a valid session is not proof of permission.

## 3. Seven agreed access categories

The following seven categories are the agreed category set for this version. They replace neither the need for individual permission grants nor the need to define data scope.

### 3.1. Club Creator

The Club Creator is the highest authority in the club's access-governance model.

- Holds the highest level of authority over the club's access model.
- Appoints and removes privileged administrators and delegates authority within explicitly defined limits.
- Can grant, change, and revoke permissions and scopes.
- Retains access to the club-wide financial picture and the Launch Complexes in accordance with the agreed governance model.
- Access-right changes and sensitive actions remain auditable.
- The Creator's authority does not remove the requirement for traceability or safe server-side enforcement.

### 3.2. Chief Accountant

The Chief Accountant is the principal responsible category for the club's accounting and financial control.

- Has access to the overall financial picture across departments and Launch Complexes, within the agreed financial remit.
- Performs accounting operations only through explicitly authorized finance permissions.
- Financial viewing, entry, correction, approval, period closing, and export are separate capabilities.
- Does not acquire technical-administration rights merely by holding the accounting position.
- Financial operations and consequential approvals must be recorded in the audit trail.
- Access to non-financial operational areas is not implied by the accounting role.

### 3.3. Department Leads

Department Leads are responsible for their assigned functional areas.

- Access is limited to the department or area assigned to the person.
- They may manage assigned work and operational tasks within the permissions and scope granted to them.
- They do not automatically receive access to other departments, all Launch Complexes, or the club-wide financial summary.
- A department lead does not receive general finance permissions by virtue of their title.
- Any financial information needed for a specific task must be granted separately and narrowly.
- They cannot grant themselves permissions or extend their own scope.

### 3.4. Ordinary Employees

Ordinary employees perform assigned tasks.

- Access is limited to the operations and records needed for their assigned duties.
- A task assignment does not imply access to the entire page, table, department, or Launch Complex.
- They do not receive general financial access.
- They cannot change roles, grant permissions, approve their own actions where approval separation applies, or expand their own scope.
- Access may be time-limited or withdrawn when the assignment ends.

### 3.5. External Contractors and Temporary Performers

External contractors and temporary performers receive narrowly scoped access only when necessary for a defined task.

- Access is limited to the specific task, area, records, and validity period.
- They do not receive general OFFICE access or automatic access to internal financial information.
- They do not receive staff-management or access-management powers.
- Access must be revoked when the task or engagement ends.
- Sensitive information must be disclosed only to the extent strictly required for the assigned work.
- Their actions must be attributable and auditable.

### 3.6. Technical Administrators

Technical Administrators maintain the technical operation of the platform within delegated technical authority.

- Technical responsibility does not automatically grant access to business, personnel, or financial information.
- They may perform only the technical operations explicitly delegated to them.
- They do not automatically receive `finance.view`, financial editing, approval, period-closing, or export permissions.
- They cannot use technical access as a route to bypass business authorization.
- Changes to permissions, policies, functions, storage rules, and production configuration must be attributable and auditable.
- Any exceptional access to sensitive data must be separately authorized, scoped, justified, and logged.

### 3.7. External Auditors

External Auditors receive controlled access for an assigned audit purpose.

- Access is limited to the records, periods, areas, and audit trails explicitly assigned.
- Auditor status does not itself grant unrestricted access to all club data.
- Audit access is read-only unless a separate, explicit authorization defines another narrowly scoped action.
- An auditor does not receive operational powers to edit, delete, approve, or administer the records being audited.
- An auditor may send a protected message directly to the Club Creator about suspected abuse, concealment or falsification, financial or other violations, threats to safety, pressure, or interference.
- The auditor must be able to record relevant facts and evidence.
- The auditor is not required to notify in advance the manager or person whose actions are being examined.
- The existence of the auditor role does not create automatic expanded investigative access; additional access for an investigation requires a separate instruction from the Club Creator.
- A protected report must not be deleted, blocked, or suppressed by the manager or person being audited.

## 4. Permission vocabulary

Permissions must identify the exact action. The following vocabulary is used to construct permission keys.

| Action | Meaning |
|---|---|
| `view` | Read permitted records or information |
| `create` | Create a record |
| `edit` | Modify an existing record |
| `delete` | Delete a record; exceptional and separately controlled |
| `publish` | Publish or expose content to club participants |
| `moderate` | Approve, reject, hide, or otherwise moderate participant content |
| `execute` | Execute a business or operational action |
| `approve` | Approve a consequential action or record |
| `export` | Export or download permitted data |
| `manage_access` | Assign or revoke roles and permissions within delegated scope |

Permission keys should be namespaced by functional area, for example:

- `warehouse.view`
- `warehouse.receive`
- `warehouse.adjust`
- `reviews.moderate`
- `finance.view`
- `finance.enter_income`
- `finance.approve`

A role name alone must never be treated as a permission key.

## 5. Scope model

Every permission grant must carry the narrowest scope that makes the assigned task possible.

| Scope field | Purpose |
|---|---|
| `area` | Functional area, for example `warehouse`, `production`, `suppliers`, `finance` |
| `launch_complex` | One or more Launch Complex identifiers where relevant |
| `record_scope` | All records in the assigned area, assigned records, or a defined record set |
| `action` | Exact permission from the permission vocabulary |
| `validity` | Active/inactive status and, where appropriate, start and end dates |
| `granted_by` | Club Creator or authorized delegator |
| `reason` | Required explanation for sensitive grants and changes |

A person may hold multiple grants. A grant for one area or Launch Complex must not silently imply access to another.

## 6. Finance as an independent security domain

Finance permissions are independent from department, staff, contractor, and technical categories. A department lead or technical administrator does not acquire finance access automatically.

| Permission | Meaning |
|---|---|
| `finance.view` | View financial records and reports |
| `finance.enter_income` | Enter income |
| `finance.enter_expense` | Enter expenses |
| `finance.edit` | Correct financial entries under controlled rules |
| `finance.approve` | Approve transactions |
| `finance.close_period` | Close an accounting period |
| `finance.export` | Export financial reports |

Viewing, entering, editing, approving, closing, and exporting are distinct permissions. Approval should be separated from creation where practical. The Club Creator may explicitly grant financial access within the governance model; no department title or technical role grants it automatically.

### 6.1. Agreed visibility boundaries

- The Club Creator has access to the club's overall income and the Launch Complexes.
- The Chief Accountant sees the overall financial picture across departments and Launch Complexes.
- Department Leads do not receive automatic access to consolidated club-wide revenue.
- Ordinary Employees, External Contractors and Temporary Performers, and Technical Administrators do not receive general financial access by virtue of their category.
- External Auditors receive only the financial records and periods explicitly assigned for their audit.

### 6.2. Financial data separation

Public order submission must not give a visitor direct access to the accounting ledger. Public order intake and internal financial posting are separate operations.

Warehouse and production users must receive only the order and operational fields necessary for fulfillment. Access to an order does not imply access to its full accounting record, costs, margins, or unrelated customer information.

## 7. Privilege governance and separation of duties

- Only the Club Creator may appoint or remove privileged administrators unless the Creator explicitly delegates a narrowly scoped authority.
- A delegator cannot grant a permission they do not possess.
- A delegator cannot grant access beyond their own scope.
- No self-grant, self-approval, or self-elevation.
- Changes to role, permission, scope, status, or delegation must be written to an append-only audit trail.
- Revocation must take effect server-side; hiding a page or button is not sufficient.
- Emergency access, if introduced, must be explicitly designed, time-limited, logged, and reviewed.
- Approval and execution must be separated where the nature of the operation requires independent control.
- A manager must not be able to suppress or delete a protected auditor report concerning that manager.

## 8. GY-GY Passport and OFFICE identity boundary

- Supabase Auth is initially the authentication mechanism for OFFICE employees.
- Guests and ordinary club participants continue to use GY-GY Passport and must not be forced into OFFICE authentication.
- A Passport ID is not proof of a person's real-world identity and is not an OFFICE staff credential.
- Public participant actions—orders, likes, reviews, forum posts, De-Stress submissions, and similar interactions—must use dedicated public interfaces with validation and abuse controls.
- Public interfaces must not expose direct access to internal OFFICE or finance tables.
- A successful Supabase Auth session is not sufficient evidence that a person is an authorized OFFICE employee.

## 9. Access classification and baseline by category

The following table expresses category boundaries. It is not a blanket grant table: each effective permission still requires an explicit grant and scope.

| Functional area | Club Creator | Chief Accountant | Department Leads | Ordinary Employees | External Contractors / Temporary Performers | Technical Administrators | External Auditors |
|---|---|---|---|---|---|---|---|
| Club-wide governance | Highest authority | No automatic grant | No automatic grant | No | No | No automatic grant | Assigned audit scope only |
| Finance | Club-wide authority under governance | Principal financial remit | No automatic grant; narrow separate grant only if required | No automatic grant | No automatic grant | No automatic grant | Assigned read-only audit scope |
| Assigned department operations | As required | No automatic grant | Assigned area only | Assigned tasks only | Defined task only | Technical scope only | Read-only audit scope if assigned |
| Other departments | As required | Financial remit only | No automatic grant | No | No | No automatic grant | Assigned audit scope only |
| Launch Complex administration | Club-wide authority | No automatic grant | Assigned complex/area only if granted | No automatic grant | No automatic grant | Technical administration only if delegated | Read-only audit scope if assigned |
| Staff and access administration | Highest authority; may delegate | No automatic grant | No automatic grant unless explicitly delegated | No | No | No automatic grant | No |
| Content moderation | As authorized | No automatic grant | Assigned queue/area if granted | Only if explicitly assigned | No automatic grant | No automatic grant | Read-only evidence access if assigned |
| Technical configuration | As authorized | No automatic grant | No automatic grant | No | No | Delegated technical scope | No |
| Audit logs | Club-wide governance access | Relevant finance audit scope | Own area where granted | Own relevant actions where appropriate | Own relevant actions where appropriate | Technical audit scope; no blanket business-data access | Assigned audit logs and evidence |

`No automatic grant` means that the category itself does not confer the permission. It does not prevent a separate, explicit, scoped grant where the governance model permits one.

## 10. Public club operations — separate from OFFICE privileges

The following capabilities are public participant functions, not OFFICE employee privileges. They must remain functional through narrow, purpose-built interfaces.

| Public capability | Allowed public action | Must not allow |
|---|---|---|
| Submit alien/space request | Submit a new request | Read all requests, alter status, delete requests |
| Submit De-Stress phrase or situation | Create a pending submission | Approve, edit other submissions, delete approved content |
| Read approved De-Stress content | Read approved rows only | Read pending submissions or internal moderation notes |
| Submit forum post | Create own post under defined rules | Moderate or delete other people's posts |
| Submit review | Create a review | Hide, approve, or delete reviews |
| Like a print | Add an eligible like under anti-abuse rules | Change arbitrary counts or impersonate another Passport |
| View public catalogue | Read published products, prints, and store items | Read staff notes, supplier costs, unpublished records |
| Submit Atelier/store order | Create a validated order-intake record | Insert directly into the financial ledger or directly adjust stock |
| Record gallery/De-Stress event | Call an allowlisted event recorder | Arbitrary writes or unrestricted counter increments |
| Request/claim Moon delivery | Perform the narrow allowed delivery action | Change arbitrary module state or bypass quotas |

Public submission and staff moderation are separate capabilities. Public read access must expose only published/approved fields.

## 11. OFFICE page and operation mapping — baseline from audit v0.5

This section maps the agreed access model to the repository inventory. It is a mapping baseline, not proof that permissions are implemented.

| Page / module | Observed operation in audit v0.5 | Permission area to map | Required separation / control |
|---|---|---|---|
| `login.html` | Supabase password sign-in | `office.session` | Authentication only; no operational rights implied |
| `office.html` | OFFICE landing, session guard, logout | `office.access` | Landing access must not imply access to every section |
| `complexes-admin.html` | Read/update `launch_complexes` | `complexes.view`, `complexes.configure`, `complexes.open_close` | Opening/closing is consequential and requires a separate grant |
| `alien-admin.html` | Read, process, delete `alien_requests` | `requests.view`, `requests.process`, `requests.delete` | Public submissions remain possible; deletion is separately controlled |
| `destress-admin.html` | Create/read/edit/delete phrases; moderation | `destress.manage`, `destress.publish`, `destress.delete` | Draft creation, moderation, publication, and deletion are distinct |
| `space-admin.html` | Read/update/delete posts | `space.moderate`, `space.delete` | Public participant posting remains separate |
| `reviews.html` | Read, hide, delete reviews | `reviews.view`, `reviews.moderate`, `reviews.delete` | Hiding and deleting are distinct |
| `prints-admin.html` | Manage prints and gallery events | `catalog.prints.view`, `catalog.prints.manage`, `catalog.publish` | Public published reads separated from staff management |
| `embroidery-products.html` | Manage embroidery products and upload images | `catalog.embroidery.manage`, `catalog.publish`, `media.upload` | Storage rules must match record permissions |
| `product-photos.html` | Read supplier/order context; upload/manage photos | `media.view`, `media.upload`, `media.replace`, `media.delete` | Supplier/order reads require their own scope |
| `production.html` | Manage norms/batches and stock movements | `production.view`, `production.create_batch`, `production.execute`, `production.close_batch`, `warehouse.view` | Separate production, warehouse, and cost/finance access |
| `production-pricing.html` | Read/update pricing configuration | `pricing.view`, `pricing.edit`, `pricing.approve` | Price editing and approval should be separated where practical |
| `warehouse.html` | Read/update stock, add movements, read Atelier order data | `warehouse.view`, `warehouse.receive`, `warehouse.adjust`, `warehouse.issue` | Do not expose unrelated finance fields through order lookup |
| `suppliers.html` | Manage suppliers/orders; receive supplier order | `suppliers.view`, `suppliers.manage`, `procurement.create_order`, `procurement.edit_order`, `procurement.cancel_order`, `procurement.receive` | Receiving affects stock and expenses; require explicit authorization |
| `store-admin.html` | Manage store items and upload images | `store.catalog.view`, `store.catalog.manage`, `store.catalog.publish`, `media.upload` | Public catalogue must not expose internal `staff_note` |
| `moon-admin.html` | Manage Moon modules and delivery records | `moon.view`, `moon.manage_modules`, `moon.confirm_delivery` | Verify exact operation and data scope |
| `translations-admin.html` | Read/edit translation cache and reviewed status | `translations.view`, `translations.edit`, `translations.review` | Translation editing does not automatically imply publication rights |
| `accounting.html` | Accounting dashboard/workflow | `finance.view` plus explicitly assigned transaction rights | Inspect full page and linked modules before assigning grants |
| `expense.html`, `expense-ledger.html` | Read expenses; create expense records; read/manage supplier and delivery data | `finance.view`, `finance.enter_expense`, `finance.edit`; procurement permissions separately | Supplier operations and expense amounts are separate scopes |
| `income.html`, `income-atelier.html`, `income-product.html`, `income-store.html`, `income-ledger.html` | Income records, pricing/configuration, and related workflows | `finance.view`, `finance.enter_income`, `finance.edit`; pricing permissions separately | Split public order intake from the internal ledger |
| `revenue.html` | Aggregate/report reads from `income_entries` | `finance.view`, optionally `finance.export` | Audit v0.5 found no `requireAuth()`; critical exposure until verified |
| `payment-terminal.html`, `modules/paymentTerminal.js` | Payment-related demonstration UI | Payment permissions only if a real provider flow is later implemented | Current module is a demo, not a real payment gateway |
| `gallery.html` | Read prints, embroidery, and photos | Public read for published catalogue; staff catalog permissions for internal actions | Public gallery must not inherit staff access |
| `atelier.html` | Public catalogue/order flow; current direct stock and ledger operations | Public: `catalog.public_view`, `orders.submit`, `metrics.record`; staff/server: `warehouse.issue`, finance operations | Separate public order intake from stock and finance writes |
| `store.html` | Public catalogue read; current direct insert into `income_entries` | Public: `store.public_view`, `orders.submit` | Public endpoint must create an order-intake record, not a ledger row |
| `book.html`, `destress-studio.html` | Public approved reads, submissions, counters | Public: `destress.read_approved`, `destress.submit`, `metrics.record` | Pending submission and moderation remain separate |
| `space-construction.html` | Public reads of approved posts/phrases | Public approved-content read | Do not expose pending or moderation fields |
| `atelier-space.js` | Read Moon module status; create visitor request | Public limited availability read, `requests.submit` | Fail-open UX behavior must not be used as a security control |
| `core/clubBase.js` | Like lookup/create/update | Public `likes.check_own`, `likes.add` | Enforce uniqueness and abuse controls server-side; Passport ID alone is not proof of real identity |
| `core/complexes.js` | Read `launch_complexes` | Public safe status/availability read | Do not expose private admin configuration |
| `core/pricing.js` | Read pricing and storefront configuration | Public safe pricing read | Do not expose internal costs or margins |
| `modules/moonData.js` | Read modules/deliveries; call delivery RPC | Narrow public delivery capability where intended | Validate eligibility, quotas, identity, and concurrency |
| `modules/expenseJournal.js`, `modules/incomeJournal.js` | Read financial journal data | `finance.*` | Protect at page, data, and server-operation layers |
| `modules/reviewBox.js` | Public review submission/read workflow | Public `reviews.submit`; staff `reviews.moderate` | Submission and moderation separated |
| `modules/spaceForum.js` | Public forum submission/read workflow | Public `space.submit`; staff `space.moderate` | Participant posts separated from staff status changes |

## 12. Cross-area data dependencies

| Shared data | Consumers | Required separation |
|---|---|---|
| `income_entries` | Finance, Atelier, Store, Warehouse | Separate public order intake from the internal ledger; warehouse receives only fulfillment fields |
| `warehouse_stock`, `warehouse_movements` | Warehouse, Production, Atelier | Public order pages cannot directly mutate stock; each mutation is server-validated and authorized |
| `suppliers`, supplier orders | Procurement, Warehouse, Product Photos, Finance | Supplier contact access, procurement, stock receipt, and expense access are distinct |
| `club_prints`, `embroidery_products`, `product_photos` | Public gallery, Atelier, catalog staff | Public reads only published safe fields; staff writes and storage actions require separate grants |
| `launch_complexes` | Public navigation, OFFICE administration | Public reads only safe status/availability; configuration is restricted |
| `space_posts`, `reviews`, De-Stress tables | Public participants and moderators | Public submission/read-approved paths are separate from moderation |
| `pricing_params`, `storefront_config` | Public display, Atelier, Pricing, Finance | Public may read only presentation values, not margins, costs, or internal settings |

## 13. Technical enforcement requirements

### 13.1. Authentication and authorization

- Supabase Auth initially authenticates OFFICE employees; GY-GY Passport remains the participant identity mechanism.
- A valid session is not an OFFICE permission.
- Client-side `requireAuth()` may be used for navigation and user experience, but it is not the security boundary.
- Every protected operation must be authorized server-side using active staff membership, explicit permission, and scope.
- Authorization must be checked at the data/API boundary, not only by hiding pages or buttons.
- Revocation must take effect server-side.

### 13.2. Permission and scope records

The implementation must support a relationship between user, active staff membership, category/role, explicit permission grants, scope, validity, delegator, and reason.

The effective permission must be the intersection of:
- active staff membership;
- explicit permission grant;
- permitted action;
- assigned functional area;
- assigned record scope;
- relevant Launch Complex;
- validity period;
- separation-of-duty restrictions.

### 13.3. Row Level Security and database policies

- Review every RLS policy's target role, `USING`, and `WITH CHECK`.
- Review all existing policies together. Permissive policies combine with OR; adding a narrow permissive policy does not cancel a broad existing `true` policy.
- Do not treat `auth.role() = 'authenticated'` as proof of OFFICE membership or a named permission.
- Review views, column-level grants, sequences, functions, triggers, and Data API exposure.
- RLS must enforce the same business boundary as the application server.
- Public catalogue projections must omit staff notes, supplier contacts, internal costs, and private order fields.

### 13.4. RPC, Edge Functions, and privileged functions

- Publicly callable functions must be deliberately classified as public capabilities, validate all inputs, enforce quotas/anti-abuse controls, and perform only the narrow intended action.
- Internal helper functions and trigger handlers must not be directly executable by browser roles unless there is an explicit, justified need.
- `SECURITY DEFINER` functions require careful ownership, safe `search_path`, schema qualification, and restricted EXECUTE grants.
- Consequential operations such as receiving supplier orders, adjusting stock, creating ledger entries, approving transactions, and closing periods require explicit server-side permission checks.
- Generic authentication is not an authorization check.

### 13.5. Storage

- Storage bucket policies must be reviewed separately from table RLS.
- Public read may remain for published media where intended.
- Upload, replacement, and deletion must have separate grants where appropriate.
- Validate purpose, path, file type, size, ownership, and moderation status.
- Storage permissions must align with the associated catalog or operational record permissions.

### 13.6. Audit trail

The system must retain attributable records for:
- creation, change, revocation, and expiry of role/permission grants;
- changes to scope and delegation;
- sensitive reads where required by policy;
- creation, modification, deletion, approval, rejection, publication, and export of sensitive records;
- financial operations and period closing;
- consequential stock, procurement, and production operations;
- technical changes to authorization rules, policies, functions, and storage access;
- protected auditor reports and their handling.

Audit records must identify the actor, timestamp, action, affected object, scope, result, and relevant before/after information where appropriate. Access to audit records must itself be controlled. Protected auditor reports must not be alterable or suppressible by the person being reported.

## 14. Critical findings carried forward from audits v0.5 and v0.3

These are findings to address during implementation planning; this document does not change the live system.

1. `requireAuth()` checks for a session; it does not verify role, permission, or scope.
2. `revenue.html` was observed without `requireAuth()` while reading `income_entries`.
3. `store.html` directly inserts into `income_entries`; public order intake must be separated from ledger posting.
4. `atelier.html` combines public order intake with direct stock and financial operations.
5. `receive_supplier_order(uuid)` was found executable by authenticated users without an explicit OFFICE permission check in the inspected function body.
6. `atelier-space.js` contains fail-open behavior; it must not be treated as a security decision.
7. `modules/paymentTerminal.js` is a local demonstration; it does not accept real cards or move money.
8. Public review, forum, De-Stress, request, like, catalogue, and order functions require narrow public interfaces, not broad access to shared tables.
9. Public policies were found on financial, stock, supplier, production, catalog, and other internal data objects in the read-only database comparison.
10. Public SELECT of a table containing internal columns (for example `store_items.staff_note`) can expose those columns; RLS does not hide individual columns.
11. Permissive RLS policies combine with OR. Existing broad policies must be reviewed and deliberately replaced/restricted; adding another policy is not sufficient.
12. Storage buckets and callable functions require independent review of policies and grants.

## 15. Implementation mapping format

For each page, scenario, and operation, the next audit stage must record:

| Field | Required content |
|---|---|
| Page / module | Exact repository path |
| User scenario | What the person is trying to do |
| Actor category | One of the seven agreed categories, or public participant |
| Operation | Exact action: view, create, edit, delete, publish, moderate, execute, approve, export, manage access |
| Data object | Table, view, RPC, Storage bucket/object, or external service |
| Permission key | Exact permission required |
| Scope | Area, Launch Complex, record scope, validity |
| Field restrictions | Allowed and prohibited fields |
| Server enforcement | RLS, RPC, Edge Function, trusted backend, or other server-side check |
| Audit event | Event that must be recorded |
| Negative test | What an unauthorized actor must be unable to do |
| Positive test | What the authorized actor must be able to do |

Do not assign permissions solely from a page name. Follow imports and shared modules to the actual data operations.

## 16. Completion criteria

The matrix is ready to move into implementation planning only when:

- All seven agreed access categories are represented without silently changing their agreed boundaries.
- Every page and module has an access classification and responsible area.
- Every direct table operation, RPC, Storage action, and relevant server function is mapped to actor, action, permission, and scope.
- Public capabilities have explicit safe paths that do not expose OFFICE or finance writes.
- Every staff operation maps to an explicit permission and server-side enforcement point.
- RLS policies have been reviewed for target role, `USING`, `WITH CHECK`, and interaction with other permissive policies.
- Views, column grants, RPC grants, triggers, `SECURITY DEFINER` functions, and Storage policies are included.
- Negative tests prove that anonymous visitors, unauthorized staff, other departments, and out-of-scope Launch Complex users cannot perform forbidden actions.
- Positive regression tests prove that authorized staff workflows and public visitor journeys still work.
- Revocation, expiry, delegation, audit logging, and protected auditor reporting have been tested.
- Future Launch Complexes can declare their own modules, data, permissions, public actions, staff operations, and audit requirements before activation.

## 17. Audit baseline and limitations

The page/operation inventory is based on the repository archive `gygy-club-core-main (5).zip`, with files dated 2026-11-12 and commit `5f90c810b889bacb5e9b0902d0062c42671449c0`.

The database comparison was a read-only inspection dated 2026-11-13. It does not prove exploitation and does not constitute a complete dynamic execution trace.

Outstanding verification includes:
- dynamic browser testing of all relevant buttons, forms, and conditional paths;
- complete transitive import tracing for pages without direct Supabase calls;
- review of all views and their `security_invoker` settings;
- column-level grants and Data API exposure;
- all Storage buckets, object paths, and upload callers;
- all functions, triggers, grants, and non-public schemas;
- deployed-version drift between the repository and live site.

Do not treat a filename, UI button, or earlier static scan as proof that an operation is implemented or authorized.

## 18. Change control

- This version records the agreed target model and the audit mapping baseline.
- The seven agreed categories and their boundaries must not be silently replaced by legacy role templates or by a simplified five-role model.
- Any proposed change to an agreed access rule must be presented separately with its reason and consequences.
- This document does not authorize database migrations, policy changes, code deployment, Storage changes, or changes to live user access.
- Implementation requires a separate plan, review, explicit approval, staged tests, and rollback strategy.

---

**Document status:** `AGREED CONTENT — awaiting implementation mapping`  
**Next step:** complete the page → scenario → operation → data → actor → permission → scope → server enforcement → audit-event mapping using the v0.5 audit evidence.
