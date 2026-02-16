# SOTConnect

Centralized event and student management platform for the School of Technology.

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, React Router v6+, Axios, Lucide React
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Auth:** JWT (HttpOnly cookies), Bcrypt

## Project Structure

```
SOT events/
├── client/                      # React (Vite) frontend
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── MyRegistrations.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminEvents.jsx
│   │   │   ├── AdminEventForm.jsx
│   │   │   └── EventRegistrations.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── store/
│   │   │   └── authStore.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── server/                      # Express API
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── eventController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   └── Event.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── eventRoutes.js
│   │   └── userRoutes.js
│   ├── .env.example
│   ├── index.js
│   └── package.json
├── .gitignore
├── package.json
└── README.md
```

## Setup

1. **Install dependencies (root + client + server):**
   ```bash
   npm run install:all
   ```

2. **Environment:**
   - A `server/.env` is included with dev defaults. Or copy `server/.env.example` to `server/.env` and set `MONGODB_URI`, `JWT_SECRET`, `PORT` (default 5001 to avoid macOS port 5000 conflict).

3. **Seed test data (optional):**
   ```bash
   cd server && npm run seed          # 5 users (password: password123)
   cd server && npm run seed:events   # 18 sample events (run after seed)
   ```
   See [Test users](#test-users) below.

4. **Run development:**
   ```bash
   npm run dev
   ```
   - API: http://localhost:5001 (5001 avoids macOS AirPlay using 5000)
   - Client: http://localhost:5173

## Test users

After running `cd server && npm run seed`, you can log in with (password: **password123**):

| Email | Role |
|-------|------|
| admin1@sot.edu | Admin |
| admin2@sot.edu | Admin |
| student1@sot.edu | Student |
| student2@sot.edu | Student |
| student3@sot.edu | Student |

## Users

- **Student:** View/register for events, manage profile, view my registrations.
- **Admin/Faculty:** CRUD events, view registrations per event, analytics dashboard.

## API Overview

- `POST /api/auth/register` – Register (student or admin)
- `POST /api/auth/login` – Login (sets HttpOnly cookie)
- `POST /api/auth/logout` – Logout
- `GET /api/auth/me` – Current user

- `GET /api/events` – List events (filter: upcoming)
- `GET /api/events/:id` – Event by ID
- `POST /api/events` – Create event (admin)
- `PUT /api/events/:id` – Update event (admin)
- `DELETE /api/events/:id` – Delete event (admin)
- `POST /api/events/:id/register` – Register for event (student)
- `DELETE /api/events/:id/register` – Unregister (student)
- `GET /api/events/:id/registrations` – List registrations (admin)

- `GET /api/users/profile` – Get/update own profile
- `PUT /api/users/profile` – Update profile
- `GET /api/users/registrations` – My registrations (student)
# SOT_connect
