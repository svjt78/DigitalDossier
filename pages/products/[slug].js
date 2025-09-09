// pages/products/[slug].js

import Head from 'next/head';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { useState } from 'react';
import FullScreenPDFViewer from '@/components/FullScreenPDFViewer';
import VotingWidget from '@/components/VotingWidget';
import CommentsSection from '@/components/CommentsSection';

export async function getStaticPaths() {
  const products = await prisma.product.findMany({ select: { slug: true } });
  const paths = products.map((p) => ({ params: { slug: p.slug } }));
  return { paths, fallback: 'blocking' };
}

export async function getStaticProps({ params }) {
  const productRaw = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: { 
      genre: true,
      webView: true,
    },
  });

  if (!productRaw) {
    return { notFound: true };
  }

  // Build base S3 URL
  const bucket  = process.env.AWS_S3_BUCKET;
  const region  = process.env.AWS_REGION;
  const baseUrl = `https://${bucket}.s3.${region}.amazonaws.com`;

  // Since coverKey/pdfKey already include their folders, just encodeURI to preserve the slash
  const coverUrl = productRaw.coverKey
    ? `${baseUrl}/${encodeURI(productRaw.coverKey)}`
    : null;

  const pdfUrl = productRaw.pdfKey
    ? `${baseUrl}/${encodeURI(productRaw.pdfKey)}`
    : null;

  // Serialize Dates and attach URLs and genre
  const product = {
    ...JSON.parse(JSON.stringify(productRaw)),
    genre: productRaw.genre?.name || null,
    coverUrl,
    pdfUrl,
    webViewUrl: productRaw.webView?.objectUrl || null,
    // Include voting and comment data
    netScore: productRaw.netScore || 0,
    totalVotes: productRaw.totalVotes || 0,
    commentCount: productRaw.commentCount || 0,
  };

  return {
    props: { product },
    revalidate: 60,
  };
}

export default function ProductDetail({ product }) {
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const handleClosePdf = () => setPdfViewerOpen(false);

  const canonicalUrl = `https://yourdomain.com/products/${product.slug}`;
  const description = product.summary || product.content?.slice(0, 155) || '';

  // JSON-LD for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description,
    url: canonicalUrl,
    image: product.coverUrl ? [product.coverUrl] : undefined,
    datePublished: product.createdAt,
    genre: product.genre,
  };

  return (
    <>
      <Head>
        <title>{product.title} | Digital Dossier</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="product" />
        <meta property="og:title" content={product.title} />
        <meta property="og:description" content={description} />
        {product.coverUrl && (
          <meta property="og:image" content={product.coverUrl} />
        )}
        <meta property="og:url" content={canonicalUrl} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={product.title} />
        <meta name="twitter:description" content={description} />
        {product.coverUrl && (
          <meta name="twitter:image" content={product.coverUrl} />
        )}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <div className="w-full px-4 sm:px-6 lg:px-8 mx-auto max-w-full sm:max-w-xl lg:max-w-3xl">
        {product.coverUrl ? (
          <div className="mb-6">
            <Image
              src={product.coverUrl}
              alt={product.title}
              width={600}
              height={900}
              className="w-full rounded-lg mb-2 object-cover cursor-pointer"
              onClick={() => setPdfViewerOpen(true)}
            />
            {product.pdfUrl && (
              <p className="text-center text-gray-400 text-sm">
                Tap cover to view PDF
              </p>
            )}
          </div>
        ) : (
          product.pdfUrl && (
            <div className="mb-6 text-center">
              <button
                onClick={() => setPdfViewerOpen(true)}
                className="text-gray-400 text-sm underline"
              >
                View PDF
              </button>
            </div>
          )
        )}

        {/* Action buttons */}
        <div className="text-center mb-6 space-y-2">
          {product.pdfUrl && (
            <div>
              <button
                onClick={() => setPdfViewerOpen(true)}
                className="text-blue-400 text-sm underline hover:text-blue-300 transition-colors"
              >
                View PDF
              </button>
            </div>
          )}
          {product.webViewUrl && (
            <div>
              <button
                onClick={() => window.open(product.webViewUrl, '_blank', 'noopener,noreferrer')}
                className="text-green-400 text-sm underline hover:text-green-300 transition-colors"
              >
                View Interactive Web Page
              </button>
            </div>
          )}
          {!product.webViewUrl && (
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

        <h1 className="text-2xl sm:text-4xl font-bold mb-4">
          {product.title}
        </h1>
        <p className="text-gray-300 mb-1">By {product.author}</p>
        {product.genre && <p className="text-gray-300 mb-4">Genre: {product.genre}</p>}

        {product.summary && (
          <p className="mb-4 text-base sm:text-lg text-gray-700">
            {product.summary}
          </p>
        )}

        {product.content && (
          <article className="prose prose-invert max-w-full mb-8" role="article">
            {product.content.split('\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </article>
        )}

        {/* Voting Widget */}
        <div className="border-t border-gray-700 pt-6 mb-8">
          <VotingWidget
            contentType="product"
            contentId={product.id}
            initialNetScore={product.netScore}
            initialTotalVotes={product.totalVotes}
            className="flex justify-center"
          />
        </div>

        {/* Comments Section */}
        <div className="border-t border-gray-700 pt-8">
          <CommentsSection
            contentType="product"
            contentId={product.id}
            initialCount={product.commentCount}
          />
        </div>

        <FullScreenPDFViewer 
          isOpen={pdfViewerOpen} 
          pdfUrl={product.pdfUrl} 
          onClose={handleClosePdf}
        />
      </div>
    </>
  );
}
