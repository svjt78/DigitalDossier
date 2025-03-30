// components/UploadModal.js
import { useState, useEffect } from 'react';

export default function UploadModal({ isOpen, onClose, onSave, initialData = {} }) {
  const [category, setCategory] = useState(initialData.category || '');
  const [title, setTitle] = useState(initialData.title || '');
  const [author, setAuthor] = useState(initialData.author || '');
  const [genre, setGenre] = useState(initialData.genre || '');
  const [content, setContent] = useState(initialData.content || '');
  const [coverImage, setCoverImage] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);

  // Reset fields when modal is opened
  useEffect(() => {
    if (isOpen) {
      setCategory(initialData.category || '');
      setTitle(initialData.title || '');
      setAuthor(initialData.author || '');
      setGenre(initialData.genre || '');
      setContent(initialData.content || '');
      setCoverImage(null);
      setPdfFile(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCoverImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCoverImage(e.target.files[0]);
    }
  };

  const handlePdfChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('author', author);
    formData.append('category', category);
    formData.append('genre', genre);
    
    // If a PDF is uploaded, it overrides any text content
    if (pdfFile) {
      formData.append('content', '');
      formData.append('pdfFile', pdfFile);
    } else {
      formData.append('content', content);
    }

    if (coverImage) {
      formData.append('coverImage', coverImage);
    }

    await onSave(formData);
  };

  return (
    // Outer backdrop with flex centering
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      {/* 
        - max-w-xl ensures a good width on larger screens
        - w-full for responsive scaling on smaller screens
        - max-h-[80vh] with overflow-y-auto to scroll if content is too tall
        - shadow-lg for a modern, elevated look
      */}
      <div className="bg-gray-800 p-6 rounded-md shadow-lg max-w-xl w-full max-h-[80vh] overflow-y-auto text-white">
        <h2 className="text-xl font-bold mb-4">Upload Content</h2>
        <div className="mb-4">
          <label className="block mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded text-white"
          >
            <option value="">Select Category</option>
            <option value="Blog">Blog</option>
            <option value="Book">Book</option>
            <option value="Product">Product</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded text-white"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">Author</label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded text-white"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">Genre</label>
          <input
            type="text"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded text-white"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">
            Content (Enter text or leave blank if uploading PDF)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="4"
            className="w-full p-2 bg-gray-700 rounded text-white"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">Cover Image (PNG, JPEG)</label>
          <input
            type="file"
            accept="image/png, image/jpeg"
            onChange={handleCoverImageChange}
            className="w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">PDF Upload (Overrides text content)</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={handlePdfChange}
            className="w-full"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
