import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Phone, Calendar, Briefcase, Award, Clock } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Trainer } from '@/types/api';

interface TrainerProfileModalProps {
  open: boolean;
  onClose: () => void;
  trainerId: string;
}

export default function TrainerProfileModal({ open, onClose, trainerId }: TrainerProfileModalProps) {
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && trainerId) {
      loadTrainerData();
    }
  }, [open, trainerId]);

  const loadTrainerData = async () => {
    setLoading(true);
    try {
      const [trainerData, allocationsData] = await Promise.all([
        apiClient.getTrainer(trainerId),
        apiClient.getTrainerAllocations(trainerId)
      ]);
      setTrainer(trainerData);
      setAllocations(allocationsData);
    } catch (error) {
      console.error('Failed to load trainer data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!trainer) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Trainer Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={trainer.avatar} />
              <AvatarFallback className="text-2xl">{trainer.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-2xl font-bold">{trainer.name}</h3>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={trainer.status === 'available' ? 'default' : 'secondary'}>
                  {trainer.status}
                </Badge>
                <Badge variant="outline">{trainer.employment_type}</Badge>
                <Badge variant="outline">{trainer.experience_level}</Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{trainer.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{trainer.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>Joined: {new Date(trainer.join_date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
              <span>{trainer.current_batches}/{trainer.max_batches} batches</span>
            </div>
          </div>

          <Separator />

          {/* Expertise */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4" />
              <h4 className="font-semibold">Expertise</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {trainer.expertise?.map((exp, i) => (
                <Badge key={i} variant="secondary">{exp}</Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Current Allocations */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4" />
              <h4 className="font-semibold">Current Allocations</h4>
            </div>
            {allocations.length > 0 ? (
              <div className="space-y-2">
                {allocations.map((allocation) => (
                  <div key={allocation.batch_id} className="p-3 rounded-lg border bg-muted/50">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{allocation.batch_name}</p>
                        <p className="text-sm text-muted-foreground">{allocation.project_name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {allocation.domain} • {new Date(allocation.start_date).toLocaleDateString()} - {new Date(allocation.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">{allocation.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No current allocations</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
