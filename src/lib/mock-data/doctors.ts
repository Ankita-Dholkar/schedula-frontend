import type { Doctor } from "@/types/doctor";

export const doctors: Doctor[] = [
  {
    id: "doc-1",
    name: "Dr. Prakash Das",
    specialization: "Sr. Psychologist",
    experience: 7,
    availability: "Available today",
    description: "Dr. Prakash Das practices about 7 years...",
    availableTime: "08:30 AM - 07:00 PM",
    image: "/doctors/doctor1.png",
  },
  {
    id: "doc-2",
    name: "Dr. Anika Rao",
    specialization: "General Physician",
    experience: 10,
    availability: "Available today",
    description: "Experienced physician providing patient-focused care.",
    availableTime: "09:00 AM - 06:00 PM",
    image: "/doctors/doctor2.png",
  },
  {
    id: "doc-3",
    name: "Dr. Martin Cole",
    specialization: "Dermatologist",
    experience: 8,
    availability: "Available today",
    description: "Specialized in modern skin and dermatology treatments.",
    availableTime: "10:00 AM - 05:00 PM",
    image: "/doctors/doctor3.jpg",
  },
  {
    id: "doc-4",
    name: "Dr. Sarah Wilson",
    specialization: "Cardiologist",
    experience: 12,
    availability: "Available tomorrow",
    description: "Experienced cardiologist focused on heart health.",
    availableTime: "09:30 AM - 04:30 PM",
    image: "/doctors/doctor4.jpg",
  },
];