/**
 * API Client for Roommate KZ Backend
 * Handles all HTTP requests to FastAPI backend
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken() {
    return this.token || localStorage.getItem('auth_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token && !options.skipAuth) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // ========== AUTHENTICATION ==========

  async register(userData) {
    const response = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      skipAuth: true,
    });
    
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    
    return response;
  }

  async login(email, password) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });
    
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    
    return response;
  }

  async logout() {
    await this.request('/api/auth/logout', {
      method: 'POST',
    });
    this.setToken(null);
  }

  // ========== USER PROFILE ==========

  async getCurrentUser() {
    return await this.request('/api/users/me');
  }

  async updateProfile(updates) {
    return await this.request('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // ========== DISCOVERY & MATCHING ==========

  async getProfiles(filters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params.append(key, value);
      }
    });

    const queryString = params.toString();
    const endpoint = queryString ? `/api/profiles?${queryString}` : '/api/profiles';
    
    return await this.request(endpoint);
  }

  async likeProfile(userId) {
    return await this.request('/api/likes', {
      method: 'POST',
      body: JSON.stringify({ liked_user_id: userId }),
    });
  }

  async passProfile(userId) {
    return await this.request('/api/passes', {
      method: 'POST',
      body: JSON.stringify({ liked_user_id: userId }),
    });
  }

  // ========== MESSAGING ==========

  async getMatches() {
    return await this.request('/api/matches');
  }

  async getMessages(matchId) {
    return await this.request(`/api/messages/${matchId}`);
  }

  async sendMessage(receiverId, content) {
    return await this.request('/api/messages', {
      method: 'POST',
      body: JSON.stringify({
        receiver_id: receiverId,
        content: content,
      }),
    });
  }

  // ========== HEALTH CHECK ==========

  async healthCheck() {
    return await this.request('/health', { skipAuth: true });
  }
}

// Create singleton instance
const api = new ApiClient();

export default ApiClient;