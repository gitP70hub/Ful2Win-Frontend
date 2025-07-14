import React, { useEffect, useState, useCallback } from 'react';
import { GiTwoCoins } from 'react-icons/gi';
import { FaRedoAlt, FaPlay, FaBolt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import BackgroundBubbles from '../components/BackgroundBubbles';
import SpinWheelScreen from '../components/SpinWheelScreen';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import { toast } from 'react-toastify';

const Wallet = () => {
  const navigate = useNavigate();
  const [walletData, setWalletData] = useState({
    deposit: 0,
    winning: 0,
    bonus: 0,
    coins: 0,
    balance: 0,
    profilePicture: '',
    transactions: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const { currentUser } = useAuth();

  const fetchUserData = useCallback(async () => {
    try {
      setRefreshing(true);
      const userData = await authService.getCurrentUserProfile();

      if (userData) {
        setWalletData(prev => ({
          ...prev,
          coins: userData.coins || 0,
          balance: userData.balance || userData.Balance || 0,
          deposit: userData.deposit || 0,
          winning: userData.winning || 0,
          bonus: userData.bonus || 0,
          profilePicture: userData.profilePicture || userData.avatar || '',
        }));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load wallet data');

      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (localUser) {
        setWalletData(prev => ({
          ...prev,
          coins: localUser.coins || 0,
          balance: localUser.balance || localUser.Balance || 0,
          deposit: localUser.deposit || 0,
          winning: localUser.winning || 0,
          bonus: localUser.bonus || 0,
          profilePicture: localUser.profilePicture || localUser.avatar || '',
        }));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleRefresh = () => {
    fetchUserData();
  };

  const handleSpinClick = () => setShowSpinWheel(true);
  const handleCloseSpin = () => setShowSpinWheel(false);

  const handleReward = (reward) => {
    if (reward.includes('Coins')) {
      const coinsWon = parseInt(reward);
      setWalletData((prev) => ({
        ...prev,
        coins: prev.coins + coinsWon,
      }));
    }
  };

  return (
    <div className="relative min-h-screen pb-24 overflow-hidden text-white bg-gradient-to-b from-[#0b3fae] via-[#1555d1] to-[#2583ff]">
      <BackgroundBubbles />
      <div className="relative z-10">
        <Header />

        <div className="pt-20 mt-7 px-4 max-w-4xl mx-auto space-y-6">
          {/* Wallet Card */}
          <div className="w-full border border-white/30 rounded-xl text-white text-center p-4">
            {/* Profile Picture */}
            <div className="w-20 h-20 rounded-full bg-yellow-400 mx-auto flex items-center justify-center overflow-hidden mb-4 border-[3px] border-dullBlue">
              {walletData.profilePicture ? (
                <img
                  src={walletData.profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://cdn-icons-png.flaticon.com/512/3069/3069172.png';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white text-2xl font-bold">
                  {currentUser?.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>

            {/* Coins Section */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <p className="text-white/80 text-sm">Coins</p>
                <button 
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <FaRedoAlt size={14} className={refreshing ? 'animate-spin' : ''} />
                </button>
              </div>
              <h3 className="text-lg font-semibold text-yellow-300 flex items-center gap-1">
                {walletData.coins.toLocaleString()} <GiTwoCoins size={18} />
              </h3>
            </div>

            <div className="my-3 h-[1px] w-full bg-white/30" />

            {/* Row: Balance | Winning | Bonus */}
            <div className="flex flex-wrap justify-between text-sm sm:text-base font-medium text-center gap-4">
              <div className="flex-1 min-w-[100px]">
                <p className="text-white/80">Balance</p>
                <p className="text-yellow-300">₹{walletData.balance.toLocaleString()}</p>
              </div>
              <div className="flex-1 min-w-[100px]">
                <p className="text-white/80">Winning</p>
                <h2 className="text-lg font-bold text-green-400">₹ {walletData.winning}</h2>
              </div>
              <div className="flex-1 min-w-[100px]">
                <p className="text-white/80">Bonus</p>
                <h2 className="text-lg font-bold text-yellow-300">₹ {walletData.bonus}</h2>
              </div>
            </div>

            <div className="my-3 h-[1px] w-full bg-white/30" />

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                className="w-full py-3 rounded-xl bg-yellow-400 text-blue-900 font-bold text-lg shadow-md hover:bg-yellow-300 transition"
                onClick={() => navigate('/add')}
              >
                ADD ₹
              </button>
              <button
                className="w-full py-3 rounded-xl border border-blue-300 bg-blue-900/60 text-white hover:bg-white/10 transition"
                onClick={() => navigate('/withdraw')}
              >
                WITHDRAW ₹ (Winning Only)
              </button>
              <p className="text-xs text-yellow-100 text-center">
                After KYC<br />
                Only Winning Amount is Withdrawable
              </p>
            </div>
          </div>

          {/* Quick Access Buttons */}
          <div className="flex justify-center gap-4 mt-6 flex-wrap">
            {[
              { icon: <FaRedoAlt size={18} className="text-blue-900" />, label: 'Spin', onClick: handleSpinClick },
              { icon: <FaPlay size={18} className="text-blue-900" />, label: 'Ads', onClick: () => navigate('/ads') },
              { icon: <FaBolt size={18} className="text-blue-900" />, label: 'Challenges', onClick: () => navigate('/challenges') },
            ].map((action, idx) => (
              <div
                key={idx}
                onClick={action.onClick}
                className="w-24 h-24 rounded-xl border border-blue-300 bg-blue-900/60 flex flex-col items-center justify-center text-white cursor-pointer hover:bg-blue-800 transition"
              >
                <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center mb-2">
                  {action.icon}
                </div>
                <span className="text-sm font-medium text-white">{action.label}</span>
              </div>
            ))}
          </div>

          {/* History Button */}
          <div className="w-full px-4 mt-4">
            <button
              onClick={() => navigate('/history')}
              className="w-full py-3 border border-blue-300 bg-blue-900/60 text-white text-center rounded-xl text-base font-semibold hover:bg-white/10 transition"
            >
              History
            </button>
          </div>
        </div>
      </div>

      <Navbar />

      {showSpinWheel && (
        <SpinWheelScreen
          isVisible={showSpinWheel}
          onClose={handleCloseSpin}
          onReward={handleReward}
        />
      )}
    </div>
  );
};

export default Wallet;