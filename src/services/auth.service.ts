import { apiService } from './api';
import { STORAGE_KEYS, SESSION_DURATION_MS } from '@/utils/constants';
import type {
  User,
  AuthResponse,
  LoginRequest,
  RegisterRequest
} from '@/types';

export class AuthService {
  private persistSession(): void {
    localStorage.setItem(
      STORAGE_KEYS.SESSION_EXPIRY,
      String(Date.now() + SESSION_DURATION_MS)
    );
  }

  isSessionValid(): boolean {
    const expiry = localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRY);
    if (!expiry) return false;
    return Date.now() < Number(expiry);
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/login', credentials);
    localStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
    this.persistSession();
    return response;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/register', userData);
    localStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
    this.persistSession();
    return response;
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRY);
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
