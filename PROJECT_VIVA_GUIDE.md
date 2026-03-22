# Smart Campus Events Viva Guide

This document explains the full build process, project architecture, file structure, backend flow, frontend flow, database integration, API design, and likely viva questions for the Smart Campus Events project.

## 1. Project idea in simple words

Smart Campus Events is a full-stack campus event management system built with the MEAN stack:

- MongoDB for storing users, events, registrations, and notifications
- Express.js for building REST APIs
- Angular for the frontend user interface
- Node.js as the backend runtime

The goal of the project is to solve a common campus problem:

- students do not know where to find all events
- registrations are often done in separate forms
- attendance is recorded manually
- reminders and certificates are handled outside the main system

This project brings all of that into one application.

## 2. Main modules in the system

The application has two major parts:

- `backend/` handles authentication, APIs, database access, QR check-in, reminders, email, certificates, and analytics
- `frontend/` handles the student and admin user interface

The main business features are:

- student signup and login
- admin login
- event creation, update, delete, and completion
- student event registration
- QR generation and verification
- notifications and reminders
- email confirmation
- certificate generation in PDF
- analytics dashboard

## 3. Architecture used in this project

The backend follows a modular layered structure:

- `routes` define URL endpoints
- `controllers` receive HTTP requests and send HTTP responses
- `services` contain business logic
- `models` define MongoDB schema structure using Mongoose
- `middlewares` handle cross-cutting concerns like auth and errors
- `utils` contain reusable helper functions

The frontend follows Angular standalone component architecture:

- `app.routes.ts` defines pages
- `services` call backend APIs
- `guards` protect routes
- `interceptor` attaches JWT automatically
- `models` define TypeScript interfaces
- `features` contain pages
- `shared` contains reusable UI components

Why this structure is good:

- code is easier to read
- business logic is separated from request handling
- models are reusable
- frontend and backend stay loosely coupled
- each feature is easier to debug and extend

## 4. Full build process used for this project

### Phase 1: project initialization

Backend was initialized first with Node.js and Express.

Installed main backend packages:

- `express` for API server
- `mongoose` for MongoDB integration
- `dotenv` for environment variables
- `cors` for frontend-backend communication
- `helmet` for basic security headers
- `morgan` for request logging
- `nodemon` for development

After that:

- Express app was created
- MongoDB connection function was added
- centralized config folder was added
- routing and middleware folders were created

### Phase 2: authentication

User authentication was built next.

Implemented:

- user schema
- password hashing with bcrypt
- JWT generation on login and register
- `protect` middleware for private routes
- `authorize` middleware for admin-only routes

### Phase 3: event management

Created event model and admin APIs for:

- create event
- update event
- delete event
- mark event completed
- list events for public users and admin users

### Phase 4: event registration

Created registration model and student registration flow.

Added:

- duplicate registration prevention
- confirmed or waitlisted registration status
- registration fetch for current user

### Phase 5: QR check-in

Added QR token generation when a student registers.

Admin can:

- paste the QR token into the dashboard
- verify the token
- mark the student as checked in

### Phase 6: notifications

Added in-app notification records for:

- registration confirmation
- upcoming reminders
- check-in success

### Phase 7: email confirmation

Integrated Nodemailer so email is sent on registration.

In local development:

- if SMTP is not configured, stream transport is used
- email preview is logged on the backend instead of sending a real email

### Phase 8: certificate generation

Integrated PDFKit to generate certificates dynamically.

Certificate is available only if:

- the student has checked in
- the event is completed or has already ended

### Phase 9: Angular frontend

Created Angular frontend with pages for:

- login
- register
- event listing
- event detail
- student registrations
- admin dashboard

### Phase 10: analytics dashboard

Added Chart.js-based charts to show:

- registration trend
- attendance trend
- event mode distribution
- summary statistics

## 5. How backend works from start to finish

### Step 1: server start

File: `backend/src/server.js`

This is the backend entry point.

It does four main things:

- connects MongoDB
- starts reminder cron job
- creates HTTP server from the Express app
- handles graceful shutdown

### Step 2: Express app setup

File: `backend/src/app.js`

This file configures:

