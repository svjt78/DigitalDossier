// pages/test-genre-selector.js (for testing purposes)
import { useState } from 'react';
import GenreSelector from '@/components/GenreSelector';

export default function TestGenreSelector() {
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [error, setError] = useState('');

  const handleGenreChange = (genre) => {
    setSelectedGenre(genre);
    setError(''); // Clear error when selection changes
  };

  const clearError = () => {
    setError('');
  };

  const simulateError = () => {
    setError('This is a test error message');
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-md mx-auto bg-gray-800 p-6 rounded-lg">
        <h1 className="text-2xl font-bold text-white mb-6">Genre Selector Test</h1>
        
        <GenreSelector
          value={selectedGenre}
          onChange={handleGenreChange}
          error={error}
          onClearError={clearError}
          required={true}
        />
        
        <div className="mt-6 space-y-4">
          <div className="text-white">
            <strong>Selected Genre:</strong>
            <pre className="bg-gray-700 p-2 rounded mt-1 text-sm">
              {JSON.stringify(selectedGenre, null, 2)}
            </pre>
          </div>
          
          <div className="space-x-2">
            <button
              onClick={simulateError}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Test Error State
            </button>
            <button
              onClick={() => setSelectedGenre(null)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Clear Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
