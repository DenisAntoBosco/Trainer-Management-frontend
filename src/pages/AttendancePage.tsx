import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { apiClient } from '@/lib/api-client';
import { format, parseISO, isSameDay } from 'date-fns';
import {
  Clock,
  LogIn,
  LogOut,
  CheckCircle2,
  Calendar,
  FileText,
  Users,
  AlertCircle,
  Filter,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AttendanceRecord {
  id: string;
  trainer_id: string;
  trainer_name: string;
  batch_id: string;
  project_id: string;
  engagement_id: string;
  date: string;
  punch_in: string | null;
  punch_out: string | null;
  completion_notes: string | null;
  status: 'pending' | 'punched_in' | 'completed';
}

export default function AttendancePage() {
  const { user } = useAuth();
  const { projects = [], trainers = [] } = useData();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [punchOutDialog, setPunchOutDialog] = useState<{
    open: boolean;
    record: AttendanceRecord | null;
  }>({ open: false, record: null });
  const [completionNotes, setCompletionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTrainer = user?.role === 'trainer';
  const canViewAll = user?.role === 'admin' || user?.role === 'project_manager' || user?.role === 'hr';

  // Get trainer's assigned batches
  const getTrainerBatches = () => {
    const batches: Array<{
      batchId: string;
      projectId: string;
      projectName: string;
      engagementId: string;
      engagementName: string;
      batchNumber: number;
      trainerId: string;
    }> = [];

    projects.forEach(project => {
      project.engagements.forEach(engagement => {
        engagement.batches.forEach(batch => {
          if (batch.trainerId && (isTrainer ? batch.trainerId === user?.id : true)) {
            batches.push({
              batchId: batch.id,
              projectId: project.id,
              projectName: project.name,
              engagementId: engagement.id,
              engagementName: engagement.name,
              batchNumber: batch.batchNumber,
              trainerId: batch.trainerId,
            });
          }
        });
      });
    });

    return batches;
  };

  const trainerBatches = getTrainerBatches();

  // Fetch attendance from backend API
  const fetchAttendance = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const params: any = {};
      
      // Trainers only see their own attendance
      if (isTrainer) {
        params.trainer_id = user.id;
      }

      const data = await apiClient.getAttendance(params);
      setAttendance(data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attendance records',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [user]);

  // Check if already punched in for a batch today
  const getTodayRecord = (batchId: string) => {
    return attendance.find(
      a => a.batch_id === batchId && isSameDay(parseISO(a.date), new Date())
    );
  };

  // Handle punch in
  const handlePunchIn = async (batch: typeof trainerBatches[0]) => {
    if (!user) return;
    
    setIsSubmitting(true);
    const trainer = trainers.find(t => t.id === batch.trainerId);
    
    try {
      const data = await apiClient.createAttendance({
        trainer_id: user.id,
        trainer_name: user.name || trainer?.name || 'Unknown',
        batch_id: batch.batchId,
        project_id: batch.projectId,
        engagement_id: batch.engagementId,
        date: new Date().toISOString().split('T')[0],
        punch_in: new Date().toISOString(),
        status: 'punched_in',
      });

      setAttendance([...attendance, data as AttendanceRecord]);
      toast({
        title: 'Punched In',
        description: `You have punched in for ${batch.engagementName} - Batch #${batch.batchNumber}`,
      });
    } catch (error) {
      console.error('Error punching in:', error);
      toast({
        title: 'Error',
        description: 'Failed to punch in. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle punch out
  const handlePunchOut = async () => {
    if (!punchOutDialog.record || !completionNotes.trim()) {
      toast({
        title: 'Completion notes required',
        description: 'Please add completion notes for today before punching out.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await apiClient.updateAttendance(punchOutDialog.record.id, {
        punch_out: new Date().toISOString(),
        completion_notes: completionNotes.trim(),
        status: 'completed',
      });

      setAttendance(attendance.map(a =>
        a.id === punchOutDialog.record!.id ? (data as AttendanceRecord) : a
      ));
      setPunchOutDialog({ open: false, record: null });
      setCompletionNotes('');
      toast({
        title: 'Punched Out',
        description: 'Your attendance and completion notes have been recorded.',
      });
    } catch (error) {
      console.error('Error punching out:', error);
      toast({
        title: 'Error',
        description: 'Failed to punch out. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter attendance for selected date
  const filteredAttendance = attendance.filter(a => {
    const matchesDate = isSameDay(parseISO(a.date), selectedDate);
    const matchesProject = selectedProject === 'all' || a.project_id === selectedProject;
    return matchesDate && matchesProject;
  });

  // Get status badge
  const getStatusBadge = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-muted">Pending</Badge>;
      case 'punched_in':
        return <Badge className="bg-warning text-white">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-success text-white">Completed</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Trainer Attendance</h1>
          <p className="text-muted-foreground mt-1">
            {isTrainer ? 'Mark your daily attendance and completion notes' : 'View trainer attendance records'}
          </p>
        </div>
      </div>

      {/* Trainer View - Punch In/Out Cards */}
      {isTrainer && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Today's Batches</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trainerBatches.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No batches assigned to you yet.</p>
                </CardContent>
              </Card>
            ) : (
              trainerBatches.map((batch, i) => {
                const todayRecord = getTodayRecord(batch.batchId);
                const isPunchedIn = todayRecord?.status === 'punched_in';
                const isCompleted = todayRecord?.status === 'completed';

                return (
                  <motion.div
                    key={batch.batchId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className={cn(
                      'border-2',
                      isCompleted && 'border-success/30 bg-success/5',
                      isPunchedIn && 'border-warning/30 bg-warning/5',
                      !todayRecord && 'border-border'
                    )}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{batch.engagementName}</CardTitle>
                            <CardDescription>
                              {batch.projectName} • Batch #{batch.batchNumber}
                            </CardDescription>
                          </div>
                          {todayRecord && getStatusBadge(todayRecord.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {todayRecord && (
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <LogIn className="w-4 h-4" />
                              <span>Punch In: {format(parseISO(todayRecord.punch_in!), 'hh:mm a')}</span>
                            </div>
                            {todayRecord.punch_out && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <LogOut className="w-4 h-4" />
                                <span>Punch Out: {format(parseISO(todayRecord.punch_out), 'hh:mm a')}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {!todayRecord && (
                          <Button
                            className="w-full gradient-primary"
                            onClick={() => handlePunchIn(batch)}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <LogIn className="w-4 h-4 mr-2" />
                            )}
                            Punch In
                          </Button>
                        )}

                        {isPunchedIn && (
                          <Button
                            className="w-full bg-warning hover:bg-warning/90 text-white"
                            onClick={() => setPunchOutDialog({ open: true, record: todayRecord })}
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Punch Out
                          </Button>
                        )}

                        {isCompleted && todayRecord.completion_notes && (
                          <div className="p-3 rounded-lg bg-muted/50 text-sm">
                            <p className="font-medium mb-1 flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              Completion Notes
                            </p>
                            <p className="text-muted-foreground">{todayRecord.completion_notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Admin/PM View - Attendance Table */}
      {canViewAll && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Attendance Records
                </CardTitle>
                <CardDescription>View daily attendance and completion notes</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Calendar className="w-4 h-4" />
                      {format(selectedDate, 'MMM d, yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredAttendance.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No attendance records for {format(selectedDate, 'MMMM d, yyyy')}.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trainer</TableHead>
                    <TableHead>Project / Batch</TableHead>
                    <TableHead>Punch In</TableHead>
                    <TableHead>Punch Out</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Completion Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendance.map(record => {
                    const project = projects.find(p => p.id === record.project_id);
                    const engagement = project?.engagements.find(e => e.id === record.engagement_id);
                    const batch = engagement?.batches.find(b => b.id === record.batch_id);

                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.trainer_name}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{project?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {engagement?.name} - Batch #{batch?.batchNumber}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {record.punch_in ? format(parseISO(record.punch_in), 'hh:mm a') : '-'}
                        </TableCell>
                        <TableCell>
                          {record.punch_out ? format(parseISO(record.punch_out), 'hh:mm a') : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell className="max-w-xs">
                          <p className="truncate text-sm text-muted-foreground">
                            {record.completion_notes || '-'}
                          </p>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Punch Out Dialog */}
      <Dialog open={punchOutDialog.open} onOpenChange={(open) => !open && setPunchOutDialog({ open: false, record: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              Complete Today's Session
            </DialogTitle>
            <DialogDescription>
              Please add your completion notes for today before punching out.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">What did you cover today?</label>
              <Textarea
                placeholder="Enter topics covered, exercises completed, any issues faced..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPunchOutDialog({ open: false, record: null })}>
              Cancel
            </Button>
            <Button className="gradient-primary" onClick={handlePunchOut} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4 mr-2" />
              )}
              Punch Out & Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