- CORS
- Helmet
- Morgan logging
- JSON body parsing
- API root route
- `/api/v1` route mounting
- 404 handler
- global error handler

### Step 3: environment config

File: `backend/src/config/env.js`

This file collects all environment variables in one place:

- `PORT`
- `MONGODB_URI`
- `CLIENT_URL`
- `JWT_SECRET`
- SMTP settings
- admin seed credentials
- reminder job toggle

This makes configuration centralized and avoids reading `process.env` everywhere.

### Step 4: database connection

File: `backend/src/config/database.js`

This file uses `mongoose.connect(env.mongodbUri)` to connect the Node backend to MongoDB.

If the database connection fails:

- it throws an error
- server startup stops

## 6. Database integration explanation

This project uses MongoDB with Mongoose.

Why MongoDB:

- event and registration data is document-shaped
- schema is flexible
- easy to map nested fields like agenda and metadata

Why Mongoose:

- schema definitions
- validations
- indexes
- model methods
- easier querying and population

### Collections used

The database has four main collections:

- `users`
- `events`
- `registrations`
- `notifications`

### Relationships

- one `User` can create many `Event` documents if the user is admin
- one `User` can register for many `Event` documents
- one `Event` can have many `Registration` documents
- one `User` can receive many `Notification` documents

### Mongoose `populate`

Where relationships need actual object data instead of just IDs, the backend uses `.populate()`.

Examples:

- in registrations, populate `event` and `user`
- in notifications, populate `event`

This helps the API return useful frontend-ready data like event title and attendee name.

## 7. Backend models explained

### `backend/src/models/user.model.js`

Stores:

- full name
- email
- password
- role
- department
- student ID
- active status

Important points:

- password is stored with `select: false`, so it is hidden by default
- `pre('save')` hook hashes the password before saving
- `comparePassword()` compares raw login password with hashed password
- role can be `student` or `admin`

### `backend/src/models/event.model.js`

Stores event details like:

- title
- descriptions
- category
- department
- start and end time
- venue
- mode
- capacity
- registered count
- organizer
- keynote
- tags
- agenda
- status
- creator admin ID

Important points:

- agenda is embedded as subdocuments
- event status can be `draft`, `published`, or `completed`
- index is added on `startDate` and `status`

### `backend/src/models/registration.model.js`

Connects a student to an event.

Stores:

- user ID
- event ID
- note
- status
- QR code token
- checked-in status
- certificate fields
- email/reminder timestamps

Important points:

- unique index on `{ user, event }` prevents duplicate registrations
- QR token is unique
- waitlist and check-in status are handled here

### `backend/src/models/notification.model.js`

Stores in-app notification records.

Stores:

- user
- event
- type
- channel
- title
- message
- sent status
- read status
- metadata

This supports both:

- notification history
- unread/read state in frontend

## 8. Authentication flow in detail

### Registration flow

Route:

- `POST /api/v1/auth/register`

Flow:

1. route calls controller
2. controller calls `authService.registerStudent()`
3. service validates required fields
4. service checks existing email and student ID
5. new user is created
6. password is hashed by Mongoose pre-save hook
7. JWT token is generated
8. sanitized user data is returned

### Login flow

Route:

- `POST /api/v1/auth/login`

Flow:

1. user sends email and password
2. service loads user with `.select('+password')`
3. `comparePassword()` checks bcrypt hash
4. if valid, JWT token is generated
5. sanitized user response is returned

### Protected routes

File: `backend/src/middlewares/auth.middleware.js`

`protect` middleware:

- reads `Authorization: Bearer <token>`
- verifies JWT
- fetches fresh user from database
- blocks inactive or missing users
- attaches user to `req.user`

`authorize(...roles)` middleware:

- checks `req.user.role`
- allows only required role

This is how admin-only APIs are protected.

## 9. How event APIs are written

Event APIs are split across:

- route file
- controller file
- service file

### Route layer

File: `backend/src/routes/events.routes.js`

This file defines endpoint URLs and applies middleware.

Examples:

- public list events
- public get event by ID
- student register for event
- admin list all events
- admin create, update, delete, complete event

### Controller layer

File: `backend/src/controllers/event.controller.js`

Controllers do not contain heavy logic.

