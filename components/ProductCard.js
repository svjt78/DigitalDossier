// components/ProductCard.js
export default function ProductCard({ cover }) {
  return (
    <div
      className="rounded-xl overflow-hidden shadow-lg transition-transform hover:scale-105 hover:shadow-2xl"
      style={{ width: '200px', height: '300px' }}  // Fixed portrait dimensions
    >
      {cover && (
        <img
          src={cover}
          alt="Product Cover"
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}
