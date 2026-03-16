# Smart Campus Event Management System

A complete MEAN stack project for discovering, registering for, and managing college events.

This project is organized into two apps:

- `backend/` - Express.js + Node.js REST API with MongoDB
- `frontend/` - Angular application for students and admins

## Features

- Student signup and login with JWT authentication
- Admin login and protected admin actions
- Event create, update, delete, publish, and complete flows
- Student event registration with duplicate prevention
- QR code generation for event check-in
- QR verification for on-site entry
- Upcoming event reminders and in-app notifications
- Registration confirmation emails with Nodemailer
- PDF certificate generation after event completion
- Analytics dashboard with Chart.js

## Tech Stack

- MongoDB
- Express.js
- Angular
- Node.js
- Mongoose
- JWT
- bcryptjs
- Nodemailer
- PDFKit
- QRCode
- Chart.js

## Project Structure

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
│   └── package.json
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── core/
│   │       ├── features/
│   │       └── shared/
│   └── package.json
└── README.md
```

## Prerequisites

- Node.js 20 LTS recommended
- npm
- MongoDB running locally on `mongodb://127.0.0.1:27017`
- Angular CLI is optional because the project uses the local CLI from `node_modules`

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run seed:admin
npm run seed:demo
npm run dev
```

Default backend environment values are already documented in [backend/.env.example](/Users/sarveshjha/event management/backend/.env.example).

Important local note:

- This project is currently configured with `PORT=5001`
- The Angular frontend targets `http://localhost:5001/api/v1` when running on port `4200`

## Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend URL:

- `http://localhost:4200`

Backend URL:

- `http://localhost:5001`

## Demo Credentials

Admin account:

- Email: `admin@campus.edu`
- Password: `Admin@12345`

Students can create accounts from the register page.

## Useful Scripts

Backend:

- `npm run dev` - start backend with nodemon
- `npm start` - start backend with node
- `npm run seed:admin` - create the default admin account
- `npm run seed:demo` - seed demo events

Frontend:

- `npm start` - run Angular development server
- `npm run build` - create production build

## Main API Areas

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

## Notes

- When SMTP credentials are not configured, registration emails are generated in preview mode and logged by the backend.
- Certificates are available only after the event is marked as completed.
- Reminder processing runs through the notification service and can also be triggered through the reminder endpoint.

## Development Status

The full Phase 1 to Phase 10 implementation is present in this repository, including backend modules, Angular UI, analytics, certificates, and QR check-in.
