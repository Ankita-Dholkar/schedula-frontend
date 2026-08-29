"use client";

import { login } from "@/features/auth/api/login";
import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailOrMobile, setEmailOrMobile] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({
    emailOrMobile: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  // Validate Email or Mobile Number
  const validateEmailOrMobile = (value: string) => {
    if (!value.trim()) {
      return "Mobile number or email is required";
    }

    // Email validation
    if (value.includes("@")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(value)) {
        return "Please enter a valid email address";
      }
    } else {
      // Mobile validation
      const mobileRegex = /^[0-9]{10}$/;

      if (!mobileRegex.test(value)) {
        return "Please enter a valid 10-digit mobile number";
      }
    }

    return "";
  };

  // Form Submit
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const emailOrMobileError = validateEmailOrMobile(emailOrMobile);

    let passwordError = "";

    if (!password.trim()) {
      passwordError = "Password is required";
    }

    setErrors({
      emailOrMobile: emailOrMobileError,
      password: passwordError,
    });

    // Stop if validation fails
    if (emailOrMobileError || passwordError) {
      return;
    }

    setIsLoading(true);

    try {
      const user = await login({
        emailOrMobile,
        password,
      });

      console.log("Logged in user:", user);

      // Store logged-in user details
      localStorage.setItem("loggedInUser", JSON.stringify(user));

      window.location.href = "/doctors";
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        password:
          error instanceof Error
            ? error.message
            : "Login failed. Please try again.",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white px-4 pb-8 pt-10 sm:px-6 sm:pt-12 lg:flex lg:items-center lg:justify-center lg:px-8 lg:py-8">
      <div className="w-full max-w-[420px]">
        {/* Brand Logo */}
        <div className="mb-10 flex items-center justify-center gap-3">
          {/* S Logo */}
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#176B73] shadow-sm">
            <span className="text-[25px] font-serif font-semibold text-white">
              S
            </span>
          </div>

          {/* Brand Name */}
          <div>
            <h1 className="text-[24px] font-bold tracking-wide text-[#252525]">
              SCHEDULA
            </h1>

            <p className="mt-0.5 text-[14px] font-normal text-[#737C8D]">
              Clinic Operations
            </p>
          </div>
        </div>

        {/* Login Heading */}
        <div>
          <h2 className="text-[22px] font-semibold text-black">
            Login
          </h2>

          <p className="mt-1 text-[14px] text-[#737C8D]">
            Welcome back! Please enter your details.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-6">
          {/* Mobile / Email */}
          <div>
            <label
              htmlFor="emailOrMobile"
              className="mb-2 block text-[14px] font-normal text-black"
            >
              Mobile / Email
            </label>

            <input
              id="emailOrMobile"
              name="emailOrMobile"
              type="text"
              value={emailOrMobile}
              onChange={(e) => {
                setEmailOrMobile(e.target.value);

                if (errors.emailOrMobile) {
                  setErrors((prev) => ({
                    ...prev,
                    emailOrMobile: "",
                  }));
                }
              }}
              placeholder="Login with Mobile or Email"
              className={`h-11 w-full rounded-[9px] border bg-white px-4 text-[14px] text-black outline-none placeholder:text-[#C9CBD1] transition focus:border-[#43BCD5] ${
                errors.emailOrMobile
                  ? "border-red-500"
                  : "border-[#D9DDE3]"
              }`}
            />

            {errors.emailOrMobile && (
              <p className="mt-1 text-[12px] text-red-500">
                {errors.emailOrMobile}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="mt-5">
            <label
              htmlFor="password"
              className="mb-2 block text-[14px] font-normal text-black"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);

                  if (errors.password) {
                    setErrors((prev) => ({
                      ...prev,
                      password: "",
                    }));
                  }
                }}
                placeholder="Enter your password"
                className={`h-11 w-full rounded-[9px] border bg-white px-4 pr-12 text-[14px] text-black outline-none placeholder:text-[#C9CBD1] transition focus:border-[#43BCD5] ${
                  errors.password
                    ? "border-red-500"
                    : "border-[#D9DDE3]"
                }`}
              />

              {/* Password Toggle */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-[#7B8494]"
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={18} className="shrink-0" />
                ) : (
                  <Eye size={18} className="shrink-0" />
                )}
              </button>
            </div>

            {errors.password && (
              <p className="mt-1 text-[12px] text-red-500">
                {errors.password}
              </p>
            )}
          </div>

          {/* Remember Me / Forgot Password */}
          <div className="mt-4 flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-[12px] text-[#737C8D]">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-[#C9CED6] accent-[#43BCD5]"
              />

              <span>Remember Me</span>
            </label>

            <button
              type="button"
              className="text-[12px] font-normal text-[#FF4B55]"
            >
              Forgot Password?
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-5 h-11 w-full rounded-[9px] bg-[#43BCD5] text-[14px] font-medium text-white transition hover:bg-[#36B1CB] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>

          {/* Divider */}
          <div className="mt-6 flex items-center gap-2">
            <div className="h-px flex-1 bg-[#D9DDE3]" />

            <span className="whitespace-nowrap px-1 text-[12px] text-[#7B8494]">
              Or login with
            </span>

            <div className="h-px flex-1 bg-[#D9DDE3]" />
          </div>

          {/* Google Login */}
          <button
            type="button"
            className="mt-5 flex h-11 w-full items-center justify-center gap-3 rounded-[9px] border border-[#D9DDE3] bg-white text-[14px] font-medium text-black transition hover:bg-gray-50"
          >
            <span className="text-[18px] font-bold text-[#4285F4]">
              G
            </span>

            Continue with Google
          </button>
        </form>

        {/* Sign Up */}
        <div className="mt-16 flex items-center justify-center gap-2 text-[12px] sm:mt-20">
          <span className="text-[#9AA0A8]">
            Don’t have an account?
          </span>

          <button
            type="button"
            className="font-medium text-[#18AEDA]"
          >
            Sign Up
          </button>
        </div>
      </div>
    </main>
  );
}