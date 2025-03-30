// pages/books/index.js
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import BookCard from '@/components/BookCard';

export async function getStaticProps() {
  const books = await prisma.book.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return {
    props: { books: JSON.parse(JSON.stringify(books)) },
    revalidate: 60,
  };
}

export default function BooksPage({ books }) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Books</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-0 gap-y-4">
        {books.map((book) => (
          <Link key={book.id} href={`/books/${book.slug}`} className="block">
            <BookCard cover={book.cover} />
          </Link>
        ))}
      </div>
    </div>
  );
}
