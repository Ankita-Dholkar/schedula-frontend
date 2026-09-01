"use client";

import { login } from "@/features/auth/api/login";
import { FormEvent, useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import Toast from "@/features/auth/components/Toast";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailOrMobile, setEmailOrMobile] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ emailOrMobile: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Pre-fill email if user was redirected here from the signup page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");
    if (email) setEmailOrMobile(decodeURIComponent(email));
  }, []);

  const validateEmailOrMobile = (value: string) => {
    if (!value.trim()) return "Mobile number or email is required";
    if (value.includes("@")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return "Please enter a valid email address";
    } else {
      const mobileRegex = /^[0-9]{10}$/;
      if (!mobileRegex.test(value)) return "Please enter a valid 10-digit mobile number";
    }
    return "";
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const emailOrMobileError = validateEmailOrMobile(emailOrMobile);
    const passwordError = !password.trim() ? "Password is required" : "";

    setErrors({ emailOrMobile: emailOrMobileError, password: passwordError });
    if (emailOrMobileError || passwordError) return;

    setIsLoading(true);
    try {
      const user = await login({ emailOrMobile, password });
      localStorage.setItem("loggedInUser", JSON.stringify(user));

      setToast({
        message: `Welcome back, ${user.name}! Redirecting you now...`,
        type: "success",
      });

      setTimeout(() => {
        if (user.role === "doctor") {
          window.location.href = "/doctor/dashboard";
        } else {
          window.location.href = "/user/doctors";
        }
      }, 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed. Please try again.";
      setErrors((prev) => ({ ...prev, password: message }));
      setToast({ message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--canvas)] px-4 pb-8 pt-10 sm:px-6 sm:pt-12 lg:flex lg:items-center lg:justify-center lg:px-8 lg:py-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="w-full max-w-[420px] rounded-2xl bg-white p-8 shadow-sm border border-[var(--line)]">
        {/* Brand Logo */}
        <div className="mb-10 flex items-center justify-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand)] shadow-sm">
            <span className="text-[25px] font-serif font-semibold text-white">S</span>
          </div>
          <div>
            <h1 className="text-[24px] font-bold tracking-wide text-[var(--ink)]">SCHEDULA</h1>
            <p className="mt-0.5 text-[14px] font-normal text-[var(--muted)]">Clinic Operations</p>
          </div>
        </div>

        <div>
          <h2 className="text-[22px] font-semibold text-[var(--ink)]">Log in</h2>
          <p className="mt-1 text-[14px] text-[var(--muted)]">Welcome back! Please enter your details.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6">
          {/* Email / Mobile */}
          <div>
            <label htmlFor="emailOrMobile" className="mb-2 block text-sm font-medium text-[var(--ink)]">
              Mobile / Email
            </label>
            <input
              id="emailOrMobile"
              type="text"
              value={emailOrMobile}
              onChange={(e) => {
                setEmailOrMobile(e.target.value);
                if (errors.emailOrMobile) setErrors((prev) => ({ ...prev, emailOrMobile: "" }));
              }}
              placeholder="name@example.com or 9876543210"
              className={`h-11 w-full rounded-lg border bg-white px-4 text-sm text-[var(--ink)] outline-none placeholder:text-stone-400 transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] ${
                errors.emailOrMobile ? "border-red-400" : "border-[var(--line)]"
              }`}
            />
            {errors.emailOrMobile && (
              <p className="mt-1 text-xs text-red-500">{errors.emailOrMobile}</p>
            )}
          </div>

          {/* Password */}
          <div className="mt-5">
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-[var(--ink)]">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                }}
                placeholder="Enter your password"
                className={`h-11 w-full rounded-lg border bg-white px-4 pr-12 text-sm text-[var(--ink)] outline-none placeholder:text-stone-400 transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] ${
                  errors.password ? "border-red-400" : "border-[var(--line)]"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password}</p>
            )}
          </div>

          {/* Remember Me / Forgot */}
          <div className="mt-4 flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--muted)] hover:text-[var(--ink)]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-[var(--line)] accent-[var(--brand)]"
              />
              <span>Remember Me</span>
            </label>
            <button type="button" className="text-xs font-medium text-[var(--brand)] hover:underline">
              Forgot Password?
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 h-11 w-full rounded-lg bg-[var(--brand)] text-sm font-medium text-white transition hover:bg-[var(--brand-deep)] disabled:opacity-70"
          >
            {isLoading ? "Logging in..." : "Log in"}
          </button>
        </form>



        <div className="mt-6 text-center text-sm text-[var(--muted)]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-[var(--brand)] hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}