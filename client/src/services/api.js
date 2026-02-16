import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Log 404s in console so you can see which request failed
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 404) {
      console.warn('[API 404]', err.config?.method?.toUpperCase(), err.config?.url, err.response?.data?.message || 'Not Found');
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// Events
export const eventsApi = {
  list: (params) => api.get('/events', { params }),
  getCategories: () => api.get('/events/categories'),
  getById: (id) => api.get(`/events/${id}`),
  getRelated: (id) => api.get(`/events/${id}/related`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  duplicate: (id, data) => api.post(`/events/${id}/duplicate`, data),
  bulk: (action, eventIds) => api.post('/events/bulk', { action, eventIds }),
  register: (id, options) => api.post(`/events/${id}/register`, options || {}),
  unregister: (id) => api.delete(`/events/${id}/register`),
  joinWaitlist: (id) => api.post(`/events/${id}/waitlist`),
  getRegistrations: (id) => api.get(`/events/${id}/registrations`),
  exportRegistrations: (id) => api.get(`/events/${id}/registrations/export`, { responseType: 'blob' }),
  checkIn: (id, body) => api.post(`/events/${id}/check-in`, body),
  getCheckInCode: (id) => api.get(`/events/${id}/check-in-code`),
  getCertificate: (id) => api.get(`/events/${id}/certificate`, { responseType: 'blob' }),
};

// Analytics
export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard'),
  exportReport: (params) => api.get('/analytics/export', { params, responseType: 'blob' }),
};

// Users
export const usersApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getMyRegistrations: () => api.get('/users/registrations'),
};

export default api;
