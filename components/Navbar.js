// components/Navbar.js
import Link from 'next/link';
import { useRouter } from 'next/router';

const menuItems = [
  { label: 'All', href: '/?filter=all', filter: 'all' },
  { label: 'Videos', href: '/?filter=videos', filter: 'videos' },
  { label: 'Notes', href: '/?filter=notes', filter: 'notes' },
  { label: 'To-do-list', href: '/?filter=todolist', filter: 'todolist' },
];

export default function Navbar() {
  const router = useRouter();
  const activeFilter = router.query.filter || 'all';

  return (
    <nav className="bg-gray-800 py-3">
      {/* Added px-8 to provide 2rem left/right padding */}
      <div className="max-w-7xl mx-auto px-8 flex space-x-6">
        {menuItems.map((item) => {
          const isActive = activeFilter === item.filter;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`text-lg font-medium ${
                isActive ? 'text-orange-400' : 'text-gray-300 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
