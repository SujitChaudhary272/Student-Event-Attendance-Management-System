# Student Event Participation Management System

Comprehensive documentation for the full-stack campus event platform in this repository.

## 1. Project Overview

This system manages the complete lifecycle of student events for colleges and clubs.

Primary goals:
- Public discovery of clubs and events.
- Student onboarding and event participation.
- Organizer-side event operations and attendance control.
- Admin governance for clubs, members, and reporting.
- Certificate issuance, download, and public verification.

Core actors:
- Public user
- Student
- Organizer (club member)
- Admin

## 2. What This Repository Contains

Top-level structure:
- backend: Express API + PostgreSQL schema and business logic.
- frontend: React + Vite web client.
- UML_CASE_STUDY_DOCUMENTATION.md: functional and domain UML guidance.

## 3. Technology Stack

Backend:
- Node.js (ES Modules)
- Express 5
- PostgreSQL (pg)
- JWT authentication
- Multer upload handling
- Joi validation
- Puppeteer + QR libraries for certificate/attendance workflows
- Jest + Supertest for tests

Frontend:
- React 19
- React Router
- Vite
- Tailwind CSS
- Axios
- Recharts
- html5-qrcode

## 4. High-Level Architecture

Frontend responsibilities:
- Public browsing pages.
- Role-based dashboards and protected routes.
- API consumption through dedicated service modules.

Backend responsibilities:
- REST API grouped by role/domain.
- Authentication and authorization middleware.
- Event, attendance, registration, reporting, and certificate logic.
- Automatic schema initialization on startup.

Database responsibilities:
- Core relational entities for users, clubs, members, events, registrations, attendance, certificates.
- Evolving support tables for QR sessions/scans and student snapshots.
- Reporting view for event statistics.

## 5. Current Folder Structure

### Root
- README.md
- UML_CASE_STUDY_DOCUMENTATION.md
- backend
- frontend

### Backend
- src/app.js: Express app configuration and route mounting.
- src/server.js: API startup and database initialization.
- src/config: env, db, jwt, upload configuration.
- src/controllers: request handler layer.
- src/models: data access models.
- src/routes: API route definitions.
- src/services: business logic services.
- src/middleware: auth/role/error/rate-limit middleware.
- src/database/schema.sql: base schema.
- src/tests: backend test files.
- src/utils: utility helpers (certificates, templates, qr, etc.).
- src/validators: Joi or request validators.
- uploads: static uploaded assets served by backend.

### Frontend
- src/App.jsx: main router.
- src/main.jsx: app bootstrap.
- src/index.css: base styles.
- src/pages: public/student/organizer/admin/auth views.
- src/components: reusable UI components.
- src/services: API helper modules.
- src/routes: route guard components.
- src/hooks: reusable hook logic.
- src/data: static/helper data.

## 6. Frontend Routes (Implemented)

Public:
- /
- /club/:clubId
- /event/:eventId

Student:
- /student/login
- /register
- /student/dashboard
- /club/:clubId/event/:eventId/join

Organizer:
- /organizer/login
- /organizer/dashboard
- /organizer/event/:eventId

Admin:
- /admin/login
- /admin/dashboard
- /admin/clubs
- /admin/clubs/:clubId/members
- /admin/clubs/:clubId/events
- /admin/events/:eventId/participants
- /admin/reports

## 7. Backend App Mount Map

Mounted route groups from src/app.js:
- /uploads (static files)
- /api/public
- /api/students/auth
- /api/auth
- /api/organizers
- /api/admin
- /api/users
- /api/events
- /api/attendance
- /api/reports
- /api/registrations
- /api/students
- /api/health

## 8. Backend API Endpoints by Domain

Important: Below paths are relative to the mount path shown in each subsection.

### 8.1 Public APIs (mount: /api/public)

From src/routes/public.routes.js:
- GET /clubs
- GET /clubs/:clubId
- GET /clubs/:clubId/events
- GET /events/:eventId

From src/routes/public.certificate.routes.js:
- GET /certificates/verify

