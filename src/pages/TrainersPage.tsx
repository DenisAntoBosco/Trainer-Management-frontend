import { useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import {
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  MoreVertical,
  Star,
  Calendar,
  Trash2,
  Eye,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import AddTrainerModal from '@/components/modals/AddTrainerModal';
import BulkTrainerUploadModal from '@/components/modals/BulkTrainerUploadModal';
import EditTrainerModal from '@/components/modals/EditTrainerModal';
import DeleteConfirmationDialog from '@/components/modals/DeleteConfirmationDialog';
import TrainerProfileModal from '@/components/modals/TrainerProfileModal';
import { toast } from '@/hooks/use-toast';

export default function TrainersPage() {
  const { trainers = [], deleteTrainer } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [showAddTrainer, setShowAddTrainer] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; trainerId: string; trainerName: string } | null>(null);
  const [editTrainer, setEditTrainer] = useState<any>(null);
  const [viewTrainerId, setViewTrainerId] = useState<string | null>(null);

  // Get unique domains
  const allDomains = [...new Set(trainers.flatMap(t => t.expertise))].sort();

  const filteredTrainers = trainers.filter(trainer => {
    const matchesSearch = trainer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainer.expertise.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || trainer.status === statusFilter;
    const matchesDomain = domainFilter === 'all' || 
      trainer.expertise.some(e => e.toLowerCase().includes(domainFilter.toLowerCase()));
    return matchesSearch && matchesStatus && matchesDomain;
  });

  const statusColors = {
    available: 'bg-success/10 text-success border-success/20',
    partially_allocated: 'bg-warning/10 text-warning border-warning/20',
    fully_allocated: 'bg-primary/10 text-primary border-primary/20',
    on_leave: 'bg-muted text-muted-foreground',
  };

  const statusLabels = {
    available: 'Available',
    partially_allocated: 'Partially Allocated',
    fully_allocated: 'Fully Allocated',
    on_leave: 'On Leave',
  };

  const experienceColors = {
    junior: 'bg-blue-100 text-blue-700',
    mid: 'bg-purple-100 text-purple-700',
    senior: 'bg-amber-100 text-amber-700',
  };

  const handleDeleteTrainer = async () => {
    if (!deleteDialog) return;
    try {
      await deleteTrainer(deleteDialog.trainerId);
      toast({
        title: "Trainer Deleted",
        description: `${deleteDialog.trainerName} has been removed from the system.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete trainer. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Trainers</h1>
          <p className="text-muted-foreground mt-1">
            Manage your trainer pool and assignments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBulkUpload(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
          <Button onClick={() => setShowAddTrainer(true)} className="gradient-primary hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Add Trainer
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(statusLabels).map(([status, label]) => {
          const count = trainers.filter(t => t.status === status).length;
          return (
            <Card key={status}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-muted-foreground">{label}</p>
                  </div>
                  <div className={cn("w-3 h-3 rounded-full", statusColors[status as keyof typeof statusColors])} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="partially_allocated">Partially Allocated</SelectItem>
            <SelectItem value="fully_allocated">Fully Allocated</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
          </SelectContent>
        </Select>
        <Select value={domainFilter} onValueChange={setDomainFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Domain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Domains</SelectItem>
            {allDomains.map(domain => (
              <SelectItem key={domain} value={domain.toLowerCase()}>{domain}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Trainers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTrainers.map((trainer, i) => (
          <motion.div
            key={trainer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="group hover:shadow-card-hover hover:border-primary/50 transition-all">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-14 h-14 border-2 border-muted">
                      <AvatarImage src={trainer.avatar} />
                      <AvatarFallback className="text-lg">{trainer.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {trainer.name}
                      </h3>
                      <Badge className={cn("text-xs", statusColors[trainer.status])}>
                        {statusLabels[trainer.status]}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewTrainerId(trainer.id)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditTrainer(trainer)}>Edit Profile</DropdownMenuItem>
                      <DropdownMenuItem>View Schedule</DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-danger focus:text-danger"
                        onClick={() => setDeleteDialog({ open: true, trainerId: trainer.id, trainerName: trainer.name })}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Trainer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{trainer.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{trainer.phone}</span>
                  </div>
                </div>

                {/* Expertise */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">Expertise</p>
                  <div className="flex flex-wrap gap-1">
                    {trainer.expertise.slice(0, 4).map(skill => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {trainer.expertise.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{trainer.expertise.length - 4}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Experience & Employment */}
                <div className="flex items-center gap-2 mb-4">
                  <Badge className={cn("text-xs", experienceColors[trainer.experienceLevel])}>
                    <Star className="w-3 h-3 mr-1" />
                    {trainer.experienceLevel.charAt(0).toUpperCase() + trainer.experienceLevel.slice(1)}
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    {trainer.employmentType.replace('_', ' ')}
                  </Badge>
                </div>

                {/* Workload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Current Load</span>
                    <span className="font-medium">{trainer.currentBatches}/{trainer.maxBatches} batches</span>
                  </div>
                  <Progress 
                    value={(trainer.currentBatches / trainer.maxBatches) * 100} 
                    className="h-2"
                  />
                </div>

                {/* Join Date */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4 pt-4 border-t">
                  <Calendar className="w-3 h-3" />
                  <span>Joined {new Date(trainer.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </div>

                {/* Action */}
                <Button variant="outline" className="w-full mt-4" onClick={() => setViewTrainerId(trainer.id)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Full Profile
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTrainers.length === 0 && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No trainers found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      <AddTrainerModal open={showAddTrainer} onClose={() => setShowAddTrainer(false)} />
      <BulkTrainerUploadModal open={showBulkUpload} onClose={() => setShowBulkUpload(false)} />
      <EditTrainerModal open={!!editTrainer} onClose={() => setEditTrainer(null)} trainer={editTrainer} />
      <TrainerProfileModal open={!!viewTrainerId} onClose={() => setViewTrainerId(null)} trainerId={viewTrainerId || ''} />
      
      {/* Delete Confirmation Dialog */}
      {deleteDialog && (
        <DeleteConfirmationDialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog(null)}
          onConfirm={handleDeleteTrainer}
          title="Delete Trainer"
          itemName={deleteDialog.trainerName}
          itemType="trainer"
          description="This will permanently delete the trainer from the system. This action cannot be undone."
        />
      )}
    </div>
  );
}
