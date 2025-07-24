// pages/dashboard.js

import Head from 'next/head';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { useState } from 'react';
import UploadModal from '@/components/UploadModal';
import ManageSubscriptionsModal from '@/components/ManageSubscriptionsModal';
import { Edit2, Trash2 } from 'lucide-react';

export async function getServerSideProps() {
  try {
    // fetch raw records from DB
    const [blogs, books, products] = await Promise.all([
      prisma.blog.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.book.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.product.findMany({ orderBy: { createdAt: 'desc' } }),
    ]);

    // pull S3 config from env
    const bucket = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_REGION;

    // helper to build a correct S3 URL from a stored key
    const buildUrl = (key) =>
      `https://${bucket}.s3.${region}.amazonaws.com/${encodeURI(key)}`;

    // map each record to include full coverUrl/pdfUrl
    const mapUrls = (item) => ({
      ...item,
      coverUrl: item.coverKey ? buildUrl(item.coverKey) : null,
      pdfUrl:   item.pdfKey   ? buildUrl(item.pdfKey)   : null,
    });

    return {
      props: {
        blogs:    JSON.parse(JSON.stringify(blogs.map(mapUrls))),
        books:    JSON.parse(JSON.stringify(books.map(mapUrls))),
        products: JSON.parse(JSON.stringify(products.map(mapUrls))),
      },
    };
  } catch (error) {
    console.error('Error fetching data', error);
    return {
      props: { blogs: [], books: [], products: [] },
    };
  }
}

export default function Dashboard({ blogs = [], books = [], products = [] }) {
  // modal + local state
  const [modalOpen, setModalOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [localBlogs, setLocalBlogs] = useState(blogs);
  const [localBooks, setLocalBooks] = useState(books);
  const [localProducts, setLocalProducts] = useState(products);

  // filtering & edit/delete state
  const [selectedCategory, setSelectedCategory] = useState('Blog');
  const [editingItem, setEditingItem] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  // select which panel to show
  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    setEditingItem(null);
    setEditingCategory(null);
  };

  // open modal in edit mode
  const handleEdit = (item) => {
    setEditingItem(item);
    setEditingCategory(selectedCategory);
    setModalOpen(true);
  };

  // delete via API + remove from state
  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete this ${selectedCategory.toLowerCase()}?`)) {
      return;
    }
    try {
      const res = await fetch(
        `/api/content/${selectedCategory.toLowerCase()}/${item.id}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('Delete failed');

      if (selectedCategory === 'Blog') {
        setLocalBlogs(localBlogs.filter(b => b.id !== item.id));
      } else if (selectedCategory === 'Book') {
        setLocalBooks(localBooks.filter(b => b.id !== item.id));
      } else {
        setLocalProducts(localProducts.filter(p => p.id !== item.id));
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting item.');
    }
  };

  // handle both create & update saves
  const handleUploadSave = (savedItem) => {
    if (!savedItem) {
      setModalOpen(false);
      setEditingItem(null);
      setEditingCategory(null);
      return;
    }

    if (editingItem) {
      // update existing
      if (editingCategory === 'Blog') {
        setLocalBlogs(localBlogs.map(b => b.id === savedItem.id ? savedItem : b));
      } else if (editingCategory === 'Book') {
        setLocalBooks(localBooks.map(b => b.id === savedItem.id ? savedItem : b));
      } else {
        setLocalProducts(localProducts.map(p => p.id === savedItem.id ? savedItem : p));
      }
    } else {
      // new item
      if (savedItem.slug && 'content' in savedItem) {
        setLocalBlogs([savedItem, ...localBlogs]);
      } else if (savedItem.slug && 'summary' in savedItem && !('content' in savedItem)) {
        setLocalBooks([savedItem, ...localBooks]);
      } else {
        setLocalProducts([savedItem, ...localProducts]);
      }
    }

    setModalOpen(false);
    setEditingItem(null);
    setEditingCategory(null);
  };

  // pick items-to-show based on selectedCategory
  const itemsToShow =
    selectedCategory === 'Blog' ? localBlogs
    : selectedCategory === 'Book' ? localBooks
    :                              localProducts;

  return (
    <>
      <Head>
        <title>Admin Dashboard | Digital Dossier</title>
        <meta name="description" content="Manage blogs, books, and products in the Digital Dossier admin dashboard." />
      </Head>

      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">
          Admin Dashboard | Digital Dossier
        </h1>

        {/* Upload + Create with Canva + Manage Subscriptions buttons */}
        <div className="flex justify-end mb-6 space-x-2">
          <button
            onClick={() => { setEditingItem(null); setEditingCategory(null); setModalOpen(true); }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Upload
          </button>
          <button disabled className="px-4 py-2 bg-gray-400 text-white rounded">
            Create with Canva
          </button>
          <button
            onClick={() => setManageModalOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Manage Subscriptions
          </button>
        </div>

        {/* Category cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {['Blog', 'Book', 'Product'].map((cat) => {
            const count =
              cat === 'Blog' ? localBlogs.length
              : cat === 'Book' ? localBooks.length
              : localProducts.length;
            const isSelected = selectedCategory === cat;
            return (
              <div
                key={cat}
                onClick={() => handleSelectCategory(cat)}
                className={`cursor-pointer aspect-square p-6 rounded shadow flex flex-col items-center justify-center ${isSelected ? 'bg-blue-900 text-white' : 'bg-gray-900 text-white'}`}
              >
                <span className="text-xl font-semibold">{cat}s</span>
                <span className="text-3xl font-bold mt-2">{count}</span>
              </div>
            );
          })}
        </div>

        {/* Filtered list */}
        <div className="space-y-4">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-4">{selectedCategory}s</h2>
          <ul className="space-y-2">
            {itemsToShow.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between p-2 border rounded"
              >
                <div className="flex items-center space-x-4">
                  {item.coverUrl && (
                    <img
                      src={item.coverUrl}
                      alt={item.title}
                      className="w-12 h-12 rounded object-cover"
                    />
                  )}
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
                    <a className="text-orange-400 hover:underline">{item.title}</a>
                  </Link>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => handleEdit(item)} className="p-1 hover:text-blue-500">
                    <Edit2 size={20} />
                  </button>
                  <button onClick={() => handleDelete(item)} className="p-1 hover:text-red-500">
                    <Trash2 size={20} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Modals */}
        {modalOpen && (
          <UploadModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onSave={handleUploadSave}
            initialData={editingItem ? { ...editingItem, category: editingCategory } : {}}
          />
        )}
        {manageModalOpen && (
          <ManageSubscriptionsModal onClose={() => setManageModalOpen(false)} />
        )}
      </div>
    </>
  );
}
