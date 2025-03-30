// pages/products/index.js
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';

export async function getStaticProps() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return {
    props: { products: JSON.parse(JSON.stringify(products)) },
    revalidate: 60,
  };
}

export default function ProductsPage({ products }) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-0 gap-y-4">
        {products.map((product) => (
          <Link key={product.id} href={`/products/${product.slug}`} className="block">
            <ProductCard cover={product.cover} />
          </Link>
        ))}
      </div>
    </div>
  );
}
