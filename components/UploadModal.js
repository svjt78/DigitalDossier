import { useState, useEffect } from 'react';

export default function UploadModal({ isOpen, onClose, onSave, initialData = {} }) {
  const data = initialData ?? {};
  const isEditMode = Boolean(data.id);

  const [category, setCategory]     = useState(data.category || '');
  const [title, setTitle]           = useState(data.title    || '');
  const [author, setAuthor]         = useState(data.author   || '');
  const [genre, setGenre]           = useState(data.genre    || '');
  const [content, setContent]       = useState(data.content  || '');
  const [coverImage, setCoverImage] = useState(null);
  const [pdfFile, setPdfFile]       = useState(null);

  const [isUpdateMode, setIsUpdateMode] = useState(false); // default OFF
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [fieldErrors, setFieldErrors]   = useState({});

  useEffect(() => {
    if (isOpen) {
      const d = initialData ?? {};
      setCategory(d.category || '');
      setTitle(d.title || '');
      setAuthor(d.author || '');
      setGenre(d.genre || '');
      setContent(d.content || '');
      setCoverImage(null);
      setPdfFile(null);
      setError('');
      setFieldErrors({});
      setIsUpdateMode(false);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleCoverImageChange = e => {
    const file = e.target.files?.[0];
    setCoverImage(file);
    if (file) setFieldErrors(prev => ({ ...prev, coverImage: '' }));
  };

  const handlePdfChange = e => {
    const file = e.target.files?.[0];
    setPdfFile(file);
    if (file) setFieldErrors(prev => ({ ...prev, pdfFile: '' }));
  };

  const handleSave = async () => {
    setError('');
    const errors = {};

    if (!category)        errors.category   = 'Category is required.';
    if (!title.trim())    errors.title      = 'Title is required.';
    if (!isUpdateMode) {
      if (!coverImage)    errors.coverImage = 'Cover image is required.';
      if (!pdfFile)       errors.pdfFile    = 'PDF file is required.';
    }
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('author', author);
      formData.append('category', category);
      formData.append('genre', genre);
      formData.append('content', pdfFile ? '' : content);
      if (coverImage) formData.append('coverImage', coverImage);
      if (pdfFile)    formData.append('pdfFile', pdfFile);

      const targetCategory = isEditMode
        ? data.category.toLowerCase()
        : category.toLowerCase();
      const url    = isEditMode
        ? `/api/content/${targetCategory}/${data.id}`
        : '/api/upload';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, { method, body: formData });
      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({}));
        throw new Error(msg || `Save failed (${res.status})`);
      }

      const payload = await res.json();
      if (!payload.success) throw new Error(payload.error || 'Server error');

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
          <label className="block mb-1">Category</label>
          {isEditMode ? (
            <input
              type="text"
              value={category}
              disabled
              className="w-full p-2 bg-gray-600 rounded text-white cursor-not-allowed"
            />
          ) : (
            <select
              value={category}
              onChange={e => {
                setCategory(e.target.value);
                setFieldErrors(prev => ({ ...prev, category: '' }));
              }}
              className="w-full p-2 bg-gray-700 rounded text-white"
            >
              <option value="">Select Category</option>
              <option value="Blog">Blog</option>
              <option value="Book">Book</option>
              <option value="Product">Product</option>
            </select>
          )}
          {fieldErrors.category && (
            <p className="mt-1 text-red-400 text-sm">{fieldErrors.category}</p>
          )}
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="block mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => {
              setTitle(e.target.value);
              setFieldErrors(prev => ({ ...prev, title: '' }));
            }}
            className="w-full p-2 bg-gray-700 rounded text-white"
          />
          {fieldErrors.title && <p className="mt-1 text-red-400 text-sm">{fieldErrors.title}</p>}
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

        {/* Genre */}
        <div className="mb-4">
          <label className="block mb-1">Genre</label>
          <input
            type="text"
            value={genre}
            onChange={e => setGenre(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded text-white"
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
          <label className="block mb-1">Cover Image (PNG, JPEG)</label>
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
          <label className="block mb-1">PDF Upload (overrides text)</label>
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

        {/* Update toggle */}
        {isEditMode && (
          <div className="flex items-center mt-4">
            <div
              onClick={() => setIsUpdateMode(!isUpdateMode)}
              className={`${
                isUpdateMode ? 'bg-blue-600' : 'bg-gray-300'
              } relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors`}
            >
              <span
                className={`${
                  isUpdateMode ? 'translate-x-6' : 'translate-x-1'
                } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
              />
            </div>
            <span className="ml-3 text-sm font-medium">Update mode</span>
          </div>
        )}

        {/* Actions */}
        {isEditMode ? (
          <div className="flex items-center justify-between mt-4">
            <div /> {/* alignment placeholder */}
            <div className="flex space-x-4">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={
                  loading ||
                  !category ||
                  !title.trim() ||
                  (!isUpdateMode && (!coverImage || !pdfFile))
                }
                className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Saving…' : 'Update'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end space-x-4 mt-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={
                loading ||
                !category ||
                !title.trim() ||
                !coverImage ||
                !pdfFile
              }
              className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