Their job is:

- call service function
- send JSON response
- set proper HTTP status code

### Service layer

File: `backend/src/services/event.service.js`

This contains actual business logic:

- normalize payload
- validate event fields
- fetch event data
- create and update event
- delete linked registrations and notifications on delete
- mark event completed

Why service layer is important:

- keeps controller clean
- logic can be reused
- easier to test
- easier to explain in viva

## 10. Registration API flow in detail

Route:

- `POST /api/v1/events/:eventId/register`

Main logic is in `backend/src/services/registration.service.js`.

Flow:

1. validate event ID
2. fetch event and current user
3. block if event is draft or ended
4. block if user is not a student
5. check duplicate registration
6. decide status:
   confirmed if seats are available
   waitlisted if capacity is full
7. generate random QR token using `crypto.randomBytes()`
8. save registration in MongoDB
9. increase `registeredCount` if confirmed
10. generate QR code image with `qrcode.toDataURL()`
11. create in-app notification
12. send email confirmation
13. return sanitized registration response

## 11. QR code check-in flow

Route:

- `POST /api/v1/registrations/verify-checkin`

Flow:

1. admin sends QR token
2. backend finds registration by `qrCodeToken`
3. if not found, return 404
4. if already checked in, return existing data
5. if registration was waitlisted, convert it to confirmed
6. mark `checkedIn = true`
7. save `checkedInAt`
8. save `checkedInBy`
9. create check-in notification
10. return success response

Why QR is implemented using token + data URL:

- token is the actual value stored in DB
- QR image is generated from token
- frontend can display the QR image directly
- admin can verify without needing a separate QR scanning library

## 12. Notification and reminder system

Main files:

- `backend/src/services/notification.service.js`
- `backend/src/controllers/notification.controller.js`
- `backend/src/routes/notifications.routes.js`
- `backend/src/jobs/reminder.job.js`

Two kinds of notification logic exist:

- immediate notifications
- scheduled reminder notifications

Immediate notifications:

- registration confirmation
- successful check-in

Scheduled reminder notifications:

- reminder for upcoming events within the next 24 hours

How scheduled reminders work:

- `server.js` starts `startReminderJob()`
- `node-cron` schedules job every hour using `0 * * * *`
- service looks for confirmed registrations where reminder not sent
- checks event time window
- sends email reminder
- stores notification
- updates `reminderSentAt`

## 13. Email integration explanation

Main file:

- `backend/src/services/email.service.js`

This service uses Nodemailer.

Two modes:

- real SMTP mode if SMTP config is provided
- stream transport mode if SMTP config is missing

Why stream transport is useful:

- project works in local development without real mail credentials
- developer can still see email flow through backend logs

Two email types are currently sent:

- registration confirmation
- upcoming event reminder

## 14. Certificate generation explanation

Main file:

- `backend/src/services/certificate.service.js`

The certificate is generated dynamically using PDFKit.

Flow:

1. student requests certificate download
2. backend checks registration belongs to current user
3. backend checks student is checked in
4. backend checks event is completed
5. if certificate fields are not set, backend creates:
   `certificateIssuedAt`
   `certificateNumber`
6. PDF buffer is generated in memory
7. response is sent as `application/pdf`

Why generate on demand instead of storing PDFs:

- saves storage
- certificate always uses latest event and user data
- simpler for student projects

## 15. Analytics dashboard explanation

Main files:

- `backend/src/services/analytics.service.js`
- `frontend/src/app/core/services/dashboard.service.ts`
- `frontend/src/app/features/admin/admin-dashboard-page.component.ts`
- `frontend/src/app/shared/components/chart-card/chart-card.component.ts`

Backend analytics calculates:

- total events
- total registrations
- upcoming events
- average occupancy
- check-in rate
- completion rate
- top categories
- featured events
- recent activity
- 7-day registration trend
- 7-day attendance trend
- event mode breakdown

This is a server-side calculated summary, which is better than calculating everything in frontend because:

- backend already has database access
- less repeated logic in browser
- admin dashboard gets ready-to-use data

## 16. API response format used in the project

Most APIs return this pattern:

```json
{
  "success": true,
  "message": "Some message",
  "data": {}
}
```

