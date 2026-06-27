# ScholarSense AI

An OCR-driven Scholarship Intelligence and Decision Support System that helps students assess scholarship readiness, understand their application status, diagnose failures, and receive personalized guidance — all in one place.

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

---

## Project Structure
ScholarSense-AI/
├── client/ # React + Vite frontend
│ └── src/
│ ├── pages/ # Dashboard, Profile, DocumentVault, OcrAnalyzer, RiskAnalyzer, ...
│ ├── components/ # Sidebar, Navbar, shared UI
│ └── services/ # API clients (api.js)
├── server/ # Node.js + Express backend
│ └── src/
│ ├── controllers/
│ ├── services/ # OCR, notifications, email, diagnosis
│ ├── routes/
│ └── data/ # Local JSON fallback files
└── package.json

---

## Installation

```bash
git clone <repository-url>
cd ScholarSense-AI
npm install
npm run dev
Service	URL
Frontend	http://localhost:5173
Backend	http://localhost:5000
Environment Variables
Create server/.env:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OCR_API_KEY=your_ocrspace_api_key
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
MongoDB and email are optional — the app runs fully in development mode without them using local JSON files.

API Reference
Authentication
Method	Route	Description
POST	/api/auth/register	Register a new student
POST	/api/auth/login	Login and receive JWT
GET	/api/auth/me	Get current user
Student Profile
Method	Route	Description
GET	/api/profile/me	Fetch profile
POST	/api/profile/me	Create profile
PUT	/api/profile/me	Update profile
Profile stores: personal details, institute name, nodal officer name/contact/email, bank account, IFSC, DBT status, district, state.

Document Vault
Method	Route	Description
GET	/api/documents	List uploaded documents
POST	/api/documents/upload	Upload and OCR a document
DELETE	/api/documents/:id	Delete a document
Supported document types: Aadhaar, Income Certificate, Caste Certificate, Marksheet, Bank Passbook, Fee Receipt.

Health Check
Method	Route	Description
GET	/api/risk/me	Run cross-validation on uploaded documents
Detects: missing required documents, name mismatches, expired certificates, bank/DBT issues, income eligibility conflicts.

Readiness Score
Method	Route	Description
GET	/api/readiness/me	Get readiness score breakdown
Dimensions: Profile Completion, Eligibility Match, Document Readiness, DBT Status, Deadline Safety.

Failure Diagnosis
Method	Route	Description
GET	/api/diagnosis/me	Get personalized failure diagnosis
Generates an action plan covering profile gaps, eligibility risks, missing documents, bank problems, and deadline risks.

Status Analyzer (OCR)
Method	Route	Description
POST	/api/ocr/analyze	Upload a scholarship portal screenshot for analysis
Upload field: screenshot (image/jpg, image/png)

Detects portal type (NSP / SSP / PFMS / INSPIRE / PMSS), identifies current status, extracts scholarship amount, and returns:

Status label and risk level (Low / Medium / High)
Visual timeline: Submitted → Institute → District → State/PFMS → Payment
Bullet-point explanation of what the status means
Personalized next-action checklist using student's profile (college, nodal officer, bank)
Possible delay reasons
Single clear recommendation
Tip: Expand all dropdown sections on the portal before taking a screenshot for best results.

Scholarships
Method	Route	Description
GET	/api/scholarships	List all scholarships
GET	/api/scholarships/personalized	Get scholarships matched to student profile
POST	/api/scholarships	Add a scholarship (admin)
PUT	/api/scholarships/:id	Update a scholarship (admin)
DELETE	/api/scholarships/:id	Delete a scholarship (admin)
Notifications
Method	Route	Description
GET	/api/notifications	Get all notifications
PUT	/api/notifications/:id/read	Mark one as read
PUT	/api/notifications/read-all	Mark all as read
Development Fallback (No MongoDB)
When MongoDB is unavailable, data is stored in:

server/data/users.local.json
server/data/profiles.local.json
server/data/scholarships.local.json
server/data/documents.local.json
License
Developed for educational and research purposes.

© 2026 ScholarSense AI
