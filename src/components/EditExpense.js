import React, { useCallback, useEffect, useState } from "react";
import api from "../api";
import { useNavigate, useParams } from "react-router-dom";
import { validateForm } from "../utils/formValidation";

const categories = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Education",
  "Health",
  "Entertainment",
  "Other",
];

const paymentMethods = [
  "Cash",
  "UPI",
  "Credit Card",
  "Debit Card",
  "Net Banking",
  "Other",
];

const initialFormData = {
  title: "",
  amount: "",
  category: "Food",
  date: "",
  paymentMethod: "Cash",
  description: "",
};

const Icon = ({ name, className = "h-5 w-5" }) => {
  const paths = {
    back: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        d="M15 19l-7-7 7-7"
      />
    ),
    edit: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          d="M12 20h9"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          d="M16.5 3.5a2.12 2.12 0 013 3L9 17l-4 1 1-4 10.5-10.5z"
        />
      </>
    ),
    receipt: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
        d="M8 4h8l4 4v12l-2-1.5L16 20l-4-1.5L8 20l-2-1.5L4 20V6a2 2 0 012-2h2zm7 0v5h5M8 12h8M8 15.5h5"
      />
    ),
    calendar: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
        d="M8 3v4m8-4v4M4 10h16M5 5h14a1 1 0 011 1v13H4V6a1 1 0 011-1z"
      />
    ),
    check: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="m5 12 4 4L19 6"
      />
    ),
    close: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        d="m6 6 12 12M18 6 6 18"
      />
    ),
    alert: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          d="M12 9v4"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 17h.01"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          d="M10.3 4.5 2.8 18a2 2 0 001.8 3h14.8a2 2 0 001.8-3L13.7 4.5a2 2 0 00-3.4 0z"
        />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" strokeWidth="1.8" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          d="M4 21a8 8 0 0116 0"
        />
      </>
    ),
    wallet: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
        d="M4 6.5A2.5 2.5 0 016.5 4H19v16H6a3 3 0 01-3-3V6.5A2.5 2.5 0 016 4m0 0v2m11 6h.01M3 8h16v4h-3a2 2 0 000 4h3"
      />
    ),
  };

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
};

const FieldLabel = ({ htmlFor, children, optional = false }) => (
  <label
    htmlFor={htmlFor}
    className="mb-2 block text-sm font-medium text-gray-300"
  >
    {children}
    {optional && (
      <span className="ml-2 text-xs font-normal text-gray-600">
        Optional
      </span>
    )}
  </label>
);

const inputClass =
  "h-12 w-full rounded-xl border border-white/[0.09] bg-[#101511] px-4 text-sm text-gray-100 outline-none transition placeholder:text-gray-600 hover:border-white/[0.15] focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-400/[0.07]";

const selectClass =
  "h-12 w-full cursor-pointer rounded-xl border border-white/[0.09] bg-[#101511] px-4 text-sm text-gray-100 outline-none transition hover:border-white/[0.15] focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-400/[0.07]";

