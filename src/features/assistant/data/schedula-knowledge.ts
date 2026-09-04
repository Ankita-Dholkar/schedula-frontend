
// Schedula static knowledge base.


export const SCHEDULA_KNOWLEDGE = `
## About Schedula

Schedula is a clinic operations and doctor appointment booking application.

It supports two types of authenticated users:

- Patient or user: A person who finds doctors, books appointments, and manages visits.
- Doctor: A medical professional who manages schedules, appointments, patients, and prescriptions.

The public homepage is available without authentication. Visitors can explore the platform and learn how Schedula works before logging in.

---

## Public Homepage

### Homepage Navigation

Visitors can use these sections from the public homepage:

- Home: Returns to the main landing page.
- About: Explains the purpose of Schedula.
- Services: Shows the main features of the platform.
- Explore: Contains options such as Find Doctors, For Doctors, How It Works, and Contact.
- Log in: Opens the login page.
- Get Started: Begins the registration or onboarding flow.

### Finding Doctors Before Login

Visitors can select Find Doctors from the homepage or Explore menu.

The Find Doctors page allows visitors to browse available doctors and their specializations.

Doctor cards may show:

- Doctor name
- Specialization
- Experience
- Available slots

Authentication may be required when a visitor wants to book an appointment or access personal information.

### Booking an Appointment Before Login

Visitors can select Book an Appointment from the homepage.

If the visitor is not logged in, the application takes them to the login page.

After logging in or registering as a patient, they can continue to the doctor listing and booking flow.

### For Doctors

Visitors can select For Doctors from the homepage or Explore menu.

This section explains how doctors can use Schedula to manage clinic operations.

Doctors can log in or register through the authentication flow.

After successful doctor login, doctors enter the Doctor Portal dashboard.

### Public Chatbot

The public chatbot can:

- Explain what Schedula does.
- Explain the difference between the Patient Portal and Doctor Portal.
- Guide visitors to the correct homepage section.
- Explain how to find a doctor.
- Explain how to book an appointment.
- Explain how to register or log in.
- Explain the general features available to patients and doctors.
- Explain which portal users should visit after authentication.

The public chatbot cannot:

- Access private patient or doctor information.
- Display appointment details.
- Book, cancel, or reschedule appointments.
- Create prescriptions.
- Diagnose medical conditions.
- Provide medical treatment advice.
- Perform actions on behalf of visitors.

---

## Patient Portal

### Finding Doctors

Open Find Doctors from the Patient Portal sidebar.

Patients can browse available doctors and filter them by specialization.

Each doctor card may show:

- Doctor name
- Specialization
- Experience
- Available slots

To start booking, select the doctor card and view the doctor's details and available slots.

Do not tell users to click a Book Appointment button on the doctor card because the doctor card does not contain that button.

### Booking an Appointment

The booking process is:

1. Open Find Doctors.
2. Select the doctor you want to visit.
3. View the doctor's available slots.
4. Choose an available date and time.
5. Confirm the appointment.
6. Open My Appointments to view the saved appointment.

The assistant can explain this process but cannot book an appointment itself.

### My Appointments

Open My Appointments from the Patient Portal sidebar.

Patients can view their appointments and their statuses, such as:

- Upcoming
- Pending
- Confirmed
- Completed
- Cancelled

Each appointment card may show:

- Doctor name
- Appointment date
- Appointment time
- Appointment status

### Cancelling an Appointment

Patients can cancel eligible upcoming or pending appointments.

The usual process is:

1. Open My Appointments.
2. Find the appointment.
3. Select the cancellation option if it is available.
4. Confirm the cancellation.

The assistant cannot cancel an appointment on behalf of the patient.

### Rescheduling an Appointment

Patients can request a reschedule for eligible upcoming or pending appointments.

The usual process is:

1. Open My Appointments.
2. Select the appointment.
3. Choose the reschedule option if it is available.
4. Select another available date or time.
5. Confirm the change.

The assistant cannot reschedule an appointment on behalf of the patient.

### Viewing a Prescription

Prescriptions are available for completed appointments.

The usual process is:

1. Open My Appointments.
2. Find a completed appointment.
3. Select the prescription or download option.
4. View or download the generated prescription PDF.

### My Profile

Open My Profile from the Patient Portal sidebar.

Patients can view and edit personal information such as:

- Name
- Email
- Mobile number

After making changes, select the save option to update the profile.

### Patient Login and Logout

To log in as a patient:

1. Open the login page.
2. Enter the registered email or mobile number.
3. Enter the password.
4. Continue to the Patient Portal.

After login, patients can start from Find Doctors.

To log out, select the Log Out option at the bottom of the Patient Portal sidebar.

Logout clears the session and returns the user to the login or public entry flow, depending on the application implementation.

---

## Doctor Portal

### Dashboard

Open Dashboard from the Doctor Portal sidebar.

The dashboard provides an overview of the doctor's appointments.

It may show:

- Today's appointments
- Total appointments
- Pending appointments
- Confirmed appointments
- Completed appointments
- Upcoming appointments
- Patient names
- Appointment times
- Appointment statuses

Doctors can confirm or cancel eligible pending appointments directly from the dashboard.

The dashboard may also contain quick actions for viewing and managing appointments.

### Appointments

Open Appointments from the Doctor Portal sidebar.

Doctors can view appointments in a calendar format.

The calendar supports:

- Week view
- Month view
- Appointment status colors
- Appointment details

Selecting an appointment event opens its details.

### Rescheduling Appointments

Doctors can reschedule eligible upcoming or pending appointments.

Depending on the interface, doctors may:

- Select an appointment and choose another time.
- Drag an appointment to an available slot.
- Use available-slot indicators.
- Save or confirm the change.

The assistant can explain the process but cannot reschedule appointments.

### Availability Management

Doctors can manage availability from the dashboard or My Profile section.

Doctors can:

- Define available days.
- Add available time slots.
- Remove existing time slots.
- Update their working hours.

For example, a doctor may set availability for Monday from 9:00 AM to 5:00 PM.

Saved availability changes are reflected in the patient booking interface.

### Prescriptions

Open Prescriptions from the Doctor Portal sidebar.

Doctors can view prescriptions created for completed appointments.

To create a prescription:

1. Open Prescriptions.
2. Select a completed appointment.
3. Enter the required prescription details.
4. Save the prescription.

A prescription may contain:

- Diagnosis
- Medicines
- Dosage
- Notes

Prescriptions are linked to specific appointments and patients.

Patients can download generated prescription PDFs from their portal.

### My Profile

Open My Profile from the Doctor Portal sidebar.

Doctors can view and edit professional information such as:

- Name
- Specialization
- Experience
- License number
- Contact details

Doctors can also manage availability slots from the profile section.

After making changes, select the save option to update the profile.

### Doctor Login and Logout

To log in as a doctor:

1. Open the login page.
2. Enter the registered email or mobile number.
3. Enter the password.
4. Continue to the Doctor Portal dashboard.

To log out, select the Logout option in the Doctor Portal sidebar.

Logout clears the session and returns the user to the login or public entry flow, depending on the application implementation.

---

## Assistant Capabilities

The Schedula Assistant can:

- Explain how to use features in the Patient Portal.
- Explain how to use features in the Doctor Portal.
- Guide users to the correct page or section.
- Explain what information is shown on a page.
- Explain appointment statuses.
- Explain booking, cancellation, and rescheduling workflows.
- Explain doctor availability management.
- Explain prescription creation and download workflows.
- Explain login and registration navigation.
- Answer general questions about Schedula.

The Schedula Assistant cannot:

- Book appointments.
- Cancel appointments.
- Reschedule appointments.
- Edit profiles.
- Update doctor availability.
- Create prescriptions.
- Access personal user data.
- Display private appointment information.
- Perform actions inside the application.
- Answer unrelated questions.
- Diagnose medical conditions.
- Provide medical advice or replace a qualified healthcare professional.

When asked for medical advice, the assistant should explain that it can only provide general platform guidance and that the user should consult a qualified healthcare professional for medical concerns.

---

## Appointment Status Definitions

- Pending: The appointment has been requested but has not yet been confirmed by the doctor.
- Confirmed: The doctor has confirmed the appointment.
- Upcoming: The appointment is scheduled for a future date or time.
- Completed: The appointment has been marked as completed in the application.
- Cancelled: The appointment has been cancelled by the patient or doctor.

---

## Navigation Rules

These routes are for internal navigation guidance. The assistant should normally use friendly page names instead of displaying route paths to users.

### Visitor Not Logged In

- Find Doctors: Open Find Doctors from the homepage or Explore menu.
- Book Appointment: Open the booking option from the homepage. If authentication is required, continue through the login page.
- Log in: Open the login page.
- Get Started: Continue to registration or onboarding.
- For Doctors: Open the doctor information or doctor authentication section.

Internal routes:

- Find Doctors: /user/doctors
- Book Appointment before login: /login
- Log in: /login

### Patient Logged In

- Find Doctors: /user/doctors
- New Appointment: /user/doctors
- My Appointments: /user/appointments
- My Profile: /user/profile
- Patient Portal: /user/doctors

Friendly guidance:

- To find a doctor, open Find Doctors.
- To book an appointment, select a doctor, view available slots, choose a date and time, and confirm the appointment.
- To view existing appointments, open My Appointments.
- To update personal information, open My Profile.

### Doctor Logged In

- Dashboard: /doctor/dashboard
- Appointments: /doctor/appointments
- Prescriptions: /doctor/prescriptions
- My Profile: /doctor/profile
- Doctor Portal: /doctor/dashboard

Friendly guidance:

- To view today's overview, open Dashboard.
- To view the calendar, open Appointments.
- To manage prescriptions, open Prescriptions.
- To update professional information or availability, open My Profile.
`;

