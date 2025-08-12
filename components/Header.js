// File: components/Header.js

import { useContext, useCallback } from 'react';
import Link from 'next/link';
import { Menu, Search, X as ClearIcon } from 'lucide-react';
import { useRouter } from 'next/router';
import { useSearchQuery, useSetSearchQuery } from '@/components/SearchContext';
import { AuthContext } from '@/contexts/AuthContext';

export default function Header({ onHamburgerClick }) {
  const router = useRouter();
  const { userId, username, logout } = useContext(AuthContext);  // Added username here

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
            {userId && username && (  // Check both userId and username exist
              <span className="text-sm font-medium text-white">
                Hello, {username}  {/* Display username instead of userId */}
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
            className="w-full sm:flex-1 sm:max-w-lg"
          >
            <label htmlFor="search-input" className="sr-only">
              Search Digital Dossier
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="search-input"
                type="search"
                placeholder="Search title, author or genre…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-full pl-10 pr-10 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 focus:outline-none"
                  aria-label="Clear search"
                >
                  <ClearIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </header>
  );
}