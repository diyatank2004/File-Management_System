# Backend (Phase 2)

This backend uses Express + MongoDB + JWT.

## 1. Setup

1. `cd backend`
2. `npm install`
3. Copy `.env.example` to `.env`
4. Update `MONGO_URI` and `JWT_SECRET`
5. Run `npm run dev`

## 2. API Endpoints

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/files` (protected)
- `POST /api/files` (protected)
- `DELETE /api/files/:id` (protected)

## 3. Authorization Header

`Authorization: Bearer <token>`
