import type { Doctor } from "@/types/doctor";
import DoctorCard from "./DoctorCard";

type DoctorListProps = {
  doctors: Doctor[];
};

export default function DoctorList({ doctors }: DoctorListProps) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {doctors.map((doctor, index) => (
        <DoctorCard key={doctor.id} doctor={doctor} priority={index === 0} />
      ))}
    </div>
  );
}