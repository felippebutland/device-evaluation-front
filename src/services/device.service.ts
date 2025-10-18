import { apiService } from './api';
import type { 
  Device, 
  DeviceFilters, 
  PaginatedResponse,
  DamageType,
  PricingPolicy
} from '@/types';

export class DeviceService {
  // Public methods (no authentication required)
  async getPublicDevices(filters?: DeviceFilters): Promise<PaginatedResponse<Device>> {
    return apiService.get<PaginatedResponse<Device>>('/devices/public', filters);
  }

  async getPublicDeviceById(id: string): Promise<Device> {
    return apiService.get<Device>(`/devices/public/${id}`);
  }

  // Admin methods (authentication required)
  async getAllDevices(filters?: DeviceFilters): Promise<PaginatedResponse<Device>> {
    return apiService.get<PaginatedResponse<Device>>('/devices', filters);
  }

  async getDeviceById(id: string): Promise<Device> {
    return apiService.get<Device>(`/devices/${id}`);
  }

  async createDevice(data: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>): Promise<Device> {
    return apiService.post<Device>('/devices', data);
  }

  async updateDevice(id: string, data: Partial<Device>): Promise<Device> {
    return apiService.patch<Device>(`/devices/${id}`, data);
  }

  async deleteDevice(id: string): Promise<void> {
    return apiService.delete(`/devices/${id}`);
  }

  // Damage Types
  async getDamageTypes(deviceId?: string): Promise<DamageType[]> {
    const params = deviceId ? { deviceId } : undefined;
    return apiService.get<DamageType[]>('/damage-types', params);
  }

  async createDamageType(data: Omit<DamageType, 'id'>): Promise<DamageType> {
    return apiService.post<DamageType>('/damage-types', data);
  }

  async updateDamageType(id: string, data: Partial<DamageType>): Promise<DamageType> {
    return apiService.patch<DamageType>(`/damage-types/${id}`, data);
  }

  async deleteDamageType(id: string): Promise<void> {
    return apiService.delete(`/damage-types/${id}`);
  }

  // Pricing Policies
  async getPricingPolicies(deviceId?: string): Promise<PricingPolicy[]> {
    const params = deviceId ? { deviceId } : undefined;
    console.log('DeviceService.getPricingPolicies chamado com params:', params);
    const result = await apiService.get<PricingPolicy[]>('/pricing-policies', params);
    console.log('DeviceService.getPricingPolicies resultado:', result);
    return result;
  }

  async createPricingPolicy(data: Omit<PricingPolicy, '_id'>): Promise<PricingPolicy> {
    return apiService.post<PricingPolicy>('/pricing-policies', data);
  }

  async updatePricingPolicy(id: string, data: Partial<PricingPolicy>): Promise<PricingPolicy> {
    return apiService.patch<PricingPolicy>(`/pricing-policies/${id}`, data);
  }

  async deletePricingPolicy(id: string): Promise<void> {
    return apiService.delete(`/pricing-policies/${id}`);
  }

  // Search and filtering
  async searchDevices(query: string): Promise<Device[]> {
    return apiService.get<Device[]>('/devices/search', { q: query });
  }

  async getDevicesByBrand(brand: string): Promise<Device[]> {
    return apiService.get<Device[]>('/devices/public', { brand });
  }

  async getPopularDevices(limit = 10): Promise<Device[]> {
    return apiService.get<Device[]>('/devices/popular', { limit });
  }
}

export const deviceService = new DeviceService();
export default deviceService;
