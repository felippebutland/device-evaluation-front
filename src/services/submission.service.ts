import { apiService } from './api';
import type {
  DeviceSubmission,
  AnonymousSubmissionRequest,
  AuthenticatedSubmissionRequest,
  Evaluation,
  AdminStats,
  PaginatedResponse
} from '@/types';

export class SubmissionService {
  // Public submissions (anonymous)
  async submitAnonymous(data: AnonymousSubmissionRequest): Promise<DeviceSubmission> {
    return apiService.post<DeviceSubmission>('/device-submissions/public', data);
  }

  async trackSubmission(trackingCode: string): Promise<DeviceSubmission> {
    return apiService.get<DeviceSubmission>(`/device-submissions/track/${trackingCode}`);
  }

  // Authenticated user submissions
  async submitAuthenticated(data: AuthenticatedSubmissionRequest): Promise<DeviceSubmission> {
    return apiService.post<DeviceSubmission>('/device-submissions', data);
  }

  async getMySubmissions(page = 1, limit = 10): Promise<PaginatedResponse<DeviceSubmission>> {
    return apiService.get<PaginatedResponse<DeviceSubmission>>('/device-submissions/my', {
      page,
      limit
    });
  }

  async getSubmissionById(id: string): Promise<DeviceSubmission> {
    return apiService.get<DeviceSubmission>(`/device-submissions/${id}`);
  }

  async cancelSubmission(id: string): Promise<void> {
    return apiService.patch(`/device-submissions/${id}/cancel`);
  }

  // Admin methods
  async getAllSubmissions(filters?: {
    status?: string;
    deviceId?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<DeviceSubmission>> {
    return apiService.get<PaginatedResponse<DeviceSubmission>>('/device-submissions', filters);
  }

  async updateSubmissionStatus(
    id: string,
    status: 'pending' | 'under_evaluation' | 'approved' | 'rejected'
  ): Promise<DeviceSubmission> {
    return apiService.patch<DeviceSubmission>(`/device-submissions/${id}/status`, { status });
  }

  // Evaluations
  async createEvaluation(data: Omit<Evaluation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Evaluation> {
    return apiService.post<Evaluation>('/evaluations', data);
  }

  async updateEvaluation(id: string, data: Partial<Evaluation>): Promise<Evaluation> {
    return apiService.patch<Evaluation>(`/evaluations/${id}`, data);
  }

  async approveEvaluation(id: string, finalPrice: number, adminNotes?: string): Promise<Evaluation> {
    return apiService.patch<Evaluation>(`/evaluations/${id}/approve`, {
      finalPrice,
      adminNotes
    });
  }

  async rejectEvaluation(id: string, reason: string): Promise<Evaluation> {
    return apiService.patch<Evaluation>(`/evaluations/${id}/reject`, {
      adminNotes: reason
    });
  }

  async getEvaluationById(id: string): Promise<Evaluation> {
    return apiService.get<Evaluation>(`/evaluations/${id}`);
  }

  async getEvaluations(filters?: {
    status?: string;
    adminId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Evaluation>> {
    return apiService.get<PaginatedResponse<Evaluation>>('/evaluations', filters);
  }

  // Admin statistics
  async getAdminStats(): Promise<AdminStats> {
    return apiService.get<AdminStats>('/evaluations/stats');
  }

  async getSubmissionsByPeriod(startDate: string, endDate: string): Promise<DeviceSubmission[]> {
    return apiService.get<DeviceSubmission[]>('/device-submissions/period', {
      startDate,
      endDate
    });
  }

  async exportSubmissions(format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    return apiService.getBlob('/device-submissions/export', { format });
  }
}

export const submissionService = new SubmissionService();
export default submissionService;
