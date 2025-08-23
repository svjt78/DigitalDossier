// components/SkeletonCard.js
export default function SkeletonCard({ className = "" }) {
  return (
    <div
      className={`
        relative
        rounded-xl
        overflow-hidden
        shadow-lg
        w-full
        sm:w-32
        md:w-40
        lg:w-48
        aspect-[3/4]
        border
        border-gray-200/20
        backdrop-blur-sm
        animate-pulse
        ${className}
      `}
    >
      {/* Image placeholder */}
      <div className="w-full h-3/4 bg-gradient-to-br from-gray-200 to-gray-300">
        <div className="w-full h-full bg-gray-300 animate-pulse"></div>
      </div>
      
      {/* Title placeholder */}
      <div className="p-3 bg-white/95 backdrop-blur-sm border-t border-gray-200/50">
        <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
      </div>
    </div>
  );
}
