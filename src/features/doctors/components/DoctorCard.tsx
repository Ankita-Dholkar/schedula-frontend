import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { Doctor } from "@/types/doctor";

type DoctorCardProps = {
  doctor: Doctor;
};

export default function DoctorCard({ doctor }: DoctorCardProps) {
  return (
    <Link
      href={`/doctors/${doctor.id}`}
      className="block"
    >
      <article
        className="
          flex
          min-h-[145px]
          w-full
          cursor-pointer
          gap-4
          rounded-[18px]
          border
          border-[#D9DDE3]
          bg-white
          p-3
          shadow-sm
          transition-all
          duration-200
          hover:-translate-y-1
          hover:shadow-md
        "
      >
        {/* Doctor Image */}
        <div
          className="
            relative
            h-[120px]
            w-[105px]
            shrink-0
            overflow-hidden
            rounded-[12px]
            sm:h-[130px]
            sm:w-[115px]
            lg:h-[140px]
            lg:w-[125px]
          "
        >
          <Image
            src={doctor.image}
            alt={doctor.name}
            fill
            sizes="(max-width: 640px) 105px, (max-width: 1024px) 115px, 125px"
            className="object-cover"
          />
        </div>

        {/* Doctor Information */}
        <div className="min-w-0 flex-1 py-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="truncate text-[16px] font-semibold text-[#252525] sm:text-[17px]">
              {doctor.name}
            </h2>

            <Heart
              size={20}
              strokeWidth={1.8}
              className="shrink-0 text-[#B5BDC8]"
            />
          </div>

          <p className="mt-1.5 text-[11px] text-[#2AB7A9] sm:text-[12px]">
            {doctor.specialization}
          </p>

          <span className="mt-1.5 inline-block rounded bg-[#E5F7E9] px-2 py-0.5 text-[10px] text-[#2BA84A] sm:text-[11px]">
            {doctor.availability}
          </span>

          <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-[#8B95A1] sm:text-[11px]">
            {doctor.description}
          </p>

          <p className="mt-1.5 text-[10px] font-medium text-[#4B5563] sm:text-[11px]">
            {doctor.availableTime}
          </p>
        </div>
      </article>
    </Link>
  );
}