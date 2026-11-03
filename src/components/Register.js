import React, { useState } from "react";
import api from "../api";
import { Link, useNavigate } from "react-router-dom";

const initialFormData = {
  name: "",
  email: "",
  phone: "",
  address: "",
  password: "",
  confirmPassword: "",
};

const Icon = ({ name, className = "h-5 w-5" }) => {
  const icons = {
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0116 0" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    phone: (
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.8 19.8 0 012.12 4.2 2 2 0 014.11 2h3a2 2 0 012 1.72c.12.96.36 1.9.7 2.8a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.9.34 1.84.58 2.8.7a2 2 0 011.73 2.03z" />
    ),
    pin: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1116 0z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 118 0v3" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    eyeOff: (
      <>
        <path d="m3 3 18 18M10.6 10.6a2 2 0 002.8 2.8" />
        <path d="M9.9 5.2A10.8 10.8 0 0112 5c6.5 0 10 7 10 7a15 15 0 01-3.1 4.1M6.2 6.2C3.4 8 2 12 2 12s3.5 7 10 7c1.5 0 2.8-.4 4-1" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    back: <path d="m15 18-6-6 6-6" />,
    alert: (
      <>
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <path d="M10.3 3.9 1.8 18.5a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
      </>
    ),
    shield: (
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" />
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
};

const inputClass =
  "h-12 w-full rounded-xl border border-white/[0.09] bg-[#101511] px-4 text-sm text-gray-100 outline-none transition placeholder:text-gray-600 hover:border-white/[0.15] focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-400/[0.07] disabled:cursor-not-allowed disabled:opacity-50";

const FieldLabel = ({ htmlFor, children }) => (
  <label
    htmlFor={htmlFor}
    className="mb-2 block text-sm font-medium text-gray-300"
  >
    {children}
  </label>
);

const PasswordField = ({
  id,
  label,
  name,
  value,
  onChange,
  showPassword,
  onToggle,
  placeholder,
  disabled,
  autoComplete,
}) => (
  <div>
    <FieldLabel htmlFor={id}>{label}</FieldLabel>

    <div className="relative">
      <Icon
        name="lock"
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
      />

      <input
        id={id}
        name={name}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        required
        className={`${inputClass} pl-11 pr-12`}
      />

      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-label={showPassword ? "Hide password" : "Show password"}
        aria-pressed={showPassword}
        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 transition hover:bg-white/[0.05] hover:text-emerald-400 disabled:opacity-40"
      >
        <Icon
          name={showPassword ? "eyeOff" : "eye"}
          className="h-4 w-4"
        />
      </button>
    </div>
  </div>
);

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]:
        name === "phone"
          ? value.replace(/\D/g, "").slice(0, 10)
          : value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const {
      name,
      email,
      phone,
      address,
      password,
      confirmPassword,
    } = formData;

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanAddress = address.trim();

    if (!cleanName) {
      setError("Please enter your full name.");
      return;
    }

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!/^[0-9]{10}$/.test(cleanPhone)) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    if (!cleanAddress) {
      setError("Please enter your address.");
      return;
    }

    if (password.length < 6) {
      setError("Your password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      // Do not accept a role from the registration form.
      // The backend should assign the default role securely.
      const response = await api.post("/add-user", {
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        address: cleanAddress,
        password,
      });

      setSuccess(
        response.data?.message ||
          "Your account has been created successfully."
      );

      setFormData(initialFormData);

      // Keep navigation explicit so the user can read the
      // success message before proceeding to the login page.
      window.setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      console.error(
        "Registration error:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          err.response?.data?.errorMessage ||
          "Unable to create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    {
      number: "01",
      title: "Track every expense",
      description: "Keep all your spending organized.",
    },
    {
      number: "02",
      title: "Understand your money",
      description: "Discover where your money goes.",
    },
    {
      number: "03",
      title: "Build better habits",
      description: "Make smarter financial decisions.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#080b09] px-3 py-4 text-white sm:px-6 sm:py-8">
      <div className="mx-auto grid min-h-[calc(100dvh-32px)] max-w-7xl overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0d110e] shadow-2xl shadow-black/40 sm:min-h-[calc(100dvh-64px)] lg:grid-cols-2">
        {/* Left branding panel */}
        <section className="relative hidden flex-col justify-between overflow-hidden border-r border-white/[0.07] bg-[#0e1711] p-10 lg:flex xl:p-12">
          {/* Decorative glow */}
          <div className="pointer-events-none absolute -right-32 top-28 h-96 w-96 rounded-full border border-emerald-400/[0.08]" />
          <div className="pointer-events-none absolute -right-20 top-40 h-72 w-72 rounded-full border border-emerald-400/[0.07]" />
          <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-emerald-400/[0.05] blur-3xl" />

          <div className="relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400 text-3xl font-bold text-[#07110b] shadow-lg shadow-emerald-400/15">
                ₹
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Expense Tracker
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Personal Finance Manager
                </p>
              </div>
            </div>

            {/* Hero */}
            <div className="mt-16 max-w-lg xl:mt-20">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.05] px-4 py-2 text-xs font-semibold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                YOUR MONEY, YOUR CONTROL
              </div>

              <h2 className="text-5xl font-bold leading-[1.12] tracking-tight xl:text-6xl">
                Start your
                <span className="mt-1 block text-emerald-400">
                  smarter money
                </span>
                journey.
              </h2>

              <p className="mt-6 max-w-md text-base leading-8 text-gray-400">
                Create your account and take control of your expenses.
                A clearer view of your money starts here.
              </p>
            </div>

            {/* Benefits */}
            <div className="mt-12 space-y-5 xl:mt-16">
              {benefits.map((benefit) => (
                <div
                  key={benefit.number}
                  className="flex items-center gap-4"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.025] text-sm font-semibold text-emerald-400">
                    {benefit.number}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-200">
                      {benefit.title}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-10 flex items-center justify-between border-t border-white/[0.07] pt-5">
            <p className="text-xs text-gray-600">
              © 2026 Expense Tracker
            </p>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Icon name="shield" className="h-4 w-4 text-emerald-400" />
              Your finances, organized
            </div>
          </div>
        </section>

        {/* Registration form panel */}
        <section className="flex items-center justify-center px-5 py-8 sm:px-10 sm:py-10 xl:px-14">
          <div className="w-full max-w-lg">
            {/* Mobile logo */}
            <div className="mb-9 flex items-center gap-3 lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400 text-2xl font-bold text-[#07110b]">
                ₹
              </div>

              <div>
                <h1 className="text-lg font-bold">
                  Expense Tracker
                </h1>
                <p className="mt-0.5 text-xs text-gray-500">
                  Personal Finance Manager
                </p>
              </div>
            </div>

            {/* Heading */}
            <div className="mb-7">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
                GET STARTED
              </p>

              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Create your account
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                Enter your details to begin managing your money smarter.
              </p>
            </div>

            {/* Success message */}
            {success && (
              <div
                role="status"
                className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
                  <Icon name="check" className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-emerald-300">
                    Account created
                  </p>
                  <p className="mt-1 text-sm text-emerald-100/70">
                    {success}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Redirecting you to sign in...
                  </p>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-4"
              >
                <Icon
                  name="alert"
                  className="mt-0.5 h-5 w-5 shrink-0 text-red-400"
                />
                <p className="text-sm leading-6 text-red-200">
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <FieldLabel htmlFor="name">Full name</FieldLabel>
                <div className="relative">
                  <Icon
                    name="user"
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                  />
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    maxLength={100}
                    disabled={loading || Boolean(success)}
                    required
                    className={`${inputClass} pl-11`}
                  />
                </div>
              </div>

              {/* Email and phone */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="email">Email address</FieldLabel>
                  <div className="relative">
                    <Icon
                      name="mail"
                      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                    />
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      autoComplete="email"
                      maxLength={254}
                      disabled={loading || Boolean(success)}
                      required
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel htmlFor="phone">Phone number</FieldLabel>
                  <div className="relative">
                    <Icon
                      name="phone"
                      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                    />
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="10-digit number"
                      autoComplete="tel-national"
                      inputMode="numeric"
                      maxLength={10}
                      disabled={loading || Boolean(success)}
                      required
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <FieldLabel htmlFor="address">Address</FieldLabel>
                <div className="relative">
                  <Icon
                    name="pin"
                    className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-gray-500"
                  />
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter your address"
                    autoComplete="street-address"
                    rows={2}
                    maxLength={300}
                    disabled={loading || Boolean(success)}
                    required
                    className="w-full resize-y rounded-xl border border-white/[0.09] bg-[#101511] py-3 pl-11 pr-4 text-sm leading-6 text-gray-100 outline-none transition placeholder:text-gray-600 hover:border-white/[0.15] focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-400/[0.07] disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password */}
              <PasswordField
                id="password"
                label="Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                showPassword={showPassword}
                onToggle={() => setShowPassword((value) => !value)}
                placeholder="Create a password"
                autoComplete="new-password"
                disabled={loading || Boolean(success)}
              />

              {/* Password hint */}
              <p className="-mt-3 text-xs text-gray-600">
                Use at least 6 characters.
              </p>

              {/* Confirm password */}
              <PasswordField
                id="confirmPassword"
                label="Confirm password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                showPassword={showConfirmPassword}
                onToggle={() =>
                  setShowConfirmPassword((value) => !value)
                }
                placeholder="Re-enter your password"
                autoComplete="new-password"
                disabled={loading || Boolean(success)}
              />

              {/* Terms / security note */}
              <div className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                <Icon
                  name="shield"
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                />
                <p className="text-xs leading-5 text-gray-500">
                  Your account is created with the standard user role.
                  Never share your password with anyone.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || Boolean(success)}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-emerald-400 px-5 text-sm font-semibold text-[#07110b] shadow-lg shadow-emerald-400/[0.08] transition hover:bg-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#07110b]/30 border-t-[#07110b]" />
                    Creating account...
                  </>
                ) : success ? (
                  <>
                    Account created
                    <Icon name="check" className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Create account
                    <Icon name="arrow" className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Login link */}
            <div className="mt-7 text-center">
              <p className="text-sm text-gray-500">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-emerald-400 transition hover:text-emerald-300"
                >
                  Sign in
                </Link>
              </p>
            </div>

            {/* Footer */}
            <div className="mt-8 border-t border-white/[0.06] pt-5 text-center">
              <p className="text-xs text-gray-600">
                © 2026 Expense Tracker · Manage your money with confidence.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Register;
