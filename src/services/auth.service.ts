import { apiService } from './api';
import { STORAGE_KEYS } from '@/utils/constants';
import type {
  User,
  AuthResponse,
  LoginRequest,
  RegisterRequest
} from '@/types';

export class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
      console.log('AuthService.login called with credentials:', credentials);
    const response = await apiService.post<AuthResponse>('/auth/login', credentials);
    console.log('AuthService.login response:', response);
    // Store token and user data
    localStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));

    return response;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/register', userData);

    // Store token and user data
    localStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));

    return response;
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }

  getCurrentUser(): User | null {
    const userData = localStorage.getItem(STORAGE_KEYS.USER);
    return userData ? JSON.parse(userData) : null;
  }

  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  async refreshUser(): Promise<User> {
    const user = await apiService.get<User>('/auth/me');
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return user;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const user = await apiService.patch<User>('/auth/profile', data);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return user;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiService.patch('/auth/change-password', {
      currentPassword,
      newPassword
    });
  }

  async requestPasswordReset(email: string): Promise<void> {
    await apiService.post('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiService.post('/auth/reset-password', { token, newPassword });
  }
}

export const authService = new AuthService();
export default authService;
