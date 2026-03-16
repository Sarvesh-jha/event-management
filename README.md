# Smart Campus Events

Smart Campus Events is a full-stack campus event platform built with the MEAN stack. The idea behind it is simple: most college events get announced in too many places, registrations happen in different forms, and attendance tracking becomes messy on the day of the event.

This project pulls those pieces into one workflow. Students can find events, save their seat, receive reminders, show a QR pass at check-in, and download a certificate later. Admins get a dashboard to create events, manage turnout, and track participation trends.

## What is already working

- student signup and login with JWT auth
- admin login and protected admin routes
- event create, edit, delete, publish, and complete flows
- student registration with duplicate registration checks
- QR code generation for event entry
- check-in verification from the admin side
- reminder notifications for upcoming events
- registration email confirmation
- PDF certificate generation after completion
- analytics dashboard with charts

## Stack

- MongoDB + Mongoose
- Express.js
- Angular
- Node.js
- JWT
- bcryptjs
- Nodemailer
- PDFKit
- QRCode
- Chart.js

## Project layout

```text
smart-campus-events/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── jobs/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── scripts/
│   │   ├── services/
│   │   └── utils/
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── core/
│   │       ├── features/
│   │       └── shared/
└── README.md
```

## Run it locally

### 1. Prerequisites

- Node.js 20 LTS recommended
- npm
- MongoDB running locally on `mongodb://127.0.0.1:27017`

### 2. Start the backend

```bash
cd backend
npm install
cp .env.example .env
npm run seed:admin
npm run seed:demo
npm run dev
```

The environment template is in [`backend/.env.example`](backend/.env.example).

### 3. Start the frontend

```bash
cd frontend
npm install
npm start
```

Open:

- frontend: `http://localhost:4200`
- backend: `http://localhost:5001`

## Local setup note

The API is configured for `5001` in this workspace because port `5000` was already occupied on the machine where the project was being tested. The frontend already points to `5001` when it runs on `4200`, so nothing extra is needed locally.

## Demo access

Admin account:

- email: `admin@campus.edu`
- password: `Admin@12345`

Student accounts can be created from the register page.

## Useful scripts

Backend:

- `npm run dev` - start the API with nodemon
- `npm start` - start the API with node
- `npm run seed:admin` - create the seeded admin account
- `npm run seed:demo` - insert demo events

Frontend:

- `npm start` - run the Angular dev server
- `npm run build` - create a production build

## Main API areas

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/events`
- `POST /api/v1/events`
- `PATCH /api/v1/events/:eventId`
- `DELETE /api/v1/events/:eventId`
- `POST /api/v1/events/:eventId/register`
- `GET /api/v1/registrations/me`
- `POST /api/v1/registrations/verify-checkin`
- `GET /api/v1/notifications/me`
- `GET /api/v1/analytics/events`

## A few practical notes

- If SMTP credentials are missing, emails are still generated in preview mode and logged by the backend.
- Certificates are only available after the student has checked in and the event is marked completed.
- If the frontend cannot reach an API during development, it falls back to sample data so the UI remains usable.

<<<<<<< HEAD

=======
## What I would improve next

- add automated tests around auth, registration, and certificate flows
- support image upload for event covers instead of manual gradient values
- add stronger audit logging for admin actions
- package the app for deployment with Docker or a CI pipeline
>>>>>>> 488fe2f (maked it more clean)
