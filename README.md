# Tadbir - AI-Powered Workforce Management System

![Project Banner](client/public/images/home/computer.jpg) 
> **Tadbir** is a comprehensive SaaS solution designed to streamline workforce management. It combines intelligent scheduling, automated time tracking, and AI-driven insights to boost productivity and reduce administrative overhead.

---

## Key Features

### AI Smart Scheduler (Powered by Gemini)
- **Voice & Text Commands:** Create complex schedules using natural language (e.g., *"Create morning shifts for Ahmed next week"*).
- **Auto-Correction:** Handles timezone differences and date parsing automatically.
- **Smart Preview:** Review and edit AI-suggested shifts before publishing.

### Advanced Shift Swapping
- **Conflict Detection:** Prevents employees from accepting swaps if they are already scheduled.
- **Direct & Open Swaps:** Employees can trade directly with a colleague or post an open request.
- **Shift-for-Shift:** Supports mutual exchange of shifts in a single transaction.
- **Approval Workflow:** Admins have full control to approve or reject swaps.

### Time Tracking & Attendance
- **Geolocation Check-in:** Secure clock-in/out with location tracking.
- **Live Status:** Real-time dashboard showing who is present, late, or on break.
- **Break Management:** Track break durations and calculate net working hours.
- **Smart Overtime:** Automated calculation of overtime based on shift types (Regular vs. Holiday).

### Analytics & Reports
- **AI Insights:** Generates qualitative summaries of performance and attendance trends using Gemini AI.
- **Export Options:** Download reports as PDF or Excel.
- **Detailed Metrics:** Track attendance rates, punctuality scores, and shift completion rates.

### Subscription & Payments
- **Multi-Tenancy:** Supports multiple companies with different subscription plans.
- **Payment Gateway:** Integrated with **Paymob** for secure transactions.
- **Plan Management:** Dynamic limits on branches and employees based on the plan.

---

## Tech Stack

### Frontend
- **Framework:** React 19 (Vite)
- **Styling:** Tailwind CSS v4
- **State Management:** React Context API
- **Visualization:** Recharts, FullCalendar
- **UI Components:** Lucide React, SweetAlert2, Framer Motion
- **Localization:** i18next (Arabic/English RTL/LTR support)

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose)
- **Authentication:** JWT, Google OAuth 2.0
- **AI Engine:** Google Gemini API
- **Email Service:** Nodemailer
- **Payments:** Paymob API


## Getting Started

Follow these steps to run the project locally.

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Google Gemini API Key
- Paymob Account (for payments)

### 1. Clone the Repository
```bash
git clone [https://github.com/mohameddiab17/shift-planner.git](https://github.com/mohameddiab17/shift-planner.git)
cd shift-planner
```
## 2. Backend Setup
```bash
cd server
npm install
```
## Create a .env file in the server directory:
```bash
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
GEMINI_API_KEY=your_google_gemini_key
PAYMOB_API_KEY=your_paymob_key
PAYMOB_INTEGRATION_ID=your_integration_id
PAYMOB_HMAC_SECRET=your_hmac_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
```
## Run the server:
```bash
npm run dev
```
## 3. Frontend Setup:
```bash
cd client
npm install
```
## Create a .env file in the client directory:
```bash
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```
## Run the client:
```bash
npm run dev
npm run dev
```

## 4. Production Deployment

### Google OAuth Configuration
When deploying to production (e.g., Vercel), you MUST add your production callback URL to the **Authorized redirect URIs** in your [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

- **URI Format:** `https://your-backend-domain.com/api/auth/google/callback`
- **Example:** `https://tadbir-six.vercel.app/api/auth/google/callback`

### Vercel Environment Variables
Ensure the following variables are set in your Vercel project settings:

**Backend Project:**
- `FRONTEND_URL`: `https://your-frontend-domain.app`
- `GOOGLE_REDIRECT_URI`: `https://your-backend-domain.app/api/auth/google/callback`

**Frontend Project:**
- `VITE_API_URL`: `https://your-backend-domain.app`
- `VITE_FRONTEND_URL`: `https://your-frontend-domain.app`
## Security Features
- RBAC: Role-Based Access Control (Platform Owner, Super Admin, Branch Admin, Employee).

- Data Isolation: Strict tenant isolation ensuring companies cannot access each other's data.

- Secure Auth: JWT with Refresh Tokens and HTTP-only cookies.

- Validation: Robust input validation using Mongoose and Zod logic.

## Contributing
- Contributions are welcome! Please fork the repository and create a pull request.

## License
- This project is licensed under the MIT License.
