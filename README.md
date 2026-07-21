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
- Admin Portal with sections for Modules, Departments, Form Builder, Browser Buttons, Module Pages, Action Flow, and Permissions.
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

The long-term direction is to turn  CRM into a low-code, fully customizable CRM platform where admins can create modules, forms, pages, and automation without editing source code. Weaver e-cology and e-Builder are useful references for the platform concept, especially the separation between form building, page publishing, data rules, and action-flow automation.

### Target Admin Experience

Admins should have a dedicated portal for configuring the CRM:

- `Admin Portal`: the dedicated low-code configuration workspace.
- `Module Builder`: create and manage modules such as Customers, Suppliers, Projects, Tickets, Assets, or Contracts.
- `Form Builder`: add and configure module fields without coding.
- `Module Page Publisher`: publish form-backed modules as usable CRM pages.
- `Action Flow`: configure triggers, conditions, actions, scheduled jobs, integrations, and execution logs.
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
   - Added internal admin sections for Modules, Form Builder, Module Pages, Action Flow, and Permissions.
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
5. Phase 5: Action Flow - complete
   - Admin Portal has an `Action Flow` management page with All, Enable, Disable, and Draft filters.
   - Existing action flows can be previewed in a right-side drawer before opening the full builder.
   - New and existing flows open in a full-screen Make.com-style low-code builder with a draggable dotted canvas, aligned dotted connectors, categorized action palette, node configuration panel, Save, and Check controls.
   - The completed implementation includes: the visual canvas; structured conditions; real Yes/No runtime routing; n8n-style field mapping and previous-node outputs; task, notification, and transformation actions; Run Once testing and visual execution states; scheduling, error handlers, and retries; versioning and publishing; and loops, parallel branches, and cross-flow orchestration.
   - Action categories include Record, Task/Notification, Logic, RESTful API, and Data Mapping.
   - Record actions include add record, update record, delete record, assign owner, and change status.
   - RESTful API connector configuration is available as a dedicated Admin Portal API Connectors module with connection name/description, protocol and TLS version, certificate-bypass setting, domain/IP address, encoding, connection/response timeouts, and authentication.
   - API Category Management organizes Connectors and their inherited Interfaces in the Admin Portal's shared three-panel navigation. Connectors select a category when created or edited, and Interfaces inherit the category of their selected Connector.
   - Connector authentication uses method-specific fields for API Key, Bearer Token, Basic, OAuth 1.0, and OAuth 2.0 instead of requiring admins to enter raw JSON. Connection keys are generated stable system identifiers used by Interfaces and Action Flow references.
   - OAuth 1.0 requests are signed with HMAC-SHA1 or HMAC-SHA256. OAuth 2.0 Client Credentials retrieves and caches access tokens, supports Basic-header or request-body client authentication, and can attach tokens through the Authorization header or query string.
   - API Interfaces and Connectors have separate creation actions. Interfaces use a five-step Basic, Request, Response, Succeeded/Failed, and Test editor and remain attached to a reusable Connector.
   - Request and Response definitions use Params, Header, and Body tables with one-row-at-a-time editing plus batch field creation from pasted JSON or XML. Data-format selection is scoped to Body and reused by Batch Add; Params and Header batch input auto-detects JSON or XML.
   - Interface Debug executes through the backend and returns status, timing, headers, body, response size, and configured success-rule evaluation. Backend storage, validation, connector save/delete, and automated OAuth smoke coverage are available.
   - Persisted delete actions use one reusable confirmation template across customers, generated records, modules, fields, API connectors, and connector categories, with consistent destructive styling, right-aligned actions, backdrop dismissal, and Escape support.
   - The structured condition editor supports multiple rules, All/Any matching, field/operator/value selection, and saved Yes/No branches that route the runtime graph according to the evaluated result.
   - n8n-style mapping supports fixed values and expressions sourced from trigger data, the current record, and previous-node outputs; transformed results can be named and reused by later modules.
   - Published custom module record triggers (`record_created`, `record_updated`, `record_deleted`, and `status_changed`) and scheduled triggers execute local record actions such as add, update, delete, assign owner, and change status.
   - Task creation, notifications, Set Value, Transform Value, and REST actions consume mapped inputs and expose execution results for subsequent modules.
   - Runtime executions are recorded in `crm_action_flow_executions`, admins can read recent execution/instance logs through the Action Flow API, and the Action Flow builder has Execution/Instance log views.
   - Execution results include step labels, categories, statuses, timestamps, durations, skip reasons, trigger metadata, and raw payload/result inspection.
   - Guarded REST nodes perform outbound calls with connector endpoint selection, request mapping, auth/header support, timeouts, private-network blocking unless explicitly allowed, bounded response capture, and HTTP response logging.
   - First visual mapping dialogs are available for record field mapping and REST request/response/error mapping while preserving the existing text mapping format.
   - REST response/error mappings are applied at runtime: mapped values are captured in execution logs, and matching main-table form fields on the triggered record are updated automatically.
   - Dynamic assignment picker is available for Action Flow value fields and mapping rows, with context/current-record/system/fixed-value choices and previous-node output tokens.
   - Run Once executes draft flows for testing and displays node-level running, successful, skipped, and failed states with useful error details.
   - Reliability settings support retry attempts, retry delays, stop-flow behavior, and dedicated error branches after retry exhaustion.
   - Action Flow version history supports named checkpoints, remarks, safe restoration, and explicit publishing; production triggers and child-flow calls use published versions.
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
7. Phase 7: Dashboard Builder - planned
   - Add low-code dashboard pages made from saved widget configuration instead of generated source code.
   - Use saved SQL views or guarded `SELECT` queries as dashboard data sources.
   - Support first widget types such as number cards, ring/donut charts, line charts, bar charts, and table widgets.
   - Each widget should map query result columns such as `label`, `value`, `date`, and `group` into the chart renderer.
   - Guard dashboard SQL so it is read-only: no `INSERT`, `UPDATE`, `DELETE`, `DROP`, comments, or statement separators.
   - Later add dashboard filters, date ranges, role/user permissions, config export/import, and version history.
8. Phase 8: Workflow Module and Approver Workflows - planned
   - Create a separate `workflow` module for approval process configuration and runtime.
   - Reuse the form builder for workflow form definitions, but keep workflow config in a dedicated module.
   - Support workflow definitions with multiple approval steps, each with assigned approvers (role or user).
   - Store workflow instances with status (pending, approved, rejected, cancelled).
   - Track workflow approvals with decision, comments, and audit trail.
   - Keep product roadmap and other entity data in their own modules (customers, roadmap items, etc.).
   - Use shared form-builder metadata for workflow form UI and validation.
   - Later add branching conditions, conditional approvers, escalation, and SLA tracking.
9. Phase 9: AI Agent Assistant - planned
   - Add an AI assistant panel to the admin portal for form and workflow generation.
   - Support natural-language prompts to suggest form fields, workflow steps, and validation rules.
   - Use backend prompt service to map user intent to platform concepts (modules, field types, approvers, conditions).
   - Show AI-generated suggestions with a preview and review/edit step before saving.
   - Parse and validate AI output strictly against existing schema before persistence.
   - Start with prompt-driven suggestions; add fine-tuning or templates if needed later.
   - Later add domain examples, knowledge base integration, and user feedback loops.

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
CRM write/import/action-flow event saved in MySQL
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

- `Data Key` is the stable internal field identifier used by API payloads, imports, JSON storage, formulas, reports, and future action-flow conditions. A field label can be renamed later, but the data key should stay stable so existing records and automations do not break.
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
  - Action Flow
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
