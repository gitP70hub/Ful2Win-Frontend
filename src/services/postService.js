import api from './api';

const postService = {
  /**
   * Create a new post
   * @param {Object} postData - Post data containing content and optional tags
   * @param {File} [file=null] - Optional file to upload with the post
   * @returns {Promise<Object>} Created post data
   */
  
  async createPost(postData = {}, file = null) {
    const requestId = `req_${Date.now()}`;
    
    try {
      // Input validation
      if (!postData && !file) {
        throw new Error('Either post content or a file is required');
      }

      const formData = new FormData();
      
      // Add content with validation
      if (postData?.content) {
        const content = String(postData.content).trim();
        if (content) {
          formData.append('content', content);
        } else {
          formData.append('content', '');
        }
      } else {
        formData.append('content', '');
      }
      
      // Handle tags with validation
      try {
        const tags = postData?.tags || [];
        const tagsArray = Array.isArray(tags) ? tags : [tags].filter(Boolean);
        const validTags = tagsArray.filter(tag => tag && typeof tag === 'string');
        
        formData.append('tags', JSON.stringify(validTags));
      } catch (tagError) {
        formData.append('tags', JSON.stringify([]));
      }
      
      // Handle file upload if present
      if (file) {
        try {
          let fileToUpload = file;
          
          // Ensure we have a proper File object
          if (!(fileToUpload instanceof File)) {
            const fileExtension = fileToUpload.name?.split('.').pop() || 'jpg';
            fileToUpload = new File(
              [fileToUpload], 
              `upload-${Date.now()}.${fileExtension}`.toLowerCase(),
              { type: fileToUpload.type || 'application/octet-stream' }
            );
          }
          
          // Basic file validation
          const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
          if (fileToUpload.size > MAX_FILE_SIZE) {
            throw new Error(`File too large (${(fileToUpload.size / (1024 * 1024)).toFixed(2)}MB > 10MB)`);
          }
          
          const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
          if (!allowedTypes.includes(fileToUpload.type.toLowerCase())) {
            throw new Error(`Unsupported file type: ${fileToUpload.type}`);
          }
          
          formData.append('image', fileToUpload);
          
        } catch (fileError) {
          console.error(`[PostService][${requestId}] ❌ File processing failed:`, {
            error: fileError.message,
            fileType: file?.type,
            fileName: file?.name,
            fileSize: file?.size
          });
          throw new Error(`File upload failed: ${fileError.message}`);
        }
      }

      // Configure request
      const config = {
        timeout: 120000, // 2 minutes
        withCredentials: true,
        maxContentLength: 100 * 1024 * 1024, // 100MB
        maxBodyLength: 100 * 1024 * 1024, // 100MB
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Request-ID': requestId
        },
        // Let the browser set Content-Type with boundary
        transformRequest: (data, headers) => {
          delete headers['Content-Type'];
          if (headers.common) delete headers.common['Content-Type'];
          if (headers.post) delete headers.post['Content-Type'];
          return data;
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.lengthComputable) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            
          }
        }
      };

      
      const startTime = Date.now();
      
      try {
        
        const response = await api.post('/post/create', formData, config);
        const duration = Date.now() - startTime;
        
        
        return response.data;
      } catch (error) {
        console.error(`[PostService][${requestId}] ❌ Request failed:`, {
          error: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers
          }
        });
        throw error;
      }
    } catch (error) {
      console.error('[PostService] Error in createPost:', {
        error: error.message,
        errorType: error.constructor.name,
        stack: error.stack,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        } : null,
        request: error.request ? {
          method: error.config?.method,
          url: error.config?.url,
          headers: error.config?.headers,
          data: error.config?.data
        } : null
      });
      throw error;
    }
  },

  /**
   * Get all posts with optional filters
   * @param {Object} filters - Filter parameters
   * @param {string} [filters.sort=-createdAt] - Sort order
   * @param {number} [filters.limit=20] - Number of posts to return
   * @param {string} [filters.userId] - Filter by user ID
   * @param {string} [filters.tournamentId] - Filter by tournament ID
   * @returns {Promise<Array>} List of posts
   */
  async getPosts(filters = {}) {
    try {
      const response = await api.get('/posts', {
        params: {
          ...filters,
          sort: filters.sort || '-createdAt',
          limit: filters.limit || 20,
          populate: 'user,author,createdBy'
        }
      });
      
      // Process the response to ensure consistent post structure
      const responseData = response.data;
      const posts = Array.isArray(responseData) ? responseData : [];
      
      return posts.map(post => ({
        ...post,
        user: post.user || post.author || post.createdBy || {
          _id: 'unknown',
          username: 'Unknown User',
          profilePicture: ''
        },
        createdAt: post.createdAt || new Date().toISOString(),
        content: post.content || '',
        media: Array.isArray(post.media) ? post.media : []
      }));
    } catch (error) {
      console.error('[PostService] Error fetching posts:', {
        error: error.message,
        errorType: error.constructor.name,
        stack: error.stack,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : null
      });
      throw error;
    }
  },
  /**
   * Update a post
   * @param {string} postId - Post ID
   * @param {Object} postData - Updated post data
   * @returns {Promise<Object>} Updated post data
   */
  async updatePost(postId, postData) {
    try {
      const response = await api.put(`/posts/${postId}`, postData);
      return response.data;
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  },

  /**
   * Delete a post
   * @param {string} postId - Post ID to delete
   * @returns {Promise<Object>} Deletion response
   */
  async deletePost(postId) {
    try {
      const response = await api.delete(`/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  },

  /**
   * Report a post
   * @param {string} postId - Post ID to report
   * @param {Object} reportData - Report data
   * @param {string} reportData.reason - Reason for reporting
   * @param {string} reportData.reportedUserId - ID of the user being reported
   * @returns {Promise<Object>} Report response
   */
  async reportPost(postId, reportData) {
    try {
      const response = await api.post(
        `/posts/${postId}/report`,
        reportData
      );
      return response.data;
    } catch (error) {
      console.error('Error reporting post:', error);
      throw error;
    }
  },

  /**
   * Like or unlike a post
   * @param {string} postId - Post ID to like/unlike
   * @param {boolean} isLiked - Whether the post is already liked
   * @returns {Promise<Object>} Updated post data
   */
  async likePost(postId, isLiked) {
    try {
      const endpoint = isLiked ? `/posts/unlike` : `/posts/like`;

     
      // Prepare request data
      const requestData = { 
        postId
      
      };
      
      const response = await api.post(endpoint, requestData);
      
      return response.data;
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  },

  /**
   * Add a comment to a post
   * @param {string} postId - Post ID to comment on
   * @param {string} content - Comment content
   * @returns {Promise<Object>} Created comment data
   */
  async addComment(postId, content) {

    try {
      const API_BASE_URL = import.meta.env.MODE === 'development' 
        ? 'http://localhost:5000/api' 
        : `${import.meta.env.VITE_API_BACKEND_URL}/api`;
      
      const endpoint = `${API_BASE_URL}/posts/${postId}/comments`;
      const requestData = { content };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData),
        credentials: 'include' // Important for cookies if using them
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || 'Failed to add comment');
        error.response = { data: errorData };
        throw error;
      }
      
      const responseData = await response.json();
      
      return responseData;
    } catch (error) {
      console.error('Error adding comment:', error);
      // Enhance error with more context
      if (!error.response) {
        error.response = { data: { message: 'Network error. Please check your connection.' } };
      }
      throw error;
    }
  },

  /**
   * Get comments for a post
   * @param {string} postId - Post ID to get comments for
   * @returns {Promise<Array>} List of comments
   */
  async getComments(postId) {
    
    try {
      const response = await api.get(`/api/posts/${postId}/comments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }
};

export default postService;
