// components/SkeletonDashboard.js
export default function SkeletonDashboard() {
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 animate-fade-in">
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="h-10 bg-gradient-to-r from-gray-300/50 to-gray-400/50 rounded-lg w-96 animate-pulse"></div>
      </div>

      {/* Action buttons skeleton */}
      <div className="flex flex-wrap justify-end mb-6 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-10 w-40 bg-gradient-to-r from-gray-300/50 to-gray-400/50 rounded-lg animate-pulse"
          ></div>
        ))}
      </div>

      {/* Category cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="aspect-square p-6 rounded-xl shadow-xl border border-gray-600/50 bg-gradient-to-br from-gray-800/80 to-gray-700/80 backdrop-blur-sm animate-pulse"
          >
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="h-6 w-16 bg-gray-600 rounded animate-pulse"></div>
              <div className="h-12 w-12 bg-gray-600 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Content list skeleton */}
      <div className="space-y-4">
        <div className="h-8 bg-gradient-to-r from-gray-300/50 to-gray-400/50 rounded w-48 animate-pulse"></div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 border-b border-gray-700/50 last:border-b-0"
            >
              <div className="flex items-center space-x-4 flex-1">
                <div className="w-12 h-12 bg-gray-600 rounded-lg animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-600 rounded w-3/4 animate-pulse"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-600 rounded animate-pulse"></div>
                <div className="w-8 h-8 bg-gray-600 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
