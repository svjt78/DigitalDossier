// components/GenreSelector.js
import { useState, useEffect } from 'react';
import CreatableSelect from 'react-select/creatable';
import { ChevronDown, Settings, Trash2, BarChart3 } from 'lucide-react';

export default function GenreSelector({ 
  value, 
  onChange, 
  error,
  onClearError,
  required = false 
}) {
  const [genres, setGenres] = useState([]);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  const [createError, setCreateError] = useState('');

  // Fetch genres with usage statistics
  useEffect(() => {
    fetchGenresWithStats();
  }, []);

  const fetchGenresWithStats = async () => {
    try {
      const response = await fetch('/api/genres/stats');
      if (!response.ok) throw new Error('Failed to fetch genres');
      
      const genresWithStats = await response.json();
      setGenres(genresWithStats);
      
      // Create options with usage counts
      const formattedOptions = genresWithStats.map(genre => ({
        value: genre.id,
        label: `${genre.name}${genre._count?.total > 0 ? ` (${genre._count.total})` : ''}`,
        name: genre.name,
        count: genre._count?.total || 0
      }));
      
      setOptions(formattedOptions);
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };

  const handleCreateOption = async (inputValue) => {
    if (!inputValue.trim()) return;
    
    setLoading(true);
    setCreateError('');
    
    try {
      const response = await fetch('/api/genres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: inputValue.trim() }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          setCreateError('Genre already exists');
          return;
        }
        throw new Error(errorData.error || 'Failed to create genre');
      }
      
      const newGenre = await response.json();
      const newOption = { 
        value: newGenre.id, 
        label: newGenre.name,
        name: newGenre.name,
        count: 0
      };
      
      // Update local state
      setGenres(prev => [...prev, { ...newGenre, _count: { total: 0 } }]);
      setOptions(prev => [...prev, newOption]);
      
      // Set as selected
      onChange(newOption);
      
      // Clear any existing errors
      if (onClearError) onClearError();
      
    } catch (error) {
      console.error('Error creating genre:', error);
      setCreateError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGenre = async (genreId) => {
    const genre = genres.find(g => g.id === genreId);
    if (!genre) return;
    
    const hasUsage = genre._count?.total > 0;
    const confirmMessage = hasUsage 
      ? `Delete "${genre.name}"? This will affect ${genre._count.total} item(s).`
      : `Delete "${genre.name}"?`;
      
    if (!confirm(confirmMessage)) return;
    
    try {
      const response = await fetch(`/api/genres/${genreId}`, { 
        method: 'DELETE' 
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete genre');
      }
      
      // Remove from local state
      setGenres(prev => prev.filter(g => g.id !== genreId));
      setOptions(prev => prev.filter(o => o.value !== genreId));
      
      // Clear selection if deleted genre was selected
      if (value?.value === genreId) {
        onChange(null);
      }
      
    } catch (error) {
      console.error('Error deleting genre:', error);
      alert('Failed to delete genre: ' + error.message);
    }
  };

  // Custom styles for dark theme with better input visibility
  const customStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: '#374151',
      borderColor: error ? '#ef4444' : (state.isFocused ? '#3b82f6' : '#6b7280'),
      borderWidth: '1px',
      borderRadius: '0.5rem',
      padding: '0.125rem',
      boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
      '&:hover': {
        borderColor: error ? '#ef4444' : '#3b82f6'
      },
      minHeight: '42px'
    }),
    input: (base) => ({
      ...base,
      color: 'white',
      '& input': {
        color: 'white !important'
      }
    }),
    singleValue: (base) => ({
      ...base,
      color: 'white'
    }),
    placeholder: (base) => ({
      ...base,
      color: '#9ca3af'
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: '#374151',
      border: '1px solid #6b7280',
      borderRadius: '0.5rem',
      zIndex: 9999
    }),
    menuList: (base) => ({
      ...base,
      padding: '0.25rem'
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? '#4b5563' : 'transparent',
      color: 'white',
      borderRadius: '0.375rem',
      margin: '0.125rem 0',
      '&:hover': {
        backgroundColor: '#4b5563'
      }
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: '#9ca3af',
      '&:hover': {
        color: 'white'
      }
    }),
    clearIndicator: (base) => ({
      ...base,
      color: '#9ca3af',
      '&:hover': {
        color: 'white'
      }
    }),
    noOptionsMessage: (base) => ({
      ...base,
      color: '#9ca3af'
    }),
    loadingMessage: (base) => ({
      ...base,
      color: '#9ca3af'
    })
  };

  return (
    <div className="space-y-2">
      {/* Main Genre Selector */}
      <div className="relative">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-white">
            Genre{required && '*'}
          </label>
          <button
            type="button"
            onClick={() => setShowManagement(!showManagement)}
            className="text-gray-400 hover:text-white p-1 rounded"
            title="Manage genres"
          >
            <Settings size={16} />
          </button>
        </div>
        
        <CreatableSelect
          value={value}
          onChange={onChange}
          onCreateOption={handleCreateOption}
          options={options}
          isLoading={loading}
          isDisabled={loading}
          isClearable
          isSearchable
          placeholder="Select or type a new genre..."
          noOptionsMessage={({ inputValue }) => 
            inputValue ? `Press Enter to create "${inputValue}"` : "No genres found"
          }
          formatCreateLabel={(inputValue) => `Create "${inputValue}"`}
          styles={customStyles}
          className="react-select-container"
          classNamePrefix="react-select"
          components={{
            DropdownIndicator: ({ innerProps }) => (
              <div {...innerProps} className="px-2">
                <ChevronDown size={16} className="text-gray-400" />
              </div>
            )
          }}
        />
        
        {/* Error Messages */}
        {error && (
          <p className="mt-1 text-sm text-red-400">{error}</p>
        )}
        {createError && (
          <p className="mt-1 text-sm text-red-400">{createError}</p>
        )}
      </div>

      {/* Genre Management Panel */}
      {showManagement && (
        <div className="bg-gray-700 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-white flex items-center gap-2">
              <BarChart3 size={16} />
              Manage Genres ({genres.length})
            </h4>
            <button
              onClick={() => setShowManagement(false)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
          
          <div className="max-h-40 overflow-y-auto space-y-1">
            {genres.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">
                No genres yet. Create one by typing above!
              </p>
            ) : (
              genres.map(genre => (
                <div
                  key={genre.id}
                  className="flex items-center justify-between bg-gray-600 px-3 py-2 rounded group hover:bg-gray-500 transition-colors"
                >
                  <div className="flex-1">
                    <span className="text-white text-sm">{genre.name}</span>
                    {genre._count?.total > 0 && (
                      <span className="ml-2 text-xs text-gray-300 bg-gray-500 px-2 py-0.5 rounded-full">
                        {genre._count.total} item{genre._count.total !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteGenre(genre.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1 transition-opacity"
                    title={`Delete ${genre.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