Error responses return:

```json
{
  "success": false,
  "message": "Error message",
  "stack": "only in development"
}
```

This gives a consistent response shape for frontend parsing.

## 17. Sanitizer utilities explanation

Main files:

- `backend/src/utils/sanitize-user.js`
- `backend/src/utils/sanitize-event.js`
- `backend/src/utils/sanitize-registration.js`

Why sanitizers are used:

- avoid exposing internal Mongoose objects directly
- hide sensitive data like password
- return a frontend-friendly shape
- ensure IDs are strings, not raw ObjectIds

This is very useful in viva because it shows API contract thinking.

## 18. How frontend works

### App bootstrap

`frontend/src/main.ts`

- imports `zone.js`
- bootstraps Angular standalone app

`frontend/src/app/app.config.ts`

- configures router
- configures HTTP client
- attaches auth interceptor
- enables router scrolling behavior

### Root component

`frontend/src/app/app.ts`

- gets auth state from `AuthService`
- decides what navbar items to show
- handles logout

`frontend/src/app/app.html`

- defines app shell
- navigation menu
- topbar actions
- router outlet

## 19. Frontend routing and route protection

`frontend/src/app/app.routes.ts`

Defines routes for:

- events list
- event detail
- login
- register
- admin dashboard
- my registrations
- not found page

Uses lazy loading with `loadComponent()`.

Why lazy loading:

- page code loads only when needed
- better performance
- cleaner feature separation

### Guards

`auth.guard.ts`

- allows only logged-in users
- redirects to login if not authenticated

`admin.guard.ts`

- allows only authenticated admins
- redirects others to login

## 20. How frontend talks to backend

The frontend stores JWT token in local storage.

Important files:

- `frontend/src/app/core/services/auth.service.ts`
- `frontend/src/app/core/interceptors/auth.interceptor.ts`
- `frontend/src/app/core/config/api.config.ts`

How it works:

1. user logs in
2. backend returns token
3. token is stored in local storage
4. interceptor reads token before each request
5. interceptor adds `Authorization: Bearer <token>`
6. backend middleware verifies the token

API base URL is generated in `api.config.ts`.

Special behavior:

- if frontend is running on port `4200`, backend port is assumed to be `5001`

## 21. Frontend services explained

### `auth.service.ts`

Handles:

- login
- register
- logout
- token storage
- current user state
- preview fallback mode if backend is unavailable

It uses Angular `signal()` and `computed()` to maintain reactive auth state.

### `event.service.ts`

Handles:

- fetch all public events
- fetch one event
- register for event
- fetch admin events
- create event
- update event
- delete event
- mark event completed

Also supports preview/sample fallback when backend is unavailable.

### `registration.service.ts`

Handles:

- fetch my registrations
- fetch my registration for one event
- verify QR check-in
- download certificate

### `notification.service.ts`

Handles:

- fetch user notifications
- mark notification as read

### `dashboard.service.ts`

Handles:

- fetch analytics summary for admin dashboard

## 22. Angular pages explained

### `login-page.component.ts/html/scss`

Purpose:

- login form for both students and admins
- validates email and password
- redirects admin to admin dashboard
- redirects student to events page

### `register-page.component.ts/html/scss`

Purpose:

- student signup form
- validates fields and confirm password
- calls backend register API

### `event-list-page.component.ts/html/scss`

Purpose:

- loads public events from backend
- supports search and category filter
- shows summary stats and spotlight event
- uses reusable event card component

### `event-detail-page.component.ts/html/scss`

Purpose:

- loads one event
- shows agenda and event details
- allows student registration
- loads existing registration if already registered
- shows QR pass
- allows certificate download after eligibility

### `my-registrations-page.component.ts/html/scss`

Purpose:

- student dashboard
- lists registrations
- shows QR code and statuses
- lists notifications
- marks notifications as read
- downloads certificates

### `admin-dashboard-page.component.ts/html/scss`

Purpose:

- loads analytics summary and admin event list
- creates new events
- edits existing events
- deletes events
- marks events completed
- verifies QR check-ins
- shows charts and category breakdown

### `not-found-page.component.ts/html/scss`

Purpose:

- fallback page for invalid routes

