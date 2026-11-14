# GY-GY Club --- OFFICE Roles

**Status:** Architecture proposal for review\
**Evidence baseline:** `gygy-club-core-main (5).zip` and the read-only
Supabase audit discussed in the project conversation.\
**Important:** This document describes the target model. It does not
claim that these roles or checks are already implemented.

## 1. Governing principles

1.  Supabase Auth is initially for OFFICE employees only. Guests and
    ordinary club participants continue to use GY-GY Passport and must
    not be forced into Supabase Auth.
2.  A successful login proves an authenticated session; it does **not**
    grant blanket OFFICE access.
3.  A role describes an employee's position. Permissions describe exact
    allowed actions and data scopes. Role and permission are separate.
4.  Default deny: anything not explicitly granted is denied.
5.  Permissions are scoped by functional area, action, data scope, and
    (where relevant) Launch Complex.
6.  Finance is a separate security domain. A department role does not
    imply finance access.
7.  Only the Club Creator has the initial highest privilege. No employee
    may grant themselves privileges or elevate their own role.
8.  Role/permission changes and sensitive operations must be auditable.
9.  Public club actions must remain available through narrow,
    purpose-built public interfaces. Do not close a public feature
    merely because it touches a table also used by OFFICE.

## 2. Role catalogue

  -----------------------------------------------------------------------
  Role key                Meaning                 Baseline
  ----------------------- ----------------------- -----------------------
  `club_creator`          Club Creator / owner    Full authority,
                                                  including appointing
                                                  privileged
                                                  administrators and
                                                  delegating explicitly

  `office_admin`          OFFICE administrator    Staff lifecycle and
                                                  operational
                                                  configuration only
                                                  within
                                                  creator-delegated
                                                  limits

  `department_lead`       Lead of a functional    Manages assigned area
                          area                    and its staff tasks
                                                  within granted scope

  `staff`                 Employee                Executes only assigned
                                                  operations

  `auditor`               Auditor / controller    Read-only access to
                                                  specifically assigned
                                                  records and audit
                                                  trails
  -----------------------------------------------------------------------

These are role templates, not automatic grants. Each employee's
effective access is the intersection of explicit permissions, assigned
scopes, active employment status, and any separation-of-duty rules.

## 3. Permission vocabulary

  -----------------------------------------------------------------------
  Permission                          Meaning
  ----------------------------------- -----------------------------------
  `view`                              Read permitted records

  `create`                            Create records

  `edit`                              Modify existing records

  `delete`                            Delete records; exceptional and
                                      separately granted

  `publish`                           Publish or expose content to club
                                      participants

  `moderate`                          Approve, reject, hide, or otherwise
                                      moderate participant content

  `execute`                           Run a business operation (receive
                                      stock, issue stock, process a
                                      delivery, etc.)

  `approve`                           Approve a consequential action or
                                      record

  `export`                            Export or download data

  `manage_access`                     Assign/revoke roles or permissions
                                      within delegated scope
  -----------------------------------------------------------------------

Permission keys should be namespaced, for example `warehouse.view`,
`warehouse.receive`, `reviews.moderate`, `finance.approve`.

## 4. Scope model

A grant should carry the narrowest scope that makes the task possible:

-   `area`: functional area, e.g. `warehouse`, `production`,
    `suppliers`.
-   `launch_complex`: one or more Launch Complex IDs/codes, where
    relevant.
-   `record_scope`: all records in area, assigned records, or a specific
    record set.
-   `action`: one permission from the vocabulary above.
-   `validity`: active/inactive and optional start/end dates.
-   `granted_by`: creator or authorized delegator.
-   `reason`: required for sensitive grants and changes.

A user may hold multiple grants. A grant to one area must not silently
imply access to another.

## 5. Finance is independent

Finance permissions are not inherited from `department_lead` or
`office_admin`.

  Permission                Meaning
  ------------------------- --------------------------------------------------
  `finance.view`            View financial records and reports
  `finance.enter_income`    Enter income
  `finance.enter_expense`   Enter expenses
  `finance.edit`            Correct financial entries under controlled rules
  `finance.approve`         Approve transactions
  `finance.close_period`    Close an accounting period
  `finance.export`          Export financial reports

Viewing, entering, editing, approving, closing, and exporting are
distinct permissions. Approval should be separated from creation where
practical. The creator may explicitly grant finance access, but no
department title grants it automatically.

## 6. Privilege governance

-   Only `club_creator` may appoint or remove `office_admin` and other
    privileged administrators unless the creator explicitly delegates a
    narrowly scoped authority.
-   An administrator cannot grant a permission they do not possess or
    delegate beyond their own scope.
-   No self-grant, self-approval, or self-elevation.
-   Changes to role, permission, scope, status, or delegation are
    written to an append-only audit trail.
-   Revocation must take effect server-side, not merely hide a page.
-   Emergency access, if later needed, must be explicitly designed,
    time-limited, logged, and reviewed.

## 7. Passport boundary

GY-GY Passport remains the club participant identity mechanism. A
Passport ID is not proof of a person's real-world identity and must not
be treated as a staff credential. Guest/member features such as public
submissions, likes, reviews, and orders must use dedicated public
interfaces with validation and abuse controls. They must not receive
direct access to internal OFFICE or finance tables.

## 8. Future Launch Complexes

Every Launch Complex must declare its functional areas, data, public
actions, staff operations, permissions, and audit requirements before
activation. New complexes inherit the permission framework, not broad
access. No new complex should become operational until its access
manifest has been reviewed.
