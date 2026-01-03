import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api-client';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: string;
}

export interface Trainer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  expertise: string[];
  status: 'available' | 'partially_allocated' | 'fully_allocated' | 'on_leave';
  maxBatches: number;
  currentBatches: number;
  employmentType: 'full-time' | 'part-time' | 'freelance' | 'intern';
  experienceLevel: 'junior' | 'mid' | 'senior';
  joinDate: string;
}

export interface Batch {
  id: string;
  engagementId: string;
  batchNumber: number;
  students: number;
  startDate: string;
  endDate: string;
  status: 'confirmed' | 'pending' | 'awaiting_confirmation';
  trainerId?: string;
  supportStaff: string[];
  confirmedAt?: string;
  confirmedBy?: string;
}

export interface Engagement {
  id: string;
  projectId: string;
  name: string;
  domain: string;
  trainingType: string;
  totalStudents: number;
  studentsPerBatch: number;
  batches: Batch[];
  startDate: string;
  endDate: string;
  status: 'active' | 'upcoming' | 'completed';
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
  description: string;
  status: 'active' | 'upcoming' | 'completed';
  project_manager_ids: string[];
  engagements: Engagement[];
  created_at: string;
  created_by: string;
}

export interface HRRequest {
  id: string;
  projectId: string;
  engagementId: string;
  domain: string;
  trainersNeeded: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'fulfilled';
  createdAt: string;
  createdBy: string;
  notes?: string;
}

interface OverlapInfo {
  hasOverlap: boolean;
  overlappingBatches: Array<{
    projectName: string;
    engagementName: string;
    batchNumber: number;
    startDate: string;
    endDate: string;
  }>;
}

