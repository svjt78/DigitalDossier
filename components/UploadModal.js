import { useState, useEffect } from 'react';
import GenreSelector from './GenreSelector';

export default function UploadModal({ isOpen, onClose, onSave, initialData = {} }) {
  const data = initialData ?? {};
  const isEditMode = Boolean(data.id);

  const [category, setCategory] = useState(data.category || '');
  const [title, setTitle] = useState(data.title || '');
  const [author, setAuthor] = useState(data.author || '');
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [content, setContent] = useState(data.content || '');
  const [coverImage, setCoverImage] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Initialize genre selection for edit mode
  useEffect(() => {
    if (isEditMode && initialData.genreId && initialData.genre) {
      setSelectedGenre({
        value: initialData.genreId,
        label: initialData.genre,
        name: initialData.genre
      });
    }
  }, [isEditMode, initialData.genreId, initialData.genre]);

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setCategory(data.category || '');
      setTitle(data.title || '');
      setAuthor(data.author || '');
      setContent(data.content || '');
      setCoverImage(null);
      setPdfFile(null);
      setError('');
      setFieldErrors({});
      // Only clear genre when creating new, preserve on edit
      if (!isEditMode) {
        setSelectedGenre(null);
      }
    }
  }, [isOpen, data, isEditMode]);

  if (!isOpen) return null;

  const handleCoverImageChange = (e) => {
    const file = e.target.files?.[0];
    setCoverImage(file);
    if (file) setFieldErrors(prev => ({ ...prev, coverImage: '' }));
  };

  const handlePdfChange = (e) => {
    const file = e.target.files?.[0];
    setPdfFile(file);
    if (file) setFieldErrors(prev => ({ ...prev, pdfFile: '' }));
  };

  const handleGenreChange = (selectedOption) => {
    setSelectedGenre(selectedOption);
    // Clear genre error when a valid selection is made
    if (selectedOption && fieldErrors.genre) {
      setFieldErrors(prev => ({ ...prev, genre: '' }));
    }
  };

  const clearGenreError = () => {
    setFieldErrors(prev => ({ ...prev, genre: '' }));
  };

  const handleSave = async () => {
    setError('');
    const errors = {};
    if (!category) errors.category = 'Category is required.';
    if (!title.trim()) errors.title = 'Title is required.';
    if (!selectedGenre) errors.genre = 'Genre is required.';
    if (!isEditMode && !coverImage) errors.coverImage = 'Cover image is required.';
    if (!isEditMode && !pdfFile) errors.pdfFile = 'PDF file is required.';

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('author', author);
      // Only send category when creating new
      if (!isEditMode) {
        formData.append('category', category);
      }
      formData.append('genreId', selectedGenre.value);
      formData.append('content', pdfFile ? '' : content);
      if (coverImage) formData.append('coverImage', coverImage);
      if (pdfFile) formData.append('pdfFile', pdfFile);

      const url = isEditMode
        ? `/api/content/${category.toLowerCase()}/${data.id}`
        : '/api/upload';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, { method, body: formData });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      const payload = await res.json();
      onSave(payload.data);
      onClose();
    } catch (err) {
      console.error('UploadModal error:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-gray-800 p-6 rounded-md shadow-lg w-full max-w-md max-h-[80vh] overflow-y-auto text-white">
        <h2 className="text-xl font-bold mb-4">
          {isEditMode ? 'Edit Content' : 'Upload Content'}
        </h2>
        {error && <div className="mb-4 text-red-400">{error}</div>}

        {/* Category */}
        <div className="mb-4">
          <label className="block mb-1">Category*</label>
          <select
            value={category}
            onChange={e => {
              setCategory(e.target.value);
              setFieldErrors(prev => ({ ...prev, category: '' }));
            }}
            disabled={isEditMode}
            className={`w-full p-2 rounded text-white ${
              isEditMode ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-700'
            }`}
          >
            <option value="">Select Category</option>
            <option value="Blog">Blog</option>
            <option value="Book">Book</option>
            <option value="Product">Product</option>
          </select>
          {fieldErrors.category && (
            <p className="mt-1 text-red-400 text-sm">{fieldErrors.category}</p>
          )}
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="block mb-1">Title*</label>
          <input
            type="text"
            value={title}
            onChange={e => {
              setTitle(e.target.value);
              setFieldErrors(prev => ({ ...prev, title: '' }));
            }}
            className="w-full p-2 bg-gray-700 rounded text-white"
          />
          {fieldErrors.title && (
            <p className="mt-1 text-red-400 text-sm">{fieldErrors.title}</p>
          )}
        </div>

        {/* Author */}
        <div className="mb-4">
          <label className="block mb-1">Author</label>
          <input
            type="text"
            value={author}
            onChange={e => setAuthor(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded text-white"
          />
        </div>

        {/* Enhanced Genre Selector */}
        <div className="mb-4">
          <GenreSelector
            value={selectedGenre}
            onChange={handleGenreChange}
            error={fieldErrors.genre}
            onClearError={clearGenreError}
            required={true}
          />
        </div>

        {/* Content */}
        <div className="mb-4">
          <label className="block mb-1">Content (text or leave blank for PDF)</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={4}
            className="w-full p-2 bg-gray-700 rounded text-white"
          />
        </div>

        {/* Cover Image */}
        <div className="mb-4">
          <label className="block mb-1">Cover Image*</label>
          <input
            type="file"
            accept="image/png, image/jpeg"
            onChange={handleCoverImageChange}
            className="w-full text-white"
          />
          {fieldErrors.coverImage && (
            <p className="mt-1 text-red-400 text-sm">{fieldErrors.coverImage}</p>
          )}
        </div>

        {/* PDF Upload */}
        <div className="mb-4">
          <label className="block mb-1">PDF Upload (overrides text)*</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={handlePdfChange}
            className="w-full text-white"
          />
          {fieldErrors.pdfFile && (
            <p className="mt-1 text-red-400 text-sm">{fieldErrors.pdfFile}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Saving…' : isEditMode ? 'Update' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}
