import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiArrowLeft, FiSend, FiClock } from 'react-icons/fi';
import BackgroundBubbles from './BackgroundBubbles';
import { io } from 'socket.io-client';
import api from '../services/api';
import chatService from '../services/chatService';

const ChatScreen = ({ selectedFriend, setSelectedFriend }) => {
  const [socketError, setSocketError] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function getUserIdFromStorage() {
      let userId = localStorage.getItem('userId');
      if (!userId) {
        try {
          const user = JSON.parse(localStorage.getItem('user'));
          if (user && user._id) userId = user._id;
        } catch (e) {}
      }
      return userId ? String(userId) : null;
    }
    setCurrentUserId(getUserIdFromStorage());
    function handleStorage() {
      setCurrentUserId(getUserIdFromStorage());
    }
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (!currentUserId) return;
    
    const SOCKET_URL = new URL(api.defaults.baseURL).origin;

    // Create socket connection if it doesn't exist
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        withCredentials: true,
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Set up socket event listeners
      const socket = socketRef.current;

      const handleConnect = () => {
        setSocketError(false);
        // Join user's personal room
        socket.emit('join_user_room', currentUserId);
      };

      const handleConnectError = (err) => {
        console.error('Socket connection error:', err);
        setSocketError(true);
        setError('Connection error. Reconnecting...');
      };

      const handleDisconnect = (reason) => {
        if (reason === 'io server disconnect') {
          // Reconnect if server disconnects
          socket.connect();
        }
      };

      const handleNewMessage = (msg) => {
        // Skip if message is missing required fields
        if (!msg || (!msg._id && !msg.localId)) {
          return;
        }
        
        // Don't process our own messages from other tabs/devices
        if (String(msg.sender?._id || msg.sender) === String(currentUserId)) {
          return;
        }
        
        // Normalize message format
        const normalizedMsg = {
          ...msg,
          _id: msg._id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          sender: msg.sender?._id || msg.sender || null,
          recipient: msg.recipient?._id || msg.recipient || null,
          createdAt: msg.createdAt || new Date().toISOString(),
          localId: `server-${msg._id || msg.localId || Date.now()}`,
          status: 'received',
          isOptimistic: false
        };
        
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          const isDuplicate = prev.some(m => {
            // Match by server ID if available
            if (m._id && normalizedMsg._id && m._id === normalizedMsg._id) return true;
            
            // Match by local ID if available
            if (m.localId && normalizedMsg.localId && m.localId === normalizedMsg.localId) return true;
            
            // Match by content and timestamp if IDs don't match
            if (m.content === normalizedMsg.content && 
                m.sender === normalizedMsg.sender &&
                m.recipient === normalizedMsg.recipient &&
                Math.abs(new Date(m.createdAt) - new Date(normalizedMsg.createdAt)) < 5000) {
              return true;
            }
            
            return false;
          });
          
          if (isDuplicate) {
            return prev;
          }
          
          // Add new message and sort by timestamp
          return [...prev, normalizedMsg]
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        });
        
        // Mark as read if it's a new message from the current conversation
        if (selectedFriend?._id && 
            String(normalizedMsg.sender) === String(selectedFriend._id) &&
            !normalizedMsg.readAt) {
          chatService.markAsRead([normalizedMsg._id]).catch(console.error);
        }
      };

      const handleTypingStatus = (data) => {
        if (data.from === selectedFriend?._id) {
          setIsTyping(true);
          // Clear any existing timeout
          if (typingTimeout) clearTimeout(typingTimeout);
          // Set timeout to hide typing indicator after 3 seconds
          const timeout = setTimeout(() => setIsTyping(false), 3000);
          setTypingTimeout(timeout);
        }
      };

      // Set up event listeners
      socket.on('connect', handleConnect);
      socket.on('connect_error', handleConnectError);
      socket.on('disconnect', handleDisconnect);
      socket.on('new_message', handleNewMessage);
      socket.on('typing', handleTypingStatus);
      socket.on('stop_typing', () => setIsTyping(false));
      
      // Log all socket events for debugging in development
      if (process.env.NODE_ENV === 'development') {
        const originalEmit = socket.emit;
        socket.emit = function() {
          return originalEmit.apply(socket, arguments);
        };
      }
    }

    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect');
        socketRef.current.off('connect_error');
        socketRef.current.off('disconnect');
        socketRef.current.off('new_message');
        socketRef.current.off('typing');
        socketRef.current.off('stop_typing');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [currentUserId, selectedFriend?._id, typingTimeout]);

  // Load messages when selected friend changes
  const loadMessages = useCallback(async () => {
    if (!selectedFriend?._id || !currentUserId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const messages = await chatService.getConversation(
        currentUserId,
        selectedFriend._id
      );
      
      const processedMessages = messages.map(msg => ({
        ...msg,
        sender: msg.sender?._id || msg.sender || null,
        recipient: msg.recipient?._id || msg.recipient || null,
        createdAt: msg.createdAt || new Date().toISOString(),
        // Add a local ID for optimistic updates
        localId: msg._id ? `server-${msg._id}` : `local-${Date.now()}`
      }));
      
      // Sort by creation time
      processedMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      setMessages(processedMessages);
      
      // Mark messages as read
      const unreadMessages = processedMessages
        .filter(msg => 
          !msg.read && 
          String(msg.sender) === String(selectedFriend._id)
        );
        
      if (unreadMessages.length > 0) {
        await chatService.markAsRead(
          unreadMessages.map(msg => msg._id).filter(Boolean)
        );
      }
      
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError('Failed to load messages. Please try again.');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [selectedFriend?._id, currentUserId]);
  
  // Initial load of messages
  useEffect(() => {
    loadMessages();
    
    // Set up socket room for this conversation
    if (socketRef.current?.connected && selectedFriend?._id) {
      socketRef.current.emit('join_conversation', {
        userId: currentUserId,
        friendId: selectedFriend._id
      });
    }
    
    // Clean up on unmount or when friend changes
    return () => {
      if (socketRef.current?.connected && selectedFriend?._id) {
        socketRef.current.emit('leave_conversation', {
          userId: currentUserId,
          friendId: selectedFriend._id
        });
      }
    };
  }, [loadMessages, selectedFriend?._id, currentUserId]);

  useEffect(() => {
    if (!selectedFriend || !selectedFriend._id || !currentUserId) return;
    setLoading(true);
    api.get(`/messages/conversation?user1=${currentUserId}&user2=${selectedFriend._id}`)
      .then(res => {
        const sorted = (res.data || []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        setMessages(sorted);
        setLoading(false);
      })
      .catch(() => {
        api.get(`/messages/${selectedFriend._id}`)
          .then(res2 => {
            const sorted2 = (res2.data || []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            setMessages(sorted2);
            setLoading(false);
          })
          .catch(() => {
            setMessages([]);
            setLoading(false);
          });
      });
    return () => setMessages([]);
  }, [selectedFriend, currentUserId]);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);
  
  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!selectedFriend?._id || !currentUserId) return;
    
    // Clear any existing timeout
    if (typingTimeout) clearTimeout(typingTimeout);
    
    // Notify typing if we haven't already
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing', {
        to: selectedFriend._id,
        from: currentUserId
      });
    }
    
    // Set a timeout to stop typing indicator
    const timeout = setTimeout(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('stop_typing', {
          to: selectedFriend._id,
          from: currentUserId
        });
      }
      setIsTyping(false);
    }, 2000); // 2 seconds of inactivity
    
    setTypingTimeout(timeout);
  }, [selectedFriend?._id, currentUserId, typingTimeout]);
  
  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [typingTimeout]);
  
  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || !selectedFriend?._id || !currentUserId || sending) return;
    
    setSending(true);
    setError(null);
    
    // Create optimistic message with a unique ID
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const optimisticMessage = {
      _id: tempId,
      localId: tempId,
      sender: currentUserId,
      recipient: selectedFriend._id,
      content: trimmedMessage,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
      status: 'sending'
    };
    
    // Add to messages immediately for instant feedback
    setMessages(prev => [...prev, optimisticMessage]);
    setMessage('');
    
    try {
      // Send message to server
      const sentMessage = await chatService.sendMessage(
        selectedFriend._id,
        trimmedMessage
      );
      
      // Remove the optimistic message and add the server response
      setMessages(prev => [
        ...prev.filter(msg => msg.localId !== tempId),
        {
          ...sentMessage,
          localId: `server-${sentMessage._id}`,
          status: 'sent',
          isOptimistic: false
        }
      ]);
      
      // Notify recipient via socket
      if (socketRef.current?.connected) {
        socketRef.current.emit('send_message', {
          ...sentMessage,
          recipient: selectedFriend._id
        });
      }
      
      // Auto-scroll to show the new message
      scrollToBottom();
      
    } catch (err) {
      console.error('Send message error:', err);
      // Update message status to failed
      setMessages(prev => 
        prev.map(msg => 
          msg.localId === tempId 
            ? { 
                ...msg, 
                status: 'failed',
                error: err.message || 'Failed to send message'
              } 
            : msg
        )
      );
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setMessage(newValue);
    
    // Only show typing indicator if there's text and we have a recipient
    if (newValue.trim() && selectedFriend?._id) {
      handleTyping();
    }
  };
  
  const handleRetrySend = async (localId) => {
    if (!localId) return;
    
    // Find the failed message
    const failedMsg = messages.find(msg => msg.localId === localId);
    if (!failedMsg) return;
    
    // Remove the failed message
    setMessages(prev => prev.filter(msg => msg.localId !== localId));
    
    // Set the message content and send it again
    setMessage(failedMsg.content);
    
    // Small delay to ensure state updates
    setTimeout(() => {
      sendMessage();
    }, 100);
  };


  return (
    <div className="fixed inset-0 w-full h-screen bg-blueGradient overflow-hidden">
      <BackgroundBubbles />
      {selectedFriend ? (
        <div className="w-full h-full flex flex-col">
          {/* Header */}
          <div className="h-16 bg-blueHorizontalGradient border-b border-blue-400/30 flex items-center px-4 shadow-sm text-white">
            <button 
              onClick={() => setSelectedFriend(null)} 
              className="p-2 rounded-full hover:bg-white/20 mr-3 transition-colors"
              aria-label="Back to conversations"
            >
              <FiArrowLeft size={20} className="text-white" />
            </button>
            <div className="flex items-center">
              <div className="relative">
                <img
                  src={
                    selectedFriend.profilePicture ||
                    selectedFriend.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedFriend.name || selectedFriend.username || 'U')}&background=ffffff&color=3b82f6`
                  }
                  alt={selectedFriend.name || selectedFriend.username || 'User'}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white/80 shadow"
                />
                {selectedFriend.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></span>
                )}
              </div>
              <div className="ml-3">
                <h3 className="font-semibold text-white">{selectedFriend.name || selectedFriend.username || 'User'}</h3>
                <p className="text-xs text-blue-100">
                  {selectedFriend.online !== undefined ? (selectedFriend.online ? 'Online' : 'Last seen recently') : 'Online'}
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-blueGradient"
            style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
          >
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white mb-1">No messages yet</h3>
                <p className="text-dullBlue text-sm max-w-md">Start the conversation by sending your first message to {selectedFriend.name || selectedFriend.username || 'your friend'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => {
                  const senderId = msg.sender?._id || msg.sender || '';
                  const isSent = String(senderId) === String(currentUserId);
                  const isOptimistic = msg.isOptimistic || msg.status === 'sending';
                  const isFailed = msg.status === 'failed';
                  
                  // Format timestamp
                  let formattedTime = 'Sending...';
                  try {
                    if (msg.createdAt) {
                      formattedTime = new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                    }
                  } catch (e) {
                    console.error('Error formatting time:', e);
                  }
                  
                  // Generate a unique key for each message
                  const messageKey = msg.localId || `msg-${msg._id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`}`;
                  
                  return (
                    <div 
                      key={messageKey}
                      className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`relative max-w-[85%] lg:max-w-[65%] xl:max-w-[50%] px-4 py-2.5 rounded-2xl ${
                        isSent 
                          ? 'bg-blue-500 text-white rounded-br-sm' 
                          : 'bg-dullBlue text-gray-900 rounded-bl-sm shadow-sm'
                      } ${isOptimistic ? 'opacity-80' : ''} ${isFailed ? 'ring-1 ring-red-300' : ''}`}>
                        <div className="text-sm leading-relaxed break-words">
                          {msg.content || '[No content]'}
                        </div>
                        <div className="flex justify-between items-center mt-1.5 space-x-2">
                          {isFailed ? (
                            <button
                              onClick={() => handleRetrySend(msg.localId)}
                              className="text-xs text-red-400 hover:text-red-500 flex items-center"
                              title="Retry sending"
                            >
                              <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                              </svg>
                              Retry
                            </button>
                          ) : (
                            <div className="w-4"></div> // Spacer for alignment
                          )}
                          <span className={`text-xs ${isSent ? 'text-indigo-100' : 'text-gray-800'}`}>
                            {formattedTime}
                            {isOptimistic && !isFailed && (
                              <span className="inline-flex ml-1.5">
                                <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce ml-1" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce ml-1" style={{ animationDelay: '300ms' }}></span>
                              </span>
                            )}
                            {isFailed && (
                              <span className="ml-1.5 text-red-400">
                                <svg className="w-3.5 h-3.5 inline -mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}
                          </span>
                        </div>
                        
                        {/* Message status indicator */}
                        {isSent && !isOptimistic && !isFailed && (
                          <div className="absolute -right-2 -bottom-2 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow">
                            <svg className="w-3 h-3 text-indigo-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 bg-blueHorizontalGradient border-t border-blue-400/30">
            <div className="relative flex items-center bg-gray-50 rounded-full px-4 py-2 shadow-inner">
              {/* <button 
                className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                aria-label="Add attachment"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                </svg>
              </button> */}
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 bg-transparent border-0 focus:ring-0 text-gray-800 placeholder-gray-400 px-3 py-2 focus:outline-none"
                disabled={sending}
                aria-label="Type your message"
              />
              <button
                onClick={sendMessage}
                disabled={!message.trim() || sending}
                className={`p-2 rounded-full transition-all duration-200 ${
                  message.trim() && !sending
                    ? 'bg-indigo-500 text-white hover:bg-indigo-600 transform hover:scale-105'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
                aria-label="Send message"
              >
                {sending ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <FiSend size={20} />
                )}
              </button>
            </div>
            
            {isTyping && (
              <div className="absolute bottom-20 left-6 bg-white text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full shadow-md flex items-center">
                <span className="flex space-x-1 mr-2">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
                {selectedFriend?.name || 'User'} is typing...
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-blue-50 to-indigo-50 p-6 text-center">
          <div className="max-w-md">
            <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No conversation selected</h2>
            <p className="text-gray-500 mb-6">Select a conversation from the list or start a new chat</p>
            <button 
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-6 rounded-full shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={() => {/* Add new chat handler */}}
            >
              New Message
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatScreen;