### 8.2 Student Auth APIs (mount: /api/students/auth)

From src/routes/student.auth.routes.js:
- POST /register
- POST /login
- GET /me
- DELETE /me
- POST /me/delete

### 8.3 Student Activity APIs (mount: /api/students)

From src/routes/student.events.routes.js:
- GET /events/live
- POST /clubs/:clubId/events/:eventId/register

From src/routes/student.qr.routes.js:
- POST /events/:eventId/qr/scan

From src/routes/club.profile.routes.js:
- POST /clubs/:clubId/events/:eventId/register

From src/routes/student.participation.routes.js:
- GET /me/participation

From src/routes/student.certificates.routes.js:
- POST /events/:eventId/certificates/generate
- GET /certificates/:certificateNo/download

### 8.4 Organizer APIs (mount: /api/organizers)

From src/routes/organizer.route.js:
- POST /register
- POST /login
- GET /profile

From src/routes/organizer.events.routes.js:
- GET /events
- POST /events
- PUT /events/:eventId/status
- DELETE /events/:eventId

From src/routes/organizer.attendance.routes.js:
- POST /events/:eventId/attendance/open
- POST /events/:eventId/attendance/mark

From src/routes/organizer.participants.routes.js:
- GET /events/:eventId/participants
- GET /events/:eventId/participants/download
- PUT /events/:eventId/attendance/manual

From src/routes/organizer.qr.routes.js:
- POST /events/:eventId/qr/open

From src/routes/organizer.certificate.routes.js:
- POST /events/:eventId/certificates/issue

### 8.5 Admin APIs (mount: /api/admin)

From src/routes/admin.routes.js:
- GET /dashboard/stats
- GET /clubs
- POST /clubs
- PUT /clubs/:id/toggle
- GET /clubs/:clubId/events
- GET /events/:eventId/participants
- GET /members
- POST /members
- GET /members/club/:clubId
- PUT /members/:id/toggle
- PUT /members/:id/role
- GET /clubs/:id

### 8.6 Generic/Auth Legacy Domain APIs

Auth (mount: /api/auth) from src/routes/auth.routes.js:
- POST /signup
- POST /login

Users (mount: /api/users) from src/routes/user.routes.js:
- GET /
- PUT /role

Events (mount: /api/events) from src/routes/event.routes.js:
- POST /
- GET /
- PUT /status

Attendance (mount: /api/attendance) from src/routes/attendance.routes.js:
- POST /register
- POST /qr
- GET /:eventId

Reports (mount: /api/reports) from src/routes/report.routes.js:
- GET /

Registrations (mount: /api/registrations) from src/routes/registration.routes.js:
- POST /

Health:
- GET /api/health

### 8.7 Present in Source but Not Mounted in app.js

These route files exist but are not currently mounted in src/app.js:
- src/routes/organizer.certificateTemplate.routes.js
- src/routes/student.routes.js

## 9. Database Schema and Data Model

Base schema in src/database/schema.sql defines:
- users
- clubs
- members
- events
- registrations
- attendance
- certificates
- event_statistics view

Schema includes key constraints/checks:
- Role checks for users and members.
- Event lifecycle checks: Draft, Created, Live, Completed, Archived.
- Attendance method checks.
- Registration uniqueness by event + student.

Indexes in base schema:
- idx_events_status
- idx_registrations_event
- idx_attendance_event

Additional startup migration logic in src/config/db.js creates or alters support structures:
- users additional profile columns (phone, roll_no, department, gender, year, updated_at).
- attendance day-based uniqueness index.
- event_qr_sessions
- event_qr_scans
- event_scan_student_snapshot
- club_student_profiles

## 10. Security and Middleware Model

Auth and authorization:
- auth.middleware.js validates authenticated requests.
- role.middleware.js enforces role-based access (Student, Organizer, Admin).
- organizerOnly.js restricts organizer-only profile endpoints.

Rate limiting:
- Auth routes use authRateLimiter (stricter limit).
- API limiter exists for broader use.
- Public and uploads are intentionally not globally rate-limited in app.js to avoid blocking public content and media.

