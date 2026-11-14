# GY-GY Club --- OFFICE Access Matrix

**Status:** Working matrix for cross-check; not yet an implementation
specification.\
**Evidence baseline:** Repository ZIP `gygy-club-core-main (5).zip`,
plus the read-only Supabase review described in the project
conversation.\
**Caution:** This matrix records operations observed in the code and the
proposed permission needed to authorize them. It does not certify that
the database currently enforces these permissions.

## 1. Access notation

-   `V` = view/read
-   `C` = create/insert
-   `E` = edit/update
-   `D` = delete
-   `P` = publish
-   `M` = moderate
-   `X` = execute operational action
-   `A` = approve
-   `EX` = export
-   `—` = no routine grant
-   `*` = only if explicitly assigned and scoped

All permissions are default-deny. A role name alone does not confer the
actions below.

## 2. Existing OFFICE page and operation inventory

  ---------------------------------------------------------------------------------------------------------------------
  Page / area                    Observed data or operation in  Proposed permission namespace  Notes
                                 repository                                                    
  ------------------------------ ------------------------------ ------------------------------ ------------------------
  `login.html`                   Supabase password sign-in      `office.session`               Authentication only; no
                                                                                               operational rights
                                                                                               implied

  `office.html`                  OFFICE landing, session guard, `office.access`                Landing page access must
                                 logout                                                        not imply access to
                                                                                               every section

  `complexes-admin.html`         `launch_complexes`: SELECT,    `complexes.view`,              Opening/closing is
                                 UPDATE status/opening time     `complexes.configure`,         consequential; separate
                                                                `complexes.open_close`         grant

  `alien-admin.html`             `alien_requests`: SELECT,      `requests.view`,               Public submissions must
                                 UPDATE status/note, DELETE     `requests.process`,            remain possible
                                                                `requests.delete`              

  `destress-admin.html`          `destress_phrases`: INSERT,    `destress.manage`,             Distinguish draft
                                 SELECT, UPDATE, DELETE         `destress.publish`,            creation from
                                                                `destress.delete`              approval/publication

  `space-admin.html`             `space_posts`: SELECT, UPDATE  `space.moderate`,              Public participant posts
                                 status, DELETE                 `space.delete`                 must remain available

  `reviews.html`                 `reviews`: SELECT, UPDATE      `reviews.view`,                Hiding and deleting are
                                 hidden flag, DELETE            `reviews.moderate`,            distinct
                                                                `reviews.delete`               

  `prints-admin.html`            `club_prints`,                 `catalog.prints.view`,         Confirm exact write
                                 `gallery_events`: read and     `catalog.prints.manage`,       paths and storage rules
                                 catalog/event administration   `catalog.publish`              during implementation

  `embroidery-products.html`     `embroidery_products`:         `catalog.embroidery.manage`,   Storage bucket policies
                                 INSERT/UPDATE; image upload to `catalog.publish`,             must match row
                                 `club-prints` storage          `media.upload`                 permissions

  `product-photos.html`          `product_photos`,              `media.view`, `media.upload`,  Supplier/order reads
                                 `club_prints`,                 `media.replace`,               require their own scope,
                                 `supplier_orders`,             `media.delete`                 not implied by photo
                                 `suppliers`; photo                                            access
                                 upload/association                                            

  `production.html`              `production_batches`,          `production.view`,             Stock movement is a
                                 `production_norms`,            `production.create_batch`,     controlled operation
                                 `warehouse_stock`,             `production.execute`,          
                                 `warehouse_movements`;         `production.close_batch`;      
                                 production and stock           `warehouse.view`               
                                 operations                                                    

  `production-pricing.html`      `pricing_params`,              `pricing.view`,                Price change approval
                                 `storefront_config`,           `pricing.edit`,                should be separate where
                                 `club_prints` reads/price      `pricing.approve`              possible
                                 configuration                                                 

  `warehouse.html`               `warehouse_stock`:             `warehouse.view`,              Reading order details
                                 SELECT/INSERT/UPDATE;          `warehouse.receive`,           must not expose
                                 `warehouse_movements`: INSERT; `warehouse.adjust`,            unrelated finance fields
                                 `income_entries`: read Atelier `warehouse.issue`              
                                 order data                                                    

  `suppliers.html`               `suppliers`:                   `suppliers.view`,              Receiving a supplier
                                 SELECT/INSERT/UPDATE;          `suppliers.manage`,            order affects stock and
                                 `supplier_orders`:             `procurement.create_order`,    expenses; separate
                                 SELECT/INSERT/UPDATE/DELETE;   `procurement.edit_order`,      approval/execute control
                                 `supplier_order_items`:        `procurement.cancel_order`,    
                                 INSERT/DELETE;                 `procurement.receive`          
                                 `receive_supplier_order` RPC                                  

  `store-admin.html`             `store_items`:                 `store.catalog.view`,          Internal `staff_note`
                                 SELECT/INSERT/DELETE; image    `store.catalog.manage`,        must not be returned to
                                 upload                         `store.catalog.publish`,       public clients
                                                                `media.upload`                 

  `moon-admin.html`              `moon_modules`,                `moon.view`,                   Confirm actual
                                 `moon_deliveries` reads and    `moon.manage_modules`,         insert/update/delete
                                 delivery administration        `moon.confirm_delivery`        statements before
                                                                                               migrations

  `translations-admin.html`      `translations_cache`: SELECT,  `translations.view`,           Cache maintenance is not
                                 UPDATE translation/reviewed    `translations.edit`,           necessarily publication
                                                                `translations.review`          of all site text

  `accounting.html`              Accounting dashboard /         `finance.view` plus explicitly Inspect full page and
                                 financial workflow             assigned transaction rights    linked ledgers before
                                                                                               granting

  `expense.html`,                `expense_entries`,             `finance.view`,                Separate supplier
  `expense-ledger.html`          `suppliers`,                   `finance.enter_expense`,       operational access from
                                 `delivery_services`; expense   `finance.edit`; optional       expense amounts
                                 creation and ledger reading    `procurement.view`             

  `income.html`,                 `income_entries` and           `finance.view`,                Public orders currently
  `income-atelier.html`,         pricing/configuration reads    `finance.enter_income`,        couple to this table;
  `income-product.html`,                                        `finance.edit`                 split intake from ledger
  `income-store.html`,                                                                         first
  `income-ledger.html`                                                                         

  `revenue.html`                 `income_entries`               `finance.view`, optionally     In uploaded ZIP no
                                 aggregate/report reads         `finance.export`               `requireAuth()` was
                                                                                               observed on this page;
                                                                                               treat as a critical
                                                                                               exposure until verified
                                                                                               in live deployment

  `payment-terminal.html`,       Payment-related                `payments.view`,               Exact payment provider
  `modules/paymentTerminal.js`   interface/module present       `payments.initiate`,           flow and server
                                                                `payments.reconcile`,          endpoints require
                                                                `payments.refund`,             separate review; do not
                                                                `payments.approve` as          infer implementation
                                                                applicable                     from filenames

  `gallery.html`                 `club_prints`,                 Public read for published      Public gallery must not
                                 `embroidery_products`,         catalogue; staff-only          inherit staff access
                                 `product_photos` reads         `catalog.manage` for internal  
                                                                actions                        

  `atelier.html`                 Public catalogue reads;        Public: `catalog.public_view`, High-priority
                                 `destress_bump`,               `orders.submit`,               separation: public order
                                 `track_gallery_event`; upload; `metrics.record`; staff:       intake must not directly
                                 direct reads/updates of        `warehouse.issue`, `finance.*` mutate stock or
                                 `warehouse_stock`, inserts to                                 financial ledger
                                 `warehouse_movements` and                                     
                                 `income_entries`                                              

  `store.html`                   Public `store_items` read;     Public: `store.public_view`,   High-priority
                                 direct INSERT into             `orders.submit`                separation: guest order
                                 `income_entries` for order                                    endpoint should create
                                                                                               order-intake record, not
                                                                                               finance ledger row

  `book.html`                    Public `destress_phrases`      Public:                        Submission should be
                                 read/insert; `destress_bump`   `destress.read_approved`,      pending;
                                 RPC                            `destress.submit`,             publication/moderation
                                                                `metrics.record`               remains staff-only

  `destress-studio.html`         Public approved                Public:                        Must not grant public
                                 phrase/situation reads;        `destress.read_approved`,      approval/update/delete
                                 submissions to                 `destress.submit`,             
                                 `destress_phrases` and         `metrics.record`               
                                 `destress_situations`;                                        
                                 `destress_bump`                                               

  `space-construction.html`      Public reads of approved       Public read of approved        Do not expose
                                 `space_posts` and approved     content only                   pending/moderation
                                 phrases                                                       fields

  `atelier-space.js`             Reads `moon_modules`; inserts  Public: limited module         Confirm if this module
                                 `alien_requests`               availability read,             is mounted in current
                                                                `requests.submit`              public route

  `core/clubBase.js`             `print_likes`: SELECT existing Public: `likes.check_own`,     Passport ID is not a
                                 like, INSERT like; likely      `likes.add`                    secure identity proof;
                                 updates/count reads                                           enforce uniqueness and
                                                                                               abuse controls
                                                                                               server-side

  `core/complexes.js`            `launch_complexes` SELECT      Public: read safe              Never expose private
                                                                published/open status only     admin configuration
                                                                                               through public query

  `core/pricing.js`              `pricing_params`,              Public: read only              Do not expose internal
                                 `storefront_config` SELECT     pricing/config keys intended   margins/cost values
                                                                for display                    

  `modules/moonData.js`          `moon_modules`,                Public: narrow delivery        Validate identity,
                                 `moon_deliveries`;             request/claim if intended      module eligibility,
                                 `deliver_modules` RPC                                         quotas and concurrency
                                                                                               server-side

  `modules/expenseJournal.js`,   Financial journal modules      `finance.*`                    Must be protected at
  `modules/incomeJournal.js`                                                                   page, data, and
                                                                                               server-operation layers

  `modules/reviewBox.js`         `reviews` public submission /  Public: `reviews.submit`;      Separate submission from
                                 review workflow                staff: `reviews.moderate`      moderation

  `modules/spaceForum.js`        `space_posts` public forum     Public: `space.submit`; staff: Separate participant
                                 workflow                       `space.moderate`               posts from staff status
                                                                                               changes
  ---------------------------------------------------------------------------------------------------------------------

