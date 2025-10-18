import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '@/utils/constants';
import type { ApiResponse } from '@/types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle common errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem(STORAGE_KEYS.TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          window.location.href = '/login';
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): Error {
    if (error.response) {
      // Server responded with error status
      const message = (error.response.data as any)?.message || 'Erro no servidor';
      return new Error(message);
    } else if (error.request) {
      // Network error
      return new Error('Erro de conexão. Verifique sua internet.');
    } else {
      // Other error
      return new Error('Erro inesperado. Tente novamente.');
    }
  }

  async get<T>(endpoint: string, params?: any): Promise<T> {
    const response = await this.client.get<ApiResponse<T> | T>(endpoint, { params });
    console.log('API Response para', endpoint, ':', response.data);

    // Se a resposta tem a estrutura { data: ... }, retorna response.data.data
    // Se a resposta é direta, retorna response.data
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return (response.data as ApiResponse<T>).data;
    }

    return response.data as T;
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(endpoint, data);
    return response.data;
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(endpoint, data);
    return response.data.data;
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.client.patch<ApiResponse<T>>(endpoint, data);
    return response.data.data;
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(endpoint);
    return response.data.data;
  }

  // Upload file method
  async uploadFile<T>(endpoint: string, file: File, additionalData?: any): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    const response = await this.client.post<ApiResponse<T>>(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data.data;
  }

  // Get blob (file download)
  async getBlob(endpoint: string, params?: any): Promise<Blob> {
    const response = await this.client.get(endpoint, { params, responseType: 'blob' });
    return response.data as Blob;
  }
}

export const apiService = new ApiService();
export default apiService;
