import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AddTrainerModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AddTrainerModal({ open, onClose }: AddTrainerModalProps) {
  const { addTrainer } = useData();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [expertise, setExpertise] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<'junior' | 'mid' | 'senior'>('mid');
  const [employmentType, setEmploymentType] = useState<'full_time' | 'part_time' | 'freelance' | 'intern'>('full_time');
  const [gender, setGender] = useState<'male' | 'female'>('male');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const avatarStyle = gender === 'male' ? 'avataaars' : 'avataaars-neutral';
      await addTrainer({
        name,
        email,
        phone,
        avatar: `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${name.replace(' ', '')}`,
        expertise: expertise.split(',').map(s => s.trim()),
        status: 'available',
        maxBatches: 5,
        currentBatches: 0,
        employmentType,
        experienceLevel,
        gender,
        joinDate: new Date().toISOString().split('T')[0],
      });
      toast({ title: "Trainer added successfully!" });
      onClose();
      setName(''); setEmail(''); setPhone(''); setExpertise(''); setGender('male');
    } catch (error: any) {
      toast({ 
        title: "Failed to add trainer", 
        description: error.message || "Trainer with this email already exists",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="text-xl font-display">Add New Trainer</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2"><Label>Full Name <span className="text-danger">*</span></Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., John Doe" required /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Email <span className="text-danger">*</span></Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" required /></div>
            <div className="space-y-2"><Label>Phone <span className="text-danger">*</span></Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234-567-8900" required /></div>
          </div>
          <div className="space-y-2"><Label>Expertise (comma-separated) <span className="text-danger">*</span></Label><Input value={expertise} onChange={(e) => setExpertise(e.target.value)} placeholder="Java, Spring Boot, React" required /></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Gender <span className="text-danger">*</span></Label>
              <Select value={gender} onValueChange={(v: any) => setGender(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Experience Level <span className="text-danger">*</span></Label>
              <Select value={experienceLevel} onValueChange={(v: any) => setExperienceLevel(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="mid">Mid</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Employment Type <span className="text-danger">*</span></Label>
              <Select value={employmentType} onValueChange={(v: any) => setEmploymentType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full-time</SelectItem>
                  <SelectItem value="part_time">Part-time</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                  <SelectItem value="intern">Intern</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" className="gradient-primary" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? 'Adding...' : 'Add Trainer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
