// pages/books/[slug].js
import { prisma } from '@/lib/prisma';
import { useState } from 'react';
import PDFViewerModal from '@/components/PDFViewerModal';

export async function getStaticPaths() {
  const books = await prisma.book.findMany({ select: { slug: true } });
  const paths = books.map((book) => ({ params: { slug: book.slug } }));
  return { paths, fallback: 'blocking' };
}

export async function getStaticProps({ params }) {
  const book = await prisma.book.findUnique({
    where: { slug: params.slug },
  });
  if (!book) {
    return { notFound: true };
  }
  return { props: { book: JSON.parse(JSON.stringify(book)) }, revalidate: 60 };
}

export default function BookDetail({ book }) {
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);

  return (
    <div className="max-w-4xl mx-auto">
      {book.pdfUrl ? (
        <div className="cursor-pointer" onClick={() => setPdfViewerOpen(true)}>
          {book.cover && (
            <img
              src={book.cover}
              alt={book.title}
              className="w-full rounded mb-4"
            />
          )}
          <p className="text-center text-gray-400">Click cover to view PDF</p>
        </div>
      ) : (
        book.cover && (
          <img
            src={book.cover}
            alt={book.title}
            className="w-full rounded mb-4"
          />
        )
      )}
      <h1 className="text-4xl font-bold mb-4">{book.title}</h1>
      <p className="text-gray-300 mb-2">By {book.author}</p>
      <p className="mb-4">{book.summary}</p>
      <article className="prose">
        <p>{book.content}</p>
      </article>
      <PDFViewerModal
        isOpen={pdfViewerOpen}
        pdfUrl={book.pdfUrl}
        onClose={() => setPdfViewerOpen(false)}
      />
    </div>
  );
}
