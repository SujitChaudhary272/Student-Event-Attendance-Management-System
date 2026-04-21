# Student Event Participation Management System - UML Documentation Pack

Use this document as the source context to generate UML diagrams for the case study.

## 1) System Scope

A role-based campus event management platform with 4 primary actors:
- Public User
- Student
- Organizer (club member)
- Admin

Core capabilities:
- Public club/event discovery
- Student registration/login (email OTP + Google)
- Event registration with profile completion checks
- Attendance management (session code + QR ENTRY/EXIT)
- Participation tracking and certificate eligibility
- Certificate issue, download, and public verification
- Admin governance of clubs and members
- Reporting via aggregated event statistics

## 2) Actors and Responsibilities

- Public User: browse active clubs and visible events; verify certificates publicly.
- Student: sign up/login, verify email, register for events, scan QR attendance, view participation timeline, download certificate.
- Organizer: login as club member, create/manage events, open attendance/QR sessions, mark attendance manually, issue certificates.
- Admin: login, create/toggle clubs, manage members and roles, view dashboard/reporting.

## 3) Domain Model (for Class Diagram)

Design the class diagram around the following classes/entities.

### 3.1 Core Entities

1. User
- id: int
- name: string
- email: string
- password_hash: string
- auth_provider: string (password|google)
- google_sub: string?
- role: string (Student|Admin)
- is_email_verified: bool
- roll_no: string?
- department: string?
- phone: string?
- gender: string?
- year: string?
- created_at: datetime
- updated_at: datetime

2. Club
- id: int
- name: string
- category: string?
- description: string?
- image: string?
- status: string (Active|Inactive)
- created_at: datetime

3. Member (Organizer Account)
- id: int
- club_id: int
- name: string
- email: string
- password: string
- role: string (President|Secretary|Member)
- status: string (Active|Inactive)
- created_at: datetime

4. Event
- id: int
- club_id: int
- organizer_id: int
- title: string
- description: string?
- event_type: string
- venue: string?
- image_url: string?
- capacity: int
- attendance_method: string (QR_SINGLE|QR_INOUT|OTP|MANUAL)
- attendance_session_code: string?
- attendance_session_expires: datetime?
- start_time: datetime
- end_time: datetime
- status: string (Draft|Created|Live|Completed|Archived)
- created_at: datetime
- optional/event-evolution fields used in logic: event_seq, attendance_policy, certificate_policy

5. Registration
- id: int
- event_id: int
- student_id: int
- status: string (Registered|Cancelled)
- certified: bool? (used by certificate workflow)
- certificate_no: string?
- verification_hash: string?
- issued_at: datetime?
- eligibility_snapshot: json?
- created_at: datetime

6. Attendance
- id: int
- event_id: int
- student_id: int
- day: date? (if multi-day schema variant)
- check_in_time: datetime?
- check_out_time: datetime?
- status: string (Present|Absent)
- verified_by_member_id: int?
- method: string (QR|OTP|MANUAL)
- created_at: datetime

7. Certificate (legacy/core table)
- id: int
- event_id: int
- student_id: int
- certificate_type: string
- verification_code: string
- issued_at: datetime

### 3.2 Supporting Entities (used by implemented flows)

8. EventQrSession
- event_id: int
- day: date
- qr_type: string (ENTRY|EXIT)
- token: string
- expires_at: datetime
- is_active: bool

9. EventQrScan
- event_id: int
- day: date
- student_id: int
- qr_type: string
- scanned_at: datetime

10. EventScanStudentSnapshot
- event_id: int
- day: date
- student_id: int
- roll_no: string
- department: string
- phone: string
- gender: string
- year: string
- created_at: datetime

11. CertificateTemplate
- event_id: int
- template_html: text
- updated_at: datetime

12. ClubStudentProfile
- club_id: int
- student_id: int
- roll_no: string
- department: string
- phone: string
- gender: string
- year: string

### 3.3 Key Relationships (with multiplicities)

- Club 1 --- * Member
- Club 1 --- * Event
- Member 1 --- * Event (organizer_id)
- User(Student) 1 --- * Registration
- Event 1 --- * Registration
- User(Student) 1 --- * Attendance
- Event 1 --- * Attendance
- Member 0..1 --- * Attendance (verified_by_member_id)
- Event 1 --- * EventQrSession
- EventQrSession 1 --- * EventQrScan
- User(Student) 1 --- * EventQrScan
- Event 1 --- 0..1 CertificateTemplate
- Club 1 --- * ClubStudentProfile
- User(Student) 1 --- * ClubStudentProfile
- Event 1 --- * Certificate (legacy) and/or Registration carries certificate fields in evolved flow

