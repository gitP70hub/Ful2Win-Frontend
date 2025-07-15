import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaTrophy,
  FaGamepad,
  FaUsers,
  FaClock,
  FaSearch,
  FaRupeeSign,
  FaCoins,
  FaArrowLeft
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../services/api';
import axios from 'axios'
import Header from './Header';
import BackgroundBubbles from './BackgroundBubbles';
import Navbar from './Navbar';

// Countdown timer hook (keep backend logic, but update for new layout)
const useCountdown = ({ targetDate, endTime, status }, onStart, onComplete) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!targetDate) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const distance = target - now;
      if (distance <= 0) {
        setTimeLeft('00:00');
        return;
      }
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);
  return timeLeft;
};

// Format date and time
const formatDateTime = (dateString) => {
  if (!dateString) return 'TBD';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// Format prize pool with appropriate currency/coin display
const formatPrize = (amount, isCoin = false) => {
  if (isCoin) {
    return (
      <span>
        {amount.toLocaleString()} coins
      </span>
    );
  }
  return (
    <span className="flex items-center">
      <FaRupeeSign className="mr-1" />
      {amount.toLocaleString()}
    </span>
  );
};

// Format player count
const formatPlayerCount = (current, max) => {
  if (!max) return `${current} joined`;
  return `${current}/${max} players`;
};
// 🔽 Place this ConfirmRegisterModal ABOVE TournamentLobby
const ConfirmRegisterModal = ({ tournament, onConfirm, onCancel }) => {
  const isCoin = tournament?.tournamentType === 'coin';
  const entryFee = isCoin
    ? `${tournament?.entryFee} coins`
    : `₹${tournament?.entryFee}`;
  const prizePool = isCoin
    ? `${tournament?.prizePool} coins`
    : `₹${tournament?.prizePool}`;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50">
      <div className="bg-gray-900 text-white rounded-lg p-6 w-11/12 max-w-sm text-center shadow-xl border border-yellow-400">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">Register for Tournament?</h3>
        <p className="mb-2 text-white">Entry Fee: <span className="font-semibold">{entryFee}</span></p>
        <p className="mb-4 text-white">Prize Pool: <span className="font-semibold">{prizePool}</span></p>
        <div className="flex justify-center gap-4">
          <button
            className="bg-yellow-400 text-gray-900 font-semibold py-2 px-6 rounded hover:bg-yellow-300 transition"
            onClick={onConfirm}
          >
            Yes
          </button>
          <button
            className="bg-gray-700 text-white font-medium py-2 px-6 rounded hover:bg-gray-600 transition"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};


const TournamentLobby = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [game, setGame] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userId, setUserId] = useState(null);
  const [type, setType] = useState('cash'); // 'cash' or 'coin'


  const showPopup = (message) => {
  setModalMessage(message);
  setShowModal(true);
};
const [confirmModal, setConfirmModal] = useState({
  visible: false,
  tournament: null,
});
 const setTournamentStatus = async (tournamentId, newStatus) => {
  console.log("run setTournamentStatus");
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${import.meta.env.VITE_API_BACKEND_URL}/api/tournaments/${tournamentId}/status`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      }
    );
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Failed to set tournament status:', error);
    return false;
  }
};

const handleConfirmRegister = async () => {
  const tournament = confirmModal.tournament;
  if (!tournament) return;

  const tournamentId = tournament._id || tournament.id;

  await handleRegisterTournament(tournamentId);
  setConfirmModal({ visible: false, tournament: null });

  //navigate(`/gameOn/${gameId}/${tournamentId}`);
};

const handleCancelRegister = () => {
  setConfirmModal({ visible: false, tournament: null });
};



const SimpleModal = ({ message, onClose }) => (
  <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50">
    <div className="bg-gray-800 text-white rounded-lg p-6 w-11/12 max-w-xs text-center shadow-lg border border-yellow-400">
      <h3 className="text-xl font-bold text-yellow-400 mb-2">Notification</h3>
      <p className="text-white text-base mb-4">{message}</p>
      <button
        className="bg-yellow-400 text-gray-900 font-semibold py-2 px-6 rounded hover:bg-yellow-300 transition"
        onClick={onClose}
      >
        OK
      </button>
    </div>
  </div>
);

  // Get user ID from local storage
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData && userData._id) {
          setUserId(userData._id);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Format prize as string for confirmation dialog
  const formatPrizeString = (amount, isCoin = false) => {
    if (isCoin) return `${amount.toLocaleString()} coins`;
    return `₹${amount.toLocaleString()}`;
  };
const goToLeaderboard = ({ gameName, tournamentId }) => {
  navigate(`/leaderboard_singlegame/${gameName}/${tournamentId}`);
};
const handleRegisterTournament = async (tournamentId) => {
  const tournament = tournaments.find(t => t.id === tournamentId || t._id === tournamentId);
    
  // if (!tournament) {
  //   toast.error('Tournament not found');
  //   return;
  // }

  const isCoinTournament = tournament.tournamentType === 'coin';

  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user || !token) {
      toast.error('User not logged in');
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BACKEND_URL}/api/tournaments/${tournamentId}/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ playerId: user._id }),
          credentials: 'include'
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to register for tournament');
      }

      toast.success('Successfully registered for the tournament!');
      // Add any success handling here (e.g., update UI state)
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to register for tournament');
    }

    if (response.data.success) {
      toast.success('Registered successfully!');
      // ✅ Navigate to the game page
      handleViewTournament(tournamentId);
    } else {
      toast.error(response.data.message || 'Registration failed');
      return;
    }
  } catch (error) {
    console.error('Registration error:', error);
    
    toast.error(
      error.response?.data?.message || 'Failed to register for tournament'
      
    );
    fetchGameAndTournaments();
    return;
    
  }
};

  // Handle view/join tournament
  const handleViewTournament = (tournamentId) => {
    const tournament = tournaments.find(t => t.id === tournamentId);
    
    if (!tournament) {
      toast.error('Tournament not found');
      return;
    }

    const isCoinTournament = tournament.tournamentType === 'coin';
    
    // Show confirmation dialog first
    
    //  const isConfirmed = window.confirm(
    //   `Register for ${tournament.name}?\n\n` +
    //    `Entry Fee: ${formatPrizeString(tournament.entryFee || 0, isCoinTournament)}\n` +
    //    `Prize Pool: ${formatPrizeString(tournament.prizePool || 0, isCoinTournament)}`
      
    //  );

    // if (isConfirmed) {
    //   console.log('Tournament confirmed:', { userId, gameId, tournamentId });
      
    navigate(`/gameOn/${gameId}/${tournamentId}`);
   // }
  };
  //console.log(tournaments.currentPlayers);


  // Tournament card component
const TournamentCard = ({
  id,
  name,
  entryFee,
  prizePool,
  participants = [],
  maxParticipants,
  imageUrl,
  status,
  endTime,
  tournamentType,
  currentPlayers = [],
}) => {
  const progressPercent = Math.min(100, (participants.length / (maxParticipants || 1)) * 100);
  const countdown = useCountdown({ targetDate: endTime });
  const hasJoined = currentPlayers?.some(p =>
    typeof p === 'string' ? p === userId : p?.userId === userId
  );

  return (
    <div className={`relative w-full bg-gradient-to-r from-blue-900 via-blue-700 to-blue-900 rounded-xl p-2  text-white overflow-hidden mb-[2px] shadow-md shadow-[#292828]`}> 
      <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${status === 'live' ? 'bg-yellow-500 text-black' : status === 'completed' ? 'bg-gray-400 text-gray-900' : 'bg-yellow-500 text-black'}`}> 
        {status === 'live' ? 'LIVE' : status === 'completed' ? 'COMPLETED' : status.toUpperCase()} 
      </div>
      <div className="absolute top-1 right-1 text-[10px]">
        Ends in: <span className="font-bold">{countdown || '00:00'}</span>
      </div>
      <div className="flex gap-2 items-center mt-4">
        <img
          src={imageUrl || '/placeholder.jpg'}
          alt={name}
          className="w-12 h-14 rounded-md border border-white object-cover"
        />
        <div className="flex-1 flex flex-col justify-between">
          <div className="text-[11px]">Prize Pool</div>
          <div className="text-base font-bold flex items-center">
            {tournamentType === 'coin' ? <FaCoins className="text-yellow-400 mr-1" /> : <FaRupeeSign className="text-yellow-400 mr-1" />} 
            {prizePool}
          </div>
          <div className="mt-1 text-[11px]">
            {participants.length} of {maxParticipants} Spots Left
          </div>
          <div className="w-full h-1 bg-gray-600 rounded-full mt-1">
            <div
              className="h-full bg-yellow-400 rounded-full"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
        <div className="ml-1 flex flex-col items-end">
          <button
            className={`bg-green-500 hover:bg-green-600 text-black font-bold px-3 py-1 rounded-full text-xs whitespace-nowrap mb-1 ${hasJoined || status === 'completed' ? 'opacity-50 cursor-not-allowed bg-gray-400 text-gray-700' : ''}`}
            onClick={() => {
              if (!hasJoined && status === 'live') {
                setConfirmModal({ visible: true, tournament: tournaments.find(t => t._id === id || t.id === id) });
              } else if (hasJoined && status === 'live') {
                handleViewTournament(id);
              }
            }}
            disabled={hasJoined || status !== 'live'}
          >
            <div>{tournamentType === 'coin' ? <FaCoins className="inline mr-1" /> : <FaRupeeSign className="inline mr-1" />} {entryFee}</div>
          </button>
        </div>
      </div>
      <div className="flex justify-between items-center mt-2 border-t border-white/20 pt-1 text-[10px]">
        <div className="border px-2 py-0.5 rounded-full cursor-pointer">How to play</div>
        <div className="border px-2 py-0.5 rounded-full cursor-pointer" onClick={() => goToLeaderboard({ gameName: game?.name, tournamentId: id })}>Leaderboard</div>
      </div>
    </div>
  );
};

  // Fetch game and tournaments
  const fetchGameAndTournaments = useCallback(async () => {
    if (!gameId) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login', { state: { from: `/tournament-lobby/${gameId}` } });
        return;
      }

      const [gameResponse, tournamentsResponse] = await Promise.all([
        api.get(`/games/${gameId}`, {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: (status) => status < 500
        }),
        api.get(`/tournaments?gameId=${gameId}`, {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: (status) => status < 500
        })
      ]);

      if (gameResponse.data.success) {
        setGame(gameResponse.data.data);
      } else {
        throw new Error(gameResponse.data.message || 'Failed to load game');
      }

      if (tournamentsResponse.data.success) {
        setTournaments(tournamentsResponse.data.data || []);
      } else {
        throw new Error(tournamentsResponse.data.message || 'Failed to load tournaments');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message || 'Failed to load data');
      toast.error(error.message || 'Failed to load data');
      
      if (error.response?.status === 401) {
        navigate('/login', { state: { from: `/tournament-lobby/${gameId}` } });
      } else if (error.response?.status === 404) {
        navigate('/tournaments');
      }
    } finally {
      setLoading(false);
    }
  }, [gameId, navigate]);

  // Initial data fetch
  useEffect(() => {
    fetchGameAndTournaments();
  }, [fetchGameAndTournaments]);

  // Filter and separate tournaments by type
 const groupAndLimitTournaments = (list) => {
  const filtered = list.filter(t =>
    (activeFilter === 'all' || t.status === activeFilter) &&
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusOrder = ['live', 'upcoming', 'completed'];

  const grouped = {
    live: [],
    upcoming: [],
    completed: [],
    
  };

  for (const t of filtered) {
    if (grouped[t.status]) {
      grouped[t.status].push(t);
    }
  }

  // Limit completed to 5
  grouped.completed = grouped.completed.slice(0, 3);

  // Merge in order: live → upcoming → completed
  return statusOrder.flatMap(status => grouped[status] || []);
};

// Helper to remove duplicate tournaments by _id
const uniqueTournaments = (tournaments) => {
  const seen = new Set();
  return tournaments.filter(t => {
    if (seen.has(t._id)) return false;
    seen.add(t._id);
    return true;
  });
};

// Apply to both coin and cash
const filteredTournaments = {
  coins: uniqueTournaments(groupAndLimitTournaments(tournaments.filter(t => t.tournamentType === 'coin'))),
  cash: uniqueTournaments(groupAndLimitTournaments(tournaments.filter(t => t.tournamentType !== 'coin'))),
};

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p>Loading tournaments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="text-center p-6 bg-red-900/50 rounded-lg">
          <p className="text-red-300 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-blueGradient text-white"> 
   
      <BackgroundBubbles />
      <Header />
      <main className="container mx-auto px-2 pt-24 pb-20 relative z-10">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 rounded-full hover:bg-gray-800/50"
          >
            <FaArrowLeft className="text-xl" />
          </button>
          <h1 className="text-3xl font-bold">
            {game?.displayName || game?.name || 'Tournaments'}
          </h1>
        </div>
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <FaSearch className="absolute top-3 left-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search tournaments..."
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg py-2 pl-10 pr-4 placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex space-x-2 justify-evenly overflow-x-auto">
            {['all', 'upcoming', 'live', 'completed',].map(filter => (
              <button
                key={filter}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  activeFilter === filter
                    ? 'bg-yellow-500 text-gray-900'
                    : 'bg-gray-800/50 text-white'
                }`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-12">
          {filteredTournaments[type]?.length > 0 && (
            <div>
             <div className='flex justify-between mb-4 m-2 '>
              <h1  onClick={() => setType('cash')}
      className={`px-4 py-2 rounded-full text-sm font-medium border ${
        type === 'cash'
          ? 'bg-yellow-500 text-gray-900 border-yellow-400'
          : 'bg-gray-800/50 text-white border-gray-700'
      }`}>Cash</h1>
              <h1  onClick={() => setType('coins')}
      className={`px-4 py-2 rounded-full text-sm font-medium border ${
        type === 'coins'
          ? 'bg-yellow-500 text-gray-900 border-yellow-400'
          : 'bg-gray-800/50 text-white border-gray-700'
      }`}>Coins</h1>

             </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {filteredTournaments[type]?.map(tournament => (
                  <TournamentCard
                    key={tournament._id}
                    id={tournament._id}
                    name={tournament.name}
                    entryFee={tournament.entryFee}
                    prizePool={tournament.prizePool}
                    participants={tournament.participants || []}
                    maxParticipants={tournament.maxParticipants}
                    imageUrl={game.assets?.thumbnail || tournament.imageUrl}
                    status={tournament.status}
                    endTime={tournament.endTime}
                    tournamentType={tournament.tournamentType}
                    currentPlayers={tournament.currentPlayers || []}
                    
                  />
                ))}
              </div>
            </div>
          )}
         { /* {filteredTournaments.coins.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <FaCoins className="text-yellow-500 mr-2" /> Coins Tournaments
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTournaments.coins.map(tournament => (
                  <TournamentCard
                    key={tournament._id}
                    id={tournament._id}
                    name={tournament.name}
                    entryFee={tournament.entryFee}
                    prizePool={tournament.prizePool}
                    participants={tournament.participants || []}
                    maxParticipants={tournament.maxParticipants}
                    imageUrl={tournament.imageUrl}
                    status={tournament.status}
                    endTime={tournament.endTime}
                    tournamentType={tournament.tournamentType}
                    currentPlayers={tournament.currentPlayers || []}
                  />
                ))}
              </div>
            </div>
          )} */}
        </div>
      </main>
      <Navbar />
      {showModal && (
        <SimpleModal
          message={modalMessage}
          onClose={() => setShowModal(false)}
        />
      )}
      {confirmModal.visible && (
        <ConfirmRegisterModal
          tournament={confirmModal.tournament}
          onConfirm={handleConfirmRegister}
          onCancel={handleCancelRegister}
        />
      )}
    </div>
  );
};

export default TournamentLobby;
