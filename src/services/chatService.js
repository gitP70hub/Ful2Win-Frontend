import api from './api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

const baseUrl = import.meta.env.MODE === 'development' ? 'http://localhost:5000' : import.meta.env.VITE_API_BACKEND_URL;

const chatService = {
  /**
   * Get conversation between two users
   * @param {string} currentUserId - Current user's ID
   * @param {string} otherUserId - Other user's ID
   * @returns {Promise<Array>} List of messages
   */
  async getConversation(currentUserId, otherUserId) {
    try {
      const response = await api.get(
        `/messages/conversation?user1=${currentUserId}&user2=${otherUserId}`,
        { 
          headers: {
            ...getAuthHeaders(),
            'Accept': 'application/json'
          }
        }
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching conversation:', error);
      if (error.response?.status === 401) {
        // Handle unauthorized (token expired, etc.)
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      throw error;
    }
  },

  /**
   * Send a message
   * @param {string} recipientId - Recipient's user ID
   * @param {string} content - Message content
   * @returns {Promise<Object>} Sent message data
   */
  async sendMessage(recipientId, content) {
    try {
      const messageData = JSON.stringify({
        recipient: recipientId,
        content: content.trim(),
        timestamp: new Date().toISOString()
      });
      
      const response = await fetch(`${baseUrl}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        },
        body: messageData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to send message');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      if (error.response?.status === 401) {
        // Handle unauthorized (token expired, etc.)
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      throw error;
    }
  },

  /**
   * Mark messages as read
   * @param {string|Array} messageIds - Single message ID or array of message IDs to mark as read
   * @returns {Promise<Object>} Response data
   */
  async markAsRead(messageIds) {
    try {
      // Ensure messageIds is an array
      const ids = Array.isArray(messageIds) ? messageIds : [messageIds];
      
      const response = await fetch(`${baseUrl}/api/messages/read`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ messageIds: ids }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to mark messages as read');
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking messages as read:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      throw error;
    }
  },

  /**
   * Get unread message count
   * @returns {Promise<number>} Count of unread messages
   */
  async getUnreadCount() {
    try {
      const response = await api.get(
        '/messages/unread/count',
        { headers: getAuthHeaders() }
      );
      return response.data.count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return 0; // Return 0 on error to prevent UI issues
    }
  },

  /**
   * Get recent conversations
   * @param {number} limit - Maximum number of conversations to return
   * @returns {Promise<Array>} List of recent conversations
   */
  async getRecentConversations(limit = 10) {
    try {
      const response = await api.get(
        `/messages/conversations?limit=${limit}`,
        { headers: getAuthHeaders() }
      );
      return response.data || [];
    } catch (error) {
      console.error('Error getting recent conversations:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return []; // Return empty array on error to prevent UI issues
    }
  }
};

export default chatService;
