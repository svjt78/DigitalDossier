// File: components/Header.js

import { useContext, useCallback } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { useRouter } from 'next/router';
import { useSearchQuery, useSetSearchQuery } from '@/components/SearchContext';
import { AuthContext } from '@/contexts/AuthContext';

export default function Header({ onHamburgerClick }) {
  const router = useRouter();
  const { userId, logout } = useContext(AuthContext);

  // Sign-out handler
  const onSignOut = () => {
    logout();
    router.push('/');
  };

  // Toggle sidebar for mobile
  const handleHamburger = useCallback(() => {
    if (onHamburgerClick) onHamburgerClick();
  }, [onHamburgerClick]);

  // Search context
  const searchQuery = useSearchQuery();
  const setSearchQuery = useSetSearchQuery();

  // Navigation handlers
  const onSigninClick = () => {
    if (router.pathname !== '/login') {
      router.push('/login');
    }
  };
  const onSignupClick = () => {
    if (router.pathname !== '/signup') {
      router.push('/signup');
    }
  };

  return (
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
          <h1 className="m-0 flex items-center space-x-4">
            <Link href="/" legacyBehavior>
              <a className="text-3xl font-bold text-orange-400 hover:underline">
                Digital Dossier
              </a>
            </Link>
            {userId && (
              <span className="text-sm font-medium text-white">
                Hello, {userId}
              </span>
            )}
          </h1>
        </div>

        {/* Sign In / Sign Up or Sign Out + Search */}
        <div className="flex items-center space-x-4 w-full sm:w-auto">
          {userId ? (
            <button
              onClick={onSignOut}
              className="hidden sm:inline-block text-sm font-medium text-white hover:underline"
            >
              Sign Out
            </button>
          ) : (
            <>
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
            </>
          )}

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
  );
}
