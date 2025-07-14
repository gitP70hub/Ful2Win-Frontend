import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaGamepad, FaUsers, FaTrophy, FaSearch } from 'react-icons/fa';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import BackgroundBubbles from '../components/BackgroundBubbles';
import { toast } from 'react-toastify';
import api from '../services/api';

const Tournaments = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [games, setGames] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const getFilteredGames = useCallback(() => {
    return games.filter(game =>
      game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (game.description && game.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [games, searchQuery]);

  const handleViewGameTournaments = (gameId) => {
    navigate(`/tournament-lobby/${gameId}`);
  };

  const formatPlayerCount = (players, total) => {
    if (total === 0) return 'No players';
    return `${players || 0} players`;
  };

  const fetchGames = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // First, fetch all tournaments
      const [gamesResponse, tournamentsResponse] = await Promise.all([
        api.get('/games'),
        api.get('/tournaments', { headers })
      ]);

      if (gamesResponse.data.success) {
        const gamesData = gamesResponse.data.data || [];
        const tournaments = tournamentsResponse.data.success ? (tournamentsResponse.data.data || []) : [];

        const gamesWithDetails = gamesData.map((game) => {
          const gameId = game._id || game.id;
          if (!gameId) return { ...game, tournamentCount: 0, activePlayers: 0, maxPlayers: 0 };

          // Filter tournaments for this game
          const gameTournaments = tournaments.filter(t => {
            const tournamentGameId = t.game?._id || t.game || t.gameId;
            return tournamentGameId === gameId || tournamentGameId === game._id;
          });

          // Calculate active players from currentPlayers array length
          const activePlayers = gameTournaments.reduce((sum, t) => {
            const currentPlayersCount = Array.isArray(t.currentPlayers) ? t.currentPlayers.length : 0;
            return sum + currentPlayersCount;
          }, 0);
          
          const maxPlayers = gameTournaments.reduce((sum, t) => {
            // Use maxPlayers if available, otherwise use currentPlayers length as fallback
            if (t.maxPlayers !== undefined) return sum + (Number(t.maxPlayers) || 0);
            return sum + (Array.isArray(t.currentPlayers) ? t.currentPlayers.length : 0);
          }, 0);

          return {
            ...game,
            tournamentCount: gameTournaments.length,
            activePlayers,
            maxPlayers: maxPlayers || 1 // Ensure at least 1 to avoid division by zero
          };
        });

        setGames(gamesWithDetails);
      } else {
        throw new Error('Failed to load games');
      }
    } catch (error) {
      console.error('Error fetching games:', error);
      setError(error.response?.data?.message || 'Failed to load games.');
      toast.error('Failed to load games');
      if (error.response?.status === 401) {
        navigate('/login', { state: { from: '/tournaments' } });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  if (loading) {
    return (
      <div className="min-h-screen bg-blueGradient text-white">
        <BackgroundBubbles />
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
        </div>
        <Navbar />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-24 pb-28 bg-blueGradient text-white">
        <BackgroundBubbles />
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="bg-red-900/30 border border-red-800 text-red-200 rounded-lg p-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-2">Error Loading Tournaments</h2>
            <p className="mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg font-medium hover:bg-yellow-400 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
        <Navbar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blueGradient text-white">
      <BackgroundBubbles />
      <Header />

      <main className="container mx-auto px-4 py-8 pb-32 relative z-10">
        <div className="mb-6">
          <div className="sticky top-14 z-20 pt-2 pb-4">
            <h1 className="text-3x1 font-bold">Tournament Games</h1>
          </div>
          <div className="relative mt-4">
            <input
              type="text"
              placeholder="Search games..."
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-2.5 px-4 pl-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {getFilteredGames().length === 0 ? (
          <div className="bg-gray-800/30 border-2 border-dashed border-gray-700 rounded-xl p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">No Games Found</h3>
            <p className="text-gray-400">
              {searchQuery
                ? 'No games match your search. Try different keywords.'
                : 'There are no games available right now. Check back later!'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg font-medium hover:bg-yellow-400 transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-3">
            {getFilteredGames().map((game) => {
              const gameId = game._id || game.id;
              const displayName = game.displayName || game.name;
              const thumbnail = game.assets?.thumbnail || game.image;

              return (
                <div
                  key={gameId}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 hover:border-yellow-400/50 transition-all cursor-pointer flex flex-col"
                  onClick={() => handleViewGameTournaments(gameId)}
                >
                  <div className="aspect-square bg-gray-900 relative overflow-hidden">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={displayName}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/400x225/1a1a2e/ffffff?text=Game+Image';
                        }}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800">
                        <FaGamepad className="text-4xl text-yellow-500 opacity-50" />
                      </div>
                    )}
                  </div>
                  <div className={`${game.tournamentCount > 0 ? 'p-2.5' : 'p-1.5'} flex-1 flex flex-col min-w-0`}>
                    <h3 
                      className="font-bold text-white text-center mb-1 truncate text-[11px] min-w-0"
                      title={displayName}
                    >
                      {displayName}
                    </h3>
                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between items-center mt-auto w-full">
                      <div className="flex items-center text-[9px] text-gray-300 min-w-0">
                        <FaUsers className="mr-1 text-yellow-500 text-[8px] flex-shrink-0" />
                        <span className="truncate">{formatPlayerCount(game.activePlayers || 0, game.maxPlayers || 0)}</span>
                      </div>
                      <button
                        className={`bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold text-[9px] rounded flex items-center transition-colors w-full sm:w-auto justify-center mt-1 sm:mt-0 ${game.tournamentCount > 0 ? 'px-2 py-1' : 'px-1.5 py-0.5'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewGameTournaments(gameId);
                        }}
                      >
                        <FaTrophy className="mr-1 text-[8px]" />
                        View
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Navbar />
    </div>
  );
};

export default Tournaments;
