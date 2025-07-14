import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import BackgroundBubbles from '../components/BackgroundBubbles';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { FaSearch, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../services/api';

const Challenges = () => {
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [friendName, setFriendName] = useState('');
  const [gameInput, setGameInput] = useState('');
  const [message, setMessage] = useState('');
  const [challenges, setChallenges] = useState([]);
  const [incomingInvites, setIncomingInvites] = useState([]);
  const [users, setUsers] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [showGameSuggestions, setShowGameSuggestions] = useState(false);

  const navigate = useNavigate();

  // Fetch users and games on component mount
  useEffect(() => {
    fetchUsers();
    fetchGames();
    fetchChallenges();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/challenges/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchGames = async () => {
    try {
      const response = await api.get('/challenges/games');
      setGames(response.data.games || []);
    } catch (error) {
      console.error('Error fetching games:', error);
      toast.error('Failed to load games');
    }
  };

  const fetchChallenges = async () => {
    try {
      const response = await api.get('/challenges');
      const allChallenges = response.data.challenges || [];
      
      const userData = JSON.parse(localStorage.getItem('user'));
      // Separate incoming and outgoing challenges
      const incoming = allChallenges.filter(challenge => 
        challenge.challenged._id === userData._id && 
        challenge.status === 'pending'
      );
      const outgoing = allChallenges.filter(challenge => 
        challenge.challenger._id === userData._id && 
        challenge.status === 'pending'
      );
      
      setIncomingInvites(incoming);
      console.log(incoming);
      setChallenges([...outgoing, ...allChallenges.filter(c => c.status !== 'pending')]);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      toast.error('Failed to load challenges');
    }
  };

  const filteredUsers = friendName.length > 0
    ? users.filter(user =>
        user.fullName.toLowerCase().includes(friendName.toLowerCase()) &&
        user.fullName.toLowerCase() !== friendName.toLowerCase()
      )
    : [];

  const filteredGames = gameInput.length > 0
    ? games.filter(game =>
        game.displayName.toLowerCase().includes(gameInput.toLowerCase())
      )
    : games;

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!friendName || !gameInput) {
      toast.error('Please fill both friend name and game fields');
      return;
    }

    // Find the selected user and game
    const selectedUser = users.find(user => 
      user.fullName.toLowerCase() === friendName.toLowerCase()
    );
    const selectedGame = games.find(game => 
      game.displayName.toLowerCase() === gameInput.toLowerCase()
    );

    if (!selectedUser || !selectedGame) {
      toast.error('Please select valid user and game from the suggestions');
      return;
    }

    try {
      const API_BASE_URL = import.meta.env.MODE === 'development' 
         ? 'http://localhost:5000/api' 
         :  `${import.meta.env.VITE_API_BACKEND_URL}/api`;

      const response = await fetch(`${API_BASE_URL}/challenges`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          challengedUserId: selectedUser._id,
        gameId: selectedGame._id,
        message: message
        })
      });

      setSubmitting(true);

      toast.success('Challenge sent successfully!');
      setFriendName('');
      setGameInput('');
      setMessage('');
      fetchChallenges(); // Refresh the challenges list
    } catch (error) {
      console.error('Error sending challenge:', error);
      const errorMessage = error.response?.data?.message || 'Failed to send challenge';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelChallenge = async (challengeId) => {
    try {
      await api.put(`/challenges/${challengeId}/cancel`);
      toast.success('Challenge cancelled successfully');
      fetchChallenges();
    } catch (error) {
      console.error('Error cancelling challenge:', error);
      toast.error('Failed to cancel challenge');
    }
  };

  const handleAcceptInvite = async (challengeId , gameId) => {
    try {
      await api.put(`/challenges/${challengeId}/accept`);
      toast.success('Challenge accepted successfully');
      navigate(`/tournament-lobby/${gameId}`); // Redirect to game page after accepting
      fetchChallenges();
    } catch (error) {
      console.error('Error accepting challenge:', error);
      toast.error('Failed to accept challenge');
    }
  };

  const handleRejectInvite = async (challengeId) => {
    try {
      await api.put(`/challenges/${challengeId}/reject`);
      toast.success('Challenge rejected');
      fetchChallenges();
    } catch (error) {
      console.error('Error rejecting challenge:', error);
      toast.error('Failed to reject challenge');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'accepted': return 'text-green-600';
      case 'rejected': return 'text-red-600';
      case 'completed': return 'text-blue-600';
      case 'cancelled': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Rejected';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  return (
    <div className="relative min-h-screen pb-24 overflow-hidden text-white bg-blueGradient">
      <BackgroundBubbles />
      <div className="relative z-10">
        <Header />

        {/* Back Button styled like Support Page */}
        <div className="pt-16 px-4 max-w-2xl mx-auto flex items-center mb-2">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-400 hover:text-blue-500 text-lg font-semibold flex items-center"
          >
            <FiArrowLeft size={40} className="mr-1" />
          </button>
        </div>

        <div className="px-4 max-w-2xl mx-auto space-y-6">
          {/* Challenge Form */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="text-black">
              <div
                onClick={() => setIsFormOpen(!isFormOpen)}
                className="flex justify-between cursor-pointer"
              >
                <h2 className="text-lg font-bold text-blue-800">Challenge a Friend</h2>
                <span>{isFormOpen ? '▲' : '▼'}</span>
              </div>

              <form
                onSubmit={handleInviteSubmit}
                className={`mt-4 transition-all duration-300 ease-in-out ${isFormOpen
                    ? 'max-h-[1000px] opacity-100 scale-100'
                    : 'max-h-0 opacity-0 scale-95 pointer-events-none'
                  }`}
              >
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter friend's name"
                    value={friendName}
                    onChange={(e) => {
                      setFriendName(e.target.value);
                      setShowUserSuggestions(e.target.value.length > 0);
                    }}
                    onFocus={() => setShowUserSuggestions(friendName.length > 0)}
                    className="w-full p-2 border rounded"
                  />
                  {showUserSuggestions && filteredUsers.length > 0 && (
                    <ul className="absolute w-full bg-white border rounded mt-1 z-10 text-sm max-h-40 overflow-y-auto">
                      {filteredUsers.map((user, index) => (
                        <li
                          key={index}
                          onClick={() => {
                            setFriendName(user.fullName);
                            setShowUserSuggestions(false);
                          }}
                          className="px-3 py-2 hover:bg-gray-200 cursor-pointer flex items-center"
                        >
                          <img
                            src={user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}`}
                            alt={user.fullName}
                            className="w-6 h-6 rounded-full mr-2"
                          />
                          {user.fullName}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="relative mt-3">
                  <input
                    type="text"
                    placeholder="Enter game name"
                    value={gameInput}
                    onChange={(e) => {
                      setGameInput(e.target.value);
                      setShowGameSuggestions(e.target.value.length > 0);
                    }}
                    onFocus={() => setShowGameSuggestions(gameInput.length > 0)}
                    className="w-full p-2 border rounded"
                  />
                  {showGameSuggestions && filteredGames.length > 0 && (
                    <ul className="absolute w-full bg-white border rounded mt-1 z-10 text-sm max-h-40 overflow-y-auto">
                      {filteredGames.map((game, index) => (
                        <li
                          key={index}
                          onClick={() => {
                            setGameInput(game.displayName);
                            setShowGameSuggestions(false);
                          }}
                          className="px-3 py-2 hover:bg-gray-200 cursor-pointer flex items-center"
                        >
                          <img
                            src={game.thumbnail || 'https://via.placeholder.com/30x30'}
                            alt={game.displayName}
                            className="w-6 h-6 rounded mr-2"
                          />
                          {game.displayName}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <textarea
                  placeholder="Optional message (max 200 characters)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={200}
                  className="w-full p-2 border rounded mt-3 resize-none"
                  rows="3"
                />

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 text-white py-2 mt-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    'Send Challenge'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Incoming Invites */}
          {incomingInvites.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="text-black">
                <h2 className="text-lg font-semibold mb-3 text-red-700">Incoming Invites</h2>
                {incomingInvites.map((invite) => (
                  console.log(invite),
                  <div key={invite._id} className="flex justify-between items-center mb-3 p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <img
                        src={invite.challenger.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(invite.challenger.fullName)}`}
                        alt={invite.challenger.fullName}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-semibold">{invite.challenger.fullName}</p>
                        <p className="text-sm text-gray-600">{invite.game.displayName}</p>
                        {invite.message && (
                          <p className="text-xs text-gray-500 mt-1">"{invite.message}"</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptInvite(invite._id, invite.game._id)}
                        className="bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 text-sm"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectInvite(invite._id)}
                        className="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ongoing Challenges */}
          {challenges.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="text-black">
                <h2 className="text-lg font-semibold mb-3 text-blue-700">All Challenges</h2>
                {challenges.map((challenge) => (
                  <div key={challenge._id} className="flex justify-between items-center mb-3 p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <img
                        src={challenge.challenger.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(challenge.challenger.fullName)}`}
                        alt={challenge.challenger.fullName}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-semibold">
                          {challenge.challenger.fullName} → {challenge.challenged.fullName}
                        </p>
                        <p className="text-sm text-gray-600">{challenge.game.displayName}</p>
                        <p className={`text-xs ${getStatusColor(challenge.status)}`}>
                          {getStatusText(challenge.status)}
                        </p>
                        {challenge.message && (
                          <p className="text-xs text-gray-500 mt-1">"{challenge.message}"</p>
                        )}
                      </div>
                    </div>
                    {challenge.status === 'pending' && challenge.challenger._id === localStorage.getItem('userId') && (
                      <button
                        onClick={() => handleCancelChallenge(challenge._id)}
                        className="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 text-sm"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="text-black text-center">
                <FaSpinner className="animate-spin mx-auto mb-2" size={24} />
                <p>Loading challenges...</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && challenges.length === 0 && incomingInvites.length === 0 && (
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="text-black text-center">
                <p className="text-gray-500">No challenges yet. Send a challenge to get started!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Navbar />
    </div>
  );
};

export default Challenges;
