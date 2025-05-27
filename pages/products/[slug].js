// pages/products/[slug].js

import Head from 'next/head';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { useState } from 'react';
import FullScreenPDFViewer from '@/components/FullScreenPDFViewer';

export async function getStaticPaths() {
  const products = await prisma.product.findMany({ select: { slug: true } });
  const paths = products.map((p) => ({ params: { slug: p.slug } }));
  return { paths, fallback: 'blocking' };
}

export async function getStaticProps({ params }) {
  const productRaw = await prisma.product.findUnique({
    where: { slug: params.slug },
  });

  if (!productRaw) {
    return { notFound: true };
  }

  // Build base S3 URL
  const bucket  = process.env.AWS_S3_BUCKET;
  const region  = process.env.AWS_REGION;
  const baseUrl = `https://${bucket}.s3.${region}.amazonaws.com`;

  // Since coverKey/pdfKey already include their folders,
  // just encodeURI to preserve the slash
  const coverUrl = productRaw.coverKey
    ? `${baseUrl}/${encodeURI(productRaw.coverKey)}`
    : null;

  const pdfUrl = productRaw.pdfKey
    ? `${baseUrl}/${encodeURI(productRaw.pdfKey)}`
    : null;

  // Serialize Dates and attach URLs
  const product = {
    ...JSON.parse(JSON.stringify(productRaw)),
    coverUrl,
    pdfUrl,
  };

  return {
    props: { product },
    revalidate: 60,
  };
}

export default function ProductDetail({ product }) {
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);

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
    datePublished: product.createdAt, // already serialized to string
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

        <h1 className="text-2xl sm:text-4xl font-bold mb-4">
          {product.title}
        </h1>
        <p className="text-gray-300 mb-1">By {product.author}</p>

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

        <FullScreenPDFViewer isOpen={pdfViewerOpen} pdfUrl={product.pdfUrl} />
      </div>
    </>
  );
}
