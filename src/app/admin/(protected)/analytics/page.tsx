"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Calendar,
  Users,
  Stethoscope,
  CreditCard,
  UserCheck,
  ArrowUpRight,
  Activity,
  Video,
  MapPin,
} from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { mockPatients, getAllPatients } from "@/lib/mock-data/patients";
import TrendAreaChart, { type TrendDataPoint, type TrendSeries } from "@/components/charts/TrendAreaChart";
import BarComparisonChart, { type BarGroup, type BarSeries } from "@/components/charts/BarComparisonChart";
import DonutBreakdownChart, { type DonutSlice } from "@/components/charts/DonutBreakdownChart";
import StatProgressBar, { type ProgressItem } from "@/components/charts/StatProgressBar";
import type { Appointment } from "@/types/appointment";
import type { Payment } from "@/types/payment";
import type { Doctor } from "@/types/doctor";

// ── Types ──────────────────────────────────────────────────────────────────────

type DateRange = "7d" | "30d" | "90d" | "year" | "all";

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "year", label: "This Year" },
  { value: "all", label: "All Time" },
];

function getRangeStart(range: DateRange): Date | null {
  const now = new Date();
  if (range === "7d") return new Date(now.getTime() - 7 * 86400000);
  if (range === "30d") return new Date(now.getTime() - 30 * 86400000);
  if (range === "90d") return new Date(now.getTime() - 90 * 86400000);
  if (range === "year") return new Date(now.getFullYear(), 0, 1);
  return null; // all time
}

function fmt(n: number): string {
  return n.toLocaleString("en-IN");
}

