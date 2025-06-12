import Image from 'next/image';

export default function ProductCard({ coverUrl, title }) {
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
        bg-gray-100
      "
    >
      {coverUrl ? (
        <Image
          src={coverUrl}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 20vw"
        />
      ) : (
        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
          <span className="text-gray-700 text-sm">No Image</span>
        </div>
      )}

      <div className="p-2 bg-white">
        <h2 className="text-base font-semibold text-gray-900 truncate">
          {title}
        </h2>
      </div>
    </div>
  );
}
