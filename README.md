# CRM

A personal CRM and Low-Code Platform project designed to explore how modern business applications can be configured, automated, and scaled without extensive custom development.

The project combines Customer Relationship Management (CRM), workflow automation, user access management, configurable forms, approval processes, and business process digitisation into a single platform. It is being developed as an ongoing initiative to deepen my understanding of Business Analysis, Product Management, System Design, and Low-Code Application Development.

---

## Project Overview

CRM aims to provide a flexible foundation for organisations to manage customer information, sales activities, workflows, approvals, and operational processes through configurable modules rather than hardcoded solutions.

The long-term vision is to evolve the platform into a low-code ecosystem where business users can create forms, workflows, dashboards, permissions, and business applications with minimal technical involvement.

---

## My Responsibilities

As the sole project owner, I am responsible for:

- Requirements gathering and business process analysis
- Product feature definition and prioritisation
- Workflow and approval process design
- UI/UX planning and user journey design
- Low-code platform configuration and development
- Database and system architecture planning
- User Acceptance Testing (UAT)
- Release planning and continuous improvement

---

## Skills Demonstrated

### Business Analysis
- Requirements elicitation
- User story creation
- Process flow modelling
- Functional specification development
- UAT planning and execution

### Product Management
- Product roadmap planning
- Feature prioritisation
- Problem discovery and solution design
- User journey optimisation
- Continuous product improvement

### Technical Skills
- Workflow automation
- Role-based access control
- Low-code application development
- API integration concepts
- Database design and configuration

---

## Current Status

This project is actively under development and serves as a practical platform for experimenting with CRM capabilities, workflow automation, and low-code architecture patterns.

The sections below serve as the detailed project log, implementation notes, feature backlog, and future development roadmap.

- Login with JWT authentication.
- Admin user management.
- Customer create, edit, search, filter, multi-select, and delete.
- Country-based phone code handling.
- Malaysia is the default country for new customers.
- Excel customer import with downloadable protected template.
- -inspired UI theme with blue primary actions.
- Dedicated full-page login screen.
- Modal forms for adding/editing customers and users.
- Customer import modal with template download, file upload, and import result display.
- Customer export download with admin-configured export columns.
- Admin Portal with sections for Modules, Departments, Form Builder, Browser Buttons, Module Pages, Automation Flow, and Permissions.
- Flexible Department hierarchy management with one Organization root, Departments and Groups at any depth, manual maintenance, and Excel template/import support.
- Form Builder for customer and user field configuration.
- Module-first Browser Buttons workspace for reusable master-data lookup definitions shared across modules.
- Browser Button definitions are grouped by module, can still target main or detail tables inside that module, and support guarded SQL `WHERE` conditions plus checkbox-based Search Fields and Display Columns.
- Configurable fields for main table and detail table placement.
- Batch Edit fields workflow with editable existing fields, new field rows, and main/detail table tabs.
- Bulk duplicate/delete/archive controls for configurable fields, with delete blocked when existing data is present.
- Field Properties grid for display, editability, required, and disable-manual-input flags.
- Import/export mapping controls for per-field import headers, export headers, and export visibility.
- Field validation rules for length, numeric range, regex, conditional required, and unique values.
- Formula workspace with formula expressions, reusable custom helper functions, and SQL capture storage.
- Backend-backed Form Design drawer for per-form-type visual field ordering with draft/publish controls; newly created fields are reconciled into each form design automatically.
- Form Builder Version History drawer with remark-backed configuration checkpoints, author/time metadata, an immutable timeline, and safe restore-as-new-version recovery.
- Page-level Permissions drawer for configuring role and specific-user access without leaving Module Pages.
- Page View permissions support Organization, Department, and Group access with inheritance to users assigned to descendant units.
- All pop-out modals include a fullscreen/enlarge button.
- Authenticated pages use the shared application shell: a compact global utility bar for notifications and account controls, a flexible page-content region, and a lightweight footer. Page names and descriptions appear only in the page header and are never repeated in the global utility bar. Standard, published, and low-code-generated module pages inherit this shell automatically; genuine full-screen designers use their dedicated toolbar without floating global controls over the canvas.
- Customer detail-table data entry inside the Add/Edit Customer modal.
- Detail-table row controls:
  - add row
  - remove row
  - row checkbox selection
  - select all rows
  - duplicate selected rows
  - delete selected rows

## Current App Access

```text
Local:
http://localhost:3000

Tailscale:
http://100.89.44.29:3000
```

Admin login credentials are created from your local `.env` values when you run `npm.cmd run db:seed`.
Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` before seeding; the app does not publish or prefill default login credentials.
admin@gmail.com
admin@123!

## Architecture

```text
Browser UI
  |
  | HTTP over localhost, LAN, or Tailscale private network
  v
Node.js Express app
  |
  | mysql2 connection pool
  v
