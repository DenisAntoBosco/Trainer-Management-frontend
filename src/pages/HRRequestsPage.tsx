import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  Users, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Building2,
  GraduationCap,
  Calendar,
  MessageSquare,
  MoreVertical
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useData, HRRequest } from '@/contexts/DataContext';
import { toast } from 'sonner';

const HRRequestsPage = () => {
  const { hrRequests = [], projects = [], updateHRRequestStatus } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<HRRequest | null>(null);
  const [newStatus, setNewStatus] = useState<HRRequest['status']>('pending');
  const [notes, setNotes] = useState('');
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  const getProjectInfo = (projectId: string) => {
    return projects.find(p => p.id === projectId);
  };

  const getEngagementInfo = (projectId: string, engagementId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.engagements.find(e => e.id === engagementId);
  };

  const filteredRequests = hrRequests.filter(request => {
    const project = getProjectInfo(request.projectId);
    const engagement = getEngagementInfo(request.projectId, request.engagementId);
    
    const matchesSearch = 
      request.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      engagement?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'all' || request.urgency === urgencyFilter;
    
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
      case 'in_progress': return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
      case 'fulfilled': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Waiting for HR';
      case 'in_progress': return 'HR Working on It';
      case 'fulfilled': return 'Fulfilled';
      default: return status;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'in_progress': return <ArrowRight className="h-4 w-4" />;
      case 'fulfilled': return <CheckCircle2 className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const handleUpdateStatus = (request: HRRequest) => {
    setSelectedRequest(request);
    setNewStatus(request.status);
    setNotes(request.notes || '');
    setIsUpdateDialogOpen(true);
  };

  const confirmStatusUpdate = () => {
    if (selectedRequest) {
      updateHRRequestStatus(selectedRequest.id, newStatus, notes);
      toast.success(`Request status updated to ${newStatus.replace('_', ' ')}`);
      setIsUpdateDialogOpen(false);
      setSelectedRequest(null);
    }
  };

  const statusCounts = {
    pending: hrRequests.filter(r => r.status === 'pending').length,
    in_progress: hrRequests.filter(r => r.status === 'in_progress').length,
    fulfilled: hrRequests.filter(r => r.status === 'fulfilled').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Requests</h1>
          <p className="text-muted-foreground">Manage trainer hiring requests and track their status</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-amber-500">Pending</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-500">{statusCounts.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting action</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-500">In Progress</CardTitle>
              <ArrowRight className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{statusCounts.in_progress}</div>
              <p className="text-xs text-muted-foreground">Being processed</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-emerald-500">Fulfilled</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-500">{statusCounts.fulfilled}</div>
              <p className="text-xs text-muted-foreground">Completed requests</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by domain, project, or engagement..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="fulfilled">Fulfilled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger className="w-[140px]">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Urgency</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No HR Requests Found</h3>
              <p className="text-muted-foreground">No requests match your current filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request, index) => {
            const project = getProjectInfo(request.projectId);
            const engagement = getEngagementInfo(request.projectId, request.engagementId);
            
            return (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      {/* Left Section */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <GraduationCap className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{request.domain} Trainers Needed</h3>
                              <p className="text-sm text-muted-foreground">Request #{request.id}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 lg:hidden">
                            <Badge variant="outline" className={getUrgencyColor(request.urgency)}>
                              {request.urgency}
                            </Badge>
                            <Badge variant="outline" className={getStatusColor(request.status)}>
                              {getStatusIcon(request.status)}
                              <span className="ml-1">{getStatusLabel(request.status)}</span>
                            </Badge>
                          </div>
                        </div>

                        <div className="grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-3">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Project:</span>
                            <span className="font-medium">{project?.name || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Engagement:</span>
                            <span className="font-medium">{engagement?.name || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Trainers Needed:</span>
                            <span className="font-medium">{request.trainersNeeded}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Created:</span>
                            <span className="font-medium">
                              {request.createdAt ? format(new Date(request.createdAt), 'MMM d, yyyy') : 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Requested by:</span>
                            <span className="font-medium">{request.createdBy || 'Unknown'}</span>
                          </div>
                        </div>

                        {request.notes && (
                          <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
                            <MessageSquare className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">{request.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Right Section */}
                      <div className="hidden lg:flex lg:flex-col lg:items-end lg:gap-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getUrgencyColor(request.urgency)}>
                            {request.urgency.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(request.status)}>
                            {getStatusIcon(request.status)}
                            <span className="ml-1">{getStatusLabel(request.status)}</span>
                          </Badge>
                        </div>
                        
                        {/* Quick Action Buttons */}
                        <div className="flex gap-2">
                          {request.status === 'pending' && (
                            <Button
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                              onClick={() => {
                                updateHRRequestStatus(request.id, 'in_progress');
                                toast.success('🚀 Started working on request!');
                              }}
                            >
                              <ArrowRight className="w-4 h-4 mr-1" />
                              Start Working
                            </Button>
                          )}
                          {request.status === 'in_progress' && (
                            <Button
                              size="sm"
                              className="bg-emerald-500 hover:bg-emerald-600 text-white"
                              onClick={() => {
                                updateHRRequestStatus(request.id, 'fulfilled');
                                toast.success('✅ Request fulfilled!');
                              }}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Mark Fulfilled
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleUpdateStatus(request)}>
                                Update Status & Notes
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Mobile Actions */}
                      <div className="flex justify-end lg:hidden">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              Actions
                              <MoreVertical className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleUpdateStatus(request)}>
                              Update Status
                            </DropdownMenuItem>
                            {request.status === 'pending' && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  updateHRRequestStatus(request.id, 'in_progress');
                                  toast.success('Request marked as in progress');
                                }}
                              >
                                Mark In Progress
                              </DropdownMenuItem>
                            )}
                            {request.status === 'in_progress' && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  updateHRRequestStatus(request.id, 'fulfilled');
                                  toast.success('Request marked as fulfilled');
                                }}
                              >
                                Mark Fulfilled
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Update Status Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Request Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={newStatus} onValueChange={(v: HRRequest['status']) => setNewStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="fulfilled">Fulfilled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this update..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmStatusUpdate}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HRRequestsPage;
