# Amperes CRM

Self-hosted CRM foundation built with Node.js, Express, MySQL, and a browser UI. The app is currently focused on customer records, user management, country-aware contact numbers, and Excel customer import.

## Current Status

The CRM is usable locally for basic customer and user workflows:

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
- `users`

Frontend files live in `public/`:

- `index.html`
- `styles.css`
- `app.js`

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
- Adjusted table alignment:
  - headers centered
  - row content vertically centered
  - company names left-aligned

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
6. Test customer search and status filter.
7. Test customer multi-select.
8. Test Delete Selected and confirm popup.
9. Test Download Customer Import Template.
10. Fill the template with sample customers.
11. Import the Excel file.
12. Confirm imported customers appear in the table.
13. Test Add User.
14. Test Edit User.

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
    users/
  shared/
public/
  index.html
  styles.css
  app.js
```