## 23. Shared frontend components explained

### `event-card.component.ts/html/scss`

Reusable event summary card used in event listing page.

It shows:

- title
- category
- mode
- date
- time
- venue
- seats left
- occupancy bar

### `chart-card.component.ts/html/scss`

Reusable chart wrapper for Chart.js.

It receives:

- title
- subtitle
- chart type
- labels
- values
- colors

It creates and destroys chart instances safely in Angular lifecycle hooks.

## 24. Preview/sample mode explanation

This project has a helpful frontend fallback mode.

If some backend APIs are unavailable during development:

- frontend can still display sample events
- sample dashboard data can still be shown
- temporary preview session can still work

This behavior is defined in:

- `frontend/src/app/core/config/demo-data.ts`
- auth, event, and dashboard services

This is mainly for development convenience.

## 25. File-by-file explanation

### Root files

- `.gitignore` ignores `node_modules`, `.env`, build output, logs, and `tmp`
- `README.md` project overview and setup instructions
- `PROJECT_VIVA_GUIDE.md` this explanation file

### Backend top-level files

- `backend/package.json` backend scripts and dependency list
- `backend/package-lock.json` exact dependency lock file
- `backend/.env.example` sample environment variable template

### Backend config

- `backend/src/server.js` backend entry point and startup sequence
- `backend/src/app.js` Express app configuration
- `backend/src/config/env.js` centralized environment variables
- `backend/src/config/database.js` MongoDB connection function

### Backend controllers

- `backend/src/controllers/auth.controller.js` auth route handlers
- `backend/src/controllers/event.controller.js` event route handlers
- `backend/src/controllers/registration.controller.js` registration and certificate handlers
- `backend/src/controllers/notification.controller.js` notification route handlers
- `backend/src/controllers/analytics.controller.js` analytics route handler
- `backend/src/controllers/health.controller.js` health check handler

### Backend routes

- `backend/src/routes/index.js` mounts all sub-routes under `/api/v1`
- `backend/src/routes/auth.routes.js` auth endpoints
- `backend/src/routes/events.routes.js` event endpoints
- `backend/src/routes/registrations.routes.js` registration endpoints
- `backend/src/routes/notifications.routes.js` notification endpoints
- `backend/src/routes/analytics.routes.js` analytics endpoint

### Backend middlewares

- `backend/src/middlewares/auth.middleware.js` JWT auth and role authorization
- `backend/src/middlewares/error.middleware.js` centralized error response formatter
- `backend/src/middlewares/not-found.middleware.js` handles unknown routes

### Backend models

- `backend/src/models/user.model.js` user schema
- `backend/src/models/event.model.js` event schema
- `backend/src/models/registration.model.js` registration schema
- `backend/src/models/notification.model.js` notification schema
- `backend/src/models/.gitkeep` placeholder to keep folder in git

### Backend services

- `backend/src/services/auth.service.js` auth business logic
- `backend/src/services/event.service.js` event business logic
- `backend/src/services/registration.service.js` registration, QR, and certificate flow
- `backend/src/services/notification.service.js` notification creation and reminder processing
- `backend/src/services/email.service.js` email sending with Nodemailer
- `backend/src/services/certificate.service.js` PDF creation with PDFKit
- `backend/src/services/analytics.service.js` admin analytics calculations
- `backend/src/services/.gitkeep` placeholder file

### Backend utils

- `backend/src/utils/app-error.js` helper to create errors with status codes
- `backend/src/utils/jwt.js` JWT generate and verify helpers
- `backend/src/utils/sanitize-user.js` safe user response formatter
- `backend/src/utils/sanitize-event.js` safe event response formatter
- `backend/src/utils/sanitize-registration.js` safe registration response formatter
- `backend/src/utils/async-delay.js` helper placeholder, not used in core flow
- `backend/src/utils/.gitkeep` placeholder file

### Backend jobs and scripts

- `backend/src/jobs/reminder.job.js` hourly cron job for reminders
- `backend/src/scripts/seed-admin.js` seeds or updates default admin
- `backend/src/scripts/seed-demo-data.js` inserts sample events

### Frontend top-level files

