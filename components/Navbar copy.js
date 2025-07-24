import React, { createContext, useContext, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { X } from 'lucide-react';
import SubscriptionForm from './SubscriptionForm';

// 1️⃣ Create and export the FilterContext and hook, defaulting to "all"
export const FilterContext = createContext('all');
export function useFilter() {
  return useContext(FilterContext);
}

// 2️⃣ Only “Subscribe” remains in the menu
const menuItems = [
  { label: 'Subscribe', href: '#', filter: null },
];

export default function Navbar() {
  const router = useRouter();
  // 3️⃣ Ensure default filter is "all"
  const activeFilter = router.query.filter || 'all';

  // 4️⃣ State to toggle the subscribe modal
  const [showSubscribe, setShowSubscribe] = useState(false);

  // JSON-LD for SiteNavigationElement
  const navJsonLd = {
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    "name": menuItems.map(item => item.label),
    "url":  menuItems.map(item => `https://yourdomain.com${item.href}`)
  };

  return (
    <FilterContext.Provider value={activeFilter}>
      <>
        <Head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(navJsonLd) }}
          />
        </Head>

        {/* ——— Navigation Bar ——— */}
        <nav
          role="navigation"
          aria-label="Content filter navigation"
          className="bg-gray-800 py-3"
        >
          <ul className="max-w-7xl mx-auto px-4 sm:px-8 flex overflow-x-auto space-x-4 list-none pl-0">
            {menuItems.map(item => (
              <li key={item.label}>
                <button
                  onClick={() => setShowSubscribe(true)}
                  className="whitespace-nowrap text-lg font-medium text-gray-300 hover:text-white"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* ——— Subscription Modal Overlay ——— */}
        {showSubscribe && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
              <button
                onClick={() => setShowSubscribe(false)}
                className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">
                Subscribe
              </h2>
              <SubscriptionForm />
            </div>
          </div>
        )}
      </>
    </FilterContext.Provider>
  );
}
