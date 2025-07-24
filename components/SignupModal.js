// components/SignupModal.js

import { useState } from 'react';
import { useRouter } from 'next/router';
import { X } from 'lucide-react';

export default function SignupModal({ isOpen, onClose }) {
  const router = useRouter();
  const [form, setForm]       = useState({ email: '', username: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8001/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || 'Signup failed');
      } else {
        onClose();
        router.push('/login');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Sign Up</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {error && <p className="text-red-600 mb-2">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block mb-1">Username</label>
            <input
              name="username"
              type="text"
              required
              value={form.username}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block mb-1">Password</label>
            <input
              name="password"
              type="password"
              required
              value={form.password}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded py-2"
          >
            {loading ? 'Signing up…' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
}