function EditExpense() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const getLoggedInUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  };

  const getAuthConfig = (user) => ({
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
  });

  const formatDateForInput = (date) => {
    if (!date) return "";

    // Preserve calendar dates when the backend returns YYYY-MM-DD.
    if (
      typeof date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
      return date;
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "";

    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
    const day = String(parsedDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const loadExpense = useCallback(async () => {
    const user = getLoggedInUser();

    if (!user?.token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/expenses/${id}`,
        getAuthConfig(user)
      );

      const expense = response.data?.data;

      if (!expense) {
        setError("Expense not found. It may have been deleted.");
        return;
      }

      setFormData({
        title: expense.title || "",
        amount: expense.amount ?? "",
        category: expense.category || "Food",
        date: formatDateForInput(expense.date),
        paymentMethod: expense.paymentMethod || "Cash",
        description: expense.description || "",
      });
    } catch (err) {
      console.error("Get expense error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to load this expense. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadExpense();
  }, [loadExpense]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm(event)) return;

    const user = getLoggedInUser();

    if (!user?.token) {
      navigate("/login", { replace: true });
      return;
    }

    const title = formData.title.trim();
    const amount = Number(formData.amount);
    const description = formData.description.trim();

    if (!title) {
      setError("Please enter an expense title.");
      return;
    }

    if (
      formData.amount === "" ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError("Please enter a valid amount greater than ₹0.");
      return;
    }

    if (!formData.date) {
      setError("Please select an expense date.");
      return;
    }

    if (!formData.category || !formData.paymentMethod) {
      setError("Please select a category and payment method.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await api.put(
        `/expenses/${id}`,
        {
          title,
          amount,
          category: formData.category,
          date: formData.date,
          paymentMethod: formData.paymentMethod,
          description,
        },
        getAuthConfig(user)
      );

      navigate("/dashboard");
    } catch (err) {
      console.error("Update expense error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to update expense. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!saving) navigate("/dashboard");
  };

  const user = getLoggedInUser();
  const userName = user?.name || "User";

  return (
    <div className="min-h-screen bg-[#080b09] text-white">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#0b0f0c]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-7 lg:px-10">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex min-w-0 items-center gap-3 text-left"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.09] text-2xl font-bold text-emerald-400">
              ₹
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-base font-bold tracking-tight sm:text-lg">
                Expense Tracker
              </h1>
              <p className="mt-0.5 text-xs text-gray-500">
                Your money, under control.
              </p>
            </div>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.03] px-3 py-2.5 text-xs font-medium text-gray-300 transition hover:border-emerald-400/25 hover:bg-emerald-400/[0.05] hover:text-emerald-300 sm:px-4 sm:text-sm"
            >
              <Icon name="back" className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Back</span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/profile")}
              title="Profile"
              aria-label="Open profile"
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] text-gray-300 transition hover:border-emerald-400/30 hover:text-emerald-300"
            >
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <Icon name="user" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-7 sm:py-10 lg:px-10">
        {/* Breadcrumb */}
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="mb-7 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-emerald-400"
        >
          <Icon name="back" className="h-4 w-4" />
          Back to expenses
        </button>

        {/* Heading */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.05] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400 sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Expense management
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Edit expense<span className="text-emerald-400">.</span>
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500 sm:text-base">
              Update your transaction details and keep your financial
              records accurate.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5 sm:self-auto">
            <Icon name="receipt" className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-gray-400">
              Editing transaction
            </span>
          </div>
        </div>

        {/* Form layout */}
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
          {/* Main form card */}
          <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0d110e] shadow-2xl shadow-black/20">
            <div className="flex items-center gap-4 border-b border-white/[0.07] px-5 py-5 sm:px-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-400">
                <Icon name="edit" className="h-5 w-5" />
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-100">
                  Transaction details
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Make your changes below.
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-8">
              {loading ? (
                <div className="animate-pulse space-y-6">
                  <div className="h-4 w-32 rounded bg-white/[0.06]" />
                  <div className="h-12 rounded-xl bg-white/[0.05]" />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="h-12 rounded-xl bg-white/[0.05]" />
                    <div className="h-12 rounded-xl bg-white/[0.05]" />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="h-12 rounded-xl bg-white/[0.05]" />
                    <div className="h-12 rounded-xl bg-white/[0.05]" />
                  </div>
                  <div className="h-28 rounded-xl bg-white/[0.05]" />
                  <p className="text-sm text-gray-500">
                    Loading expense details...
                  </p>
                </div>
              ) : (
                <>
                  {error && (
                    <div
                      role="alert"
                      className="mb-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-4"
                    >
                      <Icon
                        name="alert"
                        className="mt-0.5 h-5 w-5 shrink-0 text-red-400"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-red-300">
                          Something needs your attention
                        </p>
                        <p className="mt-1 text-sm leading-5 text-red-200/70">
                          {error}
                        </p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} noValidate>
                    {/* Title */}
                    <div className="mb-6">
                      <FieldLabel htmlFor="title">
                        Expense title
                      </FieldLabel>
                      <input
                        id="title"
                        name="title"
                        type="text"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g. Grocery shopping"
                        maxLength={120}
                        required
                        className={inputClass}
                      />
                    </div>

                    {/* Amount and date */}
                    <div className="mb-6 grid gap-5 sm:grid-cols-2">
                      <div>
                        <FieldLabel htmlFor="amount">
                          Amount
                        </FieldLabel>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-emerald-400">
                            ₹
                          </span>
                          <input
                            id="amount"
                            name="amount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={formData.amount}
                            onChange={handleChange}
                            placeholder="0.00"
                            required
                            className={`${inputClass} pl-10`}
                          />
                        </div>
                      </div>

                      <div>
                        <FieldLabel htmlFor="date">
                          Expense date
                        </FieldLabel>
                        <div className="relative">
                          <Icon
                            name="calendar"
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500"
                          />
                          <input
                            id="date"
                            name="date"
                            type="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                            className={`${inputClass} pl-11 [color-scheme:dark]`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Category and payment */}
                    <div className="mb-6 grid gap-5 sm:grid-cols-2">
                      <div>
                        <FieldLabel htmlFor="category">
                          Category
                        </FieldLabel>
                        <select
                          id="category"
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          required
                          className={selectClass}
                        >
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <FieldLabel htmlFor="paymentMethod">
                          Payment method
                        </FieldLabel>
                        <select
                          id="paymentMethod"
                          name="paymentMethod"
                          value={formData.paymentMethod}
                          onChange={handleChange}
                          required
                          className={selectClass}
                        >
                          {paymentMethods.map((method) => (
                            <option key={method} value={method}>
                              {method}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mb-8">
                      <FieldLabel htmlFor="description" optional>
                        Description
                      </FieldLabel>
                      <textarea
                        id="description"
                        name="description"
                        rows={4}
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Add a note about this transaction..."
                        maxLength={1000}
                        className="w-full resize-y rounded-xl border border-white/[0.09] bg-[#101511] px-4 py-3 text-sm leading-6 text-gray-100 outline-none transition placeholder:text-gray-600 hover:border-white/[0.15] focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-400/[0.07]"
                      />
                      <p className="mt-2 text-right text-xs text-gray-600">
                        {formData.description.length}/1000
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-6 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={saving}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.025] px-6 text-sm font-medium text-gray-300 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Icon name="close" className="h-4 w-4" />
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-6 text-sm font-semibold text-[#07110b] shadow-lg shadow-emerald-400/[0.08] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {saving ? (
                          <>
                            <svg
                              className="h-4 w-4 animate-spin"
                              viewBox="0 0 24 24"
                              fill="none"
                              aria-hidden="true"
                            >
                              <circle
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                className="opacity-25"
                              />
                              <path
                                d="M4 12a8 8 0 018-8"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeLinecap="round"
                                className="opacity-90"
                              />
                            </svg>
                            Saving changes...
                          </>
                        ) : (
                          <>
                            <Icon name="check" className="h-4 w-4" />
                            Save changes
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </section>

          {/* Side panel */}
          <aside className="space-y-5">
            <div className="relative overflow-hidden rounded-3xl border border-emerald-400/15 bg-gradient-to-br from-[#112019] via-[#0d1510] to-[#0d110e] p-6">
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-400/[0.06] blur-3xl" />

              <div className="relative">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.09] text-emerald-400">
                  <Icon name="receipt" className="h-6 w-6" />
                </div>

                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
                  Keep it accurate
                </p>

                <h3 className="mt-3 text-xl font-bold leading-7 text-white">
                  Every detail counts.
                </h3>

                <p className="mt-3 text-sm leading-6 text-gray-400">
                  Accurate records make it easier to understand your
                  spending patterns and plan your budget.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/[0.07] bg-[#0d110e] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-gray-300">
                  <Icon name="user" className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-gray-500">
                    Editing as
                  </p>
                  <p className="truncate text-sm font-semibold text-gray-100">
                    {userName}
                  </p>
                </div>
              </div>

              <div className="my-5 border-t border-white/[0.07]" />

              <div className="flex items-start gap-3">
                <Icon
                  name="wallet"
                  className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400"
                />
                <div>
                  <p className="text-sm font-medium text-gray-200">
                    Your records stay organized
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Review the title, amount, date, and payment method
                    before saving.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 px-2 py-1">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
              <p className="text-xs leading-5 text-gray-600">
                Your changes are saved to your account when you select
                Save changes.
              </p>
            </div>
          </aside>
        </div>

        <footer className="mt-10 border-t border-white/[0.06] py-5 text-center text-xs text-gray-600">
          Expense Tracker · Take control of your spending.
        </footer>
      </main>
    </div>
  );
}

export default EditExpense;
