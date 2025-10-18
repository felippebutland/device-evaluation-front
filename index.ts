export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface Device {
  _id: string;
  id: string;
  name: string;
  brand: string;
  model: string;
  basePrice: number;
  specifications: Record<string, string>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  damageTypes?: DamageType[];
  pricingPolicies?: PricingPolicy[];
  applicableDamageTypes?: Array<{
    id: string; // maps from _id
    damageType: {
      id: string; // maps from damageType._id
      name: string;
    };
    defaultDiscountPercentage: number;
  }>;
}

export interface DamageType {
  id: string;
  deviceId: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  active: boolean;
}

export interface PricingPolicy {
  _id: string;
  name: string;
  saleMode: string;
  paymentTiming: string;
  discountAmount: number;
  isActive: boolean;
  priority: number;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface DeviceSubmission {
  id: string;
  userId?: string;
  deviceId: string;
  device?: Device;
  trackingCode: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  deviceSerialNumber: string;
  reportedCondition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  preferredSaleMode: 'sale' | 'exchange';
  userNotes?: string;
  status: 'pending' | 'under_evaluation' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  evaluation?: Evaluation;
}

export interface Evaluation {
  id: string;
  submissionId: string;
  adminId: string;
  admin?: User;
  actualCondition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  identifiedDamages: string[];
  finalPrice: number;
  adminNotes?: string;
  status: 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
}

export interface AnonymousSubmissionRequest {
  deviceId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  deviceSerialNumber: string;
  reportedCondition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  preferredSaleMode: 'sale' | 'exchange';
  applicableDamageTypes?: string[];
  userNotes?: string;
}

export interface AuthenticatedSubmissionRequest {
  deviceId: string;
  deviceSerialNumber: string;
  reportedCondition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  preferredSaleMode: 'sale' | 'exchange';
  applicableDamageTypes?: string[];
  userNotes?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DeviceFilters {
  name?: string;
  brand?: string;
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface AdminStats {
  totalDevices: number;
  totalSubmissions: number;
  pendingEvaluations: number;
  approvedEvaluations: number;
  rejectedEvaluations: number;
  totalUsers: number;
  monthlySubmissions: Array<{
    month: string;
    count: number;
  }>;
  topDevices: Array<{
    device: Device;
    submissionCount: number;
  }>;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

export type DeviceCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
export type SaleMode = 'sale' | 'exchange';
export type SubmissionStatus = 'pending' | 'under_evaluation' | 'approved' | 'rejected';
export type UserRole = 'user' | 'admin';
