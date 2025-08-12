// components/ManageUsersModal.js
import { useEffect, useState } from 'react';
import { X, Users, UserMinus, CheckCircle, AlertCircle, Search, ChevronDown } from 'lucide-react';

export default function ManageUsersModal({ onClose }) {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [notification, setNotification] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        showNotification('Failed to load users', 'error');
      }
    } catch (err) {
      showNotification('Network error loading users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.email)));
    }
  };

  const handleSelectUser = (email) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(email)) {
      newSelected.delete(email);
    } else {
      newSelected.add(email);
    }
    setSelectedUsers(newSelected);
  };

  const handleDeleteUsers = async () => {
    console.log('handleDeleteUsers called');
    if (selectedUsers.size === 0) {
      console.log('No users selected');
      return;
    }
    
    setDeleting(true);
    const emails = Array.from(selectedUsers);
    
    console.log('Deleting users:', emails);
    
    try {
      const res = await fetch('/api/users/delete-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails }),
      });

      console.log('Delete response status:', res.status);
      const result = await res.json();
      console.log('Delete response:', result);
      
      if (res.ok || res.status === 207) {
        // 207 means partial success
        if (result.deleted > 0) {
          showNotification(
            `Successfully deleted ${result.deleted} user${result.deleted !== 1 ? 's' : ''}`,
            'success'
          );
          setSelectedUsers(new Set());
          fetchUsers(); // Refresh the list
        } else {
          showNotification(result.error || 'No users were deleted', 'error');
        }
        
        // Show errors if any
        if (result.errors && result.errors.length > 0) {
          console.error('Deletion errors:', result.errors);
        }
      } else {
        showNotification(result.error || result.details || 'Failed to delete users', 'error');
      }
    } catch (err) {
      console.error('Network error during deletion:', err);
      showNotification('Network error during deletion', 'error');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleDeleteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Delete button clicked, selected users:', Array.from(selectedUsers));
    if (selectedUsers.size > 0) {
      setConfirmDelete(true);
    }
  };

  const handleConfirmDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Confirm delete clicked');
    handleDeleteUsers();
  };

  const handleCancelDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Cancel delete clicked');
    setConfirmDelete(false);
  };

  // Filter and sort users
  const filteredUsers = users
    .filter(user => 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'email') return a.email.localeCompare(b.email);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl border border-gray-700">
          
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-pink-600 p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/10 rounded-lg backdrop-blur">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Manage Users</h2>
                  <p className="text-white/80 text-sm mt-1">
                    {users.length} total users • {selectedUsers.size} selected
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="p-4 bg-gray-800/50 backdrop-blur border-b border-gray-700">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by email or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none px-4 py-2 pr-10 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="createdAt">Sort by Date</option>
                  <option value="name">Sort by Name</option>
                  <option value="email">Sort by Email</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Select All / Delete Button */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  {selectedUsers.size === filteredUsers.length ? 'Deselect All' : 'Select All'}
                </button>
                
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  disabled={selectedUsers.size === 0 || deleting}
                  className={`px-4 py-2 rounded-lg transition-all text-sm font-medium flex items-center gap-2 ${
                    selectedUsers.size > 0
                      ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg shadow-red-600/20 cursor-pointer'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <UserMinus className="h-4 w-4" />
                  Delete Selected ({selectedUsers.size})
                </button>
              </div>
            </div>
          </div>

          {/* Users List */}
          <div className="overflow-y-auto max-h-[50vh] p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No users found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.email}
                    onClick={() => handleSelectUser(user.email)}
                    className={`group relative p-4 rounded-xl border transition-all cursor-pointer select-none ${
                      selectedUsers.has(user.email)
                        ? 'bg-gradient-to-r from-orange-900/30 to-pink-900/30 border-orange-500/50'
                        : 'bg-gray-800/30 border-gray-700 hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Checkbox */}
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                          selectedUsers.has(user.email)
                            ? 'bg-gradient-to-r from-orange-500 to-pink-500 border-transparent'
                            : 'border-gray-500 group-hover:border-gray-400'
                        }`}>
                          {selectedUsers.has(user.email) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>

                        {/* User Info */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{user.name || 'No name'}</span>
                            {user.isVerified && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-400">{user.email}</p>
                        </div>
                      </div>

                      {/* Created Date */}
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Joined</p>
                        <p className="text-sm text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog - Fixed z-index */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center" style={{ zIndex: 60 }}>
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-red-600/20 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white">Confirm Deletion</h3>
            </div>
            
            <p className="text-gray-300 mb-2">
              You are about to permanently delete <span className="font-bold text-red-400">{selectedUsers.size}</span> user{selectedUsers.size !== 1 ? 's' : ''}.
            </p>
            <p className="text-sm text-gray-400 mb-6">
              This action cannot be undone and will remove users from both the blog and credential systems.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete Users'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast - Fixed z-index */}
      {notification && (
        <div className="fixed bottom-4 right-4 animate-slide-up" style={{ zIndex: 70 }}>
          <div className={`px-6 py-4 rounded-lg shadow-xl flex items-center space-x-3 ${
            notification.type === 'success' 
              ? 'bg-gradient-to-r from-green-600 to-green-500' 
              : 'bg-gradient-to-r from-red-600 to-red-500'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-white" />
            ) : (
              <AlertCircle className="h-5 w-5 text-white" />
            )}
            <p className="text-white font-medium">{notification.message}</p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}