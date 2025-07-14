import React, { useState, useEffect } from 'react';
import {
  FaArrowLeft,
  FaClipboard,
  FaWhatsapp,
  FaTelegramPlane,
  FaGift,
  FaUserFriends,
  FaUserCheck,
  FaUserClock,
  FaUserTimes,
  FaCoins,
  FaRupeeSign,
  FaSearch,
  FaSpinner,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import BackgroundBubbles from '../components/BackgroundBubbles';
import BackgroundCircles from '../components/BackgroundCircles';
import Header from '../components/Header';
import Navbar from '../components/Navbar';

const ReferralPage = () => {
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('referral');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    completed: 0,
    totalEarnings: 0,
  });

  const navigate = useNavigate();

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center"><FaUserCheck className="mr-1" />Active</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full flex items-center"><FaUserClock className="mr-1" />Pending</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center"><FaCoins className="mr-1" />Completed</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full flex items-center"><FaUserTimes className="mr-1" />Inactive</span>;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const referralRes = await api.get('/referrals/my-code', { headers });
        const dataRes = await api.get('/referrals/my-referrals', { headers });

        if (referralRes.data.success) {
          setReferralCode(referralRes.data.referralCode);
        }

        if (dataRes.data.success) {
          setReferrals(dataRes.data.referrals || []);
          setStats({
            total: dataRes.data.totalReferrals || 0,
            active: dataRes.data.activeReferrals || 0,
            pending: dataRes.data.pendingReferrals || 0,
            completed: dataRes.data.completedReferrals || 0,
            totalEarnings: dataRes.data.totalEarnings || 0,
          });
        }
      } catch (err) {
        toast.error('Error fetching referral data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCopy = () => {
  navigator.clipboard.writeText(referralCode);
  setCopied(true);

  toast(
    ({ closeToast }) => (
      <div className="p-4 rounded-xl bg-blue-800 text-white flex items-center space-x-3 shadow-lg">
        <FaClipboard className="text-xl text-blue-300" />
        <div className="flex-1">
          <div className="font-semibold">Referral Code Copied!</div>
          <div className="text-sm text-blue-200">You can now share it with your friends.</div>
        </div>
        <button onClick={closeToast} className="text-sm text-blue-300 hover:underline">Close</button>
      </div>
    ),
    {
      position: "top-center",
      autoClose: 2500,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
      hideProgressBar: true,
      style: {
        borderRadius: '12px',
        margin: '20px',
        background: 'transparent',
        boxShadow: 'none',
      },
      bodyClassName: () => "p-0",
    }
  );

  setTimeout(() => setCopied(false), 2000);
};



  const handleShare = (platform) => {
    const url = `${window.location.origin}/signup?ref=${referralCode}`;
    const text = `Join Ful2Win and earn rewards using my code: ${referralCode}`;
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    } else if (platform === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const filteredReferrals = referrals.filter(ref => {
    const matchSearch = ref.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || ref.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || ref.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 text-white pb-20 relative">
      <BackgroundBubbles />
      <BackgroundCircles />
      <div className="relative z-10">
        <Header />

        <div className="container mx-auto px-4 pt-20">
          <div className="flex items-center justify-center relative mb-6">
            <button onClick={() => navigate(-1)} className="absolute left-0 text-white text-2xl px-2">
              <FaArrowLeft />
            </button>
            <h1 className="text-xl font-semibold">Refer & Earn</h1>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total', value: stats.total },
              { label: 'Active', value: stats.active, color: 'text-green-400' },
              { label: 'Pending', value: stats.pending, color: 'text-yellow-400' },
              { label: 'Earnings', value: `${stats.totalEarnings}`, icon: true },
            ].map(({ label, value, color, icon }, i) => (
              <div
                key={i}
                className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-4 shadow text-center"
              >
                <div className="text-xs text-white/80">{label}</div>
                <div className={`text-xl font-bold ${color || ''} flex items-center justify-center`}>
                  {icon && <FaRupeeSign className="mr-1" />}
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden shadow-md">
            {/* Tabs */}
            <div className="flex border-b border-white/20">
              <button
                onClick={() => setActiveTab('referral')}
                className={`w-1/2 py-3 text-sm font-medium ${activeTab === 'referral' ? 'text-white border-b-2 border-blue-400' : 'text-white/70'}`}
              >
                Your Referral Code
              </button>
              <button
                onClick={() => setActiveTab('tracking')}
                className={`w-1/2 py-3 text-sm font-medium ${activeTab === 'tracking' ? 'text-white border-b-2 border-blue-400' : 'text-white/70'}`}
              >
                Referral Tracking
              </button>
            </div>

            <div className="p-5 text-white">
              {activeTab === 'referral' ? (
                <>
                  <h2 className="text-lg font-bold mb-4">Your Referral Code</h2>
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-xl mb-6">
                    <div className="flex items-center justify-between">
                      <div className="text-xl font-mono font-semibold text-blue-200">{referralCode || 'Loading...'}</div>
                      <button onClick={handleCopy} className="flex items-center bg-blue-600 px-3 py-1 rounded-lg hover:bg-blue-700">
                        <FaClipboard className="mr-2" />
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="mt-4 flex space-x-4">
                      <button onClick={() => handleShare('whatsapp')} className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center justify-center">
                        <FaWhatsapp className="mr-2" /> WhatsApp
                      </button>
                      <button onClick={() => handleShare('telegram')} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center justify-center">
                        <FaTelegramPlane className="mr-2" /> Telegram
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold mb-3">How it works</h3>
                    <div className="grid md:grid-cols-3 gap-4 text-sm text-white/90">
                      <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg text-center">
                        <FaUserFriends className="text-2xl mx-auto mb-2" />
                        Share your referral code
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg text-center">
                        <FaGift className="text-2xl mx-auto mb-2" />
                        Friends sign up
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg text-center">
                        <FaRupeeSign className="text-2xl mx-auto mb-2" />
                        Earn ₹200 on first deposit
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row justify-between mb-4">
                    <div className="relative mb-2 sm:mb-0">
                      <FaSearch className="absolute top-2.5 left-3 text-white/70" />
                      <input
                        type="text"
                        className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-md placeholder-white/60 text-white w-full"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="py-2 px-4 bg-white/10 text-white border border-white/20 rounded-md"
                    >
                      <option value="all">All</option>
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  {loading ? (
                    <div className="flex justify-center py-10">
                      <FaSpinner className="animate-spin text-white text-2xl" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-white/20 text-sm">
                        <thead>
                          <tr className="bg-white/10">
                            <th className="px-4 py-2 text-left">User</th>
                            <th className="px-4 py-2 text-left">Joined</th>
                            <th className="px-4 py-2 text-left">Status</th>
                            <th className="px-4 py-2 text-left">Reward</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredReferrals.map((ref) => (
                            <tr key={ref._id} className="border-b border-white/10 hover:bg-white/5">
                              <td className="px-4 py-2">{ref.user?.name || 'N/A'}</td>
                              <td className="px-4 py-2">{new Date(ref.createdAt).toLocaleDateString()}</td>
                              <td className="px-4 py-2">{getStatusBadge(ref.status)}</td>
                              <td className="px-4 py-2">
                                {ref.rewardAmount ? (
                                  <span className="text-green-400 flex items-center">
                                    <FaRupeeSign className="mr-1" />
                                    {ref.rewardAmount}
                                  </span>
                                ) : (
                                  '-'
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {filteredReferrals.length === 0 && (
                        <div className="text-center text-white/80 py-6">No referrals found.</div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <Navbar />
    </div>
  );
};

export default ReferralPage;