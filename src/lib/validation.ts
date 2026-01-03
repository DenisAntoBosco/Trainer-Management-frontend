import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const trainerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  expertise: z.array(z.string()).min(1, 'At least one expertise required'),
  employment_type: z.enum(['full-time', 'part-time', 'freelance', 'intern']),
  experience_level: z.enum(['junior', 'mid', 'senior']),
  max_batches: z.number().min(1, 'Must be at least 1').max(10, 'Cannot exceed 10'),
  gender: z.enum(['male', 'female']),
  join_date: z.string().min(1, 'Join date is required'),
  avatar: z.string().optional(),
});

export const projectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  client_name: z.string().min(2, 'Client name must be at least 2 characters'),
  primary_contact: z.object({
    name: z.string().min(2, 'Contact name required'),
    email: z.string().email('Invalid email'),
    phone: z.string().min(10, 'Phone must be at least 10 digits'),
  }),
  project_type: z.array(z.string()).min(1, 'At least one project type required'),
  start_date: z.string().min(1, 'Start date required'),
  end_date: z.string().min(1, 'End date required'),
  description: z.string().optional(),
});

export const engagementSchema = z.object({
  name: z.string().min(2, 'Engagement name required'),
  domain: z.string().min(2, 'Domain required'),
  training_type: z.string().min(2, 'Training type required'),
  total_students: z.number().min(1, 'Must have at least 1 student'),
  students_per_batch: z.number().min(1, 'Must have at least 1 student per batch'),
  start_date: z.string().min(1, 'Start date required'),
  end_date: z.string().min(1, 'End date required'),
});

export const hrRequestSchema = z.object({
  project_id: z.string().uuid('Invalid project ID'),
  engagement_id: z.string().uuid('Invalid engagement ID'),
  domain: z.string().min(2, 'Domain required'),
  trainers_needed: z.number().min(1, 'Must need at least 1 trainer'),
  urgency: z.enum(['critical', 'high', 'medium', 'low']),
  notes: z.string().optional(),
});

export const attendanceSchema = z.object({
  batch_id: z.string().min(1, 'Batch ID required'),
  project_id: z.string().min(1, 'Project ID required'),
  engagement_id: z.string().min(1, 'Engagement ID required'),
  date: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type TrainerFormData = z.infer<typeof trainerSchema>;
export type ProjectFormData = z.infer<typeof projectSchema>;
export type EngagementFormData = z.infer<typeof engagementSchema>;
export type HRRequestFormData = z.infer<typeof hrRequestSchema>;
export type AttendanceFormData = z.infer<typeof attendanceSchema>;
