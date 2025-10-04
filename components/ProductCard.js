import Image from 'next/image';
import { useState } from 'react';

export default function ProductCard({ coverUrl, title, loading = false, className = "" }) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`
        group relative
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
        border
        border-gray-200/20
        backdrop-blur-sm
        cursor-pointer
        ${className}
      `}
    >
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
      
      {coverUrl && !imageError ? (
        <>
          {imageLoading && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
          )}
          <Image
            src={coverUrl}
            alt={title ? `${title} cover` : 'Product cover'}
            fill
            className={`object-cover transition-opacity duration-300 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            sizes="(max-width: 640px) 100vw, 20vw"
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
          />
        </>
      ) : (
        <div className="flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 w-full h-full">
          <div className="text-center p-4">
            <div className="w-8 h-8 mx-auto mb-2 bg-gray-400 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-gray-600 text-xs font-medium">No Cover Image</span>
          </div>
        </div>
      )}
      
      {/* Title overlay on hover */}
      {title && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          <p className="text-white text-sm font-medium truncate">{title}</p>
        </div>
      )}
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent z-30" />
    </div>
  );
}
