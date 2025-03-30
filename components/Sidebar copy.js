// components/Sidebar.js
import Link from 'next/link';
import { useRouter } from 'next/router';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Books', href: '/books' },
  { label: 'Blog', href: '/blog' },
  { label: 'Products', href: '/products' },
  { label: 'Admin', href: '/dashboard' },
];

export default function Sidebar() {
  const router = useRouter();

  return (
    <aside className="w-64 bg-gray-800 p-6 flex flex-col justify-between">
      <div>
        <div className="mb-8 text-center">
          <img src="/avatar.png" className="w-16 h-16 rounded-full mx-auto" alt="Profile" />
          <h2 className="text-lg mt-2 font-semibold">Matt Smith</h2>
          <p className="text-sm text-gray-400">mattsmith943@gmail.com</p>
        </div>
        <nav className="space-y-4">
          {navItems.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <div
                key={item.label}
                className={`flex items-center space-x-2 cursor-pointer ${isActive ? 'text-orange-400' : 'text-gray-300 hover:text-white'}`}
              >
                <span>📚</span>
                <Link href={item.href} className="hover:underline">
                  {item.label}
                </Link>
              </div>
            );
          })}
        </nav>
      </div>
      <div className="mt-8">
        <label className="flex items-center cursor-pointer">
          <span className="mr-2">Dark mode</span>
          <div className="bg-orange-500 w-10 h-5 rounded-full relative">
            <div className="bg-white w-4 h-4 rounded-full absolute left-1 top-0.5"></div>
          </div>
        </label>
      </div>
    </aside>
  );
}
