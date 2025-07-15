import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaStar, FaGamepad } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import BackgroundBubbles from '../components/BackgroundBubbles';
import api from '../services/api';

const defaultGameImage = 'https://via.placeholder.com/300x200/1a1a2e/ffffff?text=Game+Image';

  const GAME_CATEGORIES = [
    { id: 'all', name: 'All Games' },
    { id: 'card', name: 'Card' },
    { id: 'board', name: 'Board' },
    { id: 'action', name: 'Action' },
  ];

const Games = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const response = await api.get('/games', {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          withCredentials: true,
        });

        let gamesData = [];
        if (response.data?.success !== undefined) {
          gamesData = Array.isArray(response.data.data) ? response.data.data : [];
        } else if (Array.isArray(response.data)) {
          gamesData = response.data;
        } else if (response.data?.games) {
          gamesData = Array.isArray(response.data.games) ? response.data.games : [];
        }

        setGames(gamesData);
      } catch (err) {
        let errorMsg = 'Failed to load games. Please try again later.';
        if (err.response?.data?.error) {
          errorMsg = `Server error: ${err.response.data.error}`;
        } else if (err.message) {
          errorMsg = `Error: ${err.message}`;
        }
        setError(errorMsg);
        setGames([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  const { filteredGames } = useMemo(() => {
    if (!Array.isArray(games)) return { filteredGames: [] };

    const filtered = games.filter((game) => {
      if (!game || typeof game !== 'object') return false;

      const gameType = game.type || '';
      const gameName = game.name || '';
      const displayName = game.displayName || '';

      const categoryMatch =
        activeCategory === 'all' || gameType.toLowerCase() === activeCategory.toLowerCase();

      const searchLower = searchQuery.toLowerCase();
      const searchMatch =
        !searchQuery ||
        gameName.toLowerCase().includes(searchLower) ||
        displayName.toLowerCase().includes(searchLower);

      return categoryMatch && searchMatch;
    });

    return { filteredGames: filtered };
  }, [games, activeCategory, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col">
        <Header />
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-base">Loading games...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col">
        <Header />
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 max-w-md w-full text-center">
            <h2 className="text-xl font-bold mb-2">Error Loading Games</h2>
            <p className="text-red-200 mb-4 text-base">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blueGradient text-white flex flex-col">
      <BackgroundBubbles />
      <Header />

      <div className="flex-1 overflow-y-auto pt-[64px] pb-[64px]">
        {/* Sticky Search + Category Section with Bubbles */}
        <div className="sticky top-0 z-20 pt-4 pb-4 backdrop-blur-md">
          <div className="absolute inset-0 z-[-1] pointer-events-none">
            <BackgroundBubbles />
          </div>

          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-300 text-sm" />
                </div>
                <input
                  type="text"
                  placeholder="Search games..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-400/20 border border-dullBlue rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm text-white placeholder-gray-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Categories - Desktop */}
              <div className="hidden sm:flex flex-wrap gap-2">
                {GAME_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`px-3 py-2 text-xs font-medium whitespace-nowrap rounded-lg transition-colors ${activeCategory === category.id
                      ? 'bg-active text-gray-800'
                      : 'bg-gray-800/70 text-gray-300 hover:bg-gray-700/70'
                      }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories - Mobile */}
            <div className="sm:hidden mt-3">
              <div className="flex flex-wrap gap-2">
                {GAME_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap rounded-lg transition-colors flex-shrink-0 ${activeCategory === category.id
                      ? 'bg-active text-gray-800'
                      : 'bg-gray-800/70 text-gray-300 hover:bg-gray-700/70'
                      }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Games Grid Section */}
        <main className="container mx-auto px-4 relative z-10">
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {activeCategory === 'all'
                  ? 'All Games'
                  : `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Games`}
                {searchQuery && (
                  <span className="text-sm text-purple-300 font-normal ml-2">
                    "{searchQuery}"
                  </span>
                )}
              </h2>
              <div className="bg-gray-400/20 rounded-lg px-3 py-1.5 text-xs">
                {filteredGames.length} {filteredGames.length === 1 ? 'game' : 'games'} found
              </div>
            </div>

            {filteredGames.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-4">
                <AnimatePresence>
                  {filteredGames.map((game) => (
                    <motion.div
                      key={game._id || Math.random().toString(36).substr(2, 9)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 hover:border-purple-500/50 transition-all cursor-pointer"
                      onClick={() => {
                        const gameId = game._id || game.name;
                        if (gameId) navigate(`/game-lobby/${gameId}`);
                      }}
                    >
                      <div className="aspect-square bg-gray-900 relative overflow-hidden">
                        <img
                          src={game.assets?.thumbnail || defaultGameImage}
                          alt={game.displayName || game.name || 'Game'}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = defaultGameImage;
                          }}
                          loading="lazy"
                        />
                        {/* ⭐ Rating Top Right */}
                        {/* <div className="absolute top-1.5 right-2.5 text-golden text-sm font-semibold z-10">
                          {game.rating !== undefined && !isNaN(game.rating)
                            ? `★ ${Number(game.rating).toFixed(1)}`
                            : ''}
                        </div>  */}


                        {game.status?.isFeatured && (
                          <div className="absolute top-2 left-2 bg-yellow-500 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center z-10">
                            <FaStar className="mr-1" />
                            <span>Featured</span>
                          </div>
                        )}
                      </div>

                      {/* --- MODIFICATIONS START HERE --- */}
                      <div className="p-1 min-h-[30px] flex items-center justify-center"> {/* Reduced padding (p-4 to p-1) and added a smaller min-height */}
                        <h3
                          className="font-semibold text-white text-[0.65rem] leading-tight break-words mb-0 text-center" // Changed text-xs to text-[0.65rem] for even smaller font, reduced margin-bottom
                          title={game.displayName || game.name || 'Untitled Game'}
                        >
                          {game.displayName || game.name || 'Untitled Game'}
                        </h3>
                      </div>
                      {/* --- MODIFICATIONS END HERE --- */}

                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-800/30 rounded-xl">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700/50 flex items-center justify-center">
                  <FaGamepad className="text-xl text-gray-500" />
                </div>
                <h3 className="text-base font-medium text-gray-200 mb-1">
                  {searchQuery
                    ? `No games match "${searchQuery}"`
                    : activeCategory !== 'all'
                      ? `No ${activeCategory} games available`
                      : 'No games found'}
                </h3>
                <p className="text-xs text-gray-400">
                  {searchQuery || activeCategory !== 'all'
                    ? 'Try a different search term or category'
                    : 'Check back later for new games'}
                </p>
              </div>
            )}
          </section>
        </main>
      </div>

      <Navbar />
    </div>
  );
};

export default Games;

