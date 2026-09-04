# Schedula - Intelligent Appointment Booking System

Schedula is a modern, responsive web application designed to streamline the appointment booking process between patients and doctors. Built with Next.js, React, and Tailwind CSS, it offers dedicated portals for both patients and healthcare professionals, augmented by an AI-powered assistant for quick information retrieval.

## 🚀 Key Features

### 👤 Patient Portal
* **Doctor Discovery:** Browse and search for doctors by specialization.
* **Smart Booking:** Book appointments seamlessly with real-time slot availability.
* **Appointment Tracking:** Manage and view upcoming, confirmed, and past appointments.
* **Prescriptions & Reports:** Access and download digital prescriptions.

### 👨‍⚕️ Doctor Portal
* **Dashboard Analytics:** Overview of daily appointments and patient statistics.
* **Availability Management:** Set up active dates, working hours, and time slots.
* **Interactive Calendar:** A drag-and-drop calendar to view, manage, and reschedule appointments with ease.
* **Appointment Handling:** Confirm, decline, mark as completed or missed.
* **Patient Records:** Maintain digital prescriptions and consultation notes for patients.

### 🤖 AI Assistant (Gemini API)
* A smart chat interface available across the application.
* Uses the Gemini AI model to answer queries based on Schedula's internal knowledge base (e.g., finding specific specialists, checking clinic hours).

## 🔑 Demo Credentials

You can test the application using the following mock credentials. The app uses localStorage to simulate authentication.

**Doctor Demo Account**
* **Email:** `prakash@schedula.com`
* **Password:** `doctor123`

**Patient Demo Account**
* **Email:** `alex@example.com`
* **Password:** `password123`

*(Note: You can also sign up as a new patient or doctor from the registration pages)*

## 🛠️ Technology Stack

* **Framework:** Next.js (App Router)
* **Library:** React 18
* **Styling:** Tailwind CSS
* **Calendar:** react-big-calendar
* **Icons:** lucide-react
* **Date Parsing:** moment.js
* **AI Integration:** Google Gemini API (`@google/genai`)

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
   Create a `.env` file in the root directory based on the provided `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API key to the `.env` file:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗂️ Data Storage (Mock Persistence)
Currently, Schedula uses browser `localStorage` to simulate a database. 
* User profiles, doctor availability, appointments, and prescriptions are saved locally on your browser.
* If you clear your browser data or use incognito mode, the application will reset to its default seed data.