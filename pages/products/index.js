// pages/products/index.js

import Head from 'next/head'
import Link from 'next/link'
import { useMemo } from 'react'
import { useSearchQuery } from '@/components/SearchContext'
import { prisma } from '@/lib/prisma'
import ProductCard from '@/components/ProductCard'

export async function getStaticProps() {
  // fetch raw product records, newest first
  const rawProducts = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
  })

  // S3 configuration
  const bucket  = process.env.AWS_S3_BUCKET
  const region  = process.env.AWS_REGION
  const baseUrl = `https://${bucket}.s3.${region}.amazonaws.com`

  // map each product to include full URLs & safe description
  const products = rawProducts.map(product => ({
    id:          product.id,
    slug:        product.slug,
    title:       product.title,
    coverUrl:    product.coverKey
      ? `${baseUrl}/${encodeURI(product.coverKey)}`
      : null,
    pdfUrl:      product.pdfKey
      ? `${baseUrl}/${encodeURI(product.pdfKey)}`
      : null,
    description: product.description ?? '',
  }))

  return {
    props: {
      products: JSON.parse(JSON.stringify(products)),
    },
    revalidate: 60,
  }
}

export default function ProductsPage({ products }) {
  // read search text from the shared header search box
  const searchQuery = useSearchQuery().trim().toLowerCase()

  // client-side filter by searchQuery (case-insensitive, partial match)
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products
    return products.filter(prod =>
      [prod.title, prod.description]
        .some(field => field.toLowerCase().includes(searchQuery))
    )
  }, [products, searchQuery])

  const canonicalUrl = 'https://yourdomain.com/products'
  const pageTitle   = 'Products | Digital Dossier'
  const description =
    'Explore the latest products available in the Digital Dossier collection.'

  // JSON-LD for an ItemList
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: filteredProducts.map((p, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${canonicalUrl}/${p.slug}`,
    })),
  }

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph */}
        <meta property="og:type"        content="website" />
        <meta property="og:title"       content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:url"         content={canonicalUrl} />

        {/* Twitter Card */}
        <meta name="twitter:card"        content="summary_large_image" />
        <meta name="twitter:title"       content={pageTitle} />
        <meta name="twitter:description" content={description} />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      {/* Constrain width and match Books/Blog pages */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 lg:py-8">
        <h1 className="text-3xl font-bold mb-6">Products</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {filteredProducts.map(product => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              legacyBehavior
            >
              <a className="block">
                <ProductCard
                  coverUrl={product.coverUrl}
                  title={product.title}
                />
              </a>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
