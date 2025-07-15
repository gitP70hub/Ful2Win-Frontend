import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { FaGamepad, FaTrophy, FaUserFriends, FaTimesCircle, FaCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Navbar from './Navbar';
import BackgroundBubbles from './BackgroundBubbles';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

// Time ago utility function
const timeAgo = (dateString) => {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date() - date) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
    }
  }
  
  return 'Just now';
};

// Icon map with all notification types
const iconMap = {
  // Existing types
  game: <FaGamepad className="text-purple-400 w-5 h-5" />,
  achievement: <FaTrophy className="text-yellow-400 w-5 h-5" />,
  followers: <FaUserFriends className="text-blue-400 w-5 h-5" />,
  tournament: <FaTrophy className="text-yellow-500 w-5 h-5" />,
  challenge: <FaGamepad className="text-purple-500 w-5 h-5" />,
  message: <FaUserFriends className="text-green-400 w-5 h-5" />,
  
  // New types
  new_game: <FaGamepad className="text-green-500 w-5 h-5" />,
  tournament_announcement: <FaTrophy className="text-yellow-500 w-5 h-5" />,
  game_update: <FaGamepad className="text-blue-400 w-5 h-5" />,
  tournament_results: <FaTrophy className="text-yellow-600 w-5 h-5" />,
  announcement: <FaUserFriends className="text-red-400 w-5 h-5" />,
  test: <FaGamepad className="text-gray-400 w-5 h-5" />,
  custom: <FaUserFriends className="text-indigo-400 w-5 h-5" />,
  
  // Default fallback
  default: <FaGamepad className="text-gray-300 w-5 h-5" />
};

// Filter options with all notification types
const filterOptions = [
  'all', 
  'message', 
  'game', 
  'achievement', 
  'followers', 
  'tournament', 
  'challenge',
  'new_game',
  'tournament_announcement',
  'game_update',
  'tournament_results',
  'announcement',
  'test',
  'custom'
];

