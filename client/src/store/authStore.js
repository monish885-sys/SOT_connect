import { create } from 'zustand';
import { authApi } from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  error: null,

  setUser: (user) => set({ user, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchUser: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await authApi.getMe();
      set({ user: data, loading: false });
      return data;
    } catch {
      set({ user: null, loading: false });
      return null;
    }
  },

  login: async (email, password) => {
    set({ error: null });
    try {
      const { data } = await authApi.login({ email, password });
      set({ user: data.user });
      return { success: true, user: data.user };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      set({ error: message });
      return { success: false, error: message };
    }
  },

  register: async (payload) => {
    set({ error: null });
    try {
      const { data } = await authApi.register(payload);
      set({ user: data.user });
      return { success: true, user: data.user };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      set({ error: message });
      return { success: false, error: message };
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      set({ user: null });
    }
  },

  isAdmin: () => get().user?.role === 'admin',
  isStudent: () => get().user?.role === 'student',
}));
