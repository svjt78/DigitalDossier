// pages/dashboard.js
import { prisma } from '@/lib/prisma';
import { useState } from 'react';
import Link from 'next/link';
import UploadModal from '@/components/UploadModal';

export async function getServerSideProps() {
  try {
    const [blogs, books, products] = await Promise.all([
      prisma.blog.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.book.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.product.findMany({ orderBy: { createdAt: 'desc' } }),
    ]);

    // Make sure each array is defined before serializing
    return {
      props: {
        blogs: JSON.parse(JSON.stringify(blogs || [])),
        books: JSON.parse(JSON.stringify(books || [])),
        products: JSON.parse(JSON.stringify(products || [])),
      },
    };
  } catch (error) {
    console.error("Error fetching data", error);
    return {
      props: {
        blogs: [],
        books: [],
        products: [],
      },
    };
  }
}

export default function Dashboard({ blogs = [], books = [], products = [] }) {
  // Defensive assignment to ensure we always have arrays
  const initialBlogs = Array.isArray(blogs) ? blogs : [];
  const initialBooks = Array.isArray(books) ? books : [];
  const initialProducts = Array.isArray(products) ? products : [];

  const [modalOpen, setModalOpen] = useState(false);
  const [localBlogs, setLocalBlogs] = useState(initialBlogs);
  const [localBooks, setLocalBooks] = useState(initialBooks);
  const [localProducts, setLocalProducts] = useState(initialProducts);

  const handleUploadSave = async (formData) => {
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const result = await res.json();
        const { data } = result;
        if (data && data.id) {
          if (data.hasOwnProperty('content')) {
            // Blog post
            setLocalBlogs([data, ...localBlogs]);
          } else if (data.hasOwnProperty('author')) {
            // Book
            setLocalBooks([data, ...localBooks]);
          } else if (data.hasOwnProperty('price')) {
            // Product
            setLocalProducts([data, ...localProducts]);
          }
        }
        setModalOpen(false);
      } else {
        alert('Upload failed');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred during upload');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Upload
        </button>
      </div>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Blogs</h2>
        <ul className="space-y-2">
          {localBlogs.map((blog) => (
            <li key={blog.id}>
              <Link href={`/blog/${blog.slug}`} className="text-orange-400 hover:underline">
                {blog.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Books</h2>
        <ul className="space-y-2">
          {localBooks.map((book) => (
            <li key={book.id}>
              <Link href={`/books/${book.slug}`} className="text-orange-400 hover:underline">
                {book.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Products</h2>
        <ul className="space-y-2">
          {localProducts.map((product) => (
            <li key={product.id}>
              <Link href={`/products/${product.slug}`} className="text-orange-400 hover:underline">
                {product.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <div>
        <Link href="/dashboard/edit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Manage Content
        </Link>
      </div>
      <UploadModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleUploadSave}
      />
    </div>
  );
}
