import api from './api';

const authService = {
  // Nurse login (the backend URL is retained for compatibility).
  async nurseLogin(email, password) {
    const response = await api.post('/auth/admin-login', { email, password });
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  // Student Login
  async login(student_id, password, birthday) {
    const response = await api.post('/auth/login', { student_id, password, birthday });
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  // Register
  async register(data) {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async verifyRegistration(email, otp) {
    const response = await api.post('/auth/register/verify', { email, otp });
    return response.data;
  },

  // Logout
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore token invalidation errors
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    Object.keys(localStorage).filter(key => key.startsWith('carelink.student.')).forEach(key => localStorage.removeItem(key));
  },

  // Get current user from localStorage
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  // Check if current user is nurse
  isNurse() {
    const user = this.getCurrentUser();
    return user && user.role === 'nurse';
  },

  // Check if current user is student
  isStudent() {
    const user = this.getCurrentUser();
    return user && user.role === 'student';
  },

  // Get token
  getToken() {
    return localStorage.getItem('token');
  },

  // Forgot password
  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  async resetPassword(email, otp, password, password_confirmation) {
    const response = await api.post('/auth/reset-password', {
      email, otp, password, password_confirmation
    });
    return response.data;
  },

  // Refresh token
  async refreshToken() {
    const response = await api.post('/auth/refresh');
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token);
    }
    return response.data;
  },

  // Get authenticated user from server
  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export default authService;