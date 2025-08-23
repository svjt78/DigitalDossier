import Image from 'next/image';
import { useState } from 'react';
import SkeletonCard from './SkeletonCard';

export default function BlogCard({ coverUrl, title, loading = false, className = "" }) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  if (loading) {
    return <SkeletonCard className={className} />;
  }

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
            alt={title ? `${title} cover` : 'Blog cover'}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
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
