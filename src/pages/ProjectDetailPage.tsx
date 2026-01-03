import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  Plus,
  Calendar,
  Users,
  Mail,
  Phone,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Send,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp,
  Loader2,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import AddEngagementModal from '@/components/modals/AddEngagementModal';
import DeleteConfirmationDialog from '@/components/modals/DeleteConfirmationDialog';
import TrainerProfileModal from '@/components/modals/TrainerProfileModal';

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects = [], trainers = [], users = [], hrRequests = [], updateBatchAllocation, confirmBatchAllocation, getAvailableTrainers, checkTrainerOverlap, addHRRequest, deleteEngagement, getHRRequestForEngagement, refreshData } = useData();
  
  const [showAddEngagement, setShowAddEngagement] = useState(false);
  const [overlapWarning, setOverlapWarning] = useState<{
    open: boolean;
    trainerId: string;
    trainerName: string;
    engagementId: string;
    batchId: string;
    overlaps: Array<{ projectName: string; engagementName: string; batchNumber: number; startDate: string; endDate: string }>;
  } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    projectId: string;
    engagementId: string;
    batchId: string;
    trainerId: string;
  } | null>(null);
  const [deleteEngagementDialog, setDeleteEngagementDialog] = useState<{
    open: boolean;
    engagementId: string;
    engagementName: string;
  } | null>(null);
  const [viewTrainerId, setViewTrainerId] = useState<string | null>(null);
  const [collapsedEngagements, setCollapsedEngagements] = useState<Set<string>>(new Set());
  const [confirmingEngagements, setConfirmingEngagements] = useState<Set<string>>(new Set());
  const [requestingHR, setRequestingHR] = useState<Set<string>>(new Set());
  const [hrRequestDialog, setHRRequestDialog] = useState<{
    open: boolean;
    engagementId: string;
    engagementName: string;
    domain: string;
    trainersNeeded: number;
  } | null>(null);
  const [hrDescription, setHRDescription] = useState('');
  const [submittingHR, setSubmittingHR] = useState(false);
  const [removePMDialog, setRemovePMDialog] = useState<{ open: boolean; pmId: string; pmName: string } | null>(null);
  const [selectedPMToAdd, setSelectedPMToAdd] = useState('');

  const project = projects.find(p => p.id === projectId);

  useEffect(() => {
    if (project) {
      setCollapsedEngagements(new Set(project.engagements.map(e => e.id)));
    }
  }, [project?.id]);

  const toggleEngagement = (engagementId: string) => {
    setCollapsedEngagements(prev => {
      const newSet = new Set(prev);
      if (newSet.has(engagementId)) {
        newSet.delete(engagementId);
      } else {
        newSet.add(engagementId);
      }
      return newSet;
    });
  };

  if (!project) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-4">Project not found</h2>
        <Button asChild>
          <Link to="/projects">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Link>
        </Button>
      </div>
    );
  }

  const getTrainerById = (id: string) => trainers.find(t => t.id === id);

  const handleTrainerSelect = async (engagementId: string, batchId: string, trainerId: string) => {
    // Find the batch to get its dates
    const engagement = project.engagements.find(e => e.id === engagementId);
    const batch = engagement?.batches.find(b => b.id === batchId);
    const trainer = getTrainerById(trainerId);
    
    if (!batch || !trainer) return;
    
    // Check for overlaps
    const overlapInfo = checkTrainerOverlap(trainerId, batch.startDate, batch.endDate, batchId);
    
    if (overlapInfo.hasOverlap) {
      // Show warning dialog
      setOverlapWarning({
        open: true,
        trainerId,
        trainerName: trainer.name,
        engagementId,
        batchId,
        overlaps: overlapInfo.overlappingBatches,
      });
    } else {
      // No overlap, proceed directly
      await updateBatchAllocation(project.id, engagementId, batchId, trainerId, []);
      toast({
        title: "Trainer Assigned",
        description: `${trainer.name} has been assigned. Click 'Confirm' to finalize.`,
      });
    }
  };

  const handleConfirmWithOverlap = async () => {
    if (!overlapWarning) return;
    
    await updateBatchAllocation(project.id, overlapWarning.engagementId, overlapWarning.batchId, overlapWarning.trainerId, []);
    toast({
      title: "Trainer Assigned",
      description: `${overlapWarning.trainerName} has been assigned. Click 'Confirm' to finalize.`,
    });
    setOverlapWarning(null);
  };

  const handleConfirmAllocation = () => {
    if (!confirmDialog) return;
    
    confirmBatchAllocation(
      confirmDialog.projectId,
      confirmDialog.engagementId,
      confirmDialog.batchId,
      user?.name || 'Admin'
    );
    
    const trainer = getTrainerById(confirmDialog.trainerId);
    toast({
      title: "Allocation Confirmed! ✓",
      description: `Notification sent to ${trainer?.name} and team.`,
    });
    
    setConfirmDialog(null);
  };

  const handleHRRequest = async (engagementId: string, domain: string) => {
    const engagement = project.engagements.find(e => e.id === engagementId);
    if (!engagement) return;

    setHRRequestDialog({
      open: true,
      engagementId,
      engagementName: engagement.name,
      domain,
      trainersNeeded: 1,
    });
  };

  const handleBatchHRRequest = (engagementId: string, engagementName: string, batchId: string, batchNumber: number, domain: string) => {
    setHRRequestDialog({
      open: true,
      engagementId,
      engagementName,
      batchId,
      batchNumber,
      domain,
      trainersNeeded: 1,
    });
  };

  const handleSubmitHRRequest = async () => {
    if (!hrRequestDialog) return;

    const key = hrRequestDialog.engagementId;
    setRequestingHR(prev => new Set(prev).add(key));
    setSubmittingHR(true);
    
    try {
      await addHRRequest({
        projectId: project.id,
        engagementId: hrRequestDialog.engagementId,
        domain: hrRequestDialog.domain,
        trainersNeeded: hrRequestDialog.trainersNeeded,
        urgency: 'high',
        notes: hrDescription || `${hrRequestDialog.trainersNeeded} ${hrRequestDialog.domain} trainer(s) needed for ${hrRequestDialog.engagementName}`,
        createdBy: user?.name || 'Admin'
      });
      
      toast({
        title: "HR Request Submitted! 📧",
        description: `Request sent for ${hrRequestDialog.trainersNeeded} ${hrRequestDialog.domain} trainer(s).`,
      });
      
      setHRRequestDialog(null);
      setHRDescription('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit HR request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingHR(false);
      setRequestingHR(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  const handleEngagementHRRequest = async (engagementId: string, engagementName: string) => {
    const engagement = project.engagements.find(e => e.id === engagementId);
    if (!engagement) return;

    // Count batches that need trainers (no trainer OR trainer with conflicts)
    const batchesNeedingTrainers = engagement.batches.filter(b => {
      if (b.status === 'confirmed') return false;
      if (!b.trainerId) return true;
      const overlapInfo = checkTrainerOverlap(b.trainerId, b.startDate, b.endDate, b.id);
      return overlapInfo.hasOverlap;
    });
    
    if (batchesNeedingTrainers.length === 0) {
      toast({
        title: "No trainers needed",
        description: "All batches have trainers assigned without conflicts.",
      });
      return;
    }

    setHRRequestDialog({
      open: true,
      engagementId,
      engagementName,
      domain: engagement.domain,
      trainersNeeded: batchesNeedingTrainers.length,
    });
  };

  const handleDeleteEngagement = async () => {
    if (!deleteEngagementDialog) return;
    
    try {
      await deleteEngagement(deleteEngagementDialog.engagementId);
      toast({
        title: "Engagement Deleted",
        description: `${deleteEngagementDialog.engagementName} has been removed.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete engagement. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddPM = async () => {
    if (!selectedPMToAdd || !projectId) return;
    try {
      const { apiClient } = await import('@/lib/api-client');
      await apiClient.addProjectManager(projectId, selectedPMToAdd);
      await refreshData();
      toast({ title: "PM Added", description: "Project manager added successfully." });
      setSelectedPMToAdd('');
    } catch (error) {
      toast({ title: "Error", description: "Failed to add PM.", variant: "destructive" });
    }
  };

  const handleRemovePM = async () => {
    if (!removePMDialog || !projectId) return;
    try {
      const { apiClient } = await import('@/lib/api-client');
      await apiClient.removeProjectManager(projectId, removePMDialog.pmId);
      await refreshData();
      toast({ title: "PM Removed", description: `${removePMDialog.pmName} removed from project.` });
      setRemovePMDialog(null);
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove PM.", variant: "destructive" });
    }
  };

  const handleConfirmAllBatches = async (engagementId: string, engagementName: string) => {
    const engagement = project.engagements.find(e => e.id === engagementId);
    if (!engagement) return;

    const batchesToConfirm = engagement.batches.filter(
      b => b.trainerId && b.status === 'awaiting_confirmation'
    );

    if (batchesToConfirm.length === 0) {
      toast({
        title: "No batches to confirm",
        description: "All batches are already confirmed or have no trainers assigned.",
      });
      return;
    }

    setConfirmingEngagements(prev => new Set(prev).add(engagementId));
    try {
      for (const batch of batchesToConfirm) {
        await confirmBatchAllocation(project.id, engagementId, batch.id, user?.name || 'Admin');
      }
      
      toast({
        title: "All Batches Confirmed! ✓",
        description: `${batchesToConfirm.length} batches confirmed for ${engagementName}. Notifications sent to all trainers.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to confirm all batches. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConfirmingEngagements(prev => {
        const newSet = new Set(prev);
        newSet.delete(engagementId);
        return newSet;
      });
    }
  };

  const handleConfirmAvailable = async (engagementId: string, engagementName: string) => {
    const engagement = project.engagements.find(e => e.id === engagementId);
    if (!engagement) return;

    const batchesToConfirm = engagement.batches.filter(b => {
      if (!b.trainerId || b.status !== 'awaiting_confirmation') return false;
      const overlapInfo = checkTrainerOverlap(b.trainerId, b.startDate, b.endDate, b.id);
      return !overlapInfo.hasOverlap;
    });

    if (batchesToConfirm.length === 0) {
      toast({
        title: "No available trainers to confirm",
        description: "All trainers either have conflicts or are already confirmed.",
      });
      return;
    }

    setConfirmingEngagements(prev => new Set(prev).add(`${engagementId}-available`));
    try {
      for (const batch of batchesToConfirm) {
        await confirmBatchAllocation(project.id, engagementId, batch.id, user?.name || 'Admin');
      }
      
      toast({
        title: "Available Trainers Confirmed! ✓",
        description: `${batchesToConfirm.length} conflict-free batches confirmed for ${engagementName}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to confirm batches. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConfirmingEngagements(prev => {
        const newSet = new Set(prev);
        newSet.delete(`${engagementId}-available`);
        return newSet;
      });
    }
  };

  const totalBatches = (project.engagements || []).reduce((acc, e) => acc + (e.batches || []).length, 0);
  const confirmedBatches = (project.engagements || []).reduce(
    (acc, e) => acc + (e.batches || []).filter(b => b.status === 'confirmed').length, 0
  );

  const statusColors = {
    confirmed: 'bg-success/10 text-success border-success/30',
    awaiting_confirmation: 'bg-warning/10 text-warning border-warning/30',
    pending: 'bg-danger/10 text-danger border-danger/30',
  };

  const statusIcons = {
    confirmed: CheckCircle2,
    awaiting_confirmation: Clock,
    pending: XCircle,
  };

  const statusLabels = {
    confirmed: 'Confirmed',
    awaiting_confirmation: 'Awaiting Confirmation',
    pending: 'Pending - No Trainer',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" className="mb-2" asChild>
            <Link to="/projects">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Link>
          </Button>
          <h1 className="text-3xl font-display font-bold">{project.name}</h1>
          <p className="text-muted-foreground mt-1">{project.client_name}</p>
        </div>
        <Badge className={cn(
          "text-sm px-3 py-1",
          project.status === 'active' && "bg-success/10 text-success",
          project.status === 'upcoming' && "bg-primary/10 text-primary",
        )}>
          {project.status}
        </Badge>
      </div>

      {/* Project Overview Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Contact Info */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Primary Contact</h4>
              <p className="font-semibold">{project.primary_contact_name || 'N/A'}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Mail className="w-4 h-4" />
                <span>{project.primary_contact_email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Phone className="w-4 h-4" />
                <span>{project.primary_contact_phone || 'N/A'}</span>
              </div>
            </div>

            {/* Dates */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Project Duration</h4>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {(project.project_type || []).map(type => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Allocation Summary */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Allocation Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-medium">{confirmedBatches}/{totalBatches} batches</span>
                </div>
                <Progress value={(confirmedBatches / totalBatches) * 100} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Managers Section */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Project Managers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(project.project_manager_ids || []).map(pmId => {
              const pm = users.find(u => u.id === pmId);
              if (!pm) return null;
              return (
                <Card key={pmId} className="border-2 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={pm.avatar_url} />
                        <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                          {pm.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{pm.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{pm.email}</p>
                        <Badge variant="secondary" className="mt-2 text-xs">Project Manager</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-danger hover:text-danger hover:bg-danger/10"
                        onClick={() => setRemovePMDialog({ open: true, pmId: pm.id, pmName: pm.name })}
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="flex items-center gap-3 pt-4 border-t">
            <Select value={selectedPMToAdd} onValueChange={setSelectedPMToAdd}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a project manager to add..." />
              </SelectTrigger>
              <SelectContent>
                {users.filter(u => u.role === 'project_manager' && !(project.project_manager_ids || []).includes(u.id)).map(pm => (
                  <SelectItem key={pm.id} value={pm.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                        {pm.name.charAt(0)}
                      </div>
                      <span>{pm.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddPM} disabled={!selectedPMToAdd}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add PM
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Engagements Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-semibold">Engagements</h2>
        <Button onClick={() => setShowAddEngagement(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Engagement
        </Button>
      </div>

      {(project.engagements || []).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No engagements yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first engagement to start allocating trainers
            </p>
            <Button onClick={() => setShowAddEngagement(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Engagement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {(project.engagements || []).map((engagement, engIndex) => {
            const engConfirmed = (engagement.batches || []).filter(b => b.status === 'confirmed').length;
            const allAvailableForDomain = getAvailableTrainers(engagement.domain);
            
            // Check if there's an HR request for this engagement
            const engagementHRRequest = getHRRequestForEngagement(engagement.id);
            const getEngagementHRButtonText = () => {
              if (!engagementHRRequest) return 'Request HR';
              if (engagementHRRequest.status === 'pending') return '⏳ Waiting for HR';
              if (engagementHRRequest.status === 'in_progress') return '🔄 HR Working on It';
              return 'Request HR';
            };

            return (
              <motion.div
                key={engagement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: engIndex * 0.1 }}
              >
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleEngagement(engagement.id)}
                          >
                            {collapsedEngagements.has(engagement.id) ? 
                              <ChevronDown className="w-5 h-5" /> : 
                              <ChevronUp className="w-5 h-5" />
                            }
                          </Button>
                          <CardTitle className="font-display">{engagement.name}</CardTitle>
                        </div>
                        <div className="flex items-center gap-3 mt-2 ml-11">
                          <Badge variant="secondary">{engagement.domain}</Badge>
                          <Badge variant="outline">{engagement.trainingType}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {engagement.totalStudents} students • {(engagement.batches || []).length} batches
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Allocation</p>
                          <p className="font-semibold">{engConfirmed}/{(engagement.batches || []).length}</p>
                        </div>
                        {(engagement.batches.some(b => b.status !== 'confirmed' && (!b.trainerId || (() => {
                          const overlapInfo = checkTrainerOverlap(b.trainerId, b.startDate, b.endDate, b.id);
                          return overlapInfo.hasOverlap;
                        })()))) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className={cn(
                              "border-primary text-primary hover:bg-primary/10",
                              engagementHRRequest && "border-blue-500 text-blue-600 hover:bg-blue-500/10"
                            )}
                            onClick={() => handleEngagementHRRequest(engagement.id, engagement.name)}
                            disabled={requestingHR.has(engagement.id) || !!engagementHRRequest}
                          >
                            {requestingHR.has(engagement.id) ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4 mr-1" />
                            )}
                            {getEngagementHRButtonText()}
                          </Button>
                        )}
                        {/* Show Confirm Available only if there's a mix of available and conflicted/pending batches */}
                        {engagement.batches.some(b => {
                          if (!b.trainerId || b.status !== 'awaiting_confirmation') return false;
                          const overlapInfo = checkTrainerOverlap(b.trainerId, b.startDate, b.endDate, b.id);
                          return !overlapInfo.hasOverlap;
                        }) && engagement.batches.some(b => {
                          // Has either pending batches OR batches with conflicts
                          if (!b.trainerId) return true;
                          if (b.status !== 'awaiting_confirmation') return false;
                          const overlapInfo = checkTrainerOverlap(b.trainerId, b.startDate, b.endDate, b.id);
                          return overlapInfo.hasOverlap;
                        }) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-success text-success hover:bg-success/10"
                            onClick={() => handleConfirmAvailable(engagement.id, engagement.name)}
                            disabled={confirmingEngagements.has(`${engagement.id}-available`)}
                          >
                            {confirmingEngagements.has(`${engagement.id}-available`) ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                            )}
                            Confirm Available
                          </Button>
                        )}
                        {engagement.batches.some(b => b.trainerId && b.status === 'awaiting_confirmation') && (
                          <Button
                            size="sm"
                            className="gradient-success text-white"
                            onClick={() => handleConfirmAllBatches(engagement.id, engagement.name)}
                            disabled={confirmingEngagements.has(engagement.id)}
                          >
                            {confirmingEngagements.has(engagement.id) ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                            )}
                            Confirm All
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-danger hover:text-danger hover:bg-danger/10"
                          onClick={() => setDeleteEngagementDialog({
                            open: true,
                            engagementId: engagement.id,
                            engagementName: engagement.name
                          })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {!collapsedEngagements.has(engagement.id) && (
                    <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {(engagement.batches || []).map((batch) => {
                        const trainer = batch.trainerId ? getTrainerById(batch.trainerId) : null;
                        const StatusIcon = statusIcons[batch.status];
                        
                        // Separate trainers into available and conflicted
                        const availableTrainers: typeof allAvailableForDomain = [];
                        const conflictedTrainers: typeof allAvailableForDomain = [];
                        
                        allAvailableForDomain.forEach(t => {
                          const overlapInfo = checkTrainerOverlap(t.id, batch.startDate, batch.endDate, batch.id);
                          if (overlapInfo.hasOverlap) {
                            conflictedTrainers.push(t);
                          } else {
                            availableTrainers.push(t);
                          }
                        });

                        return (
                          <Card key={batch.id} className={cn(
                            "border-2",
                            statusColors[batch.status]
                          )}>
                            <CardContent className="p-4">
                              {/* Batch Header */}
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold">Batch #{batch.batchNumber}</h4>
                                <div className={cn(
                                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                                  statusColors[batch.status]
                                )}>
                                  <StatusIcon className="w-3 h-3" />
                                  <span>{statusLabels[batch.status]}</span>
                                </div>
                              </div>

                              {/* Batch Info */}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  <span>{batch.students} students</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{new Date(batch.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                </div>
                              </div>

                              {/* Trainer Selection */}
                              <div className="space-y-3">
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                    Primary Trainer
                                  </label>
                                  {batch.status === 'confirmed' && trainer ? (
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-success/5 border border-success/20">
                                      <Avatar className="w-8 h-8">
                                        <AvatarImage src={trainer.avatar} />
                                        <AvatarFallback>{trainer.name.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{trainer.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          Confirmed ✓
                                        </p>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <Select
                                        value={batch.trainerId || ''}
                                        onValueChange={(value) => handleTrainerSelect(engagement.id, batch.id, value)}
                                      >
                                        <SelectTrigger className={cn(
                                          !batch.trainerId && "border-dashed",
                                          batch.status === 'pending' && "border-danger"
                                        )}>
                                          <SelectValue placeholder={
                                            availableTrainers.length > 0 
                                              ? "Select trainer..." 
                                              : `⚠️ No available ${engagement.domain} trainers`
                                          } />
                                        </SelectTrigger>
                                        <SelectContent className="max-w-sm max-h-[300px] overflow-y-auto">
                                          {availableTrainers.length > 0 && (
                                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                              Available Trainers
                                            </div>
                                          )}
                                          {availableTrainers.map(t => (
                                            <div key={t.id} className="flex items-center">
                                              <SelectItem value={t.id} className="flex-1">
                                                <div className="flex items-center gap-2">
                                                  <Avatar className="w-6 h-6">
                                                    <AvatarImage src={t.avatar} />
                                                    <AvatarFallback>{t.name.charAt(0)}</AvatarFallback>
                                                  </Avatar>
                                                  <span>{t.name}</span>
                                                  <span className="text-xs text-muted-foreground">
                                                    ({t.currentBatches}/{t.maxBatches})
                                                  </span>
                                                </div>
                                              </SelectItem>
                                              <TooltipProvider>
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <button
                                                      type="button"
                                                      className="p-2 hover:bg-accent rounded mr-1"
                                                      onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setViewTrainerId(t.id);
                                                      }}
                                                    >
                                                      <Eye className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                                    </button>
                                                  </TooltipTrigger>
                                                  <TooltipContent>
                                                    <p>View Profile</p>
                                                  </TooltipContent>
                                                </Tooltip>
                                              </TooltipProvider>
                                            </div>
                                          ))}
                                          {conflictedTrainers.length > 0 && (
                                            <>
                                              <div className="px-2 py-1.5 text-xs font-semibold text-warning border-t mt-1">
                                                ⚠️ Trainers with Schedule Conflicts
                                              </div>
                                              {conflictedTrainers.map(t => (
                                                <div key={t.id} className="flex items-center">
                                                  <SelectItem value={t.id} className="flex-1 bg-warning/5">
                                                    <div className="flex items-center gap-2">
                                                      <Avatar className="w-6 h-6">
                                                        <AvatarImage src={t.avatar} />
                                                        <AvatarFallback>{t.name.charAt(0)}</AvatarFallback>
                                                      </Avatar>
                                                      <span>{t.name}</span>
                                                      <span className="text-xs text-warning">
                                                        (Conflict)
                                                      </span>
                                                    </div>
                                                  </SelectItem>
                                                  <TooltipProvider>
                                                    <Tooltip>
                                                      <TooltipTrigger asChild>
                                                        <button
                                                          type="button"
                                                          className="p-2 hover:bg-accent rounded mr-1"
                                                          onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setViewTrainerId(t.id);
                                                          }}
                                                        >
                                                          <Eye className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                                        </button>
                                                      </TooltipTrigger>
                                                      <TooltipContent>
                                                        <p>View Profile</p>
                                                      </TooltipContent>
                                                    </Tooltip>
                                                  </TooltipProvider>
                                                </div>
                                              ))}
                                            </>
                                          )}
                                          {availableTrainers.length === 0 && conflictedTrainers.length === 0 && (
                                            <SelectItem value="none" disabled>
                                              No trainers available
                                            </SelectItem>
                                          )}
                                        </SelectContent>
                                      </Select>
                                      {availableTrainers.length === 0 && (
                                        <p className="text-xs text-warning mt-2">
                                          ⚠️ No available {engagement.domain} trainers
                                        </p>
                                      )}
                                    </>
                                  )}
                                </div>

                                {/* Confirmed Info */}
                                {batch.status === 'confirmed' && batch.confirmedAt && (
                                  <p className="text-xs text-muted-foreground">
                                    Confirmed by {batch.confirmedBy} on {new Date(batch.confirmedAt).toLocaleString()}
                                  </p>
                                )}

                                {/* Action Buttons */}
                                {batch.trainerId && batch.status !== 'confirmed' && trainer && (
                                  <Button
                                    size="sm"
                                    className="w-full gradient-success text-white"
                                    onClick={() => setConfirmDialog({
                                      open: true,
                                      projectId: project.id,
                                      engagementId: engagement.id,
                                      batchId: batch.id,
                                      trainerId: trainer.id,
                                    })}
                                  >
                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                    Confirm
                                  </Button>
                                )}

                                {batch.status === 'pending' && !batch.trainerId && (
                                  <p className="text-xs text-muted-foreground">
                                    Use "Request HR" button above to request trainers
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Engagement Modal */}
      <AddEngagementModal
        open={showAddEngagement}
        onClose={() => setShowAddEngagement(false)}
        projectId={project.id}
      />

      {/* Confirm Allocation Dialog */}
      <Dialog open={confirmDialog?.open || false} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Confirm Trainer Allocation</DialogTitle>
            <DialogDescription>
              You are about to confirm this allocation. An email notification will be sent to the trainer.
            </DialogDescription>
          </DialogHeader>
          
          {confirmDialog && (() => {
            const trainer = getTrainerById(confirmDialog.trainerId);
            const engagement = (project.engagements || []).find(e => e.id === confirmDialog.engagementId);
            const batch = (engagement?.batches || []).find(b => b.id === confirmDialog.batchId);
            
            return (
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={trainer?.avatar} />
                      <AvatarFallback>{trainer?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{trainer?.name}</p>
                      <p className="text-sm text-muted-foreground">{trainer?.email}</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t space-y-1 text-sm">
                    <p><strong>Batch:</strong> #{batch?.batchNumber} - {engagement?.name}</p>
                    <p><strong>Students:</strong> {batch?.students}</p>
                    <p><strong>Duration:</strong> {batch?.startDate} - {batch?.endDate}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <Mail className="w-4 h-4 text-primary mt-0.5" />
                  <p className="text-sm">
                    Email notification will be sent to <strong>{trainer?.email}</strong> with batch details and calendar invite.
                  </p>
                </div>
              </div>
            );
          })()}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Cancel
            </Button>
            <Button className="gradient-primary" onClick={handleConfirmAllocation}>
              <Send className="w-4 h-4 mr-2" />
              Confirm & Send Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Overlap Warning Dialog */}
      <Dialog open={overlapWarning?.open || false} onOpenChange={() => setOverlapWarning(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2 text-warning">
              <AlertTriangle className="w-5 h-5" />
              Schedule Overlap Warning
            </DialogTitle>
            <DialogDescription>
              The selected trainer has overlapping batch assignments during this period.
            </DialogDescription>
          </DialogHeader>
          
          {overlapWarning && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/30 space-y-3">
                <p className="font-medium">{overlapWarning.trainerName} is already assigned to:</p>
                <div className="space-y-2">
                  {overlapWarning.overlaps.map((overlap, i) => (
                    <div key={i} className="p-2 rounded bg-background/50 text-sm">
                      <p className="font-medium">{overlap.projectName}</p>
                      <p className="text-muted-foreground">
                        {overlap.engagementName} - Batch #{overlap.batchNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(overlap.startDate).toLocaleDateString()} - {new Date(overlap.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Do you still want to assign this trainer? They may not be able to handle both batches simultaneously.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOverlapWarning(null)}>
              Cancel
            </Button>
            <Button 
              className="bg-warning hover:bg-warning/90 text-white" 
              onClick={handleConfirmWithOverlap}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Proceed Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Engagement Dialog */}
      {deleteEngagementDialog && (
        <DeleteConfirmationDialog
          open={deleteEngagementDialog.open}
          onClose={() => setDeleteEngagementDialog(null)}
          onConfirm={handleDeleteEngagement}
          title="Delete Engagement"
          itemName={deleteEngagementDialog.engagementName}
          itemType="engagement"
          description="This will permanently delete the engagement and all its batches and trainer allocations. This action cannot be undone."
        />
      )}

      {/* Trainer Profile Modal */}
      <TrainerProfileModal 
        open={!!viewTrainerId} 
        onClose={() => setViewTrainerId(null)} 
        trainerId={viewTrainerId || ''} 
      />

      {/* HR Request Description Dialog */}
      <Dialog open={hrRequestDialog?.open || false} onOpenChange={() => {
        setHRRequestDialog(null);
        setHRDescription('');
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Request HR Hiring</DialogTitle>
            <DialogDescription>
              Provide additional details to help HR find the right trainer(s).
            </DialogDescription>
          </DialogHeader>
          
          {hrRequestDialog && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
                <p><strong>Engagement:</strong> {hrRequestDialog.engagementName}</p>
                <p><strong>Domain:</strong> {hrRequestDialog.domain}</p>
                <p><strong>Trainers Needed:</strong> {hrRequestDialog.trainersNeeded}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Additional Notes (Optional)
                </label>
                <textarea
                  className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g., Specific skills required, urgency details, preferred experience level..."
                  value={hrDescription}
                  onChange={(e) => setHRDescription(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setHRRequestDialog(null);
              setHRDescription('');
            }} disabled={submittingHR}>
              Cancel
            </Button>
            <Button className="gradient-primary" onClick={handleSubmitHRRequest} disabled={submittingHR}>
              {submittingHR && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {submittingHR ? 'Submitting...' : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove PM Dialog */}
      <Dialog open={removePMDialog?.open || false} onOpenChange={() => setRemovePMDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2 text-warning">
              <AlertTriangle className="w-5 h-5" />
              Remove Project Manager
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this project manager?
            </DialogDescription>
          </DialogHeader>
          {removePMDialog && (
            <div className="py-4">
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
                <p className="font-medium">{removePMDialog.pmName}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This PM will no longer have access to manage this project.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemovePMDialog(null)}>Cancel</Button>
            <Button className="bg-danger hover:bg-danger/90 text-white" onClick={handleRemovePM}>
              <UserMinus className="w-4 h-4 mr-2" />
              Remove PM
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
