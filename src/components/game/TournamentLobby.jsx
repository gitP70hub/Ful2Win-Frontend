import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaTrophy, FaUsers, FaCoins, FaMoneyBillWave, FaArrowLeft, FaGamepad, FaCalendarAlt, FaClock, FaInfoCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../services/api';

const TournamentLobby = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joining, setJoining] = useState(false);
  const hasShownNoScoresRef = useRef(false);
  const notificationShownKey = `tournament_${tournamentId}_notification_shown`;

  // Format date and time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'TBD';
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    return new Date(dateString).toLocaleString('en-US', options);
  };

  // Calculate time remaining until tournament starts
  const getTimeRemaining = (startTime) => {
    if (!startTime) return 'Starting soon';
    
    const now = new Date();
    const start = new Date(startTime);
    const diff = start - now;
    
    if (diff <= 0) return 'Starting now';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `Starts in ${days}d ${hours}h`;
    if (hours > 0) return `Starts in ${hours}h ${minutes}m`;
    return `Starts in ${minutes}m`;
  };

  // Reset the notification flag when the component mounts or tournamentId changes
  useEffect(() => {
    hasShownNoScoresRef.current = false;
    // Clear any existing notification with this ID
    toast.dismiss('no-scores-notification');
  }, [tournamentId]);

  // Fetch tournament and game details
  const fetchTournamentDetails = useCallback(async () => {
    if (!tournamentId) {
      setError('No tournament ID provided');
      navigate('/tournaments');
      return;
    }

    try {
      setLoading(true);
      
      // Fetch tournament details
      const tournamentResponse = await api.get(`/tournaments/${tournamentId}`);
      
      if (!tournamentResponse.data.success) {
        throw new Error('Failed to load tournament');
      }
      
      const tournamentData = tournamentResponse.data.data;
      console.log('Fetched tournament data:', tournamentData);
      setTournament(tournamentData);
      
      // If tournament has a game ID, fetch game details and scores
      if (tournamentData.gameId) {
        try {
          // Fetch scores for this tournament
          try {
            const scoresResponse = await api.get(`/api/score?roomId=${tournamentId}&gameName=${encodeURIComponent(tournamentData.name || '')}`);
            
            // Check if no scores found and we haven't shown the notification yet
            if (scoresResponse.data && (!scoresResponse.data.scores || scoresResponse.data.scores.length === 0)) {
              if (!hasShownNoScoresRef.current) {
                // Show the notification only once per tournament
                toast.info('No scores found for this tournament yet. Be the first to play!', {
                  toastId: 'no-scores-notification',
                  autoClose: 5000,
                  onClose: () => {
                    hasShownNoScoresRef.current = true;
                    sessionStorage.setItem(notificationShownKey, 'true');
                  }
                });
              }
            }
          } catch (scoreError) {
            // Only log the error if it's not a 404 (which is expected when no scores exist)
            if (scoreError.response?.status !== 404) {
              console.error('Error fetching scores:', scoreError);
            }
          }
          console.log(`Fetching game details for game ID: ${tournamentData.gameId}`);
          const gameResponse = await api.get(`/games/${tournamentData.gameId}`);
          if (gameResponse.data.success) {
            console.log('Fetched game details:', gameResponse.data.data);
            setGame(gameResponse.data.data);
          } else {
            console.error('Failed to fetch game details:', gameResponse.data.message);
          }
        } catch (gameError) {
          console.error('Error fetching game details:', gameError);
          // Continue without game details if there's an error
        }
      } else {
        console.warn('Tournament has no gameId:', tournamentData);
      }
      
    } catch (error) {
      console.error('Error in fetchTournamentDetails:', error);
      setError(error.message || 'Failed to load tournament details');
      toast.error('Failed to load tournament');
      // Don't navigate away, just show the error
    } finally {
      setLoading(false);
    }
  }, [tournamentId, navigate]);

  useEffect(() => {
    fetchTournamentDetails();
  }, [fetchTournamentDetails]);

  const handleJoinTournament = async () => {
    if (!tournament) return;
    
    try {
      setJoining(true);
      // Call your API to join the tournament
      const response = await api.post(`/tournaments/${tournament.id}/join`);
      
      if (response.data.success) {
        toast.success('Successfully joined the tournament!');
        // Update the tournament data with the new player count
        setTournament(prev => ({
          ...prev,
          currentPlayers: [...(prev.currentPlayers || []), { id: 'current-user-id' }] // Replace with actual user ID
        }));
      } else {
        toast.error(response.data.message || 'Failed to join tournament');
      }
    } catch (error) {
      console.error('Error joining tournament:', error);
      toast.error(error.response?.data?.message || 'Failed to join tournament');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4">Loading tournament details...</p>
      </div>
    );
  }
  
  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Tournament Not Found</h2>
          <p className="text-gray-600 mb-6">The tournament you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/tournaments')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Back to Tournaments
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Tournament Not Found</h2>
          <p className="text-gray-600 mb-6">The tournament you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/tournaments')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Back to Tournaments
          </button>
        </div>
      </div>
    );
  }

  // Get game thumbnail URL
  const getGameThumbnail = () => {
    console.log('Getting thumbnail for game:', game);
    
    // First try to use the game's thumbnail
    if (game?.assets?.thumbnail) {
      if (game.assets.thumbnail.startsWith('http')) {
        return game.assets.thumbnail;
      }
      // Handle relative paths using the base URL from the api instance
      const baseUrl = api.defaults.baseURL || '';
      return `${baseUrl}/games/${game.id}/assets/${game.assets.thumbnail}`;
    }
    
    // Fallback to tournament image if available
    if (tournament?.image) {
      if (tournament.image.startsWith('http')) {
        return tournament.image;
      }
      const baseUrl = api.defaults.baseURL || '';
      return `${baseUrl}/games/${tournament.gameId}/assets/${tournament.image}`;
    }
    
    // Default fallback
    console.log('No thumbnail found, using default');
    return '/placeholder-game.jpg';
  };

  // Format prize pool
  const prizePool = tournament.prizePool || 0;
  const formattedPrizePool = prizePool.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });


  // Calculate progress percentage
  const progress = Math.min(
    Math.round(((tournament.currentPlayers?.length || 0) / (tournament.maxPlayers || 1)) * 100),
    100
  );
  
  // Format entry fee
  const formatEntryFee = () => {
    if (tournament.entryFee === 0 || tournament.entryFee === undefined) return 'Free';
    return `${tournament.entryFee} ${tournament.tournamentType === 'cash' ? '₹' : 'Coins'}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Game Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
                {game ? (
                  <img 
                    src={getGameThumbnail()} 
                    alt={game.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder-game.jpg';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <FaGamepad className="text-gray-400 text-2xl" />
                  </div>
                )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FaGamepad className="text-yellow-300" />
                <h1 className="text-2xl md:text-3xl font-bold">
                  {game?.name || 'Game Tournament'}
                </h1>
              </div>
              <div className="flex flex-wrap gap-4 text-sm md:text-base">
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className="text-blue-200" />
                  <span>{formatDateTime(tournament.startTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaUsers className="text-blue-200" />
                  <span>{tournament.maxPlayers || '∞'} Players</span>
                </div>
                <div className="flex items-center gap-2">
                  {tournament.tournamentType === 'cash' ? (
                    <FaMoneyBillWave className="text-green-300" />
                  ) : (
                    <FaCoins className="text-yellow-300" />
                  )}
                  <span>{tournament.tournamentType === 'cash' ? 'Cash' : 'Coin'} Tournament</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => navigate(-1)}
              className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors flex-shrink-0"
            >
              <FaArrowLeft className="text-xl" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Game Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tournament Card */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{tournament.name}</h2>
                    <p className="text-gray-600">{game?.description || 'Join this exciting tournament!'}</p>
                  </div>
                  <div className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
                    {tournament.status?.toUpperCase() || 'UPCOMING'}
                  </div>
                </div>

                {/* Prize Pool */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg mb-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-1">Total Prize Pool</p>
                    <p className="text-3xl font-bold text-gray-800">{formattedPrizePool}</p>
                    <p className="text-sm text-gray-500 mt-1">{tournament.prizeDistribution || 'Winner takes all'}</p>
                  </div>
                </div>

                {/* Game Info */}
                {game && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <FaInfoCircle className="text-blue-500 mr-2" />
                      About {game.name}
                    </h3>
                    <p className="text-gray-600">
                      {game.description || 'No description available.'}
                    </p>
                  </div>
                )}

                {/* Tournament Rules */}
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Tournament Rules</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {tournament.rules ? (
                      tournament.rules.split('\n').map((rule, index) => (
                        <li key={index} className="text-sm">{rule}</li>
                      ))
                    ) : (
                      <li className="text-sm">No specific rules provided. Follow standard game rules.</li>
                    )}
                  </ul>
                </div>

                {/* Join Button */}
                <div className="mt-8">
                  <button
                    onClick={handleJoinTournament}
                    disabled={joining || (tournament.currentPlayers?.length || 0) >= (tournament.maxPlayers || Infinity)}
                    className={`w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                      joining ? 'opacity-75 cursor-not-allowed' : ''
                    } ${
                      (tournament.currentPlayers?.length || 0) >= (tournament.maxPlayers || Infinity) 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:from-blue-600 hover:to-purple-700'
                    }`}
                  >
                    {joining ? (
                      'Joining...'
                    ) : (tournament.currentPlayers?.length || 0) >= (tournament.maxPlayers || Infinity) ? (
                      'Tournament Full'
                    ) : tournament.status?.toLowerCase() === 'completed' ? (
                      'Tournament Ended'
                    ) : tournament.status?.toLowerCase() === 'live' ? (
                      'Join Now!'
                    ) : (
                      `Join Tournament - ${formatEntryFee()}`
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Right Column - Tournament Status */}
            <div className="space-y-6">
              {/* Tournament Status */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Tournament Status</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Registration</span>
                      <span>{progress}% full</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-green-500 h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {tournament.currentPlayers?.length || 0} of {tournament.maxPlayers || '∞'} players registered
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center text-gray-700">
                        <FaClock className="text-blue-500 mr-2" />
                        <span>Starts In</span>
                      </div>
                      <span className="font-medium">{getTimeRemaining(tournament.startTime)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-700">
                        <FaCalendarAlt className="text-blue-500 mr-2" />
                        <span>Start Time</span>
                      </div>
                      <span className="text-sm text-gray-600">{formatDateTime(tournament.startTime)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Game Details */}
              {game && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Game Details</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Game Name</p>
                      <p className="font-medium">{game.name}</p>
                    </div>
                    {game.category && (
                      <div>
                        <p className="text-sm text-gray-500">Category</p>
                        <p className="font-medium">{game.category}</p>
                      </div>
                    )}
                    {game.difficulty && (
                      <div>
                        <p className="text-sm text-gray-500">Difficulty</p>
                        <p className="font-medium">{game.difficulty}</p>
                      </div>
                    )}
                    {game.averageDuration && (
                      <div>
                        <p className="text-sm text-gray-500">Average Game Duration</p>
                        <p className="font-medium">{game.averageDuration}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentLobby;
