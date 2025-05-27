// components/ProductCard.js
import Image from 'next/image'

export default function ProductCard({ coverUrl, title }) {
  return (
    <div className="rounded-xl overflow-hidden shadow-lg transition-transform hover:scale-105 hover:shadow-2xl w-full aspect-[2/3] bg-gray-100">
      {coverUrl ? (
        <Image
          src={coverUrl}
          alt={title}
          width={224}
          height={336}
          className="object-cover w-full h-full"
        />
      ) : (
        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
          <span className="text-gray-700 text-sm">No Image</span>
        </div>
      )}
      <div className="p-2 bg-white">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>
    </div>
  )
}
