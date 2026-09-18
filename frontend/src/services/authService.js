import api from './api';

const getPayload = (responseData) => {
  // Supports both:
  // { success, data: { token, user } }
  // and
  // { success, token, user }
  return responseData?.data ?? responseData;
};

const authService = {
  // ==========================================
  // NURSE LOGIN
  // ==========================================

  async nurseLogin(email, password) {
    // Keep legacy backend URL for compatibility.
    const response = await api.post('/auth/admin-login', {
      email,
      password,
    });

    const body = response.data;
    const payload = getPayload(body);

    if (body.success && payload?.token) {
      localStorage.setItem('token', payload.token);

      if (payload.user) {
        localStorage.setItem(
          'user',
          JSON.stringify(payload.user)
        );
      }
    }

    return body;
  },

  // ==========================================
  // STUDENT LOGIN
  // ==========================================

  async login(student_id, password, birthday) {
    const response = await api.post('/auth/login', {
      student_id,
      password,
      birthday,
    });

    const body = response.data;
    const payload = getPayload(body);

    if (body.success && payload?.token) {
      localStorage.setItem('token', payload.token);

      if (payload.user) {
        localStorage.setItem(
          'user',
          JSON.stringify(payload.user)
        );
      }
    }

    return body;
  },

  // ==========================================
  // REGISTRATION
  // ==========================================

  async register(data) {
    const response = await api.post(
      '/auth/register',
      data
    );

    return response.data;
  },

  async verifyRegistration(email, otp) {
    const response = await api.post(
      '/auth/register/verify',
      {
        email,
        otp,
      }
    );

    return response.data;
  },

  async resendRegistrationOtp(email) {
    const response = await api.post(
      '/auth/register/resend-otp',
      {
        email,
      }
    );

    return response.data;
  },

  // ==========================================
  // PASSWORD RECOVERY
  // ==========================================

  async forgotPassword(email) {
    const response = await api.post(
      '/auth/forgot-password',
      {
        email,
      }
    );

    return response.data;
  },

  // Reuses forgot-password endpoint.
  // Backend invalidates the old OTP and creates a new one.
  async resendPasswordResetOtp(email) {
    const response = await api.post(
      '/auth/forgot-password',
      {
        email,
      }
    );

    return response.data;
  },

  async resetPassword(
    email,
    otp,
    password,
    password_confirmation
  ) {
    const response = await api.post(
      '/auth/reset-password',
      {
        email,
        otp,
        password,
        password_confirmation,
      }
    );

    return response.data;
  },

  // ==========================================
  // LOGOUT
  // ==========================================

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Clear local session even if token is already invalid.
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    Object.keys(localStorage)
      .filter((key) =>
        key.startsWith('carelink.student.')
      )
      .forEach((key) =>
        localStorage.removeItem(key)
      );
  },

  // ==========================================
  // LOCAL AUTH HELPERS
  // ==========================================

  getCurrentUser() {
    const user = localStorage.getItem('user');

    if (!user) {
      return null;
    }

    try {
      return JSON.parse(user);
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  isNurse() {
    const user = this.getCurrentUser();

    return user?.role === 'nurse';
  },

  isStudent() {
    const user = this.getCurrentUser();

    return user?.role === 'student';
  },

  getToken() {
    return localStorage.getItem('token');
  },

  // ==========================================
  // JWT
  // ==========================================

  async refreshToken() {
    const response = await api.post(
      '/auth/refresh'
    );

    const body = response.data;
    const payload = getPayload(body);

    if (body.success && payload?.token) {
      localStorage.setItem(
        'token',
        payload.token
      );
    }

    return body;
  },

  async getMe() {
    const response = await api.get('/auth/me');

    return response.data;
  },
};

export default authService;