import React, { useState, useEffect, useCallback } from "react";
import {
  FiUser,
  FiUsers,
  FiDollarSign,
  FiShare2,
  FiLogOut,
  FiHeadphones,
  FiRefreshCw,
} from "react-icons/fi";
import { FaTrophy, FaRupeeSign, FaCoins } from "react-icons/fa";
import { IoMdPerson } from "react-icons/io";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import BackgroundBubbles from "../components/BackgroundBubbles";
import Account from "../components/Account";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";
import authService from "../services/authService";

const ProfileScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const [activeSection, setActiveSection] = useState("profile");
  const [currentUser, setCurrentUser] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [userStats, setUserStats] = useState({
    balance: 0,
    coins: 0,
    followers: 0,
    wins: 0,
    matches: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { userId } = useParams();

  const getProfilePictureUrl = (profilePic) => {
    if (!profilePic) return "";
    if (typeof profilePic === "string") {
      if (profilePic.startsWith("data:image/")) return profilePic;
      if (profilePic.includes("cloudinary.com"))
        return profilePic.replace("http://", "https://");
      if (profilePic.startsWith("/"))
        return `${window.location.origin}${profilePic}`;
      return profilePic;
    }
    if (typeof profilePic === "object") {
      return (
        profilePic.secure_url ||
        profilePic.url ||
        profilePic.publicUrl ||
        (Array.isArray(profilePic) && profilePic[0]?.url) ||
        ""
      );
    }
    return "";
  };

  useEffect(() => {
    if (!currentUser?._id) {
      setProfilePictureUrl("");
      return;
    }
    const picUrl = getProfilePictureUrl(currentUser.profilePicture);
    setProfilePictureUrl(picUrl || "");
  }, [currentUser]);

  const refreshUserData = useCallback(async () => {
    if (!currentUser?._id) return;
    try {
      const response = await authService.getCurrentUserProfile();
      if (response) {
        localStorage.setItem("user", JSON.stringify(response));
        setCurrentUser((prev) => ({
          ...prev,
          ...response,
        }));
        setUserStats({
          balance: response.balance || 0,
          coins: response.coins || 0,
          followers: response.stats?.followerCount || 0,
          wins: response.stats?.wins || 0,
          matches: response.stats?.matches || 0,
        });
        return true;
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
    return false;
  }, [currentUser?._id]);

  const fetchUserPosts = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const userData = await authService.getUserProfile(userId);
      setUserPosts(userData.posts || []);
    } catch (error) {
      console.error("Error fetching user posts:", error);
    }
  }, []);

  const fetchUserData = useCallback(async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token");

      const profileData = userId
        ? await authService.getUserProfile(userId)
        : await authService.getCurrentUserProfile();

      if (!profileData?._id) throw new Error("No user data");

      setCurrentUser(profileData);
      setUserStats({
        balance: profileData.balance || 0,
        coins: profileData.coins || 0,
        followers: profileData.stats?.followerCount || 0,
        wins: profileData.stats?.wins || 0,
        matches: profileData.stats?.matches || 0,
      });

      await fetchUserPosts(profileData._id);
    } catch (error) {
      toast.error("Error loading profile. Please login again.");
      navigate("/login", { replace: true });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, navigate, fetchUserPosts]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    const success = await refreshUserData();
    toast[success ? "success" : "error"](
      success ? "Profile refreshed!" : "Refresh failed."
    );
    setRefreshing(false);
  };

  const stats = [
    {
      icon: <FaRupeeSign className="text-green-500" />,
      label: "Balance",
      value: userStats.balance.toLocaleString(),
    },
    {
      icon: <FaCoins className="text-yellow-500" />,
      label: "Coins",
      value: userStats.coins.toLocaleString(),
    },
    {
      icon: (
        <img
          src="/src/assets/win2.png"
          alt="Wins"
          className="w-5 h-5 object-contain"
        />
      ),
      label: "Wins",
      value: userStats.wins.toLocaleString(),
    },
    {
      icon: <IoMdPerson className="text-purple-500" />,
      label: "Followers",
      value: userStats.followers.toLocaleString(),
    },
  ];

  const navItems = [
    { id: "account", label: "Account", icon: <FiUser />, path: "/account" },
    { id: "tournament", label: "History", icon: <FaTrophy />, path: "/tournamenthistory" },
    { id: "users", label: "Users", icon: <FiUsers />, path: "/users" },
    { id: "wallet", label: "Wallet", icon: <FaRupeeSign />, path: "/wallet" },
  ];

  const profileActions = [
    { icon: <FiShare2 className="text-blue-600" />, text: "Referrals", action: "referrals" },
    { icon: <img src="/src/assets/kyc7.png" alt="KYC" className="w-5 h-5" />, text: "KYC Status", action: "kyc" },
    { icon: <FiHeadphones className="text-blue-600" />, text: "Support", action: "support" },
    { icon: <FiLogOut className="text-red-500" />, text: "Log Out", action: "logout", isDanger: true },
  ];

  const handleProfileAction = (action) => {
    if (action === "logout") return setShowLogoutConfirm(true);
    navigate(`/${action === "referrals" ? "refer" : action}`);
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out!");
    navigate("/login");
  };

  return (
    <div className="min-h-screen w-full text-white overflow-x-hidden relative px-4 py-8"
      style={{
        background: "linear-gradient(to bottom, #0A2472 0%, #0D47A1 45%, #1565C0 100%)",
        paddingBottom: '100px'
      }}>
      <BackgroundBubbles />
      <div className="relative z-10 py-4 max-w-2xl mx-auto px-4">
        {/* Profile Header */}
        <div className="flex items-start justify-between px-4 mb-4">
          <div className="flex items-center space-x-4">
            <div className="relative group w-20 h-20">
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-dullBlue bg-gray-100 flex items-center justify-center">
                {profilePictureUrl ? (
                  <img src={profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <FiUser className="text-dullBlue text-3xl" />
                )}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold">{currentUser?.fullName || 'User Name'}</h2>
              <p className="text-sm text-dullBlue">@{currentUser?.username || 'username'}</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            title="Refresh"
            disabled={loading}
          >
            <FiRefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-around mb-2 mt-4 px-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id);
                navigate(item.path);
              }}
              className="flex flex-col items-center space-y-1"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all ${
                activeSection === item.id ? "bg-blue-400" : "bg-blue-500"
              } text-white`}>
                {item.icon}
              </div>
              <span className={`text-sm ${activeSection === item.id ? "font-semibold" : "font-medium text-white/80"}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* Stats Grid with Glassmorphism */}
        <div className="grid grid-cols-2 gap-3 mb-4 mt-4">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-md p-4 rounded-xl flex items-center space-x-3 shadow-sm border border-white/20">
              <div className="w-10 h-10 bg-gray-100 border rounded-full flex items-center justify-center">
                {stat.icon}
              </div>
              <div>
                <div className="font-bold text-white text-lg">
                  {loading ? "..." : stat.value}
                </div>
                <div className="text-xs text-white/80">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions List with Glassmorphism */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 mb-20">
          {profileActions.map((item, idx, array) => (
            <React.Fragment key={item.action}>
              <button
                onClick={() => handleProfileAction(item.action)}
                className={`w-full flex items-center p-4 rounded-xl transition-all group ${
                  item.isDanger ? "hover:bg-red-100/10" : "hover:bg-white/10"
                }`}
              >
                <div className={`w-10 h-10 flex items-center justify-center mr-3 rounded-full ${
                  item.isDanger ? "bg-red-50" : "bg-blue-50"
                }`}>
                  {item.icon}
                </div>
                <div className={`flex-1 text-left font-medium ${item.isDanger ? "text-red-600" : "text-white"}`}>
                  {item.text}
                </div>
                <div className="text-white/70 text-lg">&gt;</div>
              </button>
              {idx < array.length - 1 && <div className="w-full h-px my-2 bg-white/20" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Navbar Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <div className="max-w-2xl mx-auto">
          <Navbar />
        </div>
      </div>

      {/* Logout Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[90%] max-w-sm text-center shadow-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Are you sure you want to logout?
            </h2>
            <div className="flex justify-center gap-4">
              <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                Yes
              </button>
              <button onClick={() => setShowLogoutConfirm(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileScreen;