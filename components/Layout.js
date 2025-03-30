// components/Layout.js
import Header from './Header';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex bg-gray-800 text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Header and Navbar container (non-scrollable) */}
        <div className="sticky top-0 z-50">
          <Header />
          <Navbar />
        </div>
        {/* Main content area scrolls */}
        <main className="p-8 flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
