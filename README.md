An OCR-driven Scholarship Intelligence and Decision Support System that empowers eligible Indian students to assess application readiness, interpret multi-portal status codes, diagnose submission failures, and receive personalised AI-guided recommendations — eliminating the five avoidable failure modes that cause scholarship loss every year.

---

## Features

- User authentication and role-based access
- Student profile management with institute and nodal officer details
- Scholarship database with personalized recommendations
- Document Vault with OCR extraction and cross-validation
- Health Check — detects missing documents, eligibility risks, DBT issues
- Readiness Score — rates application readiness across 5 dimensions
- Failure Diagnosis Engine with personalized action plans
- **Status Analyzer** — upload any NSP / SSP / PFMS / INSPIRE screenshot and get instant status explanation, visual timeline, and next steps
- **WhatsApp Notifications** — automatic Kannada-language alerts sent to parent/guardian via WhatsApp when eligible scholarships are found on profile save
- **Scholarship Deadline Monitor** — scheduled job checks upcoming deadlines and notifies eligible students daily at 6 AM IST
- **Document Kit** — download a bundled ZIP of all documents required for a specific scholarship
- AI Chatbot for scholarship queries
- Notification system with email alerts
- MongoDB support with local JSON fallback for development

---

## Tech Stack

**Frontend**
- React 18 + Vite
- React Router
- Axios
- Lucide React (icons)

**Backend**
- Node.js + Express.js
- JWT Authentication
- MongoDB (optional) with JSON file fallback
- Multer (file uploads)
- OCR.space API (text extraction from images)
- Nodemailer (email alerts)
- UltraMsg API (WhatsApp notifications)
- Node-cron (scheduled jobs)

---

## Project Structure

```
ScholarSense-AI/
├── client/                   # React + Vite frontend
│   └── src/
│       ├── pages/            # Dashboard, Profile, Scholarships, DocumentVault, OcrAnalyzer, ...
│       ├── components/       # Sidebar, Navbar, shared UI
│       └── services/         # API clients (api.js)
├── server/                   # Node.js + Express backend
│   └── src/
│       ├── controllers/
│       ├── services/         # OCR, notifications, email, whatsapp, eligibility, diagnosis
│       ├── jobs/             # scholarshipMonitor.js — deadline checker
│       ├── routes/
│       └── data/             # Local JSON fallback files
└── package.json
```

---

## Installation

```bash
git clone <repository-url>
cd ScholarSense-AI
npm install
npm run dev
```

| Service  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost:5173 |
| Backend  | http://localhost:5000 |

---

## Environment Variables

