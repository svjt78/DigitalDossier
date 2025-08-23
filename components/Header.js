// File: components/Header.js

import { useContext, useCallback } from 'react';
import Link from 'next/link';
import { Menu, Search, X as ClearIcon } from 'lucide-react';
import { useRouter } from 'next/router';
import { useSearchQuery, useSetSearchQuery } from '@/components/SearchContext';
import { AuthContext } from '@/contexts/AuthContext';

export default function Header({ onHamburgerClick }) {
  const router = useRouter();
  const { userId, username, logout } = useContext(AuthContext);

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
    <header className="bg-gray-800/95 backdrop-blur-sm border-b border-gray-700/50 py-3 sm:py-4 px-4 sm:px-6 lg:px-8" role="banner">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Mobile hamburger + branding */}
        <div className="flex items-center min-w-0">
          <button
            type="button"
            className="lg:hidden mr-3 p-2 text-white hover:text-blue-400 hover:bg-gray-700/50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Open sidebar menu"
            onClick={handleHamburger}
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="m-0 flex items-center space-x-3 min-w-0">
            <Link href="/" legacyBehavior>
              <a className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent hover:from-blue-400 hover:to-indigo-500 transition-all duration-200 truncate">
                Digital Dossier
              </a>
            </Link>
            {userId && username && (
              <span className="hidden sm:inline text-xs sm:text-sm font-medium text-white/80 truncate">
                Hello, {username}
              </span>
            )}
          </h1>
        </div>

        {/* Navigation and Search */}
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1 justify-end">
          {/* Desktop Navigation */}
          {userId ? (
            <button
              onClick={onSignOut}
              className="hidden lg:inline-flex items-center px-3 py-1.5 text-sm font-medium text-white hover:text-blue-400 hover:bg-gray-700/50 rounded-lg transition-all duration-200"
            >
              Sign Out
            </button>
          ) : (
            <div className="hidden lg:flex items-center space-x-3">
              <button
                onClick={onSigninClick}
                className="px-3 py-1.5 text-sm font-medium text-white hover:text-blue-400 hover:bg-gray-700/50 rounded-lg transition-all duration-200"
              >
                Sign In
              </button>
              <button
                onClick={onSignupClick}
                className="px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-blue-500/25"
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Enhanced Search */}
          <form
            role="search"
            onSubmit={e => e.preventDefault()}
            className="w-full max-w-xs sm:max-w-sm lg:max-w-lg"
          >
            <label htmlFor="search-input" className="sr-only">
              Search Digital Dossier
            </label>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors duration-200" size={18} />
              <input
                id="search-input"
                type="search"
                placeholder="Search title, author or genre…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-xl pl-10 pr-10 py-2 sm:py-2.5 bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/20 border border-gray-600/50 hover:border-gray-500/50 transition-all duration-200"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-600/50 rounded-full transition-colors duration-200 focus:outline-none"
                  aria-label="Clear search"
                >
                  <ClearIcon className="h-4 w-4 text-gray-400 hover:text-white" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </header>
  );
}
