
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { validateForm } from '../utils/formValidation';

function MonthlyBudget() {
  const navigate = useNavigate();

  const getCurrentMonth = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, '0')}`;
  };

  const [month, setMonth] = useState(getCurrentMonth);
  const [budgetInput, setBudgetInput] = useState('');
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Authentication
  const getAuthConfig = useCallback(() => {
    const storedUser = localStorage.getItem('user');

    if (!storedUser) {
      navigate('/login');
      return null;
    }

    try {
      const user = JSON.parse(storedUser);

      if (!user.token) {
        localStorage.removeItem('user');
        navigate('/login');
        return null;
      }

      return {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
    } catch (err) {
      console.error('User data error:', err);
      localStorage.removeItem('user');
      navigate('/login');
      return null;
    }
  }, [navigate]);

  // Fetch monthly budget
  const fetchBudget = useCallback(async (selectedMonth) => {
    setLoading(true);
    setError('');

    const config = getAuthConfig();

    if (!config) {
      setLoading(false);
      return false;
    }

    try {
      const response = await api.get('/budget', {
        ...config,
        params: { month: selectedMonth }
      });

      const data = response.data.data;

      setBudgetData(data);
      setBudgetInput(
        data?.budgetSet ? String(data.budget) : ''
      );

      return true;
    } catch (err) {
      console.error('Fetch budget error:', err);

      setError(
        err.response?.data?.message ||
        'Unable to load monthly budget. Please try again.'
      );

      return false;
    } finally {
      setLoading(false);
    }
  }, [getAuthConfig]);

  // Load budget whenever selected month changes
  useEffect(() => {
    fetchBudget(month);
  }, [month, fetchBudget]);

  // Save or update budget
  const handleSaveBudget = async (event) => {
    event.preventDefault();
    if (!validateForm(event)) return;

    const amount = Number(budgetInput);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Please enter a budget amount greater than zero.');
      setSuccess('');
      return;
    }

    const config = getAuthConfig();

    if (!config) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.put(
        '/budget',
        { month, amount },
        config
      );

      const refreshed = await fetchBudget(month);

      if (refreshed) {
        setSuccess('Monthly budget saved successfully.');
      }
    } catch (err) {
      console.error('Save budget error:', err);

      setError(
        err.response?.data?.message ||
        'Unable to save budget. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Currency formatting
  const formatCurrency = (amount = 0) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(Number(amount) || 0);

  // Month formatting
  const formatMonth = (value) => {
    if (!value) return '';

    const [year, monthNumber] = value.split('-').map(Number);

    return new Date(year, monthNumber - 1, 1).toLocaleDateString(
      'en-IN',
      { month: 'long', year: 'numeric' }
    );
  };

  // Calculations
  const percentageUsed = Number(budgetData?.percentageUsed) || 0;
  const percentage = Math.min(Math.max(percentageUsed, 0), 100);
  const exceeded = Boolean(budgetData?.exceeded);

  const progressColor = exceeded
    ? 'bg-red-400'
    : percentageUsed >= 80
      ? 'bg-amber-400'
      : 'bg-emerald-400';

  const statusLabel = exceeded
    ? 'Budget exceeded'
    : percentageUsed >= 80
      ? 'Approaching limit'
      : 'On track';

  const statusColor = exceeded
    ? 'border-red-400/20 bg-red-400/10 text-red-300'
    : percentageUsed >= 80
      ? 'border-amber-400/20 bg-amber-400/10 text-amber-300'
      : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300';

  return (
    <div className="min-h-screen bg-[#080b09] text-white">

      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#080b09]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 text-xl font-black text-[#07100b]">
              ₹
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                Personal Finance
              </p>
              <h1 className="mt-0.5 text-xl font-bold sm:text-2xl">
                Monthly Budget
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-emerald-400/30 hover:bg-emerald-400/10 hover:text-emerald-300 sm:px-4"
          >
            <svg width="18" height="18" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Dashboard</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">

        {/* INTRODUCTION */}
        <section className="mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Financial planning
          </div>

          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Take control of your{' '}
            <span className="text-emerald-400">spending.</span>
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400 sm:text-base">
            Set a monthly spending limit, track your expenses, and understand
            how your money is being used.
          </p>
        </section>

        {/* MONTH SELECTOR */}
        <section className="mb-6 rounded-3xl border border-white/[0.08] bg-[#101713] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <label htmlFor="budgetMonth"
                className="mb-2 block text-sm font-semibold text-gray-300">
                Select month
              </label>

              <input
                id="budgetMonth"
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                className="h-12 w-full rounded-xl border border-white/10 bg-[#0b100d] px-4 text-white outline-none transition focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10 sm:w-64"
              />
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
              <p className="text-xs text-gray-500">Viewing budget for</p>
              <p className="mt-1 font-semibold text-emerald-300">
                {formatMonth(month)}
              </p>
            </div>
          </div>
        </section>

        {/* ERROR MESSAGE */}
        {error && (
          <div role="alert"
            className="mb-5 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.07] p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-400/10 font-bold text-red-300">
              !
            </span>
            <div>
              <p className="font-semibold text-red-300">
                Something went wrong
              </p>
              <p className="mt-1 text-sm text-red-200/80">{error}</p>
            </div>
          </div>
        )}

        {/* SUCCESS MESSAGE */}
        {success && (
          <div role="status"
            className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
              ✓
            </span>
            <div>
              <p className="font-semibold text-emerald-300">Success</p>
              <p className="mt-1 text-sm text-gray-300">{success}</p>
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {loading ? (
          <section className="rounded-3xl border border-white/[0.08] bg-[#101713] p-12 text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-emerald-400/20 border-t-emerald-400" />
            <p className="mt-4 font-medium text-gray-300">
              Loading budget details...
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Getting your monthly financial summary.
            </p>
          </section>
        ) : (
          <>
            {/* SUMMARY CARDS */}
            <section className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">

              {/* MONTHLY BUDGET */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#101713] p-6 transition hover:border-emerald-400/20">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-400">
                      Monthly budget
                    </p>
                    <p className="mt-3 break-words text-2xl font-bold tracking-tight text-white sm:text-3xl">
                      {formatCurrency(budgetData?.budget)}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                    <svg width="23" height="23" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="5" width="18" height="14" rx="3" />
                      <path d="M3 10h18" />
                    </svg>
                  </div>
                </div>
                <p className="mt-4 text-xs text-gray-500">
                  {budgetData?.budgetSet
                    ? 'Your planned spending limit'
                    : 'Set a budget to start tracking'}
                </p>
              </div>

              {/* TOTAL SPENT */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#101713] p-6 transition hover:border-emerald-400/20">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-400">
                      Total spent
                    </p>
                    <p className="mt-3 break-words text-2xl font-bold tracking-tight text-white sm:text-3xl">
                      {formatCurrency(budgetData?.totalSpent)}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300">
                    <svg width="23" height="23" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="1.8"
                      strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3v18h18" />
                      <path d="m7 14 4-4 4 4 6-7" />
                    </svg>
                  </div>
                </div>
                <p className="mt-4 text-xs text-gray-500">
                  {budgetData?.totalTransactions || 0} transactions this month
                </p>
              </div>

              {/* REMAINING */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#101713] p-6 transition hover:border-emerald-400/20 sm:col-span-2 xl:col-span-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-400">
                      {exceeded ? 'Amount over budget' : 'Remaining balance'}
                    </p>
                    <p className={`mt-3 break-words text-2xl font-bold tracking-tight sm:text-3xl ${
                      exceeded ? 'text-red-300' : 'text-emerald-300'
                    }`}>
                      {formatCurrency(
                        exceeded
                          ? Math.abs(Number(budgetData?.remaining) || 0)
                          : budgetData?.remaining
                      )}
                    </p>
                  </div>
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                    exceeded
                      ? 'bg-red-400/10 text-red-300'
                      : 'bg-emerald-400/10 text-emerald-300'
                  }`}>
                    <svg width="23" height="23" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="1.8"
                      strokeLinecap="round" strokeLinejoin="round">
                      {exceeded ? (
                        <>
                          <path d="M12 3 22 21H2L12 3z" />
                          <path d="M12 9v5" />
                          <path d="M12 17h.01" />
                        </>
                      ) : (
                        <>
                          <path d="m5 12 4 4L19 6" />
                          <circle cx="12" cy="12" r="9" />
                        </>
                      )}
                    </svg>
                  </div>
                </div>
                <p className="mt-4 text-xs text-gray-500">
                  {exceeded
                    ? 'Spending has exceeded your planned limit.'
                    : 'Available within your monthly budget.'}
                </p>
              </div>
            </section>

            {/* SPENDING OVERVIEW */}
            <section className="mb-6 rounded-3xl border border-white/[0.08] bg-[#101713] p-6 sm:p-8">
              <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
                    Monthly analytics
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
                    Spending overview
                  </h2>
                  <p className="mt-1 text-sm text-gray-400">
                    {formatMonth(month)}
                  </p>
                </div>

                <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${statusColor}`}>
                  {budgetData?.budgetSet ? statusLabel : 'No budget set'}
                </span>
              </div>

              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500">Total spent</p>
                  <p className="mt-1 text-lg font-bold text-white">
                    {formatCurrency(budgetData?.totalSpent)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Monthly limit</p>
                  <p className="mt-1 text-lg font-bold text-gray-300">
                    {formatCurrency(budgetData?.budget)}
                  </p>
                </div>
              </div>

              <div className="h-3 w-full overflow-hidden rounded-full bg-white/[0.06]"
                role="progressbar"
                aria-label="Monthly budget used"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percentage}>
                <div className={`h-full rounded-full transition-all duration-700 ${progressColor}`}
                  style={{ width: `${percentage}%` }} />
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-gray-400">
                  {budgetData?.budgetSet
                    ? `${percentageUsed.toFixed(1)}% of your budget used`
                    : 'Set a budget below to track spending.'}
                </p>
                <p className="text-sm font-semibold text-gray-300">
                  {formatCurrency(budgetData?.remaining)} remaining
                </p>
              </div>

              {exceeded && (
                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-400/10 text-red-300">
                    !
                  </span>
                  <div>
                    <p className="font-semibold text-red-300">
                      You've exceeded your budget
                    </p>
                    <p className="mt-1 text-sm leading-5 text-gray-400">
                      Your spending is above your planned limit. Review your
                      expenses and consider reducing non-essential spending.
                    </p>
                  </div>
                </div>
              )}

              {!exceeded && budgetData?.budgetSet && percentageUsed >= 80 && (
                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
                    !
                  </span>
                  <div>
                    <p className="font-semibold text-amber-300">
                      You're approaching your spending limit
                    </p>
                    <p className="mt-1 text-sm leading-5 text-gray-400">
                      Keep an eye on new expenses to stay within your budget.
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* SET OR UPDATE BUDGET */}
            <section className="rounded-3xl border border-white/[0.08] bg-[#101713] p-6 sm:p-8">
              <div className="mb-7 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                  <svg width="23" height="23" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {budgetData?.budgetSet
                      ? 'Update your budget'
                      : 'Set your monthly budget'}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-gray-400">
                    Choose the maximum amount you plan to spend in{' '}
                    <span className="font-semibold text-emerald-300">
                      {formatMonth(month)}
                    </span>.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveBudget} noValidate>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <div className="w-full sm:max-w-md sm:flex-1">
                    <label htmlFor="budgetAmount"
                      className="mb-2 block text-sm font-semibold text-gray-300">
                      Budget amount (₹)
                    </label>

                    <div className="relative">
                      <span className="absolute inset-y-0 left-4 flex items-center text-lg font-bold text-emerald-400">
                        ₹
                      </span>
                      <input
                        id="budgetAmount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        value={budgetInput}
                        onChange={(event) => setBudgetInput(event.target.value)}
                        placeholder="e.g. 20000"
                        className="h-14 w-full rounded-xl border border-white/10 bg-[#0b100d] pl-11 pr-4 text-white outline-none transition placeholder:text-gray-600 focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving || loading}
                    className="flex h-14 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-6 font-bold text-[#07100b] transition hover:bg-emerald-300 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#07100b]/30 border-t-[#07100b]" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24"
                          fill="none" stroke="currentColor" strokeWidth="2.3"
                          strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 5v14" />
                          <path d="M5 12h14" />
                        </svg>
                        {budgetData?.budgetSet ? 'Update budget' : 'Save budget'}
                      </>
                    )}
                  </button>
                </div>

                <p className="mt-4 text-xs leading-5 text-gray-500">
                  Your budget is saved for the selected month. Changing the
                  month lets you manage a separate budget for that period.
                </p>
              </form>
            </section>
          </>
        )}

        {/* FOOTER */}
        <footer className="mt-8 border-t border-white/[0.06] py-6 text-center">
          <p className="text-xs text-gray-500">
            Plan wisely. Spend mindfully. Stay in control.
          </p>
        </footer>
      </main>
    </div>
  );
}

export default MonthlyBudget;
