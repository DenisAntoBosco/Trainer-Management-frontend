import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { toast } from '@/hooks/use-toast';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  FolderKanban,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import AddProjectModal from '@/components/modals/AddProjectModal';
import DeleteConfirmationDialog from '@/components/modals/DeleteConfirmationDialog';

export default function ProjectsPage() {
  const { projects = [], users = [], deleteProject } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; projectId: string; projectName: string } | null>(null);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.client_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getProjectStats = (project: typeof projects[0]) => {
    const totalBatches = (project.engagements || []).reduce((acc, e) => acc + (e.batches || []).length, 0);
    const confirmedBatches = (project.engagements || []).reduce(
      (acc, e) => acc + (e.batches || []).filter(b => b.status === 'confirmed').length, 0
    );
    const pendingBatches = (project.engagements || []).reduce(
      (acc, e) => acc + (e.batches || []).filter(b => b.status === 'pending').length, 0
    );
    const awaitingBatches = totalBatches - confirmedBatches - pendingBatches;
    return { totalBatches, confirmedBatches, pendingBatches, awaitingBatches };
  };

  const statusColors = {
    active: 'bg-success/10 text-success border-success/20',
    upcoming: 'bg-primary/10 text-primary border-primary/20',
    completed: 'bg-muted text-muted-foreground',
  };

  const handleDeleteProject = async () => {
    if (!deleteDialog) return;
    try {
      await deleteProject(deleteDialog.projectId);
      toast({
        title: "Project Deleted",
        description: `${deleteDialog.projectName} has been permanently deleted.`,
      });
      setDeleteDialog(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage all your training projects and engagements
          </p>
        </div>
        <Button onClick={() => setIsAddProjectOpen(true)} className="gradient-primary hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by project name or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProjects.map((project, i) => {
          const stats = getProjectStats(project);
          const progress = stats.totalBatches > 0 
            ? (stats.confirmedBatches / stats.totalBatches) * 100 
            : 0;

          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="group hover:shadow-card-hover hover:border-primary/50 transition-all h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={cn("text-xs", statusColors[project.status])}>
                          {project.status}
                        </Badge>
                      </div>
                      <h3 className="font-display font-semibold text-lg group-hover:text-primary transition-colors line-clamp-2">
                        {project.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{project.client_name}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/projects/${project.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>Add Engagement</DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-danger focus:text-danger"
                          onClick={() => setDeleteDialog({ open: true, projectId: project.id, projectName: project.name })}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold">{(project.engagements || []).length}</p>
                      <p className="text-xs text-muted-foreground">Engagements</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold">{stats.totalBatches}</p>
                      <p className="text-xs text-muted-foreground">Batches</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold">{stats.confirmedBatches}</p>
                      <p className="text-xs text-muted-foreground">Confirmed</p>
                    </div>
                  </div>

                  {/* Allocation Status */}
                  <div className="flex items-center gap-2 text-xs mb-4">
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-success/10 text-success">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{stats.confirmedBatches}</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-warning/10 text-warning">
                      <Clock className="w-3 h-3" />
                      <span>{stats.awaitingBatches}</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-danger/10 text-danger">
                      <XCircle className="w-3 h-3" />
                      <span>{stats.pendingBatches}</span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Allocation Progress</span>
                      <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto pt-4 border-t">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(project.start_date).toLocaleDateString()}</span>
                    </div>
                    <span>→</span>
                    <span>{new Date(project.end_date).toLocaleDateString()}</span>
                  </div>

                  {/* Project Managers */}
                  {project.project_manager_ids && project.project_manager_ids.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Project Manager{project.project_manager_ids.length > 1 ? 's' : ''}</p>
                      <div className="flex flex-wrap gap-2">
                        {project.project_manager_ids.map(pmId => {
                          const pm = users.find(u => u.id === pmId);
                          if (!pm) return null;
                          return (
                            <div key={pmId} className="flex items-center gap-2 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">
                              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-semibold">
                                {pm.name.charAt(0)}
                              </div>
                              <span className="font-medium">{pm.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button 
                    variant="outline" 
                    className="mt-4 w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" 
                    asChild
                  >
                    <Link to={`/projects/${project.id}`}>
                      View Details
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <FolderKanban className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No projects found</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || statusFilter !== 'all' 
              ? "Try adjusting your search or filters"
              : "Create your first project to get started"}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Button onClick={() => setIsAddProjectOpen(true)} className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          )}
        </div>
      )}

      {/* Add Project Modal */}
      <AddProjectModal open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen} />

      {/* Delete Confirmation Dialog */}
      {deleteDialog && (
        <DeleteConfirmationDialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog(null)}
          onConfirm={handleDeleteProject}
          title="Delete Project"
          itemName={deleteDialog.projectName}
          itemType="project"
          description="This will permanently delete the project and all its engagements and batches. This action cannot be undone."
        />
      )}
    </div>
  );
}
