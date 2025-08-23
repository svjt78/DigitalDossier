// File: pages/reset-password.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = router.query;
  const [newPassword, setNewPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError]                   = useState('');
  const [success, setSuccess]               = useState('');

  // If they navigated here without a token, show an error
  useEffect(() => {
    if (!token) {
      setError('No reset token provided.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      // → proxy through our own API instead of hitting AUTH_API_BASE
      const response = await fetch('/api/auth/reset-password-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        // show the explicit detail/error from the API
        setError(data.detail || data.error || data.message || 'Reset failed');
        return;
      }

      setSuccess('Password has been reset successfully. Redirecting to login...');
      setTimeout(() => router.push('/login?reset=success'), 2000);
    } catch (err) {
      setError(err.message || 'Network error. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="m-auto w-full max-w-md p-8 space-y-6">
        <h2 className="text-2xl font-bold text-center">Reset Password</h2>

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}
        {success && (
          <p className="text-green-500 text-sm">{success}</p>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 text-black"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 text-black"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              Reset Password
            </button>
          </form>
        )}
      </div>

      <div
        className="hidden lg:block flex-1 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/auth-bg.jpg')" }}
      />
    </div>
  );
}
