import { create } from 'zustand';
import { authApi, LoginParams, RegisterParams, UserInfo } from '../api/auth';

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  loading: boolean;

  login: (params: LoginParams) => Promise<void>;
  register: (params: RegisterParams) => Promise<void>;
  fetchUser: () => Promise<void>;
  logout: () => void;
  init: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  user: null,
  loading: false,

  init: () => {
    const token = localStorage.getItem('token');
    if (token) {
      set({ token });
      get().fetchUser();
    }
  },

  login: async (params) => {
    set({ loading: true });
    try {
      const res = await authApi.login(params);
      const { token } = res.data;
      localStorage.setItem('token', token);
      set({ token, loading: false });
      await get().fetchUser();
    } catch {
      set({ loading: false });
      throw new Error('登录失败');
    }
  },

  register: async (params) => {
    set({ loading: true });
    try {
      const res = await authApi.register(params);
      const { token } = res.data;
      localStorage.setItem('token', token);
      set({ token, loading: false });
      await get().fetchUser();
    } catch {
      set({ loading: false });
      throw new Error('注册失败');
    }
  },

  fetchUser: async () => {
    try {
      const res = await authApi.getMe();
      set({ user: res.data });
    } catch {
      get().logout();
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null });
    window.location.href = '/login';
  },
}));
