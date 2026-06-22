# Amperes CRM

Self-hosted CRM foundation built with Node.js, Express, MySQL, and a browser UI. The app is currently focused on customer records, user management, country-aware contact numbers, Excel customer import, and early low-code CRM configuration.

## Current Status

The CRM is usable locally for customer, user, import, and early low-code configuration workflows:

- Login with JWT authentication.
- Admin user management.
- Customer create, edit, search, filter, multi-select, and delete.
- Country-based phone code handling.
- Malaysia is the default country for new customers.
- Excel customer import with downloadable protected template.
- Amperes-inspired UI theme with blue primary actions.
- Dedicated full-page login screen.
- Modal forms for adding/editing customers and users.
- Customer import modal with template download, file upload, and import result display.
- Admin Portal with sections for Modules, Form Builder, Module Pages, Action Flow, and Permissions.
- Form Builder for customer and user field configuration.
- Configurable fields for main table and detail table placement.
- Batch Edit fields workflow with editable existing fields, new field rows, and main/detail table tabs.
- Field Properties grid for display and required flags.
- Formula workspace with formula expressions, reusable custom helper functions, and SQL capture storage.
- Backend-backed Form Design drawer for per-form-type visual field ordering with draft/publish controls.
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

Default seeded admin login, unless changed in `.env`:

```text
Email: admin@example.com
Password: ChangeMe123!
```

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
- `imports`
- `sysadmin`
- `users`

Frontend files live in `public/`:

- `index.html`
- `styles.css`
- `app.js`

## Low-Code CRM Direction

The long-term direction is to turn Amperes CRM into a low-code, fully customizable CRM platform where admins can create modules, forms, pages, and automation without editing source code. Weaver e-cology and e-Builder are useful references for the platform concept, especially the separation between form building, page publishing, data rules, and action-flow automation.

### Target Admin Experience

Admins should have a dedicated portal for configuring the CRM:

- `Admin Portal`: the dedicated low-code configuration workspace.
- `Module Builder`: create and manage modules such as Customers, Suppliers, Projects, Tickets, Assets, or Contracts.
- `Form Builder`: add and configure module fields without coding.
- `Module Page Publisher`: publish form-backed modules as usable CRM pages.
- `Action Flow`: configure triggers, conditions, actions, scheduled jobs, integrations, and execution logs.
- `Permissions`: control who can view, create, edit, delete, import, export, and configure each module.

### Recommended Build Phases And Progress

1. Phase 1: Dedicated Admin Portal - mostly done
   - Converted the old sysadmin area into `Admin Portal`.
   - Added an admin-only configuration workspace.
   - Added internal admin sections for Modules, Form Builder, Module Pages, Action Flow, and Permissions.
   - Normal CRM usage is separated from admin configuration through sidebar navigation.
2. Phase 2: Module Builder - scaffolded, not fully implemented
   - Admin Portal has a `Modules` section.
   - Customers and Users are visible as existing system modules.
   - Full custom module create/edit/publish controls are still pending.
   - Allow admins to create modules with a name, key, description, status, and menu visibility.
   - Support draft and published states before exposing modules to normal users.
3. Phase 3: Form Builder - in progress
   - Existing customer and user fields are configurable through Form Builder.
   - Admins can add one field at a time with `Add Field`.
   - Admins can edit existing fields and add new fields through `Batch Edit`.
   - Fields can be assigned to `Main Table` or `Detail Table`.
   - Detail table names are generated and shown in the field list.
   - Supported configurable field types currently include textbox, textarea, checkbox, dropdownbox, int, decimals, browser button placeholder, date, attach document placeholder, and image placeholder.
   - System field types such as email, phone, country, owner, password, and status are supported by existing modules.
   - `Field Properties` currently saves display and required settings.
   - `Formula` opens the Formula Builder for formula expressions, reusable custom functions, and SQL capture notes.
   - `Form Design` opens a right-side visual drawer for Add, Edit, and Detail form layouts. Draft and published layouts are stored in module configuration.
   - Formula fields are evaluated on the customer form and server save path.
   - Still missing: form sections, tabs, layout controls, sort/reorder controls, validation rules, import/export mapping controls, real lookup/browser-button behavior, editability enforcement, field-level permissions, audit logs, and versioning.
4. Phase 4: Module Page Publisher - planned
   - Admin Portal has a placeholder `Module Pages` section.
   - Generated pages for custom published modules are not implemented yet.
   - Target behavior: generate usable CRM pages from published modules.
   - Include list views, add/edit forms, search, filters, import/export, and record detail pages.
5. Phase 5: Action Flow - planned
   - Admin Portal has a placeholder `Action Flow` section.
   - Automation runtime is not implemented yet.
   - Start with simple triggers such as record created, record updated, and status changed.
   - Add conditions such as field equals value or number greater than value.
   - Add actions such as update field, create task, assign owner, send notification, and call webhook.
   - Later add scheduling, cross-module orchestration, external integrations, and execution logs.
6. Phase 6: Permissions - planned
   - Admin Portal has a placeholder `Permissions` section.
   - Target behavior: control view, create, edit, delete, import, export, and configuration access per module and role.

### Extra Platform Features To Add

- Audit logs for admin configuration changes and record changes.
- Module templates for common business objects.
- Trash/archive instead of hard delete for configurable modules.
- Lookup fields and related records.
- Import/export settings per module.
- Report builder and dashboard widgets.
- Field-level and record-level permissions.
- Backup, restore, and version history for low-code configuration.

### Form Builder Conventions

