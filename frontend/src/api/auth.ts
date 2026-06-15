import request from './request';

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  name: string;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export const authApi = {
  login(data: LoginParams) {
    return request.post<any, { code: number; message: string; data: { token: string } }>(
      '/auth/login',
      data
    );
  },

  register(data: RegisterParams) {
    return request.post<any, { code: number; message: string; data: { token: string } }>(
      '/auth/register',
      data
    );
  },

  getMe() {
    return request.get<any, { code: number; message: string; data: UserInfo }>('/auth/me');
  },
};
