
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import api from '../api';

const COLORS = [
  '#818cf8',
  '#34d399',
  '#fbbf24',
  '#f472b6',
  '#38bdf8',
  '#c084fc',
  '#fb923c',
  '#a3e635',
];

const money = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatDate = (value) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState({
    totalExpenses: 0,
    totalExpenseAmount: 0,
  });
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  });

  const loadUserDetails = useCallback(async () => {
    const storedUser = localStorage.getItem('user');

    if (!storedUser) {
      navigate('/login', { replace: true });
      return;
    }

    let admin;

    try {
      admin = JSON.parse(storedUser);
    } catch {
      localStorage.removeItem('user');
      navigate('/login', { replace: true });
      return;
    }

    if (!admin.token || admin.role !== 'admin' || !admin.id) {
      localStorage.removeItem('user');
      navigate('/login', { replace: true });
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await api.get(
        `/admin/users/${id}?page=${page}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${admin.token}`,
          },
        }
      );

      const data = response.data?.data;

      if (!data?.user) {
        throw new Error('User details were not returned by the server.');
      }

      setUser(data.user);
      setSummary(
        data.summary || {
          totalExpenses: 0,
          totalExpenseAmount: 0,
        }
      );
      setCategories(data.categoryBreakdown || []);
      setExpenses(data.expenses || []);
      setPagination(
        data.pagination || {
          total: 0,
          totalPages: 1,
        }
      );
    } catch (err) {
      console.error('Load user details error:', err);

      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        localStorage.removeItem('user');
        navigate('/login', { replace: true });
        return;
      }

      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to load this user.'
      );
    } finally {
      setLoading(false);
    }
  }, [id, page, navigate]);

  useEffect(() => {
    loadUserDetails();
  }, [loadUserDetails]);

  const filteredExpenses = useMemo(() => {
    const query = search.toLowerCase().trim();

    return expenses.filter((expense) => {
      const matchesCategory =
        categoryFilter === 'All' ||
        expense.category === categoryFilter;

      const matchesSearch = [
        expense.title,
        expense.category,
        expense.paymentMethod,
        expense.description,
      ].some((value) =>
        String(value || '').toLowerCase().includes(query)
      );

      return matchesCategory && matchesSearch;
    });
  }, [expenses, search, categoryFilter]);

  const exportCSV = () => {
    if (!filteredExpenses.length) {
      setError('There are no expenses on this page to export.');
      return;
    }

    const headers = [
      'Title',
      'Category',
      'Amount',
      'Date',
      'Payment Method',
      'Description',
    ];

    const escapeCSV = (value) =>
      `"${String(value ?? '').replace(/"/g, '""')}"`;

    const csv = [
      headers,
      ...filteredExpenses.map((expense) => [
        expense.title,
        expense.category,
        expense.amount,
        expense.date,
        expense.paymentMethod,
        expense.description || '',
      ]),
    ]
      .map((row) => row.map(escapeCSV).join(','))
      .join('\r\n');

    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `user-expenses-${id}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080d18] text-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-400/20 border-t-indigo-400" />
          <p className="mt-4 text-sm text-slate-400">
            Loading user details...
          </p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080d18] p-5 text-white">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111827] p-7">
          <h2 className="text-xl font-bold">Unable to load user</h2>
          <p className="mt-3 text-sm text-rose-300">{error}</p>
          <button
            onClick={() => navigate('/admin')}
            className="mt-6 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-400"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080d18] text-slate-200">
      <header className="border-b border-white/[0.08] bg-[#080d18]/90">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">
              ExpenseFlow / Administration
            </p>
            <h1 className="mt-2 text-2xl font-bold text-white">
              User details
            </h1>
          </div>

          <button
            onClick={() => navigate('/admin')}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/[0.08]"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-6 lg:py-9">
        {error && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            <span>{error}</span>
            <button onClick={() => setError('')} aria-label="Close error">
              ×
            </button>
          </div>
        )}

        {/* Profile */}
        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111827]">
          <div className="h-28 bg-gradient-to-r from-indigo-600/60 via-violet-600/30 to-sky-500/20" />

          <div className="px-5 pb-6 sm:px-7">
            <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end">
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.name || 'User profile'}
                  className="h-20 w-20 rounded-2xl border-4 border-[#111827] object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-[#111827] bg-indigo-500/20 text-3xl font-bold text-indigo-200">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}

              <div className="min-w-0 flex-1 pb-1">
                <h2 className="break-words text-2xl font-bold text-white">
                  {user?.name || 'Unnamed user'}
                </h2>
                <p className="mt-1 break-all text-sm text-slate-400">
                  {user?.email || 'No email'}
                </p>
              </div>

              <span
                className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${
                  user?.role === 'admin'
                    ? 'bg-violet-400/10 text-violet-300'
                    : 'bg-emerald-400/10 text-emerald-300'
                }`}
              >
                {user?.role || 'user'}
              </span>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-4 border-t border-white/[0.07] pt-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-slate-500">Phone</p>
                <p className="mt-2 break-words text-sm font-medium text-white">
                  {user?.phone || 'Not provided'}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Address</p>
                <p className="mt-2 break-words text-sm font-medium text-white">
                  {user?.address || 'Not provided'}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Joined</p>
                <p className="mt-2 text-sm font-medium text-white">
                  {formatDate(user?.createdAt)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">User ID</p>
                <p className="mt-2 break-all font-mono text-xs text-slate-300">
                  {user?._id}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-5">
            <p className="text-sm text-slate-400">Total spending</p>
            <p className="mt-3 break-words text-3xl font-bold text-white">
              {money(summary.totalExpenseAmount)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              All recorded expenses for this user
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-5">
            <p className="text-sm text-slate-400">Total transactions</p>
            <p className="mt-3 text-3xl font-bold text-white">
              {Number(summary.totalExpenses || 0).toLocaleString('en-IN')}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Total expense entries
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-5">
            <p className="text-sm text-slate-400">Average transaction</p>
            <p className="mt-3 break-words text-3xl font-bold text-white">
              {money(
                Number(summary.totalExpenses)
                  ? Number(summary.totalExpenseAmount) /
                      Number(summary.totalExpenses)
                  : 0
              )}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Average amount per expense
            </p>
          </div>
        </div>

        {/* Categories */}
        <section className="rounded-2xl border border-white/[0.08] bg-[#111827]">
          <div className="border-b border-white/[0.07] px-5 py-5">
            <h3 className="font-semibold text-white">Spending by category</h3>
            <p className="mt-1 text-sm text-slate-500">
              Breakdown of this user's total recorded spending
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
            {categories.length ? (
              <>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categories}
                        dataKey="total"
                        nameKey="category"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={4}
                        stroke="none"
                      >
                        {categories.map((item, index) => (
                          <Cell
                            key={`${item.category}-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => money(value)}
                        contentStyle={{
                          background: '#111827',
                          border: '1px solid #334155',
                          borderRadius: 12,
                          color: '#fff',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex flex-col justify-center gap-4">
                  {categories.map((item, index) => (
                    <div
                      key={item.category || index}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{
                            background: COLORS[index % COLORS.length],
                          }}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">
                            {item.category || 'Other'}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.count || 0} transaction(s)
                          </p>
                        </div>
                      </div>

                      <p className="shrink-0 text-sm font-semibold text-white">
                        {money(item.total)}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="py-12 text-center text-sm text-slate-500 md:col-span-2">
                This user has no expense records yet.
              </p>
            )}
          </div>
        </section>

        {/* Expense history */}
        <section className="rounded-2xl border border-white/[0.08] bg-[#111827]">
          <div className="flex flex-col justify-between gap-4 border-b border-white/[0.07] px-5 py-5 lg:flex-row lg:items-center">
            <div>
              <h3 className="font-semibold text-white">Expense history</h3>
              <p className="mt-1 text-sm text-slate-500">
                {pagination.total || 0} total recorded transaction(s)
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-indigo-400/60"
              >
                <option value="All">All categories</option>
                {[
                  'Food',
                  'Transport',
                  'Shopping',
                  'Bills',
                  'Education',
                  'Health',
                  'Entertainment',
                  'Other',
                ].map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search expenses..."
                className="rounded-xl border border-white/10 bg-[#0b1220] px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-400/60"
              />

              <button
                onClick={exportCSV}
                className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400"
              >
                ↓ Export CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.07] text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4 font-medium">Expense</th>
                  <th className="px-5 py-4 font-medium">Category</th>
                  <th className="px-5 py-4 font-medium">Payment method</th>
                  <th className="px-5 py-4 font-medium">Date</th>
                  <th className="px-5 py-4 text-right font-medium">Amount</th>
                </tr>
              </thead>

              <tbody>
                {filteredExpenses.length ? (
                  filteredExpenses.map((expense) => (
                    <tr
                      key={expense._id}
                      className="border-b border-white/[0.05] hover:bg-white/[0.025]"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-white">
                          {expense.title || 'Untitled expense'}
                        </p>
                        {expense.description && (
                          <p className="mt-1 max-w-56 truncate text-xs text-slate-500">
                            {expense.description}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {expense.category || 'Other'}
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {expense.paymentMethod || '—'}
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-white">
                        {money(expense.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-5 py-12 text-center text-sm text-slate-500"
                    >
                      No expenses match your search or category filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <p className="text-xs text-slate-500">
              Page {page} of {Math.max(1, pagination.totalPages || 1)}
            </p>

            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Previous
              </button>

              <button
                disabled={page >= (pagination.totalPages || 1)}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        </section>

        <div className="pb-4 text-center text-xs text-slate-600">
          ExpenseFlow · Admin user details
        </div>
      </main>
    </div>
  );
}

export default UserDetails;
