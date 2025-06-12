import Image from 'next/image';

export default function BlogCard({ coverUrl, title }) {
  return (
    <div
      className="
        relative
        rounded-lg
        overflow-hidden
        shadow-md
        transition-transform
        hover:scale-105
        hover:shadow-lg
        w-full
        sm:w-32
        md:w-40
        lg:w-48
        aspect-[3/4]
      "
    >
      {coverUrl ? (
        <Image
          src={coverUrl}
          alt={title ? `${title} cover` : 'Blog cover'}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 20vw"
        />
      ) : (
        <div className="flex items-center justify-center bg-gray-300 w-full h-full">
          <span className="text-gray-700 text-sm">No Cover Image</span>
        </div>
      )}
    </div>
  );
}
