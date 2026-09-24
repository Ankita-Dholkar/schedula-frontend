"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Shield, AlertCircle, Loader2 } from "lucide-react";
import { adminLogin } from "@/features/auth/api/adminLogin";
import { setAdminUser } from "@/store/slices/adminAuthSlice";
import { hydrateAdminManagement } from "@/store/slices/adminManagementSlice";
import { useAppDispatch } from "@/store/hooks";

const STORAGE_KEY = "loggedInAdmin";

export default function AdminLoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });

  const validate = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const newErrors = {
      email: !email.trim()
        ? "Email is required."
        : !emailRegex.test(email.trim())
        ? "Enter a valid email address."
        : "",
      password: !password.trim() ? "Password is required." : "",
    };
    setFieldErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setIsLoading(true);
    // Simulate a short async delay for realism
    await new Promise((r) => setTimeout(r, 500));

    const result = adminLogin(email.trim(), password);
    setIsLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    // Dispatch to Redux (pure — no localStorage in reducer)
    dispatch(setAdminUser(result.admin));
    dispatch(hydrateAdminManagement());

    // Persist session to dedicated localStorage key
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result.admin));
    } catch {
      /* ignore */
    }

    // Hard navigate to ensure layout re-evaluates auth state
    router.replace("/admin/dashboard");
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Background grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glow accent */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-72 w-[600px] rounded-full bg-[var(--brand)] opacity-10 blur-3xl" />

      <div className="relative w-full max-w-[400px]">
        {/* Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-black/60">
          {/* Logo + branding */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand)] shadow-lg shadow-[var(--brand)]/30">
              <span className="text-[26px] font-serif font-semibold text-white">S</span>
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold tracking-widest text-white uppercase">
                Schedula
              </h1>
              <p className="mt-0.5 text-xs font-medium tracking-[0.2em] text-slate-400 uppercase">
                Admin Portal
              </p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-3">
            <Shield size={15} className="shrink-0 text-[var(--brand)]" />
            <p className="text-xs font-medium text-slate-300">
              Restricted access — authorised administrators only.
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
              <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-400" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div>
              <label
                htmlFor="admin-email"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-400"
              >
                Admin Email
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: "" }));
                  if (error) setError(null);
                }}
                placeholder="ADMIN EMAIL"
                className={`h-11 w-full rounded-lg border bg-slate-800 px-4 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] ${
                  fieldErrors.email ? "border-red-500" : "border-slate-700"
                }`}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="mt-4">
              <label
                htmlFor="admin-password"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-400"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password)
                      setFieldErrors((p) => ({ ...p, password: "" }));
                    if (error) setError(null);
                  }}
                  placeholder="Enter your password"
                  className={`h-11 w-full rounded-lg border bg-slate-800 px-4 pr-12 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] ${
                    fieldErrors.password ? "border-red-500" : "border-slate-700"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              id="admin-login-submit"
              type="submit"
              disabled={isLoading}
              className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)] disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Authenticating…
                </>
              ) : (
                "Sign in to Admin Portal"
              )}
            </button>
          </form>


        </div>

      </div>
    </main>
  );
}
