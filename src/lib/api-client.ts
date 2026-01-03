import { APIResponse, LoginResponse, User, Trainer, Project, Batch } from '@/types/api';
import { toast } from '@/hooks/use-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://neo-eus1-dev-alb-386172655.us-east-1.elb.amazonaws.com:8080/v1';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

class ApiClient {
  private getAuthToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, retries = 0): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getAuthToken();

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401 && retries === 0) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          return this.request<T>(endpoint, options, retries + 1);
        }
        throw new Error('Session expired. Please login again.');
      }
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || error.detail || 'Request failed');
      }
      
      const result = await response.json();
      
      // Handle both wrapped {success, data} and direct responses
      if (result.success === false) {
        throw new Error(result.message || 'Request failed');
      }
      
      if (result.data !== undefined) {
        return result.data as T;
      }
      
      return result as T;
    } catch (error: any) {
      if (retries < MAX_RETRIES && !error.message.includes('Session expired')) {
        await this.sleep(RETRY_DELAY * (retries + 1));
        return this.request<T>(endpoint, options, retries + 1);
      }
      
      toast({
        title: 'Error',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
      throw error;
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) return false;

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'X-Refresh-Token': refreshToken,
        },
      });

      if (!response.ok) return false;

      const result: APIResponse<{ access_token: string }> = await response.json();
      if (result.data?.access_token) {
        localStorage.setItem('access_token', result.data.access_token);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const url = `${API_BASE_URL}/auth/login`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.message || error.detail || 'Login failed');
    }
    
    const result: APIResponse<LoginResponse> = await response.json();
    return result.data as LoginResponse;
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async getCurrentUser(): Promise<User> {
    const url = `${API_BASE_URL}/users/me`;
    const token = this.getAuthToken();
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to get current user');
    }
    
    const result = await response.json();
    console.log('getCurrentUser raw response:', result);
    
    // Handle both wrapped and unwrapped responses
    if (result.data) {
      return result.data;
    }
    return result;
  }

  async getUsers(params?: { skip?: number; limit?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<User[]>(`/users/${query ? `?${query}` : ''}`);
  }

  async deleteUser(userId: string) {
    return this.request(`/users/${userId}`, { method: 'DELETE' });
  }

  async getTrainers(params?: { skip?: number; limit?: number; status?: string; expertise?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<Trainer[]>(`/trainers/${query ? `?${query}` : ''}`);
  }

  async getTrainer(trainerId: string) {
    return this.request<Trainer>(`/trainers/${trainerId}`);
  }

  async getTrainerAllocations(trainerId: string) {
    return this.request<any[]>(`/trainers/${trainerId}/allocations`);
  }

  async createTrainer(trainerData: any) {
    return this.request<Trainer>('/trainers/', {
      method: 'POST',
      body: JSON.stringify(trainerData),
    });
  }

  async createTrainersBulk(trainersData: any[]) {
    return this.request<Trainer[]>('/trainers/bulk', {
      method: 'POST',
      body: JSON.stringify(trainersData),
    });
  }

  async updateTrainer(trainerId: string, trainerData: any) {
    return this.request<Trainer>(`/trainers/${trainerId}`, {
      method: 'PUT',
      body: JSON.stringify(trainerData),
    });
  }

  async deleteTrainer(trainerId: string) {
    return this.request(`/trainers/${trainerId}`, { method: 'DELETE' });
  }

  async getAvailableTrainers(domain: string, startDate: string, endDate: string) {
    const params = new URLSearchParams({ domain, start_date: startDate, end_date: endDate });
    return this.request<Trainer[]>(`/trainers/available?${params}`);
  }

  async getProjects(params?: { skip?: number; limit?: number; status?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<Project[]>(`/projects/${query ? `?${query}` : ''}`);
  }

  async createProject(projectData: any) {
    return this.request<Project>('/projects/', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async getProject(projectId: string) {
    return this.request<Project>(`/projects/${projectId}`);
  }

  async updateProject(projectId: string, projectData: any) {
    return this.request<Project>(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  }

  async deleteProject(projectId: string) {
    return this.request(`/projects/${projectId}`, { method: 'DELETE' });
  }

  async createEngagement(projectId: string, engagementData: any) {
    return this.request<any>(`/projects/${projectId}/engagements`, {
      method: 'POST',
      body: JSON.stringify(engagementData),
    });
  }

  async deleteEngagement(engagementId: string) {
    return this.request(`/projects/engagements/${engagementId}`, { method: 'DELETE' });
  }

  async allocateTrainer(batchId: string, trainerId: string, supportStaff: string[] = []) {
    return this.request<Batch>(`/batches/${batchId}/allocate`, {
      method: 'PUT',
      body: JSON.stringify({ trainer_id: trainerId, support_staff: supportStaff }),
    });
  }

  async confirmAllocation(batchId: string) {
    return this.request<Batch>(`/batches/${batchId}/confirm`, { method: 'POST' });
  }

  async getHRRequests(params?: { skip?: number; limit?: number; status?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any[]>(`/hr-requests/${query ? `?${query}` : ''}`);
  }

  async createHRRequest(hrRequestData: any) {
    return this.request<any>('/hr-requests/', {
      method: 'POST',
      body: JSON.stringify(hrRequestData),
    });
  }

  async updateHRRequest(requestId: string, hrRequestData: any) {
    return this.request<any>(`/hr-requests/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify(hrRequestData),
    });
  }

  async getAttendance(params?: { skip?: number; limit?: number; trainer_id?: string; date_from?: string; date_to?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any[]>(`/attendance/${query ? `?${query}` : ''}`);
  }

  async createAttendance(attendanceData: any) {
    return this.request<any>('/attendance/', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
  }

  async updateAttendance(attendanceId: string, attendanceData: any) {
    return this.request<any>(`/attendance/${attendanceId}`, {
      method: 'PUT',
      body: JSON.stringify(attendanceData),
    });
  }

  async punchOut(attendanceId: string, completionNotes?: string) {
    return this.request<any>('/attendance/punch-out', {
      method: 'POST',
      body: JSON.stringify({ attendance_id: attendanceId, completion_notes: completionNotes }),
    });
  }

  async addProjectManager(projectId: string, pmId: string) {
    return this.request<Project>(`/projects/${projectId}/project-managers/${pmId}`, {
      method: 'POST',
    });
  }

  async removeProjectManager(projectId: string, pmId: string) {
    return this.request<Project>(`/projects/${projectId}/project-managers/${pmId}`, {
      method: 'DELETE',
    });
  }

  async updateUserProfile(profileData: { name?: string; avatar_url?: string }) {
    return this.request<User>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async getMyTrainerProfile() {
    return this.request<Trainer>('/trainers/me/profile');
  }

  async getMyAssignments() {
    return this.request<any[]>('/trainers/me/assignments');
  }

  async updateMyExpertise(expertise: string[]) {
    const profile = await this.getMyTrainerProfile();
    return this.request<Trainer>(`/trainers/${profile.id}`, {
      method: 'PUT',
      body: JSON.stringify({ expertise }),
    });
  }
}

export const apiClient = new ApiClient();