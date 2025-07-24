import { useState, useEffect } from 'react';
import CreatableSelect from 'react-select/creatable';

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

  const [genres, setGenres] = useState([]);
  const [options, setOptions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Fetch available genres when modal opens
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/genres')
      .then(res => res.json())
      .then(data => {
        setGenres(data);
        setOptions(data.map(g => ({ value: g.id, label: g.name })));
        if (initialData.genre) {
          const match = data.find(g => g.name === initialData.genre);
          if (match) {
            setSelectedGenre({ value: match.id, label: match.name });
          }
        }
      })
      .catch(err => console.error('Error loading genres', err));
  }, [isOpen, initialData.genre]);

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
      setSelectedGenre(null);
    }
  }, [isOpen, data]);

  if (!isOpen) return null;

  const handleCreateOption = async (inputValue) => {
    try {
      const res = await fetch('/api/genres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: inputValue }),
      });
      if (!res.ok) throw new Error('Failed to create genre');
      const newGenre = await res.json();
      const newOption = { value: newGenre.id, label: newGenre.name };
      setGenres(prev => [...prev, newGenre]);
      setOptions(prev => [...prev, newOption]);
      setSelectedGenre(newOption);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteGenre = async (id) => {
    if (!confirm('Are you sure you want to delete this genre?')) return;
    try {
      const res = await fetch(`/api/genres/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete genre');
      setGenres(prev => prev.filter(g => g.id !== id));
      setOptions(prev => prev.filter(o => o.value !== id));
      if (selectedGenre?.value === id) {
        setSelectedGenre(null);
      }
    } catch (err) {
      alert(err.message);
    }
  };

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
      formData.append('category', category);
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
            className="w-full p-2 bg-gray-700 rounded text-white"
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

        {/* Genre */}
        <div className="mb-4">
          <label className="block mb-1">Genre*</label>
          <CreatableSelect
            options={options}
            value={selectedGenre}
            onChange={opt => setSelectedGenre(opt)}
            onCreateOption={handleCreateOption}
            className="w-full"
            classNamePrefix="react-select"
            components={{
              IndicatorSeparator: () => null,
              ClearIndicator: () => null
            }}
            styles={{
              control: base => ({
                ...base,
                backgroundColor: '#374151',
                border: 'none',
                boxShadow: 'none',
                '&:hover': { border: 'none' },
                borderRadius: base.borderRadius,
                padding: '0.5rem'
              }),
              singleValue: base => ({ ...base, color: 'white' }),
              placeholder: base => ({ ...base, color: 'white' }),
              menu: base => ({ ...base, backgroundColor: '#374151' }),
              option: (base, { isFocused }) => ({
                ...base,
                backgroundColor: isFocused ? '#4B5563' : '#374151',
                color: 'white'
              }),
              dropdownIndicator: base => ({ ...base, color: 'white' })
            }}
          />
          {fieldErrors.genre && (
            <p className="mt-1 text-red-400 text-sm">{fieldErrors.genre}</p>
          )}

          {/* Inline list for deletions */}
          <ul className="mt-2 space-y-1">
            {options.map(opt => (
              <li
                key={opt.value}
                className="flex justify-between items-center bg-gray-700 px-2 py-1 rounded group"
              >
                <span>{opt.label}</span>
                <button
                  onClick={() => handleDeleteGenre(opt.value)}
                  className="opacity-0 group-hover:opacity-100 text-red-500"
                  aria-label="Delete genre"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
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
