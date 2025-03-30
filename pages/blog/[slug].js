// pages/blog/[slug].js
import { prisma } from '@/lib/prisma';
import { useState, useEffect } from 'react';
import PDFViewerModal from '@/components/PDFViewerModal';

export async function getStaticPaths() {
  const blogs = await prisma.blog.findMany({ select: { slug: true } });
  const paths = blogs.map((blog) => ({ params: { slug: blog.slug } }));
  return { paths, fallback: 'blocking' };
}

export async function getStaticProps({ params }) {
  const blog = await prisma.blog.findUnique({
    where: { slug: params.slug },
  });
  if (!blog) {
    return { notFound: true };
  }
  return { props: { blog: JSON.parse(JSON.stringify(blog)) }, revalidate: 60 };
}

export default function BlogDetail({ blog }) {
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);

  useEffect(() => {
    console.log("BlogDetail - pdfUrl:", blog.pdfUrl);
  }, [blog.pdfUrl]);

  const handleOpenPdf = () => {
    console.log("Cover clicked - opening PDF modal");
    setPdfViewerOpen(true);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {blog.pdfUrl ? (
        <div className="cursor-pointer" onClick={handleOpenPdf}>
          {blog.cover && (
            <img
              src={blog.cover}
              alt={blog.title}
              className="w-full rounded mb-4"
              onClick={handleOpenPdf}  // Attach onClick to image as well
            />
          )}
          <p className="text-center text-gray-400">Click cover to view PDF</p>
        </div>
      ) : (
        blog.cover && (
          <img
            src={blog.cover}
            alt={blog.title}
            className="w-full rounded mb-4"
          />
        )
      )}
      <h1 className="text-4xl font-bold mb-4">{blog.title}</h1>
      <p className="mb-4 text-gray-400">{blog.summary}</p>
      <article className="prose prose-invert">
        <p>{blog.content}</p>
      </article>
      <PDFViewerModal
        isOpen={pdfViewerOpen}
        pdfUrl={blog.pdfUrl}
        onClose={() => setPdfViewerOpen(false)}
      />
    </div>
  );
}
