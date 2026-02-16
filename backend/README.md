# Insurance & Reinsurance – Backend API

Node.js + Express + MongoDB backend for the Policy and Claims Management System (capstone spec).

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment**
   - Copy `.env.example` to `.env` and set `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET` as needed.
   - Default: `mongodb://localhost:27017/insurance`, port `5000`.

3. **Run**
   ```bash
   npm start
   ```
   Or with file watch: `npm run dev`

## API Overview

| Base path | Description |
|-----------|-------------|
| `GET /api/health` | Health check (no auth) |
| **Auth** | |
| `POST /api/auth/login` | Login (email, password) → accessToken, refreshToken, user |
| `POST /api/auth/refresh` | Body: `{ refreshToken }` → new accessToken, refreshToken |
| `POST /api/auth/logout` | Body: `{ refreshToken }` (optional) |
| `GET /api/auth/me` | Current user (Bearer token) |
| **Users** | Admin only (except register) |
| `POST /api/users/register` | Create user (password hashed with bcrypt) |
| `GET /api/users` | List users (query: status, role) |
| `GET /api/users/:id` | Get user |
| `PATCH /api/users/:id` | Update user |
| **Policies** | |
| `POST /api/policies` | Create policy (DRAFT); auto policy number; triggers reinsurance calc |
| `GET /api/policies` | List (query: status, lineOfBusiness, page, limit) |
| `GET /api/policies/:id` | Get policy |
| `PATCH /api/policies/:id` | Update (DRAFT only) |
| `POST /api/policies/:id/approve` | Approve → ACTIVE |
| `POST /api/policies/:id/reject` | Reject → EXPIRED |
| `POST /api/policies/:id/suspend` | Suspend ACTIVE policy |
| **Claims** | |
| `POST /api/claims` | Create claim; coverage check; returns fraud flags if any |
| `GET /api/claims` | List (query: status, policyId, page, limit) |
| `GET /api/claims/:id` | Get claim |
| `PATCH /api/claims/:id/status` | Body: status, approvedAmount?, remarks? (lifecycle transitions) |
| **Reinsurers** | |
| `POST /api/reinsurers` | Create reinsurer |
| `GET /api/reinsurers` | List (query: status) |
| `GET /api/reinsurers/:id` | Get |
| `PATCH /api/reinsurers/:id` | Update |
| **Treaties** | |
| `POST /api/treaties` | Create treaty (reinsurerId, sharePercentage, applicableLOBs, etc.) |
| `GET /api/treaties` | List (query: status, reinsurerId) |
| `GET /api/treaties/:id` | Get |
| `PATCH /api/treaties/:id` | Update |
| **Risk allocations** | |
| `GET /api/risk-allocations/policy/:policyId` | Get allocation for policy |
| `POST /api/risk-allocations/policy/:policyId/recalculate` | Recalculate (threshold ₹50L) |
| **Dashboard** | |
| `GET /api/dashboard/exposure-by-policy-type` | Exposure & premium by LOB |
| `GET /api/dashboard/claims-ratio` | Total premium, approved claims, ratio % |
| `GET /api/dashboard/reinsurer-risk-distribution` | Allocated amount per reinsurer |
| `GET /api/dashboard/loss-ratio-trends` | Query: months (default 12) |
| **Audit** | Admin only |
| `GET /api/audit-logs` | List (query: entityType, entityId, action, page, limit) |

## Auth

- Send access token: `Authorization: Bearer <accessToken>`.
- Roles: `UNDERWRITER`, `CLAIMS_ADJUSTER`, `REINSURANCE_MANAGER`, `ADMIN`.
- RBAC: policy create/approve (Underwriter/Admin), claims (Claims Adjuster/Admin), reinsurers/treaties (Reinsurance Manager/Admin), users/audit (Admin).

## Reinsurance engine

- When a policy is created or updated, if `sumInsured > 50,00,000` (₹50L), the engine finds active treaties for that policy’s `lineOfBusiness` and writes/updates `risk_allocations` (proportional share per treaty, retained amount).
- Recalculation: `POST /api/risk-allocations/policy/:policyId/recalculate`.

## Audit

- Policy create/update/approve and claim create/status update are logged to `audit_logs` (entityType, entityId, action, performedBy, performedAt, ipAddress).
