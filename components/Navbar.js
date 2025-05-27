import React, { createContext, useContext } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

// 1️⃣ Create and export the FilterContext and hook
export const FilterContext = createContext('all');
export function useFilter() {
  return useContext(FilterContext);
}

const menuItems = [
  { label: 'All', href: '/?filter=all', filter: 'all' },
  { label: 'Videos', href: '/?filter=videos', filter: 'videos' },
  { label: 'Notes', href: '/?filter=notes', filter: 'notes' },
  { label: 'To-do-list', href: '/?filter=todolist', filter: 'todolist' },
];

export default function Navbar() {
  const router = useRouter();
  const activeFilter = router.query.filter || 'all';

  // JSON-LD for SiteNavigationElement
  const navJsonLd = {
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    "name": menuItems.map(item => item.label),
    "url":  menuItems.map(item => `https://yourdomain.com${item.href}`)
  };

  return (
    // 2️⃣ Provide the active filter to descendants
    <FilterContext.Provider value={activeFilter}>
      <>
        <Head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(navJsonLd) }}
          />
        </Head>

        <nav
          role="navigation"
          aria-label="Content filter navigation"
          className="bg-gray-800 py-3"
        >
          <ul className="max-w-7xl mx-auto px-4 sm:px-8 flex overflow-x-auto space-x-4 list-none pl-0">
            {menuItems.map(item => {
              const isActive = activeFilter === item.filter;
              return (
                <li key={item.label}>
                  <Link href={item.href} legacyBehavior>
                    <a
                      className={`whitespace-nowrap text-lg font-medium ${
                        isActive
                          ? 'text-orange-400'
                          : 'text-gray-300 hover:text-white'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {item.label}
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </>
    </FilterContext.Provider>
  );
}
