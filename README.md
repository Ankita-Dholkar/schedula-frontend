# Schedula - Intelligent Healthcare Appointment & Clinic Management System

Schedula is a modern, full-stack healthcare appointment booking and practice management platform. Built with **Next.js**, **React**, **Redux Toolkit**, and **Tailwind CSS**, it features dedicated portals for patients, doctors, and administrators, accompanied by an AI assistant powered by Google Gemini.

---

## 🔑 Testing & Demo Credentials

Schedula features mock authentication persisted in browser `localStorage`. You can immediately sign in with any of the pre-configured accounts below:

### 🛡️ Administrator Accounts
Full access to system analytics, revenue monitoring, doctor verifications, patient management, audit logs, and report generation according to role permissions.

| Role | Admin Level | Name | Email | Password | Access URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin** | Super Admin | Super Admin | `admin123@schedula.com` | `admin123` | `/admin/login` or `/login` |
| **Admin** | Operations Admin | Ops Admin | `ops@schedula.com` | `ops123` | `/admin/login` or `/login` |
| **Admin** | Support Staff | Support Staff | `support@schedula.com` | `support123` | `/admin/login` or `/login` |

---

### 👨‍⚕️ Doctor Accounts
Access to doctor dashboard with real-time revenue stats, appointment scheduling, patient reviews, and profile & fee configuration.

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
Access to doctor discovery, booking flows (Consultations & Check-ups), demo payments, appointment tracking, ratings & reviews, and digital prescriptions.

| Patient Name | Email | Password | Age / Gender | Blood Group |
| :--- | :--- | :--- | :--- | :--- |
| **Alex Smith** | `alex@example.com` | `password123` | 32, Male | O+ |
| **Priya Sharma** | `priya@example.com` | `password123` | 29, Female | B+ |
| **Maya Patel** | `maya@example.com` | `password123` | 34, Female | A+ |
| **Ethan Brooks** | `ethan@example.com` | `password123` | 41, Male | B- |
| **Sofia Chen** | `sofia@example.com` | `password123` | 28, Female | AB+ |
| **Kavya Reddy** | `kavya@example.com` | `password123` | 31, Female | O- |

> 💡 **Self-Registration:** You can also register brand-new patient and doctor accounts using the `/signup` page. Newly registered doctors can set their customized consultation and check-up fees during signup or via their profile.

---

## 🚀 Key Features

### 👤 Patient Portal
* **Doctor Search & Specialty Filters:** Search doctors by name, clinic, or filter dynamically by specialty (Cardiologist, Dermatologist, General Physician, Psychologist, etc.).
* **Doctor Ratings & Reviews:** View average star ratings and browse patient reviews directly on doctor cards via a slide-in drawer.
* **Flexible Booking (Consultation & Check-up):** Choose between **Consultation** and **Check-up** appointment types with dynamic fee calculations based on each doctor's rates.
* **Appointment Mode:** Choose between In-person clinic visits and Online video consultations.
* **Interactive Payments:** Integrated demo checkout modal supporting Card and UPI payment options.
* **Prescriptions & Records:** Download prescriptions and view consultation summaries for completed visits.

### 👨‍⚕️ Doctor Portal
* **Dashboard Analytics:** Live tracking of today's and all-time appointments, patient volume, and total collected revenue.
* **Fee Configuration:** Configure and update **Consultation** and **Check-up** fees with built-in validation rules (`consultationFee < checkupFee`, numeric, non-negative).
* **Availability Management:** Set active schedule dates, slot durations, and working hours.
* **Interactive Calendar:** Manage schedules and handle appointment rescheduling with conflict prevention.
* **Patient Care:** Issue digital prescriptions and record clinical notes.

### 🛡️ Admin Portal
* **Overview Dashboard:** Top-level metrics for doctors, patients, appointments, pending verifications, and real-time collected revenue.
* **Doctor Verification:** Review submitted doctor documents (MCI license, degree certificates), approve or decline registration with audit trails.
* **Patient Management:** View, activate, deactivate, or suspend patient accounts.
* **Payments & Revenue Monitoring:** Track every transaction with status badges, transaction IDs, payment methods, and appointment fees.
* **Analytics & Reports:** Detailed charts for appointment trends, mode revenue split (Online vs. In-Person), and exportable reports in CSV, Excel, and PDF formats.

### 🤖 AI Assistant (Google Gemini)
* Floating AI chat widget available across the platform to answer questions about specialists, clinic hours, symptoms, and platform workflows.

---

## 🛠️ Technology Stack

* **Framework:** Next.js 14 (App Router)
* **Frontend Library:** React 18
* **State Management:** Redux Toolkit & React-Redux
* **Styling:** Vanilla CSS + Tailwind CSS
* **Calendar:** `react-big-calendar`
* **Icons:** `lucide-react`
* **Date Manipulation:** `moment.js`
* **AI Integration:** Google Gemini API (`@google/genai`)

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
   Create a `.env` file in the root directory based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API key (optional for AI Assistant features):
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
* User accounts, doctor profiles, availability schedules, appointments, and payments persist across reloads within your browser.
* Clearing your browser's local storage resets the application back to its default seed data.