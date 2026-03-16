# Smart Campus Events

Smart Campus Events is a MEAN stack project I built to make college event management less messy for both students and organizers.

In many campuses, events are announced in WhatsApp groups, registrations happen in Google Forms, attendance is tracked manually, and certificates are handled later through separate tools. This project brings those steps into one system. Students can discover events, register, receive reminders, check in with a QR code, and download their certificate after completion. Admins can create events, manage registrations, verify entry, and view participation analytics from one dashboard.

## What this project does

- student signup and login using JWT authentication
- admin login with protected admin routes
- create, edit, delete, and complete event flows
- student event registration with duplicate prevention
- QR code generation for check-in
- QR verification for event entry
- upcoming event reminders
- confirmation email on successful registration
- PDF certificate generation after event completion
- analytics dashboard with charts for participation insights

## Tech stack

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

## Why I built it this way

I wanted the project to feel like something that could actually be used inside a college environment, not just a CRUD demo. That is why the flow goes beyond simple event listing:

- authentication is role-based for students and admins
- registrations create QR passes instead of just a success message
- the system sends reminders and confirmation emails
- certificates are generated only after attendance is recorded
- the admin dashboard shows participation trends instead of just raw tables

## Folder structure

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

## Local setup

### Prerequisites

- Node.js 20 LTS recommended
- npm
- MongoDB running locally on `mongodb://127.0.0.1:27017`

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run seed:admin
npm run seed:demo
npm run dev
```

Backend runs on:

- `http://localhost:5001`

### Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs on:

- `http://localhost:4200`

## Important local note

The backend is configured on port `5001` in this workspace because port `5000` was already occupied on the machine used during development. The Angular frontend already points to `5001` while running on `4200`, so the project works out of the box with the current setup.

## Demo admin account

- Email: `admin@campus.edu`
- Password: `Admin@12345`

Students can create their own accounts from the registration page.

## Main backend scripts

- `npm run dev` - start backend with nodemon
- `npm start` - start backend with node
- `npm run seed:admin` - seed default admin account
- `npm run seed:demo` - seed sample events

## Main frontend scripts

- `npm start` - run Angular dev server
- `npm run build` - create production build

## Main API routes

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

