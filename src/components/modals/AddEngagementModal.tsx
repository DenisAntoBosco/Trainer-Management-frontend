import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import DateRangePicker from '@/components/ui/date-range-picker';
import { toast } from '@/hooks/use-toast';

interface AddEngagementModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
}

const domains = [
  'Java', 'Python', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby',
  'Data Science', 'Machine Learning', 'Deep Learning', 'AI', 'NLP', 'Computer Vision',
  'Web Development', 'Mobile Development', 'React', 'Angular', 'Vue.js', 'Node.js', 'Django', 'Flask', 'Spring Boot',
  'DevOps', 'Cloud Computing', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
  'Database', 'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
  'Cybersecurity', 'Blockchain', 'IoT', 'AR/VR',
  'Soft Skills', 'Communication', 'Leadership', 'Team Building', 'Time Management',
  'Aptitude', 'Logical Reasoning', 'Quantitative Aptitude', 'Verbal Ability',
  'UI/UX Design', 'Graphic Design', 'Product Management', 'Agile', 'Scrum'
];
const trainingTypes = ['Placement Training', 'Semester Training', 'Corporate Training', 'Skill Development', 'Internship Training'];

export default function AddEngagementModal({ open, onClose, projectId }: AddEngagementModalProps) {
  const { addEngagement } = useData();
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [domainOpen, setDomainOpen] = useState(false);
  const [trainingType, setTrainingType] = useState('');
  const [totalStudents, setTotalStudents] = useState(60);
  const [studentsPerBatch, setStudentsPerBatch] = useState(60);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const calculateBatchDistribution = () => {
    if (!totalStudents || !studentsPerBatch) return { count: 0, distribution: [] };
    
    const total = totalStudents;
    const perBatch = studentsPerBatch;
    
    // Calculate base batches and remainder
    const baseBatches = Math.floor(total / perBatch);
    const remainder = total % perBatch;
    
    // If remainder is less than 50% of batch size, distribute among existing batches
    const threshold = perBatch * 0.5;
    let distribution: number[] = [];
    
    if (remainder > 0 && remainder < threshold && baseBatches > 0) {
      // Distribute remainder among existing batches
      const extraPerBatch = Math.floor(remainder / baseBatches);
      const extraRemainder = remainder % baseBatches;
      
      for (let i = 0; i < baseBatches; i++) {
        distribution.push(perBatch + extraPerBatch + (i < extraRemainder ? 1 : 0));
      }
    } else {
      // Create separate batch for remainder
      for (let i = 0; i < baseBatches; i++) {
        distribution.push(perBatch);
      }
      if (remainder > 0) {
        distribution.push(remainder);
      }
    }
    
    return { count: distribution.length, distribution };
  };

  const { count: batchCount, distribution: batchDistribution } = calculateBatchDistribution();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await addEngagement(projectId, {
        projectId,
        name,
        domain,
        trainingType,
        totalStudents,
        studentsPerBatch,
        startDate: startDate!.toISOString().split('T')[0],
        endDate: endDate!.toISOString().split('T')[0],
        status: 'upcoming',
      });

      toast({
        title: "Engagement created!",
        description: `${batchCount} batches created. Proceed to allocate trainers.`,
      });

      onClose();
      setName('');
      setDomain('');
      setTrainingType('');
      setTotalStudents(60);
      setStudentsPerBatch(60);
      setStartDate(undefined);
      setEndDate(undefined);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create engagement. Please try again.",
        variant: "destructive",
      });
      console.error('Error creating engagement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Add New Engagement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Engagement Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Java Full Stack Training" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Domain</Label>
              <Popover open={domainOpen} onOpenChange={setDomainOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={domainOpen}
                    className="w-full justify-between"
                  >
                    {domain || "Select domain..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search domains..." />
                    <CommandEmpty>No domain found.</CommandEmpty>
                    <CommandGroup className="max-h-[300px] overflow-auto">
                      {domains.map((d) => (
                        <CommandItem
                          key={d}
                          value={d}
                          onSelect={() => {
                            setDomain(d);
                            setDomainOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              domain === d ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {d}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Training Type</Label>
              <Select value={trainingType} onValueChange={setTrainingType} required>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {trainingTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Total Students</Label>
              <Input type="number" value={totalStudents || ''} onChange={(e) => setTotalStudents(e.target.value ? Number(e.target.value) : 0)} min={1} required />
            </div>
            <div>
              <Label>Students per Batch</Label>
              <Input type="number" value={studentsPerBatch || ''} onChange={(e) => setStudentsPerBatch(e.target.value ? Number(e.target.value) : 0)} min={1} required />
            </div>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 text-sm space-y-1">
            <div><strong>Auto-calculated:</strong> {batchCount} batch{batchCount !== 1 ? 'es' : ''} required</div>
            {batchCount > 0 && (
              <div className="text-xs text-muted-foreground">
                {batchDistribution.map((size, i) => `Batch ${i + 1}: ${size}`).join(', ')}
              </div>
            )}
          </div>
          <div>
            <Label>Training Duration</Label>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onDateChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
              placeholder="Select training dates"
              className="w-full"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
            <Button type="submit" className="gradient-primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Engagement'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
