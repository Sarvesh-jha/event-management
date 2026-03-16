# Smart Campus Events Frontend

This is the Angular client for the Smart Campus Events project.

## Main routes

- `/events` - browse available events
- `/events/:id` - event details and registration
- `/my-registrations` - student passes, notifications, and certificates
- `/login` - shared login page for students and admins
- `/register` - student signup
- `/admin` - admin dashboard and analytics

## Local development

```bash
npm install
npm start
```

The dev app runs on `http://localhost:4200`.

When the frontend is served on port `4200`, it targets the backend at `http://localhost:5001/api/v1`.

If a backend route is unavailable during frontend work, the app falls back to sample data so the screens still render.
