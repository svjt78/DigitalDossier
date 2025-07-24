// components/Header.js

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { useRouter } from 'next/router';
import { useSearchQuery, useSetSearchQuery } from '@/components/SearchContext';
import SignupModal from '@/components/SignupModal';

export default function Header({ onHamburgerClick }) {
  const router = useRouter();

  // Toggle sidebar for mobile
  const handleHamburger = useCallback(() => {
    if (onHamburgerClick) onHamburgerClick();
  }, [onHamburgerClick]);

  // Search context
  const searchQuery = useSearchQuery();
  const setSearchQuery = useSetSearchQuery();

  // Sign-up modal state
  const [showSignup, setShowSignup] = useState(false);

  // Handlers
  const onSigninClick = () => {
    if (router.pathname !== '/login') {
      router.push('/login');
    }
  };
  const onSignupClick = () => {
    setShowSignup(true);
  };

  return (
    <>
      <header className="bg-gray-800 py-4 px-4 sm:px-8" role="banner">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Mobile hamburger + branding */}
          <div className="flex items-center">
            <button
              type="button"
              className="sm:hidden mr-4 text-white hover:text-gray-300 focus:outline-none"
              aria-label="Open sidebar menu"
              onClick={handleHamburger}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="m-0">
              <Link href="/" legacyBehavior>
                <a className="text-3xl font-bold text-orange-400 hover:underline">
                  Digital Dossier
                </a>
              </Link>
            </h1>
          </div>

          {/* Sign In / Sign Up + Search */}
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <button
              onClick={onSigninClick}
              className="hidden sm:inline-block text-sm font-medium text-white hover:underline"
            >
              Sign In
            </button>
            <button
              onClick={onSignupClick}
              className="hidden sm:inline-block text-sm font-medium text-white hover:underline"
            >
              Sign Up
            </button>
            <form
              role="search"
              onSubmit={e => e.preventDefault()}
              className="w-full sm:w-1/3"
            >
              <label htmlFor="search-input" className="sr-only">
                Search Digital Dossier
              </label>
              <input
                id="search-input"
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-full px-4 py-2 bg-white text-black focus:outline-none"
              />
            </form>
          </div>
        </div>
      </header>

      {/* Sign-up modal */}
      <SignupModal
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
      />
    </>
  );
}
