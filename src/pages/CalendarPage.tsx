import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useData, Batch, Project, Trainer } from '@/contexts/DataContext';
import { format, addDays, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth, parseISO, addMonths, subMonths } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Users, 
  GraduationCap,
  Filter,
  Eye,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewMode = 'projects' | 'trainers';

interface BatchWithContext extends Batch {
  projectId: string;
  projectName: string;
  engagementName: string;
  domain: string;
  trainerName?: string;
  color: string;
}

const projectColors = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(340 75% 55%)',
  'hsl(280 70% 55%)',
  'hsl(200 80% 50%)',
];

export default function CalendarPage() {
  const { projects = [], trainers = [] } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('projects');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedTrainer, setSelectedTrainer] = useState<string>('all');

  // Get all batches with context
  const allBatches = useMemo<BatchWithContext[]>(() => {
    const batches: BatchWithContext[] = [];
    projects.forEach((project, projectIndex) => {
      project.engagements.forEach((engagement) => {
        engagement.batches.forEach((batch) => {
          const trainer = trainers.find(t => t.id === batch.trainerId);
          batches.push({
            ...batch,
            projectId: project.id,
            projectName: project.name,
            engagementName: engagement.name,
            domain: engagement.domain,
            trainerName: trainer?.name,
            color: projectColors[projectIndex % projectColors.length],
          });
        });
      });
    });
    return batches;
  }, [projects, trainers]);

  // Filter batches based on selection
  const filteredBatches = useMemo(() => {
    let batches = allBatches;
    if (selectedProject !== 'all') {
      batches = batches.filter(b => b.projectId === selectedProject);
    }
    if (selectedTrainer !== 'all') {
      batches = batches.filter(b => b.trainerId === selectedTrainer);
    }
    return batches;
  }, [allBatches, selectedProject, selectedTrainer]);

  // Calculate timeline range (show 3 months)
  const timelineStart = startOfMonth(subMonths(currentDate, 1));
  const timelineEnd = endOfMonth(addMonths(currentDate, 1));
  const days = eachDayOfInterval({ start: timelineStart, end: timelineEnd });
  const totalDays = days.length;

  // Group batches by project or trainer
  const groupedData = useMemo(() => {
    if (viewMode === 'projects') {
      const groups: { id: string; name: string; items: BatchWithContext[] }[] = [];
      projects.forEach((project) => {
        const projectBatches = filteredBatches.filter(b => b.projectId === project.id);
        if (projectBatches.length > 0) {
          groups.push({
            id: project.id,
            name: project.name,
            items: projectBatches,
          });
        }
      });
      return groups;
    } else {
      const groups: { id: string; name: string; items: BatchWithContext[] }[] = [];
      trainers.forEach((trainer) => {
        const trainerBatches = filteredBatches.filter(b => b.trainerId === trainer.id);
        if (trainerBatches.length > 0) {
          groups.push({
            id: trainer.id,
            name: trainer.name,
            items: trainerBatches,
          });
        }
      });
      // Add unassigned batches
      const unassignedBatches = filteredBatches.filter(b => !b.trainerId);
      if (unassignedBatches.length > 0) {
        groups.push({
          id: 'unassigned',
          name: 'Unassigned',
          items: unassignedBatches,
        });
      }
      return groups;
    }
  }, [viewMode, projects, trainers, filteredBatches]);

  // Calculate batch position and width
  const getBatchStyle = (batch: BatchWithContext) => {
    const startDate = parseISO(batch.startDate);
    const endDate = parseISO(batch.endDate);
    
    const startOffset = Math.max(0, differenceInDays(startDate, timelineStart));
    const duration = differenceInDays(endDate, startDate) + 1;
    const endOffset = Math.min(totalDays, startOffset + duration);
    const displayDuration = endOffset - startOffset;
    
    const leftPercent = (startOffset / totalDays) * 100;
    const widthPercent = (displayDuration / totalDays) * 100;
    
    return {
      left: `${leftPercent}%`,
      width: `${Math.max(widthPercent, 2)}%`,
    };
  };

  const getStatusColor = (status: Batch['status']) => {
    switch (status) {
      case 'confirmed': return 'bg-success';
      case 'awaiting_confirmation': return 'bg-warning';
      case 'pending': return 'bg-danger';
      default: return 'bg-muted';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generate month headers
  const months = useMemo(() => {
    const monthsData: { month: Date; startDay: number; days: number }[] = [];
    let currentMonth = startOfMonth(timelineStart);
    let dayOffset = 0;
    
    while (currentMonth <= timelineEnd) {
      const monthStart = currentMonth < timelineStart ? timelineStart : currentMonth;
      const monthEnd = endOfMonth(currentMonth) > timelineEnd ? timelineEnd : endOfMonth(currentMonth);
      const daysInView = differenceInDays(monthEnd, monthStart) + 1;
      
      monthsData.push({
        month: currentMonth,
        startDay: dayOffset,
        days: daysInView,
      });
      
      dayOffset += daysInView;
      currentMonth = addMonths(currentMonth, 1);
    }
    return monthsData;
  }, [timelineStart, timelineEnd]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Calendar</h1>
          <p className="text-muted-foreground mt-1">Timeline view of all batches and trainer schedules</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">View by:</span>
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => setViewMode('projects')}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium transition-colors",
                    viewMode === 'projects' 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-background hover:bg-muted"
                  )}
                >
                  <Layers className="w-4 h-4 inline mr-1" />
                  Projects
                </button>
                <button
                  onClick={() => setViewMode('trainers')}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium transition-colors",
                    viewMode === 'trainers' 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-background hover:bg-muted"
                  )}
                >
                  <Users className="w-4 h-4 inline mr-1" />
                  Trainers
                </button>
              </div>
            </div>

            <div className="h-6 w-px bg-border hidden sm:block" />

            {/* Project Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-48">
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

            {/* Trainer Filter */}
            <Select value={selectedTrainer} onValueChange={setSelectedTrainer}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Trainers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trainers</SelectItem>
                {trainers.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Legend */}
            <div className="ml-auto flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span>Confirmed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-warning" />
                <span>Awaiting</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-danger" />
                <span>Pending</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gantt Chart */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            {format(currentDate, 'MMMM yyyy')} - Timeline View
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[1200px]">
              {/* Timeline Header */}
              <div className="flex border-b border-border bg-muted/30">
                {/* Row labels column */}
                <div className="w-64 min-w-[256px] flex-shrink-0 p-3 font-medium text-sm border-r border-border bg-muted/50">
                  {viewMode === 'projects' ? 'Projects' : 'Trainers'}
                </div>
                
                {/* Month headers */}
                <div className="flex-1 min-w-0">
                  <div className="flex w-full">
                    {months.map((m, i) => (
                      <div
                        key={i}
                        className="text-center py-2 text-sm font-semibold border-r border-border last:border-r-0 flex-shrink-0"
                        style={{ width: `${(m.days / totalDays) * 100}%`, minWidth: `${m.days * 20}px` }}
                      >
                        {format(m.month, 'MMMM yyyy')}
                      </div>
                    ))}
                  </div>
                  
                  {/* Day markers */}
                  <div className="flex h-6 border-t border-border/50 w-full">
                    {days.map((day, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-5 min-w-[20px] flex-shrink-0 text-center text-[10px] border-r border-border/30 last:border-r-0 flex items-center justify-center",
                          isToday(day) && "bg-primary/20 font-bold",
                          !isSameMonth(day, currentDate) && "text-muted-foreground/50"
                        )}
                      >
                        {day.getDate() % 5 === 1 || day.getDate() === 1 ? format(day, 'd') : ''}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Gantt Rows */}
              <div className="divide-y divide-border">
                {groupedData.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No batches found for the selected filters.
                  </div>
                ) : (
                  groupedData.map((group) => (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex min-h-[80px]"
                    >
                      {/* Row label */}
                      <div className="w-64 min-w-[256px] flex-shrink-0 p-3 border-r border-border bg-muted/20">
                        <div className="font-medium text-sm truncate">{group.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {group.items.length} batch{group.items.length !== 1 ? 'es' : ''}
                        </div>
                      </div>
                      
                      {/* Timeline area */}
                      <div className="flex-1 min-w-0 relative py-2 px-1" style={{ minWidth: `${totalDays * 20}px` }}>
                        {/* Today indicator */}
                        {days.some(d => isToday(d)) && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-danger z-10"
                            style={{
                              left: `${(differenceInDays(new Date(), timelineStart) / totalDays) * 100}%`
                            }}
                          />
                        )}
                        
                        {/* Batch bars */}
                        {group.items.map((batch, batchIndex) => {
                          const style = getBatchStyle(batch);
                          return (
                            <Tooltip key={batch.id}>
                              <TooltipTrigger asChild>
                                <motion.div
                                  initial={{ scaleX: 0 }}
                                  animate={{ scaleX: 1 }}
                                  transition={{ delay: batchIndex * 0.05 }}
                                  className={cn(
                                    "absolute h-8 rounded-md cursor-pointer transition-all hover:opacity-80 hover:shadow-lg flex items-center px-2 text-white text-xs font-medium overflow-hidden",
                                    getStatusColor(batch.status)
                                  )}
                                  style={{
                                    ...style,
                                    top: `${batchIndex * 36 + 4}px`,
                                    originX: 0,
                                  }}
                                >
                                  <GraduationCap className="w-3 h-3 mr-1 flex-shrink-0" />
                                  <span className="truncate">
                                    {viewMode === 'projects' 
                                      ? `Batch ${batch.batchNumber}` 
                                      : batch.engagementName}
                                  </span>
                                </motion.div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div className="space-y-1">
                                  <p className="font-semibold">{batch.engagementName} - Batch #{batch.batchNumber}</p>
                                  <p className="text-xs">Project: {batch.projectName}</p>
                                  <p className="text-xs">Domain: {batch.domain}</p>
                                  <p className="text-xs">Students: {batch.students}</p>
                                  <p className="text-xs">Trainer: {batch.trainerName || 'Not assigned'}</p>
                                  <p className="text-xs">
                                    {format(parseISO(batch.startDate), 'MMM d')} - {format(parseISO(batch.endDate), 'MMM d, yyyy')}
                                  </p>
                                  <Badge 
                                    variant="outline" 
                                    className={cn("text-[10px]", getStatusColor(batch.status), "text-white border-0")}
                                  >
                                    {batch.status.replace('_', ' ')}
                                  </Badge>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-success/10">
                <GraduationCap className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allBatches.filter(b => b.status === 'confirmed').length}</p>
                <p className="text-sm text-muted-foreground">Confirmed Batches</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-warning/10">
                <CalendarIcon className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allBatches.filter(b => b.status === 'awaiting_confirmation').length}</p>
                <p className="text-sm text-muted-foreground">Awaiting Confirmation</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-danger/10">
                <Users className="w-6 h-6 text-danger" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allBatches.filter(b => b.status === 'pending').length}</p>
                <p className="text-sm text-muted-foreground">Pending Allocation</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