### 3.4 Service/Control Classes to include in class diagram

- AuthService
- StudentAuthController
- OrganizerEventsController
- OrganizerAttendanceController
- OrganizerQrController
- CertificateIssuerService
- CertificateEligibilityService
- AutoCertificateJobService
- ParticipationPolicyEngine

Suggested dependencies:
- Controllers -> Services -> Repositories/DB
- CertificateIssuerService -> CertificateEligibilityService
- OrganizerEventsController -> AutoCertificateJobService (on Completed transition)

## 4) Main Activity Flows (for Activity Diagram)

Create one overall activity diagram with swimlanes: Public, Student, Organizer, Admin, System/DB.

### 4.1 Public Discovery
1. Public user opens home page.
2. System fetches active clubs.
3. User selects a club.
4. System fetches club events.
5. System auto-computes event status by time.
6. Filter visible events to Created/Live.
7. User views event details.

### 4.2 Student Onboarding + Event Registration
1. Student submits signup (name, email, password).
2. System checks existing account and role conflicts.
3. System generates OTP, stores hashed OTP + expiry, sends email.
4. Student submits OTP.
5. Decision: OTP valid and unexpired?
6. If valid -> mark email verified and issue JWT.
7. Student requests event registration.
8. System checks profile completeness.
9. Decision: profile complete?
10. If not complete -> collect roll_no/department/phone/gender/year and save.
11. System checks event existence and capacity.
12. Decision: capacity available and not already registered?
13. If yes -> create registration.
14. Show success and update participation state as Registered.

### 4.3 Attendance (Organizer + Student)
1. Organizer opens attendance session code (optional path).
2. Organizer opens QR (ENTRY/EXIT) for selected event day.
3. System validates event ownership, day range, and 30-minute timing rule.
4. System creates active QR token with expiry.
5. Student scans QR token.
6. System validates event Live status, token validity, token-event match, and expiry.
7. System logs QR scan + student snapshot.
8. Decision: QR type EXIT and ENTRY exists for same day?
9. If yes -> mark attendance Present.
10. Student/organizer views updated attendance.

### 4.4 Certificate Lifecycle
1. Precondition: event status becomes Completed (time-based transition).
2. AutoCertificateJob iterates all event registrations.
3. For each student, check eligibility (Present attendance).
4. Decision: eligible?
5. If yes -> generate certificate_no and verification_hash, update registration certificate fields.
6. Organizer may also issue certificate manually (with optional force flag).
7. Student downloads certificate PDF using certificate template and verification URL.
8. Public verifier checks certificate number + hash.
9. System recomputes expected hash and returns verified/unverified result.

### 4.5 Admin Governance
1. Admin logs in.
2. Admin views dashboard stats (clubs/events/live/monthly).
3. Admin creates club (optional image upload).
4. System checks duplicate club name.
5. Admin toggles club status Active/Inactive.
6. Admin adds member (club association, role, status).
7. System hashes password and persists member.
8. Admin updates member role or status.

## 5) Sequence Diagram Specifications

Generate at least these 3 sequence diagrams.

### 5.1 Sequence A: Student Registration + OTP + Event Join
Participants:
- Student UI
- StudentAuthController
- MailerService
- UserTable(DB)
- StudentEventRegistrationController
- EventTable(DB)
- RegistrationTable(DB)

Message flow:
1. UI -> StudentAuthController: POST /students/auth/register
2. Controller -> UserTable: check email/role/provider
3. Controller -> UserTable: insert/update student + otp hash + expiry
4. Controller -> MailerService: send OTP
5. Controller -> UI: OTP sent
6. UI -> StudentAuthController: POST /students/auth/verify-otp
7. Controller -> UserTable: validate otp hash + expiry
8. Controller -> UserTable: set is_email_verified=true
9. Controller -> UI: JWT token
10. UI -> StudentEventRegistrationController: POST /students/clubs/{clubId}/events/{eventId}/register
11. Controller -> UserTable: check/update profile fields
12. Controller -> EventTable: check capacity
13. Controller -> RegistrationTable: insert registration (conflict-safe)
14. Controller -> UI: registration success

### 5.2 Sequence B: Organizer Opens QR and Student Scans
Participants:
- Organizer UI
- OrganizerQrController
- EventTable(DB)
- EventQrSessionTable(DB)
- Student UI Scanner
- StudentQrController
- EventQrScanTable(DB)
- AttendanceTable(DB)

