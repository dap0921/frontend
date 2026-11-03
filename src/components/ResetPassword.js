import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';

function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Your password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await api.post(`/reset-password/${encodeURIComponent(token)}`, {
        password,
      });
      setSuccess(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(
        err.response?.data?.message ||
          'This reset link is invalid or expired. Request a new one and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080b09] px-4 py-10 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d120f] p-8 shadow-2xl shadow-black/40 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Account recovery
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          {success ? 'Password updated' : 'Set a new password'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-400">
          {success
            ? 'Your password has been changed. You can now sign in with your new password.'
            : 'Choose a new password for your account. The reset link can only be used once.'}
        </p>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-6 text-red-300"
          >
            {error}
          </div>
        )}

        {success ? (
          <Link
            to="/login"
            className="mt-8 flex h-12 w-full items-center justify-center rounded-xl bg-emerald-400 px-5 font-semibold text-[#07110b] transition hover:bg-emerald-300"
          >
            Back to sign in
          </Link>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="new-password"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                New password
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 w-full rounded-xl border border-white/[0.09] bg-[#101511] px-4 text-sm text-gray-100 outline-none transition focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-400/[0.07]"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="h-12 w-full rounded-xl border border-white/[0.09] bg-[#101511] px-4 text-sm text-gray-100 outline-none transition focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-400/[0.07]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-emerald-400 px-5 font-semibold text-[#07110b] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Updating password...' : 'Reset password'}
            </button>
          </form>
        )}

        {!success && (
          <p className="mt-6 text-center text-sm text-gray-500">
            <Link
              to="/login"
              className="font-semibold text-emerald-400 transition hover:text-emerald-300"
            >
              Back to sign in
            </Link>
          </p>
        )}
      </section>
    </main>
  );
}

export default ResetPassword;