MySQL database
```

Backend modules live in `src/modules/*`:

- `auth`
- `countries`
- `customers`
- `departments`
- `imports`
- `sysadmin`
- `users`

Frontend files live in `public/`:

- `index.html`
- `styles.css`
- `app.js`

## Low-Code CRM Direction

The long-term direction is to turn  CRM into a low-code, fully customizable CRM platform where admins can create modules, forms, pages, and automation without editing source code. Weaver e-cology and e-Builder are useful references for the platform concept, especially the separation between form building, page publishing, data rules, and automation workflows.

### Target Admin Experience

Admins should have a dedicated portal for configuring the CRM:

- `Admin Portal`: the dedicated low-code configuration workspace.
- `Module Builder`: create and manage modules such as Customers, Suppliers, Projects, Tickets, Assets, or Contracts.
- `Form Builder`: add and configure module fields without coding.
- `Module Page Publisher`: publish form-backed modules as usable CRM pages.
- `Automation Flow`: configure triggers, conditions, actions, scheduled jobs, integrations, and execution logs.
- `Permissions`: control who can view, create, edit, delete, import, export, and configure each module.

### Recommended Build Phases And Progress

0. Platform foundation: Department hierarchy - management slice complete
   - Admin Portal has a dedicated `Departments` workspace using the same three-panel design language as the other builders.
   - A single default `Organization` root is created automatically.
   - Admins can create, edit, enable, disable, and delete Departments and Groups beneath the Organization or any other unit.
   - The backend supports both flat and deeply nested organization structures and prevents deletion of the Organization or nodes that still contain children.
   - Admins can download an Excel template and batch-import arbitrary hierarchy levels using Parent Path, Name, Type, and Description columns.
   - User forms include Organization Unit membership assignment.
   - Page View permissions can target any Organization, Department, or Group; access inherits to users assigned to the selected unit or any descendant unit.
   - Organization-unit assignment and inherited Page View access were verified by the complete backend smoke suite on 2026-07-21.

1. Phase 1: Dedicated Admin Portal - mostly done
   - Converted the old sysadmin area into `Admin Portal`.
   - Added an admin-only configuration workspace.
   - Added internal admin sections for Modules, Form Builder, Module Pages, Automation Flow, and Permissions.
   - Normal CRM usage is separated from admin configuration through sidebar navigation.
2. Phase 2: Module Builder - in progress
   - Admin Portal has a `Modules` section.
   - Customers and Users are visible as existing system modules.
   - Admins can create, edit, publish/draft/archive, show/hide in menu, and delete custom modules.
   - `Add New Module` opens in a full-height right-side drawer with three compact starting routes: a blank module, a copy of an existing module form configured in Form Builder, or a reusable Companies, Contacts, or Sales Opportunities template. Module Details use a single-column layout.
   - Reused Form Builder forms copy their fields and Add/Edit/Detail layouts, including safely remapped detail tables. Existing forms and templates remain independent from the created module.
   - Custom module keys are stable once created and each custom module gets a backing data table for future records.
   - Generated frontend pages and record CRUD are now available for published custom modules.
3. Phase 3: Form Builder - complete
   - Existing customer and user fields are configurable through Form Builder.
   - Admins can add one field at a time with `Add Field`.
   - Admins can edit existing fields and add new fields through `Batch Edit`.
   - Fields can be assigned to `Main Table` or `Detail Table`.
   - Detail table names are generated and shown in the field list.
   - Supported configurable field types currently include textbox, textarea, checkbox, dropdownbox, int, decimals, browser button placeholder, date, attach document placeholder, and image placeholder.
   - System field types such as email, phone, country, owner, password, and status are supported by existing modules.
   - `Field Properties` saves display, editability, required, and disable-manual-input settings.
   - Field validation rules support min/max length, min/max numeric value, regex, conditional required, and unique values.
   - `Formula` opens the Formula Builder for formula expressions, reusable custom functions, and SQL capture notes.
   - `Form Design` opens a right-side visual drawer for Add, Edit, and Detail form layouts. Draft and published layouts are stored in module configuration.
   - Newly added fields are automatically included in the applicable form-design draft, so they are immediately available for layout configuration.
   - `Batch Edit`, `Field Properties`, and `Import/Export Mapping` use the same right-side drawer pattern as Form Design, with a fixed header and action footer around a scrollable working area.
   - Large centered pop-outs use a shared fixed-region layout: title/fullscreen/close controls stay visible at the top, action buttons stay visible at the bottom, and only the middle content scrolls. Compact confirmation and success dialogs remain unchanged.
   - `Batch Edit` can duplicate selected configurable fields, delete unused configurable fields, and archive configurable fields that should be hidden without dropping existing data.
   - `Browser Buttons` stores reusable master-data lookup definitions. Browser Button fields can reference these definitions through field lookup metadata.
   - Browser Buttons are managed from a module-first workspace: select a module, then choose the main or detail table when creating or editing browser definitions.
- Browser Button configuration supports value field, display field, checkbox-selected search fields, checkbox-selected display columns, enabled state, and a guarded SQL `WHERE` condition stored as filter metadata.
- Browser Button fields render Browse controls in customer/user forms and open a lookup popup that searches the configured source table.
- Add/Edit Field and Batch Edit include a module-first Browser Button picker for `browser_button` fields and save `lookupConfig.browserButtonKey`.
- Formula fields are evaluated on the customer form and server save path.
   - Formula save paths validate field dependencies, reject unknown field references, and block circular references before saving configuration.
   - Generated-page smoke coverage is connected through Module Builder and Module Page Publisher.
4. Phase 4: Module Page Publisher - complete
   - Admin Portal has a `Module Pages` section that lists each module page state, menu status, field count, layout publishing count, and actions.
   - Published custom modules can open as generated CRM pages from the menu or Module Pages section.
   - Generated pages support list views, quick search, advanced field filters, add/edit forms, bulk delete, Browser Button fields, detail-table entry rows, and page/field permissions.
   - Generated pages support read-only record detail views using the published Detail layout.
   - Custom module records are stored through generic module-record CRUD endpoints.
   - Custom module pages now support Excel template download, Excel import, and Excel export for main-table and detail-table fields.
   - Detail-table import/export uses separate Excel sheets linked to main records by `Record Ref`.
   - Generated-page smoke test passed for custom module creation, permissions, layouts, record CRUD, quick search, advanced filter, detail view data, Excel template, detail-table import/export, and cleanup.
5. Phase 5: Automation Flow - complete
   - Admin Portal has an `Automation Flow` management page with All, Enable, Disable, and Draft filters.
   - Existing automation flows can be previewed in a right-side drawer before opening the full builder.
   - New and existing flows open in a full-screen Make.com-style low-code builder with a draggable dotted canvas, aligned dotted connectors, categorized action palette, node configuration panel, Save, and Check controls.
   - The completed implementation includes: the visual canvas; structured conditions; real Yes/No runtime routing; n8n-style field mapping and previous-node outputs; task, notification, and transformation actions; Run Once testing and visual execution states; scheduling, error handlers, and retries; versioning and publishing; and loops, parallel branches, and cross-flow orchestration.
   - Action categories include Record, Task/Notification, Logic, RESTful API, and Data Mapping.
   - Record actions include add record, update record, delete record, assign owner, and change status.
   - RESTful API connector configuration is available as a dedicated Admin Portal API Connectors module with connection name/description, protocol and TLS version, certificate-bypass setting, domain/IP address, encoding, connection/response timeouts, and authentication.
   - API Category Management organizes Connectors and their inherited Interfaces in the Admin Portal's shared three-panel navigation. Connectors select a category when created or edited, and Interfaces inherit the category of their selected Connector.
   - Connector authentication uses method-specific fields for API Key, Bearer Token, Basic, OAuth 1.0, and OAuth 2.0 instead of requiring admins to enter raw JSON. Connection keys are generated stable system identifiers used by Interfaces and Automation Flow references.
   - OAuth 1.0 requests are signed with HMAC-SHA1 or HMAC-SHA256. OAuth 2.0 Client Credentials retrieves and caches access tokens, supports Basic-header or request-body client authentication, and can attach tokens through the Authorization header or query string.
   - API Interfaces and Connectors have separate creation actions. Interfaces use a five-step Basic, Request, Response, Succeeded/Failed, and Test editor and remain attached to a reusable Connector.
   - Request and Response definitions use Params, Header, and Body tables with one-row-at-a-time editing plus batch field creation from pasted JSON or XML. Data-format selection is scoped to Body and reused by Batch Add; Params and Header batch input auto-detects JSON or XML.
   - Interface Debug executes through the backend and returns status, timing, headers, body, response size, and configured success-rule evaluation. Backend storage, validation, connector save/delete, and automated OAuth smoke coverage are available.
   - Persisted delete actions use one reusable confirmation template across customers, generated records, modules, fields, API connectors, and connector categories, with consistent destructive styling, right-aligned actions, backdrop dismissal, and Escape support.
   - The structured condition editor supports multiple rules, All/Any matching, field/operator/value selection, and saved Yes/No branches that route the runtime graph according to the evaluated result.
   - n8n-style mapping supports fixed values and expressions sourced from trigger data, the current record, and previous-node outputs; transformed results can be named and reused by later modules.
   - Published custom module record triggers (`record_created`, `record_updated`, `record_deleted`, and `status_changed`) and scheduled triggers execute local record actions such as add, update, delete, assign owner, and change status.
   - Task creation, notifications, Set Value, Transform Value, and REST actions consume mapped inputs and expose execution results for subsequent modules.
   - Runtime executions are recorded in `crm_action_flow_executions`, admins can read recent execution/instance logs through the Automation Flow API, and the Automation Flow builder has Execution/Instance log views.
   - Execution results include step labels, categories, statuses, timestamps, durations, skip reasons, trigger metadata, and raw payload/result inspection.
   - Guarded REST nodes perform outbound calls with connector endpoint selection, request mapping, auth/header support, timeouts, private-network blocking unless explicitly allowed, bounded response capture, and HTTP response logging.
   - First visual mapping dialogs are available for record field mapping and REST request/response/error mapping while preserving the existing text mapping format.
   - REST response/error mappings are applied at runtime: mapped values are captured in execution logs, and matching main-table form fields on the triggered record are updated automatically.
   - Dynamic assignment picker is available for Automation Flow value fields and mapping rows, with context/current-record/system/fixed-value choices and previous-node output tokens.
   - Run Once executes draft flows for testing and displays node-level running, successful, skipped, and failed states with useful error details.
   - Reliability settings support retry attempts, retry delays, stop-flow behavior, and dedicated error branches after retry exhaustion.
   - Automation Flow version history supports named checkpoints, remarks, safe restoration, and explicit publishing; production triggers and child-flow calls use published versions.
   - Loop modules expose Body and Done paths, Parallel modules support user-added empty branches and wait for every path, and Run Flow invokes another published flow with mapped inputs and recursion protection.
   - End modules explicitly finish individual paths, while execution and instance logs provide monitoring for completed and failed runs.
6. Phase 6: Permissions - complete
   - Admin Portal has a `Permissions` section for module and field access.
   - Module permissions control view, create, edit, delete, import, export, and configuration access by role or specific user.
   - Module Pages provides a page-specific `Permissions` action that opens a right-side configuration drawer instead of navigating away from the page list.
   - `View` access uses Organization Units, Roles, and Specific Users. Organization-unit choices follow the Organization, Department, and Group hierarchy.
   - Create, Edit, Delete, Import, and Export use Roles and Specific Users only; Configure remains in the main Permissions workspace.
   - Action sections open expanded by default, the drawer body scrolls independently from its fixed header and footer, and role/user pickers show a compact set of entries with internal scrolling for additional options.
   - Page View access selected at an Organization, Department, or Group includes users assigned directly to that unit or any descendant unit.
   - User create/edit forms require an Organization Unit; existing or unspecified users default to the Organization root.
   - The organization-membership and inherited Page View integration passed the complete backend smoke suite on 2026-07-21.
   - Field permissions control view, create, edit, import, and export by role or specific user.
   - Existing module and field permissions are enforced across generated record list, open, create, edit, delete, import, and export operations.
   - Fields without View permission are excluded from returned record data and cannot be used by record search/filter paths.
   - Allowed and denied permission decisions are stored in `crm_permission_audit_logs` with user/staff identity, module, optional record ID, action, result, decision reason, and timestamp.
   - Admin Portal > Permissions includes a read-only `View Audit Log` right-side drawer with module, action, and Allowed/Denied filters, refresh, and fullscreen controls.
   - The admin-only permission-audit API supports module, action, result, and result-limit filters.
   - Record-scope rules such as Own, Assigned, or Department records are intentionally not required; the exploratory Record Access interface remains disabled behind a frontend feature flag.
   - Database migration, allowed/denied audit coverage, field-view redaction coverage, and the complete backend smoke suite passed on 2026-07-21.
7. Phase 7: Dashboard Builder - in progress
   - Dashboard persistence and the guarded data-source execution foundation are complete; the user-facing builder is not implemented yet.
   - MySQL stores registered data sources, dashboards, widget layouts, filters, permissions, immutable versions, and published-version references.
   - Authenticated admin APIs can discover SQL views, inspect their columns, register approved SQL views or guarded SELECT queries, and execute registered sources with parameter binding, pagination, row limits, timeouts, concurrency limits, and safe error responses.
   - Dashboard query execution supports optional dedicated read-only credentials through `DASHBOARD_DB_USER` and `DASHBOARD_DB_PASSWORD`.
   - Admin Portal now includes a Dashboard Data workspace for registering SQL views or guarded queries, inspecting returned columns, refreshing metadata, and running bounded result previews. Standard data-backed widgets remain planned.
   - Admin Portal now includes Dashboard Builder management plus a responsive 12-column desktop and 4-column mobile canvas with persisted widget frames, drag/resize, collision protection, selection controls, keyboard movement, and undo/redo.
   - Saved frames can now connect to registered Dashboard Data and render configurable KPI/number, donut, bar, line, and bounded paginated table widgets with column mappings, aggregations, formats, preview states, refresh, and CSV export.
   - Pivot tables are first-class widgets with multi-level row and column fields, multiple value fields, count/sum/average/minimum/maximum aggregation, sorting, empty-value labels, collapsible row groups, independent subtotal/grand-total controls, result-size bounds, and CSV/Excel export.
   - Dashboard-level date-range, dropdown, multi-select, search, current-user, and organization-unit filters map to declared guarded-query parameters. Values are bound by the backend, can reset to defaults, may use non-sensitive URL state, and refresh only widgets using the mapped data source.
   - Dashboard access rules support roles, specific users, and organization hierarchy nodes with separate View and Configure flags. Published CRM dashboard pages and widget execution use immutable published snapshots, deny unmatched users by default, and record allowed/denied access decisions in the permission audit log.
   - Dashboard execution is production-bounded with per-source timeouts and row limits, pagination metadata, an atomic four-query concurrency cap, safe overload/timeout errors, and slow-query diagnostics after two seconds.
   - Results use a conservative 30-second in-memory cache keyed by data source, dashboard, widget, parameters, pagination, user, role, staff identity, and organization assignments. Source edits and archives invalidate matching entries; cached rows are never carried by refresh signals.
   - Builder and published widgets support explicit refresh and show query timing, last-refreshed time, and cached/fresh state. Cache entries become stale after 60 seconds and are never served after their 30-second reuse window.
   - Dashboard lifecycle controls now expose Save Draft, Check, Publish, and a one-column Version History drawer. Admins can create immutable named checkpoints with remarks, export credential-free versioned JSON, validate and import compatible configuration, and restore a prior snapshot as a new draft checkpoint without changing the active published version.
   - Publishing creates and activates one immutable snapshot in a single database transaction. Widgets may define an allowlisted drill-down to another published dashboard or CRM module page; the backend rechecks destination access before returning identifiers, approved parameters, and a timestamp only.
   - Add low-code dashboard pages made from saved widget configuration instead of generated source code.
   - Use saved SQL views or guarded `SELECT` queries as dashboard data sources.
   - Support first widget types such as number cards, ring/donut charts, line charts, bar charts, and table widgets.
   - Each widget should map query result columns such as `label`, `value`, `date`, and `group` into the chart renderer.
   - Guard dashboard SQL so it is read-only: no `INSERT`, `UPDATE`, `DELETE`, `DROP`, comments, or statement separators.
   - Later add dashboard filters, date ranges, role/user permissions, config export/import, and version history.
8. Phase 8: Workflow Module and Approver Workflows - complete
   - Create a separate `workflow` module for approval process configuration and runtime.
   - Reuse the form builder for workflow form definitions, but keep workflow config in a dedicated module.
   - Support workflow definitions with multiple approval steps, each with assigned approvers (role or user).
   - Store workflow instances with status (pending, approved, rejected, cancelled).
   - Track workflow approvals with decision, comments, and audit trail.
   - Keep product roadmap and other entity data in their own modules (customers, roadmap items, etc.).
   - Use shared form-builder metadata for workflow form UI and validation.
   - Make Approval Workflow module-independent so the same engine can govern CRM, HCM, payroll, finance, procurement, and other future ERP records.
   - Support sequential and parallel approval steps, role/user/manager-based approvers, conditional approvers, and approval-authority limits.
   - Support approve, reject, return for correction, resubmit, withdraw, cancel, delegate, and substitute-approver actions.
   - Support approval comments, attachments, reminders, escalation, due dates, SLA tracking, and controlled reassignment.
   - Version workflow definitions so in-flight and historical instances retain the exact steps, rules, and approvers that applied when they started.
   - Lock or restrict protected record changes while approval is pending and define controlled behavior when the source record is amended.
   - Preserve an immutable decision history containing the workflow version, step, actor, delegated actor, decision, comment, timestamp, and relevant record snapshot.
   - Publish workflow lifecycle events that Automation Flow can consume for notifications, task creation, integrations, status updates, and other follow-up actions.
   - Keep the responsibility boundary explicit: Approval Workflow decides whether a business action is authorized; it does not replace leave entitlement, attendance evaluation, benefit eligibility, or payroll calculation engines.
   - Finalized Phase 8 specification baseline:
     - `Workflow definition` is the administrator-configured approval design. Definitions move through draft, published, and archived states, and a definition cannot be published when any reachable required stage has no approver rule.
     - `Workflow instance` is one submitted business request tied permanently to the exact published workflow version and relevant source-record snapshot with which it started.
     - `Approval stage` is one ordered decision point. Stages may run sequentially or in parallel; Phase 8 parallel stages require every assigned approver to approve.
     - All routing and approver rules must be configured before submission. If no published workflow matches, or an approver rule resolves to no eligible user, submission fails clearly and the request remains a draft. Approval is never bypassed silently.
     - A stage may enable `Skip when condition is not met`. An inapplicable enabled stage is recorded as `skipped` with its reason, and processing continues to the next applicable stage.
     - A stage may enable automatic self-approval when the requester is the only resolved approver. The result is recorded explicitly as `auto-approved`; otherwise unresolved self-approval stops submission with a clear configuration error.
     - Approval-relevant fields are locked while a request is pending. They may be amended only after an approver returns the request for correction. Resubmission creates a new source snapshot, preserves the earlier history, and resumes from the returning stage.
     - Approval remarks are optional by default and may be configured as required. Rejection and return-for-correction always require a remark. Rejection ends the request; withdrawal is allowed only while pending and is recorded with its remark.
     - Comments and attachments are configurable as disabled, optional, or required at workflow or stage level. File access must follow the source record's permissions and field-redaction rules.
     - Stage due dates, reminders, and escalation notifications are configurable. An overdue stage never becomes approved automatically.
     - Existing instances retain their starting workflow version when a new version is published. Workflow decisions, skips, automatic approvals, snapshots, actors, remarks, attachments, timestamps, and lifecycle events form an immutable audit history.
     - Workflow lifecycle events are published for Automation Flow follow-up actions. Notification or follow-up failure is logged and retryable but does not invalidate an authorized approval decision.
     - Initial approver resolution covers specific users, roles, reporting managers, organization/HR responsibility, and user references stored in source-record fields. Missing, inactive, duplicate, and self-approver results must be validated explicitly.
     - Delegation, multi-hop substitute approvers, controlled administrative reassignment, any-one parallel approval, and quorum approval are supported as optional stage behavior.
     - The reference acceptance scenario is a leave-style request: requester submission, supervisor approval, an optional conditional HR stage, approval/rejection/return, amendment and resubmission, withdrawal, SLA handling, immutable history, and Automation Flow notifications. The workflow engine remains module-independent; a future Leave module owns entitlement and balance calculations.
   - Phase 8 workflow state-machine baseline:
     - Request states are `draft`, `pending`, `returned`, `approved`, `rejected`, `withdrawn`, and `cancelled`. Submission is an audited transition from `draft` to `pending`, not a long-lived state.
     - A `draft` may be edited or submitted. Successful submission resolves the published workflow version and all first-stage approvers, stores the source snapshot, locks approval-relevant fields, records `workflow.submitted`, and moves the request to `pending`.
     - A `pending` request may remain pending while stages advance, become `approved` after the last applicable stage, become `rejected` with a mandatory remark, become `returned` with a mandatory correction remark, be withdrawn by its requester, or be cancelled by an authorized actor.
     - A `returned` request is editable by its requester. Resubmission validates the amended record, stores a new snapshot, reactivates the stage that returned it, records `workflow.resubmitted`, locks approval-relevant fields again, and moves the request to `pending`.
     - `approved`, `rejected`, `withdrawn`, and `cancelled` are terminal states. They cannot be reopened or overwritten in Phase 8; later business correction must create a new request.
     - Stage states are `waiting`, `active`, `approved`, `rejected`, `returned`, `skipped`, `auto-approved`, and `cancelled`. Due and overdue are timing attributes on an active stage, not decision states.
     - A stage begins as `waiting` and becomes `active` only after every required earlier stage has completed. A condition-false stage with skipping enabled moves directly from `waiting` to `skipped`; an eligible configured self-approval moves directly to `auto-approved`.
     - A sequential active stage becomes `approved` after its resolved approver approves. It becomes `rejected` or `returned` immediately after the corresponding valid decision.
     - A parallel active stage creates one immutable assignment per resolved approver and remains active until every assignment is approved. One valid rejection rejects the stage and request; one valid return returns the stage and request. Duplicate or late decisions are rejected.
     - Completing a stage activates the next applicable stage. Skipped and auto-approved stages count as completed. If no applicable stage remains, the request becomes `approved`.
     - Withdrawal or authorized cancellation cancels every waiting or active stage and pending assignment without deleting its history.
     - If an assigned approver becomes inactive after submission, the stage remains pending and is flagged as blocked; it is never skipped or auto-approved. Because reassignment is deferred, the initial release permits withdrawal or authorized cancellation followed by correction of the workflow configuration and a new submission.
     - Every accepted transition is transactional, permission-checked, idempotent, and appended to history with the prior state, next state, workflow version, stage, actor, remark, snapshot reference, and timestamp.
   - Phase 8 workflow configuration baseline:
     - Definition metadata contains a stable `workflowKey`, name, description, lifecycle status, source module, request form reference, configuration schema version, current draft version, published version, and audit ownership fields. Keys and published version snapshots are immutable.
     - `sourceBinding` selects one published module and its stable record identifier. `formBinding` references shared Form Builder metadata and layout versions; workflow routing never duplicates field definitions or validation rules.
     - `trigger` defines the configured entry action, initially `manual_submit` or a named module action. It includes optional entry conditions and the permissions required to create, save, and submit a request.
     - `entryCondition` and stage `condition` use a structured, allowlisted rule model with nested all/any groups, stable field data keys, typed operators, and typed comparison values. Arbitrary JavaScript, SQL, and executable expressions are prohibited.
     - `recordPolicy` identifies approval-relevant fields, whether the full record or only those fields are locked while pending, which fields appear in the immutable snapshot, and whether cancellation is permitted for authorized actors.
     - A definition contains an ordered `stages` array. Every stage has a stable `stageKey`, name, order, enabled flag, optional condition, `skipWhenConditionFalse`, approver rules, self-approval policy, decision/comment policy, attachment policy, SLA policy, and escalation-notification policy.
     - Stage `approvalMode` may be `all`, `any`, or `quorum`. Sequential processing comes from stage order; multiple resolved approvers within one active stage operate in parallel. Quorum stages require an explicit reachable approval count.
     - Each approver rule has a stable key and one allowlisted type: `user`, `role`, `reporting_manager`, `organization_responsibility`, or `record_user_field`. One approval stage can mix multiple users, roles, departments (stored as organization responsibilities), and dynamic resolvers; duplicate resolved users count once and every resolved approver must approve.
     - `selfApprovalPolicy` is either `error` or `auto_approve`. Automatic self-approval is allowed only when the requester is the sole resolved approver and is always recorded in history.
     - `decisionPolicy` controls whether approval remarks are optional or required. Rejection and return remarks are always required. Return resumes from the returning stage; withdrawal is requester-only while pending.
     - `attachmentPolicy` is `disabled`, `optional`, or `required`, with allowlisted file types, maximum file size, maximum file count, and whether the policy applies to submission, approval, rejection, or return.
     - `slaPolicy` may be disabled or specify a positive duration and unit, reminder offsets, and an escalation-notification recipient rule. SLA expiry marks the active stage overdue and emits events; it never changes the decision state or approver assignment.
     - `eventPolicy` enables allowlisted Workflow lifecycle events for Automation Flow and may attach only approved workflow, stage, actor, source-record, decision, and snapshot-reference fields. Secrets and fields hidden by permission rules are excluded.
     - Configuration validation checks stable and unique keys, a published source module/form, at least one enabled reachable stage, valid stage order, valid typed conditions, at least one approver rule per reachable stage, resolver references, self-approval policy, attachment bounds, SLA bounds, record-lock fields, permission references, and event payload allowlists.
     - A valid draft may be checked and versioned before publishing. Publishing creates one immutable snapshot atomically; running instances never read mutable draft configuration.
     - Delegation and substitution chains are bounded, loop-checked, scope-checked at every hop, and retained in assignment authority evidence. Reassignment remains an explicit audited administrator command.
   - Phase 8 validation and error-handling baseline:
     - Check and publish responses use structured findings with stable `code`, `severity`, configuration `path`, safe user-facing `message`, and recommended `remediation`. Errors block publishing; warnings require review but do not block it.
     - Publishing is blocked for invalid or duplicate keys, unpublished or incompatible module/form references, no reachable enabled stage, invalid stage order or condition types, a reachable stage without an approver rule, invalid resolver or authority references, unsupported approval modes, invalid self-approval policy, invalid lock fields, attachment/SLA bounds, permission references, or event payload fields.
     - Submission validates authentication and permission, source record existence and version, source-domain/Form Builder rules, one unambiguous matching published workflow, entry conditions, no conflicting active request, record-lock availability, and every first applicable stage's eligible approvers before changing state.
     - No matching published workflow, multiple equally matching workflows, or a resolver producing no eligible approver stops submission and leaves the request editable as a draft. The response identifies the workflow/stage needing administrator attention without exposing hidden users, rules, or fields.
     - HTTP behavior follows the existing API conventions: `400` for malformed requests, `401` for authentication failure, `403` for permission or assignee denial, `404` for a visible missing resource, `409` for stale state, duplicate/conflicting requests, locks, or concurrency conflicts, `413` for attachment size limits, `422` for validly shaped requests that fail workflow/configuration rules, and `500` only for unexpected server failures.
     - Initial stable error families include `WORKFLOW_CONFIG_*`, `WORKFLOW_PUBLISH_*`, `WORKFLOW_SUBMIT_*`, `WORKFLOW_APPROVER_*`, `WORKFLOW_STATE_*`, `WORKFLOW_PERMISSION_*`, `WORKFLOW_ATTACHMENT_*`, `WORKFLOW_SLA_*`, and `WORKFLOW_CONFLICT_*`. API clients use codes, not message text, for behavior.
     - Runtime actions recheck the current instance, stage, assignment, actor, permission, required remark/attachment, and optimistic version inside the same transaction. Invalid transitions, non-assignee decisions, duplicate decisions, completed stages, and stale versions never mutate state.
     - Repeating the same command with the same idempotency key returns its original successful result. Reusing that key with different input returns a conflict. Simultaneous final approvals create only one stage-completion and one next-stage/completion event.
     - Record updates blocked by a pending approval return a conflict identifying the active workflow request and permitted next action, without leaking protected workflow details.
     - User messages are specific and actionable, for example `Unable to submit: Supervisor Approval has no eligible approver. Contact HR or the workflow administrator.` Internal SQL, stack traces, secrets, hidden field values, and inaccessible user identities are never returned.
     - Expected validation failures are not retried automatically. Retry is limited to transient infrastructure and Automation Flow delivery failures with bounded attempts and idempotency.
     - Allowed and denied security-sensitive actions, failed submissions, publish failures, conflicts, and transition attempts are audited with safe reason codes. Validation failure never creates a partial instance, assignment, decision, lock, or lifecycle event.
   - Phase 8 database design baseline:
     - `crm_workflow_definitions` stores stable workflow identity, mutable draft configuration JSON, lifecycle status, source module/form references, schema/current version numbers, the active published-version reference, ownership, and timestamps. `workflow_key` is unique; archived definitions are retained rather than reused.
     - `crm_workflow_versions` stores immutable published/checkpoint snapshots, version number, schema version, checksum, action/summary, and creator/publisher metadata. `(workflow_id, version_number)` and snapshot checksum constraints prevent duplicate or ambiguous versions.
     - `crm_workflow_version_stages` stores immutable searchable stage metadata for a version: stable stage key, order, condition/skip policy, `all` approval mode, self-approval policy, decision/attachment/SLA settings, and event settings. `(workflow_version_id, stage_key)` and `(workflow_version_id, stage_order)` are unique.
     - `crm_workflow_version_approver_rules` stores immutable resolver rules for each versioned stage, including stable rule key, allowlisted resolver type, resolver reference/configuration, optional authority condition, and deterministic rule order.
     - `crm_workflow_instances` stores the request key, workflow/version, source module and polymorphic source-record identifier, requester, current request status and stage, optimistic `lock_version`, submission/completion timestamps, and terminal reason metadata. Historical source references are not cascade-deleted.
     - `crm_workflow_instance_snapshots` stores append-only source snapshots for initial submission and every resubmission, with revision number, visible approval data JSON, source record version, checksum, creator, and timestamp. `(instance_id, revision_number)` is unique.
     - `crm_workflow_instance_stages` materializes each runtime stage with its versioned stage key/order, state, active snapshot revision, activation/completion timestamps, due/overdue fields, skip/auto-approval reason, and optimistic version. It never depends on mutable definition rows.
     - `crm_workflow_assignments` stores one immutable resolved approver assignment per active stage, including approver user, resolver type/rule, captured approver identity, status, authority-evaluation result, due/escalation fields, decision timestamp, and optimistic version. `(instance_stage_id, approver_user_id)` prevents duplicate assignments.
     - `crm_workflow_decisions` is append-only and records assignment/stage/instance, action, actor, captured actor identity, mandatory or optional remark, snapshot revision, request/assignment versions, idempotency key, and timestamp. Decision rows are never updated into a different decision.
     - `crm_workflow_attachments` stores protected attachment metadata, file bytes, uploader, purpose/action, content type, size, checksum, and optional instance/decision linkage; file bytes remain behind authenticated workflow access rather than being embedded in source-record or workflow JSON.
     - `crm_workflow_record_locks` has a unique `(source_module_key, source_record_id)` key and records the active instance, lock scope/field list, owner, and timestamp. The unique row prevents two active workflows from silently locking the same protected record.
     - `crm_workflow_events` is a transactional outbox containing a unique event key, event type/schema version, instance/stage/decision references, redacted payload JSON, delivery status, attempt count, next-attempt time, and delivery/error timestamps for idempotent Automation Flow consumption.
     - `crm_workflow_idempotency_keys` stores command scope, actor, idempotency key, request hash, result reference/response metadata, and expiry. `(scope, actor_id, idempotency_key)` is unique, and reuse with a different request hash is a conflict.
     - `crm_workflow_audit_logs` stores append-only allowed/denied configuration and runtime activity with safe reason code, workflow/instance/stage references, actor, target, result, redacted metadata, correlation ID, and timestamp.
     - Foreign keys use `RESTRICT` for versioned workflow/runtime history, `CASCADE` only for non-historical draft-owned configuration that cannot outlive its parent, and `SET NULL` for removable user accounts while captured identity fields preserve historical meaning.
     - Required indexes cover definition status/source module, version lookup, instance source/status/requester/current stage, approver inbox status/due date, stage status/due date, decision timeline, audit timeline/result, undelivered outbox attempts, idempotency expiry, and record-lock ownership.
     - Publishing runs in one transaction that validates and locks the definition, inserts the immutable version/stages/rules, advances the version pointer, and writes its audit/outbox evidence. Submission and every decision similarly lock the instance/stage/assignments, validate optimistic versions, write all state/history rows, and commit one outbox event atomically.
     - Sensitive snapshots, resolver configuration, remarks, attachments, and event payloads follow field permissions, least privilege, encryption/protected storage, retention, export, and deletion policies. Historical decisions are retained or cryptographically anonymized under an approved retention process, never silently rewritten.
     - Item 5 defines this logical schema only. Physical DDL, idempotent migration helpers, compatibility checks, and migration tests belong to Item 6.
   - Phase 8 database migration - complete:
     - The idempotent MySQL migration now creates all 16 `crm_workflow_*` tables for definitions, immutable versions, versioned stages and approver rules, instances and snapshots, runtime stages and assignments, append-only decisions, attachments, record locks, transactional events, idempotency keys, audit logs, delegation schedules, and assignment-transfer lineage.
     - Table creation follows dependency order, uses additive `CREATE TABLE IF NOT EXISTS`, and attaches the circular published-version reference only after definitions and versions exist.
     - Unique keys protect workflow/request/event identity, version and stage ordering, record locks, decisions, and idempotent commands. Foreign keys preserve versioned runtime history and retain captured identity when a user is removed.
     - `npm.cmd run db:migrate` completed twice consecutively on 2026-07-24, verifying that re-running the migration does not fail or duplicate schema objects.
     - `npm.cmd run test:smoke:workflow-migration` verifies the live database tables, workflow and stage status enums, required unique indexes, idempotency actor key, and critical published-version/runtime/event foreign keys.
     - This migration is additive and does not delete or rewrite existing CRM, Automation Flow, Dashboard Builder, or user data. Recovery should preserve the new empty/additive tables unless an explicitly reviewed rollback is required; automated destructive rollback is intentionally not provided.
     - Item 6 does not expose workflow APIs or execute workflow behavior. Repository and service implementation begins with later items.
   - Phase 8 workflow repository layer - complete:
     - `src/modules/workflows/workflows.repository.js` maps workflow definition, version, instance, stage, assignment, lock, decision, event, idempotency, and audit rows into stable application objects.
     - Definition persistence supports filtered listing, lookup, draft creation/update, immutable checkpoint/publish versions, normalized versioned stages and approver rules, published-version pointers, and atomic version numbering.
     - Runtime persistence supports atomic instance bundles containing the request, initial snapshot, materialized stages, resolved assignments, optional record lock, and initial outbox event.
     - Append-only snapshot, decision, event, idempotency, and audit functions preserve source/actor evidence without embedding business authorization rules in the repository.
     - Instance, stage, and assignment updates require the expected optimistic `lock_version`; stale writers update zero rows and cannot silently overwrite a concurrent decision.
     - Record-lock acquisition uses the database uniqueness constraint, record-lock lookup returns the active request context, and explicit release removes only the matching instance lock.
     - Approver-inbox queries are indexed by approver/status/due date. Instance timeline queries combine immutable decisions and lifecycle events in chronological order.
     - Transaction helpers guarantee commit/rollback/release, and compound persistence functions use one MySQL connection so versions and submitted instance bundles cannot partially persist.
     - `npm.cmd run test:smoke:workflow-repository` verifies definition/version persistence, a submitted request bundle, snapshot, active stage, assignment, inbox, record lock, approval decision, stale-write rejection, duplicate-decision protection, idempotency result lookup, audit/outbox persistence, timeline output, and complete cleanup.
     - Item 7 deliberately does not decide whether a configuration or transition is valid. Configuration validation and business authorization belong to the service/runtime items that follow.
   - Phase 8 workflow configuration service - complete:
     - `src/modules/workflows/workflows.service.js` provides the application-level create, read, list, update, clone, archive, check, checkpoint, publish, and immutable-version operations for workflow definitions.
     - Configuration is normalized into one versioned contract covering the source module, ordered stages, conditions, approver resolvers, decision/attachment policies, SLA settings, and lifecycle events.
     - Validation returns stable, path-specific findings with a code, severity, message, and remediation. Publishing is blocked when any error remains; a draft may still be saved and checked.
     - Publish validation verifies the source module and form layout are published, referenced fields exist, direct users are active, roles and organization nodes exist, and every enabled stage has a supported approver rule.
     - Conditions use allowlisted groups and operators rather than executable JavaScript or SQL. Phase 8 accepts only `all` approval, supported resolver types, explicit skip behavior, and the configured self-approval policy.
     - Workflow keys become immutable after creation, archived definitions cannot be edited or published, and checkpoint/publish operations create immutable numbered snapshots while publishing advances the active-version pointer atomically.
     - `npm.cmd run test:smoke:workflow-configuration` verifies structured invalid-draft findings, blocked publication, corrected configuration, immutable keys, check/checkpoint/publish/version history, cloning, archiving, and archived-edit protection.
     - Item 8 is the backend configuration service only. HTTP routes and the Admin Portal workflow designer remain later items.
   - Phase 8 approver resolution layer - complete:
     - `src/modules/workflows/workflows.approvers.js` resolves configured approver rules into active CRM users before runtime assignments are created.
     - Supported resolvers cover a specific user, every active user in a role, the requester's reporting manager, an organization responsibility, and a user reference stored in the submitted record snapshot.
     - User references may use stable numeric user IDs, staff IDs, or email addresses. Duplicate users returned by multiple rules are collapsed into one approver while retaining safe rule provenance.
     - Reporting-manager resolution reads a configurable requester custom-field key and defaults to `reporting_manager_user_id`. Organization responsibility can be restricted to an existing role and may include descendant organization nodes.
     - Inactive users are never eligible. Missing requesters, invalid organization nodes, unsupported resolver types, and rules producing no active user return stable `WORKFLOW_APPROVER_*` errors and do not silently bypass the stage.
     - Configured `auto_approve` identifies the requester's assignment for explicit automatic-decision evidence. A stage is marked eligible for stage-level automatic approval only when the requester is its sole approver; otherwise all remaining approvals are still required.
     - When self-approval is not configured, any rule resolving to the requester blocks resolution with `WORKFLOW_APPROVER_SELF_APPROVAL_BLOCKED`.
     - `npm.cmd run test:smoke:workflow-approvers` verifies all five resolver types, descendant/role organization filtering, ID/staff reference matching, inactive-user exclusion, missing-approver failure, configured self-auto-approval, and blocked self-approval.
     - Item 9 resolves identities only. Stage-condition evaluation, submission transactions, assignment persistence, decisions, HTTP APIs, and frontend experiences remain later items.
   - Phase 8 request tracking identity - complete:
     - Every workflow definition has a unique system-generated uppercase `request_prefix` and an atomic per-workflow `next_request_number`; administrators do not need to enter a prefix.
     - A submitted workflow instance receives one permanent, searchable `request_key` in the format `<PREFIX>-<six-digit number>`, for example `LEAVE-000001`.
     - The visible `request_key` is the support and audit reference. The numeric instance `id` remains an internal database primary key, while `source_record_id` continues to identify the originating module record.
     - Request numbers are allocated under a workflow-definition row lock inside the same instance-creation transaction. Concurrent submissions cannot receive the same number, and a transaction that fails before submission does not consume a number.
     - Successfully allocated numbers are never reset or reused after approval, rejection, return, withdrawal, cancellation, archival, or deletion under a retention process.
     - The globally unique `request_key` database constraint remains the final collision safeguard. Workflow prefixes are also unique, preventing two workflows from producing the same visible request ID.
     - Workflow repository smoke coverage verifies that the first generated request uses sequence `000001`; migration smoke coverage verifies the prefix/counter columns and unique prefix index.
     - The prefix is derived automatically from the workflow key. If the derived value already exists, the service appends a numeric suffix automatically while preserving the 20-character limit.
   - Phase 8 condition and stage-routing engine - complete:
     - `src/modules/workflows/workflows.conditions.js` evaluates the structured allowlisted condition contract without executing JavaScript, SQL, templates, or arbitrary expressions.
     - Nested `all` and `any` groups support equality, inequality, containment, prefix/suffix, numeric or date ordering, empty checks, and list membership against immutable submitted-record snapshots.
     - Entry conditions determine whether a published workflow matches a request. A false entry condition selects no stages and makes no state changes.
     - Enabled stage conditions produce an explicit `applicable`, `skipped`, or `blocked` routing result. Configured `skipWhenConditionFalse` records `WORKFLOW_STAGE_CONDITION_FALSE` and continues; a false condition without configured skipping stops routing.
     - Disabled stages are identified separately and never become approval assignments.
     - Approver authority conditions now filter approver rules against the same snapshot before identities are resolved. If every authority rule is inapplicable, the existing no-eligible-approver safeguard blocks submission.
     - Evaluation traces contain only configuration path, field key, operator, and match result, avoiding exposure of sensitive field values.
     - Malformed or unsupported runtime conditions fail with stable `WORKFLOW_CONDITION_INVALID` details rather than being treated as approval.
     - `npm.cmd run test:smoke:workflow-conditions` verifies nested groups, typed comparisons, dot-path fields, entry mismatch, configured stage skipping, blocking behavior, safe rejection of executable operators, and integration with approver resolution.
     - Item 10 evaluates routing only. Transactional submission, runtime stage materialization, decisions, HTTP APIs, and frontend experiences remain later items.
   - Phase 8 transactional request submission runtime - complete:
     - `src/modules/workflows/workflows.runtime.js` submits an accessible source-module record against one unambiguous matching published workflow and its immutable published version.
     - Submission loads the source record through the existing permission-aware module-record service, captures a normalized immutable snapshot, evaluates the entry and stage routes, and resolves every applicable stage's eligible approvers before writing runtime state.
     - No match, multiple matches, a non-skippable false stage condition, an invalid/inactive requester or approver, and an existing active record lock stop submission with stable `WORKFLOW_SUBMIT_*`, `WORKFLOW_APPROVER_*`, or `WORKFLOW_CONFLICT_*` errors.
     - One database transaction allocates the permanent readable request ID, inserts the instance and first snapshot, materializes skipped/auto-approved/active/waiting stages, creates assignments, records automatic self-approval decisions, acquires the record lock, appends lifecycle events and audit evidence, and stores the idempotent response.
     - Conditional false stages configured for skipping are persisted as `skipped` with `WORKFLOW_STAGE_CONDITION_FALSE`. The first applicable non-auto-approved stage becomes `active`; later applicable stages wait in order.
     - Active-stage SLA configuration produces a due timestamp when the stage is activated. Expiry still never implies approval.
     - The instance remains `pending` and points to its active stage. If all applicable stages are skipped or explicitly self-auto-approved, submission completes the instance as `approved` without retaining a record lock.
     - Repeating the same submission with the same actor, idempotency key, and request identity returns the original request. Reusing that key for different input returns `WORKFLOW_CONFLICT_IDEMPOTENCY_MISMATCH`.
     - The unique source-record lock protects concurrent submissions even if two callers pass the read-before-write check simultaneously; the losing transaction receives `WORKFLOW_CONFLICT_ACTIVE_REQUEST`.
     - `npm.cmd run test:smoke:workflow-submission` verifies `000001` request generation, immutable snapshot creation, configured stage skipping, active-stage/SLA materialization, approver assignment, record locking, submission/skip/start events, audit evidence, idempotent replay/mismatch, and duplicate-active-request rejection.
     - Item 11 implements backend submission only. Approve/reject/return/withdraw transitions, resubmission, HTTP APIs, and requester/approver frontend experiences remain later items.
   - Phase 8 transactional approver decisions - complete:
     - `src/modules/workflows/workflows.decisions.js` executes `approve`, `reject`, and return-for-correction decisions against the active stage and the actor's immutable assignment.
     - Every decision requires an authenticated active user who is assigned to the current active stage. Non-assignees, inactive users, already-decided assignments, non-pending requests, missing active stages, and stale optimistic versions are rejected without mutation.
     - Rejection and return always require remarks. Approval remarks follow the published stage policy.
     - The request, active stage, and actor assignment are locked and rechecked in one transaction before an append-only decision is written and state changes are applied.
     - `approvalMode: all` remains pending after a partial approval. The stage completes only when no pending assignments remain, then exactly one next waiting stage is activated with its SLA due time; if no stage remains, the request becomes approved.
     - Rejection marks the assignment/stage/request rejected, cancels the other pending assignments, releases the source-record lock, and appends `workflow.rejected`. Return performs the corresponding returned transition, preserves the returning stage key, releases the lock for requester amendment, and appends `workflow.returned`.
     - Final approval releases the source-record lock and emits `workflow.approved`. Stage completion and next-stage activation emit immutable stage-approved and stage-started events.
     - Accepted actions append audit evidence containing the prior and resulting request state. The decision, assignment/stage/request updates, events, audit row, lock release, and idempotent response commit or roll back together.
     - Repeating the same actor/key/input returns the original result. Changed input with that key, late decisions, and duplicate decisions return stable conflict errors.
     - `npm.cmd run test:smoke:workflow-decisions` verifies non-assignee denial, required rejection remarks, multi-approver `all` behavior, next-stage activation, final approval, rejection, return, record-lock release, immutable timeline decisions, and idempotent replay.
     - Item 12 implements approver decisions only. Requester withdrawal, correction/resubmission, authorized cancellation, HTTP APIs, and frontend experiences remain later items.
   - Phase 8 requester lifecycle and administrative cancellation - complete:
     - `src/modules/workflows/workflows.lifecycle.js` implements requester withdrawal, returned-request resubmission, and authorized administrative cancellation.
     - Only the original requester may withdraw a pending request or resubmit a returned request. Initial authorized cancellation requires an active administrator, a mandatory remark, and a published workflow version whose record policy allows cancellation.
     - Withdrawal and cancellation atomically cancel open stages and pending assignments, transition the request to its terminal state, release the source-record lock, and append lifecycle event, audit, and idempotency evidence without deleting earlier history.
     - Return continues to release the record lock so the requester can amend the source record. Resubmission reloads that record through the permission-aware module service and retains the instance's original immutable workflow version.
     - Resubmission re-evaluates entry/stage conditions from the returning stage onward, resolves eligible approvers again against the amended snapshot, and blocks if the record no longer matches, a non-skippable condition fails, or an approver cannot be resolved.
     - One new immutable snapshot revision is appended. Earlier decisions and snapshots remain unchanged; the permanent request ID is retained.
     - Downstream runtime stages are reconciled against the new route. Ineligible old assignments are cancelled, still-eligible assignments are reset with fresh authority evidence, new eligible assignments are added, and skipped/self-auto-approved/active/waiting state is rebuilt from the returning stage.
     - A new active stage restores the configured source-record lock and SLA due time. If all remaining stages skip or self-auto-approve, the existing request completes without retaining a lock.
     - Resubmission emits stage skip/auto-approval/start evidence plus `workflow.resubmitted`; self-auto-approval appends a new immutable decision tied to the new snapshot.
     - All three commands require idempotency keys. Same-key/same-input retries return the original result, while changed input returns a stable conflict.
     - `npm.cmd run test:smoke:workflow-lifecycle` verifies requester-only withdrawal, non-admin cancellation denial, admin cancellation, terminal lock release, return/amend/resubmit, snapshot revision 2, assignment reset, stage reactivation, lock restoration, and idempotent replay.
     - Item 13 completes the initial backend request lifecycle. HTTP APIs, SLA/reminder workers, Automation Flow delivery, permissions/audit presentation, and frontend experiences remain later items.
   - Phase 8 source-record protection integration - complete:
     - `src/modules/workflows/workflows.protection.js` enforces active workflow record locks on actual CRM mutation paths and returns the readable request ID in every lock conflict for support follow-up.
     - A `record` lock blocks all edits and deletion. A `fields` lock compares persisted and proposed values and blocks only changed approval-relevant fields, allowing unrelated fields to remain editable when configured.
     - Locked detail-table field keys are detected in submitted detail rows and cannot bypass field-level protection.
     - Generated-module updates are protected in both the service and repository layers. Repository enforcement also covers internal callers such as imports or Automation Flow that use the shared update/delete persistence functions.
     - Dedicated Customer and User update paths use the same protection guard, and Customer bulk deletion checks every selected record before deleting any row.
     - Conflicts return `409` with `WORKFLOW_CONFLICT_RECORD_EDIT_LOCKED` or `WORKFLOW_CONFLICT_RECORD_DELETE_LOCKED`, the lock scope, affected fields, and the permanent request key such as `LEAVE-000001`.
     - No administrator or background process silently overrides a pending approval lock. An authorized lifecycle action must first return, withdraw, reject, cancel, or complete the workflow using its audited transition.
     - The lock release and restoration behavior already verified by Items 12 and 13 now controls real module editability: returned records are amendable, resubmitted records are protected again, and terminal requests no longer block the source record.
     - `npm.cmd run test:smoke:workflow-protection` verifies unlocked editing, unrelated-field editing under a field lock, protected main/detail-field denial, whole-record edit denial, deletion denial, stable error details, and readable request references.
     - Item 14 protects backend mutation paths. HTTP workflow APIs and frontend disabled-field/lock-banner presentation remain later items.
   - Phase 8 workflow authorization and redaction - complete:
     - `src/modules/workflows/workflows.access.js` centralizes configuration, request-view, participant, source-module, and snapshot-field authorization.
     - Workflow creation, update, cloning, archival, checkpointing, and publishing require an authenticated administrator at the service boundary.
     - A request is visible only to an administrator, its original requester, or a user with an assignment on one of its stages. Knowing a readable request ID does not grant access.
     - Non-admin participants must also retain source-module view permission. Allowed and denied request-access decisions append workflow audit rows with stable safe reason codes.
     - Submission and resubmission now verify that every resolved approver can view the source module before any runtime state is written. An inaccessible approver produces `WORKFLOW_APPROVER_SOURCE_VIEW_DENIED` instead of an unusable assignment.
     - Decision processing rechecks the active approver's source-module visibility inside the decision transaction in addition to assignment ownership and active-user status.
     - Request views load the latest immutable snapshot, stages, and timeline only after authorization. Snapshot fields are filtered through the existing field-level view permissions.
     - Timeline actor identity is reduced to user ID, staff ID, and display name; email, role, resolver internals, hidden fields, and other private identity data are not exposed by the access view.
     - Stable denials distinguish unauthenticated access, non-participants, missing source visibility, non-assignees, cancellation denial, requester-only actions, and configuration denial.
     - `npm.cmd run test:smoke:workflow-access` verifies admin-only configuration, requester and approver relationships, stranger denial, source-view denial, field redaction, actor-identity minimization, and allowed/denied audit evidence.
     - Item 15 implements backend authorization and safe read models. Frontend role-aware navigation/actions remain later items.
   - Phase 8 authenticated Workflow HTTP APIs - complete:
     - `src/modules/workflows/workflows.routes.js` exposes the completed configuration, request runtime, decision, lifecycle, inbox, and safe request-read services under `/api/workflows`.
     - Every Workflow route requires a valid authenticated session. Definition listing, creation, detail, update, clone, archive, configuration check, checkpoint, publish, and immutable version reads additionally require the administrator role.
     - Request APIs provide participant-filtered request listing, permission-redacted request detail with stages and timeline, and the current user's approver inbox.
     - Submission, approval/rejection/return decisions, requester withdrawal, requester resubmission, and administrative cancellation are available as explicit command endpoints.
     - Every state-changing runtime command requires an `Idempotency-Key` HTTP header or matching request-body key. Missing keys return a stable `WORKFLOW_CONFLICT_IDEMPOTENCY_REQUIRED` error before runtime mutation.
     - Route inputs are validated with bounded schemas and use the existing stable Workflow error contract. Service-layer authorization, state checks, transaction boundaries, immutable history, record locks, and field redaction remain authoritative rather than being duplicated in controllers.
     - `src/app.js` mounts the router at `/api/workflows`; the complete backend smoke suite now checks unauthenticated denial and authenticated definition access instead of expecting the Phase 8 route to be absent.
     - `npm.cmd run test:smoke:workflow-api` verifies authentication, admin configuration CRUD, checks, checkpoints, immutable version reads, invalid-publish protection, cloning, archival, inbox/request listing, and mandatory idempotency.
     - Item 16 completes the initial backend HTTP API surface. Workflow configuration, requester submission/tracking, approver inbox/decisions, lock presentation, and timeline frontend experiences remain a later item.
   - Phase 8 Workflow frontend experience - complete:
     - The main CRM navigation now includes `Approval Requests` for authenticated users. The workspace separates request tracking from the current user's pending approval inbox, with status filtering, search, operational summary counts, and clear empty states.
     - Request detail presents the permanent readable request ID, current status, source-record reference, workflow version, relationship-aware actions, permission-redacted immutable snapshot, and an ordered decision/event timeline.
     - A vertical approval rail distinguishes waiting, active, approved, auto-approved, skipped, returned, rejected, and cancelled stages, including visible due dates and safe skip/reason text.
     - Requesters can submit an existing source record through an available published workflow, withdraw a pending request, and resubmit an amended returned request. Assigned approvers can approve, reject, or return for correction; administrators can cancel only where the published record policy permits it.
     - Runtime commands generate and send a unique `Idempotency-Key`. Rejection and return require remarks in the interface, and cancellation follows the backend's mandatory-remark and policy checks.
     - The Admin Portal now includes `Approval Workflow`. Its structured builder configures definition metadata, source module/form binding, whole-record or selected-field locking, snapshot fields, authorized cancellation, ordered enabled stages, multiple user/role references, allowlisted conditions, conditional skipping, self-auto-approval, approval-remark policy, and SLA duration.
     - Administrator actions cover create, edit, check with structured finding/remediation presentation, checkpoint, publish, clone, archive, reorder stages, and inspect the automatically allocated readable request prefix. Draft keys become read-only after creation and published requests retain their immutable starting version.
     - `/api/workflows/catalog` exposes only safe published workflow metadata to authenticated requesters. Draft configuration, resolver internals, version snapshots, and administrator controls remain protected by the existing admin-only definition endpoints.
     - The layout is responsive and uses a restrained approval-rail visual language consistent with the CRM. Mobile layouts collapse list/detail and builder rails into a single column with keyboard-accessible native controls.
     - `npm.cmd run test:smoke:workflow-frontend` verifies the delivered navigation, request/admin surfaces, command wiring, API integration, idempotency headers, approval/lifecycle controls, rail styling, and responsive contract. Workflow API and complete backend smoke suites remain green.
     - Browser loading and frontend initialization were verified without console errors on 2026-07-27. On 2026-08-09, Playwright additionally verified the real requester-to-approver journey: authenticated submission of a built-in Customer record, readable `-000001` request identity, approver inbox visibility, approval, terminal status/history rendering, and isolated fixture cleanup.
     - Item 17 delivers the initial frontend for the completed Phase 8 backend. SLA reminder/escalation workers and controlled reassignment/delegation remain deferred enhancements.
   - Phase 8 protected workflow attachments - complete:
     - Start nodes independently configure submission attachments, while each Approval node configures approval, rejection, and return attachments as disabled, optional, or required.
     - Administrators select an allowlist of PDF, JPEG, PNG, plain-text, DOCX, and XLSX files plus per-action size and count limits. Publishing fails closed for unsupported types, invalid actions, or limits above 25 MB and 20 files.
     - Request and decision commands accept multipart uploads. Required attachments are checked before mutation, and metadata, file bytes, uploader, purpose, decision linkage, and SHA-256 checksum commit in the same transaction as the workflow action.
     - Files are stored in the protected workflow attachment table rather than source-record JSON. They never update the source module unless a separate authorized Automation Flow or SQL process is explicitly configured to do so.
     - Only administrators, the original requester, and assigned workflow participants who retain source-module visibility can list or download files. Downloads are instance-scoped, force attachment disposition, and disable MIME sniffing.
     - The requester and decision modals expose policy-aware multi-file controls, and request detail lists authorized evidence with direct downloads. The real Playwright requester-to-approver journey verifies required submission/approval files and download behavior.
     - Executable and active-content formats are rejected. Each Start or Approval node may additionally require ClamAV malware scanning; scanning fails closed, infected or unscanned data is never downloadable, and the verdict is retained with the attachment.
   - Phase 8 optional SLA reminders, escalation, and workflow monitoring - complete:
     - SLA remains disabled by default and is configured independently on each Approval node. Enabled stages define a duration in minutes, hours, or days, one or more reminder offsets before the deadline, and whether overdue work is only marked or also emits an escalation notification.
     - `src/modules/workflows/workflows.sla.js` periodically scans active due stages. Deterministic event keys make every configured reminder and overdue escalation idempotent across polling, restarts, and concurrent attempts.
     - Reminder and escalation events use the existing transactional Workflow event outbox. Linked Automation Flows can send email, create tasks, call APIs, or perform other follow-up without coupling notification delivery to approval state changes.
     - When a deadline passes, the active stage receives its first `overdue_at` timestamp and pending assignments receive `escalated_at`. The immutable timeline records `workflow.reminder_due` and configured `workflow.escalated` events.
     - Administrators have a dedicated responsive Workflow Monitoring page showing open routes, due-soon work, overdue work, current stage, requester, approvers, source reference, deadline, and elapsed urgency. Search and request/SLA filters support operational review without opening every request.
     - Monitoring can open the protected request detail, queue an idempotent manual reminder, refresh current data, or request an immediate deadline scan. Non-administrators cannot access the organization-wide monitoring APIs or page.
     - The monitoring page uses the workflow request key as the support reference and never changes source-record data. Optional business-hour calendars exclude configured non-working weekdays and holiday dates, while bounded recurring overdue reminders use idempotent occurrence keys.
     - The admin-only Workflow Monitoring page separates `Live monitoring` from `History & reports`. History can be filtered by workflow, request status, requester, approver, requester department, submitted date range, and free-text request/workflow search.
     - Every report row opens the protected request detail and its immutable decision/event timeline, including reminders, escalation, delegation, reassignment, remarks, and recorded responses subject to the existing visibility rules.
     - Administrators can export the current filtered result set through the protected CSV endpoint. The export is generated from the same monitoring query as the screen and is capped at 500 requests per export.
   - Phase 8 built-in notifications and optional approval email - complete:
     - Workflow lifecycle events automatically create idempotent internal notifications for requesters, active approvers, delegated approvers, and reassigned approvers. Automation Flow configuration is not required for standard workflow notifications.
     - Every signed-in user has a top-right notification centre with an unread badge, unread-only filter, mark-one/mark-all-read controls, timestamps, and protected links back to the referenced approval request.
     - Admin Portal includes an admin-only Email Settings workspace for Gmail test accounts, Google Workspace SMTP Relay, Microsoft 365 Graph, and generic SMTP. Provider-specific grey examples explain the applicable host, port, sender, account, App Password, SMTP password, or Entra application fields.
     - SMTP credentials are encrypted at rest with AES-256-GCM using `EMAIL_SETTINGS_ENCRYPTION_KEY` (falling back to `JWT_SECRET` for local development), are never returned to the browser, and remain separate from immutable workflow definitions.
     - Approval nodes can optionally enable email, subject, and message templates using `{{requestId}}`, `{{workflowName}}`, `{{stageName}}`, and `{{event}}`. Internal notifications remain automatic whether email is configured or not.
     - Email sending occurs after the workflow transaction through the existing outbox dispatcher. A disabled or failing provider is logged and never blocks submission, approval, rejection, return, reminders, or escalation.
   - Phase 8 optional approval delegation and controlled reassignment - complete:
     - Delegation is opt-in. With no active matching schedule, published Workflow approver resolution behaves exactly as configured and no additional setup is required.
     - The administrator-only Approval Delegation page manages active, scheduled, expired, and cancelled coverage periods. Each schedule identifies the original and replacement users, effective dates, optional workflow, role, and department scopes, and mandatory reason.
     - Active schedules are evaluated after normal approver resolution. The replacement must remain active and retain source-module visibility; the immutable assignment authority evidence preserves the configured original approver, delegation ID, and reason.
     - Self-delegation and direct overlapping delegation loops are rejected. Delegation is one hop only and never silently chains replacement schedules.
     - Workflow Monitoring provides one-request reassignment for active pending assignments. Administrators select the current assignment and an eligible active replacement, then provide a mandatory reason.
     - Reassignment locks and rechecks the assignment, cancels rather than deletes the original, creates a new pending assignment with the same deadline, and writes an immutable transfer, audit row, and `workflow.assignment.reassigned` outbox event in one transaction.
     - `workflow.assignment.delegated` and `workflow.assignment.reassigned` are available to Automation Flow for notifications and follow-up. Request IDs, source records, earlier decisions, and published Workflow configuration remain unchanged.
     - Dedicated migration tables retain delegation schedules and assignment-transfer lineage. Idempotency prevents a retried reassignment command from creating another replacement.
   - Phase 8 Approval Workflow to Automation Flow delivery - complete:
     - Automation Flow supports `workflow_event` as a published trigger, configurable by approval workflow, lifecycle event, optional stage key, and optional connection/outcome key.
     - A background dispatcher claims due `crm_workflow_events`, enriches them with immutable request context, runs matching published Automation Flows, and records delivered or bounded-retry failure state without rolling back the approval decision.
     - `crm_action_flow_executions.trigger_event_key` and its per-flow unique index prevent duplicate execution when the same outbox event is polled or retried.
     - Workflow Builder shows linked Automation Flows so administrators can see which follow-up automations are attached to a definition.
   - Phase 8 visual Approval Workflow Builder - complete:
     - Approval Workflow configuration now opens as a free-positioned canvas with Start, Approval, and End nodes instead of only a stacked stage form.
     - Administrators can add and drag nodes, connect arbitrary visible branches, select and configure connection labels/outcomes, pan the canvas, zoom, and fit the route into view.
     - `Condition met` and `Condition not met` connections include structured `all`/`any` matching with one or more typed field/operator/value rules; those rules persist with the visual edge.
     - Condition field selectors are populated from the workflow's selected Source module and Request form. Published form layout visibility/order is respected, standalone Form Builder definitions are supported, and unavailable saved keys are identified instead of silently discarded.
     - Selecting an Approval node opens a side inspector for approver resolution, conditions and skip behavior, self-approval, mandatory approval remarks, enablement, and SLA configuration.
     - Canvas node positions and connection metadata persist in `builderGraph`; Approval nodes serialize into the existing Phase 8 `stages` contract and the published graph is now executable by the authorization runtime.
     - Start-to-Approval-to-End routes, non-linear branches, and paired `condition_met`/`condition_not_met` connections now select the runtime stage path from the immutable submitted snapshot. The selected connection key/outcome is retained in workflow events and timeline data.
     - Publication fails closed for malformed, ambiguous, cyclic, disconnected, unreachable, duplicate-stage, or incomplete conditional graphs. Older published versions without `builderGraph` retain their ordered-stage behavior.
     - Workflow source-record loading supports both generated modules and the built-in Customers/Users modules, preserving module-view authorization while adapting their dedicated storage into the same immutable workflow snapshot contract.
     - `npm.cmd run test:smoke:workflow-graph` verifies executable routing, ambiguity and cycle protection; the Playwright request journey verifies the built-in Customer adapter through the visible UI.
   - Phase 8 node-specific workflow forms - complete:
     - The workflow-level Request form is now the default form rather than the only presentation used throughout a request.
     - Start, Approval, and End nodes expose auto-populated form selectors in their right-side inspectors. Administrators choose readable form names; technical form keys are stored automatically and are never manually entered in the Workflow Builder.
     - Each node can inherit the default form, use all source-module fields, or select another compatible module/standalone form. Standalone choices are limited to forms whose stable field keys belong to the selected source module.
     - Saving captures the node form name, form key, presentation mode, inheritance flag, and ordered field keys inside `builderGraph`. Published workflow versions therefore retain the selected node presentation even if the underlying Form Builder layout later changes.
     - Requesters use the Start-node presentation while a request is active or returned; assigned approvers use the active Approval-node review presentation; terminal requester views may use the End-node result presentation.
     - Runtime snapshot visibility is the intersection of the selected node's captured fields and existing module field-view permissions. A node form cannot grant access to a field that the current user is not permitted to view.
     - Node presentation controls stage-specific review visibility; structured approver inputs and optional source-field writes are provided by the following response-form item.
   - Phase 8 approver response forms and field mapping - complete:
     - Every Approval node can select an optional compatible Response form from the right-side inspector; technical form keys and field schemas are captured automatically with the immutable workflow version.
     - Response fields inherit labels, types, options, and required status from Form Builder. The decision modal renders the configured structured inputs before the approver submits Approve, Reject, or Return.
     - Required response fields are enforced for approval, unknown response keys are rejected, and responses participate in the idempotency request hash so the same key cannot replay different answers.
     - Each response field can remain in protected decision history or map to an existing main source-record field. Source mappings require the approver's field-edit permission and execute inside the same database transaction as the decision, bypassing the active workflow lock only through this narrowly scoped authorized path.
     - `crm_workflow_decisions.response_json` stores the immutable structured response. The migration adds the JSON column idempotently to existing installations.
     - Requesters and unrelated approvers do not receive protected decision-response values in request timelines. The administrator and the approver who recorded the response may inspect them.
     - Response values are excluded from Automation Flow by default. Administrators must explicitly enable `Include this value in Automation Flow events` per field; events always expose safe response field names for diagnostics.
     - Response mappings can update permitted main JSON-backed fields or append a permission-checked row to a configured detail table. Attachment-type response fields are uploaded through the protected workflow attachment store and recorded as immutable response metadata.
   - Phase 8 deferred enhancement closure - complete:
     - `all`, `any`, and threshold-based `quorum` decisions share one deterministic stage-completion function. Pending assignments are cancelled after an any/quorum threshold is reached; rejection becomes terminal only when the configured threshold can no longer be reached.
     - Active delegation resolves through up to ten scoped hops. Repeated delegation records, user loops, excessive depth, inactive users, and loss of source-record access fail closed before assignment.
     - SLA policies may count elapsed time or configured UTC business hours, weekdays, and holiday exclusions. Recurring overdue reminders are optional, bounded to 100 occurrences, and remain notification-only.
     - Attachment malware scanning uses ClamAV INSTREAM through `WORKFLOW_CLAMAV_HOST`, `WORKFLOW_CLAMAV_PORT`, and `WORKFLOW_CLAMAV_TIMEOUT_MS`. The option is disabled by default; enabling it without an available scanner rejects the upload without advancing the workflow.
     - `npm.cmd run test:smoke:workflow-phase8-completion` verifies business-calendar arithmetic, scanner clean/infected/unavailable verdicts, any/quorum outcomes, multi-hop substitution, and bounded recurring overdue reminders.
     - The same suite runs 25,000 mixed any/quorum evaluations as a bounded performance guard. Database-backed workflow smoke suites continue to cover transactional and authorization behavior.
8.5. Phase 8.5: Configurable Application Menu - complete
   - Admin Portal now includes a dedicated Menu Configuration studio for the shared application sidebar.
   - Administrators can add menu groups and entries, drag entries to reorder or place them in groups, choose labels and icons, and publish a versioned navigation configuration.
   - Destinations are selected from registered core pages and published modules. External destinations are optional, must use HTTPS, open with an external-link indicator, and use safe browser link attributes.
   - Visibility can target any combination of roles, individual users, and departments. Empty visibility rules mean everyone who already has permission; menu visibility never grants or replaces backend authorization.
   - Stable menu keys are generated automatically. The Admin Portal destination is protected from disabling, retargeting, removal, or restrictive visibility so administrators cannot lock themselves out; at runtime it is presented as a fixed admin-only action in the account dropdown instead of a duplicate sidebar entry.
   - Newly published modules with menu visibility enabled are automatically added to the configured default group (or the top level) when they are not already represented.
   - Draft, validation, publish, published-version history, restore-to-draft, reset-to-safe-default, and role-preview controls are available. The layout adapts to smaller screens by stacking the tree and inspector.
   - Runtime navigation is served from the published menu; archived or unavailable modules are omitted. Top-level entries and group headers share one alignment, group headers expose an open/closed chevron, and the frontend dashboard destination is labelled `Homepage` while retaining the existing `dashboardPagesView` route and Dashboard backend terminology.
   - If no menu has been published, Customers, Users, Homepage, Approval Requests, Workflow Monitoring, Approval Delegation, and Admin Portal remain the safe default entries.
   - Persistence uses `crm_menu_definitions` and immutable `crm_menu_versions`; implementation is under `src/modules/menu/` and the UI is in the Admin Portal.

8.6. Phase 8.6: User Account and Profile Settings - complete
   - The shared header now places a user avatar and identity control beside the notification bell. Sign out has moved from the sidebar into the account dropdown, alongside an Admin Portal action shown only to administrators.
   - The dropdown provides direct access to Profile, Security, and Language & Region settings through a dedicated responsive Account Settings page with left-aligned section navigation and consistently aligned form controls.
   - Users can update their display name, phone number, job title, and profile photo. JPG, PNG, and WebP uploads are limited to 5 MB and validated by file signature, not only browser-provided MIME type.
   - Email, staff ID, role, department, and account status remain visible but administrator-controlled; self-service APIs cannot modify them.
   - Password changes require the current password, confirmation, and a different new password of at least eight characters. Changing a password increments `auth_version`, invalidating all previously issued sessions and requiring a fresh sign-in.
   - Language, time zone, date format, and time format preferences are stored per user. English is the initial interface language; the preference model is ready for future translated bundles.
   - Profile photos remain private database content and are returned only by an authenticated, non-cacheable endpoint. Initials are shown when no photo exists.
   - Implementation is under `src/modules/account/`; account preference and photo fields are maintained in both the migration and canonical schema.

9. Phase 9: AI Agent Assistant - planned
   - Add an AI assistant panel to the admin portal for form and workflow generation.
   - Support natural-language prompts to suggest form fields, workflow steps, and validation rules.
   - Use backend prompt service to map user intent to platform concepts (modules, field types, approvers, conditions).
   - Show AI-generated suggestions with a preview and review/edit step before saving.
   - Parse and validate AI output strictly against existing schema before persistence.
   - Start with prompt-driven suggestions; add fine-tuning or templates if needed later.
   - Later add domain examples, knowledge base integration, and user feedback loops.
10. Phase 10: HCM Foundation and Core HR - planned
   - Expand the CRM toward an ERP by introducing Human Capital Management as a separate product domain, with payroll as the primary business focus.
   - Keep system user accounts and employee records separate but linkable. An employee may exist without login access, and a system user may exist without an employment relationship.
   - Add an effective-dated employee master covering legal and preferred identity, contact and emergency-contact details, employment status, employment type, hire and service dates, probation, confirmation, transfer, promotion, termination, rehire, and employment history.
   - Link employees to company/legal entity, organization unit, department, position, job, grade, work location, cost centre, reporting manager, and workforce hierarchy.
   - Store bank-payment instructions, tax identifiers, statutory-registration details, dependants, beneficiaries, and employee documents with appropriate masking and expiry reminders.
   - Provide HR administrator, employee self-service, and manager self-service experiences with role-appropriate visibility and actions.
   - Reuse the existing organization hierarchy, Form Builder, approval workflows, permissions, automation, audit logging, dashboards, import/export, and `staff_id` linkage where appropriate.
   - Use Approval Workflow for controlled hire, employee-data change, transfer, promotion, probation confirmation, termination, rehire, document exception, and other organization-defined HR decisions.
   - Apply effective dating to employment and compensation changes so payroll and compliance reports reproduce the facts that were valid for a historical pay period.
11. Phase 11: Time, Attendance, Scheduling, and Leave - planned
   - Configure work calendars, workweeks, shifts, rosters, rest days, public-holiday calendars, and employee schedule assignments by company and location.
   - Capture clock-in/out events, timesheets, breaks, lateness, early departure, absence, overtime, attendance corrections, and manager approvals.
   - Support leave types, eligibility, entitlement, accrual, proration, carry-forward, expiry, encashment, half-day or hourly leave, attachments, and approval workflows.
   - Maintain leave balances and attendance exceptions with complete adjustment history rather than overwriting prior balances.
   - Use Approval Workflow for leave, overtime, timesheet, attendance-correction, roster-change, and period-reopening requests, including conditional HR or payroll approval where policy requires it.
   - Lock approved attendance and leave inputs by payroll period while providing a controlled correction and reopening process.
   - Keep external biometric devices, scheduling systems, and attendance providers behind reusable integration interfaces.
12. Phase 12: HCM Payroll - planned and prioritized
   - Select one initial payroll jurisdiction before implementation and document its tax, statutory contributions, mandatory leave, payslip, payment, reporting, rounding, retention, and year-end requirements.
   - Build a country-extensible payroll engine with separately versioned jurisdiction rule packs rather than embedding country rules directly in the shared calculation engine.
   - Configure legal entities, pay groups, payroll calendars, pay frequencies, cut-off dates, currencies, rounding rules, and employee payroll assignments.
   - Maintain effective-dated salary and compensation history, recurring and one-off earnings, allowances, bonuses, commissions, overtime, reimbursements, benefits in kind, deductions, loans, advances, garnishments, employer contributions, and taxable treatments.
   - Calculate proration for joiners, leavers, salary changes, unpaid leave, and mid-period transfers.
   - Support gross-to-net calculation, retroactive pay, back pay, adjustments, off-cycle payroll, final pay, termination payments, and controlled recalculation.
   - Provide payroll input validation, exception reporting, variance analysis, control totals, employee-level calculation explanations, and pre-payroll reconciliation.
   - Use Approval Workflow for payroll input exceptions, payroll run review, final approval, release, reopening, off-cycle runs, and sensitive configuration changes.
   - Enforce maker-checker segregation and approval-authority limits between payroll preparation, review, approval, release, reopening, and configuration.
   - Lock finalized payroll periods and preserve immutable calculation results, rule versions, inputs, overrides, approvals, and audit history.
   - Generate payslips, bank or payment files, statutory reports, accounting journals, cost-centre postings, payroll registers, and year-end outputs.
   - Support secure employee payslip access and controlled bulk delivery without exposing one employee's payroll information to another.
13. Phase 13: Benefits and Compensation - planned
   - Configure benefit plans, providers, eligibility rules, coverage levels, enrolment windows, employer and employee contributions, waiting periods, and effective dates.
   - Support medical, insurance, pension, flexible-benefit, allowance, and other organization-defined plans.
   - Maintain dependant and beneficiary coverage, life-event changes, enrolment history, and payroll deduction or taxable-benefit integration.
   - Use Approval Workflow for benefit enrolment and change requests, eligibility exceptions, claims where implemented, and compensation-review proposals.
   - Add benefits claims directly or through provider integrations after core enrolment is stable.
   - Configure job grades, salary structures, pay ranges, compensation components, increment cycles, salary-review budgets, proposals, approvals, and employee statements.
14. Phase 14: Recruitment, Onboarding, Probation, and Offboarding - planned
   - Add manpower requisitions, position and budget approval, job postings, candidate profiles, applicant tracking, interview scheduling, assessments, selection decisions, and offer approval.
   - Convert an accepted candidate into an employee record without duplicate data entry while retaining appropriate recruitment history and consent controls.
   - Use Approval Workflow for manpower requisitions, position and budget approval, candidate selection, offer approval, onboarding exceptions, probation outcomes, resignation or termination, and offboarding clearance.
   - Configure pre-employment checks, document collection, onboarding checklists, orientation, policy acknowledgement, equipment, workspace, account provisioning, and assigned owners.
   - Track probation objectives, reviews, extensions, confirmation decisions, and reminders.
   - Support resignation, termination, final-day changes, clearance, access removal, asset return, knowledge transfer, exit interviews, final payroll inputs, and rehire eligibility.
15. Phase 15: Learning, Performance, Skills, and Talent - planned
   - Maintain skills, competencies, proficiency levels, certifications, licences, expiry dates, and employee development profiles.
   - Configure course catalogues, sessions, trainers, enrolment, attendance, completion, assessment, cost, learning history, and mandatory-training reminders.
   - Use Approval Workflow for employee training requests, manager or budget approval, certification exceptions, performance-review moderation, and development-plan approval where required.
   - Support goals, competencies, review cycles, self-assessment, manager assessment, moderation, acknowledgement, development plans, and performance history.
   - Add succession planning, talent pools, career paths, and workforce planning after the core learning and performance records are stable.

### HCM And Payroll Delivery Principles

- Payroll is the priority, but Core HR, effective-dated employment, compensation, attendance, and leave provide the trusted inputs required for correct payroll.
- Use the existing low-code Module Builder, Form Builder, generated pages, permissions, import/export, dashboards, and Automation Flow for configurable HCM records and administrative processes wherever they meet the requirement.
- Use the Phase 8 Approval Workflow as the shared decision engine for Core HR, recruitment, onboarding, offboarding, training, benefits, performance, compensation, leave, attendance, overtime, and payroll approvals instead of creating separate approval runtimes for each HCM module.
- Keep responsibilities separated: HCM modules own business records, Approval Workflow owns human decisions and decision history, Automation Flow owns follow-up actions and integrations, and specialist engines own entitlement, eligibility, attendance, and payroll calculations.
- Start with one country-complete payroll implementation. Confirm the initial jurisdiction during discovery instead of assuming statutory rules, then add other countries through versioned rule packs.
- Treat employee identity, employment, job assignment, compensation, benefits, attendance, leave, and payroll results as related but separate domains with explicit effective dates and ownership.
- Apply privacy by design: field masking, least-privilege access, consent where applicable, retention controls, audit trails, encryption, and segregation of HR, payroll preparer, approver, payment releaser, employee, and manager duties.
- Never silently overwrite finalized payroll results. Corrections must use controlled reopening, adjustment, retroactive, or off-cycle processes with reasons and audit history.
- Reconcile payroll through input totals, gross-to-net totals, variance thresholds, payment totals, statutory liabilities, and accounting journals before release.
- Make statutory rules and rates configurable, versioned, testable, and attributable to their effective dates and source authority.
- Include multi-company, multi-location, multi-currency, localization, and integration boundaries in the architecture even when the first release supports only one jurisdiction.

### HCM Low-Code, Approval Workflow, And Specialist-Engine Boundaries

Recommended shared processing model:

```text
Low-code HCM module and form
        |
        v
Approval Workflow: human decision, authority, comments, and audit history
        |
        v
Automation Flow: notifications, tasks, record updates, and integrations
        |
        v
Specialist HCM engine where required: entitlement, eligibility, attendance, or payroll calculation
```

- `Core HR`: low-code can manage employee-facing forms, supporting records, checklists, documents, and configurable HR requests. Approval Workflow governs hire, change, transfer, promotion, confirmation, termination, and rehire decisions. The effective-dated employee and employment system of record remains a dedicated HCM domain.
- `Recruitment`: low-code can manage candidates, applications, interviews, assessments, offers, and hiring stages. Approval Workflow governs requisitions, position or budget approval, selection, and offers. Automation Flow sends reminders and creates onboarding work.
- `Onboarding and offboarding`: low-code can manage checklists, documents, equipment, accounts, owners, deadlines, clearance, and status. Approval Workflow governs exceptions, probation outcomes, resignation or termination, and final clearance. Automation Flow assigns tasks and invokes downstream integrations.
- `Training and learning`: low-code can manage courses, sessions, enrolment, attendance, certifications, expiry, and learning history. Approval Workflow governs training requests, budgets, exceptions, and required acknowledgements.
- `Benefits`: low-code can manage plans, enrolment requests, dependants, beneficiaries, evidence, and employee selections. Approval Workflow governs enrolment changes and exceptions; a specialist benefits service determines complex eligibility, contributions, taxable treatment, and claims.
- `Performance and compensation`: low-code can manage goals, review forms, ratings, comments, development plans, salary proposals, and review-cycle records. Approval Workflow governs moderation, acknowledgement, budgets, salary proposals, and final decisions. Dedicated effective-dated compensation records feed payroll.
- `Leave, attendance, timesheets, and overtime`: low-code can manage requests, manual inputs, corrections, evidence, and status. Approval Workflow governs requests and exceptions. Dedicated engines calculate accruals, balances, schedules, qualifying hours, premiums, and payroll-period locks.
- `Payroll`: low-code can manage input collection, exception queues, review screens, approvals, dashboards, and controlled output access. Approval Workflow governs review, approval, release, reopening, off-cycle runs, and configuration changes. A dedicated payroll engine performs gross-to-net, statutory, proration, retroactive, reconciliation, finalization, payment, and year-end processing.

### Recommended Payroll-First HCM Delivery Order

1. Confirm the initial country, legal entities, workforce policies, statutory obligations, payroll controls, and accounting requirements.
2. Implement the Core HR employee master, employment lifecycle, organization/job assignments, sensitive-data permissions, and effective dating.
3. Implement payroll configuration, compensation components, employee payroll assignments, and versioned country rule packs.
4. Implement leave, attendance, overtime, timesheets, and approved payroll-input cut-offs.
5. Implement gross-to-net calculation, proration, retroactive pay, off-cycle pay, final pay, and employee-level calculation explanations.
6. Implement validation, exception handling, variance reporting, maker-checker approval, locking, reopening, and immutable audit history.
7. Implement payslips, payment files, accounting journals, payroll registers, statutory reports, reconciliation, and year-end processing.
8. Implement employee and manager self-service, notifications, dashboards, secure document delivery, and operational reporting.
9. Add benefits and compensation-review capabilities.
10. Add recruitment, onboarding, probation, offboarding, learning, performance, skills, succession, and workforce planning.

### Extra Platform Features To Add

- Audit logs for admin configuration changes and record changes.
- Module templates for common business objects.
- Trash/archive instead of hard delete for configurable modules.
- Lookup fields and related records.
- Advanced import/export profiles per module.
- Low-code dashboard builder with SQL view/query data sources and reusable chart widgets.
- Report builder and dashboard widgets.
- Field-level permissions are complete; separate record-scope rules are not required.
- Full-database backup and verified disaster-recovery restore procedures. Form Builder configuration version history and snapshot recovery are implemented.

### Dashboard Builder Direction

Dashboards should be stored as low-code configuration in the database, not generated into source files. The source code should provide the stable dashboard engine, chart renderer, guarded query runner, and API endpoints. Admin-created dashboards, widgets, chart types, SQL data sources, column mappings, filters, and permissions should live in database configuration and be exportable/importable later.

Recommended dashboard data flow:

```text
SQL view or guarded SELECT query
  |
  v
Backend dashboard API
  |
  v
JSON rows
  |
  v
Frontend chart widget
```

Example ring/donut chart source:

```sql
SELECT status AS label, COUNT(*) AS value
FROM customers
GROUP BY status;
```

Example line chart source:

```sql
SELECT
  DATE_FORMAT(created_at, '%Y-%m') AS label,
  COUNT(*) AS value
FROM customers
GROUP BY DATE_FORMAT(created_at, '%Y-%m')
ORDER BY label;
```

Dashboard widget config should map result columns into chart fields:

```json
{
  "type": "donut",
  "title": "Customers By Status",
  "dataSourceKey": "customers_by_status",
  "labelField": "label",
  "valueField": "value"
}
```

Dashboard ownership boundaries:

- MySQL remains the source of truth for CRM records, module records, dashboard SQL views, guarded `SELECT` data sources, pivot-style aggregations, widget configuration, filters, permissions, and export/import configuration.
- The Express backend owns the guarded dashboard API, permission checks, SQL validation, query execution, and JSON result shaping.
- The frontend owns the low-code dashboard builder, widget layout, chart/table/pivot rendering, and user-facing refresh states.
- Convex, if added later, should start as a realtime side channel for notifications, activity events, import/job status, user presence, and dashboard refresh signals. It should not initially duplicate full CRM tables or dashboard result rows.

Recommended Convex event flow for dashboards:

```text
CRM write/import/automation-flow event saved in MySQL
  |
  v
Express emits lightweight event to Convex
  |
  v
Convex stores notification/activity/refresh event
  |
  v
Online frontend receives realtime signal
  |
  v
Frontend reloads affected widget data from Express/MySQL
```

Convex event documents should stay small, for example `customer.created`, `import.finished`, `action_flow.failed`, `dashboard.widget_stale`, or `notification.created`. They should reference source module keys, record IDs, actor IDs, dashboard/widget keys, and timestamps instead of copying whole customer/module records.

Build order:

1. Add dashboard data source configuration.
2. Add dashboard and widget configuration tables.
3. Add a guarded backend endpoint that runs saved read-only data sources.
4. Add frontend dashboard page and reusable widget renderer.
5. Start with number card, ring/donut, line, bar, and table widgets.
6. Add filters, permissions, export/import, version history, and rollback.
7. Add Convex only after the SQL dashboard engine exists, starting with realtime notifications and refresh signals rather than moving dashboard data storage.

### Local Authentication Direction

The app uses Express, MySQL, bcrypt password hashes, and custom JWT bearer tokens. This is the intended authentication model for the in-house CRM.

Local auth boundaries:

- The MySQL `users` table owns CRM user identity, staff IDs, roles, status, permissions, and custom user fields.
- `staff_id` is the stable internal staff/business identifier and is generated automatically when admin leaves it blank.
- Email and password are used for local sign-in.
- Password hashes stay in `users.password_hash` and are never exposed through the API.
- JWTs are signed by the backend with `JWT_SECRET` and verified locally on protected API requests.
- Setting a user `status` to `inactive` blocks access without deleting the user record.

Keep maintaining these user fields in MySQL:

- `staff_id`: internal staff/business identifier for reports, HR references, and user search.
- `email` and `name`: CRM login/display/search fields.
- `role`: CRM authorization level.
- `status`: local CRM access switch.
- `custom_fields`: user profile fields created by Form Builder.

### Form Builder Conventions

- `Data Key` is the stable internal field identifier used by API payloads, imports, JSON storage, formulas, reports, and Automation Flow conditions. A field label can be renamed later, but the data key should stay stable so existing records and automations do not break.
- New fields are appended to the end automatically; admins do not manually maintain display order in Phase 1.
- Fields can be placed on the `Main Table` or a `Detail Table`.
- Detail table names are generated from the module key, for example `customer_dt1`.
- Detail-table records include their own `id` and a `mainid` field that maps each detail row back to the main record.
- `Dropdown Options` only applies to `Dropdownbox` fields.
- `Browser Buttons` are reusable lookup definitions. Form Builder `Browser Button` fields reference a browser definition instead of storing source-table details directly on every field.
- Browser Buttons are grouped by module. A single module, such as `customers`, can contain browser buttons for its main table and detail tables without crowding the source list.
- Browser Button `Search Fields` and `Display Columns` use checkbox lists. Only checked fields are saved and shown by the lookup configuration.
- Browser Button `SQL WHERE` stores a condition fragment such as `status = 'active'`; full SQL statements, comments, and statement separators are rejected.
- Browser Button fields use authenticated lookup endpoints to search and select rows from reusable browser definitions. The selected value is stored in the configured field.
- `Add Field` is for adding one field at a time.
- `Batch Edit` opens a field-management workspace that shows fields by `Main Table` and detail-table tabs, supports editing existing fields, adding new rows, and adding new detail table tabs with generated names such as `customer_dt1`.
- Existing field keys and database field names stay read-only in Batch Edit so saved data mappings remain stable.
- Locked/system fields keep protected type/table settings, but formula settings and common display flags can still be saved.
- `Field Properties` opens a read/write properties grid for the selected form. It saves display, editability, required, and disable-manual-input flags; customer/user forms enforce locked and manual-input-disabled fields.
- `Formula` opens the Formula Builder. It supports field variables, basic operators, built-in functions, reusable custom helper functions, dependency checks, circular-reference detection, and SQL capture text. The SQL capture tab stores notes/configuration only; execution is planned for a later guarded backend phase.
- `Form Design` opens a right-side drawer above Form Builder. It has Add, Edit, and Detail form types, form-preview field controls, drag/drop ordering, a hidden-field palette, copy-layout controls, Save Draft, and Publish. Draft and published layouts are stored on the backend; the published Add/Edit layouts drive the actual customer and user forms. Hidden fields can be dragged from the side palette onto the form, which turns on `Show In Form`; visible fields can be dragged back to the palette to hide them.
- Double-clicking a field opens Formula Builder for that field. Right-clicking a field opens its field configuration. Add/Edit Field opens above Form Design without closing the drawer.
- Form Design separates main fields from detail-table fields. Detail-table names are shown in their own lower area with a table-style preview; renaming the actual detail table key needs backend migration safeguards before it should be editable.
- Formula-enabled fields are treated as read-only calculated fields in customer main forms.
- Formula expressions reference fields with `{fieldKey}` syntax. Saving formula configuration rejects unknown field references, direct self-references, and circular chains such as `fieldA -> fieldB -> fieldA`.
- Form Builder bulk duplicate/delete/archive controls are for configurable field definitions. Delete is blocked for fields with saved data, while archive hides a field but keeps its mappings and stored values.
- Detail-table row duplicate/delete is for data entry rows inside Add/Edit Customer, not for Form Builder fields.
- Detail-table row delete keeps one blank row when every row is selected, so the table remains ready for input.

### Form Builder and Workflow
- The form builder is shared for both regular module forms and workflow forms.
- The Add button can let admins choose whether they are creating a module form or a workflow form.
- Workflow forms should use the same field/layout builder, but workflow configuration lives in a separate workflow module.
- The workflow module can reuse the form-builder UI for field selection and layout, while adding workflow-specific tabs for steps, approvers, and triggers.
- Workflow records should feel module-like: they can be listed, viewed, filtered, and displayed with current status/stage metadata.
- Use a table view to show workflow data and current stage, but keep workflow state and approval history as separate process metadata, not just a plain entity table update.
- This keeps the builder consistent and avoids duplicating form design functionality.

### AI Agent Roadmap
- Add an AI assistant panel to the admin portal for form and workflow generation.
- Let users describe requirements in natural language and return suggested form/workflow metadata.
- Use the same form-builder model to render AI-generated fields and layouts, with a review/edit step before saving.
- Build a backend prompt service that maps user intent to platform concepts such as modules, types, workflow steps, approvers, and validation rules.
- Start with prompt-driven suggestions; only add fine-tuning or templates later if needed.
- Keep AI output parseable and strictly validated against the existing schema before persistence.

### OCR and Document Import Roadmap
- Add OCR-based document import for Purchase Orders, Purchase Invoices, and other business documents.
- Allow users to upload PDF or scanned document files and auto-extract key fields.
- Map extracted text to existing workflow or module fields such as supplier, amount, invoice number, dates, items, and totals.
- Use OCR as an assistive import path, with human review and correction before saving.
- Support both PDF and image imports initially, then extend to multi-page documents and layout templates.

### Form Builder Pending Notes

- Browser Button field mapping is available in Add/Edit Field and Batch Edit through a module-first lookup picker.
- Customers `Country` now uses the Countries Browser Button lookup while keeping the saved `country_id` value and dial-code display.
- Form Design includes Field Linkage for low-code data mapping rules. Open Field Linkage, choose a trigger field, configure one or more source table rows with variable aliases such as `customers = a` and `customers_dt1 = b`, set the primary key match field, add optional guarded SQL join/where logic such as `a.id = b.mainid`, and map source columns such as `b.item_code` into target fields or supported display targets.
- The Customers `Country` Browser Button maps `dial_code` into the dial-code display. The backend still derives and validates `phone_country_code` from the selected country as a data-integrity safeguard.
- Field Linkage now supports structured join rules with common comparison operators and per-mapping typed coercion. Advanced detail-row repeat mapping was removed to keep the Field Linkage workflow simpler.
- **TODO**: Extend field linkage with broader master-data examples such as Customer address/email/phone auto-fill.
- Country fields should use the **Countries Browser Button** instead of new simple dropdown configs. Legacy `country` rendering remains as a compatibility fallback, while the Countries browser definition exposes Search Fields (`name`, `iso2`, `dial_code`) and Display Columns (`name`, `iso2`, `dial_code`).
- Continue the form layout designer with tabs and more field placement controls. Sections and 1/2/3-column layouts are now available in Form Design.
- Drag/drop field reordering is available in Form Design; richer table placement controls can be added later.
- Richer cross-field validation expressions beyond conditional required.
- Formula custom functions now use named helper bodies with guarded server execution instead of raw source-code blocks.
- SQL capture execution behind guarded backend endpoints.
- Form version history, rollback, and audit logs are available for configuration changes; generated-page smoke testing is still pending.

## What Has Been Done

### Project Foundation

- Created a self-hosted CRM project from scratch.
- Added Node.js and Express backend.
- Added static browser frontend served by Express.
- Connected app to MySQL using environment variables.
- Added `.env.example`.
- Added Docker Compose file for future Docker MySQL setup.
- Added migration and seed scripts.
- Installed dependencies.
- Verified JavaScript syntax during development.

### Database

- Added MySQL schema.
- Created tables:
  - `users`
  - `countries`
  - `customers`
- Added country seed data with ISO codes and dial codes.
- Added seeded admin account.
- Added customer delete repository support.

### Authentication

- Added login endpoint.
- Added JWT session handling.
- Added auth middleware.
- Added role middleware for admin-only user routes.

### Users

- Added user list endpoint.
- Added create user endpoint.
- Added update user endpoint.
- Added frontend Users page.
- Standardized Users page layout to match Customers.
- Added Add User modal.
- Added Edit User modal.
- Password is required when creating a user and optional when editing.

### Customers

- Added customer list endpoint.
- Added create customer endpoint.
- Added update customer endpoint.
- Added delete customers endpoint:

  ```text
  DELETE /api/customers
  Body: { "ids": [1, 2, 3] }
  ```

- Added customer search.
- Added status filter.
- Added Add Customer modal.
- Added Edit Customer modal.
- Added multi-select checkboxes.
- Added select-all checkbox.
- Added Delete Selected button.
- Added delete confirmation modal before executing delete.
- Added dedicated Email column.
- Added configurable detail-table data entry in the customer form.
- Added detail-table row add/remove controls.
- Added detail-table row selection checkbox and select-all checkbox.
- Added detail-table selected-row duplicate.
- Added detail-table selected-row delete.
- Detail-table duplicate/delete is scoped to customer detail data rows only, not the Form Builder field list.
- Adjusted table alignment:
  - headers centered
  - row content vertically centered
  - company names left-aligned

### Admin Portal And Low-Code Configuration

- Added Admin Portal sidebar section.
- Added admin sections:
  - Modules
  - Form Builder
  - Module Pages
  - Automation Flow
  - Permissions
- Added collapsible admin menu.
- Added module list for Customers and Users in Form Builder.
- Added configurable field table.
- Added Add Field modal.
- Added support for selecting Main Table or Detail Table when creating fields.
- Added generated data key and database field name previews.
- Added Batch Edit modal for editing existing fields and adding multiple new fields.
- Added detail-table tabs inside Batch Edit.
- Added Field Properties modal for display, editability, required, and disable-manual-input settings.
- Added module-first Browser Buttons workspace with module search, per-module browser lists, editable presets, table-aware browser definitions, checkbox-based Search Fields and Display Columns, and guarded SQL `WHERE` condition storage.
- Added Browser Button runtime lookup endpoints and a shared customer/user form popup for searching and selecting configured lookup rows.
- Converted the Customers `Country` field to use the Countries Browser Button lookup while preserving the stored country id and existing dial-code display.
- Added Form Design Field Linkage for low-code source-table mapping rules, including trigger condition, multi-table source rows with aliases, primary key match, guarded SQL join/where logic, and mapped output fields/display targets.
- Renamed the current formula entry point to `Formula`.
- Added Form Design drawer scaffolding with Add/Edit/Detail layouts, copy controls, draft/publish actions, visual field ordering, hidden/formula indicators, and double-click formula access.
- Added backend storage for Form Design draft/published layouts and applied published layouts to actual customer/user forms.
- Added field validation rules for min/max length, min/max numeric value, regex, conditional required, and uniqueness.
- Added Formula Builder for formula expressions, built-in functions, custom helper functions, and SQL capture storage.
- Added formula database columns and server-side formula evaluation for customer saves.
- Added formula dependency validation, unknown field reference checks, circular-reference blocking, and dependency-order formula evaluation.
- Added fullscreen/enlarge controls to pop-out modals.
- Standardized large pop-out scrolling so headers and action footers remain fixed while the middle content scrolls, including fullscreen mode.
- Converted Batch Edit, Field Properties, and Import/Export Mapping from centered pop-outs to consistent right-side Form Builder drawers.
- Added module and field permission matrices with role/user grants and runtime enforcement for customer and generated-module CRUD, import, and export operations.
- Added persistent allowed/denied permission auditing plus a filtered, read-only audit-review drawer in Admin Portal > Permissions.
- Added Import/Export Mapping controls for mapped Excel import headers, export headers, export visibility, and customer export downloads.

### Country And Phone Handling

- Added country table and country API.
- Added automatic dial code display based on selected country.
- Defaulted new customer country to Malaysia.
- Defaulted Malaysian dial code to `+60`.
- Added phone normalization before saving.

### Excel Import

- Added customer Excel template download endpoint.
- Added customer Excel import endpoint.
- Moved customer import into the Customers page.
- Import is opened through an Import Customers modal.
- Import modal includes:
  - template download hyperlink
  - Excel file upload
  - Import Customers button
  - readable import result output
- Improved import result output so it no longer shows raw JSON.
- Prevented double-submit by disabling the import button while importing.
- Improved handling when import succeeds but customer table refresh fails.
- Added protected Excel template behavior:
  - header row protection metadata
  - row/column deletion disabled
  - autofilter enabled
  - instructions sheet added
- Added blank-row filtering during import.

### UI And Theme

- Reworked UI toward  Electronics style.
- Added dedicated login page.
- Hid app sidebar while logged out.
- Updated brand to ` CRM`.
- Changed primary action color to blue.
- Started the admin-only configuration area with configurable module fields.
- Standardized labels to Title Case, for example:
  - Add Customer
  - Import Customers
  - Delete Selected
  - Save Customer
  - Add User
  - Create User
  - Sign In

## Current API Surface

> **API documentation contract:** Any endpoint addition, removal, rename, authorization change, content-type change, idempotency change, or request/response contract change must update this section in the same commit. The backend smoke suite runs `tests/smoke/readme-api-surface-smoke.js` to verify that every mounted Dashboard, Automation Flow, Approval Workflow, and Notification route is represented here.

All protected endpoints require `Authorization: Bearer <token>` after login. Admin-only endpoints require an admin user.
JSON endpoints use `Content-Type: application/json` unless noted otherwise. Validation errors return an error response from the shared error handler.

### Authentication

- `POST /api/auth/login` - login.

  Request:

  ```json
  {
    "email": "your-admin-email@example.com",
    "password": "your-admin-password"
  }
  ```

  Response:

  ```json
  {
    "token": "jwt-token",
    "user": {
      "id": 1,
      "name": "Admin",
      "email": "your-admin-email@example.com",
      "role": "admin",
      "status": "active"
    }
  }
  ```

- `GET /api/auth/me` - returns the current authenticated user.

  Response:

  ```json
  {
    "user": {
      "id": 1,
      "name": "Admin",
      "email": "your-admin-email@example.com",
      "role": "admin",
      "status": "active"
    }
  }
  ```

### Reference Data

- `GET /api/countries` - returns country records with ISO and dial-code metadata.

  Response:

  ```json
  {
    "countries": [
      {
        "id": 1,
        "name": "Malaysia",
        "iso2": "MY",
        "dial_code": "+60"
      }
    ]
  }
  ```

- `GET /api/browser-buttons` - lists enabled browser button lookup definitions for authenticated form usage.

  Response:

  ```json
  {
    "browserButtons": [
      {
        "browserKey": "customers",
        "name": "Customers",
        "sourceModule": "customers",
        "sourceTable": "customers",
        "valueField": "id",
        "displayField": "company_name",
        "searchFields": ["company_name", "email"],
        "returnFields": ["company_name", "email"],
        "enabled": true
      }
    ]
  }
  ```

- `GET /api/browser-buttons/:browserKey/search?q=` - searches a configured browser button source and returns selectable lookup rows.

  Response:

  ```json
  {
    "browser": {
      "browserKey": "customers",
      "name": "Customers",
      "valueField": "id",
      "displayField": "company_name",
      "returnFields": ["company_name", "email"]
    },
    "rows": [
      {
        "value": 1,
        "display": "Example Sdn Bhd",
        "columns": {
          "company_name": "Example Sdn Bhd",
          "email": "hello@example.com"
        }
      }
    ]
  }
  ```

- `POST /api/browser-buttons/field-linkage/resolve` - resolves configured field-linkage mappings for a selected source value.

  Request:

  ```json
  {
    "sourceTable": "customers",
    "sourceTables": [
      {
        "tableName": "customers",
        "alias": "a"
      }
    ],
    "primaryKeyField": "id",
    "sourceFields": ["company_name", "email"],
    "value": 1
  }
  ```

  Response:

  ```json
  {
    "columns": {
      "id": 1,
      "company_name": "Example Sdn Bhd",
      "email": "hello@example.com"
    },
    "rows": []
  }
  ```

### Customers

- `GET /api/customers/config` - returns published customer field configuration and form layouts.

  Response:

  ```json
  {
    "module": {
      "moduleKey": "customers",
      "name": "Customers",
      "enabled": true
    },
    "fields": [],
    "formLayouts": {
      "published": {
        "add": {
          "order": ["companyName"],
          "hidden": []
        }
      }
    },
    "permissions": {
      "view": true,
      "create": true,
      "edit": true,
      "delete": true,
      "import": true,
      "export": true
    }
  }
  ```

- `GET /api/customers?search=&status=` - lists customers with optional search/status filters.

  Query params:

  ```text
  search=example
  status=lead|active|inactive
  ```

  Response:

  ```json
  {
    "customers": [
      {
        "id": 1,
        "company_name": "Example Sdn Bhd",
        "contact_person": "Jane Tan",
        "email": "jane@example.com",
        "country_id": 1,
        "country_name": "Malaysia",
        "phone_number": "+60123456789",
        "status": "lead",
        "notes": "Optional notes"
      }
    ]
  }
  ```

- `POST /api/customers` - creates a customer; accepts configured main fields and detail-table payloads.

  Request:

  ```json
  {
    "companyName": "Example Sdn Bhd",
    "contactPerson": "Jane Tan",
    "email": "jane@example.com",
    "countryId": 1,
    "phoneNumber": "0123456789",
    "status": "lead",
    "notes": "Optional notes",
    "ownerUserId": 1,
    "customFieldKey": "custom value",
    "customer_dt1": [
      {
        "lineFieldKey": "line value"
      }
    ]
  }
  ```

  Response:

  ```json
  {
    "customer": {
      "id": 1,
      "company_name": "Example Sdn Bhd",
      "contact_person": "Jane Tan",
      "email": "jane@example.com",
      "status": "lead"
    }
  }
  ```

- `PUT /api/customers/:id` - updates a customer; accepts the same body shape as `POST /api/customers`.

  Response:

  ```json
  {
    "customer": {
      "id": 1,
      "company_name": "Example Sdn Bhd",
      "contact_person": "Jane Tan",
      "email": "jane@example.com",
      "status": "active"
    }
  }
  ```

- `DELETE /api/customers` - deletes customers.

  Request:

  ```json
  {
    "ids": [1, 2, 3]
  }
  ```

  Response:

  ```json
  {
    "deletedCount": 3
  }
  ```

### Users

- `GET /api/users/config` - returns published user field configuration and form layouts.

  Response:

  ```json
  {
    "module": {
      "moduleKey": "users",
      "name": "Users",
      "enabled": true
    },
    "fields": [],
    "formLayouts": {}
  }
  ```

- `GET /api/users` - lists users.

  Response:

  ```json
  {
    "users": [
      {
        "id": 1,
        "name": "Admin",
        "email": "your-admin-email@example.com",
        "role": "admin",
        "status": "active"
      }
    ]
  }
  ```

- `POST /api/users` - creates a user.

  Request:

  ```json
  {
    "name": "Jane Tan",
    "email": "jane@example.com",
    "password": "replace-with-a-strong-password",
    "role": "user",
    "status": "active"
  }
  ```

  Response:

  ```json
  {
    "id": 2
  }
  ```

- `PATCH /api/users/:id` - updates a user. All fields are optional; omit `password` to keep the existing password.

  Request:

  ```json
  {
    "name": "Jane Lim",
    "email": "jane@example.com",
    "password": "NewPassword123!",
    "role": "manager",
    "status": "active"
  }
  ```

  Response:

  ```text
  204 No Content
  ```

### Imports

- `GET /api/imports/customers/template` - downloads the protected customer Excel import template.
- `GET /api/imports/customers/export` - downloads customers as a mapped Excel workbook.
- `POST /api/imports/customers` - imports customers from an uploaded Excel file.
- `GET /api/imports/modules/:moduleKey/template` - downloads an Excel import template for a published custom module.
- `GET /api/imports/modules/:moduleKey/export` - exports published custom module records to Excel.
- `POST /api/imports/modules/:moduleKey` - imports published custom module records from an uploaded Excel file. Detail-table rows use separate sheets linked by `Record Ref`.

  Request:

  ```text
  Content-Type: multipart/form-data
  file: .xlsx or .xls file field named "file"
  ```

### Generated Module Records

- `GET /api/modules` - lists published custom modules visible to the current user.
- `GET /api/modules/:moduleKey/config` - returns generated page configuration, fields, layouts, and current user's permissions.
- `GET /api/modules/:moduleKey/records` - lists custom module records. Supports `search`, `filterField`, `filterOperator`, and `filterValue`.
- `GET /api/modules/:moduleKey/records/:id` - returns one custom module record with detail-table rows.
- `POST /api/modules/:moduleKey/records` - creates a custom module record.
- `PUT /api/modules/:moduleKey/records/:id` - updates a custom module record.
- `DELETE /api/modules/:moduleKey/records` - bulk deletes custom module records.

  Create/update request:

  ```json
  {
    "title": "Example Record",
    "amount": 12.5,
    "__detailTables": {
      "example_dt1": [
        {
          "lineNote": "Detail row"
        }
      ]
    }
  }
  ```

  Delete request:

  ```json
  {
    "ids": [1, 2]
  }
  ```

  Response:

  ```json
  {
    "createdCount": 2,
    "errorCount": 1,
    "created": [
      {
        "row": 2,
        "id": 10
      }
    ],
    "errors": [
      {
        "row": 3,
        "message": "Unknown country \"Atlantis\""
      }
    ]
  }
  ```

### Admin Configuration

- `GET /api/sysadmin/modules` - lists configurable modules with fields and layouts.

  Response:

  ```json
  {
    "modules": [
      {
        "module": {
          "moduleKey": "customers",
          "name": "Customers",
          "enabled": true
        },
        "fields": [],
        "formLayouts": {}
      }
    ]
  }
  ```

- `GET /api/sysadmin/module-templates` - lists reusable module templates and their field counts.
- `POST /api/sysadmin/modules` - creates a custom module. Optional `creationMode` values are `scratch`, `existing_form`, and `template`; the latter two require `sourceFormKey` or `templateKey` respectively.
- `PATCH /api/sysadmin/modules/:moduleKey` - updates custom module name, description, status, or menu visibility.
- `DELETE /api/sysadmin/modules/:moduleKey` - deletes an unused custom module.

  Create request:

  ```json
  {
    "name": "Projects",
    "moduleKey": "projects",
    "description": "Project tracking records",
    "status": "draft",
    "showInMenu": false,
    "creationMode": "template",
    "templateKey": "sales_opportunities"
  }
  ```

  To reuse a Form Builder form instead, send `"creationMode": "existing_form"` with `"sourceFormKey": "customers"`. The source fields and Add/Edit/Detail layouts are copied; the new module receives its own safely remapped detail tables.

  Update request:

  ```json
  {
    "name": "Projects",
    "status": "published",
    "showInMenu": true
  }
  ```

- `GET /api/sysadmin/modules/:moduleKey` - returns one module configuration. Response shape matches one item from `GET /api/sysadmin/modules`.
- `GET /api/sysadmin/modules/:moduleKey/config-history` - returns form/config versions and audit logs.
- `POST /api/sysadmin/modules/:moduleKey/config-history/versions` - creates a config version snapshot.
- `POST /api/sysadmin/modules/:moduleKey/config-history/:versionId/rollback` - rolls module configuration back to a saved version.
- `GET /api/sysadmin/forms` - lists standalone low-code form definitions.
- `POST /api/sysadmin/forms` - creates a standalone low-code form definition.
- `DELETE /api/sysadmin/forms/:formKey` - deletes a standalone form definition.
- `PATCH /api/sysadmin/forms/:formKey/fields/:fieldKey` - updates standalone form field formula settings.
- `GET /api/sysadmin/modules/:moduleKey/fields/archived` - lists archived fields.

  Response:

  ```json
  {
    "fields": []
  }
  ```

- `POST /api/sysadmin/modules/:moduleKey/fields` - creates a field.

  Request:

  ```json
  {
    "fieldKey": "customerRating",
    "label": "Customer Rating",
    "type": "dropdownbox",
    "options": ["A", "B", "C"],
    "tableType": "main",
    "required": false,
    "showInTable": true,
    "showInForm": true,
    "showInImport": true,
    "showInExport": true,
    "importHeader": "Customer Rating",
    "exportHeader": "Customer Rating",
    "editable": true,
    "disableManualInput": false,
    "searchable": true,
    "validationRules": {
      "unique": false
    }
  }
  ```

  Response: updated module configuration.

- `PATCH /api/sysadmin/modules/:moduleKey/fields/:fieldKey` - updates a field. Body may contain any subset of the create-field properties.

  Request:

  ```json
  {
    "label": "Customer Grade",
    "showInExport": true,
    "exportHeader": "Customer Grade"
  }
  ```

  Response: updated module configuration.

- `DELETE /api/sysadmin/modules/:moduleKey/fields/:fieldKey` - deletes an unused configurable field.
- `POST /api/sysadmin/modules/:moduleKey/fields/:fieldKey/archive` - archives a field without dropping stored data.
- `POST /api/sysadmin/modules/:moduleKey/fields/:fieldKey/unarchive` - restores an archived field.

  Response for delete/archive/unarchive: updated module configuration.

- `PATCH /api/sysadmin/modules/:moduleKey/detail-tables/:tableName` - renames a detail table configuration.

  Request:

  ```json
  {
    "detailTableName": "customer_contacts"
  }
  ```

  Response: updated module configuration.

- `PUT /api/sysadmin/modules/:moduleKey/form-layouts/draft/:formType` - saves a draft layout for `add`, `edit`, or `detail`.
- `POST /api/sysadmin/modules/:moduleKey/form-layouts/publish/:formType` - publishes a layout for `add`, `edit`, or `detail`.

  Request:

  ```json
  {
    "order": ["companyName", "contactPerson", "email"],
    "hidden": ["notes"]
  }
  ```

  Response: updated module configuration.

- `GET /api/sysadmin/modules/:moduleKey/permissions` - returns module permission grants.
- `PUT /api/sysadmin/modules/:moduleKey/permissions` - saves module permission grants.

  Request:

  ```json
  {
    "permissions": {
      "view": {
        "roles": ["admin", "manager", "user"],
        "users": []
      },
      "create": {
        "roles": ["admin", "manager"],
        "users": [2]
      },
      "edit": {
        "roles": ["admin", "manager"],
        "users": []
      },
      "delete": {
        "roles": ["admin"],
        "users": []
      },
      "import": {
        "roles": ["admin"],
        "users": []
      },
      "export": {
        "roles": ["admin"],
        "users": []
      },
      "configure": {
        "roles": ["admin"],
        "users": []
      }
    }
  }
  ```

  Response: saved module permission matrix.

- `GET /api/sysadmin/modules/:moduleKey/field-permissions` - returns field permission grants.
- `PUT /api/sysadmin/modules/:moduleKey/field-permissions` - saves field permission grants.

  Request:

  ```json
  {
    "fields": [
      {
        "fieldKey": "email",
        "permissions": {
          "view": {
            "roles": ["admin", "manager"],
            "users": []
          },
          "edit": {
            "roles": ["admin"],
            "users": []
          },
          "import": {
            "roles": ["admin"],
            "users": []
          },
          "export": {
            "roles": ["admin"],
            "users": []
          }
        }
      }
    ]
  }
  ```

  Response: saved field permission matrix.

- `GET /api/sysadmin/permission-audit` - returns recent allowed and denied permission decisions for admin review. Optional query parameters are `moduleKey`, `action`, `allowed`, and `limit` (maximum 500).

  Response:

  ```json
  {
    "auditLogs": [
      {
        "id": 42,
        "userId": 7,
        "staffId": "STF-EXAMPLE-0001",
        "userName": "Example User",
        "moduleKey": "projects",
        "recordId": 18,
        "action": "edit",
        "allowed": false,
        "decisionReason": "no_page_permission_grant",
        "createdAt": "2026-07-21T08:30:00.000Z"
      }
    ]
  }
  ```

- `GET /api/sysadmin/browser-buttons` - lists browser button lookup definitions.

  Response:

  ```json
  {
    "browserButtons": []
  }
  ```

- `POST /api/sysadmin/browser-buttons` - creates a browser button definition.
- `PATCH /api/sysadmin/browser-buttons/:browserKey` - updates a browser button definition, including preset definitions. Body may contain any subset of the create payload.

  Request:

  ```json
  {
    "browserKey": "active_customers",
    "name": "Active Customers",
    "sourceModule": "customers",
    "sourceTable": "customers",
    "valueField": "id",
    "displayField": "company_name",
    "searchFields": ["company_name", "email"],
    "returnFields": ["company_name", "email", "contact_person"],
    "filter": {
      "where": "status = 'active'"
    },
    "enabled": true
  }
  ```

  Response:

  ```json
  {
    "browserButtons": []
  }
  ```

- `DELETE /api/sysadmin/browser-buttons/:browserKey` - deletes a custom browser button when it is not used by fields.

  Response:

  ```json
  {
    "browserButtons": []
  }
  ```

### Dashboard Administration

All `/api/dashboards` endpoints require an authenticated administrator.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/dashboards` | List dashboard definitions, optionally filtered by status or search text. |
| `POST /api/dashboards` | Create a dashboard draft. |
| `GET /api/dashboards/views` | Discover database views that can back dashboard data sources. |
| `GET /api/dashboards/views/:viewName` | Describe the columns exposed by one database view. |
| `GET /api/dashboards/data-sources` | List active or archived dashboard data sources. |
| `POST /api/dashboards/data-sources` | Create a governed data source. |
| `GET /api/dashboards/data-sources/:dataSourceKey` | Get one data-source definition. |
| `PUT /api/dashboards/data-sources/:dataSourceKey` | Replace editable data-source settings. |
| `POST /api/dashboards/data-sources/:dataSourceKey/archive` | Archive a data source. |
| `POST /api/dashboards/data-sources/:dataSourceKey/execute` | Execute a data source with validated filters and viewer context. |
| `GET /api/dashboards/:dashboardKey` | Get a dashboard definition and draft configuration. |
| `PUT /api/dashboards/:dashboardKey` | Update dashboard metadata. |
| `PUT /api/dashboards/:dashboardKey/configuration` | Replace the dashboard canvas configuration. |
| `POST /api/dashboards/:dashboardKey/check` | Validate the current dashboard configuration. |
| `GET /api/dashboards/:dashboardKey/versions` | List saved dashboard versions. |
| `POST /api/dashboards/:dashboardKey/versions` | Create a version checkpoint. |
| `POST /api/dashboards/:dashboardKey/versions/:versionId/restore` | Restore a saved version into the draft. |
| `GET /api/dashboards/:dashboardKey/export` | Export a portable dashboard definition. |
| `POST /api/dashboards/:dashboardKey/import` | Import configuration into the dashboard draft. |
| `POST /api/dashboards/:dashboardKey/publish` | Publish a validated dashboard version. |
| `POST /api/dashboards/:dashboardKey/duplicate` | Duplicate a dashboard into a new draft. |
| `POST /api/dashboards/:dashboardKey/archive` | Archive a dashboard. |
| `POST /api/dashboards/:dashboardKey/reopen` | Reopen an archived dashboard as a draft. |

### Published Dashboard Pages

These endpoints require authentication and apply the viewer's module and dashboard permissions.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/dashboard-pages` | List dashboards published for the current viewer. |
| `GET /api/dashboard-pages/:dashboardKey` | Load one published dashboard page. |
| `POST /api/dashboard-pages/:dashboardKey/widgets/:widgetKey/execute` | Execute a published widget with runtime filters. |
| `POST /api/dashboard-pages/:dashboardKey/widgets/:widgetKey/drill-down` | Resolve a widget drill-down destination and filtered records. |

### Automation Flow

All `/api/action-flows` endpoints require an authenticated administrator. Published flows may be linked to approval events through their trigger configuration.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/action-flows` | List Automation Flow definitions. |
| `POST /api/action-flows` | Create a flow draft. |
| `GET /api/action-flows/connectors` | List configured connector interfaces. |
| `GET /api/action-flows/connector-categories` | List connector categories. |
| `POST /api/action-flows/connector-categories` | Create a connector category. |
| `DELETE /api/action-flows/connector-categories/:categoryKey` | Delete an unused connector category. |
| `GET /api/action-flows/executions` | List execution history. |
| `POST /api/action-flows/connectors` | Create or update a connector interface. |
| `POST /api/action-flows/connectors/:connectorKey/debug` | Test a connector using its configured interface. |
| `DELETE /api/action-flows/connectors/:connectorKey` | Delete an unused connector. |
| `GET /api/action-flows/:flowKey` | Get one flow definition. |
| `PUT /api/action-flows/:flowKey` | Update flow metadata and graph configuration. |
| `POST /api/action-flows/:flowKey/check` | Validate the draft graph. |
| `GET /api/action-flows/:flowKey/versions` | List flow versions. |
| `POST /api/action-flows/:flowKey/versions` | Create a version checkpoint. |
| `POST /api/action-flows/:flowKey/publish` | Publish a validated flow version. |
| `POST /api/action-flows/:flowKey/versions/:versionId/restore` | Restore a version into the draft. |
| `POST /api/action-flows/:flowKey/run-once` | Run the draft once with supplied test input. |
| `DELETE /api/action-flows/:flowKey` | Archive or remove the flow definition. |

### Approval Workflows

Definition administration:

| Endpoint | Access and purpose |
| --- | --- |
| `GET /api/workflows/catalog` | Authenticated; list published workflows and request forms available to the viewer. |
| `GET /api/workflows/definitions` | Admin; list workflow definitions. |
| `POST /api/workflows/definitions` | Admin; create a draft definition. The stable key and readable request prefix are generated from the workflow name. |
| `GET /api/workflows/definitions/:workflowKey` | Admin; load one definition and graph. |
| `PUT /api/workflows/definitions/:workflowKey` | Admin; update metadata, record policy, node graph, forms, approvers, conditions, SLA, and optional email actions. |
| `POST /api/workflows/definitions/:workflowKey/clone` | Admin; clone a workflow into a new draft. |
| `POST /api/workflows/definitions/:workflowKey/archive` | Admin; archive a definition without changing requests already pinned to a published version. |
| `POST /api/workflows/definitions/:workflowKey/check` | Admin; validate graph connectivity and configuration. |
| `POST /api/workflows/definitions/:workflowKey/checkpoints` | Admin; save a draft checkpoint. |
| `POST /api/workflows/definitions/:workflowKey/publish` | Admin; publish an immutable version used by new requests. |
| `GET /api/workflows/definitions/:workflowKey/versions` | Admin; list published and checkpoint versions. |
| `GET /api/workflows/definitions/:workflowKey/versions/:versionId` | Admin; inspect one version. |

Operational administration:

| Endpoint | Access and purpose |
| --- | --- |
| `GET /api/workflows/inbox` | Authenticated; list pending assignments for the current approver. |
| `GET /api/workflows/monitoring` | Admin; search request status, SLA, requester, approver, department, workflow, and date filters. |
| `GET /api/workflows/monitoring/export.csv` | Admin; export the filtered monitoring result as `text/csv`. |
| `GET /api/workflows/delegations` | Admin; list approval delegations. |
| `POST /api/workflows/delegations` | Admin; create an optional time-bounded delegation scoped by workflow, role, or department. |
| `POST /api/workflows/delegations/:id/cancel` | Admin; cancel an active delegation. |
| `POST /api/workflows/assignments/:id/reassign` | Admin; reassign a pending assignment with a required reason and `Idempotency-Key`. |
| `POST /api/workflows/monitoring/run` | Admin; run the optional SLA reminder and escalation worker on demand. |
| `POST /api/workflows/requests/:requestKey/remind` | Admin; send a manual reminder with `Idempotency-Key`. |

Request lifecycle:

| Endpoint | Access and purpose |
| --- | --- |
| `GET /api/workflows/requests` | Authenticated; list requests visible to the current user. |
| `POST /api/workflows/requests` | Authenticated; submit a request as `multipart/form-data`, with `Idempotency-Key`. Supports up to 20 attachments, each up to 25 MB. |
| `GET /api/workflows/requests/:requestKey` | Authenticated and authorized; return request data, current stage, assignments, decisions, history, and permitted actions. |
| `POST /api/workflows/requests/:requestKey/decisions` | Eligible approver; approve, reject, or return using `multipart/form-data` and `Idempotency-Key`. Structured values use the `responses` JSON field; attachment response inputs use `responseAttachment:<fieldKey>`. |
| `GET /api/workflows/requests/:requestKey/attachments/:attachmentId` | Authorized viewer; download an attachment as binary content. |
| `POST /api/workflows/requests/:requestKey/withdraw` | Requester; withdraw an eligible request with `Idempotency-Key`. |
| `POST /api/workflows/requests/:requestKey/resubmit` | Requester; resubmit a returned request with `Idempotency-Key`. |
| `POST /api/workflows/requests/:requestKey/cancel` | Admin; cancel a request with a mandatory remark and `Idempotency-Key`. |

Workflow commands fail closed: a request stays in draft when no published workflow or eligible approver can be resolved. Request identifiers use the automatically derived workflow prefix plus a six-digit sequence, for example `LEAVEAPPLICATION-000001`. Existing requests retain the exact published workflow version with which they started.

### Notifications And Email Settings

In-app approval notifications are automatic and do not require Automation Flow or email configuration.

| Endpoint | Access and purpose |
| --- | --- |
| `GET /api/notifications` | Authenticated; list the current user's notifications. Supports `unread=true` and `limit`. |
| `POST /api/notifications/read-all` | Authenticated; mark all current-user notifications as read. |
| `POST /api/notifications/:id/read` | Authenticated owner; mark one notification as read. |
| `GET /api/notifications/email-settings/current` | Admin; load central email settings without returning stored secrets. |
| `PUT /api/notifications/email-settings/current` | Admin; save encrypted Gmail, Google Workspace, Microsoft 365, or generic SMTP settings. |
| `POST /api/notifications/email-settings/test` | Admin; send a test message to a validated recipient. |

### Application Menu API

| Endpoint | Access and purpose |
| --- | --- |
| `GET /api/menu/sidebar` | Authenticated; returns the published sidebar filtered for the current user's visibility and available destinations. |
| `GET /api/menu/configuration` | Admin; returns the current draft, published configuration, and published version number. |
| `GET /api/menu/configuration/catalog` | Admin; lists registered core/module destinations plus selectable users and departments. |
| `GET /api/menu/configuration/versions` | Admin; lists recent immutable published menu versions. |
| `POST /api/menu/configuration/check` | Admin; validates keys, hierarchy, destinations, HTTPS links, and administrator access safeguards. |
| `PUT /api/menu/configuration/draft` | Admin; validates and saves the global sidebar draft. |
| `POST /api/menu/configuration/publish` | Admin; validates, publishes, and creates an immutable menu version. |
| `POST /api/menu/configuration/reset` | Admin; replaces only the draft with the safe default navigation. |
| `POST /api/menu/configuration/versions/:id/restore` | Admin; copies a prior published version into the draft for review. |

### Account Settings API

| Endpoint | Access and purpose |
| --- | --- |
| `GET /api/account` | Authenticated; returns the current user's profile, administrator-managed organization details, and regional preferences. |
| `PATCH /api/account/profile` | Authenticated owner; updates display name, phone number, and job title only. |
| `PUT /api/account/preferences` | Authenticated owner; saves language, time zone, date format, and time format. |
| `GET /api/account/avatar` | Authenticated owner; returns the private profile image with `no-store` caching. |
| `POST /api/account/avatar` | Authenticated owner; uploads a signature-validated JPG, PNG, or WebP image up to 5 MB. |
| `DELETE /api/account/avatar` | Authenticated owner; removes the profile image and restores the initials fallback. |
| `POST /api/account/password` | Authenticated owner; verifies the current password, saves a new hash, and invalidates existing sessions. |

Email is an optional, non-blocking delivery channel. Approval processing and in-app notification delivery remain successful when email is disabled or unavailable.

## Local Setup

1. Install dependencies:

   ```powershell
   npm.cmd install
   ```

2. Create `.env`:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Update `.env` for your local MySQL.

   Attachment malware scanning is optional and disabled on each workflow node by default. To enable it, run a reachable ClamAV daemon with INSTREAM support and configure `WORKFLOW_CLAMAV_HOST`, `WORKFLOW_CLAMAV_PORT`, and `WORKFLOW_CLAMAV_TIMEOUT_MS`. When a node requires scanning, an unavailable scanner causes the upload to fail closed.

4. Run database migration:

   ```powershell
   npm.cmd run db:migrate
   ```

5. Run seed:

   ```powershell
   npm.cmd run db:seed
   ```

6. Start the CRM:

   ```powershell
   npm.cmd run dev
   ```

7. Open:

   ```text
   http://localhost:3000
   ```

## Common Commands

```powershell
# Start development server
npm.cmd run dev

# Start production-style server
npm.cmd start

# Run database migration
npm.cmd run db:migrate

# Seed countries and admin user
npm.cmd run db:seed

# Run backend smoke tests
npm.cmd run test:smoke:backend

# Check frontend JavaScript syntax
node --check public\app.js
```

The backend smoke test starts the Express app in-process and uses the configured admin login. If your database admin password differs from `.env`, either run `npm.cmd run db:seed` with the current `ADMIN_EMAIL` and `ADMIN_PASSWORD`, or set `SMOKE_ADMIN_EMAIL` and `SMOKE_ADMIN_PASSWORD` before running the smoke test.

## Copyable Next Steps

```text
Immediate testing:
1. Start app with npm.cmd run dev.
2. Open http://localhost:3000.
3. Login with the admin credentials from your `.env`.
4. Test Add Customer.
5. Test Edit Customer.
6. Test customer detail-table row Add.
7. Test detail-table row checkbox selection.
8. Test detail-table select-all.
9. Test detail-table Duplicate selected rows.
10. Test detail-table Delete selected rows.
11. Test customer search and status filter.
12. Test customer multi-select.
13. Test Delete Selected and confirm popup.
14. Test Download Customer Import Template.
15. Fill the template with sample customers.
16. Import the Excel file.
17. Confirm imported customers appear in the table.
18. Test Add User.
19. Test Edit User.
20. Open Admin Portal.
21. Test Form Builder module switching between Customers and Users.
22. Test Add Field.
23. Test Batch Edit existing field rows, new field rows, and detail table tabs.
24. Test Field Properties display, editability, required, and disable-manual-input settings.
25. Test Formula workspace formulas and custom helper functions.
26. Test Form Design drawer form-type switching, copy layout, draft/publish, field move controls, and double-click formula access.

Security cleanup:
1. Create your real admin user.
2. Change or disable the seeded admin account.
3. Replace JWT_SECRET in .env with a strong random value.
4. Tune `JWT_EXPIRES_IN` and `JWT_REMEMBER_EXPIRES_IN` for your deployment policy.
5. Create a dedicated MySQL user for this CRM instead of using sa/root-style access.
6. Give the CRM MySQL user access only to the CRM database.

Reliability:
1. Add database backup plan.
2. Test database restore.
3. Keep backend smoke coverage current as phases move from planned to implemented.
4. Add UI smoke tests for login, customer CRUD, import, and user CRUD.

Recommended feature order:
1. Customer activity timeline for calls, meetings, follow-ups, and internal notes.
2. Tasks and reminders.
3. Deals/opportunities pipeline.
4. Import preview and duplicate detection.
5. Audit logs for customer/user changes.
6. Low-code dashboard builder with SQL view/query data sources and chart widgets.
7. File attachments.
8. Email integration.
9. Production HTTPS setup if exposing beyond Tailscale.
```

## Missing Before Production

- Strong `JWT_SECRET`.
- Admin credentials supplied through `.env`, with no public default login.
- Production session lifetime policy.
- Dedicated MySQL user.
- Backup and restore process.
- Audit logs.
- Automated tests.
- More granular permissions.
- Production HTTPS if exposed outside Tailscale.
- Structured logging and monitoring.

## Project Structure

```text
src/
  app.js
  server.js
  database/
    migrate.js
    pool.js
    schema.sql
    seed.js
  modules/
    auth/
    countries/
    customers/
    imports/
    sysadmin/
    users/
  shared/
public/
  index.html
  styles.css
  app.js
```