## 3. Public club operations --- must remain functional

These are not OFFICE employee privileges. They are controlled public
capabilities and should be implemented with narrow public APIs/RPCs and
strict validation:

  -----------------------------------------------------------------------
  Public capability       Expected allowed action Must not allow
  ----------------------- ----------------------- -----------------------
  Submit alien/space      Submit a new request    Read all requests,
  request                                         alter status, delete
                                                  requests

  Submit De-Stress        Create pending          Approve, edit other
  phrase/situation        submission              submissions, delete
                                                  approved content

  Read approved De-Stress Read approved rows only Read pending/admin
  content                                         notes

  Submit space/forum post Create own post under   Moderate or delete
                          defined rules           others' posts

  Submit review           Create review           Hide, approve or delete
                                                  reviews

  Like print              Add one eligible like   Change arbitrary counts
                          under defined           or impersonate another
                          anti-abuse rules        Passport

  View public catalogue   Read published          Read staff notes,
                          products/prints/store   supplier costs,
                          items                   unpublished records

  Submit Atelier/store    Create a validated      Insert directly into
  order                   order-intake record     financial ledger or
                                                  directly adjust stock

  Record                  Call allowlisted event  Arbitrary writes or
  gallery/De-Stress event recorder                unrestricted counter
                                                  increments

  Request/claim Moon      Narrow allowed delivery Change arbitrary module
  delivery                action                  state or bypass quotas
  -----------------------------------------------------------------------