- `Data Key` is the stable internal field identifier used by API payloads, imports, JSON storage, formulas, reports, and future action-flow conditions. A field label can be renamed later, but the data key should stay stable so existing records and automations do not break.
- New fields are appended to the end automatically; admins do not manually maintain display order in Phase 1.
- Fields can be placed on the `Main Table` or a `Detail Table`.
- Detail table names are generated from the module key, for example `customer_dt1`.
- Detail-table records include their own `id` and a `mainid` field that maps each detail row back to the main record.
- `Dropdown Options` only applies to `Dropdownbox` fields.
- `Browser Button` fields are reserved for a future phase where the button links to available master-data/browser modules.
- `Add Field` is for adding one field at a time.
- `Batch Edit` opens a field-management workspace that shows fields by `Main Table` and detail-table tabs, supports editing existing fields, adding new rows, and adding new detail table tabs with generated names such as `customer_dt1`.
- Existing field keys and database field names stay read-only in Batch Edit so saved data mappings remain stable.
- Locked/system fields keep protected type/table settings, but formula settings and common display flags can still be saved.
- `Field Properties` opens a read/write properties grid for the selected form. Phase 1 saves display and required flags; editability and disable-manual-input are UI scaffolding for future permissions and browser-button phases.
- `Formula` opens the Formula Builder. It supports field variables, basic operators, built-in functions, reusable custom helper functions, and SQL capture text. The SQL capture tab stores notes/configuration only; execution is planned for a later guarded backend phase.
- `Form Design` opens a right-side drawer above Form Builder. It has Add, Edit, and Detail form types, form-preview field controls, drag/drop ordering, a hidden-field palette, copy-layout controls, Save Draft, and Publish. Draft and published layouts are stored on the backend; the published Add/Edit layouts drive the actual customer and user forms. Hidden fields can be dragged from the side palette onto the form, which turns on `Show In Form`; visible fields can be dragged back to the palette to hide them.
- Double-clicking a field opens Formula Builder for that field. Right-clicking a field opens its field configuration. Add/Edit Field opens above Form Design without closing the drawer.
- Form Design separates main fields from detail-table fields. Detail-table names are shown in their own lower area with a table-style preview; renaming the actual detail table key needs backend migration safeguards before it should be editable.
- Formula-enabled fields are treated as read-only calculated fields in customer main forms.
- Form Builder is for field configuration only. Bulk duplicate/delete controls should not be used there.
- Detail-table row duplicate/delete is for data entry rows inside Add/Edit Customer, not for Form Builder fields.
- Detail-table row delete keeps one blank row when every row is selected, so the table remains ready for input.

### Form Builder Still Missing

- Full form layout designer for sections, columns, tabs, grouping, and field placement.
- Drag/drop field reordering and richer placement controls in tables and forms.
- Advanced validation rules such as min/max, regex, conditional required, uniqueness, and cross-field checks.
- Bulk duplicate/delete/archive controls for configurable fields, with safeguards for existing data.
- Real Browser Button and lookup fields connected to master-data/browser modules.
- Field-level editability and disable-manual-input enforcement in the customer/user forms.
- Role-based field permissions for view, create, edit, import, and export.
- Import/export mapping controls per module and per field.
- Formula dependency checks, circular-reference detection, and safer custom-function sandboxing.
- SQL capture execution behind guarded backend endpoints.
- Form version history, rollback, and audit logs for configuration changes.

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
- Added Field Properties modal for display and required settings.
- Renamed the current formula entry point to `Formula`.
- Added Form Design drawer scaffolding with Add/Edit/Detail layouts, copy controls, draft/publish actions, visual field ordering, hidden/formula indicators, and double-click formula access.
- Added backend storage for Form Design draft/published layouts and applied published layouts to actual customer/user forms.
- Added Formula Builder for formula expressions, built-in functions, custom helper functions, and SQL capture storage.
- Added formula database columns and server-side formula evaluation for customer saves.
- Added fullscreen/enlarge controls to pop-out modals.

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

- Reworked UI toward Amperes Electronics style.
- Added dedicated login page.
- Hid app sidebar while logged out.
- Updated brand to `Amperes CRM`.
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

# Check frontend JavaScript syntax
node --check public\app.js
```

## Copyable Next Steps

```text
Immediate testing:
1. Start app with npm.cmd run dev.
2. Open http://localhost:3000.
3. Login with admin@example.com / ChangeMe123!.
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
24. Test Field Properties display/required settings.
25. Test Formula workspace formulas and custom helper functions.
26. Test Form Design drawer form-type switching, copy layout, draft/publish, field move controls, and double-click formula access.

Security cleanup:
1. Create your real admin user.
2. Change or disable the seeded admin account.
3. Replace JWT_SECRET in .env with a strong random value.
4. Create a dedicated MySQL user for this CRM instead of using sa/root-style access.
5. Give the CRM MySQL user access only to the CRM database.

Reliability:
1. Add database backup plan.
2. Test database restore.
3. Add automated backend tests for auth, customers, users, and import.
4. Add UI smoke tests for login, customer CRUD, import, and user CRUD.

Recommended feature order:
1. Customer activity timeline for calls, meetings, follow-ups, and internal notes.
2. Tasks and reminders.
3. Deals/opportunities pipeline.
4. Import preview and duplicate detection.
5. Audit logs for customer/user changes.
6. Dashboard and reports.
7. File attachments.
8. Email integration.
9. Production HTTPS setup if exposing beyond Tailscale.
```

## Missing Before Production

- Strong `JWT_SECRET`.
- Changed or disabled default admin account.
- Dedicated MySQL user.
- Backup and restore process.
- Audit logs.
- Automated tests.
- Login rate limiting or account lockout.
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
