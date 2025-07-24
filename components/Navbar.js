// components/Navbar.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { X } from 'lucide-react';
import SubscriptionForm from './SubscriptionForm';

export const FilterContext = createContext('all');
export function useFilter() {
  return useContext(FilterContext);
}

const menuItems = [
  { label: 'Subscribe', href: '#', filter: null },
];

export default function Navbar() {
  const router = useRouter();
  const activeFilter = router.query.filter || 'all';

  // controls the modal
  const [showSubscribe, setShowSubscribe] = useState(false);
  // tracks auth
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // on mount, read token
  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem('access_token'));
  }, []);

  // only auto-open when we have both the redirect param AND the user is authenticated
  useEffect(() => {
    if (router.query.redirect === 'subscribe' && isAuthenticated) {
      setShowSubscribe(true);
      router.replace(router.pathname, undefined, { shallow: true });
    }
  }, [router.query, router.pathname, isAuthenticated]);

  const handleSubscribeClick = () => {
    if (!isAuthenticated) {
      // send to login first
      router.push('/login?redirect=subscribe');
    } else {
      // already logged in, show the form
      setShowSubscribe(true);
    }
  };

  return (
    <FilterContext.Provider value={activeFilter}>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SiteNavigationElement",
              name: menuItems.map(i => i.label),
              url: menuItems.map(i => `https://digitaldossier.com${i.href}`)
            })
          }}
        />
      </Head>

      <nav
        role="navigation"
        aria-label="Content filter navigation"
        className="bg-gray-800 py-3"
      >
        <ul className="max-w-7xl mx-auto px-4 sm:px-8 flex overflow-x-auto space-x-4 list-none pl-0">
          {menuItems.map(item => (
            <li key={item.label}>
              <button
                onClick={handleSubscribeClick}
                className="whitespace-nowrap text-lg font-medium text-gray-300 hover:text-white"
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {showSubscribe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <button
              onClick={() => setShowSubscribe(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
            <SubscriptionForm />
          </div>
        </div>
      )}
    </FilterContext.Provider>
  );
}
