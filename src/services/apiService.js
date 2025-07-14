import axios from 'axios';

// API Configuration
const api = axios.create({
  baseURL: 'https://api.fulboost.fun/api/v1', // 🚀 updated to include /api/v1
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
  transformRequest: [(data) => (data ? JSON.stringify(data) : data)],
  transformResponse: [(data) => {
    try {
      return JSON.parse(data);
    } catch (e) {
      return data;
    }
  }],
  validateStatus: (status) => status >= 200 && status < 500
});

// Request & Response Logging
api.interceptors.request.use(
  config => {
    console.log('Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  error => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => {
    console.log('Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  error => {
    console.error('Response Error:', error);
    return Promise.reject(error);
  }
);

// Auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth Service
const authService = {
  login: async (userData) => {
    try {
      const loginData = {
        phoneNumber: userData.phoneNumber,
        password: userData.password
      };
      const response = await api.post('/users/login', loginData);
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        return { success: true, user: response.data.user, token: response.data.token };
      }
      throw new Error(response.data?.message || 'Login failed');
    } catch (error) {
      console.error('Login error:', error);
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/users/register', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Registration failed');
    }
  },

  logout: async () => {
    try {
      await api.post('/users/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }
  },

  getCurrentUserProfile: async () => {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  updateUserProfile: async (userId, userData, isFormData = false) => {
    try {
      const config = {};
      if (isFormData && config.headers) {
        delete config.headers['Content-Type'];
        delete config.headers.common?.['Content-Type'];
      }
      const response = await api.put(`/users/profile/${userId}`, userData, config);
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
};

// Post Service
const postService = {
  createPost: async (postData) => {
    try {
      let response;
      if (postData.image || postData.media) {
        const formData = new FormData();
        if (postData.content) formData.append('content', postData.content);
        if (postData.image) formData.append('image', postData.image);
        if (postData.media) formData.append('image', postData.media);
        response = await api.post('/posts/create', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await api.post('/posts/create', postData);
      }
      return response.data;
    } catch (error) {
      console.error('Create post error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to create post');
    }
  },

  getPosts: async (params = {}) => {
    try {
      const response = await api.get('/posts', {
        params: {
          ...params,
          sort: params.sort || '-createdAt',
          limit: params.limit || 20,
          populate: 'user,author,createdBy'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Get posts error:', error);
      throw error;
    }
  }
};

// Game Service
const gameService = {
  getGame: async (gameId) => {
    try {
      const response = await api.get(`/games/${gameId}`);
      return response.data;
    } catch (error) {
      console.error('Get game error:', error);
      throw error;
    }
  },

  getGames: async (params = {}) => {
    try {
      const response = await api.get('/games', { params });
      return response.data;
    } catch (error) {
      console.error('Get games error:', error);
      throw error;
    }
  },

  submitScore: async (gameId, scoreData) => {
    try {
      const response = await api.post(`/games/${gameId}/scores`, scoreData);
      return response.data;
    } catch (error) {
      console.error('Submit score error:', error);
      throw error;
    }
  }
};

// Challenge Service
const challengeService = {
  // Create a new challenge
  createChallenge: async (challengeData) => {
    try {
      const response = await api.post('/challenges', challengeData);
      return response.data;
    } catch (error) {
      console.error('Create challenge error:', error);
      throw error;
    }
  },

  // Get user challenges
  getUserChallenges: async (params = {}) => {
    try {
      const response = await api.get('/challenges', { params });
      return response.data;
    } catch (error) {
      console.error('Get user challenges error:', error);
      throw error;
    }
  },

  // Accept a challenge
  acceptChallenge: async (challengeId) => {
    try {
      const response = await api.put(`/challenges/${challengeId}/accept`);
      return response.data;
    } catch (error) {
      console.error('Accept challenge error:', error);
      throw error;
    }
  },

  // Reject a challenge
  rejectChallenge: async (challengeId) => {
    try {
      const response = await api.put(`/challenges/${challengeId}/reject`);
      return response.data;
    } catch (error) {
      console.error('Reject challenge error:', error);
      throw error;
    }
  },

  // Cancel a challenge
  cancelChallenge: async (challengeId) => {
    try {
      const response = await api.put(`/challenges/${challengeId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Cancel challenge error:', error);
      throw error;
    }
  },

  // Get users for challenge
  getUsersForChallenge: async (search = '') => {
    try {
      const response = await api.get('/challenges/users', { 
        params: { search } 
      });
      return response.data;
    } catch (error) {
      console.error('Get users for challenge error:', error);
      throw error;
    }
  },

  // Get games for challenge
  getGamesForChallenge: async (search = '') => {
    try {
      const response = await api.get('/challenges/games', { 
        params: { search } 
      });
      return response.data;
    } catch (error) {
      console.error('Get games for challenge error:', error);
      throw error;
    }
  }
};

export { authService, postService, gameService, challengeService };
