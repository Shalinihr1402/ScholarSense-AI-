# ScholarSense AI

An OCR-Driven Scholarship Intelligence and Decision Support System for Readiness Assessment and Failure Diagnosis.

## Day 1 Setup

This repository contains the base full-stack structure:

- `client`: React + Vite frontend
- `server`: Node.js + Express backend

## Run Locally

```bash
npm.cmd install
npm.cmd run dev
```

Client: `http://localhost:5173`

Server: `http://localhost:5000`

## Day 2 Auth

Auth routes are available at:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

If MongoDB is not configured, the backend uses a local development store at
`server/data/users.local.json`, which is ignored by git.

## Day 3 Student Profile

Profile routes are available at:

- `GET /api/profile/me`
- `POST /api/profile/me`
- `PUT /api/profile/me`

If MongoDB is not configured, profiles are saved in
`server/data/profiles.local.json`, which is ignored by git.

## Day 4 Scholarship Database

Scholarship routes are available at:

- `GET /api/scholarships`
- `GET /api/scholarships/personalized`
- `POST /api/scholarships` admin only
- `PUT /api/scholarships/:id` admin only
- `DELETE /api/scholarships/:id` admin only

If MongoDB is not configured, scholarships are seeded into
`server/data/scholarships.local.json`, which is ignored by git.

## Day 6 Readiness Score

Readiness route:

- `GET /api/readiness/me`

The score is calculated from profile completion, eligibility match, document
readiness, DBT status, and deadline safety.
