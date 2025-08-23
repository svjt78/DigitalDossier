// components/SkeletonList.js
export default function SkeletonList({ items = 6, className = "" }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-gray-700/50 animate-pulse"
        >
          <div className="flex items-center space-x-4 flex-1">
            <div className="w-12 h-12 bg-gray-600 rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-600 rounded w-3/4"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              <div className="h-3 bg-gray-700 rounded w-1/3"></div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-600 rounded"></div>
            <div className="w-8 h-8 bg-gray-600 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
