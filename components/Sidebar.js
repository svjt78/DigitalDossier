import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import useSWR from "swr";
import { useRef, useState, useEffect, useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function Sidebar({ isOpen, onClose }) {
  const router = useRouter();
  const { data: profile, mutate } = useSWR("/api/profile", fetcher);
  const { isAuthenticated, isSuperUser, logout } = useContext(AuthContext);
  const fileRef = useRef();

  // Debug logging
  useEffect(() => {
    console.log('🔍 Sidebar: Auth context values:', {
      isAuthenticated,
      isSuperUser,
      contextAvailable: !!AuthContext
    });
  }, [isAuthenticated, isSuperUser]);

  const handleClick = () => {
    fileRef.current?.click();
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append("avatar", file);
    try {
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: form,
      });
      if (res.ok) {
        await mutate();
      } else {
        console.error("Avatar upload failed:", await res.text());
      }
    } catch (err) {
      console.error("Avatar upload error:", err);
    }
  };

  const handleLogout = () => {
    logout();
    onClose?.();
    router.push('/');
  };

  const avatarSrc = profile?.avatarUrl || "/avatar.png";

  // Build nav items based on auth state
  const items = [];
  
  // Auth-dependent mobile-only items
  if (isAuthenticated) {
    items.push({ label: "Sign Out", href: "#", mobileOnly: true, onClick: handleLogout });
  } else {
    items.push({ label: "Sign In", href: "/login", mobileOnly: true });
    items.push({ label: "Sign Up", href: "/signup", mobileOnly: true });
  }

  // Base navigation items
  const baseNavItems = [
    { label: "Home", href: "/" },
    { label: "Books", href: "/books" },
    { label: "Blog", href: "/blog" },
    { label: "Products", href: "/products" },
  ];
  
  // Add Admin link only for superuser
  if (isSuperUser) {
    console.log('🔍 Sidebar: Adding Admin link for superuser');
    baseNavItems.push({ label: "Admin", href: "/dashboard" });
  } else {
    console.log('🔍 Sidebar: Not adding Admin link - not superuser');
  }

  items.push(...baseNavItems);

  console.log('🔍 Sidebar: Final nav items:', items.map(i => i.label));

  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SiteNavigationElement",
              name: items.map((i) => i.label),
              url: items.map((i) => `${process.env.NEXT_PUBLIC_BASE_URL}${i.href}`),
            }),
          }}
        />
      </Head>
      
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      <aside
        role="complementary"
        aria-label="Sidebar"
        className={`
          fixed inset-y-0 left-0 z-50 bg-gray-900 p-6 flex flex-col
          transform transition-transform duration-200
          w-3/4 sm:w-64
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          sm:translate-x-0 sm:relative
        `}
      >
        {/* Mobile close button */}
        <div className="sm:hidden mb-4">
          <button
            onClick={onClose}
            className="p-2 bg-gray-800 rounded text-white"
          >
            ×
          </button>
        </div>
        
        {/* Avatar and profile section */}
        <div className="relative text-center mb-8">
          <Image
            src={avatarSrc}
            alt="User avatar"
            width={64}
            height={64}
            className="rounded-full mx-auto cursor-pointer"
            onClick={handleClick}
          />
          <input
            type="file"
            accept="image/*"
            ref={fileRef}
            className="hidden"
            onChange={handleFile}
          />
          <h2 className="mt-2 text-lg font-semibold text-white">
            {profile?.name}
          </h2>
          <p className="text-sm text-gray-400">{profile?.email}</p>
        </div>
        
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-2 bg-gray-800 rounded text-xs text-yellow-400">
            <div>Auth: {isAuthenticated ? '✅' : '❌'}</div>
            <div>Super: {isSuperUser ? '✅' : '❌'}</div>
            <div>Items: {items.length}</div>
          </div>
        )}
        
        {/* Navigation */}
        <nav aria-label="Primary">
          <ul className="space-y-4 flex-1">
            {items.map((item) => {
              const active = router.pathname === item.href;
              const baseClasses = `flex items-center px-2 py-1 rounded-md transition-colors duration-150 ${
                active
                  ? "text-orange-400 bg-gray-800"
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`;
              
              return (
                <li
                  key={item.label}
                  className={item.mobileOnly ? "block sm:hidden" : undefined}
                >
                  {item.onClick ? (
                    <button
                      onClick={item.onClick}
                      className={baseClasses}
                    >
                      <span>📌</span>
                      <span className="ml-2">{item.label}</span>
                    </button>
                  ) : (
                    <Link href={item.href} legacyBehavior>
                      <a
                        className={baseClasses}
                        aria-current={active ? "page" : undefined}
                      >
                        <span>📌</span>
                        <span className="ml-2">{item.label}</span>
                      </a>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* Dark mode toggle at bottom */}
        <div className="mt-auto">
          <label className="flex items-center cursor-pointer">
            <span className="mr-2 text-gray-300">Dark mode</span>
            <div className="bg-orange-500 w-10 h-5 rounded-full relative">
              <div className="bg-white w-4 h-4 rounded-full absolute left-1 top-0.5" />
            </div>
          </label>
        </div>
      </aside>
    </>
  );
}