Create `server/.env`:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OCR_API_KEY=your_ocrspace_api_key
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
ULTRAMSG_INSTANCE=your_ultramsg_instance_id
ULTRAMSG_TOKEN=your_ultramsg_token
```

MongoDB and email are optional — the app runs fully in development mode without them using local JSON files.

WhatsApp notifications require a free UltraMsg account (https://ultramsg.com). Link your WhatsApp number by scanning the QR code in your UltraMsg instance dashboard.

---

## API Reference

### Authentication

| Method | Route             | Description              |
|--------|-------------------|--------------------------|
| POST   | /api/auth/register | Register a new student  |
| POST   | /api/auth/login    | Login and receive JWT   |
| GET    | /api/auth/me       | Get current user        |

### Student Profile

| Method | Route          | Description    |
|--------|----------------|----------------|
| GET    | /api/profile/me | Fetch profile  |
| POST   | /api/profile/me | Save profile   |

Profile stores: personal details, mobile, parent/guardian WhatsApp number, institute name, nodal officer name/contact/email, bank account, IFSC, DBT status, district, state.

On every profile save, eligibility is recalculated automatically. If any scholarship matches (Eligible or Check status), a Kannada WhatsApp message is sent to the parent/guardian number.

### Document Vault

| Method | Route                  | Description                   |
|--------|------------------------|-------------------------------|
| GET    | /api/documents         | List uploaded documents       |
| POST   | /api/documents/upload  | Upload and OCR a document     |
| DELETE | /api/documents/:id     | Delete a document             |

Supported document types: Aadhaar, Income Certificate, Caste Certificate, Marksheet, Bank Passbook, Fee Receipt.

### Document Kit

| Method | Route                               | Description                         |
|--------|-------------------------------------|-------------------------------------|
| GET    | /api/documents/kit/:scholarshipId   | Get required document list          |
| GET    | /api/documents/bundle/:scholarshipId| Download ZIP bundle of all documents|

### Health Check

| Method | Route       | Description                              |
|--------|-------------|------------------------------------------|
| GET    | /api/risk/me | Run cross-validation on uploaded documents |

Detects: missing required documents, name mismatches, expired certificates, bank/DBT issues, income eligibility conflicts.

### Readiness Score

| Method | Route            | Description              |
|--------|------------------|--------------------------|
| GET    | /api/readiness/me | Get readiness score breakdown |

Dimensions: Profile Completion, Eligibility Match, Document Readiness, DBT Status, Deadline Safety.

### Failure Diagnosis

| Method | Route            | Description                        |
|--------|------------------|------------------------------------|
| GET    | /api/diagnosis/me | Get personalized failure diagnosis |

Generates an action plan covering profile gaps, eligibility risks, missing documents, bank problems, and deadline risks.

### Status Analyzer (OCR)

| Method | Route            | Description                                        |
|--------|------------------|----------------------------------------------------|
| POST   | /api/ocr/analyze | Upload a scholarship portal screenshot for analysis |

Upload field: `screenshot` (image/jpg, image/png)

Detects portal type (NSP / SSP / PFMS / INSPIRE / PMSS), identifies current status, extracts scholarship amount, and returns:

- Status label and risk level (Low / Medium / High)
- Visual timeline: Submitted → Institute → District → State/PFMS → Payment
- Bullet-point explanation of what the status means
- Personalized next-action checklist using student's profile (college, nodal officer, bank)
- Possible delay reasons and a single clear recommendation

### Scholarships

| Method | Route                         | Description                            |
|--------|-------------------------------|----------------------------------------|
| GET    | /api/scholarships             | List all scholarships                  |
| GET    | /api/scholarships/personalized | Get scholarships matched to profile   |
| POST   | /api/scholarships             | Add a scholarship (admin)              |
| PUT    | /api/scholarships/:id         | Update a scholarship (admin)           |
| DELETE | /api/scholarships/:id         | Delete a scholarship (admin)           |

### Notifications

| Method | Route                        | Description         |
|--------|------------------------------|---------------------|
| GET    | /api/notifications           | Get all notifications |
| PUT    | /api/notifications/:id/read  | Mark one as read    |
| PUT    | /api/notifications/read-all  | Mark all as read    |

### WhatsApp

| Method | Route                  | Description                        |
|--------|------------------------|------------------------------------|
| POST   | /api/whatsapp/test     | Send a test WhatsApp message       |

---

## Scheduled Jobs

| Job                        | Schedule      | Description                                                   |
|----------------------------|---------------|---------------------------------------------------------------|
| Scholarship Deadline Monitor | Daily 6 AM IST | Checks upcoming deadlines and notifies eligible students     |
| Document Expiry Check       | Daily 8 AM IST | Alerts students with documents expiring within 30 days       |

The monitor also runs once at server startup and uses the local scholarship store when MongoDB is offline.

---

## Development Fallback (No MongoDB)

When MongoDB is unavailable, data is stored in:

- `server/data/users.local.json`
- `server/data/profiles.local.json`
- `server/data/scholarships.local.json`
- `server/data/documents.local.json`
- `server/data/notifications.local.json`

---

## License

Developed for educational and research purposes.

© 2026 ScholarSense AI
