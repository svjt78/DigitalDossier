// pages/products/[slug].js
import { prisma } from '@/lib/prisma';
import { useState } from 'react';
import PDFViewerModal from '@/components/PDFViewerModal';

export async function getStaticPaths() {
  const products = await prisma.product.findMany({ select: { slug: true } });
  const paths = products.map((product) => ({ params: { slug: product.slug } }));
  return { paths, fallback: 'blocking' };
}

export async function getStaticProps({ params }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
  });
  if (!product) {
    return { notFound: true };
  }
  return { props: { product: JSON.parse(JSON.stringify(product)) }, revalidate: 60 };
}

export default function ProductDetail({ product }) {
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);

  return (
    <div className="max-w-4xl mx-auto">
      {product.pdfUrl ? (
        <div className="cursor-pointer" onClick={() => setPdfViewerOpen(true)}>
          {product.cover && (
            <img
              src={product.cover}
              alt={product.title}
              className="w-full rounded mb-4"
            />
          )}
          <p className="text-center text-gray-400">Click cover to view PDF</p>
        </div>
      ) : (
        product.cover && (
          <img
            src={product.cover}
            alt={product.title}
            className="w-full rounded mb-4"
          />
        )
      )}
      <h1 className="text-4xl font-bold mb-4">{product.title}</h1>
      <p className="mb-4">{product.summary}</p>
      <article className="mt-4">
        <p>{product.content}</p>
      </article>
      <PDFViewerModal
        isOpen={pdfViewerOpen}
        pdfUrl={product.pdfUrl}
        onClose={() => setPdfViewerOpen(false)}
      />
    </div>
  );
}