function fmtCurrency(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-");
  return new Intl.DateTimeFormat("en-IN", { month: "short" }).format(
    new Date(Number(y), Number(m) - 1)
  );
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-[var(--ink)]">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-[var(--muted)]">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[var(--muted)] truncate">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold text-[var(--ink)]">{value}</p>
          {sub && (
            <p className="mt-0.5 text-[11px] text-[var(--muted)] truncate">
              {sub}
            </p>
          )}
        </div>
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${iconBg}`}
        >
          <Icon size={19} className={iconColor} />
        </div>
      </div>
    </div>
  );
}

// ── Utility: build ordered month buckets ──────────────────────────────────────

function buildMonthBuckets(
  start: Date | null,
  end: Date = new Date()
): string[] {
  const months: string[] = [];
  const cursor = start
    ? new Date(start.getFullYear(), start.getMonth(), 1)
    : new Date(end.getFullYear() - 1, end.getMonth() + 1, 1);
  const endMon = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= endMon) {
    months.push(monthKey(cursor.toISOString()));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const appointments = useAppSelector((s) => s.appointments.appointments);
  const doctors = useAppSelector((s) => s.doctors.doctors);
  const payments = useAppSelector((s) => s.payments.payments);

  const [range, setRange] = useState<DateRange>("30d");
  const [allPatients, setAllPatients] = useState(mockPatients);

  useEffect(() => {
    setAllPatients(getAllPatients());
  }, []);

  const rangeStart = useMemo(() => getRangeStart(range), [range]);

  // ── Filtered data ────────────────────────────────────────────────────────────

  const filteredAppts = useMemo((): Appointment[] => {
    if (!rangeStart) return appointments;
    return appointments.filter(
      (a) => new Date(a.startsAt) >= rangeStart
    );
  }, [appointments, rangeStart]);

  const filteredPayments = useMemo((): Payment[] => {
    if (!rangeStart) return payments;
    return payments.filter((p) => new Date(p.createdAt) >= rangeStart);
  }, [payments, rangeStart]);

  // ── Appointment Trend data ────────────────────────────────────────────────────

  const apptTrendData = useMemo((): TrendDataPoint[] => {
    if (range === "7d") {
      // Last 7 days by day
      const days: TrendDataPoint[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = dayKey(d.toISOString());
        const dayAppts = appointments.filter((a) => a.startsAt.startsWith(key));
        days.push({
          label: d.toLocaleDateString("en-IN", { weekday: "short" }),
          total: dayAppts.length,
          completed: dayAppts.filter((a) => a.status === "completed").length,
          cancelled: dayAppts.filter((a) => a.status === "cancelled").length,
          missed: dayAppts.filter((a) => a.status === "missed").length,
        });
      }
      return days;
    }

    // Otherwise monthly
    const buckets = buildMonthBuckets(rangeStart);
    return buckets.map((ym) => {
      const monthAppts = appointments.filter((a) => monthKey(a.startsAt) === ym);
      return {
        label: monthLabel(ym),
        total: monthAppts.length,
        completed: monthAppts.filter((a) => a.status === "completed").length,
        cancelled: monthAppts.filter((a) => a.status === "cancelled").length,
        missed: monthAppts.filter((a) => a.status === "missed").length,
      };
    });
  }, [appointments, range, rangeStart]);

  const apptTrendSeries: TrendSeries[] = [
    { key: "total", label: "Total", color: "#6366f1", gradientId: "grad-total" },
    { key: "completed", label: "Completed", color: "#10b981", gradientId: "grad-completed" },
    { key: "cancelled", label: "Cancelled", color: "#ef4444", gradientId: "grad-cancelled" },
    { key: "missed", label: "Missed", color: "#f59e0b", gradientId: "grad-missed" },
  ];

  // ── Registration Trends ───────────────────────────────────────────────────────

  const registrationData = useMemo((): TrendDataPoint[] => {
    const buckets = buildMonthBuckets(rangeStart);
    return buckets.map((ym) => ({
      label: monthLabel(ym),
      patients: allPatients.filter(
        (p) => p.registeredAt && monthKey(p.registeredAt) === ym
      ).length,
      doctors: doctors.filter(
        (d) => d.submittedAt && monthKey(d.submittedAt) === ym
      ).length,
    }));
  }, [allPatients, doctors, rangeStart]);

  const registrationSeries: TrendSeries[] = [
    { key: "patients", label: "Patients", color: "#8b5cf6", gradientId: "grad-patients" },
    { key: "doctors", label: "Doctors", color: "#0ea5e9", gradientId: "grad-doctors" },
  ];

  // ── Online vs In-Person ───────────────────────────────────────────────────────

  const onlineCount = filteredAppts.filter(
    (a) => a.appointmentMode === "online"
  ).length;
  const inPersonCount = filteredAppts.filter(
    (a) => a.appointmentMode === "in-person"
  ).length;
  const unknownModeCount =
    filteredAppts.length - onlineCount - inPersonCount;

  const modePaidPayments = filteredPayments.filter(
    (p) => p.status === "paid"
  );
  const onlineRevenue = modePaidPayments.filter((p) => {
    const appt = appointments.find((a) => a.id === p.appointmentId);
    return appt?.appointmentMode === "online";
  }).reduce((s, p) => s + p.amount, 0);
  const inPersonRevenue = modePaidPayments.filter((p) => {
    const appt = appointments.find((a) => a.id === p.appointmentId);
    return appt?.appointmentMode === "in-person";
  }).reduce((s, p) => s + p.amount, 0);

  const modeSlices: DonutSlice[] = [
    { label: "Online", value: onlineCount, color: "#6366f1" },
    { label: "In-Person", value: inPersonCount, color: "#10b981" },
    ...(unknownModeCount > 0
      ? [{ label: "Unspecified", value: unknownModeCount, color: "#e2e8f0" }]
      : []),
  ];

  // ── Completed / Cancelled stats ───────────────────────────────────────────────

  const completedCount = filteredAppts.filter(
    (a) => a.status === "completed"
  ).length;
  const cancelledCount = filteredAppts.filter(
    (a) => a.status === "cancelled"
  ).length;
  const missedCount = filteredAppts.filter(
    (a) => a.status === "missed"
  ).length;

  const completionRateSlices: DonutSlice[] = [
    { label: "Completed", value: completedCount, color: "#10b981" },
    { label: "Cancelled", value: cancelledCount, color: "#ef4444" },
    { label: "Missed", value: missedCount, color: "#f59e0b" },
  ];

  // Cancellation reasons breakdown
  const cancellationReasons = useMemo((): ProgressItem[] => {
    const map: Record<string, number> = {};
    filteredAppts
      .filter((a) => a.status === "cancelled" && a.cancellationReason)
      .forEach((a) => {
        const reason = a.cancellationReason!;
        map[reason] = (map[reason] ?? 0) + 1;
      });
    const colors = ["#ef4444", "#f97316", "#f59e0b", "#8b5cf6", "#64748b"];
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value], i) => ({
        label,
        value,
        color: colors[i % colors.length],
      }));
  }, [filteredAppts]);

  // ── Revenue / Payment Overview ─────────────────────────────────────────────────

  const totalRevenue = filteredPayments
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + p.amount, 0);
  const pendingRevenue = filteredPayments
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + p.amount, 0);
  const refundedAmount = filteredPayments
    .filter((p) => p.status === "refunded")
    .reduce((s, p) => s + (p.refundAmount ?? p.amount), 0);
  const failedCount = filteredPayments.filter(
    (p) => p.status === "failed"
  ).length;

  const cardRevenue = filteredPayments
    .filter((p) => p.status === "paid" && p.method === "card")
    .reduce((s, p) => s + p.amount, 0);
  const upiRevenue = filteredPayments
    .filter((p) => p.status === "paid" && p.method === "upi")
    .reduce((s, p) => s + p.amount, 0);

  const paymentMethodSlices: DonutSlice[] = [
    { label: "Card", value: cardRevenue, color: "#6366f1" },
    { label: "UPI", value: upiRevenue, color: "#f59e0b" },
  ];

  const revenueTrendData = useMemo((): TrendDataPoint[] => {
    if (range === "7d") {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const key = dayKey(d.toISOString());
        const dayPayments = payments.filter(
          (p) => p.status === "paid" && p.createdAt.startsWith(key)
        );
        return {
          label: d.toLocaleDateString("en-IN", { weekday: "short" }),
          revenue: dayPayments.reduce((s, p) => s + p.amount, 0),
        };
      });
    }
    const buckets = buildMonthBuckets(rangeStart);
    return buckets.map((ym) => {
      const monPayments = payments.filter(
        (p) => p.status === "paid" && monthKey(p.createdAt) === ym
      );
      return {
        label: monthLabel(ym),
        revenue: monPayments.reduce((s, p) => s + p.amount, 0),
      };
    });
  }, [payments, range, rangeStart]);

  const revenueSeries: TrendSeries[] = [
    { key: "revenue", label: "Revenue (₹)", color: "#10b981", gradientId: "grad-revenue" },
  ];

  // ── Doctor Verification Stats ─────────────────────────────────────────────────

  const approvedDoctors = doctors.filter(
    (d) => d.verificationStatus === "approved" || d.verificationStatus === "verified"
  ).length;
  const pendingDoctors = doctors.filter(
    (d) => d.verificationStatus === "pending"
  ).length;
  const rejectedDoctors = doctors.filter(
    (d) => d.verificationStatus === "rejected"
  ).length;

  const verificationSlices: DonutSlice[] = [
    { label: "Approved", value: approvedDoctors, color: "#10b981" },
    { label: "Pending", value: pendingDoctors, color: "#f59e0b" },
    { label: "Rejected", value: rejectedDoctors, color: "#ef4444" },
  ];

  // Doctor verification trend over months
  const verificationTrendData = useMemo((): TrendDataPoint[] => {
    const buckets = buildMonthBuckets(rangeStart);
    return buckets.map((ym) => {
      const monthDocs = doctors.filter(
        (d) => d.submittedAt && monthKey(d.submittedAt) === ym
      );
      return {
        label: monthLabel(ym),
        approved: monthDocs.filter(
          (d) =>
            d.verificationStatus === "approved" ||
            d.verificationStatus === "verified"
        ).length,
        pending: monthDocs.filter((d) => d.verificationStatus === "pending")
          .length,
        rejected: monthDocs.filter((d) => d.verificationStatus === "rejected")
          .length,
      };
    });
  }, [doctors, rangeStart]);

  const verificationSeries: TrendSeries[] = [
    { key: "approved", label: "Approved", color: "#10b981", gradientId: "grad-vapproved" },
    { key: "pending", label: "Pending", color: "#f59e0b", gradientId: "grad-vpending" },
    { key: "rejected", label: "Rejected", color: "#ef4444", gradientId: "grad-vrejected" },
  ];

  // ── Registration Bar (daily for 7d/30d, monthly otherwise) ─────────────────

  const registrationBarData = useMemo((): { data: BarGroup[]; series: BarSeries[] } => {
    if (range === "7d" || range === "30d") {
      // Daily breakdown
      const numDays = range === "7d" ? 7 : 30;
      const days: BarGroup[] = [];
      const now = new Date();

      for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const nextD = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);

        const label = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });

        const patientsCount = allPatients.filter((p) => {
          if (!p.registeredAt) return false;
          const dt = new Date(p.registeredAt);
          return dt >= d && dt < nextD;
        }).length;

        const doctorsCount = doctors.filter((doc) => {
          if (!doc.submittedAt) return false;
          const dt = new Date(doc.submittedAt);
          return dt >= d && dt < nextD;
        }).length;

        days.push({
          label,
          Patients: patientsCount,
          Doctors: doctorsCount,
        });
      }

      return {
        data: days,
        series: [
          { key: "Patients", label: "Patients", color: "#8b5cf6" },
          { key: "Doctors", label: "Doctors", color: "#0ea5e9" },
        ],
      };
    }

    const buckets = buildMonthBuckets(rangeStart);
    const data: BarGroup[] = buckets.map((ym) => ({
      label: monthLabel(ym),
      Patients: allPatients.filter(
        (p) => p.registeredAt && monthKey(p.registeredAt) === ym
      ).length,
      Doctors: doctors.filter(
        (d) => d.submittedAt && monthKey(d.submittedAt) === ym
      ).length,
    }));
    return {
      data,
      series: [
        { key: "Patients", label: "Patients", color: "#8b5cf6" },
        { key: "Doctors", label: "Doctors", color: "#0ea5e9" },
      ],
    };
  }, [allPatients, doctors, range, rangeStart]);

  // ── Summary KPIs ──────────────────────────────────────────────────────────────

  const completionRate =
    filteredAppts.length > 0
      ? Math.round((completedCount / filteredAppts.length) * 100)
      : 0;
  const newPatients = rangeStart
    ? allPatients.filter(
        (p) => p.registeredAt && new Date(p.registeredAt) >= rangeStart
      ).length
    : allPatients.length;
  const newDoctors = rangeStart
    ? doctors.filter(
        (d) => d.submittedAt && new Date(d.submittedAt) >= rangeStart
      ).length
    : doctors.length;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-5 lg:p-7 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--ink)]">Analytics</h1>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            Platform insights and performance metrics
          </p>
        </div>
        {/* Date Range Selector */}
        <div className="flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-white p-1 shadow-sm flex-wrap">
          {DATE_RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                range === opt.value
                  ? "bg-[var(--brand)] text-white shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--canvas)]"
              }`}
              id={`analytics-range-${opt.value}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Total Appointments"
          value={fmt(filteredAppts.length)}
          icon={Calendar}
          iconColor="text-[var(--brand)]"
          iconBg="bg-indigo-50"
          sub={`${completionRate}% completion rate`}
        />
        <KpiCard
          label="Revenue Collected"
          value={fmtCurrency(totalRevenue)}
          icon={CreditCard}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          sub={`₹${pendingRevenue.toLocaleString("en-IN")} pending`}
        />
        <KpiCard
          label="New Patients"
          value={fmt(newPatients)}
          icon={Users}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
          sub={`Total ${fmt(allPatients.length)} registered`}
        />
        <KpiCard
          label="New Doctors"
          value={fmt(newDoctors)}
          icon={Stethoscope}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
          sub={`${pendingDoctors} pending verification`}
        />
      </div>

      {/* ── Row 1: Appointment Trends ── */}
      <SectionCard
        title="Appointment Trends"
        subtitle={`${DATE_RANGE_OPTIONS.find((o) => o.value === range)?.label ?? ""} — Total, completed, cancelled & missed`}
      >
        {/* Legend */}
        <div className="mb-3 flex flex-wrap gap-4">
          {apptTrendSeries.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
        <TrendAreaChart
          data={apptTrendData}
          series={apptTrendSeries}
          formatValue={fmt}
        />
      </SectionCard>

      {/* ── Row 2: Registration Trends (2 cards) ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard
          title="Registration Trends"
          subtitle="Monthly patient &amp; doctor sign-ups"
        >
          <div className="mb-3 flex gap-4">
            {registrationSeries.map((s) => (
              <span key={s.key} className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
                {s.label}
              </span>
            ))}
          </div>
          <TrendAreaChart
            data={registrationData}
            series={registrationSeries}
            height={190}
            formatValue={fmt}
          />
        </SectionCard>

        <SectionCard
          title="Registration Breakdown"
          subtitle={
            range === "7d" || range === "30d"
              ? "Daily new users"
              : "Monthly new users"
          }
        >
          <BarComparisonChart
            data={registrationBarData.data}
            series={registrationBarData.series}
            height={200}
            formatValue={fmt}
          />
          <div className="mt-3 flex flex-wrap gap-4">
            {registrationBarData.series.map((s) => (
              <span key={s.key} className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
                {s.label}
              </span>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ── Row 3: Online vs In-Person ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard
          title="Appointment Mode Distribution"
          subtitle="Online (telehealth) vs In-Person (clinic)"
        >
          <DonutBreakdownChart
            slices={modeSlices}
            centerLabel={fmt(filteredAppts.length)}
            centerSubLabel="total"
            formatValue={fmt}
          />
        </SectionCard>

        <SectionCard
          title="Mode Revenue Split"
          subtitle="Revenue by appointment mode"
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-indigo-50 p-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <Video size={14} className="text-indigo-600" />
                  <span className="text-xs font-medium text-indigo-700">Online</span>
                </div>
                <p className="text-lg font-bold text-indigo-700">
                  {fmtCurrency(onlineRevenue)}
                </p>
                <p className="text-[10px] text-indigo-600 mt-0.5">{onlineCount} appointments</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin size={14} className="text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-700">In-Person</span>
                </div>
                <p className="text-lg font-bold text-emerald-700">
                  {fmtCurrency(inPersonRevenue)}
                </p>
                <p className="text-[10px] text-emerald-600 mt-0.5">{inPersonCount} appointments</p>
              </div>
            </div>
            <StatProgressBar
              items={[
                { label: "Online", value: onlineRevenue, color: "#6366f1" },
                { label: "In-Person", value: inPersonRevenue, color: "#10b981" },
              ]}
              formatValue={fmtCurrency}
            />
          </div>
        </SectionCard>
      </div>

      {/* ── Row 4: Completed vs Cancelled Statistics ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard
          title="Appointment Outcome Breakdown"
          subtitle="Completed, cancelled &amp; missed rates"
        >
          <DonutBreakdownChart
            slices={completionRateSlices}
            centerLabel={`${completionRate}%`}
            centerSubLabel="completion"
            formatValue={fmt}
          />
        </SectionCard>

        <SectionCard
          title="Cancellation Reasons"
          subtitle="Top reasons patients/doctors cancel"
        >
          {cancellationReasons.length === 0 ? (
            <p className="text-sm text-[var(--muted)] text-center py-8">
              No cancellation data in this period.
            </p>
          ) : (
            <StatProgressBar
              items={cancellationReasons}
              formatValue={fmt}
            />
          )}
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-emerald-50 py-3 px-2">
              <p className="text-xl font-bold text-emerald-700">{completedCount}</p>
              <p className="text-[10px] font-medium text-emerald-600 mt-0.5">Completed</p>
            </div>
            <div className="rounded-xl bg-red-50 py-3 px-2">
              <p className="text-xl font-bold text-red-600">{cancelledCount}</p>
              <p className="text-[10px] font-medium text-red-500 mt-0.5">Cancelled</p>
            </div>
            <div className="rounded-xl bg-amber-50 py-3 px-2">
              <p className="text-xl font-bold text-amber-600">{missedCount}</p>
              <p className="text-[10px] font-medium text-amber-500 mt-0.5">Missed</p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ── Row 5: Payment & Revenue Overview ── */}
      <SectionCard
        title="Payment & Revenue Overview"
        subtitle="Revenue trend and payment method breakdown"
      >
        <div className="grid grid-cols-2 gap-3 mb-5 lg:grid-cols-4">
          <div className="rounded-xl bg-emerald-50 p-3.5">
            <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">Collected</p>
            <p className="text-xl font-bold text-emerald-700 mt-1">{fmtCurrency(totalRevenue)}</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-3.5">
            <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">Pending</p>
            <p className="text-xl font-bold text-amber-700 mt-1">{fmtCurrency(pendingRevenue)}</p>
          </div>
          <div className="rounded-xl bg-violet-50 p-3.5">
            <p className="text-[10px] font-semibold text-violet-700 uppercase tracking-wider">Refunded</p>
            <p className="text-xl font-bold text-violet-700 mt-1">{fmtCurrency(refundedAmount)}</p>
          </div>
          <div className="rounded-xl bg-red-50 p-3.5">
            <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wider">Failed Txns</p>
            <p className="text-xl font-bold text-red-700 mt-1">{failedCount}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Revenue trend chart */}
          <div className="lg:col-span-2">
            <p className="text-xs font-medium text-[var(--muted)] mb-2">Revenue Trend</p>
            <TrendAreaChart
              data={revenueTrendData}
              series={revenueSeries}
              height={180}
              formatValue={fmtCurrency}
            />
          </div>

          {/* Payment method donut */}
          <div>
            <p className="text-xs font-medium text-[var(--muted)] mb-2">Payment Methods</p>
            <DonutBreakdownChart
              slices={paymentMethodSlices}
              centerLabel={fmtCurrency(cardRevenue + upiRevenue)}
              centerSubLabel="total"
              size={160}
              formatValue={fmtCurrency}
            />
          </div>
        </div>
      </SectionCard>

      {/* ── Row 6: Doctor Verification Statistics ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard
          title="Doctor Verification Statistics"
          subtitle="All-time verification status distribution"
          action={
            <Link
              href="/admin/doctor-verification"
              className="flex items-center gap-1 text-xs font-medium text-[var(--brand)] hover:underline"
            >
              Review Pending <ArrowUpRight size={12} />
            </Link>
          }
        >
          <DonutBreakdownChart
            slices={verificationSlices}
            centerLabel={fmt(doctors.length)}
            centerSubLabel="doctors"
            formatValue={fmt}
          />
        </SectionCard>

        <SectionCard
          title="Verification Trend"
          subtitle="Monthly doctor approvals, pending &amp; rejections"
        >
          <div className="mb-3 flex gap-4 flex-wrap">
            {verificationSeries.map((s) => (
              <span key={s.key} className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
                {s.label}
              </span>
            ))}
          </div>
          <TrendAreaChart
            data={verificationTrendData}
            series={verificationSeries}
            height={190}
            formatValue={fmt}
          />
        </SectionCard>
      </div>
    </div>
  );
}
