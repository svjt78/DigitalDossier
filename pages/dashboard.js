// pages/dashboard.js
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { prisma } from '@/lib/prisma';
import { useState, useEffect } from 'react';
import UploadModal from '@/components/UploadModal';
import ManageSubscriptionsModal from '@/components/ManageSubscriptionsModal';
import ManageUsersModal from '@/components/ManageUsersModal';
import { Edit2, Trash2, RefreshCw, AlertCircle, CheckCircle, Users, Upload, Palette, UserCog, Mail } from 'lucide-react';
import { isSuperUser, isAuthenticated } from '@/lib/auth-utils';

// Loading component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-800">
    <div className="text-center">
      <RefreshCw className="h-12 w-12 animate-spin text-orange-400 mx-auto mb-4" />
      <p className="text-white text-lg">Loading dashboard...</p>
    </div>
  </div>
);

// Static props - no authentication required at build time
export async function getStaticProps() {
  try {
    // Fetch data without authentication
    const [blogs, books, products] = await Promise.all([
      prisma.blog.findMany({ 
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          author: true,
          coverKey: true,
          pdfKey: true,
          createdAt: true,
          updatedAt: true,
        }
      }),
      prisma.book.findMany({ 
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          author: true,
          coverKey: true,
          pdfKey: true,
          createdAt: true,
          updatedAt: true,
        }
      }),
      prisma.product.findMany({ 
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          author: true,
          coverKey: true,
          pdfKey: true,
          createdAt: true,
          updatedAt: true,
        }
      }),
    ]);

    const bucket = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_REGION;

    const buildUrl = (key) => {
      if (!key) return null;
      return `https://${bucket}.s3.${region}.amazonaws.com/${encodeURI(key)}`;
    };

    const mapUrls = (item) => ({
      ...item,
      coverUrl: buildUrl(item.coverKey),
      pdfUrl: buildUrl(item.pdfKey),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    });

    return {
      props: {
        initialData: {
          blogs: blogs.map(mapUrls),
          books: books.map(mapUrls),
          products: products.map(mapUrls),
        },
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      props: {
        initialData: { blogs: [], books: [], products: [] },
        error: error.message,
      },
      revalidate: 60,
    };
  }
}

