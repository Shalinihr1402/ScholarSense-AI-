ScholarSense AI

ScholarSense AI is an OCR-driven Scholarship Intelligence and Decision Support System designed to help students assess scholarship readiness, diagnose application failures, analyze screenshots, and receive personalized recommendations and notifications.

---

🚀 Features

- User Authentication and Authorization
- Student Profile Management
- Scholarship Database and Personalized Recommendations
- Readiness Score Assessment
- Failure Diagnosis Engine
- OCR Screenshot Analyzer
- Notification System
- Email Alerts for Important Events
- MongoDB Support with Local JSON Fallback
- Full-Stack Architecture using React and Node.js

---

🛠 Tech Stack

Frontend

- React
- Vite
- Axios
- React Router

Backend

- Node.js
- Express.js
- JWT Authentication
- MongoDB (Optional)
- Multer
- Tesseract OCR

---

📂 Project Structure

ScholarSense-AI/
│
├── client/          # React + Vite frontend
├── server/          # Node.js + Express backend
├── README.md
└── package.json

---

⚙️ Installation

Clone the repository:

git clone <repository-url>
cd ScholarSense-AI

Install dependencies:

npm install

Start the application:

npm run dev

Local URLs

Frontend:

http://localhost:5173

Backend:

http://localhost:5000

---

Modules and APIs

🔐 Authentication

Routes:

- "POST /api/auth/register"
- "POST /api/auth/login"
- "GET /api/auth/me"

If MongoDB is unavailable, users are stored in:

server/data/users.local.json

---

👤 Student Profile

Routes:

- "GET /api/profile/me"
- "POST /api/profile/me"
- "PUT /api/profile/me"

Fallback storage:

server/data/profiles.local.json

---

🎓 Scholarship Database

Routes:

- "GET /api/scholarships"
- "GET /api/scholarships/personalized"
- "POST /api/scholarships"
- "PUT /api/scholarships/:id"
- "DELETE /api/scholarships/:id"

Fallback storage:

server/data/scholarships.local.json

---

📊 Readiness Score Engine

Route:

- "GET /api/readiness/me"

Parameters considered:

- Profile completion
- Eligibility matching
- Document readiness
- DBT status
- Deadline safety

---

🔍 Failure Diagnosis Engine

Route:

- "GET /api/diagnosis/me"

Detects:

- Profile issues
- Eligibility risks
- Missing documents
- Bank and DBT problems
- Deadline risks
- Readiness concerns

Provides a personalized action plan for students.

---

📸 OCR Screenshot Analyzer

Route:

- "POST /api/ocr/analyze"

Upload field:

screenshot

Capabilities:

- Extract text from screenshots
- Detect document and status type
- Identify OCR quality issues
- Generate student-friendly guidance

---

🔔 Notification System

Routes:

- "GET /api/notifications"
- "POST /api/notifications"
- "PUT /api/notifications/:id/read"
- "PUT /api/notifications/read-all"

Notifications are generated from:

- Profile updates
- Readiness scores
- Diagnosis reports
- OCR analysis

---

📧 Email Alerts

Route:

- "GET /api/email/status"

High-priority notifications are sent via email when:

EMAIL_USER
EMAIL_PASS

are configured.

Without credentials, emails are safely logged and skipped during development.

---

💾 Database Support

Primary Database:

- MongoDB

Development Fallback:

- "users.local.json"
- "profiles.local.json"
- "scholarships.local.json"

---

🌟 Future Enhancements

- AI-powered chatbot support
- Multilingual support
- Document verification
- Scholarship deadline reminders
- Admin dashboard
- Analytics and reports
- Mobile application

---

📜 License

This project is developed for educational and research purposes.

© 2026 ScholarSense AI