const Notification = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [markingRead, setMarkingRead] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("play-sound", { detail: "notification" })); // 🔊 Play sound once on load new sound effect
    const fetchNotifications = async () => {
      if (!currentUser?.token) return;
      
      try {
        setLoading(true);
        const response = await api.get('/api/notifications', {
          headers: {
            'Authorization': `Bearer ${currentUser.token}`
          }
        });
        setNotifications(Array.isArray(response.data) ? response.data : []);
        setError('');
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications. Please try again.');
        toast.error('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchNotifications();
    
    // Set up socket connection if not already connected
    if (currentUser?.token && !socketRef.current) {
      const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: {
          token: currentUser.token
        },
        withCredentials: true
      });
      
      socketRef.current = socket;
      
      // Listen for new notifications
      socket.on('newNotification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
        
        // Show toast for new notifications if not on the notifications page
        if (window.location.pathname !== '/notifications') {
          toast.info(notification.message, {
            position: 'top-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
      });
      
      // Clean up socket on unmount
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    }
  }, [currentUser]);

  const markAsRead = async (id = null) => {
    if (!currentUser?.token) return;
    
    try {
      setMarkingRead(true);
      
      if (id) {
        // Mark single notification as read
        await api.post('/api/notifications/mark-read', 
          { notificationIds: [id] },
          {
            headers: {
              'Authorization': `Bearer ${currentUser.token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        setNotifications(prev => 
          prev.map(n => n._id === id ? { ...n, read: true } : n)
        );
        toast.success('Notification marked as read');
      } else {
        // Mark all notifications as read
        const notificationIds = notifications
          .filter(n => !n.read)
          .map(n => n._id);
          
        if (notificationIds.length > 0) {
          await api.post('/api/notifications/mark-read', 
            { notificationIds },
            {
              headers: {
                'Authorization': `Bearer ${currentUser.token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          setNotifications(prev => 
            prev.map(n => ({ ...n, read: true }))
          );
          toast.success('All notifications marked as read');
        } else {
          toast.info('No unread notifications');
        }
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast.error('Failed to update notification status');
    } finally {
      setMarkingRead(false);
    }
  };

  const removeNotification = async (id) => {
    if (!currentUser?.token) return;
    
    try {
      // Since the backend doesn't have a delete endpoint, we'll just remove it from the UI
      // and mark it as read if it's not already
      const notification = notifications.find(n => n._id === id);
      if (notification && !notification.read) {
        await markAsRead(id);
      }
      
      // Remove from local state
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Notification dismissed');
    } catch (err) {
      console.error('Error removing notification:', err);
      toast.error('Failed to remove notification');
    }
  };

  // Group notifications by date
  const groupNotificationsByDate = (notifications) => {
    return notifications.reduce((groups, notification) => {
      const date = new Date(notification.createdAt).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(notification);
      return groups;
    }, {});
  };

  // Filter and sort notifications
  const filteredNotifications = (filter === 'all' 
    ? [...notifications] 
    : notifications.filter(n => n.type === filter)
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Group by date
  const groupedNotifications = groupNotificationsByDate(filteredNotifications);
  const sortedDates = Object.keys(groupedNotifications).sort((a, b) => new Date(b) - new Date(a));

  const unreadCount = notifications.filter(n => !n.read).length;

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read when clicked
    if (!notification.read) {
      markAsRead(notification._id);
    }
    
    // Handle navigation based on notification type or data
    if (notification.data?.action?.route) {
      navigate(notification.data.action.route);
    }
    // Add more specific navigation logic based on notification type
    else if (notification.type === 'message' && notification.sender) {
      navigate(`/messages/${notification.sender}`);
    } else if (notification.type === 'tournament_announcement' && notification.data?.tournamentId) {
      navigate(`/tournaments/${notification.data.tournamentId}`);
    } else if (notification.type === 'new_game' && notification.data?.gameId) {
      navigate(`/games/${notification.data.gameId}`);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#0A2472] via-[#0D47A1] to-[#1565C0] text-white pb-24 overflow-hidden">
      <Header />
      
      <div className="container mx-auto px-4 py-6 pt-16">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-200 hover:text-white mb-4"
          >
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <button
                onClick={() => markAsRead()}
                disabled={markingRead}
                className="text-sm bg-yellow-400 hover:bg-yellow-300 text-black px-3 py-1 rounded-full font-medium transition-all"
              >
                {markingRead ? 'Marking...' : `Mark all as read (${unreadCount})`}
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {filterOptions.map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`capitalize px-4 py-1.5 text-sm rounded-full border font-medium transition-all duration-200 ${
                  filter === type
                    ? 'bg-yellow-400 text-black'
                    : 'bg-white/10 text-white hover:bg-white/20 border-white/20'
                }`}
              >
                {type === 'all' ? 'All' : type.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* Notification Content */}
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-3 text-gray-300">Loading your notifications...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium transition-colors"
              >
                Retry
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-16 bg-gray-800/30 rounded-xl">
              <p className="text-gray-400 text-lg">No notifications found</p>
              {filter !== 'all' && (
                <button 
                  onClick={() => setFilter('all')} 
                  className="mt-3 text-blue-400 hover:text-blue-300 text-sm font-medium"
                >
                  View all notifications
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {sortedDates.map((date) => (
                <div key={date} className="space-y-3">
                  <div className="flex items-center my-4">
                    <div className="flex-1 border-t border-gray-700"></div>
                    <span className="px-3 text-sm text-gray-400">
                      {new Date(date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                    <div className="flex-1 border-t border-gray-700"></div>
                  </div>
                  
                  {groupedNotifications[date].map((note) => {
                    const NotificationIcon = iconMap[note.type] || iconMap.default;
                    const isUnread = !note.read;
                    
                    return (
                      <div 
                        key={note._id}
                        onClick={() => handleNotificationClick(note)}
                        className={`relative flex items-start gap-4 p-4 rounded-xl transition-all duration-200 cursor-pointer ${
                          isUnread 
                            ? 'bg-blue-900/20 hover:bg-blue-900/30 border-l-4 border-blue-500' 
                            : 'bg-white/5 hover:bg-white/10 border-l-4 border-transparent'
                        }`}
                      >
                        <div className={`flex-shrink-0 mt-0.5 ${isUnread ? '' : 'opacity-70'}`}>
                          {React.cloneElement(NotificationIcon, {
                            className: `${NotificationIcon.props.className} ${isUnread ? 'text-blue-400' : 'text-gray-400'}`
                          })}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h3 className={`font-medium ${
                              isUnread ? 'text-white' : 'text-gray-200'
                            }`}>
                              {note.title || note.type.split('_').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ')}
                            </h3>
                            <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                              {timeAgo(note.createdAt)}
                            </span>
                          </div>
                          
                          <p className={`mt-1 text-sm ${
                            isUnread ? 'text-gray-200' : 'text-gray-400'
                          }`}>
                            {note.message}
                          </p>
                          
                          {/* Display additional data if available */}
                          {note.data && (
                            <div className="mt-2 pt-2 border-t border-gray-700/50">
                              {note.data.tournamentName && (
                                <div className="text-xs text-blue-300">
                                  🏆 {note.data.tournamentName}
                                </div>
                              )}
                              {note.data.gameName && (
                                <div className="text-xs text-purple-300">
                                  🎮 {note.data.gameName}
                                </div>
                              )}
                              {note.data.prizePool && (
                                <div className="text-xs text-yellow-300">
                                  💰 Prize Pool: ${note.data.prizePool.toLocaleString()}
                                </div>
                              )}
                              {note.data.startTime && (
                                <div className="text-xs text-green-300">
                                  🕒 Starts: {new Date(note.data.startTime).toLocaleString()}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Action buttons */}
                          <div className="flex justify-end gap-2 mt-2">
                            {isUnread && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(note._id);
                                }}
                                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded flex items-center gap-1"
                              >
                                <FaCheck size={10} /> Mark as read
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(note._id);
                              }}
                              className="text-xs bg-red-600/20 hover:bg-red-600/30 text-red-300 px-2 py-1 rounded flex items-center gap-1"
                            >
                              <FaTimesCircle size={10} /> Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <Navbar />
      <BackgroundBubbles />
    </div>
  );
};

export default Notification;
