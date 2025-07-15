import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import BackgroundBubbles from '../components/BackgroundBubbles';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../services/api';
const Leaderboard = () => {
  const navigate = useNavigate();
  const { gameName, tournamentId } = useParams(); 
  const userId = JSON.parse(localStorage.getItem('user'))?._id;
  // State to manage active tab
const [activeTab, setActiveTab] = useState('leaderboard');
const [prizeBreakup, setPrizeBreakup] = useState([]);



  const [leaderboardData, setLeaderboardData] = useState([]);

  const fetchLeaderboard = async () => {
    try {
      
      console.log('[Leaderboard] Fetching leaderboard with params:', { gameName, tournamentId });
      
      const response = await api.get('/score/get-score', {
        params: {
          gameName,
          roomId: tournamentId
          
        }
      });
      
      
      const data = response.data;
      console.log('[Leaderboard] Raw API response:', response);
      console.log('[Leaderboard] Response data:', data);
      
      if (data && Array.isArray(data.scores)) {
        console.log(`[Leaderboard] Received ${data.scores.length} scores`);
        setLeaderboardData(data.scores);
      } else if (data && data.message) {
        console.log('[Leaderboard] Server message:', data.message);
        toast.info(data.message);
        console.log('[Leaderboard] Server message:', response.data.message);
        toast.info(response.data.message);
        setLeaderboardData([]);
      } else {
        console.error('[Leaderboard] Unexpected response format:', response.data);
        toast.error("Unexpected response format from server");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred while fetching leaderboard data.");
      navigate(-1);
      console.error("Error fetching leaderboard data:", error);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (gameName && tournamentId) {
      fetchLeaderboard();
    } else {
      console.error("Invalid gameName or tournamentId");
    }
  }, [gameName, tournamentId]);
   useEffect(() => {
    // 🔧 Temporary prize data
    setPrizeBreakup([
      { rank: '1', prize: 5000 },
      { rank: '2', prize: 4000 },
      { rank: '3', prize: 2500 },
      
    ]);
  }, []);

  const myScore = leaderboardData.find(player => player.userId === userId);
   const getBadge = (rank) => {
    if (rank === '1') return '🥇';
    if (rank === '2') return '🥈';
    if (rank === '3') return '🥉';
    return null;
  };

  return (
    <div className="relative min-h-screen bg-blueGradient text-white">
      <BackgroundBubbles />
      <Header />

      {/* Scrollable Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-14 pb-24 flex flex-col h-[calc(100vh-64px)] overflow-y-auto">
        {/* Back & Title */}
        <div className="flex items-center mt-6 mb-4">
          <button onClick={() => navigate(-1)} className="text-white text-lg mr-3">
            <FaArrowLeft />
          </button>
          <div>
    <h1 className="font-Orbitron italic text-white text-2xl tracking-wider uppercase font-semibold">
  MOST BOOT AMOUNT PAID
</h1>
        
          </div>

          
        </div>
<div className="relative z-20 mt-2">
  <div className="flex justify-around text-sm font-semibold text-white/60 border-b border-white/20 pb-1">
    {['leaderboard', 'prize'].map((tab) => (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={`uppercase transition-all duration-200 ${
          activeTab === tab
            ? 'text-white font-bold border-b-2 border-white'
            : 'text-white/50'
        }`}
      >
        {tab === 'leaderboard' && 'LEADERBOARD'}
        {tab === 'prize' && 'PRIZE BREAKUP'}
        
      </button>
    ))}
  </div>
</div>

        {/* Table Header */}
        {/* <div className="text-xs text-white/70 font-semibold px-2 mb-2 flex justify-between">
          <div className="w-1/12">#</div>
          <div className="w-5/12">Player</div>
          <div className="w-3/12 text-right">Score</div>
          <div className="w-3/12 text-right">Prize Won</div>
        </div> */}

        {/* Leaderboard Entries */}
  {activeTab === 'leaderboard' && (
  <div className="mt-4 space-y-2 pr-1 pb-4">
    {/* Header Row */}
  <div className="flex justify-between text-white/70 text-xs font-semibold px-4 pb-1 border-b border-white/10">
  <div className="w-4/12">Player</div>
  <div className="w-2/12 text-center">Score</div>
  
  <div className="w-2.5/12 text-right">Winnings</div>
</div>


    {/* Leaderboard Rows */}
    {leaderboardData.map((player, index) => (
      <div
        key={index}
        className="bg-white/10 backdrop-blur-md border border-white/10 rounded-lg px-4 py-2 flex justify-between items-center hover:scale-[1.01] transition"
      >
        {/* Profile Image + Username + Rank Badge */}
        <div className="flex items-center gap-3 w-4/12 relative">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20 bg-white/10">
            <img
              src={
                player.avatar ||
                player.profileImage ||
                `https://api.dicebear.com/7.x/thumbs/svg?seed=${player.username}`
              }
              alt="avatar"
              className="object-cover w-full h-full"
            />
          </div>
          <p className="text-sm text-white font-medium truncate">
            {player.username}
          </p>

          {/* Rank Badge */}
          <span className="absolute -top-1 -left-2 bg-yellow-400 text-black text-[10px] font-bold px-2 py-[1px] rounded-full shadow">
            #{index + 1}
          </span>
        </div>

        {/* Score */}
        <div className="w-2/12 text-center text-green-300 font-semibold text-sm">
          {player.score}
        </div>

        {/* Games Played */}
        {/* <div className="w-3/12 text-center text-white/80 text-xs font-semibold">
          {player.gamesPlayed || 1}
        </div> */}

        {/* Winnings */}
        <div className="w-3/12 text-right text-lime-300 text-sm font-semibold">
          ₹{player.prize}
        </div>
      </div>
    ))}
  </div>
)}


        {activeTab === 'prize' && (
  <div className="mt-6">
    {/* Table Header */}
    <div className="text-xs text-white/70 font-semibold px-2 mb-2 flex justify-between">
      <div className="w-1/2 text-left">Rank</div>
      <div className="w-1/2 text-right">Prize</div>
    </div>

    {/* Prize Rows */}
    <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 space-y-3">
      {prizeBreakup.map((item, index) => (
        <div
          key={index}
          className="flex items-center justify-between border-b border-white/10 pb-1 last:border-b-0"
        >
          <div className="w-1/2 flex items-center gap-2 text-white text-sm font-medium">
            {getBadge(item.rank) && (
              <span className="text-xl">{getBadge(item.rank)}</span>
            )}
            <span>{item.rank}</span>
          </div>
          <div className="w-1/2 text-right text-lime-300 font-semibold text-sm">
            ₹{item.prize}
          </div>
        </div>
      ))}
    </div>
  </div>
)}
{activeTab === 'info' && (
  <div className="mt-6 space-y-4 text-sm text-white/80 leading-relaxed">
    <h2 className="text-white text-lg font-semibold font-orbitron italic uppercase tracking-wide">How to Play</h2>

    <ul className="list-disc list-inside space-y-2">
      <li>Join the tournament before it starts by clicking the "Play" button.</li>
      <li>Each game has a set duration — complete it before the timer ends.</li>
      <li>Your score is calculated based on performance — aim for a high score!</li>
      <li>You can retry multiple times if allowed, only the best score is recorded.</li>
      <li>Check the "Leaderboard" tab to track your rank.</li>
      <li>Prizes will be distributed based on final rankings at the tournament’s end.</li>
    </ul>

    <p className="text-white/60 italic text-xs mt-4">
      Tip: Practice before the tournament begins to improve your chances!
    </p>
  </div>
)}

    <p className="text-center text-xs text-white/50 mt-3">Compete daily to reach the top!</p>
      </div>

      <Navbar />
    </div>
  );
};

export default Leaderboard;
