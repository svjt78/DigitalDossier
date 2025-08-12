import { useState } from 'react';
import { useRouter } from 'next/router';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail]     = useState('');
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/reset-password-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || data.message || 'Request failed');
      }

      setSuccess(data.message || 'If the email exists, a reset link has been sent.');
    } catch (err) {
      setError(err.message || 'Network error. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="m-auto w-full max-w-md p-8 space-y-6">
        <h2 className="text-2xl font-bold text-center">Forgot Password</h2>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-500 text-sm">{success}</p>}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500 text-black"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-orange-500 text-white font-semibold rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400 disabled:opacity-50"
            >
              Send Reset Link
            </button>
          </form>
        )}

        <p className="text-center text-sm">
          <a href="/login" className="text-orange-600 hover:underline">
            Back to Login
          </a>
        </p>
      </div>

      <div
        className="hidden lg:block flex-1 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/auth-bg.jpg')" }}
      />
    </div>
  );
}