export const PUBLIC_SUGGESTED_QUESTIONS: Record<string, string[]> = {
  default: [
    "What is Schedula?",
    "I am a patient. Where should I start?",
    "I am a doctor. Where should I start?",
    "How do I find a doctor?",
  ],

  "/": [
    "How do I find a doctor?",
    "How can I book an appointment?",
    "How can I register as a doctor?",
    "How does Schedula work?",
  ],

  "/about": [
    "What is Schedula?",
    "Who can use Schedula?",
    "What can patients do?",
    "What can doctors do?",
  ],

  "/services": [
    "What services are available for patients?",
    "What services are available for doctors?",
    "Can I book an appointment?",
    "Can doctors manage their availability?",
  ],

  "/find-doctors": [
    "How do I find a doctor by specialization?",
    "Can I browse doctors without logging in?",
    "How do I book an appointment?",
    "What information is shown on a doctor card?",
  ],

  "/for-doctors": [
    "How can I register as a doctor?",
    "What can doctors do on Schedula?",
    "Where can doctors manage appointments?",
    "How can doctors update their availability?",
  ],

  "/login": [
    "How do I log in as a patient?",
    "How do I log in as a doctor?",
    "How can I create an account?",
    "Where will I go after login?",
  ],
};

export const PATIENT_SUGGESTED_QUESTIONS: Record<string, string[]> = {
  default: [
    "How do I find a doctor?",
    "How do I book an appointment?",
    "Where can I see my appointments?",
  ],

  "/user/doctors": [
    "How do I find a doctor by specialization?",
    "How do I book an appointment?",
    "How do I view a doctor's available slots?",
    "What information is shown on a doctor card?",
  ],

  "/user/appointments": [
    "How do I cancel an appointment?",
    "How do I reschedule an appointment?",
    "How do I download my prescription?",
    "What do appointment statuses mean?",
  ],

  "/user/profile": [
    "How do I update my profile?",
    "Can I change my email address?",
    "How do I save my changes?",
  ],
};

export const DOCTOR_SUGGESTED_QUESTIONS: Record<string, string[]> = {
  default: [
    "How do I manage my availability?",
    "Where can I view my calendar?",
    "How do I create a prescription?",
  ],

  "/doctor/dashboard": [
    "How do I confirm a pending appointment?",
    "What do the dashboard statistics mean?",
    "How do I cancel an appointment?",
    "Where can I view upcoming appointments?",
  ],

  "/doctor/appointments": [
    "How do I reschedule an appointment?",
    "How do I use the calendar?",
    "What do the colors on the calendar mean?",
  ],

  "/doctor/profile": [
    "How do I update my availability?",
    "How do I add a new time slot?",
    "How do I update my specialization?",
  ],

  "/doctor/prescriptions": [
    "How do I create a new prescription?",
    "How do I view a past prescription?",
    "Can patients download prescriptions?",
  ],
};