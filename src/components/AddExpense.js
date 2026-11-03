
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function AddExpense() {
  const navigate = useNavigate();

  const getToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    date: getToday(),
    paymentMethod: 'Cash',
    description: ''
  });

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Expense categories
  const categories = [
    { name: 'Food', icon: '🍽️', description: 'Meals & dining' },
    { name: 'Transport', icon: '🚗', description: 'Travel & fuel' },
    { name: 'Shopping', icon: '🛍️', description: 'Personal purchases' },
    { name: 'Bills', icon: '🧾', description: 'Monthly bills' },
    { name: 'Education', icon: '🎓', description: 'Learning & courses' },
    { name: 'Health', icon: '💚', description: 'Medical & wellness' },
    { name: 'Entertainment', icon: '🎬', description: 'Fun & activities' },
    { name: 'Other', icon: '✳️', description: 'Other expenses' }
  ];

  // Payment methods
  const paymentMethods = [
    'Cash',
    'UPI',
    'Credit Card',
    'Debit Card',
    'Net Banking',
    'Other'
  ];

  // Get logged-in user
  const getLoggedInUser = () => {
    try {
      const storedUser = localStorage.getItem('user');

      if (!storedUser) {
        navigate('/login');
        return null;
      }

      const user = JSON.parse(storedUser);

      if (!user.token || !user.id) {
        localStorage.removeItem('user');
        navigate('/login');
        return null;
      }

      return user;
    } catch (err) {
      console.error('User data error:', err);
      localStorage.removeItem('user');
      navigate('/login');
      return null;
    }
  };

  // Authorization configuration
  const getAuthConfig = (user) => ({
    headers: {
      Authorization: `Bearer ${user.token}`
    }
  });

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));

    setError('');
  };

  // Select a category
  const handleCategorySelect = (category) => {
    setFormData((previous) => ({
      ...previous,
      category
    }));

    setError('');
  };

  // Save expense
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Please enter an expense title.');
      return;
    }

    if (
      !formData.amount ||
      !Number.isFinite(Number(formData.amount))
    ) {
      setError('Please enter a valid expense amount.');
      return;
    }

    if (Number(formData.amount) <= 0) {
      setError('Expense amount must be greater than zero.');
      return;
    }

    if (!formData.category) {
      setError('Please select an expense category.');
      return;
    }

    if (!formData.date) {
      setError('Please select an expense date.');
      return;
    }

    const user = getLoggedInUser();

    if (!user) return;

    try {
      setSaving(true);

      await api.post(
        '/expenses',
        {
          title: formData.title.trim(),
          amount: Number(formData.amount),
          category: formData.category,
          date: formData.date,
          paymentMethod: formData.paymentMethod,
          description: formData.description.trim()
        },
        getAuthConfig(user)
      );

      navigate('/dashboard');
    } catch (err) {
      console.error('Add expense error:', err);

      if (err.response?.status === 401) {
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      setError(
        err.response?.data?.message ||
        'Unable to add expense. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Display currency in Indian number format
  const formatAmount = (amount) =>
    Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  return (
    <div className="min-h-screen bg-[#080b09] text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#080b09]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 text-xl font-black text-[#07100b] shadow-lg shadow-emerald-400/10">
              ₹
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400">
                Personal Finance
              </p>
              <h1 className="mt-0.5 text-xl font-bold tracking-tight sm:text-2xl">
                Add Expense
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-emerald-400/30 hover:bg-emerald-400/10 hover:text-emerald-300 sm:px-4"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
            <span>Dashboard</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* PAGE INTRO */}
        <div className="mb-8 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Expense management
          </div>

          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Where did your money
            <span className="text-emerald-400"> go?</span>
          </h2>

          <p className="mt-3 text-sm leading-6 text-gray-400 sm:text-base">
            Record your spending, organize your expenses, and stay in control
            of your finances.
          </p>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.07] p-4"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-400/10 text-lg font-bold text-red-300">
              !
            </div>
            <div>
              <p className="font-semibold text-red-300">
                Unable to save expense
              </p>
              <p className="mt-1 text-sm leading-5 text-red-200/80">
                {error}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            {/* LEFT COLUMN */}
            <div className="space-y-6 lg:col-span-2">
              {/* BASIC EXPENSE DETAILS */}
              <section className="rounded-3xl border border-white/[0.08] bg-[#101713] p-5 shadow-xl shadow-black/10 sm:p-7">
                <div className="mb-7 flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                    <svg
                      width="23"
                      height="23"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="5" width="18" height="14" rx="3" />
                      <path d="M12 8v8" />
                      <path d="M15 10.5c0-1.2-1.1-2-3-2s-3 .8-3 2 1.1 1.5 3 1.5 3 .8 3 2-1.1 2-3 2-3-.8-3-2" />
                    </svg>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white sm:text-xl">
                      Expense details
                    </h3>
                    <p className="mt-1 text-sm text-gray-400">
                      Start with the basic information.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* TITLE */}
                  <div>
                    <label
                      htmlFor="title"
                      className="mb-2 block text-sm font-semibold text-gray-300"
                    >
                      Expense title
                      <span className="ml-1 text-emerald-400">*</span>
                    </label>

                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray-500">
                        <svg
                          width="19"
                          height="19"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        >
                          <path d="M4 6h16" />
                          <path d="M4 12h16" />
                          <path d="M4 18h10" />
                        </svg>
                      </div>

                      <input
                        id="title"
                        name="title"
                        type="text"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g. Lunch at a restaurant"
                        maxLength={120}
                        required
                        className="h-14 w-full rounded-xl border border-white/10 bg-[#0b100d] pl-12 pr-4 text-white outline-none transition placeholder:text-gray-600 focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10"
                      />
                    </div>
                  </div>

                  {/* AMOUNT AND DATE */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="amount"
                        className="mb-2 block text-sm font-semibold text-gray-300"
                      >
                        Amount
                        <span className="ml-1 text-emerald-400">*</span>
                      </label>

                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-lg font-bold text-emerald-400">
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
                          className="h-14 w-full rounded-xl border border-white/10 bg-[#0b100d] pl-11 pr-4 text-lg font-semibold text-white outline-none transition placeholder:text-gray-600 focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10"
                        />
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Enter the amount in Indian rupees.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="date"
                        className="mb-2 block text-sm font-semibold text-gray-300"
                      >
                        Expense date
                        <span className="ml-1 text-emerald-400">*</span>
                      </label>

                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray-500">
                          <svg
                            width="19"
                            height="19"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="3" y="5" width="18" height="16" rx="2" />
                            <path d="M16 3v4" />
                            <path d="M8 3v4" />
                            <path d="M3 10h18" />
                          </svg>
                        </div>

                        <input
                          id="date"
                          name="date"
                          type="date"
                          value={formData.date}
                          onChange={handleChange}
                          required
                          className="h-14 w-full min-w-0 rounded-xl border border-white/10 bg-[#0b100d] pl-12 pr-3 text-sm text-white outline-none transition focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* DESCRIPTION */}
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label
                        htmlFor="description"
                        className="text-sm font-semibold text-gray-300"
                      >
                        Description
                      </label>
                      <span className="text-xs text-gray-500">Optional</span>
                    </div>

                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      maxLength={500}
                      placeholder="Add notes about this expense..."
                      className="w-full resize-y rounded-xl border border-white/10 bg-[#0b100d] px-4 py-3.5 text-sm leading-6 text-white outline-none transition placeholder:text-gray-600 focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10"
                    />

                    <p className="mt-2 text-right text-xs text-gray-500">
                      {formData.description.length}/500
                    </p>
                  </div>
                </div>
              </section>
              
              {/* CATEGORY SELECTION */}
              <section className="rounded-3xl border border-white/[0.08] bg-[#101713] p-5 shadow-xl shadow-black/10 sm:p-7">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                    <svg
                      width="23"
                      height="23"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="7" height="7" rx="2" />
                      <rect x="14" y="3" width="7" height="7" rx="2" />
                      <rect x="3" y="14" width="7" height="7" rx="2" />
                      <rect x="14" y="14" width="7" height="7" rx="2" />
                    </svg>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white sm:text-xl">
                      Choose a category
                    </h3>
                    <p className="mt-1 text-sm text-gray-400">
                      Where does this expense belong?
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {categories.map((category) => {
                    const selected = formData.category === category.name;

                    return (
                      <button
                        type="button"
                        key={category.name}
                        aria-pressed={selected}
                        onClick={() =>
                          handleCategorySelect(category.name)
                        }
                        className={`relative flex min-h-[130px] flex-col items-start rounded-2xl border p-4 text-left transition-all duration-200 ${
                          selected
                            ? 'border-emerald-400/60 bg-emerald-400/[0.09] shadow-lg shadow-emerald-950/20'
                            : 'border-white/[0.07] bg-[#0b100d] hover:border-white/20 hover:bg-white/[0.03]'
                        }`}
                      >
                        <span
                          className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-2xl transition ${
                            selected
                              ? 'bg-emerald-400/15'
                              : 'bg-white/[0.04]'
                          }`}
                        >
                          {category.icon}
                        </span>

                        <span
                          className={`text-sm font-bold ${
                            selected ? 'text-emerald-300' : 'text-gray-200'
                          }`}
                        >
                          {category.name}
                        </span>

                        <span className="mt-1 text-[11px] leading-4 text-gray-500">
                          {category.description}
                        </span>

                        {selected && (
                          <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-[#07100b]">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="m5 12 4 4L19 6" />
                            </svg>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6 lg:col-span-1">
              {/* PAYMENT METHOD */}
              <section className="rounded-3xl border border-white/[0.08] bg-[#101713] p-5 shadow-xl shadow-black/10 sm:p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="5" width="18" height="14" rx="3" />
                      <path d="M3 10h18" />
                      <path d="M7 15h3" />
                    </svg>
                  </div>

                  <div>
                    <h3 className="font-bold text-white">
                      Payment method
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      How did you pay?
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {paymentMethods.map((method) => {
                    const selected = formData.paymentMethod === method;

                    return (
                      <button
                        type="button"
                        key={method}
                        aria-pressed={selected}
                        onClick={() =>
                          setFormData((previous) => ({
                            ...previous,
                            paymentMethod: method
                          }))
                        }
                        className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-3 transition ${
                          selected
                            ? 'border-emerald-400/40 bg-emerald-400/[0.08] text-emerald-300'
                            : 'border-white/[0.06] bg-[#0b100d] text-gray-300 hover:border-white/15 hover:bg-white/[0.03]'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${
                              selected
                                ? 'bg-emerald-400/15 text-emerald-300'
                                : 'bg-white/[0.04] text-gray-400'
                            }`}
                          >
                            {method === 'UPI'
                              ? 'UPI'
                              : method === 'Cash'
                                ? '₹'
                                : method === 'Credit Card'
                                  ? 'CC'
                                  : method === 'Debit Card'
                                    ? 'DC'
                                    : method === 'Net Banking'
                                      ? 'NB'
                                      : '•••'}
                          </span>

                          <span className="text-sm font-semibold">
                            {method}
                          </span>
                        </span>

                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                            selected
                              ? 'border-emerald-400 bg-emerald-400 text-[#07100b]'
                              : 'border-gray-600'
                          }`}
                        >
                          {selected && (
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="m5 12 4 4L19 6" />
                            </svg>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
              
              {/* LIVE EXPENSE SUMMARY */}
              <section className="relative overflow-hidden rounded-3xl border border-emerald-400/15 bg-[#101713] p-6 shadow-xl shadow-black/10 sm:p-7">
                {/* DECORATIVE GLOW */}
                <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-emerald-400/[0.07] blur-3xl" />

                <div className="relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 3v18h18" />
                        <path d="m7 14 4-4 4 4 6-7" />
                      </svg>
                    </div>

                    <div>
                      <h3 className="font-bold text-white">
                        Expense preview
                      </h3>
                      <p className="mt-1 text-xs text-gray-500">
                        Review before saving
                      </p>
                    </div>
                  </div>

                  <p className="mt-7 text-sm font-medium text-gray-400">
                    Total amount
                  </p>

                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-semibold text-emerald-400">
                      ₹
                    </span>
                    <span className="break-all text-4xl font-bold tracking-tight text-white sm:text-5xl">
                      {formatAmount(formData.amount)}
                    </span>
                  </div>

                  <div className="my-6 border-t border-white/[0.08]" />

                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-sm text-gray-500">
                        Expense
                      </span>
                      <span className="max-w-[60%] break-words text-right text-sm font-semibold text-gray-200">
                        {formData.title.trim() || 'Not entered yet'}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <span className="text-sm text-gray-500">
                        Category
                      </span>
                      <span className="text-right text-sm font-semibold text-gray-200">
                        {formData.category || 'Not selected'}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <span className="text-sm text-gray-500">
                        Payment
                      </span>
                      <span className="text-right text-sm font-semibold text-gray-200">
                        {formData.paymentMethod}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <span className="text-sm text-gray-500">
                        Date
                      </span>
                      <span className="text-right text-sm font-semibold text-gray-200">
                        {formData.date || 'Not selected'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex items-start gap-2 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.05] p-3">
                    <svg
                      className="mt-0.5 shrink-0 text-emerald-400"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                    <p className="text-xs leading-5 text-gray-400">
                      Check your details before saving your expense.
                    </p>
                  </div>
                </div>
              </section>

              {/* FORM ACTIONS */}
              <section className="rounded-3xl border border-white/[0.08] bg-[#101713] p-5 sm:p-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-emerald-400 px-5 font-bold text-[#07100b] shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-300 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#07100b]/30 border-t-[#07100b]" />
                      Saving expense...
                    </>
                  ) : (
                    <>
                      <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 5v14" />
                        <path d="M5 12h14" />
                      </svg>
                      Save expense
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  disabled={saving}
                  className="mt-3 flex h-12 w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-5 text-sm font-semibold text-gray-300 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <p className="mt-4 text-center text-xs leading-5 text-gray-500">
                  Your expense will be saved to your account.
                </p>
              </section>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default AddExpense;
