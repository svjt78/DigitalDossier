// pages/index.js
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

const badgeClasses = {
  Blog: 'bg-orange-500',
  Book: 'bg-blue-500',
  Product: 'bg-green-500',
};

export async function getStaticProps() {
  const [blogs, books, products] = await Promise.all([
    prisma.blog.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.book.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.product.findMany({ orderBy: { createdAt: 'desc' } }),
  ]);

  // Annotate each record with its type
  const blogsWithType = blogs.map((item) => ({ ...item, type: 'Blog' }));
  const booksWithType = books.map((item) => ({ ...item, type: 'Book' }));
  const productsWithType = products.map((item) => ({ ...item, type: 'Product' }));

  // Merge arrays and sort by createdAt descending
  const merged = [...blogsWithType, ...booksWithType, ...productsWithType].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return {
    props: { items: JSON.parse(JSON.stringify(merged)) },
    revalidate: 60,
  };
}

export default function HomePage({ items }) {
  return (
    <div className="min-h-screen bg-gray-800">
      <div className="max-w-7xl mx-auto px-0 py-8">
        <h1 className="text-4xl font-bold mb-6 text-white">Content Hub</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-0 gap-y-4">
          {items.map((item) => {
            // Determine the detail page URL based on type
            let detailUrl = '';
            if (item.type === 'Blog') detailUrl = `/blog/${item.slug}`;
            else if (item.type === 'Book') detailUrl = `/books/${item.slug}`;
            else if (item.type === 'Product') detailUrl = `/products/${item.slug}`;

            return (
              <Link key={`${item.type}-${item.id}`} href={detailUrl} className="block relative">
                <div
                  className="rounded-xl overflow-hidden shadow-lg transition-transform hover:scale-105 hover:shadow-2xl"
                  style={{ width: '200px', height: '300px' }}
                >
                  {item.cover ? (
                    <img
                      src={item.cover}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                      No Image
                    </div>
                  )}
                </div>
                <div className="absolute top-2 left-2">
                  <span className={`text-white text-xs font-bold px-2 py-1 rounded ${badgeClasses[item.type]}`}>
                    {item.type}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
