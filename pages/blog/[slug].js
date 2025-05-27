// pages/blog/[slug].js

import Head from 'next/head';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { useState } from 'react';
import FullScreenPDFViewer from '@/components/FullScreenPDFViewer';

export async function getStaticPaths() {
  const blogs = await prisma.blog.findMany({ select: { slug: true } });
  const paths = blogs.map((b) => ({ params: { slug: b.slug } }));
  return { paths, fallback: 'blocking' };
}

export async function getStaticProps({ params }) {
  const blogRaw = await prisma.blog.findUnique({ where: { slug: params.slug } });
  if (!blogRaw) {
    return { notFound: true };
  }

  const bucket       = process.env.AWS_S3_BUCKET;
  const region       = process.env.AWS_REGION;
  const imagesPrefix = process.env.S3_CONTENT_IMAGES_PREFIX;
  const pdfPrefix    = process.env.S3_CONTENT_PDFS_PREFIX;
  const baseUrl      = `https://${bucket}.s3.${region}.amazonaws.com`;

  const coverUrl = blogRaw.coverKey
    ? `${baseUrl}/${imagesPrefix}/${blogRaw.coverKey
        .split('/')
        .pop()
        .split('/')
        .map(encodeURIComponent)
        .join('/')}`
    : null;

  const pdfUrl = blogRaw.pdfKey
    ? `${baseUrl}/${pdfPrefix}/${blogRaw.pdfKey
        .split('/')
        .pop()
        .split('/')
        .map(encodeURIComponent)
        .join('/')}`
    : null;

  return {
    props: {
      blog: {
        id:        blogRaw.id,
        title:     blogRaw.title,
        slug:      blogRaw.slug,
        author:    blogRaw.author,
        genre:     blogRaw.genre,
        summary:   blogRaw.summary,
        content:   blogRaw.content,
        coverUrl,
        pdfUrl,
        createdAt: blogRaw.createdAt.toISOString(),    // serialized for Next.js :contentReference[oaicite:0]{index=0}
        updatedAt: blogRaw.updatedAt.toISOString(),
      }
    },
    revalidate: 60,
  };
}

export default function BlogDetail({ blog }) {
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const handleOpenPdf = () => setPdfViewerOpen(true);

  const canonicalUrl = `https://yourdomain.com/blog/${blog.slug}`;
  const description  = blog.summary || blog.content.slice(0, 155);

  const jsonLd = {
    "@context":       "https://schema.org",
    "@type":          "BlogPosting",
    headline:         blog.title,
    image:            blog.coverUrl ? [blog.coverUrl] : undefined,
    author:           { "@type": "Person", name: blog.author },
    datePublished:    blog.createdAt,
    dateModified:     blog.updatedAt,
    description,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
  };

  return (
    <>
      <Head>
        <title>{blog.title} | Digital Dossier</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="article" />
        <meta property="og:title" content={blog.title} />
        <meta property="og:description" content={description} />
        {blog.coverUrl && <meta property="og:image" content={blog.coverUrl} />}
        <meta property="og:url" content={canonicalUrl} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={blog.title} />
        <meta name="twitter:description" content={description} />
        {blog.coverUrl && <meta name="twitter:image" content={blog.coverUrl} />}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <div className="w-full px-4 sm:px-8 mx-auto max-w-full sm:max-w-xl lg:max-w-3xl">
        {/* Cover image: only this element is clickable */}
        {blog.coverUrl && (
          <div
            className="cursor-pointer mb-6"
            role="button"
            tabIndex={0}
            onClick={handleOpenPdf}
            onKeyPress={(e) => e.key === 'Enter' && handleOpenPdf()}
          >
            <Image
              src={blog.coverUrl}
              alt={blog.title}
              width={800}
              height={533}
              className="w-full rounded-md object-cover"
            />
          </div>
        )}

        {/* Separate PDF button, so text clicks don’t propagate to the image */}
        {blog.pdfUrl && (
          <div className="text-center mb-6">
            <button
              onClick={handleOpenPdf}
              className="text-gray-400 text-sm underline"
            >
              View PDF
            </button>
          </div>
        )}

        <h1 className="text-3xl sm:text-4xl font-bold mb-4">{blog.title}</h1>
        <p className="text-gray-300 mb-1">By {blog.author}</p>
        {blog.summary && <p className="mb-6 text-gray-400">{blog.summary}</p>}

        <article className="prose prose-invert max-w-none mb-8" role="article">
          <p>{blog.content}</p>
        </article>

        <FullScreenPDFViewer isOpen={pdfViewerOpen} pdfUrl={blog.pdfUrl} />
      </div>
    </>
  );
}
