import Image from 'next/image';

export default function BlogCard({ coverUrl, title }) {
  return (
    <div className="relative rounded-xl overflow-hidden shadow-lg transition-transform hover:scale-105 hover:shadow-2xl w-full sm:w-48 md:w-56 lg:w-64 aspect-[2/3]">
      {coverUrl ? (
        <Image
          src={coverUrl}
          alt={title ? `${title} cover` : 'Blog cover'}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 25vw"
        />
      ) : (
        <div className="flex items-center justify-center bg-gray-300 w-full h-full">
          <span className="text-gray-700">No Cover Image</span>
        </div>
      )}
    </div>
  );
}
