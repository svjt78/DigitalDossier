// components/Sidebar.js
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import useSWR from "swr";
import { useRef } from "react";

const fetcher = (url) => fetch(url).then((res) => res.json());
const navItems = [
  { label: "Home", href: "/" },
  { label: "Books", href: "/books" },
  { label: "Blog", href: "/blog" },
  { label: "Products", href: "/products" },
  { label: "Admin", href: "/dashboard" },
];

export default function Sidebar({ isOpen, onClose }) {
  const router = useRouter();
  const { data: profile, mutate } = useSWR("/api/profile", fetcher);
  const fileRef = useRef();

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
        // re-fetch profile to get new avatarUrl
        await mutate();
      } else {
        console.error("Avatar upload failed:", await res.text());
      }
    } catch (err) {
      console.error("Avatar upload error:", err);
    }
  };

  const avatarSrc = profile?.avatarUrl || "/avatar.png";

  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SiteNavigationElement",
              name: navItems.map((i) => i.label),
              url: navItems.map(
                (i) => `${process.env.NEXT_PUBLIC_BASE_URL}${i.href}`
              ),
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
        {/* mobile close */}
        <div className="sm:hidden mb-4">
          <button
            onClick={onClose}
            className="p-2 bg-gray-800 rounded text-white"
          >
            ×
          </button>
        </div>

        {/* avatar + upload */}
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

        {/* nav */}
        <nav aria-label="Primary">
          <ul className="space-y-4 flex-1">
            {navItems.map((item) => {
              const active = router.pathname === item.href;
              return (
                <li key={item.href}>
                  <Link href={item.href} legacyBehavior>
                    <a
                      className={`flex items-center px-2 py-1 rounded-md transition-colors duration-150 ${
                        active
                          ? "text-orange-400 bg-gray-800"
                          : "text-gray-300 hover:text-white hover:bg-gray-700"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      <span>📌</span>
                      <span className="ml-2">{item.label}</span>
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* dark mode at bottom */}
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
