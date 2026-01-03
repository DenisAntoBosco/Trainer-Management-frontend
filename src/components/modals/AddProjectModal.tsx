import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import DateRangePicker from '@/components/ui/date-range-picker';
import { cn } from '@/lib/utils';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AddProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const projectTypes = [
  'Placement Training',
  'Semester Training',
  'Corporate Training',
  'Skill Development',
  'Internship Training',
  'Weekend Bootcamp',
  'Crash Course',
];

export default function AddProjectModal({ open, onOpenChange }: AddProjectModalProps) {
  const { addProject } = useData();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    description: '',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    selectedTypes: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleTypeToggle = (type: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTypes: prev.selectedTypes.includes(type)
        ? prev.selectedTypes.filter(t => t !== type)
        : [...prev.selectedTypes, type]
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Project name is required';
    if (!formData.clientName.trim()) newErrors.clientName = 'Client name is required';
    if (!formData.contactName.trim()) newErrors.contactName = 'Contact name is required';
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Invalid email format';
    }
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (formData.selectedTypes.length === 0) newErrors.types = 'Select at least one project type';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await addProject({
        name: formData.name,
        clientName: formData.clientName,
        primaryContact: {
          name: formData.contactName,
          email: formData.contactEmail,
          phone: formData.contactPhone,
        },
        projectType: formData.selectedTypes,
        startDate: formData.startDate!.toISOString().split('T')[0],
        endDate: formData.endDate!.toISOString().split('T')[0],
        description: formData.description,
        status: formData.startDate! <= new Date() ? 'active' : 'upcoming',
        createdBy: user?.name || 'Admin User',
      });

      toast.success('Project created successfully!');
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to create project:', error);
      toast.error(error.message || 'Failed to create project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      clientName: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      description: '',
      startDate: undefined,
      endDate: undefined,
      selectedTypes: [],
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">Create New Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Project Name <span className="text-danger">*</span></Label>
            <Input
              id="name"
              placeholder="e.g., X College Training Program 2025"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={errors.name ? 'border-danger' : ''}
            />
            {errors.name && <p className="text-xs text-danger">{errors.name}</p>}
          </div>

          {/* Client Name */}
          <div className="space-y-2">
            <Label htmlFor="clientName">Client/College Name <span className="text-danger">*</span></Label>
            <Input
              id="clientName"
              placeholder="e.g., X College of Engineering"
              value={formData.clientName}
              onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
              className={errors.clientName ? 'border-danger' : ''}
            />
            {errors.clientName && <p className="text-xs text-danger">{errors.clientName}</p>}
          </div>

          {/* Primary Contact */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Primary Contact</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Name <span className="text-danger">*</span></Label>
                <Input
                  id="contactName"
                  placeholder="Contact name"
                  value={formData.contactName}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                  className={errors.contactName ? 'border-danger' : ''}
                />
                {errors.contactName && <p className="text-xs text-danger">{errors.contactName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email <span className="text-danger">*</span></Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  className={errors.contactEmail ? 'border-danger' : ''}
                />
                {errors.contactEmail && <p className="text-xs text-danger">{errors.contactEmail}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Phone</Label>
                <Input
                  id="contactPhone"
                  placeholder="+1 234-567-8900"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Project Types */}
          <div className="space-y-2">
            <Label>Project Type <span className="text-danger">*</span></Label>
            <p className="text-xs text-muted-foreground">Select one or more types</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {projectTypes.map((type) => (
                <Badge
                  key={type}
                  variant={formData.selectedTypes.includes(type) ? 'default' : 'outline'}
                  className={cn(
                    "cursor-pointer transition-all",
                    formData.selectedTypes.includes(type)
                      ? 'bg-primary hover:bg-primary/90'
                      : 'hover:bg-muted'
                  )}
                  onClick={() => handleTypeToggle(type)}
                >
                  {type}
                  {formData.selectedTypes.includes(type) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
            {errors.types && <p className="text-xs text-danger">{errors.types}</p>}
          </div>

          {/* Dates */}
          <div className="space-y-2">
            <Label>Project Duration <span className="text-danger">*</span></Label>
            <DateRangePicker
              startDate={formData.startDate}
              endDate={formData.endDate}
              onDateChange={(start, end) => {
                setFormData(prev => ({ ...prev, startDate: start, endDate: end }));
              }}
              placeholder="Select project dates"
              className="w-full"
            />
            {errors.startDate && <p className="text-xs text-danger">{errors.startDate}</p>}
            {errors.endDate && <p className="text-xs text-danger">{errors.endDate}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the project..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="gradient-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Project'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
