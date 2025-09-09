// components/WebViewModal.js

import { useState, useEffect } from 'react';
import { X, Globe, RefreshCw, AlertCircle, Trash2 } from 'lucide-react';
import Button from '@/components/Button';

export default function WebViewModal({ isOpen, onClose, onSave, contentType, contentId, initialUrl = null }) {
  const [selectedUrl, setSelectedUrl] = useState(initialUrl || '');
  const [objectUrls, setObjectUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchObjectUrls();
      setSelectedUrl(initialUrl || '');
      setError('');
    }
  }, [isOpen, initialUrl]);

  const fetchObjectUrls = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/s3/object-urls');
      if (!response.ok) {
        throw new Error(`Failed to fetch URLs: ${response.statusText}`);
      }
      
      const data = await response.json();
      setObjectUrls(data.urls || []);
    } catch (err) {
      console.error('Error fetching object URLs:', err);
      setError('Failed to load interactive document URLs');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (selectedUrl === null || selectedUrl === undefined) {
      setError('Please select an option');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (selectedUrl === '') {
        // Confirm removal
        const confirmRemove = window.confirm('Are you sure you want to remove the interactive web page association? This action cannot be undone.');
        if (!confirmRemove) {
          setSaving(false);
          return;
        }

        // Handle removal via DELETE
        const response = await fetch(`/api/web-view/${contentType}/${contentId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

        if (!response.ok && response.status !== 404) {
          throw new Error(`Failed to remove: ${response.statusText}`);
        }

        onSave(null); // Indicate association was removed
      } else {
        // Handle association save
        const response = await fetch(`/api/web-view/${contentType}/${contentId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify({ objectUrl: selectedUrl }),
        });

        if (!response.ok) {
          throw new Error(`Failed to save: ${response.statusText}`);
        }

        const result = await response.json();
        onSave(result.webView);
      }
      
      onClose();
    } catch (err) {
      console.error('Error saving web view:', err);
      setError(`Failed to ${selectedUrl === '' ? 'remove' : 'save'} interactive web page association`);
    } finally {
      setSaving(false);
    }
  };


  const handleCancel = () => {
    setSelectedUrl(initialUrl || '');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" 
        onClick={handleCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <Globe className="h-6 w-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">
              Associate Interactive Web Page
            </h2>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <p className="text-gray-300 mb-4">
            Select an interactive web page to associate with this {contentType}:
          </p>

          {initialUrl && (
            <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3 mb-4">
              <div className="flex items-center">
                <Globe className="h-5 w-5 text-blue-400 mr-2" />
                <span className="text-blue-100 text-sm">
                  Currently associated with an interactive web page
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 mb-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <span className="text-red-100 text-sm">{error}</span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 text-blue-400 animate-spin mr-3" />
              <span className="text-gray-300">Loading interactive documents...</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-700 rounded-lg p-3">
              {/* None option */}
              <label className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-700/50 cursor-pointer transition-colors border-b border-gray-600/50">
                <input
                  type="radio"
                  name="objectUrl"
                  value=""
                  checked={selectedUrl === ''}
                  onChange={(e) => setSelectedUrl(e.target.value)}
                  className="mt-1 text-red-400 bg-gray-700 border-gray-600 focus:ring-red-400 focus:ring-2"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-red-400 font-medium">
                    None (Remove Association)
                  </p>
                  <p className="text-xs text-gray-400">
                    Remove any existing interactive web page association
                  </p>
                </div>
              </label>

              {objectUrls.length === 0 ? (
                <p className="text-gray-400 text-center py-4">
                  No interactive documents found
                </p>
              ) : (
                objectUrls.map((obj, index) => (
                  <label
                    key={index}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-700/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name="objectUrl"
                      value={obj.url}
                      checked={selectedUrl === obj.url}
                      onChange={(e) => setSelectedUrl(e.target.value)}
                      className="mt-1 text-blue-400 bg-gray-700 border-gray-600 focus:ring-blue-400 focus:ring-2"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">
                        {obj.key}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {obj.url}
                      </p>
                      <p className="text-xs text-gray-500">
                        Modified: {new Date(obj.lastModified).toLocaleDateString()}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-700 bg-gray-800/50">
          <Button
            variant="ghost"
            size="md"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant={selectedUrl === '' ? 'destructive' : 'primary'}
            size="md"
            onClick={handleSave}
            disabled={saving || loading}
            icon={saving ? RefreshCw : selectedUrl === '' ? Trash2 : null}
            className={saving ? 'animate-spin' : ''}
          >
            {saving ? 'Saving...' : selectedUrl === '' ? 'Remove Association' : 'Save Association'}
          </Button>
        </div>
      </div>
    </div>
  );
}