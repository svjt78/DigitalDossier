// components/SessionExpiredBanner.js
import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { AlertCircle, X } from 'lucide-react';

export default function SessionExpiredBanner() {
  const { sessionExpired, sessionWarning, clearSessionExpired } = useContext(AuthContext);

  if (!sessionExpired) return null;

  // Calculate top position based on whether warning banner is visible
  const topPosition = sessionWarning ? 'top-[60px]' : 'top-0';

  return (
    <div className={`fixed left-0 right-0 z-45 bg-red-600 text-white p-3 shadow-lg ${topPosition}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertCircle size={20} />
          <span className="font-medium">Your session has expired. Please sign in to continue voting and commenting.</span>
          <a 
            href="/login" 
            className="underline hover:no-underline ml-2 font-semibold bg-white bg-opacity-20 px-2 py-1 rounded transition-colors hover:bg-opacity-30"
          >
            Sign In
          </a>
        </div>
        <button 
          onClick={clearSessionExpired}
          className="text-white hover:text-gray-200 transition-colors p-1 rounded hover:bg-white hover:bg-opacity-10"
          title="Dismiss notification"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
