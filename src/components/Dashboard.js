
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Dashboard() {
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({
    totalAmount: 0,
    totalTransactions: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [budgetInfo, setBudgetInfo] = useState(null);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [splitSummary, setSplitSummary] = useState({
    youOwe: 0,
    owedToYou: 0,
    loading: true,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [chartMode, setChartMode] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState(null);

  const categories = [
    'Food',
    'Transport',
    'Shopping',
    'Bills',
    'Education',
    'Health',
    'Entertainment',
    'Other',
  ];

  const categoryMeta = {
    Food: {
      icon: '🍔',
      color: '#f97316',
      soft: 'bg-orange-500/10 text-orange-400',
    },
    Transport: {
      icon: '🚗',
      color: '#3b82f6',
      soft: 'bg-blue-500/10 text-blue-400',
    },
    Shopping: {
      icon: '🛍️',
      color: '#8b5cf6',
      soft: 'bg-violet-500/10 text-violet-400',
    },
    Bills: {
      icon: '📄',
      color: '#10b981',
      soft: 'bg-emerald-500/10 text-emerald-400',
    },
    Education: {
      icon: '📚',
      color: '#eab308',
      soft: 'bg-yellow-500/10 text-yellow-400',
    },
    Health: {
      icon: '❤️',
      color: '#ef4444',
      soft: 'bg-red-500/10 text-red-400',
    },
    Entertainment: {
      icon: '🎬',
      color: '#ec4899',
      soft: 'bg-pink-500/10 text-pink-400',
    },
    Other: {
      icon: '📦',
      color: '#94a3b8',
      soft: 'bg-slate-500/10 text-slate-300',
    },
  };

  // ==========================================
  // AUTHENTICATION
  // ==========================================

  const getLoggedInUser = () => {
    try {
      const storedUser = localStorage.getItem('user');

      if (!storedUser) {
        navigate('/login');
        return null;
      }

      const user = JSON.parse(storedUser);

      if (!user.token || !(user.id || user._id)) {
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

  const getAuthConfig = (user) => ({
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
  });

  // ==========================================
  // CALCULATE SUMMARY FROM EXPENSE RECORDS
  // ==========================================

  const updateExpenseSummary = (expenseList) => {
    const totalAmount = expenseList.reduce(
      (total, expense) =>
        total + Number(expense.amount || 0),
      0
    );

    setSummary({
      totalAmount,
      totalTransactions: expenseList.length,
    });
  };

  // ==========================================
  // GET EXPENSES
  // ==========================================

  const getExpenses = async (user) => {
    try {
      const response = await api.get(
        '/expenses',
        getAuthConfig(user)
      );

      const expenseList = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [];

      setExpenses(expenseList);

      // Always calculate total from actual expense records.
      updateExpenseSummary(expenseList);

    } catch (err) {
      console.error(
        'Get expenses error:',
        err.response?.data || err.message
      );

      if (err.response?.status === 401) {
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      setError(
        err.response?.data?.message ||
        'Unable to load expenses.'
      );
    }
  };

  // ==========================================
  // GET MONTHLY BUDGET
  // ==========================================

  const getMonthlyBudget = async (user) => {
    try {
      const now = new Date();

      const month = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, '0')}`;

      const response = await api.get('/budget', {
        ...getAuthConfig(user),
        params: { month },
      });

      setBudgetInfo(response.data?.data || null);

    } catch (err) {
      console.error('Get monthly budget error:', err);
      setBudgetInfo(null);
    }
  };

  // ==========================================
  // GET SHARED EXPENSE SUMMARY
  // ==========================================

  const getSplitSummary = async (user) => {
    try {
      const response = await api.get(
        '/api/shared/expenses',
        getAuthConfig(user)
      );

      const sharedExpenses = Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      const currentUserId = String(user.id || user._id);

      let youOwe = 0;
      let owedToYou = 0;

      sharedExpenses.forEach((expense) => {
        const payerId = String(
          expense.paidBy?._id || expense.paidBy
        );

        (expense.splits || []).forEach((split) => {
          const memberId = String(
            split.userId?._id || split.userId
          );

          const outstanding = Math.max(
            0,
            Number(split.amountOwed || 0) -
              Number(split.settledAmount || 0)
          );

          if (memberId === currentUserId) {
            if (payerId !== currentUserId) {
              youOwe += outstanding;
            }
          } else if (payerId === currentUserId) {
            owedToYou += outstanding;
          }
        });
      });

      setSplitSummary({
        youOwe,
        owedToYou,
        loading: false,
      });

    } catch (err) {
      console.error('Split summary error:', err);

      setSplitSummary({
        youOwe: 0,
        owedToYou: 0,
        loading: false,
      });
    }
  };

  // ==========================================
  // LOAD DASHBOARD
  // ==========================================

  const loadDashboard = async () => {
    const user = getLoggedInUser();

    if (!user) return;

    try {
      setLoading(true);
      setError('');

      await Promise.all([
        getExpenses(user),
        getMonthlyBudget(user),
        getSplitSummary(user),
      ]);

    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Unable to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // AUTOMATIC DASHBOARD REFRESH
  // ==========================================

  useEffect(() => {
    loadDashboard();

    const handleExpenseChange = () => {
      loadDashboard();
    };

    window.addEventListener(
      'expense:created',
      handleExpenseChange
    );

    window.addEventListener(
      'expense:updated',
      handleExpenseChange
    );

    window.addEventListener(
      'expense:deleted',
      handleExpenseChange
    );

    return () => {
      window.removeEventListener(
        'expense:created',
        handleExpenseChange
      );

      window.removeEventListener(
        'expense:updated',
        handleExpenseChange
      );

      window.removeEventListener(
        'expense:deleted',
        handleExpenseChange
      );
    };
  }, []);

  // ==========================================
  // DELETE EXPENSE
  // ==========================================

  const handleDelete = (expense) => {
    setExpenseToDelete(expense);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;

    const user = getLoggedInUser();

    if (!user) return;

    const deletedExpense = expenseToDelete;

    try {
      setDeleting(true);
      setError('');

      await api.delete(
        `/expenses/${deletedExpense._id}`,
        getAuthConfig(user)
      );

      setExpenseToDelete(null);

      // Reload from MongoDB instead of subtracting twice.
      window.dispatchEvent(
        new Event('expense:deleted')
      );

    } catch (err) {
      console.error(
        'Delete expense error:',
        err.response?.data || err.message
      );

      if (err.response?.status === 401) {
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      setError(
        err.response?.data?.message ||
        'Unable to delete expense.'
      );

    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    if (!deleting) {
      setExpenseToDelete(null);
    }
  };

  // ==========================================
  // NAVIGATION
  // ==========================================

  const handleAddExpense = () => {
    navigate('/expenses/add');
  };

  const handleEdit = (id) => {
    navigate(`/expenses/edit/${id}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  // ==========================================
  // FORMATTERS
  // ==========================================

  const formatDate = (date) => {
    if (!date) return '-';

    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatAmount = (amount) =>
    Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // ==========================================
  // CURRENT USER
  // ==========================================

  let currentUser = null;

  try {
    currentUser = JSON.parse(
      localStorage.getItem('user') || 'null'
    );
  } catch {
    currentUser = null;
  }

  // ==========================================
  // TOTAL EXPENSES AND TRANSACTIONS
  // ==========================================

  const totalExpenses = expenses.reduce(
    (total, expense) =>
      total + Number(expense.amount || 0),
    0
  );

  const totalTransactions = expenses.length;

  const averageExpense = totalTransactions > 0
    ? totalExpenses / totalTransactions
    : 0;

  // Keep summary synchronized with the displayed expense list.
  // This prevents a stale summary API response from showing zero.
  const currentSummary = {
    totalAmount: totalExpenses,
    totalTransactions,
  };

  // ==========================================
  // MONTHLY SPENDING
  // ==========================================

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthName = now.toLocaleDateString(
    'en-IN',
    { month: 'long' }
  );

  const currentMonthExpenses = expenses.filter((expense) => {
    const date = new Date(expense.date);

    return (
      !Number.isNaN(date.getTime()) &&
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear
    );
  });

  const monthlySpending = currentMonthExpenses.reduce(
    (total, expense) =>
      total + Number(expense.amount || 0),
    0
  );

  // ==========================================
  // CATEGORY TOTALS
  // ==========================================

  const categoryTotals = categories.map((category) => ({
    category,

    total: expenses
      .filter((expense) => expense.category === category)
      .reduce(
        (sum, expense) =>
          sum + Number(expense.amount || 0),
        0
      ),
  }));

  const activeCategoryTotals = categoryTotals
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);

  const totalCategoryAmount = categoryTotals.reduce(
    (sum, item) => sum + item.total,
    0
  );

  // ==========================================
  // SIX MONTHS SPENDING
  // ==========================================

  const monthlyTotals = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date();

    date.setDate(1);
    date.setMonth(date.getMonth() - i);

    const month = date.getMonth();
    const year = date.getFullYear();

    const total = expenses
      .filter((expense) => {
        const expenseDate = new Date(expense.date);

        return (
          !Number.isNaN(expenseDate.getTime()) &&
          expenseDate.getMonth() === month &&
          expenseDate.getFullYear() === year
        );
      })
      .reduce(
        (sum, expense) =>
          sum + Number(expense.amount || 0),
        0
      );

    monthlyTotals.push({
      label: date.toLocaleDateString(
        'en-IN',
        { month: 'short' }
      ),

      fullLabel: date.toLocaleDateString(
        'en-IN',
        {
          month: 'long',
          year: 'numeric',
        }
      ),

      total,
    });
  }

  const maxMonthlyAmount = Math.max(
    ...monthlyTotals.map((item) => item.total),
    1
  );

  const sixMonthTotal = monthlyTotals.reduce(
    (sum, item) => sum + item.total,
    0
  );

  // Keep your existing JSX return section below this point.

  const filteredExpenses = expenses.filter((expense) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      expense.title?.toLowerCase().includes(search) ||
      expense.description?.toLowerCase().includes(search);

    const matchesCategory =
      categoryFilter === 'All' || expense.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleMonthSelect = (index) => {
    setSelectedMonth((previous) => previous === index ? null : index);
  };

  const selectedMonthData = selectedMonth !== null
    ? monthlyTotals[selectedMonth]
    : null;

  const getCategoryPercentage = (total) =>
    totalCategoryAmount === 0 ? 0 : (total / totalCategoryAmount) * 100;

  const topCategory = activeCategoryTotals.length > 0
    ? activeCategoryTotals[0]
    : null;

  // Rule-based spending insights
  const previousMonthDate = new Date();
  previousMonthDate.setDate(1);
  previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);

  const previousMonth = previousMonthDate.getMonth();
  const previousYear = previousMonthDate.getFullYear();

  const previousMonthExpenses = expenses.filter((expense) => {
    const date = new Date(expense.date);
    return date.getMonth() === previousMonth &&
      date.getFullYear() === previousYear;
  });

  const previousMonthCategoryTotals = categories.map((category) => ({
    category,
    total: previousMonthExpenses
      .filter((expense) => expense.category === category)
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
  }));

  const spendingInsights = categories
    .map((category) => {
      const currentTotal = categoryTotals.find(
        (item) => item.category === category
      )?.total || 0;

      const previousTotal = previousMonthCategoryTotals.find(
        (item) => item.category === category
      )?.total || 0;

      const increase = currentTotal - previousTotal;
      const percentageIncrease = previousTotal > 0
        ? (increase / previousTotal) * 100
        : currentTotal > 0 ? 100 : 0;

      return {
        category,
        currentTotal,
        previousTotal,
        increase,
        percentageIncrease,
        unusual: currentTotal > previousTotal &&
          previousTotal > 0 &&
          percentageIncrease >= 50,
      };
    })
    .filter((item) => item.currentTotal > 0)
    .sort((a, b) => b.currentTotal - a.currentTotal);

  const unusualSpending = spendingInsights.filter((item) => item.unusual);

  const spendingTip = (() => {
    if (expenses.length === 0) {
      return 'Add expenses to receive personalized spending insights.';
    }

    if (unusualSpending.length > 0) {
      const highestIncrease = [...unusualSpending].sort(
        (a, b) => b.percentageIncrease - a.percentageIncrease
      )[0];

      return `${highestIncrease.category} spending has increased by ${highestIncrease.percentageIncrease.toFixed(0)}% compared with last month. Review this category to see where you could save.`;
    }

    if (topCategory) {
      return `${topCategory.category} is your highest-spending category, with ₹${formatAmount(topCategory.total)} recorded. Review these expenses to find potential savings.`;
    }

    return 'Keep recording your expenses to discover your spending patterns.';
  })();

  const donutGradient = (() => {
    if (activeCategoryTotals.length === 0) return '#1b251e';

    let current = 0;
    const segments = activeCategoryTotals.map((item) => {
      const percentage = getCategoryPercentage(item.total);
      const start = current;
      current += percentage;
      return `${categoryMeta[item.category].color} ${start}% ${current}%`;
    });

    return `conic-gradient(${segments.join(', ')})`;
  })();

  return (
    <div className="min-h-screen bg-[#080b09] text-gray-100">
      {/* HEADER */}
      <header className="bg-[#0d120f] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-400 text-[#080b09] rounded-2xl flex items-center justify-center">
                <span className="text-2xl font-bold">₹</span>
              </div>
              <div>
                <p className="text-xs text-emerald-400 font-semibold uppercase tracking-[0.18em]">
                  Personal Finance
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold mt-1">
                  Expense Tracker
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAddExpense}
                className="flex items-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-[#080b09] font-bold px-5 py-3 rounded-xl transition"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
                Add Expense
              </button>

              <button
                type="button"
                onClick={() => navigate('/budget')}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 font-semibold px-4 py-3 rounded-xl transition"
              >
                Monthly Budget
              </button>

              <button
                type="button"
                onClick={() => navigate('/shared-expenses')}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 font-semibold px-4 py-3 rounded-xl transition"
              >
                👥 Split Expenses
              </button>

              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 font-semibold px-4 py-3 rounded-xl transition"
              >
                Profile
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="bg-white/5 hover:bg-red-500/10 border border-white/10 text-gray-300 hover:text-red-300 font-semibold px-4 py-3 rounded-xl transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* WELCOME */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">
            Overview
          </p>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mt-2">
                Welcome back, {currentUser?.name || 'User'}
              </h2>
              <p className="text-gray-400 mt-2">
                Here's a clear view of your spending and financial activity.
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {currentMonthName} {currentYear}
            </div>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 bg-red-500/15 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-red-400 font-bold">!</span>
            </div>
            <div>
              <p className="font-semibold text-red-300">
                Something went wrong
              </p>
              <p className="text-sm text-red-200/80 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* BUDGET ALERTS */}
        {budgetInfo?.budgetSet && Number(budgetInfo.budget) > 0 && (
          <div className="mb-6">
            {Number(budgetInfo.percentageUsed) > 100 ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center text-xl flex-shrink-0">
                    ⚠️
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-red-300 text-lg">
                      Budget exceeded!
                    </p>
                    <p className="text-sm text-gray-300 mt-1">
                      You have spent ₹{formatAmount(budgetInfo.totalSpent)} of
                      your ₹{formatAmount(budgetInfo.budget)} monthly budget.
                      {' '}You are over budget by ₹
                      {formatAmount(Math.max(
                        0,
                        Number(budgetInfo.totalSpent) - Number(budgetInfo.budget)
                      ))}.
                    </p>
                    <div className="mt-4 h-3 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{
                          width: `${Math.min(Number(budgetInfo.percentageUsed) || 0, 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs font-semibold text-red-300 mt-2">
                      {Number(budgetInfo.percentageUsed).toFixed(1)}% of
                      monthly budget used
                    </p>
                  </div>
                </div>
              </div>
            ) : Number(budgetInfo.percentageUsed) >= 80 ? (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center text-xl flex-shrink-0">
                    🔔
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-amber-200 text-lg">
                      Budget warning: spending is getting high
                    </p>
                    <p className="text-sm text-gray-300 mt-1">
                      You have used {Number(budgetInfo.percentageUsed).toFixed(1)}%
                      {' '}of your monthly budget. ₹
                      {formatAmount(Math.max(
                        0,
                        Number(budgetInfo.budget) - Number(budgetInfo.totalSpent)
                      ))} remains for this month.
                    </p>
                    <div className="mt-4 h-3 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{
                          width: `${Math.min(Number(budgetInfo.percentageUsed) || 0, 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs font-semibold text-amber-200 mt-2">
                      Alert triggered at 80% of your budget
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-400/10 border border-emerald-400/20 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-400/15 text-emerald-300 flex items-center justify-center text-xl flex-shrink-0">
                  ✓
                </div>
                <div>
                  <p className="font-bold text-emerald-300">
                    You are within your budget
                  </p>
                  <p className="text-sm text-gray-300 mt-1">
                    ₹{formatAmount(Math.max(
                      0,
                      Number(budgetInfo.budget) - Number(budgetInfo.totalSpent)
                    ))} remains. You have used{' '}
                    {Number(budgetInfo.percentageUsed || 0).toFixed(1)}%
                    {' '}of your monthly budget.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
          <div className="bg-[#101713] border border-white/10 text-white rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-400/10 rounded-full" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 bg-emerald-400 text-[#080b09] rounded-xl flex items-center justify-center">
                  <span className="text-xl font-bold">₹</span>
                </div>
                <span className="text-xs font-semibold text-emerald-300 bg-emerald-400/10 border border-emerald-400/10 px-3 py-1.5 rounded-full">
                  Overall
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-6">Total Expenses</p>
              <h3 className="text-3xl font-bold mt-1">
                ₹{formatAmount(summary.totalAmount)}
              </h3>
              <p className="text-xs text-gray-500 mt-2">
                Across all recorded transactions
              </p>
            </div>
          </div>

          <div className="bg-[#101713] rounded-3xl p-6 border border-white/10 hover:border-emerald-400/20 transition">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 bg-emerald-400/10 text-emerald-300 rounded-xl flex items-center justify-center">
                <span className="text-xl">≡</span>
              </div>
              <span className="text-xs font-semibold text-emerald-300 bg-emerald-400/10 px-3 py-1.5 rounded-full">
                Activity
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-6">Transactions</p>
            <h3 className="text-3xl font-bold mt-1">
              {summary.totalTransactions}
            </h3>
            <p className="text-xs text-gray-500 mt-2">
              Total recorded expenses
            </p>
          </div>

          <div className="bg-[#101713] rounded-3xl p-6 border border-white/10 hover:border-emerald-400/20 transition">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 bg-violet-500/10 text-violet-300 rounded-xl flex items-center justify-center">
                <span className="text-xl">▦</span>
              </div>
              <span className="text-xs font-semibold text-violet-300 bg-violet-500/10 px-3 py-1.5 rounded-full">
                {currentMonthName}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-6">This Month</p>
            <h3 className="text-3xl font-bold mt-1">
              ₹{formatAmount(monthlySpending)}
            </h3>
            <p className="text-xs text-gray-500 mt-2">
              Spending during the current month
            </p>
          </div>

          <div className="bg-[#101713] rounded-3xl p-6 border border-white/10 hover:border-emerald-400/20 transition">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 bg-orange-500/10 text-orange-300 rounded-xl flex items-center justify-center">
                <span className="text-xl">↗</span>
              </div>
              <span className="text-xs font-semibold text-orange-300 bg-orange-500/10 px-3 py-1.5 rounded-full">
                Average
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-6">Average Expense</p>
            <h3 className="text-3xl font-bold mt-1">
              ₹{formatAmount(averageExpense)}
            </h3>
            <p className="text-xs text-gray-500 mt-2">
              Average amount per transaction
            </p>
          </div>
        </div>

        {/* ANALYTICS HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-5">
          <div>
            <p className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">
              Financial Overview
            </p>
            <h2 className="text-3xl font-bold mt-1">Spending Analytics</h2>
            <p className="text-sm text-gray-400 mt-2">
              Understand where your money is going.
            </p>
          </div>

          <div className="bg-[#101713] border border-white/10 rounded-xl p-1.5 flex">
            <button
              type="button"
              onClick={() => {
                setChartMode('monthly');
                setSelectedMonth(null);
              }}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition ${
                chartMode === 'monthly'
                  ? 'bg-emerald-400 text-[#080b09]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setChartMode('category')}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition ${
                chartMode === 'category'
                  ? 'bg-emerald-400 text-[#080b09]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Categories
            </button>
          </div>
        </div>

        {/* ANALYTICS CARD */}
        <div className="bg-[#101713] rounded-3xl border border-white/10 p-6 sm:p-8 mb-8">
          {chartMode === 'monthly' ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-emerald-400/10 text-emerald-300 rounded-xl flex items-center justify-center">
                    <span className="text-xl">▥</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Monthly Spending</h3>
                    <p className="text-sm text-gray-400 mt-1">Last 6 months</p>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    6 Month Total
                  </p>
                  <p className="text-xl font-bold mt-1">
                    ₹{formatAmount(sixMonthTotal)}
                  </p>
                </div>
              </div>

              {selectedMonthData && (
                <div className="mb-6 bg-emerald-400/10 border border-emerald-400/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-xs text-emerald-300 font-bold uppercase tracking-wider">
                      Selected Month
                    </p>
                    <p className="font-bold mt-1">
                      {selectedMonthData.fullLabel}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-emerald-300">
                    ₹{formatAmount(selectedMonthData.total)}
                  </p>
                </div>
              )}

              {sixMonthTotal === 0 ? (
                <div className="h-80 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-3xl mb-4">
                    📊
                  </div>
                  <h3 className="font-bold text-gray-200">
                    No spending data yet
                  </h3>
                  <p className="text-sm text-gray-400 mt-2 max-w-sm">
                    Add expenses to see your monthly spending pattern here.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddExpense}
                    className="mt-5 bg-emerald-400 hover:bg-emerald-300 text-[#080b09] font-semibold px-5 py-2.5 rounded-xl transition"
                  >
                    Add Expense
                  </button>
                </div>
              ) : (
                <div className="h-80">
                  <div className="h-full flex gap-4">
                    <div className="w-16 flex flex-col justify-between pb-10 text-right">
                      <span className="text-xs text-gray-500">
                        ₹{formatAmount(maxMonthlyAmount)}
                      </span>
                      <span className="text-xs text-gray-500">
                        ₹{formatAmount(maxMonthlyAmount * 0.75)}
                      </span>
                      <span className="text-xs text-gray-500">
                        ₹{formatAmount(maxMonthlyAmount * 0.5)}
                      </span>
                      <span className="text-xs text-gray-500">
                        ₹{formatAmount(maxMonthlyAmount * 0.25)}
                      </span>
                      <span className="text-xs text-gray-500">₹0</span>
                    </div>

                    <div className="flex-1 relative">
                      <div className="absolute inset-0 pb-10 flex flex-col justify-between pointer-events-none">
                        <div className="border-t border-white/10" />
                        <div className="border-t border-white/10" />
                        <div className="border-t border-white/10" />
                        <div className="border-t border-white/10" />
                        <div className="border-t border-white/20" />
                      </div>

                      <div className="absolute inset-0 flex items-end justify-around gap-2 pb-10">
                        {monthlyTotals.map((item, index) => {
                          const height = item.total > 0
                            ? Math.max((item.total / maxMonthlyAmount) * 100, 5)
                            : 2;
                          const isSelected = selectedMonth === index;

                          return (
                            <button
                              type="button"
                              key={index}
                              onClick={() => handleMonthSelect(index)}
                              className="group relative h-full flex-1 flex flex-col justify-end items-center focus:outline-none"
                            >
                              <div
                                className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap z-10 transition-all ${
                                  isSelected
                                    ? 'opacity-100'
                                    : 'opacity-0 group-hover:opacity-100'
                                }`}
                                style={{ bottom: `calc(${height}% + 38px)` }}
                              >
                                <div className="bg-[#080b09] border border-white/10 text-white text-xs font-semibold px-3 py-2 rounded-lg">
                                  ₹{formatAmount(item.total)}
                                </div>
                              </div>

                              <div
                                className={`w-full max-w-14 rounded-t-xl transition-all duration-300 ${
                                  isSelected
                                    ? 'bg-emerald-300 shadow-lg shadow-emerald-400/10'
                                    : 'bg-emerald-500/70 group-hover:bg-emerald-400'
                                }`}
                                style={{
                                  height: `${height}%`,
                                  minHeight: item.total > 0 ? '12px' : '4px',
                                }}
                              />
                              <span className={`text-xs font-bold mt-3 ${
                                isSelected ? 'text-emerald-300' : 'text-gray-400'
                              }`}>
                                {item.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-violet-500/10 text-violet-300 rounded-xl flex items-center justify-center">
                    <span className="text-xl">◔</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Category Spending</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Breakdown of your total spending
                    </p>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Total
                  </p>
                  <p className="text-xl font-bold mt-1">
                    ₹{formatAmount(totalCategoryAmount)}
                  </p>
                </div>
              </div>

              {activeCategoryTotals.length === 0 ? (
                <div className="h-80 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-3xl mb-4">
                    🥧
                  </div>
                  <h3 className="font-bold text-gray-200">
                    No category data yet
                  </h3>
                  <p className="text-sm text-gray-400 mt-2 max-w-sm">
                    Add expenses to see how your spending is distributed.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddExpense}
                    className="mt-5 bg-emerald-400 hover:bg-emerald-300 text-[#080b09] font-semibold px-5 py-2.5 rounded-xl transition"
                  >
                    Add Expense
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                  <div className="flex justify-center">
                    <div
                      className="w-56 h-56 sm:w-64 sm:h-64 rounded-full flex items-center justify-center"
                      style={{ background: donutGradient }}
                    >
                      <div className="w-36 h-36 sm:w-40 sm:h-40 bg-[#101713] rounded-full flex flex-col items-center justify-center border border-white/10">
                        <p className="text-xs text-gray-400">Total spent</p>
                        <p className="text-lg sm:text-xl font-bold mt-1">
                          ₹{formatAmount(totalCategoryAmount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {activeCategoryTotals.map((item) => (
                      <div key={item.category}>
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span>{categoryMeta[item.category]?.icon}</span>
                            <span className="text-sm font-semibold">
                              {item.category}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold">
                              ₹{formatAmount(item.total)}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              {getCategoryPercentage(item.total).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${getCategoryPercentage(item.total)}%`,
                              backgroundColor: categoryMeta[item.category]?.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* SHARED EXPENSES */}
        <section className="mb-8 rounded-2xl border border-white/10 bg-[#101713] p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-violet-300">
                SHARED FINANCES
              </p>
              <h2 className="mt-1 text-xl font-bold text-white">
                Split Expenses
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Your outstanding balances with friends and groups.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/shared-expenses')}
              className="rounded-xl bg-violet-500/15 border border-violet-400/20 px-4 py-2.5 font-semibold text-violet-300 transition hover:bg-violet-500/25"
            >
              Manage Splits →
            </button>
          </div>

          {splitSummary.loading ? (
            <p className="py-4 text-sm text-gray-400">
              Loading shared balances...
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-red-500/10 border border-red-500/10 p-4">
                <p className="text-sm font-medium text-red-300">You Owe</p>
                <p className="mt-2 text-2xl font-bold text-red-200">
                  ₹{formatAmount(splitSummary.youOwe)}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-400/10 border border-emerald-400/10 p-4">
                <p className="text-sm font-medium text-emerald-300">
                  Owed to You
                </p>
                <p className="mt-2 text-2xl font-bold text-emerald-200">
                  ₹{formatAmount(splitSummary.owedToYou)}
                </p>
              </div>

              <div className="rounded-xl bg-violet-500/10 border border-violet-400/10 p-4">
                <p className="text-sm font-medium text-violet-300">
                  Net Balance
                </p>
                <p className="mt-2 text-2xl font-bold text-violet-200">
                  ₹{formatAmount(splitSummary.owedToYou - splitSummary.youOwe)}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Positive means you're owed more than you owe.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* SMART SPENDING INSIGHTS */}
        <section className="bg-[#101713] rounded-3xl border border-white/10 p-6 sm:p-7 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <p className="text-sm font-semibold text-violet-300 uppercase tracking-wider">
                Smart Analysis
              </p>
              <h2 className="text-2xl font-bold text-white mt-1">
                Smart Spending Insights
              </h2>
              <p className="text-sm text-gray-400 mt-2">
                Understand your spending patterns and discover potential savings.
              </p>
            </div>

            <div className="self-start bg-violet-500/10 border border-violet-400/10 text-violet-300 rounded-xl px-4 py-2 text-sm font-bold">
              Smart analysis
            </div>
          </div>

          {/* PERSONALIZED TIP */}
          <div className="bg-emerald-400/5 border border-emerald-400/15 rounded-2xl p-4 sm:p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-400/10 text-emerald-300 flex items-center justify-center text-xl flex-shrink-0">
                💡
              </div>
              <div>
                <h3 className="font-bold text-emerald-200">
                  Your Spending Tip
                </h3>
                <p className="text-sm text-gray-300 mt-1 leading-relaxed">
                  {spendingTip}
                </p>
              </div>
            </div>
          </div>

          {/* UNUSUAL SPENDING ALERT */}
          {unusualSpending.length > 0 && (
            <div className="bg-amber-400/5 border border-amber-400/15 rounded-2xl p-4 sm:p-5 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-300 flex items-center justify-center text-xl flex-shrink-0">
                  ⚠️
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-amber-200">
                    Unusual Spending Detected
                  </h3>
                  <p className="text-sm text-gray-300 mt-1">
                    These categories have increased by at least 50% compared
                    with the previous calendar month.
                  </p>

                  <div className="mt-4 space-y-3">
                    {unusualSpending.map((item) => (
                      <div
                        key={item.category}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white/[0.03] border border-white/5 rounded-xl p-3"
                      >
                        <div>
                          <p className="font-bold text-gray-100">
                            {item.category}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Previous month: ₹{formatAmount(item.previousTotal)}
                          </p>
                        </div>

                        <div className="sm:text-right">
                          <p className="font-bold text-amber-300">
                            +{item.percentageIncrease.toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Current: ₹{formatAmount(item.currentTotal)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY ANALYSIS */}
          <div className="mb-4">
            <h3 className="text-lg font-bold text-white">
              Category Spending Analysis
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Your highest-spending categories.
            </p>
          </div>

          {spendingInsights.length === 0 ? (
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 text-center">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-bold text-gray-200">
                No spending insights yet
              </h3>
              <p className="text-sm text-gray-400 mt-2">
                Add expenses to see your category analysis and suggestions.
              </p>
              <button
                type="button"
                onClick={handleAddExpense}
                className="mt-5 bg-emerald-400 hover:bg-emerald-300 text-[#080b09] font-bold px-5 py-3 rounded-xl transition"
              >
                Add Expense
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {spendingInsights.slice(0, 4).map((item, index) => {
                const meta = categoryMeta[item.category] || categoryMeta.Other;

                const percentage = totalCategoryAmount > 0
                  ? (item.currentTotal / totalCategoryAmount) * 100
                  : 0;

                return (
                  <div
                    key={item.category}
                    className="border border-white/10 rounded-2xl p-4 hover:border-emerald-400/20 transition"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${meta.soft}`}>
                          {meta.icon}
                        </div>
                        <div>
                          <p className="font-bold text-gray-100">
                            {item.category}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {percentage.toFixed(1)}% of spending
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-white">
                          ₹{formatAmount(item.currentTotal)}
                        </p>
                        {index === 0 && (
                          <span className="inline-block mt-1 text-xs font-bold text-emerald-300 bg-emerald-400/10 px-2 py-1 rounded-full">
                            Top category
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="h-2 bg-white/5 rounded-full overflow-hidden mt-4">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: meta.color,
                        }}
                      />
                    </div>

                    {item.previousTotal > 0 && (
                      <p className={`text-xs mt-3 font-medium ${
                        item.increase > 0
                          ? 'text-amber-300'
                          : item.increase < 0
                            ? 'text-emerald-300'
                            : 'text-gray-400'
                      }`}>
                        {item.increase > 0
                          ? `₹${formatAmount(item.increase)} more than last month`
                          : item.increase < 0
                            ? `₹${formatAmount(Math.abs(item.increase))} less than last month`
                            : 'Same spending as last month'}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* INSIGHT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* TOP CATEGORY */}
          <button
            type="button"
            onClick={() => {
              if (topCategory) {
                setCategoryFilter(topCategory.category);
                document.getElementById('recent-expenses')?.scrollIntoView({
                  behavior: 'smooth',
                });
              }
            }}
            disabled={!topCategory}
            className="bg-[#101713] rounded-2xl p-5 border border-white/10 text-left hover:border-emerald-400/20 transition disabled:opacity-60"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Top Category
              </span>
              <span className="text-lg">
                {topCategory ? categoryMeta[topCategory.category].icon : '—'}
              </span>
            </div>
            <p className="text-lg font-bold text-white mt-4">
              {topCategory ? topCategory.category : 'No data'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {topCategory
                ? `₹${formatAmount(topCategory.total)} spent`
                : 'Add expenses to see insights'}
            </p>
          </button>

          {/* MONTHLY SPEND */}
          <div className="bg-[#101713] rounded-2xl p-5 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Monthly Spend
              </span>
              <span className="w-8 h-8 bg-emerald-400/10 text-emerald-300 rounded-lg flex items-center justify-center">
                ₹
              </span>
            </div>
            <p className="text-lg font-bold text-white mt-4">
              ₹{formatAmount(monthlySpending)}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Spent in {currentMonthName}
            </p>
          </div>

          {/* SIX-MONTH SPEND */}
          <div className="bg-[#101713] rounded-2xl p-5 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                6 Month Spend
              </span>
              <span className="w-8 h-8 bg-violet-500/10 text-violet-300 rounded-lg flex items-center justify-center">
                ↗
              </span>
            </div>
            <p className="text-lg font-bold text-white mt-4">
              ₹{formatAmount(sixMonthTotal)}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Recent spending history
            </p>
          </div>

          {/* TRANSACTIONS */}
          <div className="bg-[#101713] rounded-2xl p-5 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Transactions
              </span>
              <span className="w-8 h-8 bg-emerald-400/10 text-emerald-300 rounded-lg flex items-center justify-center">
                #
              </span>
            </div>
            <p className="text-lg font-bold text-white mt-4">
              {summary.totalTransactions}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Total expenses recorded
            </p>
          </div>
        </div>

        {/* RECENT EXPENSES */}
        <section
          id="recent-expenses"
          className="bg-[#101713] rounded-3xl border border-white/10 overflow-hidden"
        >
          {/* TABLE HEADER */}
          <div className="p-6 sm:p-7 border-b border-white/10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>
                <p className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">
                  Transactions
                </p>
                <h2 className="text-2xl font-bold text-white mt-1">
                  Recent Expenses
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Search, review and manage your spending.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddExpense}
                className="self-start lg:self-auto flex items-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-[#080b09] font-bold px-5 py-3 rounded-xl transition"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
                Add Expense
              </button>
            </div>

            {/* SEARCH AND FILTER */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
              <div className="md:col-span-2 relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-4-4" />
                  </svg>
                </div>

                <input
                  type="text"
                  placeholder="Search by expense title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#0b100d] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-gray-100 placeholder-gray-500 outline-none transition focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/10"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#0b100d] border border-white/10 rounded-xl px-4 py-3 text-gray-200 outline-none transition focus:border-emerald-400/50"
              >
                <option value="All">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block w-10 h-10 border-4 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin" />
              <p className="text-gray-400 mt-4 font-medium">
                Loading your expenses...
              </p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            /* EMPTY STATE */
            <div className="py-20 text-center px-6">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-3xl mx-auto">
                🧾
              </div>

              <h3 className="text-xl font-bold text-gray-100 mt-5">
                {expenses.length === 0
                  ? 'No expenses yet'
                  : 'No matching expenses'}
              </h3>

              <p className="text-gray-400 mt-2 mb-6 max-w-md mx-auto">
                {expenses.length === 0
                  ? 'Start tracking your spending by adding your first expense.'
                  : 'Try changing your search or category filter.'}
              </p>

              {expenses.length === 0 && (
                <button
                  type="button"
                  onClick={handleAddExpense}
                  className="bg-emerald-400 hover:bg-emerald-300 text-[#080b09] font-bold px-6 py-3 rounded-xl transition"
                >
                  Add Your First Expense
                </button>
              )}
            </div>
          ) : (
            /* EXPENSE TABLE */
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-white/[0.03]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Expense
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {filteredExpenses.map((expense) => {
                    const meta =
                      categoryMeta[expense.category] || categoryMeta.Other;

                    return (
                      <tr
                        key={expense._id}
                        className="hover:bg-white/[0.025] transition"
                      >
                        {/* EXPENSE */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3 min-w-[220px]">
                            <div
                              className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${meta.soft}`}
                            >
                              {meta.icon}
                            </div>

                            <div>
                              <p className="font-bold text-gray-100">
                                {expense.title}
                              </p>

                              {expense.description && (
                                <p className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                                  {expense.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* AMOUNT */}
                        <td className="px-6 py-5">
                          <span className="font-bold text-white whitespace-nowrap">
                            ₹{formatAmount(expense.amount)}
                          </span>
                        </td>

                        {/* CATEGORY */}
                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${meta.soft}`}
                          >
                            {expense.category}
                          </span>
                        </td>

                        {/* PAYMENT */}
                        <td className="px-6 py-5">
                          <span className="inline-flex px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 text-xs font-semibold whitespace-nowrap">
                            {expense.paymentMethod || '-'}
                          </span>
                        </td>

                        {/* DATE */}
                        <td className="px-6 py-5 text-sm text-gray-400 whitespace-nowrap">
                          {formatDate(expense.date)}
                        </td>

                        {/* ACTIONS */}
                        <td className="px-6 py-5">
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(expense._id)}
                              className="w-9 h-9 rounded-lg bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400 hover:text-[#080b09] flex items-center justify-center transition"
                              title="Edit expense"
                            >
                              <svg
                                width="17"
                                height="17"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.1 2.1 0 013 3L8 18l-4 1 1-4L16.5 3.5z" />
                              </svg>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(expense)}
                              className="w-9 h-9 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500 hover:text-white flex items-center justify-center transition"
                              title="Delete expense"
                            >
                              <svg
                                width="17"
                                height="17"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M3 6h18" />
                                <path d="M8 6V4h8v2" />
                                <path d="M19 6l-1 15H6L5 6" />
                                <path d="M10 11v6" />
                                <path d="M14 11v6" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* RESULTS COUNT */}
          {!loading && filteredExpenses.length > 0 && (
            <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] text-sm text-gray-400">
              Showing{' '}
              <span className="font-bold text-gray-200">
                {filteredExpenses.length}
              </span>{' '}
              of{' '}
              <span className="font-bold text-gray-200">
                {expenses.length}
              </span>{' '}
              expenses
            </div>
          )}
        </section>
      </main>

      {/* DELETE CONFIRMATION MODAL */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* OVERLAY */}
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={cancelDelete}
          />

          {/* MODAL */}
          <div className="relative w-full max-w-md bg-[#101713] border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-7">
            {/* CLOSE */}
            <button
              type="button"
              onClick={cancelDelete}
              disabled={deleting}
              className="absolute top-5 right-5 w-9 h-9 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white flex items-center justify-center transition disabled:opacity-50"
              aria-label="Close delete confirmation"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </svg>
            </button>

            {/* DELETE ICON */}
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M19 6l-1 15H6L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
              </svg>
            </div>

            {/* HEADING */}
            <div className="mt-5">
              <h2 className="text-2xl font-bold text-white">
                Delete Expense?
              </h2>
              <p className="text-gray-400 mt-2 leading-relaxed">
                Are you sure you want to delete this expense? This action
                cannot be undone.
              </p>
            </div>

            {/* EXPENSE DETAILS */}
            <div className="mt-6 bg-white/[0.03] rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-gray-100 truncate">
                    {expenseToDelete.title}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {expenseToDelete.category}
                  </p>
                </div>
                <p className="font-bold text-red-300 whitespace-nowrap">
                  ₹{formatAmount(expenseToDelete.amount)}
                </p>
              </div>
            </div>

            {/* BUTTONS */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
              <button
                type="button"
                onClick={cancelDelete}
                disabled={deleting}
                className="flex-1 px-4 py-3.5 rounded-xl border border-white/10 text-gray-300 font-bold hover:bg-white/5 transition disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-3.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="M19 6l-1 15H6L5 6" />
                    </svg>
                    Delete Expense
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING CHATBOT BUTTON */}
      <button
        type="button"
        onClick={() => navigate('/chatbot')}
        aria-label="Open chatbot"
        title="Chat with AI"
        className="fixed bottom-6 right-6 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400 text-3xl text-[#080b09] shadow-xl transition hover:scale-110 hover:bg-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-400/30"
      >
        ✦
      </button>
    </div>
  );
}

export default Dashboard;
