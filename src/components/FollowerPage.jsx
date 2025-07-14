import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import BackgroundBubbles from '../components/BackgroundBubbles';
import { toast } from 'react-toastify';
import api from '../services/api';
import authService from '../services/authService';
import { FiMessageSquare } from 'react-icons/fi';
import ChatScreen from './ChatScreen';

function FollowerPage() {
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = await authService.getCurrentUserProfile();
      if (!currentUser) throw new Error('Not authenticated');

      const res = await api.get('/users/community');
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.users)
          ? res.data.users
          : [];

      const others = list.filter((u) => u._id !== currentUser._id);
      setUsers(others);
      setFilteredUsers(others);
    } catch (err) {
      console.error(err);
      toast.error('Unable to load community members');
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const term = search.toLowerCase();
    if (!term) {
      setFilteredUsers(users);
      return;
    }
    setFilteredUsers(
      users.filter(
        (u) =>
          (u.name || '').toLowerCase().includes(term) ||
          (u.username || '').toLowerCase().includes(term) ||
          (u.email || '').toLowerCase().includes(term)
      )
    );
  }, [search, users]);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-[#0b3fae] via-[#1555d1] to-[#2583ff] text-white pb-24 overflow-hidden">
        <BackgroundBubbles />
        <div className="relative z-10 w-full">
          <Header />
          <div className="pt-20 px-4 sm:px-6 md:px-8 w-full max-w-6xl mx-auto">
            {/* Back button + Heading */}
            <div className="flex items-center justify-center gap-3 mb-6 relative">
              <button
                onClick={() => navigate(-1)}
                className="absolute left-0 text-white text-3xl px-2"
              >
                &#8249;
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-center text-blue-100 whitespace-nowrap">
                Community Members
              </h1>
            </div>

            {/* Search */}
            <div className="flex justify-center mb-6">
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, username, or email..."
                  className="w-full px-4 py-3 pl-10 rounded-lg bg-white/10 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <svg
                  className="absolute left-3 top-3.5 h-5 w-5 text-white/70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Users List */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-white/5 rounded-xl p-6 max-w-md mx-auto">
                  <div className="text-5xl mb-4">👥</div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {search ? 'No users found' : 'No active users'}
                  </h3>
                  <p className="text-white/70 mb-4">
                    {search
                      ? 'Try a different search term'
                      : 'There are no other active users right now.'}
                  </p>
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
                {filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => navigate(`/profile/${user._id}`)}
                    className="bg-white/10 backdrop-blur-lg rounded-xl p-4 flex items-center space-x-4 hover:bg-white/20 cursor-pointer transition-colors duration-200"
                  >
                    <img
                      src={
                        user.profilePicture ||
                        user.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user.name || user.username || 'U'
                        )}&background=0b3fae&color=fff`
                      }
                      alt={user.name || user.username || 'User'}
                      className="w-12 h-12 rounded-full border-2 border-blue-400 object-cover flex-shrink-0"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user.name || user.username || 'U'
                        )}&background=0b3fae&color=fff`;
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-white truncate">
                          {user.name || user.username || 'User'}
                        </h3>
                      </div>
                      {user.username && (
                        <p className="text-sm text-white/60 truncate">
                          @{user.username}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedChatUser(user);
                      }}
                      className="text-blue-200 hover:text-blue-400 focus:outline-none justify-end"
                      title="Message"
                    >
                      <FiMessageSquare size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <Navbar />
      </div>

      {/* Chat Modal Overlay */}
      {selectedChatUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full h-full max-w-2xl max-h-[90vh] bg-blue-900 rounded-xl shadow-2xl overflow-hidden">
            <ChatScreen
              selectedFriend={selectedChatUser}
              setSelectedFriend={setSelectedChatUser}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default FollowerPage;