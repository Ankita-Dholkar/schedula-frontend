# Schedula - Intelligent Healthcare Appointment & Clinic Management System

Schedula is a modern, comprehensive healthcare appointment booking and practice management platform. Built with **Next.js (App Router)**, **React**, **Redux Toolkit**, and **Tailwind CSS**, it features dedicated portals for patients, doctors, and administrators, accompanied by an AI assistant powered by Google Gemini.

---

## 🔑 Testing & Demo Credentials

Schedula uses a mock authentication and persistence layer backed by browser `localStorage`. You can immediately sign in with any of the pre-configured demo accounts below:

### 🛡️ Administrator Accounts
Provides access to system analytics, revenue monitoring, doctor verifications, patient management, audit logs, reports, and platform settings according to role permissions.

| Role | Admin Level | Name | Email | Password | Access URL | Permissions Summary |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | Super Admin | Super Admin | `admin123@schedula.com` | `admin123` | `/admin/login` or `/login` | Full system access: Users, Settings, Maintenance Mode, Audit Logs, Reports, Verifications |
| **Admin** | Operations Admin | Ops Admin | `ops@schedula.com` | `ops123` | `/admin/login` or `/login` | View, Create, and Edit operational records; Doctor Verifications; Audit Logs; Reports |
| **Support** | Support Staff | Support Staff | `support@schedula.com` | `support123` | `/admin/login` or `/login` | View-only operational access: Doctors, Patients, Appointments, Payments, Reviews, Reports |

---

### 👨‍⚕️ Doctor Accounts
Access to the Doctor Portal with real-time revenue stats, appointment scheduling, patient refund management, patient reviews, and profile & fee configuration.

| Doctor Name | Specialization | Consultation Fee | Check-up Fee | Email | Password |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Dr. Prakash Das** | Sr. Psychologist | ₹500 | ₹800 | `prakash@schedula.com` | `doctor123` |
| **Dr. Anika Rao** | General Physician | ₹450 | ₹750 | `anika@schedula.com` | `doctor123` |
| **Dr. Martin Cole** | Dermatologist | ₹600 | ₹950 | `martin@schedula.com` | `doctor123` |
| **Dr. Sarah Wilson** | Cardiologist | ₹700 | ₹1,200 | `sarah@schedula.com` | `doctor123` |
| **Dr. Rajesh Sharma** | Orthopedic Surgeon | ₹650 | ₹1,100 | `rajesh@schedula.com` | `doctor123` |
| **Dr. Meera Patel** | Pediatrician | ₹500 | ₹850 | `meera@schedula.com` | `doctor123` |

---

### 👤 Patient Accounts
Access to doctor discovery, booking flows (Consultations & Check-ups), demo payments, appointment tracking, refund requests, ratings & reviews, and digital prescriptions.

| Patient Name | Email | Password | Age / Gender | Blood Group |
| :--- | :--- | :--- | :--- | :--- |
| **Alex Smith** | `alex@example.com` | `password123` | 32, Male | O+ |

> 💡 **Self-Registration:** You can also register brand-new patient and doctor accounts using the `/signup` page. Newly registered doctors can set their customized consultation and check-up fees during signup or via their profile.

---

## 🚀 Key Features & Workflows

### 👤 Patient Portal
* **Doctor Search & Specialty Filters:** Search doctors by name, clinic, or filter dynamically by specialty (Cardiologist, Dermatologist, General Physician, Psychologist, etc.).
* **Doctor Ratings & Reviews:** View average star ratings and browse patient reviews directly on doctor cards via a slide-in drawer.
* **Flexible Booking (Consultation & Check-up):** Choose between **Consultation** and **Check-up** appointment types with dynamic fee calculations based on each doctor's rates.
* **Appointment Modes:** Choose between In-person clinic visits and Online video consultations.
* **Interactive Payments:** Integrated demo checkout modal supporting Card and UPI payment options.
* **Refund Requests:** For appointments that are `Cancelled` or `Missed` where payment was completed (`Paid`), patients can submit a refund request with reasons directly from their appointment cards.
* **Prescriptions & Records:** Download prescriptions and view consultation summaries for completed visits.

### 👨‍⚕️ Doctor Portal
* **Dashboard Analytics:** Live tracking of today's and all-time appointments, patient volume, and total collected revenue (adjusted automatically for approved refunds).
* **Fee Configuration & Validation:** Configure and update **Consultation** and **Check-up** fees with built-in validation rules (`consultationFee < checkupFee`, numeric, non-negative).
* **Refund Management:** Review pending refund requests inside the Appointment Detail drawer. Doctors can approve or decline refund requests with custom notes:
  * When approved, payment status becomes `refunded`, and the amount is immediately deducted from the doctor's and system's revenue.
* **Availability Management:** Set active schedule dates, slot durations, and working hours.
* **Interactive Calendar:** Manage schedules and handle appointment rescheduling with conflict prevention.
* **Patient Care:** Issue digital prescriptions and record clinical notes.

### 🛡️ Admin Portal & Platform Governance
* **Role-Based Access Control (RBAC):** Tiered permissions across Super Admin, Operations Admin, and Support Staff roles.
* **Overview Dashboard:** Top-level metrics for doctors, patients, appointments, pending verifications, and real-time collected revenue.
* **Doctor Verification:** Review submitted doctor documents (MCI license, degree certificates), approve or decline registrations with audit trails.
* **Patient Management:** View, activate, deactivate, or suspend patient accounts.
* **Payment & Revenue Tracking:** Detailed transaction audit trails, payment method breakdown, transaction IDs, and refund status tracking.
* **Platform Maintenance Mode:** Super Admin can toggle global Maintenance Mode with custom notices. Normal user portals (Patient & Doctor) display a real-time system maintenance notice while the Admin Portal remains accessible for configuration.
* **Audit Logs:** Comprehensive activity log tracking system actions (doctor verifications, platform settings changes, user status changes, refund workflows) with actor identification and severity levels.
* **Multi-Format Export Engine:** Export reports and audit logs in **CSV** (UTF-8 BOM for special characters), **Excel** (`.xlsx`), and styled **PDF** reports (with company branding and pagination).

### 🤖 AI Assistant (Google Gemini)
* Floating AI chat widget available across the platform to answer questions about specialists, clinic hours, symptoms, and platform workflows.

---

## 🛠️ Technology Stack

* **Framework:** Next.js 16 (App Router)
* **Frontend Library:** React 19
* **State Management:** Redux Toolkit & React-Redux
* **Styling:** Vanilla CSS + Tailwind CSS
* **Excel Export:** SheetJS (`xlsx`)
* **PDF Export:** `jspdf` & `jspdf-autotable`
* **Calendar:** `react-big-calendar`
* **Icons:** `lucide-react`
* **Date Manipulation:** `moment.js`
* **AI Integration:** Google Gemini API

---

## ⚙️ Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd schedula-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API key (optional, for AI Assistant features):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the application:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗂️ Data Storage (Mock Persistence)

Schedula utilizes browser `localStorage` and Redux Toolkit state to simulate a persistent backend database:
* User accounts, doctor profiles, availability schedules, appointments, payments, refunds, audit logs, and platform settings persist across reloads within your browser.
* Cross-tab and same-tab synchronization ensures real-time updates when toggling settings or approving refunds.
* Clearing your browser's local storage resets the application back to its default seed data.