- `frontend/package.json` Angular scripts and dependency list
- `frontend/package-lock.json` exact frontend dependency lock file
- `frontend/angular.json` Angular build and serve configuration
- `frontend/tsconfig.json` base TypeScript config
- `frontend/tsconfig.app.json` TypeScript config for app build
- `frontend/tsconfig.spec.json` TypeScript config for tests
- `frontend/README.md` frontend-specific notes
- `frontend/.editorconfig` editor formatting defaults
- `frontend/.gitignore` ignores Angular generated files
- `frontend/.prettierrc` code formatting rules
- `frontend/.vscode/extensions.json` recommended VS Code extensions
- `frontend/.vscode/launch.json` VS Code debug launch config
- `frontend/.vscode/tasks.json` VS Code task definitions
- `frontend/.vscode/mcp.json` local VS Code MCP-related configuration
- `frontend/public/favicon.ico` browser tab icon

### Frontend app bootstrap

- `frontend/src/main.ts` Angular bootstrap entry
- `frontend/src/index.html` base HTML page
- `frontend/src/styles.scss` global styles and design system variables

### Frontend app shell

- `frontend/src/app/app.config.ts` Angular providers setup
- `frontend/src/app/app.routes.ts` route configuration
- `frontend/src/app/app.ts` root component logic
- `frontend/src/app/app.html` root layout template
- `frontend/src/app/app.scss` shell styling
- `frontend/src/app/app.spec.ts` base Angular test file

### Frontend core config

- `frontend/src/app/core/config/api.config.ts` frontend app name and backend base URL
- `frontend/src/app/core/config/demo-data.ts` sample fallback events and dashboard data

### Frontend core guards and interceptor

- `frontend/src/app/core/guards/auth.guard.ts` protects authenticated routes
- `frontend/src/app/core/guards/admin.guard.ts` protects admin route
- `frontend/src/app/core/interceptors/auth.interceptor.ts` injects JWT into outgoing HTTP requests

### Frontend core models

- `frontend/src/app/core/models/campus-user.model.ts` frontend user interface
- `frontend/src/app/core/models/auth.model.ts` auth request and response types
- `frontend/src/app/core/models/event.model.ts` event-related types
- `frontend/src/app/core/models/registration.model.ts` registration types
- `frontend/src/app/core/models/notification.model.ts` notification types
- `frontend/src/app/core/models/analytics.model.ts` analytics and chart data types

### Frontend core services

- `frontend/src/app/core/services/auth.service.ts` login, register, logout, token persistence
- `frontend/src/app/core/services/event.service.ts` event and admin event API calls
- `frontend/src/app/core/services/registration.service.ts` registration and certificate API calls
- `frontend/src/app/core/services/notification.service.ts` notification API calls
- `frontend/src/app/core/services/dashboard.service.ts` analytics API calls

### Frontend feature pages

- `frontend/src/app/features/auth/login-page.component.ts` login page logic
- `frontend/src/app/features/auth/login-page.component.html` login page markup
- `frontend/src/app/features/auth/login-page.component.scss` login page styling
- `frontend/src/app/features/auth/register-page.component.ts` register page logic
- `frontend/src/app/features/auth/register-page.component.html` register page markup
- `frontend/src/app/features/auth/register-page.component.scss` register page styling
- `frontend/src/app/features/events/event-list-page.component.ts` event list page logic
- `frontend/src/app/features/events/event-list-page.component.html` event list page markup
- `frontend/src/app/features/events/event-list-page.component.scss` event list page styling
- `frontend/src/app/features/events/event-detail-page.component.ts` event detail and registration logic
- `frontend/src/app/features/events/event-detail-page.component.html` event detail markup
- `frontend/src/app/features/events/event-detail-page.component.scss` event detail styling
- `frontend/src/app/features/admin/admin-dashboard-page.component.ts` admin dashboard logic
- `frontend/src/app/features/admin/admin-dashboard-page.component.html` admin dashboard markup
- `frontend/src/app/features/admin/admin-dashboard-page.component.scss` admin dashboard styling
- `frontend/src/app/features/student/my-registrations-page.component.ts` student dashboard logic
- `frontend/src/app/features/student/my-registrations-page.component.html` student dashboard markup
- `frontend/src/app/features/student/my-registrations-page.component.scss` student dashboard styling
- `frontend/src/app/features/not-found/not-found-page.component.ts` 404 page logic
- `frontend/src/app/features/not-found/not-found-page.component.html` 404 page markup
- `frontend/src/app/features/not-found/not-found-page.component.scss` 404 page styling

