// components/SessionWarningBanner.js
import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { Clock, X } from 'lucide-react';

export default function SessionWarningBanner() {
  const { sessionWarning, clearSessionWarning, extendSession } = useContext(AuthContext);

  if (!sessionWarning) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-yellow-600 text-white p-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock size={20} />
          <span className="font-medium">Your session will expire in 2 minutes. Click "Stay Signed In" to continue.</span>
          <button 
            onClick={extendSession}
            className="underline hover:no-underline ml-2 font-semibold bg-white bg-opacity-20 px-3 py-1 rounded transition-colors hover:bg-opacity-30"
          >
            Stay Signed In
          </button>
        </div>
        <button 
          onClick={clearSessionWarning}
          className="text-white hover:text-gray-200 transition-colors p-1 rounded hover:bg-white hover:bg-opacity-10"
          title="Dismiss warning"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