## 4. Cross-area data dependencies

  --------------------------------------------------------------------------
  Shared data             Consumers               Required separation
  ----------------------- ----------------------- --------------------------
  `income_entries`        Finance, Atelier,       Split public order intake
                          Store, Warehouse        from internal ledger;
                                                  warehouse gets only
                                                  necessary fulfillment
                                                  fields

  `warehouse_stock` /     Warehouse, Production,  Public order pages cannot
  `warehouse_movements`   Atelier                 directly mutate stock;
                                                  each operational mutation
                                                  must be server-validated
                                                  and authorized

  `suppliers` / supplier  Procurement, Warehouse, Supplier contact access
  orders                  Product Photos, Finance and supplier cost/expense
                                                  access are distinct

  `club_prints` /         Public gallery,         Public reads only
  `embroidery_products` / Atelier, Catalog staff  published safe fields;
  `product_photos`                                staff writes and storage
                                                  operations require
                                                  separate grants

  `launch_complexes`      Public navigation,      Public reads only safe
                          OFFICE admin            status/availability; staff
                                                  configuration is
                                                  restricted

  `space_posts`,          Public participants and Public
  `reviews`, De-Stress    moderators              submission/read-approved
  tables                                          paths separated from
                                                  moderation

  `pricing_params` /      Public display,         Public may read only
  `storefront_config`     Atelier, Pricing,       presentation values, not
                          Finance                 margins, costs or internal
                                                  settings
  --------------------------------------------------------------------------

