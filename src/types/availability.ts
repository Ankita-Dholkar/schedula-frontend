// A single bookable time slot
export type TimeSlot = {
  id: string;          
  start: string;       
  end: string;         
  isBooked: boolean;
};

// Availability for a specific date
export type DateSchedule = {
  date: string; // "YYYY-MM-DD"
  isActive: boolean;
  startTime: string;   
  endTime: string;     
  slotDuration: number; 
  slots: TimeSlot[];
};

// Full availability record per doctor
export type DoctorAvailability = {
  doctorId: string;
  schedule: DateSchedule[];
  offDates: string[]; // specific "YYYY-MM-DD" dates the doctor is off
};
