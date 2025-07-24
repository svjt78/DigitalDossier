// components/ManageSubscriptionsModal.js
import { useEffect, useState } from 'react';
import { X, Trash2 } from 'lucide-react';

export default function ManageSubscriptionsModal({ onClose }) {
  const [subs, setSubs] = useState([]);

  const fetchSubs = async () => {
    const res = await fetch('/api/subscribers');
    if (res.ok) setSubs(await res.json());
  };

  useEffect(() => {
    fetchSubs();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this subscription?')) return;
    const res = await fetch(`/api/subscribers/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchSubs();
    } else {
      alert('Failed to delete');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-semibold mb-4">Manage Subscriptions</h2>
        <ul className="max-h-80 overflow-y-auto divide-y">
          {subs.map((s) => (
            <li
              key={s.id}
              className="flex justify-between items-center py-2"
            >
              <span className="text-gray-800">{s.email}</span>
              <button
                onClick={() => handleDelete(s.id)}
                className="p-1 hover:text-red-600"
                aria-label="Delete"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </li>
          ))}
          {subs.length === 0 && (
            <li className="py-4 text-center text-gray-500">No subscribers</li>
          )}
        </ul>
      </div>
    </div>
  );
}
