import Image from "next/image";
import Link from "next/link";
import { UserCircle2 } from "lucide-react";
import type { Doctor } from "@/types/doctor";

type Props = {
  doctor: Doctor;
  priority?: boolean;
};

export default function UserDoctorCard({ doctor, priority = false }: Props) {
  const hasImage = !!doctor.image;

  return (
    <Link href={`/user/doctors/${doctor.id}`} className="block">
      <article className="flex min-h-[145px] w-full cursor-pointer gap-4 rounded-[18px] border border-[var(--line)] bg-white p-3 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[var(--brand)] hover:shadow-md">
        {/* Doctor Image / Avatar */}
        <div className="relative h-[120px] w-[105px] shrink-0 overflow-hidden rounded-[12px] sm:h-[130px] sm:w-[115px] lg:h-[140px] lg:w-[125px]">
          {hasImage ? (
            <Image
              src={doctor.image}
              alt={doctor.name}
              fill
              sizes="(max-width: 640px) 105px, (max-width: 1024px) 115px, 125px"
              className="object-cover"
              priority={priority}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-teal-50">
              <UserCircle2 size={60} className="text-[var(--brand)] opacity-60" />
            </div>
          )}
        </div>

        {/* Doctor Information */}
        <div className="min-w-0 flex-1 py-1">
          <h2 className="truncate text-[16px] font-semibold text-[var(--ink)] sm:text-[17px]">
            {doctor.name}
          </h2>
          <p className="mt-1.5 text-[12px] text-[var(--brand)]">{doctor.specialization}</p>
          <span className="mt-1.5 inline-block rounded bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
            {doctor.availability}
          </span>
          <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-[var(--muted)]">
            {doctor.description}
          </p>
          <p className="mt-1.5 text-[11px] font-medium text-[var(--muted)]">
            {doctor.availableTime}
          </p>
        </div>
      </article>
    </Link>
  );
}
