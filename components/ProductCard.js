import Image from 'next/image';

export default function ProductCard({ coverUrl, title }) {
  return (
    <div
      className="
        relative
        rounded-xl
        overflow-hidden
        shadow-lg
        transition-all
        duration-300
        hover:scale-105
        hover:shadow-2xl
        hover:shadow-blue-500/20
        w-full
        sm:w-32
        md:w-40
        lg:w-48
        aspect-[3/4]
        bg-gradient-to-br from-gray-50 to-gray-100
        border
        border-gray-200/20
        backdrop-blur-sm
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
        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
          <span className="text-gray-600 text-sm font-medium">No Image</span>
        </div>
      )}

      <div className="p-3 bg-white/95 backdrop-blur-sm border-t border-gray-200/50">
        <h2 className="text-sm font-semibold text-gray-900 truncate leading-tight">
          {title}
        </h2>
      </div>
    </div>
  );
}
