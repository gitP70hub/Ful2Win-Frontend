import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaFire, FaStar, FaArrowRight, FaGamepad, FaSpinner } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { gameService } from '../services/apiService';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import BackgroundBubbles from '../components/BackgroundBubbles';
import api from '../services/api';
// Default game images (fallback)
// Using a placeholder image URL instead of local file
const defaultGameImage = 'https://via.placeholder.com/300x200/1a1a2e/ffffff?text=Game+Image'; // Make sure to add a default game image

// Game categories
const GAME_CATEGORIES = [
  { id: 'all', name: 'All Games' },
  { id: 'arcade', name: 'Arcade' },
  { id: 'card', name: 'Card' },
  { id: 'puzzle', name: 'Puzzle' },
  { id: 'board', name: 'Board' },
  { id: 'action', name: 'Action' },
  { id: 'adventure', name: 'Adventure' },
];
const Games = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch games from the backend with error handling and loading states
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use relative URL for API requests
       
//console.log(apiUrl);
       // console.log('Fetching games from:', apiUrl);
       const response = await api.get('/games', {
         headers: {
           'Content-Type': 'application/json',
           'Accept': 'application/json',
         },
         withCredentials: true,
       });

       // Handle the response format from the API
       let gamesData = [];
       if (response.data && response.data.success !== undefined) {
         // If the response has a success flag, extract data from response.data.data
         gamesData = Array.isArray(response.data.data) ? response.data.data : [];
       } else if (Array.isArray(response.data)) {
         // Fallback: if response.data is an array
         gamesData = response.data;
       } else if (response.data && response.data.games) {
         // Fallback: if response has a games array
         gamesData = Array.isArray(response.data.games) ? response.data.games : [];
       }
        
        setGames(gamesData);
        
      } catch (err) {
        console.error('Error fetching games:', err);
        // Try to extract backend error message if available
        let errorMsg = 'Failed to load games. Please try again later.';
        if (err.response && err.response.data && err.response.data.error) {
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

  // Memoize filtered and featured games to prevent unnecessary recalculations
  const { filteredGames, featuredGames } = useMemo(() => {
    if (!Array.isArray(games)) return { filteredGames: [], featuredGames: [] };
    
    const filtered = games.filter((game) => {
      if (!game || typeof game !== 'object') return false;
      
      const gameType = game.type || '';
      const gameName = game.name || '';
      const displayName = game.displayName || '';
      
      // Handle category matching
      const categoryMatch = activeCategory === 'all' || 
                         gameType.toLowerCase() === activeCategory.toLowerCase();
      
      // Handle search matching
      const searchLower = searchQuery.toLowerCase();
      const searchMatch = !searchQuery || 
                        gameName.toLowerCase().includes(searchLower) ||
                        displayName.toLowerCase().includes(searchLower);
      
      return categoryMatch && searchMatch;
    });

    // Get up to 5 featured games
    const featured = games
      .filter(game => game && 
                    typeof game === 'object' && 
                    game.status && 
                    game.status.isFeatured === true)
      .slice(0, 5);

    return { 
      filteredGames: filtered || [], 
      featuredGames: featured || [] 
    };
  }, [games, activeCategory, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col">
        <Header />
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-lg">Loading games...</p>
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
            <h2 className="text-2xl font-bold mb-2">Error Loading Games</h2>
            <p className="text-red-200 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="min-h-screen bg-blueGradient text-white flex flex-col">
      <BackgroundBubbles />
      
      {/* Header and Navbar */}
      <div className="sticky top-0 z-30">
        <Header />
        <Navbar />
      </div>
      
      {/* Search and Categories - Sticky at top */}
      <div className={`sticky pt-4 top-16 sm:top-16 z-20`}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Bar */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-300" />
              </div>
              <input
                type="text"
                placeholder="Search games..."
                className="w-full pl-10 pr-4 py-2 bg-gray-400/20 border border-dullBlue rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Category Filter - Desktop */}
            <div className="hidden sm:flex flex-wrap gap-2">
              {GAME_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-3 py-2 text-sm font-medium whitespace-nowrap rounded-lg transition-colors ${
                    activeCategory === category.id
                      ? 'bg-active text-gray-800'
                      : 'bg-gray-800/70 text-gray-300 hover:bg-gray-700/70'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Category Filter - Mobile */}
          <div className="sm:hidden mt-3">
            <div className="flex flex-wrap gap-2">
              {GAME_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap rounded-lg transition-colors flex-shrink-0 ${
                    activeCategory === category.id
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

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-20 pb-8 sm:pt-6 sm:pb-8 md:py-10 relative z-10 flex-1">
        {/* Hero Section */}
        <div className="mb-10 sm:mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-neonBlueGradient bg-clip-text text-transparent">
           
          </h1>
          {/* <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto">
            Discover and compete in our exciting collection of games. Win rewards, challenge friends, and climb the leaderboards!
          </p> */}
        </div>

        {/* Featured Games */}
        {/* <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center">
              <FaFire className="text-orange-500 mr-2" />
              Featured Games
            </h2>
            {featuredGames.length > 0 && (
              <button 
                onClick={() => setActiveCategory('all')}
                className="text-sm text-purple-300 hover:text-white flex items-center group"
              >
                View All
                <FaArrowRight className="ml-1 text-xs group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>

          {featuredGames.length > 0 ? (
            <div className="relative">
              <div className="flex overflow-x-auto pb-4 -mx-2 px-2 scrollbar-hide">
                <div className="flex space-x-4">
                  <AnimatePresence>
                    {featuredGames.map((game) => (
                      <motion.div
                        key={game._id || Math.random().toString(36).substr(2, 9)}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.3 }}
                        className="flex-shrink-0 w-64 bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700/50 hover:border-purple-500/50 cursor-pointer transition-all duration-200"
                        onClick={() => {
                          const gameId = game._id || game.name;
                          if (gameId) {
                            navigate(`/games/${gameId}`);
                          }
                        }}
                      >
                        <div className="aspect-video bg-gray-900 relative overflow-hidden">
                          <img
                            src={game.assets?.thumbnail || 'https://via.placeholder.com/400x225/1a1a2e/ffffff?text=Game+Image'}
                            alt={game.displayName || game.name || 'Game'}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/400x225/1a1a2e/ffffff?text=Game+Image';
                            }}
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                            <div className="w-full">
                              <button 
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const gameId = game._id || game.name;
                                  if (gameId) {
                                    navigate(`/game-lobby/${gameId}`);
                                  }
                                }}
                              >
                                Play Now
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-white mb-1 truncate" title={game.displayName || game.name || 'Untitled Game'}>
                            {game.displayName || game.name || 'Untitled Game'}
                          </h3>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400 capitalize">
                              {game.type ? String(game.type).toLowerCase() : 'game'}
                            </span>
                            <div className="flex items-center">
                              <FaStar className="text-yellow-400 text-sm mr-1" />
                              <span className="text-xs text-gray-300">
                                {game.rating !== undefined && !isNaN(game.rating) 
                                  ? Number(game.rating).toFixed(1) 
                                  : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-800/30 rounded-xl">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700/50 flex items-center justify-center">
                <FaGamepad className="text-2xl text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-200 mb-1">
                No featured games available
              </h3>
              <p className="text-gray-400 text-sm">
                Check back later for featured games
              </p>
            </div>
          )}
        </section> */}

        {/* All Games */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {activeCategory === 'all' ? 'All Games' : `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Games`}
              {searchQuery && (
                <span className="text-purple-300 font-normal ml-2 text-base">"{searchQuery}"</span>
              )}
            </h2>
            <div className="bg-gray-400/20 rounded-lg px-3 py-1.5 text-sm">
              {filteredGames.length} {filteredGames.length === 1 ? 'game' : 'games'} found
            </div>
          </div>
          
          {/* Game Grid */}
          {filteredGames.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
                      if (gameId) {
                        navigate(`/game-lobby/${gameId}`);
                      }
                    }}
                  >
                    <div className="aspect-square bg-gray-900 relative overflow-hidden">
                      <img
                        src={game.assets?.thumbnail || 'https://via.placeholder.com/400x225/1a1a2e/ffffff?text=Game+Image'}
                        alt={game.displayName || game.name || 'Game'}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/400x225/1a1a2e/ffffff?text=Game+Image';
                        }}
                        loading="lazy"
                      />
                      {game.status?.isFeatured && (
                        <div className="absolute top-2 left-2 bg-yellow-500 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center">
                          <FaStar className="mr-1" />
                          <span>Featured</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <button 
                          className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95"
                          onClick={(e) => {
                            e.stopPropagation();
                            const gameId = game._id || game.name;
                            if (gameId) {
                              navigate(`/game-lobby/${gameId}`);
                            }
                          }}
                        >
                          Play Now
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 
                        className="font-bold text-white mb-1 truncate"
                        title={game.displayName || game.name || 'Untitled Game'}
                      >
                        {game.displayName || game.name || 'Untitled Game'}
                      </h3>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400 capitalize">
                          {game.type ? String(game.type).toLowerCase() : 'game'}
                        </span>
                        <div className="flex items-center text-xs text-yellow-400">
                          <span>★</span>
                          <span className="ml-1 text-gray-300">
                            {game.rating !== undefined && !isNaN(game.rating) 
                              ? Number(game.rating).toFixed(1) 
                              : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-800/30 rounded-xl">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700/50 flex items-center justify-center">
                <FaGamepad className="text-2xl text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-200 mb-1">
                {searchQuery
                  ? `No games match "${searchQuery}"`
                  : activeCategory !== 'all'
                    ? `No ${activeCategory} games available`
                    : 'No games found'}
              </h3>
              <p className="text-gray-400 text-sm">
                {searchQuery || activeCategory !== 'all'
                  ? 'Try a different search term or category'
                  : 'Check back later for new games'}
              </p>
            </div>
          )}
        </section>
      {/* Error message UI */}
      {error && (
        <div className="bg-red-700 text-white p-4 mb-4 rounded-xl text-center font-semibold">
          {error}
        </div>
      )}
      </main>
    </div>
  );
};

export default Games;