Error handling:
- Centralized error middleware applied last in the middleware chain.

## 11. Services Layer (Business Logic)

Service modules in src/services:
- auth.service.js
- user.service.js
- student.service.js
- event.service.js
- attendance.service.js
- certificate.service.js
- certificateEligibility.js
- certificateIssuer.js
- certificateRenderer.js
- autoCertificateJob.js

These support:
- Auth workflows.
- Event/attendance operations.
- Certificate eligibility, rendering, issuing, and automation.

## 12. Environment Variables

### 12.1 Required for backend startup

Defined/validated in src/config/env.js:
- PORT (default 5000)
- DB_HOST (required)
- DB_PORT (default 5432)
- DB_NAME (required)
- DB_USER (required)
- DB_PASSWORD (required)
- JWT_SECRET (required)
- JWT_EXPIRES_IN (default 1d)
- NODE_ENV (default development)

### 12.2 Additional backend optional variables used by utilities/services

- CERTIFICATE_SECRET
- CERT_PREFIX
- PUBLIC_BACKEND_URL
- BACKEND_URL
- PUPPETEER_EXECUTABLE_PATH
- CHROME_PATH
- BROWSER_EXECUTABLE_PATH

### 12.3 Frontend variables in use

- VITE_BACKEND_URL
- VITE_API_URL
- VITE_GOOGLE_CLIENT_ID

## 13. Local Development Setup

### Prerequisites
- Node.js 20+ (22 recommended)
- PostgreSQL 14+
- npm

### Step 1: Install dependencies

Backend:
```bash
cd backend
npm install
```

Frontend:
```bash
cd frontend
npm install
```

### Step 2: Configure environment files

Create files:
- backend/.env
- frontend/.env

Example backend .env:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=student_events
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=1d
NODE_ENV=development
```

Example frontend .env:
```env
VITE_BACKEND_URL=http://localhost:5000
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Run backend

```bash
cd backend
npm run dev
```

Startup behavior:
- Connects to PostgreSQL.
- Executes schema initialization and migration steps automatically.
- Serves API on configured port.

### Step 4: Run frontend

```bash
cd frontend
npm run dev
```

Vite default dev host is typically http://localhost:5173.

## 14. Build, Test, and Lint Commands

Backend:
- npm run dev
- npm start
- npm test

Frontend:
- npm run dev
- npm run build
- npm run preview
- npm run lint

Current backend tests directory:
- src/tests

## 15. Core User Flows

### Public flow
1. Open landing page.
2. Browse clubs.
3. Open a club and its visible events.
4. Open an event detail page.

### Student flow
1. Register/login.
2. Browse live/created events.
3. Register for an event.
4. Submit QR scan for attendance.
5. View participation history.
6. Generate/download certificate if eligible.

### Organizer flow
1. Login as club member.
2. Create/manage own club events.
3. Open attendance and QR sessions.
4. Mark attendance (session/manual flows).
5. View/download participants data.
6. Issue certificates.

### Admin flow
1. Login.
2. View dashboard stats.
3. Create/toggle clubs.
4. Manage members and roles.
5. Inspect events and participants.
6. Access reports.

## 16. Notes About Current Codebase State

- The codebase includes both active and legacy route sets.
- Some newer attendance/certificate flows are implemented through extra tables initialized in db.js beyond base schema.sql.
- Public routes and uploads are intentionally excluded from global rate limiting for better user experience.

## 17. Quick Health Check

Request:
- GET /api/health

Expected response shape:
```json
{
  "status": "OK",
  "timestamp": "2026-04-21T00:00:00.000Z"
}
```

## 18. Repository Summary

Student Event Participation Management System is a role-based full-stack platform that provides:
- public event discovery,
- student participation workflows,
- organizer operational controls,
- admin governance,
- and certificate lifecycle support,

implemented through a React frontend and an Express + PostgreSQL backend with modular routes, middleware, services, and automated schema bootstrapping.
