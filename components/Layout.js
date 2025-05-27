// components/Layout.js
import { useState } from 'react';
import Head from 'next/head';
import Header from './Header';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((open) => !open);
  };

  // SEO defaults
  const defaultTitle = 'Digital Dossier';
  const defaultDescription = 'Your hub for PDFs, notes, videos, and more in a centralized digital dossier.';
  const canonicalUrl = 'https://digitaldossier.com';

  return (
    <>
      <Head>
        {/* JSON-LD WebSite schema for enhanced discovery */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "url": canonicalUrl,
              "name": defaultTitle,
              "description": defaultDescription,
              "potentialAction": {
                "@type": "SearchAction",
                "target": `${canonicalUrl}/?filter={query}`,
                "query-input": "required name=query"
              }
            })
          }}
        />
      </Head>

      <div className="min-h-screen flex flex-col md:flex-row bg-gray-800 text-white">
        {/* Sidebar: hidden on mobile, slides in as drawer */}
        <Sidebar isOpen={sidebarOpen} onClose={toggleSidebar} />

        <div className="flex-1 flex flex-col">
          {/* Header and Navbar container (non-scrollable) */}
          <div className="sticky top-0 z-50">
            <Header onHamburgerClick={toggleSidebar} />
            <Navbar />
          </div>

          {/* Main content area scrolls */}
          <main className="p-8 flex-1 overflow-auto" role="main">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
