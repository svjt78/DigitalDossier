// pages/blog/index.js
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import BlogCard from '@/components/BlogCard';

export async function getStaticProps() {
  const blogs = await prisma.blog.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return {
    props: { blogs: JSON.parse(JSON.stringify(blogs)) },
    revalidate: 60,
  };
}

export default function BlogPage({ blogs }) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Blog Posts</h1>
      <div className="grid grid-cols-4 gap-x-0 gap-y-4">
        {blogs.map((blog) => (
          <Link key={blog.id} href={`/blog/${blog.slug}`} className="block">
            <BlogCard cover={blog.cover} />
          </Link>
        ))}
      </div>
    </div>
  );
}
