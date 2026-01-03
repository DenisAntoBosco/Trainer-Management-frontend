export interface APIResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  metadata?: PaginationMetadata;
  error_id?: string;
  errors?: any[];
}

export interface PaginationMetadata {
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'hr' | 'project_manager' | 'trainer';
  avatar_url?: string;
  created_at: string;
}

export interface Trainer {
  id: string;
  name: string;
  email: string;
  phone: string;
  expertise: string[];
  status: 'available' | 'partially_allocated' | 'fully_allocated' | 'on_leave';
  max_batches: number;
  current_batches: number;
  employment_type: 'full_time' | 'part_time' | 'freelance' | 'intern';
  experience_level: 'junior' | 'mid' | 'senior';
  gender: 'male' | 'female';
  join_date: string;
  avatar?: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  client_name: string;
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone: string;
  project_type: string[];
  start_date: string;
  end_date: string;
  description?: string;
  status: 'active' | 'upcoming' | 'completed';
  created_at: string;
  created_by: string;
  engagements?: Engagement[];
}

export interface Engagement {
  id: string;
  project_id: string;
  name: string;
  domain: string;
  training_type: string;
  total_students: number;
  students_per_batch: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'upcoming' | 'completed';
  created_at: string;
  batches?: Batch[];
}

export interface Batch {
  id: string;
  engagement_id: string;
  batch_number: number;
  students: number;
  start_date: string;
  end_date: string;
  status: 'confirmed' | 'pending' | 'awaiting_confirmation';
  trainer_id?: string;
  confirmed_at?: string;
  confirmed_by?: string;
  created_at: string;
}