Message flow:
1. Organizer UI -> OrganizerQrController: POST /organizers/events/{eventId}/qr/open (qr_type, day)
2. Controller -> EventTable: validate event ownership and date range
3. Controller: enforce ENTRY/EXIT time windows
4. Controller -> EventQrSessionTable: deactivate old + insert new token
5. Controller -> Organizer UI: token + expiry
6. Student UI -> StudentQrController: POST /students/events/{eventId}/qr/scan (token)
7. Controller -> EventTable: ensure event status Live
8. Controller -> EventQrSessionTable: validate active/non-expired token
9. Controller -> EventQrScanTable: insert scan record
10. alt qr_type == EXIT and prior ENTRY exists
11. StudentQrController -> AttendanceTable: upsert Present
12. end
13. Controller -> Student UI: scan result message

### 5.3 Sequence C: Certificate Issue + Public Verification
Participants:
- Organizer UI
- OrganizerCertificateController
- CertificateIssuerService
- CertificateEligibilityService
- RegistrationTable(DB)
- AttendanceTable(DB)
- Public Verifier UI
- PublicCertificateController

Message flow:
1. Organizer UI -> OrganizerCertificateController: POST /organizers/events/{eventId}/certificates/issue
2. Controller -> CertificateIssuerService: issueCertificateForStudent(eventId, studentId)
3. Service -> RegistrationTable: verify registration/existing cert
4. Service -> CertificateEligibilityService: checkEligibility
5. Eligibility -> AttendanceTable: count Present rows
6. If eligible: Service generates certificate_no + verification_hash
7. Service -> RegistrationTable: update certified fields
8. Service -> Organizer UI: success payload
9. Public Verifier UI -> PublicCertificateController: GET /public/certificates/verify?no=&hash=
10. Controller -> RegistrationTable: load certificate record
11. Controller: recompute expected hash
12. Controller -> Public Verifier UI: verified true/false

## 6) Package Diagram Specification

Use these packages and dependencies:

1. Presentation Layer (Frontend)
- pages/public
- pages/auth
- pages/student
- pages/organizer
- pages/admin
- services/* API clients
- hooks/*

2. API Layer (Express Routes + Controllers)
- routes/public
- routes/students
- routes/organizers
- routes/admin
- controllers/*

3. Business Layer (Services + Utils)
- services/auth
- services/attendance
- services/participation
- services/certificate
- utils/policy/hash/googleAuth/certificates

4. Security & Middleware Layer
- authMiddleware
- roleMiddleware
- organizerOnly
- requireVerifiedStudent
- rateLimiter

5. Data Access Layer
- models/*
- config/db (pool/query)
- SQL schema/views

6. Persistence Layer (PostgreSQL)
- users, clubs, members, events, registrations, attendance, certificates
- extended tables: event_qr_sessions, event_qr_scans, certificate_templates, club_student_profiles
- view: event_statistics

Dependency direction:
Frontend -> API Layer -> Business Layer -> Data Access Layer -> Database.
Middleware cross-cuts API Layer.

## 7) Deployment Diagram Specification

Nodes:
1. Client Device
- Browser running React SPA (Vite build)

2. Web Server / App Server (Node.js)
- Express app
- REST endpoints
- Static uploads endpoint (/uploads)
- JWT auth and rate limiting

3. Database Server
- PostgreSQL
- core tables + views

4. External Services
- Email SMTP service (OTP)
- Google Identity (OAuth credential verification)

Connections:
- Browser <-> Express over HTTPS/HTTP JSON REST
- Express <-> PostgreSQL over TCP (5432)
- Express <-> SMTP provider for OTP mail
- Browser/Express <-> Google auth token verification flow

Deployment notes:
- Backend initializes schema at startup.
- Frontend uses environment variable for backend base URL.
- Uploaded club images are served by backend static route.

## 8) Diagram Generation Instructions for Claude

Generate these diagrams from this specification:
1. Class Diagram (domain + controller/service classes)
2. Activity Diagram (end-to-end with swimlanes)
3. Sequence Diagram A (Student onboarding + event registration)
4. Sequence Diagram B (QR attendance)
5. Sequence Diagram C (Certificate issue + public verification)
6. Package Diagram
7. Deployment Diagram

Formatting requirements:
- Use UML notation with multiplicities.
- Show decision nodes for validation branches in activity diagram.
- Show alt/opt fragments in sequence diagrams.
- Keep names aligned with classes/entities/endpoints defined above.
- Output in PlantUML (preferred) or Mermaid UML syntax.

## 9) Assumptions to annotate in diagrams

- Event status transitions are time-driven (Created -> Live -> Completed -> Archived), with manual archive allowed.
- Certificate data is primarily stored on registrations in evolved flow, while legacy certificates table may still exist.
- Some extended tables are implied by active controller logic even if not present in base schema.sql snapshot.
- Student profile fields are on users table in current implementation.
