// pages/books/[slug].js

import Head from 'next/head'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { useState } from 'react'
import FullScreenPDFViewer from '@/components/FullScreenPDFViewer'

export async function getStaticPaths() {
  const books = await prisma.book.findMany({ select: { slug: true } })
  const paths = books.map((b) => ({ params: { slug: b.slug } }))
  return { paths, fallback: 'blocking' }
}

export async function getStaticProps({ params }) {
  const book = await prisma.book.findUnique({
    where: { slug: params.slug },
  })
  if (!book) {
    return { notFound: true }
  }

  // build full public URLs for cover image and PDF from S3
  const bucket = process.env.AWS_S3_BUCKET
  const region = process.env.AWS_REGION
  const imagesPrefix = process.env.S3_CONTENT_IMAGES_PREFIX
  const pdfsPrefix = process.env.S3_CONTENT_PDFS_PREFIX
  const baseUrl = `https://${bucket}.s3.${region}.amazonaws.com`

  let coverUrl = null
  if (book.coverKey) {
    const filename = book.coverKey.split('/').pop()
    coverUrl = `${baseUrl}/${imagesPrefix}/${encodeURIComponent(filename)}`
  }

  let pdfUrl = null
  if (book.pdfKey) {
    const filename = book.pdfKey.split('/').pop()
    pdfUrl = `${baseUrl}/${pdfsPrefix}/${encodeURIComponent(filename)}`
  }

  // Serialize dates to ISO strings for Next.js
  const serializedBook = {
    ...book,
    createdAt: book.createdAt.toISOString(),
    updatedAt: book.updatedAt.toISOString(),
    coverUrl,
    pdfUrl,
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

        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          {book.title}
        </h1>
        <p className="text-gray-300 mb-1">By {book.author}</p>
        <p className="text-gray-400 mb-4">{book.summary}</p>

        <article
          className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert mb-8"
          role="article"
        >
          {book.content.split('\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </article>

        <FullScreenPDFViewer isOpen={pdfViewerOpen} pdfUrl={book.pdfUrl} />
      </div>
    </>
  )
}
