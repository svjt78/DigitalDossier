// pages/_app.js
import '../styles/globals.css';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { SearchProvider } from '@/components/SearchContext';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        {/* Basic Meta */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Default Title & Description */}
        <title>Digital Dossier</title>
        <meta
          name="description"
          content="Your hub for PDFs, notes, videos, and more in a centralized digital dossier."
        />
        <link rel="canonical" href="https://yourdomain.com" />

        {/* Open Graph */}
        <meta property="og:site_name" content="Digital Dossier" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Digital Dossier" />
        <meta
          property="og:description"
          content="Your hub for PDFs, notes, videos, and more in a centralized digital dossier."
        />
        <meta property="og:url" content="https://yourdomain.com" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <SearchProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </SearchProvider>
    </>
  );
}
