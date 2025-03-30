// components/BookCard.js
export default function BookCard({ cover }) {
  return (
    <div
      className="rounded-xl overflow-hidden shadow-lg transition-transform hover:scale-105 hover:shadow-2xl"
      style={{ width: '200px', height: '300px' }}  // Fixed dimensions in portrait
    >
      {cover && (
        <img
          src={cover}
          alt="Cover Image"
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}