### Frontend shared components

- `frontend/src/app/shared/components/event-card/event-card.component.ts` event card logic
- `frontend/src/app/shared/components/event-card/event-card.component.html` event card markup
- `frontend/src/app/shared/components/event-card/event-card.component.scss` event card styling
- `frontend/src/app/shared/components/chart-card/chart-card.component.ts` chart wrapper logic
- `frontend/src/app/shared/components/chart-card/chart-card.component.html` chart wrapper markup
- `frontend/src/app/shared/components/chart-card/chart-card.component.scss` chart wrapper styling

## 26. One complete end-to-end example

### Example: student registers for an event

Frontend side:

1. student opens event detail page
2. `event-detail-page.component.ts` loads event
3. if logged in, it also loads current registration status
4. student clicks register
5. `EventService.registerForEvent()` sends POST request

Request:

- `POST /api/v1/events/:eventId/register`

Backend side:

1. route matches in `events.routes.js`
2. `protect` middleware checks JWT
3. controller calls `registrationService.registerForEvent()`
4. service validates everything
5. registration saved in MongoDB
6. QR token created
7. QR image generated
8. notification created
9. email sent
10. JSON response returned

Frontend side after response:

1. response is mapped into `StudentRegistration`
2. page stores registration in a signal
3. QR code is shown to the student
4. registered count is updated on UI

## 27. Likely viva questions with answers

### Why did you use JWT?

JWT allows stateless authentication. After login, the server gives a signed token. The frontend stores it and sends it in future requests. The backend verifies the token without storing server-side sessions.

### Why did you use Mongoose instead of direct MongoDB queries?

Mongoose gives schema definitions, validation, hooks, indexes, and model methods. It makes the code cleaner and safer.

### Why did you create separate service files?

To keep business logic separate from HTTP routing. Controllers stay small, and the core logic becomes reusable and easier to maintain.

### Why are there sanitizers?

Sanitizers prevent leaking internal fields and create a clean response shape for frontend use.

### How do you prevent duplicate event registration?

Two ways:

- service checks for an existing registration before creating a new one
- MongoDB unique compound index on `{ user, event }`

### How do you secure admin APIs?

- user logs in and gets JWT
- protected routes verify JWT
- `authorize('admin')` blocks non-admin users

### How is QR check-in handled?

Every registration gets a unique QR token. Admin submits that token to a verification endpoint. Backend finds the matching registration and marks attendance.

### How is the certificate protected?

Certificate is only given if:

- registration belongs to logged-in student
- student has checked in
- event is completed or ended

### How does frontend know which backend to call?

`api.config.ts` builds `API_BASE_URL`. When frontend runs on `4200`, it targets backend on `5001`.

### How does Angular automatically send JWT?

The `authInterceptor` reads token from `AuthService` and adds `Authorization` header to outgoing requests.

### Why is analytics calculated on backend?

Because the backend has full access to registrations, events, and notifications. Returning summarized analytics is more efficient than sending raw records to frontend for calculation.

## 28. Short submission summary you can say to a teacher

"This project is a MEAN stack Smart Campus Event Management System. The backend is built with Express, Node.js, MongoDB, and Mongoose using a layered architecture of routes, controllers, services, and models. Authentication is based on JWT with role-based authorization for admin routes. Students can browse events, register, receive QR codes, notifications, reminders, and certificates. Admins can create and manage events, verify QR check-ins, and monitor analytics through an Angular dashboard. The frontend is built with Angular standalone components, route guards, an HTTP interceptor, and service-based API communication. MongoDB stores users, events, registrations, and notifications, and the whole system is integrated through REST APIs."

## 29. Best way to study before submission

Focus on these five flows:

- authentication flow
- event CRUD flow
- registration and QR flow
- reminder and email flow
- certificate and analytics flow

If you can explain those five clearly, you can answer most teacher questions confidently.
