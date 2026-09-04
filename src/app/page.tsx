"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AssistantProvider from "@/features/assistant/components/AssistantProvider";
import {
  Search,
  CalendarCheck,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Menu,
  X,
  LogOut,
} from "lucide-react";

type AuthUser = { name: string; role: "patient" | "doctor" } | null;

/* ── FAQ data ── */
const faqs = [
  {
    q: "How do I book an appointment?",
    a: "Log in to your patient account, open Find Doctors, select a doctor, view the available slots, choose a suitable date and time, and confirm your appointment.",
  },
  {
    q: "How can a doctor register on Schedula?",
    a: "Select Get Started on the homepage and choose the doctor registration option. Enter the required professional details, such as your specialization, license number, and availability, then complete the registration process.",
  },
  {
    q: "Do I need an account to find a doctor?",
    a: "You can browse doctor profiles and explore their specializations without an account. However, you need to log in or register as a patient before booking an appointment.",
  },
  {
    q: "What can doctors manage on Schedula?",
    a: "Doctors can view appointments, manage their availability, confirm or cancel eligible appointments, update their professional profile, and create prescriptions for completed appointments.",
  },
];

/* ── Feature cards data ── */
const features = [
  {
    icon: Search,
    title: "Find Doctors",
    desc: "Discover specialists by name or specialization and view their availability in real time.",
  },
  {
    icon: CalendarCheck,
    title: "Book Appointments",
    desc: "Choose a date and time that works for you. Get instant confirmation on your booking.",
  },
  {
    icon: ClipboardList,
    title: "Manage Visits",
    desc: "Track upcoming appointments, download prescriptions, and review your visit history.",
  },
];

/* ── Step data ── */
const steps = [
  { num: "01", title: "Find a service", desc: "Browse our specialist categories and find the care you need." },
  { num: "02", title: "Choose a doctor", desc: "View profiles, experience, and available slots for any doctor." },
  { num: "03", title: "Confirm your visit", desc: "Pick your preferred time and confirm. It's that simple." },
];

/* ── Expert doctors data ── */
const experts = [
  { name: "Dr. Prakash Das", spec: "Sr. Psychologist", exp: "7 years", img: "/doctor-1.png" },
  { name: "Dr. Anika Rao", spec: "General Physician", exp: "10 years", img: "/doctor-2.png" },
  { name: "Dr. Martin Cole", spec: "Dermatologist", exp: "12 years", img: "/doctor-3.png" },
  { name: "Dr. Sarah Wilson", spec: "Cardiologist", exp: "9 years", img: "/doctor-4.png" },
];

/* ── Testimonials ── */
const testimonials = [
  {
    quote: "Absolutely the best experience I've had. Booking was seamless and very fast.",
    name: "Priya M.",
    role: "Patient since 2025",
    img: "/patient-1.png",
    rating: 5,
  },
  {
    quote: "A lifesaver! I found a specialist and booked my appointment within minutes.",
    name: "Rahul T.",
    role: "Patient since 2024",
    img: "/doctor-3.png",
    rating: 5,
  },
  {
    quote: "The doctor was professional, and I had my prescription downloaded instantly.",
    name: "Ayesha K.",
    role: "Patient since 2026",
    img: "/doctor-4.png",
    rating: 4,
  },
  {
    quote: "The interface is beautiful and extremely easy to use. Highly recommended.",
    name: "Siddharth J.",
    role: "Patient since 2025",
    img: "/doctors/doctor1.png",
    rating: 5,
  },
];