interface DataContextType {
  trainers: Trainer[];
  projects: Project[];
  hrRequests: HRRequest[];
  users: User[];
  loading: boolean;
  addProject: (project: {
    name: string;
    clientName: string;
    primaryContact: { name: string; email: string; phone: string };
    projectType: string[];
    startDate: string;
    endDate: string;
    description?: string;
    status: 'active' | 'upcoming' | 'completed';
  }) => Promise<Project>;
  addEngagement: (projectId: string, engagement: Omit<Engagement, 'id' | 'batches'>) => Promise<Engagement>;
  updateBatchAllocation: (projectId: string, engagementId: string, batchId: string, trainerId: string, supportStaff: string[]) => Promise<void>;
  confirmBatchAllocation: (projectId: string, engagementId: string, batchId: string, confirmedBy: string) => Promise<void>;
  addHRRequest: (request: Omit<HRRequest, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  getHRRequestForEngagement: (engagementId: string) => HRRequest | undefined;
  updateHRRequestStatus: (requestId: string, status: HRRequest['status'], notes?: string) => Promise<void>;
  getAvailableTrainers: (domain: string) => Trainer[];
  addTrainer: (trainer: Omit<Trainer, 'id'>) => Promise<Trainer>;
  updateTrainer: (trainerId: string, trainer: Partial<Omit<Trainer, 'id'>>) => Promise<void>;
  checkTrainerOverlap: (trainerId: string, startDate: string, endDate: string, excludeBatchId?: string) => OverlapInfo;
  refreshData: () => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  deleteEngagement: (engagementId: string) => Promise<void>;
  deleteTrainer: (trainerId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [hrRequests, setHRRequests] = useState<HRRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    try {
      setLoading(true);
      const [trainersData, projectsData, hrRequestsData, usersData] = await Promise.all([
        apiClient.getTrainers(),
        apiClient.getProjects(),
        apiClient.getHRRequests(),
        apiClient.getUsers()
      ]);
      
      console.log('Fetched data:', { trainersData, projectsData, hrRequestsData, usersData });
      
      // Transform snake_case to camelCase for trainers
      const transformedTrainers = Array.isArray(trainersData) ? trainersData.map((t: any) => ({
        id: t.id,
        name: t.name,
        email: t.email,
        phone: t.phone,
        avatar: t.avatar,
        expertise: t.expertise,
        status: t.status,
        maxBatches: t.max_batches,
        currentBatches: t.current_batches,
        employmentType: t.employment_type,
        experienceLevel: t.experience_level,
        joinDate: t.join_date
      })) : [];
      
      // Transform projects data
      const transformedProjects = Array.isArray(projectsData) ? projectsData.map((p: any) => ({
        ...p,
        engagements: (p.engagements || []).map((e: any) => ({
          ...e,
          batches: (e.batches || []).map((b: any) => ({
            id: b.id,
            engagementId: b.engagement_id,
            batchNumber: b.batch_number,
            students: b.students,
            startDate: b.start_date,
            endDate: b.end_date,
            status: b.status,
            trainerId: b.trainer_id,
            confirmedAt: b.confirmed_at,
            confirmedBy: b.confirmed_by,
            supportStaff: b.support_staff || []
          }))
        }))
      })) : [];
      
      // Transform HR requests data
      const transformedHRRequests = Array.isArray(hrRequestsData) ? hrRequestsData.map((hr: any) => ({
        id: hr.id,
        projectId: hr.project_id,
        engagementId: hr.engagement_id,
        domain: hr.domain,
        trainersNeeded: hr.trainers_needed,
        urgency: hr.urgency,
        status: hr.status,
        createdAt: hr.created_at,
        createdBy: hr.created_by,
        notes: hr.notes
      })) : [];
      
      setTrainers(transformedTrainers);
      setProjects(transformedProjects);
      setHRRequests(transformedHRRequests);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setTrainers([]);
      setProjects([]);
      setHRRequests([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const addProject = async (projectData: {
    name: string;
    clientName: string;
    primaryContact: { name: string; email: string; phone: string };
    projectType: string[];
    startDate: string;
    endDate: string;
    description?: string;
    status: 'active' | 'upcoming' | 'completed';
  }): Promise<Project> => {
    const newProject = await apiClient.createProject({
      name: projectData.name,
      client_name: projectData.clientName,
      primary_contact: projectData.primaryContact,
      project_type: projectData.projectType,
      start_date: projectData.startDate,
      end_date: projectData.endDate,
      description: projectData.description || ''
    });
    await refreshData();
    return newProject;
  };

  const addEngagement = async (projectId: string, engagementData: Omit<Engagement, 'id' | 'batches'>): Promise<Engagement> => {
    const newEngagement = await apiClient.createEngagement(projectId, {
      ...engagementData,
      training_type: engagementData.trainingType,
      total_students: engagementData.totalStudents,
      students_per_batch: engagementData.studentsPerBatch,
      start_date: engagementData.startDate,
      end_date: engagementData.endDate
    });
    await refreshData();
    return newEngagement;
  };

  const updateBatchAllocation = async (projectId: string, engagementId: string, batchId: string, trainerId: string, supportStaff: string[]) => {
    await apiClient.allocateTrainer(batchId, trainerId, supportStaff);
    await refreshData();
  };

  const confirmBatchAllocation = async (projectId: string, engagementId: string, batchId: string, confirmedBy: string) => {
    await apiClient.confirmAllocation(batchId);
    await refreshData();
  };

  const addHRRequest = async (requestData: Omit<HRRequest, 'id' | 'createdAt' | 'status'>) => {
    await apiClient.createHRRequest({
      project_id: requestData.projectId,
      engagement_id: requestData.engagementId,
      domain: requestData.domain,
      trainers_needed: requestData.trainersNeeded,
      urgency: requestData.urgency,
      notes: requestData.notes
    });
    await refreshData();
  };

  const getHRRequestForEngagement = (engagementId: string): HRRequest | undefined => {
    return hrRequests.find(hr => hr.engagementId === engagementId && hr.status !== 'fulfilled');
  };

  const updateHRRequestStatus = async (requestId: string, status: HRRequest['status'], notes?: string) => {
    await apiClient.updateHRRequest(requestId, { status, notes });
    await refreshData();
  };

  const getAvailableTrainers = (domain: string): Trainer[] => {
    return trainers.filter(t => {
      // Check if trainer has expertise in the domain (case-insensitive partial match)
      const hasExpertise = t.expertise.some(e => 
        e.toLowerCase().includes(domain.toLowerCase()) || 
        domain.toLowerCase().includes(e.toLowerCase())
      );
      
      // Check availability conditions
      const isAvailable = t.status !== 'fully_allocated' && 
                         t.status !== 'on_leave' && 
                         t.currentBatches < t.maxBatches;
      
      return hasExpertise && isAvailable;
    });
  };

  const checkTrainerOverlap = (trainerId: string, startDate: string, endDate: string, excludeBatchId?: string): OverlapInfo => {
    const overlappingBatches: OverlapInfo['overlappingBatches'] = [];
    
    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);
    
    projects.forEach(project => {
      project.engagements.forEach(engagement => {
        engagement.batches.forEach(batch => {
          if (batch.id === excludeBatchId) return;
          
          if (batch.trainerId === trainerId) {
            const batchStart = new Date(batch.startDate);
            const batchEnd = new Date(batch.endDate);
            
            const hasOverlap = newStart <= batchEnd && newEnd >= batchStart;
            
            if (hasOverlap) {
              overlappingBatches.push({
                projectName: project.name,
                engagementName: engagement.name,
                batchNumber: batch.batchNumber,
                startDate: batch.startDate,
                endDate: batch.endDate,
              });
            }
          }
        });
      });
    });
    
    return {
      hasOverlap: overlappingBatches.length > 0,
      overlappingBatches,
    };
  };

  const addTrainer = async (trainerData: Omit<Trainer, 'id'>): Promise<Trainer> => {
    const newTrainer = await apiClient.createTrainer({
      ...trainerData,
      employment_type: trainerData.employmentType,
      experience_level: trainerData.experienceLevel,
      max_batches: trainerData.maxBatches,
      join_date: trainerData.joinDate
    });
    await refreshData();
    // Wait for auto-assignment to complete and refresh again
    await new Promise(resolve => setTimeout(resolve, 500));
    await refreshData();
    return newTrainer;
  };

  const updateTrainer = async (trainerId: string, trainerData: Partial<Omit<Trainer, 'id'>>): Promise<void> => {
    await apiClient.updateTrainer(trainerId, {
      ...trainerData,
      employment_type: trainerData.employmentType,
      experience_level: trainerData.experienceLevel,
    });
    await refreshData();
    // Force a small delay to ensure data is refreshed
    await new Promise(resolve => setTimeout(resolve, 100));
  };

  const deleteProject = async (projectId: string): Promise<void> => {
    await apiClient.deleteProject(projectId);
    await refreshData();
  };

  const deleteEngagement = async (engagementId: string): Promise<void> => {
    await apiClient.deleteEngagement(engagementId);
    await refreshData();
  };

  const deleteTrainer = async (trainerId: string): Promise<void> => {
    await apiClient.deleteTrainer(trainerId);
    await refreshData();
  };

  return (
    <DataContext.Provider value={{
      trainers,
      projects,
      hrRequests,
      users,
      loading,
      addProject,
      addEngagement,
      updateBatchAllocation,
      confirmBatchAllocation,
      addHRRequest,
      updateHRRequestStatus,
      getAvailableTrainers,
      addTrainer,
      updateTrainer,
      checkTrainerOverlap,
      refreshData,
      deleteProject,
      deleteEngagement,
      deleteTrainer,
      getHRRequestForEngagement,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
