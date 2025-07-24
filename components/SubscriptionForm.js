import { useState } from 'react';

export default function SubscriptionForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setStatus(res.ok ? 'Thank you!' : `Error: ${data.error}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none text-black"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full py-2 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50"
      >
        {status === 'loading' ? 'Saving…' : 'Subscribe'}
      </button>
      {status && status !== 'loading' && (
        <p className="text-sm text-gray-600">{status}</p>
      )}
    </form>
  );
}
