// pages/books/[slug].js

import Head from 'next/head'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { useState } from 'react'
import FullScreenPDFViewer from '@/components/FullScreenPDFViewer'
import VotingWidget from '@/components/VotingWidget'
import CommentsSection from '@/components/CommentsSection'

export async function getStaticPaths() {
  const books = await prisma.book.findMany({ select: { slug: true } })
  const paths = books.map((b) => ({ params: { slug: b.slug } }))
  return { paths, fallback: 'blocking' }
}

export async function getStaticProps({ params }) {
  const bookRaw = await prisma.book.findUnique({
    where: { slug: params.slug },
    include: { 
      genre: true,
      webView: true,
    },
  })
  if (!bookRaw) {
    return { notFound: true }
  }

  // build full public URLs for cover image and PDF from S3
  const bucket = process.env.AWS_S3_BUCKET
  const region = process.env.AWS_REGION
  const imagesPrefix = process.env.S3_CONTENT_IMAGES_PREFIX
  const pdfsPrefix = process.env.S3_CONTENT_PDFS_PREFIX
  const baseUrl = `https://${bucket}.s3.${region}.amazonaws.com`

  let coverUrl = null
  if (bookRaw.coverKey) {
    const filename = bookRaw.coverKey.split('/').pop()
    coverUrl = `${baseUrl}/${imagesPrefix}/${encodeURIComponent(filename)}`
  }

  let pdfUrl = null
  if (bookRaw.pdfKey) {
    const filename = bookRaw.pdfKey.split('/').pop()
    pdfUrl = `${baseUrl}/${pdfsPrefix}/${encodeURIComponent(filename)}`
  }

  // Serialize and include genre name
  const serializedBook = {
    ...bookRaw,
    genre: bookRaw.genre?.name || null,
    createdAt: bookRaw.createdAt.toISOString(),
    updatedAt: bookRaw.updatedAt.toISOString(),
    coverUrl,
    pdfUrl,
    webViewUrl: bookRaw.webView?.objectUrl || null,
    // Include voting and comment data
    netScore: bookRaw.netScore || 0,
    totalVotes: bookRaw.totalVotes || 0,
    commentCount: bookRaw.commentCount || 0,
  }

  return {
    props: {
      book: serializedBook,
    },
    revalidate: 60,
  }
}

export default function BookDetail({ book }) {
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false)
  const handleClosePdf = () => setPdfViewerOpen(false)
  const canonicalUrl = `https://yourdomain.com/books/${book.slug}` // replace with your domain
  const description = book.summary || book.content.slice(0, 155)

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    author: {
      "@type": "Person",
      name: book.author,
    },
    genre: book.genre,
    description,
    url: canonicalUrl,
    image: book.coverUrl ? [book.coverUrl] : undefined,
    datePublished: book.createdAt,
  }

  return (
    <>
      <Head>
        <title>{book.title} | Digital Dossier</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph */}
        <meta property="og:type" content="book" />
        <meta property="og:title" content={book.title} />
        <meta property="og:description" content={description} />
        {book.coverUrl && (
          <meta property="og:image" content={book.coverUrl} />
        )}
        <meta property="og:url" content={canonicalUrl} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={book.title} />
        <meta name="twitter:description" content={description} />
        {book.coverUrl && (
          <meta name="twitter:image" content={book.coverUrl} />
        )}

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {book.pdfUrl ? (
          <div
            className="cursor-pointer mb-4"
            role="button"
            tabIndex={0}
            onClick={() => setPdfViewerOpen(true)}
            onKeyPress={(e) => e.key === 'Enter' && setPdfViewerOpen(true)}
          >
            {book.coverUrl && (
              <Image
                src={book.coverUrl}
                alt={book.title}
                width={600}
                height={900}
                className="w-full rounded-lg mb-2 object-cover"
              />
            )}
            <p className="text-center text-gray-400 text-sm">
              Click cover to view PDF
            </p>
          </div>
        ) : (
          book.coverUrl && (
            <Image
              src={book.coverUrl}
              alt={book.title}
              width={600}
              height={900}
              className="w-full rounded-lg mb-4 object-cover"
            />
          )
        )}

        {/* Action buttons */}
        <div className="text-center mb-6 space-y-2">
          {book.pdfUrl && (
            <div>
              <button
                onClick={() => setPdfViewerOpen(true)}
                className="text-blue-400 text-sm underline hover:text-blue-300 transition-colors"
              >
                View PDF
              </button>
            </div>
          )}
          {book.webViewUrl && (
            <div>
              <button
                onClick={() => window.open(book.webViewUrl, '_blank', 'noopener,noreferrer')}
                className="text-green-400 text-sm underline hover:text-green-300 transition-colors"
              >
                View Interactive Web Page
              </button>
            </div>
          )}
          {!book.webViewUrl && (
            <div>
              <button
                disabled
                className="text-gray-500 text-sm cursor-not-allowed"
              >
                No Interactive Web Page Available
              </button>
            </div>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          {book.title}
        </h1>
        <p className="text-gray-300 mb-1">By {book.author}</p>
        {book.genre && <p className="text-gray-300 mb-4">Genre: {book.genre}</p>}
        <p className="text-gray-400 mb-4">{book.summary}</p>

        <article
          className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert mb-8"
          role="article"
        >
          {book.content.split('\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </article>

        {/* Voting Widget */}
        <div className="border-t border-gray-700 pt-6 mb-8">
          <VotingWidget
            contentType="book"
            contentId={book.id}
            initialNetScore={book.netScore}
            initialTotalVotes={book.totalVotes}
            className="flex justify-center"
          />
        </div>

        {/* Comments Section */}
        <div className="border-t border-gray-700 pt-8">
          <CommentsSection
            contentType="book"
            contentId={book.id}
            initialCount={book.commentCount}
          />
        </div>

        <FullScreenPDFViewer 
          isOpen={pdfViewerOpen} 
          pdfUrl={book.pdfUrl} 
          onClose={handleClosePdf}
        />
      </div>
    </>
  )
}
