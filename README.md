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

## Day 7 Failure Diagnosis

Diagnosis route:

- `GET /api/diagnosis/me`

The engine identifies profile, eligibility, document, DBT, bank, deadline, and
readiness risks with a personalized action plan.

## Day 8 OCR Screenshot Analyzer

OCR route:

- `POST /api/ocr/analyze`

Upload form field: `screenshot`

The analyzer extracts text from uploaded images, detects document/status type,
flags OCR quality issues, and gives student-friendly guidance.

## Day 10 Notifications

Notification routes:

- `GET /api/notifications`
- `POST /api/notifications`
- `PUT /api/notifications/:id/read`
- `PUT /api/notifications/read-all`

Notifications are generated from profile, readiness, diagnosis, and OCR events.

## Day 11 Email Alerts

Email status route:

- `GET /api/email/status`

High and critical notifications attempt email delivery when `EMAIL_USER` and
`EMAIL_PASS` are configured. Without credentials, emails are safely logged as
`skipped` for development.
