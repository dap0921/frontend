
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../api';

const COLORS = [
  '#34d399',
  '#10b981',
  '#6ee7b7',
  '#059669',
  '#a7f3d0',
  '#047857',
  '#2dd4bf',
  '#86efac',
];

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const shortMoney = (value) => {
  const amount = Number(value) || 0;
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
};

const dateText = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
};

const getError = (error, fallback) =>
  error.response?.data?.message || fallback;

function StatCard({ icon, label, value, note, accent }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111a14] p-5 transition duration-200 hover:-translate-y-1 hover:border-emerald-400/25">
      <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full ${accent} opacity-[0.08] blur-2xl`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-3 break-words text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {value}
          </p>
          <p className="mt-2 text-xs text-slate-500">{note}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent} bg-opacity-10 text-xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children, action }) {
  return (
    <section className="min-w-0 rounded-2xl border border-white/[0.08] bg-[#111a14]">
      <div className="flex flex-col justify-between gap-3 border-b border-white/[0.07] px-5 py-5 sm:flex-row sm:items-center">
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex min-h-40 items-center justify-center text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalExpenses: 0,
    totalExpenseAmount: 0,
    currentMonthExpenseAmount: 0,
    currentMonthTransactionCount: 0,
    monthlyExpenses: [],
    categoryBreakdown: [],
    recentExpenses: [],
  });

  const [users, setUsers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [searchExpense, setSearchExpense] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const getConfig = useCallback(
    (token) => ({
      headers: { Authorization: `Bearer ${token}` },
    }),
    []
  );

  const loadAdminDashboard = useCallback(
    async (token, isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        setError('');

        const config = getConfig(token);

        const [statsResponse, usersResponse, expensesResponse] =
          await Promise.all([
            api.get('/admin/stats', config),
            api.get('/admin/users?limit=100', config),
            api.get('/admin/expenses?limit=100', config),
          ]);

        setStats((current) => ({
          ...current,
          ...(statsResponse.data?.data || {}),
        }));

        setUsers(usersResponse.data?.data || []);
        setExpenses(expensesResponse.data?.data || []);
      } catch (err) {
        console.error('Admin dashboard error:', err);

        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }

        setError(getError(err, 'Unable to load dashboard data.'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getConfig, navigate]
  );

  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    if (!storedUser) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);

      if (!parsedUser.token || parsedUser.role !== 'admin') {
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      setUser(parsedUser);
      loadAdminDashboard(parsedUser.token);
    } catch (err) {
      console.error('Admin session error:', err);
      localStorage.removeItem('user');
      navigate('/login');
    }
  }, [navigate, loadAdminDashboard]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const deleteUser = async () => {
    if (!selectedUser || !user?.token) return;

    if (
      String(selectedUser._id) === String(user.id) ||
      String(selectedUser._id) === String(user._id)
    ) {
      setError('You cannot delete your own admin account.');
      setShowDeleteModal(false);
      setSelectedUser(null);
      return;
    }

    try {
      setDeleting(true);
      setError('');

      await api.delete(
        `/admin/users/${selectedUser._id}`,
        getConfig(user.token)
      );

      setUsers((current) =>
        current.filter((item) => item._id !== selectedUser._id)
      );

      setExpenses((current) =>
        current.filter(
          (item) =>
            String(item.userId?._id || item.userId) !==
            String(selectedUser._id)
        )
      );

      setStats((current) => ({
        ...current,
        totalUsers: Math.max(0, Number(current.totalUsers || 0) - 1),
      }));

      setSuccess('User deleted successfully.');
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Delete user error:', err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      setError(getError(err, 'Unable to delete this user.'));
    } finally {
      setDeleting(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const query = searchUser.toLowerCase().trim();

    return users.filter((item) =>
      [
        item.name,
        item.email,
        item.phone,
        item.role,
      ].some((value) => String(value || '').toLowerCase().includes(query))
    );
  }, [users, searchUser]);

  const filteredExpenses = useMemo(() => {
    const query = searchExpense.toLowerCase().trim();

    return expenses.filter((item) => {
      const matchesCategory =
        categoryFilter === 'All' || item.category === categoryFilter;

      const matchesSearch = [
        item.title,
        item.category,
        item.paymentMethod,
        item.userId?.name,
        item.userId?.email,
        item.description,
      ].some((value) => String(value || '').toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [expenses, searchExpense, categoryFilter]);

  const monthlyChartData = useMemo(() => {
    const months = stats.monthlyExpenses || [];

    return months.map((item) => ({
      ...item,
      label: new Date(Number(item.year), Number(item.month) - 1, 1)
        .toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      total: Number(item.total) || 0,
    }));
  }, [stats.monthlyExpenses]);

  const categoryChartData = useMemo(
    () =>
      (stats.categoryBreakdown || []).map((item) => ({
        ...item,
        total: Number(item.total) || 0,
      })),
    [stats.categoryBreakdown]
  );

  const exportExpenses = () => {
    if (!filteredExpenses.length) {
      setError('There are no expenses to export.');
      return;
    }

    const headers = [
      'Title',
      'User',
      'Email',
      'Category',
      'Amount',
      'Date',
      'Payment Method',
      'Description',
    ];

    const rows = filteredExpenses.map((item) => [
      item.title,
      item.userId?.name || 'Unknown',
      item.userId?.email || '',
      item.category,
      item.amount,
      item.date,
      item.paymentMethod,
      item.description || '',
    ]);

    const escapeCSV = (value) =>
      `"${String(value ?? '').replace(/"/g, '""')}"`;

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(','))
      .join('\r\n');

    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'expense-report.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080b09] text-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-emerald-400/20 border-t-emerald-400" />
          <p className="mt-4 text-sm text-slate-400">
            Preparing your admin dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080b09] text-slate-200">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#080b09]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 text-xl font-black text-[#07110b] shadow-lg shadow-emerald-950/40">
              ₹
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                Expense<span className="text-emerald-400">Flow</span>
              </h1>
              <p className="text-xs text-slate-500">Administration console</p>
            </div>

            <span className="ml-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
              Admin
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => user && loadAdminDashboard(user.token, true)}
              disabled={refreshing}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-emerald-400/30 hover:bg-emerald-400/[0.06] disabled:opacity-50"
            >
              {refreshing ? 'Refreshing...' : '↻ Refresh data'}
            </button>

            <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 font-bold text-emerald-300">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>

              <div className="max-w-40">
                <p className="truncate text-sm font-semibold text-white">
                  {user?.name || 'Administrator'}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {user?.email || ''}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20"
            >
              Logout ↗
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-7 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        {/* INTRO */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-400">
              Overview / Analytics
            </p>

            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Dashboard overview
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Monitor platform activity, spending, and registered accounts.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-2 text-xs text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Live database data
          </div>
        </div>

        {error && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              className="text-lg leading-none text-rose-300"
              aria-label="Close error"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <span>{success}</span>
            <button onClick={() => setSuccess('')} aria-label="Close success">
              ×
            </button>
          </div>
        )}

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon="♙"
            label="Total users"
            value={Number(stats.totalUsers || 0).toLocaleString('en-IN')}
            note="Registered accounts"
            accent="text-emerald-300 bg-emerald-400"
          />

          <StatCard
            icon="▤"
            label="Total transactions"
            value={Number(stats.totalExpenses || 0).toLocaleString('en-IN')}
            note="Recorded expense entries"
            accent="text-emerald-300 bg-emerald-400"
          />

          <StatCard
            icon="₹"
            label="Total spending"
            value={money(stats.totalExpenseAmount)}
            note="All-time recorded expenses"
            accent="text-emerald-300 bg-emerald-400"
          />

          <StatCard
            icon="↗"
            label="This month's spending"
            value={money(stats.currentMonthExpenseAmount)}
            note={`${Number(stats.currentMonthTransactionCount || 0)} transactions this month`}
            accent="text-emerald-300 bg-emerald-400"
          />
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <Panel
              title="Spending activity"
              subtitle="Monthly expense totals across the platform"
              action={
                <span className="w-fit rounded-lg bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
                  Monthly
                </span>
              }
            >
              {monthlyChartData.length ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={monthlyChartData}
                      margin={{ top: 12, right: 8, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="spendingFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid stroke="#263b30" strokeDasharray="3 3" vertical={false} />

                      <XAxis
                        dataKey="label"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />

                      <YAxis
                        tickFormatter={shortMoney}
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={65}
                      />

                      <Tooltip
                        contentStyle={{
                          background: '#101511',
                          border: '1px solid #294236',
                          borderRadius: 12,
                          color: '#fff',
                        }}
                        formatter={(value) => [money(value), 'Spending']}
                        labelStyle={{ color: '#cbd5e1' }}
                      />

                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#34d399"
                        strokeWidth={3}
                        fill="url(#spendingFill)"
                        activeDot={{ r: 5, fill: '#6ee7b7' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState message="Monthly analytics will appear when expense data is available." />
              )}
            </Panel>
          </div>

          <Panel
            title="Spending by category"
            subtitle="How recorded expenses are distributed"
          >
            {categoryChartData.length ? (
              <>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        dataKey="total"
                        nameKey="category"
                        innerRadius={58}
                        outerRadius={88}
                        paddingAngle={4}
                        stroke="none"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell
                            key={`${entry.category}-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>

                      <Tooltip
                        formatter={(value) => money(value)}
                        contentStyle={{
                          background: '#101511',
                          border: '1px solid #294236',
                          borderRadius: 12,
                          color: '#fff',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-2 space-y-3">
                  {categoryChartData.map((item, index) => (
                    <div
                      key={item.category}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: COLORS[index % COLORS.length] }}
                        />
                        <span className="truncate text-slate-400">
                          {item.category}
                        </span>
                      </div>

                      <span className="shrink-0 font-semibold text-white">
                        {money(item.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState message="No category data available yet." />
            )}
          </Panel>
        </div>

        {/* CATEGORY COMPARISON */}
        <Panel
          title="Category comparison"
          subtitle="Compare the total amount spent in each category"
        >
          {categoryChartData.length ? (
            <div className="h-[290px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryChartData}
                  margin={{ top: 12, right: 8, left: 0, bottom: 10 }}
                >
                  <CartesianGrid stroke="#263b30" strokeDasharray="3 3" vertical={false} />

                  <XAxis
                    dataKey="category"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tickFormatter={shortMoney}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={65}
                  />

                  <Tooltip
                    formatter={(value) => [money(value), 'Total']}
                    contentStyle={{
                      background: '#101511',
                      border: '1px solid #294236',
                      borderRadius: 12,
                      color: '#fff',
                    }}
                  />

                  <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                    {categoryChartData.map((entry, index) => (
                      <Cell
                        key={`${entry.category}-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="No category data available yet." />
          )}
        </Panel>

        {/* USER MANAGEMENT */}
        <Panel
          title="User management"
          subtitle={`${filteredUsers.length} user(s) shown from the loaded records`}
          action={
            <input
              type="search"
              value={searchUser}
              onChange={(event) => setSearchUser(event.target.value)}
              placeholder="Search name, email, phone..."
              className="w-full rounded-xl border border-white/10 bg-[#101511] px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-400/60 sm:w-72"
            />
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.07] text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-3 font-medium">User</th>
                  <th className="px-3 py-3 font-medium">Contact</th>
                  <th className="px-3 py-3 font-medium">Role</th>
                  <th className="px-3 py-3 font-medium">Joined</th>
                  <th className="px-3 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.length ? (
                  filteredUsers.map((item) => (
                    <tr
                      key={item._id}
                      className="border-b border-white/[0.05] transition hover:bg-emerald-400/[0.025]"
                    >
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-3">
                          {item.profileImage ? (
                            <img
                              src={item.profileImage}
                              alt=""
                              className="h-10 w-10 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 font-bold text-emerald-300">
                              {item.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                          )}

                          <div>
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/users/${item._id}`)}
                              className="text-left font-semibold text-white transition hover:text-emerald-300"
                            >
                              {item.name || 'Unnamed user'}
                            </button>

                            <p className="mt-1 text-xs text-slate-500">
                              {String(item._id || '').slice(-8)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-4">
                        <p className="text-slate-300">{item.email}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.phone || 'No phone added'}
                        </p>
                      </td>

                      <td className="px-3 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.role === 'admin'
                              ? 'bg-emerald-400/10 text-emerald-300'
                              : 'bg-white/[0.05] text-slate-400'
                          }`}
                        >
                          {item.role || 'user'}
                        </span>
                      </td>

                      <td className="px-3 py-4 text-slate-400">
                        {dateText(item.createdAt)}
                      </td>

                      <td className="px-3 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedUser(item);
                            setShowDeleteModal(true);
                          }}
                          disabled={
                            String(item._id) === String(user?.id) ||
                            String(item._id) === String(user?._id)
                          }
                          className="rounded-lg border border-rose-400/15 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">
                      <EmptyState message="No users match your search." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* EXPENSE MONITORING */}
        <Panel
          title="Expense monitoring"
          subtitle={`${filteredExpenses.length} expense(s) shown from the loaded records`}
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="rounded-xl border border-white/10 bg-[#101511] px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-emerald-400/60"
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
                value={searchExpense}
                onChange={(event) => setSearchExpense(event.target.value)}
                placeholder="Search expenses..."
                className="rounded-xl border border-white/10 bg-[#101511] px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-400/60 sm:w-56"
              />

              <button
                onClick={exportExpenses}
                className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-[#07110b] transition hover:bg-emerald-400"
              >
                ↓ Export CSV
              </button>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.07] text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-3 font-medium">Expense</th>
                  <th className="px-3 py-3 font-medium">User</th>
                  <th className="px-3 py-3 font-medium">Category</th>
                  <th className="px-3 py-3 font-medium">Payment</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>

              <tbody>
                {filteredExpenses.length ? (
                  filteredExpenses.map((item) => (
                    <tr
                      key={item._id}
                      className="border-b border-white/[0.05] transition hover:bg-emerald-400/[0.025]"
                    >
                      <td className="px-3 py-4">
                        <p className="font-semibold text-white">
                          {item.title || 'Untitled expense'}
                        </p>
                        <p className="mt-1 max-w-48 truncate text-xs text-slate-500">
                          {item.description || 'No description'}
                        </p>
                      </td>

                      <td className="px-3 py-4">
                        <p className="text-slate-300">
                          {item.userId?.name || 'Unknown user'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.userId?.email || '—'}
                        </p>
                      </td>

                      <td className="px-3 py-4">
                        <span className="rounded-lg bg-white/[0.05] px-2.5 py-1.5 text-xs text-slate-300">
                          {item.category || 'Other'}
                        </span>
                      </td>

                      <td className="px-3 py-4 text-slate-400">
                        {item.paymentMethod || '—'}
                      </td>

                      <td className="px-3 py-4 text-slate-400">
                        {dateText(item.date)}
                      </td>

                      <td className="px-3 py-4 text-right font-semibold text-white">
                        {money(item.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">
                      <EmptyState message="No expenses match your filters." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            The tables display up to 100 records returned by the backend.
            CSV export includes the currently filtered, loaded expenses.
          </p>
        </Panel>

        <footer className="flex flex-col justify-between gap-2 border-t border-white/[0.07] py-5 text-xs text-slate-600 sm:flex-row">
          <p>ExpenseFlow · Administration console</p>
          <p>Private admin area · Manage account data responsibly</p>
        </footer>
      </main>

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setShowDeleteModal(false);
              setSelectedUser(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-user-title"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111a14] p-6 shadow-2xl shadow-black/50"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-2xl text-rose-300">
              !
            </div>

            <h3 id="delete-user-title" className="text-xl font-bold text-white">
              Delete this user?
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              You are about to delete{' '}
              <span className="font-semibold text-white">
                {selectedUser.name}
              </span>.
              This action may also delete their associated expenses and cannot
              be undone.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                disabled={deleting}
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                disabled={deleting}
                onClick={deleteUser}
                className="rounded-xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, delete user'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
