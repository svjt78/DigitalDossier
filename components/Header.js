// components/Header.js
import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-gray-800 py-4 px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-3xl font-bold text-orange-400 hover:underline">
          Digital Dossier
        </Link>
        <input
          type="text"
          placeholder="Search..."
          className="w-[30%] rounded-full px-4 py-2 bg-white text-black focus:outline-none"
        />
      </div>
    </header>
  );
}