## 5. Permission matrix by role --- baseline template

`*` means an explicit scoped grant is required. The table is not a
substitute for individual permission assignments.

  -----------------------------------------------------------------------------------------
  Area                  Creator         OFFICE admin    Area lead        Staff      Auditor
  ---------------- ------------ -------------------- ------------ ------------ ------------
  OFFICE access             All            Delegated     Assigned     Assigned     Assigned
                                                                                       read

  Staff/role                All       Delegated only          ---          ---   Audit read
  administration                                                               

  Complex                   All            Delegated     Assigned          ---         Read
  configuration                                         complexes              

  Department                All   Delegated/assigned     Own area     Assigned         Read
  operations                                                             tasks 

  Moderation                All            Delegated     Assigned      Only if         Read
                                                            queue     assigned 

  Finance                   All   No automatic grant No automatic No automatic     Explicit
                                                            grant        grant    read-only
                                                                                      scope

  Permission                All      Only explicitly          ---          ---          ---
  delegation                               delegated                           

  Audit logs                All Assigned operational     Own area Own relevant     Assigned
                                                logs        where      actions         logs
                                                          granted              
  -----------------------------------------------------------------------------------------

## 6. Critical implementation findings

1.  `requireAuth()` is a session guard, not authorization. Each
    protected page/action must check an explicit permission, and the
    database/server must enforce the same rule.
2.  `revenue.html` was observed reading `income_entries` without an
    observed `requireAuth()` call in the uploaded ZIP. Verify the
    deployed page and protect it.
3.  Public `atelier.html` writes directly to `income_entries` and
    mutates `warehouse_stock` / `warehouse_movements`. Replace this with
    a validated public order-intake endpoint and server-side
    fulfillment.
4.  Public `store.html` writes directly to `income_entries`. Replace
    with the same separated order-intake pattern.
5.  `store_items.staff_note` was reported exposed by a public SELECT
    policy. RLS cannot hide individual columns; use a public-safe
    view/API or column-level privileges and verify grants.
6.  Policies based only on `auth.role() = 'authenticated'` distinguish
    signed-in from anonymous users, not authorized OFFICE employees or
    departments.
7.  Permissive RLS policies combine with OR. Adding another permissive
    policy does not neutralize an existing public permissive policy.
    Audit and replace/restrict existing policies deliberately.
8.  Storage buckets (`club-prints`, `store-items`) need their own
    policies aligned with upload/read/delete permissions.
9.  RPCs exposed to `anon` must be classified as intentionally public,
    input-validated, rate-limited, and restricted to the narrow action.
    Internal helper functions should not be callable by browser roles.
10. The `guard_closed_complex()` function was reported to allow bypass
    based on any authenticated session. Replace with a permission check
    for a specifically authorized OFFICE capability, not generic
    authentication.

## 7. Completion criteria

The matrix is ready for implementation only when:

-   Every page and module has a named owner and access classification.
-   Every direct table operation and RPC has been classified by actor,
    action, scope, and data sensitivity.
-   Public capabilities have explicit safe paths that do not expose
    OFFICE/finance writes.
-   Each staff action maps to a permission key and server-side
    enforcement point.
-   Every RLS policy has been reviewed for role target, USING, WITH
    CHECK, and OR-combination with other policies.
-   Storage policies, views, RPC grants, triggers, and SECURITY DEFINER
    functions are included.
-   Negative tests prove that unauthorized employees, anonymous
    visitors, and other departments cannot perform forbidden actions.
-   Guest journeys and staff workflows pass positive regression tests.

## 8. Known audit limits / unresolved verification

This is a repository-driven inventory, not a complete dynamic execution
trace. Before migration, inspect the full implementations and actual
live schema for: - `prints-admin.html`, `product-photos.html`,
`production.html`, `production-pricing.html`, `moon-admin.html`,
`payment-terminal.html`, and any embedded SQL/edge code; - exact
operations in linked modules and event handlers; - every storage bucket
policy and object path; - all views, sequences, triggers, grants,
policies and functions, including non-public schemas; - deployed version
drift between GitHub Pages and the ZIP baseline.

Do not treat a filename, UI button, or earlier regex scan as proof that
an operation is implemented or authorized.
