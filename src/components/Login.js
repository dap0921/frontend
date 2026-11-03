
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    // JavaScript validation only
    const cleanEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      setLoading(true);

      const response = await api.post('/login', {
        email: cleanEmail,
        password,
        role,
      });

      const userData = {
        ...response.data.data,
        token: response.data.token,
      };

      localStorage.setItem('user', JSON.stringify(userData));

      if (userData.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);

      setError(
        err.response?.data?.message ||
          'Login failed. Please check your email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    const cleanEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      await api.post('/forgot-password', {
        email: cleanEmail,
        role,
      });
      setNotice(
        'If an account matches that email and role, a password reset link will be sent shortly.'
      );
    } catch (err) {
      console.error('Password reset request error:', err);
      setError(
        err.response?.data?.message ||
          'Unable to request a password reset right now. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const returnToLogin = () => {
    setForgotPassword(false);
    setError('');
    setNotice('');
  };

  const inputClass =
    'w-full h-14 rounded-xl border border-white/10 bg-[#111713] pl-12 pr-4 text-white placeholder:text-gray-600 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10';

  return (
    <div className="min-h-screen bg-[#080b09] text-white flex items-center justify-center p-4 sm:p-6">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-emerald-700/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:28px_28px]" />
      </div>

      <div className="relative z-10 w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-[#0d120f] shadow-2xl shadow-black/40 lg:grid lg:grid-cols-2">
        {/* Left brand panel */}
        <section className="relative hidden min-h-[680px] flex-col justify-between overflow-hidden border-r border-white/10 bg-[#101914] p-10 lg:flex xl:p-14">
          <div className="absolute -right-24 top-28 h-80 w-80 rounded-full border border-emerald-500/10" />
          <div className="absolute -right-12 top-40 h-56 w-56 rounded-full border border-emerald-500/10" />
          <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-emerald-500/5 blur-3xl" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400 text-2xl font-bold text-[#07110b] shadow-lg shadow-emerald-500/20">
              ₹
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Expense Tracker
              </h1>
              <p className="text-xs text-gray-500">
                Personal Finance Manager
              </p>
            </div>
          </div>

          <div className="relative z-10 my-12">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs font-medium text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              YOUR MONEY, YOUR CONTROL
            </div>

            <h2 className="max-w-lg text-5xl font-semibold leading-tight tracking-tight xl:text-6xl">
              Make every
              <span className="block text-emerald-400">rupee count.</span>
            </h2>

            <p className="mt-6 max-w-md text-base leading-7 text-gray-400">
              Understand your spending, stay on top of your expenses, and
              build better financial habits — all in one place.
            </p>

            <div className="mt-10 space-y-4">
              {[
                ['01', 'Understand your spending', 'See where your money goes.'],
                ['02', 'Stay in control', 'Keep your finances organised.'],
                ['03', 'Make smarter decisions', 'Plan your next financial move.'],
              ].map(([number, title, description]) => (
                <div key={number} className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-sm font-semibold text-emerald-400">
                    {number}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">
                      {title}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-gray-500">
            <span>Built for better financial habits.</span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Secure sign in
            </span>
          </div>
        </section>

        {/* Right login panel */}
        <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-12 xl:px-16">
          <div className="w-full max-w-md">
            {/* Mobile brand */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400 text-xl font-bold text-[#07110b]">
                ₹
              </div>
              <div>
                <h1 className="font-bold">Expense Tracker</h1>
                <p className="text-xs text-gray-500">
                  Personal Finance Manager
                </p>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                {forgotPassword ? 'Account recovery' : 'Welcome back'}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                {forgotPassword ? 'Forgot your password?' : 'Sign in to continue'}
              </h2>
              <p className="mt-3 text-sm leading-6 text-gray-400">
                {forgotPassword
                  ? 'Enter your email and account type. If the account exists, we will email you a reset link.'
                  : 'Enter your account details to access your personal dashboard.'}
              </p>
            </div>

            {notice && (
              <div
                role="status"
                className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-300"
              >
                {notice}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-sm font-bold text-red-400">
                  !
                </span>
                <p className="text-sm leading-6 text-red-300">{error}</p>
              </div>
            )}

            <form
              onSubmit={forgotPassword ? handleForgotPassword : handleLogin}
              noValidate
              className="space-y-5"
            >
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  Email address
                </label>

                <div className="relative">
                  <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    aria-hidden="true"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>

                  <input
                    id="email"
                    name="email"
                    type="text"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </div>
              </div>

              {!forgotPassword && (
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-gray-300"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <svg
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      aria-hidden="true"
                    >
                      <rect x="4" y="10" width="16" height="11" rx="2" />
                      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                    </svg>

                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Enter your password"
                      className={`${inputClass} pr-14`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 transition hover:text-emerald-400"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? 'HIDE' : 'SHOW'}
                    </button>
                  </div>
                </div>
              )}

              {/* Role selection applies to sign-in and password recovery. */}
              <div>
                <p className="mb-3 text-sm font-medium text-gray-300">
                  Sign in as
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'user', label: 'User', symbol: '◉' },
                    { value: 'admin', label: 'Admin', symbol: '◆' },
                  ].map((item) => {
                    const selected = role === item.value;

                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                          setRole(item.value);
                          setError('');
                          setNotice('');
                        }}
                        disabled={loading}
                        aria-pressed={selected}
                        className={`flex h-14 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition ${
                          selected
                            ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20'
                            : 'border-white/10 bg-white/[0.02] text-gray-400 hover:border-white/20 hover:bg-white/[0.04]'
                        }`}
                      >
                        <span>{item.symbol}</span>
                        {item.label}
                        {selected && (
                          <span className="text-emerald-400">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-emerald-400 px-5 font-semibold text-[#07110b] shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-300 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#07110b]/30 border-t-[#07110b]" />
                    {forgotPassword ? 'Sending reset link...' : 'Signing in...'}
                  </>
                ) : (
                  <>
                    {forgotPassword ? 'Send password reset link' : 'Sign in to your account'}
                    <span className="text-lg">→</span>
                  </>
                )}
              </button>
            </form>

            {forgotPassword ? (
              <button
                type="button"
                onClick={returnToLogin}
                className="mt-7 w-full text-center text-sm font-semibold text-emerald-400 transition hover:text-emerald-300"
              >
                Back to sign in
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setForgotPassword(true);
                    setError('');
                    setNotice('');
                  }}
                  className="mt-5 block w-full text-center text-sm font-medium text-emerald-400 transition hover:text-emerald-300"
                >
                  Forgot password?
                </button>

                <p className="mt-7 text-center text-sm text-gray-500">
                  Don&apos;t have an account?{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-emerald-400 transition hover:text-emerald-300"
                  >
                    Create account
                  </Link>
                </p>
              </>
            )}

            <div className="mt-8 flex items-center justify-center gap-2 border-t border-white/10 pt-6 text-xs text-gray-600">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                aria-hidden="true"
              >
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              Your account is protected with secure authentication.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Login;