export default function Dashboard({ initialData, error: serverError }) {
  const router = useRouter();
  
  // Authentication state
  const [authChecking, setAuthChecking] = useState(true);
  const [isUserSuperUser, setIsUserSuperUser] = useState(false);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  
  // Data state
  const [data, setData] = useState(initialData || { blogs: [], books: [], products: [] });
  const [localBlogs, setLocalBlogs] = useState(data.blogs);
  const [localBooks, setLocalBooks] = useState(data.books);
  const [localProducts, setLocalProducts] = useState(data.products);

  // UI state
  const [error, setError] = useState(serverError);
  const [successMessage, setSuccessMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [manageUsersModalOpen, setManageUsersModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Blog');
  const [editingItem, setEditingItem] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);

  // Client-side authentication and superuser check
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      const superUser = isSuperUser();
      
      console.log('Dashboard auth check:', { 
        authenticated, 
        superUser,
        email: localStorage.getItem('email')
      });
      
      setIsUserAuthenticated(authenticated);
      setIsUserSuperUser(superUser);
      
      // If not authenticated or not superuser, redirect to home
      if (!authenticated || !superUser) {
        router.replace('/');
        return;
      }
      
      setAuthChecking(false);
    };

    // Small delay to let AuthContext load
    const timer = setTimeout(checkAuth, 100);
    
    return () => clearTimeout(timer);
  }, [router]);

  // Update local state when initialData changes
  useEffect(() => {
    if (initialData) {
      setLocalBlogs(initialData.blogs);
      setLocalBooks(initialData.books);
      setLocalProducts(initialData.products);
    }
  }, [initialData]);

  // API call with auth headers
  const makeAuthenticatedRequest = async (url, options = {}) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      // Token expired, redirect to home
      router.replace('/');
      throw new Error('Authentication expired');
    }

    return response;
  };

  // Category selection handler
  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    setEditingItem(null);
    setEditingCategory(null);
  };

  // Edit handler
  const handleEdit = (item) => {
    setEditingItem(item);
    setEditingCategory(selectedCategory);
    setModalOpen(true);
  };

  // Delete handler
  const handleDelete = async (item) => {
    const confirmMessage = `Are you sure you want to delete "${item.title}"? This action cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    setDeleteLoading(item.id);
    
    try {
      const response = await makeAuthenticatedRequest(
        `/api/content/${selectedCategory.toLowerCase()}/${item.id}`,
        { method: 'DELETE' }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to delete: ${response.status}`);
      }

      // Update local state
      if (selectedCategory === 'Blog') {
        setLocalBlogs(prev => prev.filter(b => b.id !== item.id));
      } else if (selectedCategory === 'Book') {
        setLocalBooks(prev => prev.filter(b => b.id !== item.id));
      } else {
        setLocalProducts(prev => prev.filter(p => p.id !== item.id));
      }
      
      setSuccessMessage(`${selectedCategory} "${item.title}" deleted successfully`);
      setTimeout(() => setSuccessMessage(''), 5000);
      
    } catch (err) {
      console.error('Delete error:', err);
      setError(`Failed to delete ${selectedCategory.toLowerCase()}: ${err.message}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  // Upload save handler
  const handleUploadSave = (savedItem) => {
    if (!savedItem) {
      setModalOpen(false);
      setEditingItem(null);
      setEditingCategory(null);
      return;
    }

    try {
      if (editingItem) {
        // Update existing item
        const updateStateArray = (prevArray) => 
          prevArray.map(item => item.id === savedItem.id ? savedItem : item);

        if (editingCategory === 'Blog') {
          setLocalBlogs(updateStateArray);
        } else if (editingCategory === 'Book') {
          setLocalBooks(updateStateArray);
        } else {
          setLocalProducts(updateStateArray);
        }
        
        setSuccessMessage(`${editingCategory} updated successfully`);
      } else {
        // Add new item
        if (savedItem.slug && 'content' in savedItem) {
          setLocalBlogs(prev => [savedItem, ...prev]);
        } else if (savedItem.slug && 'summary' in savedItem && !('content' in savedItem)) {
          setLocalBooks(prev => [savedItem, ...prev]);
        } else {
          setLocalProducts(prev => [savedItem, ...prev]);
        }
        
        setSuccessMessage(`New ${selectedCategory} created successfully`);
      }
      
      setTimeout(() => setSuccessMessage(''), 5000);
      
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to update local state');
    }

    setModalOpen(false);
    setEditingItem(null);
    setEditingCategory(null);
  };

  // Get items to show
  const itemsToShow = 
    selectedCategory === 'Blog' ? localBlogs
    : selectedCategory === 'Book' ? localBooks
    : localProducts;

  // Show loading while checking auth
  if (authChecking) {
    return <LoadingScreen />;
  }

  // If we reach here, user is authenticated and is superuser
  return (
    <>
      <Head>
        <title>Admin Dashboard | Digital Dossier</title>
        <meta name="description" content="Manage blogs, books, and products in the Digital Dossier admin dashboard." />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
            Admin Dashboard | Digital Dossier
          </h1>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-900/50 backdrop-blur-sm border border-red-500 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-100">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-900/50 backdrop-blur-sm border border-green-500 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              <span className="text-green-100">{successMessage}</span>
              <button
                onClick={() => setSuccessMessage('')}
                className="ml-auto text-green-400 hover:text-green-300"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Action buttons with modern gradients and shadows */}
        <div className="flex flex-wrap justify-end mb-6 gap-3">
          <button
            onClick={() => { 
              setEditingItem(null); 
              setEditingCategory(null); 
              setModalOpen(true); 
            }}
            className="group relative px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg shadow-lg shadow-blue-600/20 transition-all transform hover:scale-105 font-medium flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Content</span>
            <div className="absolute inset-0 rounded-lg bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
          </button>
          
          <button 
            disabled 
            className="px-5 py-2.5 bg-gray-600 text-gray-300 rounded-lg cursor-not-allowed font-medium opacity-50 flex items-center gap-2"
            title="Coming soon"
          >
            <Palette className="h-4 w-4" />
            <span>Create with Canva</span>
          </button>
          
          <button
            onClick={() => setManageUsersModalOpen(true)}
            className="group relative px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg shadow-lg shadow-purple-600/20 transition-all transform hover:scale-105 font-medium flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            <span>Manage Users</span>
            <div className="absolute inset-0 rounded-lg bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
          </button>
          
          <button
            onClick={() => setManageModalOpen(true)}
            className="group relative px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg shadow-lg shadow-green-600/20 transition-all transform hover:scale-105 font-medium flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            <span>Manage Subscriptions</span>
            <div className="absolute inset-0 rounded-lg bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
          </button>
        </div>

        {/* Category cards with improved styling */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {['Blog', 'Book', 'Product'].map((cat) => {
            const count = 
              cat === 'Blog' ? localBlogs.length
              : cat === 'Book' ? localBooks.length
              : localProducts.length;
            const isSelected = selectedCategory === cat;
            
            return (
              <button
                key={cat}
                onClick={() => handleSelectCategory(cat)}
                className={`
                  relative cursor-pointer aspect-square p-6 rounded-xl shadow-xl 
                  flex flex-col items-center justify-center transition-all transform
                  ${isSelected 
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white scale-105 shadow-2xl shadow-blue-600/30' 
                    : 'bg-gradient-to-br from-gray-800 to-gray-700 text-gray-200 hover:from-gray-700 hover:to-gray-600 hover:scale-102'
                  }
                `}
              >
                <div className="absolute inset-0 rounded-xl bg-white opacity-0 hover:opacity-5 transition-opacity"></div>
                <span className="text-xl font-semibold">{cat}s</span>
                <span className="text-4xl font-bold mt-2 bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content list with enhanced styling */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent">
            {selectedCategory}s ({itemsToShow.length})
          </h2>
          
          {itemsToShow.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-gray-800/50 backdrop-blur-sm rounded-xl">
              <p className="text-lg">No {selectedCategory.toLowerCase()}s found</p>
              <p className="mt-2">Click "Upload Content" to add your first {selectedCategory.toLowerCase()}</p>
            </div>
          ) : (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700">
              <ul className="divide-y divide-gray-700/50">
                {itemsToShow.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-700/30 transition-all"
                  >
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      {item.coverUrl && (
                        <img
                          src={item.coverUrl}
                          alt={item.title}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0 ring-2 ring-gray-600"
                          loading="lazy"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={
                            selectedCategory === 'Blog'
                              ? `/blog/${item.slug}`
                              : selectedCategory === 'Book'
                              ? `/books/${item.slug}`
                              : `/products/${item.slug}`
                          }
                          legacyBehavior
                        >
                          <a className="text-orange-400 hover:text-orange-300 hover:underline block truncate font-medium">
                            {item.title}
                          </a>
                        </Link>
                        {item.author && (
                          <p className="text-sm text-gray-400 truncate">by {item.author}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          Updated {new Date(item.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button 
                        onClick={() => handleEdit(item)} 
                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item)} 
                        disabled={deleteLoading === item.id}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all disabled:opacity-50"
                        title="Delete"
                      >
                        {deleteLoading === item.id ? (
                          <RefreshCw size={18} className="animate-spin" />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Modals */}
        {modalOpen && (
          <UploadModal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setEditingItem(null);
              setEditingCategory(null);
            }}
            onSave={handleUploadSave}
            initialData={editingItem ? { ...editingItem, category: editingCategory } : {}}
          />
        )}
        
        {manageModalOpen && (
          <ManageSubscriptionsModal 
            onClose={() => setManageModalOpen(false)} 
          />
        )}

        {manageUsersModalOpen && (
          <ManageUsersModal 
            onClose={() => setManageUsersModalOpen(false)} 
          />
        )}
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </>
  );
}