import { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Trainer } from '@/types';

interface EditTrainerModalProps {
  open: boolean;
  onClose: () => void;
  trainer: Trainer | null;
}

export default function EditTrainerModal({ open, onClose, trainer }: EditTrainerModalProps) {
  const { updateTrainer } = useData();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [expertise, setExpertise] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<'junior' | 'mid' | 'senior'>('mid');
  const [employmentType, setEmploymentType] = useState<'full-time' | 'part-time' | 'freelance' | 'intern'>('full-time');
  const [gender, setGender] = useState<'male' | 'female'>('male');

  useEffect(() => {
    if (trainer) {
      setName(trainer.name);
      setEmail(trainer.email);
      setPhone(trainer.phone);
      setExpertise(trainer.expertise.join(', '));
      setExperienceLevel(trainer.experienceLevel);
      setEmploymentType(trainer.employmentType);
      setGender(trainer.gender || 'male');
    }
  }, [trainer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainer) return;

    try {
      await updateTrainer(trainer.id, {
        name,
        email,
        phone,
        expertise: expertise.split(',').map(s => s.trim()),
        employmentType,
        experienceLevel,
        gender,
      });
      toast({ title: "Trainer updated successfully!" });
      onClose();
    } catch (error: any) {
      toast({ 
        title: "Failed to update trainer", 
        description: error.message || "An error occurred",
        variant: "destructive" 
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="text-xl font-display">Edit Trainer</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2"><Label>Full Name <span className="text-danger">*</span></Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Email <span className="text-danger">*</span></Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div className="space-y-2"><Label>Phone <span className="text-danger">*</span></Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} required /></div>
          </div>
          <div className="space-y-2"><Label>Expertise (comma-separated) <span className="text-danger">*</span></Label><Input value={expertise} onChange={(e) => setExpertise(e.target.value)} required /></div>
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
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                  <SelectItem value="intern">Intern</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="gradient-primary">Update Trainer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
