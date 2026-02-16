# Insurance App – Frontend

React (Vite) frontend for the Insurance & Reinsurance Policy and Claims Management system.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run backend** (from project root)
   ```bash
   cd backend && npm start
   ```
   Backend should run on **http://localhost:5000**.

3. **Run frontend**
   ```bash
   npm run dev
   ```
   App runs at **http://localhost:3000**. API requests are proxied to the backend via Vite.

## Features

- **Auth:** Login (JWT), logout, role-based access. Token refresh on 401.
- **Dashboard:** Exposure by policy type, claims ratio, reinsurer risk distribution.
- **Policies:** List, filter by status, create (multi-step wizard), view details, approve/reject/suspend. Link to risk allocation.
- **Claims:** List, filter, create (with policy selection and coverage check), view details, update status (workflow).
- **Reinsurance:** Treaties list; risk allocation view per policy (with recalculate).
- **Admin:** Users list (Admin only).

## First user

Create a user via the backend (e.g. Postman or `curl`):

```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@example.com","password":"admin123","role":"ADMIN"}'
```

Then log in at http://localhost:3000/login with that email and password.
