# Smart Campus Events Frontend

Angular frontend for the Smart Campus Event Management System.

## Available pages

- `/events` for event discovery
- `/events/:id` for event details and registration
- `/login` for student and admin sign in
- `/register` for student account creation
- `/admin` for analytics and admin overview

## Development

```bash
npm install
npm start
```

The frontend targets the backend API at `http://localhost:5000/api/v1`.

If the backend endpoints are not ready yet, the app automatically falls back to preview data so the UI remains usable during development.
