// components/Header.js

import { useCallback } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { useSearchQuery, useSetSearchQuery } from '@/components/SearchContext';

export default function Header({ onHamburgerClick }) {
  const handleHamburger = useCallback(() => {
    if (onHamburgerClick) onHamburgerClick();
  }, [onHamburgerClick]);

  // Read and update the shared search query
  const searchQuery = useSearchQuery();
  const setSearchQuery = useSetSearchQuery();

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

          <h1 className="m-0">
            <Link href="/" legacyBehavior>
              <a className="text-3xl font-bold text-orange-400 hover:underline">
                Digital Dossier
              </a>
            </Link>
          </h1>
        </div>

        {/* Search box (driven by SearchContext) */}
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
    </header>
  );
}