export default function HomePage() {
  const [user, setUser] = useState<AuthUser>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("loggedInUser");
      if (raw) setUser(JSON.parse(raw));
    } catch { /* ignore */ }

    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* route helpers */
  const patientHref = (fallback: string) =>
    user?.role === "patient" ? fallback : user?.role === "doctor" ? "/doctor/dashboard" : "/login";
  const doctorHref = () =>
    user?.role === "doctor" ? "/doctor/dashboard" : "/login";
  const portalLabel = user
    ? user.role === "doctor"
      ? "Doctor Portal →"
      : "Patient Portal →"
    : null;
  const portalHref = user
    ? user.role === "doctor"
      ? "/doctor/dashboard"
      : "/user/doctors"
    : "/login";

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">

      {/* ══════════════════ NAVBAR ══════════════════ */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md border-b border-[var(--line)] shadow-sm"
            : "bg-white border-b border-[var(--line)]"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand)] shadow-sm">
              <span className="font-serif text-lg font-bold text-white">S</span>
            </div>
            <div>
              <p className="text-lg font-bold tracking-wide text-[var(--ink)]">Schedula</p>
              <p className="text-sm text-[var(--muted)]">Clinic operations</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 lg:flex">
            {["Home", "About", "Services"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-base font-medium text-[var(--muted)] transition hover:text-[var(--brand)]"
              >
                {item}
              </a>
            ))}
            <a href="#explore" className="flex items-center gap-1 text-base font-medium text-[var(--muted)] transition hover:text-[var(--brand)]">
              Explore <ChevronDown size={14} />
            </a>
          </nav>

          {/* Auth buttons */}
          <div className="hidden items-center gap-3 lg:flex">
            {user ? (
              user.role === "patient" ? (
                <>
                  <span className="text-sm text-[var(--muted)]">Hi, <span className="font-semibold text-[var(--ink)]">{user.name.split(" ")[0]}</span></span>
                  <Link
                    href="/user/doctors"
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--brand)] px-4 py-2 text-sm font-semibold text-[var(--brand)] transition hover:bg-[var(--brand)] hover:text-white"
                  >
                    Book Appointment
                  </Link>
                  <Link
                    href="/user/doctors"
                    className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)]"
                  >
                    Patient Portal
                  </Link>
                  <button
                    onClick={() => { localStorage.removeItem("loggedInUser"); window.location.href = "/"; }}
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--line)] px-3 py-2 text-sm font-medium text-[var(--muted)] transition hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                    title="Log Out"
                  >
                    <LogOut size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm text-[var(--muted)]">Hi, <span className="font-semibold text-[var(--ink)]">{user.name.split(" ")[0]}</span></span>
                  <Link
                    href="/doctor/dashboard"
                    className="flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)]"
                  >
                    Manage my Clinic
                  </Link>
                  <button
                    onClick={() => { localStorage.removeItem("loggedInUser"); window.location.href = "/"; }}
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--line)] px-3 py-2 text-sm font-medium text-[var(--muted)] transition hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                    title="Log Out"
                  >
                    <LogOut size={16} />
                  </button>
                </>
              )
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)]"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="rounded-lg p-2 text-[var(--muted)] hover:bg-stone-100 lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-[var(--line)] bg-white px-5 py-4 lg:hidden">
            <nav className="flex flex-col gap-3">
              {["Home", "About", "Services", "Explore"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={() => setMobileOpen(false)}
                  className="text-base font-medium text-[var(--ink)] transition hover:text-[var(--brand)]"
                >
                  {item}
                </a>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-[var(--line)] pt-3">
                {user ? (
                  user.role === "patient" ? (
                    <>
                      <p className="text-xs text-[var(--muted)] px-1">Hi, <strong>{user.name.split(" ")[0]}</strong></p>
                      <Link href="/user/doctors" className="rounded-lg border border-[var(--brand)] px-4 py-2.5 text-center text-sm font-semibold text-[var(--brand)]">
                        Book Appointment
                      </Link>
                      <Link href="/user/doctors" className="rounded-lg bg-[var(--brand)] px-4 py-2.5 text-center text-sm font-semibold text-white">
                        Patient Portal
                      </Link>
                      <button
                        onClick={() => { localStorage.removeItem("loggedInUser"); window.location.href = "/"; }}
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--muted)] transition hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                      >
                        <LogOut size={16} />
                        Log Out
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-[var(--muted)] px-1">Hi, <strong>{user.name.split(" ")[0]}</strong></p>
                      <Link href="/doctor/dashboard" className="rounded-lg bg-[var(--brand)] px-4 py-2.5 text-center text-sm font-semibold text-white">
                        Manage my Clinic
                      </Link>
                      <button
                        onClick={() => { localStorage.removeItem("loggedInUser"); window.location.href = "/"; }}
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--muted)] transition hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                      >
                        <LogOut size={16} />
                        Log Out
                      </button>
                    </>
                  )
                ) : (
                  <>
                    <Link href="/login" className="rounded-lg border border-[var(--line)] px-4 py-2.5 text-center text-sm font-semibold text-[var(--ink)]">
                      Log in
                    </Link>
                    <Link href="/signup" className="rounded-lg bg-[var(--brand)] px-4 py-2.5 text-center text-sm font-semibold text-white">
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ══════════════════ HERO ══════════════════ */}
      <section id="home" className="relative bg-[var(--brand)] pt-12 pb-20 lg:pt-24 lg:pb-32 overflow-hidden text-white mb-20">
        {/* Decorative background blobs */}
        <div className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-80 w-80 translate-x-1/3 translate-y-1/3 rounded-full bg-black/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 lg:px-10">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left */}
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                Trusted clinic operations platform
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-[3.5rem]">
                Dedicated to Long Term <br />
                <span className="text-emerald-300">Health and Well-Being</span>
              </h1>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-emerald-50">
                At Schedula, we provide patient-focused medical care backed by
                experienced doctors, modern technology, and evidence-based practices.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={patientHref("/user/doctors")}
                  className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[var(--brand)] shadow-lg transition hover:bg-stone-50 hover:-translate-y-0.5"
                >
                  Get Started Now <ArrowRight size={16} />
                </Link>
                <Link
                  href={patientHref("/user/doctors")}
                  className="flex items-center gap-2 rounded-xl border border-white/30 bg-transparent px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 hover:-translate-y-0.5"
                >
                  Book an Appointment <CalendarCheck size={16} />
                </Link>
              </div>

              {/* Trust stats below buttons, matching reference layout */}
              <div className="mt-12 flex items-center gap-4">
                <div className="flex -space-x-3">
                  <div className="h-10 w-10 rounded-full border-2 border-[var(--brand)] bg-white overflow-hidden relative"><Image src="/patient-1.png" alt="Patient" fill sizes="40px" className="object-cover" /></div>
                  <div className="h-10 w-10 rounded-full border-2 border-[var(--brand)] bg-white overflow-hidden relative"><Image src="/doctor-3.png" alt="Doctor" fill sizes="40px" className="object-cover" /></div>
                  <div className="h-10 w-10 rounded-full border-2 border-[var(--brand)] bg-white overflow-hidden relative"><Image src="/doctor-1.png" alt="Doctor" fill sizes="40px" className="object-cover" /></div>
                </div>
                <div>
                  <p className="text-sm font-bold">5.5k+</p>
                  <p className="text-xs text-emerald-100">Trusted by happy patients</p>
                </div>
              </div>
            </div>

            {/* Right — hero image */}
            <div className="relative flex justify-center lg:justify-end lg:pr-8">
              {/* Image container using mask to blend or just direct image */}
              <div className="relative h-[480px] w-full max-w-[500px]">
                <Image
                  src="/hero-cutout.png"
                  alt="Professional Doctor"
                  fill
                  sizes="(max-width: 1024px) 100vw, 500px"
                  className="object-contain object-bottom"
                  priority
                />
              </div>

              {/* Stats overlay card, positioned similar to reference */}
              <div className="absolute bottom-4 -left-4 rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-md shadow-xl lg:-left-12">
                <div className="flex items-center gap-3 text-white">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400">
                    <CalendarCheck size={20} className="text-[var(--brand-deep)]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Easy Scheduling</p>
                    <p className="text-xs text-emerald-100">Available 24/7</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ HOW IT WORKS ══════════════════ */}
      <section id="about" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--brand)]">Process</p>
            <h2 className="mt-2 text-3xl font-bold text-[var(--ink)] sm:text-4xl">How Schedula works</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map(({ num, title, desc }, i) => (
              <div key={num} className="relative flex flex-col items-center text-center">
                {/* connector line */}
                {i < steps.length - 1 && (
                  <div className="absolute left-1/2 top-8 hidden h-px w-full bg-gradient-to-r from-[var(--brand)]/30 to-transparent sm:block" />
                )}
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand)] text-white shadow-lg shadow-[var(--brand)]/20">
                  <span className="text-lg font-bold">{num}</span>
                </div>
                <h3 className="mt-5 font-semibold text-[var(--ink)]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ WHAT CAN YOU DO ══════════════════ */}
      <section id="services" className="py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--brand)]">Features</p>
            <h2 className="mt-2 text-3xl font-bold text-[var(--ink)] sm:text-4xl">What can you do?</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-2xl border border-[var(--line)] bg-[var(--canvas)] p-7 transition hover:-translate-y-1 hover:border-[var(--brand)]/30 hover:shadow-lg"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand)]/10 text-[var(--brand)] transition group-hover:bg-[var(--brand)] group-hover:text-white">
                  <Icon size={22} strokeWidth={1.8} />
                </div>
                <h3 className="font-semibold text-[var(--ink)]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ OUR EXPERTS ══════════════════ */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-[var(--brand)]">Specialists</p>
              <h2 className="mt-2 text-3xl font-bold text-[var(--ink)] sm:text-4xl">Our Experts</h2>
            </div>
            <Link
              href={patientHref("/user/doctors")}
              className="flex items-center gap-1.5 text-sm font-semibold text-[var(--brand)] transition hover:underline"
            >
              View all doctors <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {experts.map(({ name, spec, exp, img }) => (
              <div
                key={name}
                className="group overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--canvas)] transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-52 w-full overflow-hidden bg-stone-100">
                  <Image src={img} alt={name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover object-top transition duration-500 group-hover:scale-105" />
                </div>
                <div className="p-4">
                  <p className="font-semibold text-[var(--ink)]">{name}</p>
                  <p className="mt-0.5 text-sm text-[var(--brand)]">{spec}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{exp} of experience</p>
                  <Link
                    href={patientHref("/user/doctors")}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand)] hover:underline"
                  >
                    Book now <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ TESTIMONIAL ══════════════════ */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--brand)]">Reviews</p>
            <h2 className="mt-2 text-3xl font-bold text-[var(--ink)] sm:text-4xl">See why patients trust us</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {testimonials.map((t, index) => (
              <div key={index} className="flex flex-col justify-between gap-6 rounded-2xl border border-[var(--line)] bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <blockquote className="text-base leading-relaxed text-[var(--ink)] italic">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div>
                  <div className="mb-4 flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={`text-base ${i < t.rating ? "text-amber-400" : "text-stone-200"}`}>★</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[var(--brand)]/20">
                      <Image src={t.img} alt={t.name} fill sizes="48px" className="object-cover" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-[var(--ink)]">{t.name}</p>
                      <p className="text-sm text-[var(--muted)]">{t.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ FOR PATIENTS / FOR DOCTORS ══════════════════ */}
      <section id="explore" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--brand)]">Portals</p>
            <h2 className="mt-2 text-3xl font-bold text-[var(--ink)] sm:text-4xl">Built for everyone</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Patient card */}
            <div className="flex flex-col justify-between gap-8 rounded-2xl border border-[var(--line)] bg-[var(--canvas)] p-8">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  For Patients
                </span>
                <h3 className="mt-4 text-xl font-bold text-[var(--ink)]">Find the right care</h3>
                <ul className="mt-4 space-y-2.5">
                  {[
                    "Search doctors by specialization",
                    "Book and track appointments",
                    "Download prescriptions instantly",
                    "Manage your health profile",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-[var(--muted)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)] shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href={patientHref("/user/doctors")}
                className="flex w-fit items-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)]"
              >
                Explore Patient Services <ChevronRight size={16} />
              </Link>
            </div>

            {/* Doctor card */}
            <div className="flex flex-col justify-between gap-8 rounded-2xl border border-[var(--brand)]/20 bg-gradient-to-br from-[var(--brand)]/5 to-[var(--brand)]/10 p-8">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand)]/10 px-3 py-1 text-xs font-semibold text-[var(--brand)]">
                  For Doctors
                </span>
                <h3 className="mt-4 text-xl font-bold text-[var(--ink)]">Manage your clinic</h3>
                <ul className="mt-4 space-y-2.5">
                  {[
                    "Organize your weekly schedule",
                    "Confirm and reschedule appointments",
                    "Create and manage prescriptions",
                    "View patient visit history",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-[var(--muted)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)] shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href={doctorHref()}
                className="flex w-fit items-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)]"
              >
                Doctor Portal <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ FAQ ══════════════════ */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-5 lg:px-0">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--brand)]">Support</p>
            <h2 className="mt-2 text-3xl font-bold text-[var(--ink)] sm:text-4xl">Frequently asked questions</h2>
          </div>
          <div className="divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-white overflow-hidden">
            {faqs.map(({ q, a }, i) => (
              <div key={i}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-stone-50"
                  aria-expanded={openFaq === i}
                >
                  <span className="font-medium text-[var(--ink)]">{q}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-[var(--muted)] transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="border-t border-[var(--line)] bg-stone-50/50 px-6 py-4">
                    <p className="text-sm leading-relaxed text-[var(--muted)]">{a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer className="border-t border-[var(--line)] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            {/* Brand */}
            <div className="max-w-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand)]">
                  <span className="font-serif text-lg font-bold text-white">S</span>
                </div>
                <div>
                  <p className="text-lg font-bold text-[var(--ink)]">Schedula</p>
                  <p className="text-sm text-[var(--muted)]">Clinic operations</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
                A modern platform for clinic operations, appointment management, and connected patient care.
              </p>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--ink)]">Platform</p>
                <ul className="space-y-2">
                  {[
                    { label: "Find Doctors", href: patientHref("/user/doctors") },
                    { label: "My Appointments", href: patientHref("/user/appointments") },
                    { label: "Doctor Portal", href: doctorHref() },
                  ].map(({ label, href }) => (
                    <li key={label}>
                      <Link href={href} className="text-sm text-[var(--muted)] transition hover:text-[var(--brand)]">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--ink)]">Account</p>
                <ul className="space-y-2">
                  {[
                    { label: "Log In", href: "/login" },
                    { label: "Sign Up", href: "/signup" },
                  ].map(({ label, href }) => (
                    <li key={label}>
                      <Link href={href} className="text-sm text-[var(--muted)] transition hover:text-[var(--brand)]">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--ink)]">Legal</p>
                <ul className="space-y-2">
                  {["Privacy Policy", "Terms of Service"].map((item) => (
                    <li key={item}>
                      <span className="cursor-default text-sm text-[var(--muted)]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-[var(--line)] pt-6 sm:flex-row">
            <p className="text-xs text-[var(--muted)]">© 2026 Schedula. All rights reserved.</p>
            <p className="text-xs text-[var(--muted)]">Built for modern clinics.</p>
          </div>
        </div>
      </footer>

      {/* ══ Schedula Assistant ══ */}
      <AssistantProvider portalRole={user?.role ?? "general"} />
    </div>
  );
}