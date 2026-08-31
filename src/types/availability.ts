// A single bookable time slot
export type TimeSlot = {
  id: string;          
  start: string;       
  end: string;         
  isBooked: boolean;
};

// Availability for one day of the week
export type DaySchedule = {
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  isActive: boolean;
  startTime: string;   
  endTime: string;     
  slotDuration: number; 
  slots: TimeSlot[];
};

// Full availability record per doctor
export type DoctorAvailability = {
  doctorId: string;
  schedule: DaySchedule[];
  offDates: string[]; // specific "YYYY-MM-DD" dates the doctor is off
};
