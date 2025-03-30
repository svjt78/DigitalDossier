// components/FilterTabs.js
export default function FilterTabs() {
  return (
    <div className="mt-6 flex justify-start items-center">
      {/* Added pl-2 to shift the left group so that "All" aligns with the "D" in Digital Dossier */}
      <div className="space-x-4 pl-2">
        <button className="text-orange-400 border-b-2 border-orange-400 pb-1">All</button>
        <button className="text-gray-400 hover:text-white">Videos</button>
        <button className="text-gray-400 hover:text-white">Notes</button>
        <button className="text-gray-400 hover:text-white">To-do-list</button>
      </div>
      <div className="space-x-2 ml-auto">
        <button className="px-3 py-1 bg-orange-500 rounded-full text-sm">Popular</button>
        <button className="px-3 py-1 border border-gray-500 text-sm rounded-full text-gray-300">Recent</button>
      </div>
    </div>
  );
}
