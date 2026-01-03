import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useData } from '@/contexts/DataContext';
import { apiClient } from '@/lib/api-client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface BulkTrainerUploadModalProps {
  open: boolean;
  onClose: () => void;
}

interface ParsedTrainer {
  name: string;
  email: string;
  phone: string;
  expertise: string[];
  experienceLevel: 'junior' | 'mid' | 'senior';
  employmentType: 'full_time' | 'part_time' | 'freelance' | 'intern';
  gender: 'male' | 'female';
  valid: boolean;
  errors: string[];
}

export default function BulkTrainerUploadModal({ open, onClose }: BulkTrainerUploadModalProps) {
  const { refreshData } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedTrainers, setParsedTrainers] = useState<ParsedTrainer[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<'upload' | 'preview' | 'complete'>('upload');

  const downloadTemplate = () => {
    const template = [
      ['Name', 'Email', 'Phone', 'Expertise (comma-separated)', 'Experience Level', 'Employment Type', 'Gender'],
      ['John Doe', 'john@example.com', '+1 234-567-8901', 'Java, Spring Boot, React', 'senior', 'full_time', 'male'],
      ['Jane Smith', 'jane@example.com', '+1 234-567-8902', 'Python, Machine Learning', 'mid', 'part_time', 'female'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trainers');
    XLSX.writeFile(wb, 'trainer_upload_template.xlsx');
  };

  const validateTrainer = (row: any[]): ParsedTrainer => {
    const errors: string[] = [];
    const [name, email, phone, expertise, experienceLevel, employmentType, gender] = row;

    if (!name || typeof name !== 'string') errors.push('Name is required');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Valid email is required');
    if (!phone) errors.push('Phone is required');
    if (!expertise) errors.push('Expertise is required');

    const validExperience = ['junior', 'mid', 'senior'];
    const validEmployment = ['full_time', 'part_time', 'freelance', 'intern'];
    const validGender = ['male', 'female'];

    if (!validExperience.includes(experienceLevel?.toLowerCase())) {
      errors.push('Experience level must be: junior, mid, or senior');
    }
    if (!validEmployment.includes(employmentType?.toLowerCase()?.replace(/[\s-]/g, '_'))) {
      errors.push('Employment type must be: full_time, part_time, freelance, or intern');
    }
    if (!validGender.includes(gender?.toLowerCase())) {
      errors.push('Gender must be: male or female');
    }

    return {
      name: String(name || ''),
      email: String(email || ''),
      phone: String(phone || ''),
      expertise: String(expertise || '').split(',').map((s: string) => s.trim()).filter(Boolean),
      experienceLevel: (experienceLevel?.toLowerCase() || 'mid') as 'junior' | 'mid' | 'senior',
      employmentType: (employmentType?.toLowerCase()?.replace(/[\s-]/g, '_') || 'full_time') as 'full_time' | 'part_time' | 'freelance' | 'intern',
      gender: (gender?.toLowerCase() || 'male') as 'male' | 'female',
      valid: errors.length === 0,
      errors,
    };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      // Skip header row
      const trainers = jsonData.slice(1).filter(row => row.some(cell => cell)).map(validateTrainer);
      setParsedTrainers(trainers);
      setStep('preview');
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  const handleUpload = async () => {
    setUploading(true);
    setProgress(0);
    const validTrainers = parsedTrainers.filter((t) => t.valid);
    
    try {
      const trainersData = validTrainers.map(trainer => {
        const avatarStyle = trainer.gender === 'male' ? 'avataaars' : 'avataaars-neutral';
        return {
          name: trainer.name,
          email: trainer.email,
          phone: trainer.phone,
          avatar: `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${trainer.name.replace(' ', '')}`,
          expertise: trainer.expertise,
          status: 'available',
          max_batches: 5,
          current_batches: 0,
          employment_type: trainer.employmentType,
          experience_level: trainer.experienceLevel,
          gender: trainer.gender,
          join_date: new Date().toISOString().split('T')[0],
        };
      });

      // Use SSE for real-time progress
      const response = await fetch('http://localhost:8000/v1/trainers/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(trainersData),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          const data = JSON.parse(line.replace('data: ', ''));
          const progressPercent = (data.progress / data.total) * 100;
          setProgress(progressPercent);

          if (data.status === 'complete') {
            await refreshData();
            setUploading(false);
            setStep('complete');
            toast({
              title: 'Trainers uploaded successfully!',
              description: `${data.count} trainers have been added to the system.`,
            });
          }
        }
      }
    } catch (error: any) {
      setUploading(false);
      toast({
        title: 'Upload failed',
        description: error.message || 'Some trainers could not be uploaded.',
        variant: 'destructive',
      });
      console.error('Bulk upload error:', error);
    }
  };

  const resetModal = () => {
    setFile(null);
    setParsedTrainers([]);
    setProgress(0);
    setStep('upload');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const validCount = parsedTrainers.filter((t) => t.valid).length;
  const invalidCount = parsedTrainers.filter((t) => !t.valid).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Bulk Upload Trainers
          </DialogTitle>
          <DialogDescription>
            Upload an Excel file to add multiple trainers at once
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6">
            {/* Template Download */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
              <div>
                <p className="font-medium">Download Template</p>
                <p className="text-sm text-muted-foreground">
                  Use our template for proper formatting
                </p>
              </div>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>

            {/* File Upload Area */}
            <div
              className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Drop your file here</p>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse (XLSX, XLS, CSV)
              </p>
              <Button variant="secondary">Select File</Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="gap-1">
                <FileSpreadsheet className="w-3 h-3" />
                {file?.name}
              </Badge>
              <Badge className="bg-success/10 text-success gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {validCount} valid
              </Badge>
              {invalidCount > 0 && (
                <Badge className="bg-danger/10 text-danger gap-1">
                  <XCircle className="w-3 h-3" />
                  {invalidCount} invalid
                </Badge>
              )}
            </div>

            {/* Preview Table */}
            <ScrollArea className="h-[300px] border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Expertise</th>
                    <th className="p-3 text-left">Level</th>
                    <th className="p-3 text-left">Gender</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {parsedTrainers.map((trainer, i) => (
                    <tr
                      key={i}
                      className={cn(
                        'hover:bg-muted/50',
                        !trainer.valid && 'bg-danger/5'
                      )}
                    >
                      <td className="p-3">
                        {trainer.valid ? (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        ) : (
                          <div className="flex items-center gap-1">
                            <XCircle className="w-4 h-4 text-danger" />
                            <span className="text-xs text-danger">
                              {trainer.errors[0]}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-medium">{trainer.name || '-'}</td>
                      <td className="p-3">{trainer.email || '-'}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {trainer.expertise.slice(0, 2).map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {trainer.expertise.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{trainer.expertise.length - 2}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3 capitalize">{trainer.experienceLevel}</td>
                      <td className="p-3 capitalize">{trainer.gender}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>

            {/* Warning */}
            {invalidCount > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                <p className="text-sm">
                  {invalidCount} trainer(s) have errors and will be skipped during upload.
                </p>
              </div>
            )}

            {/* Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading trainers...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {Math.round((progress / 100) * validCount)} of {validCount} trainers created
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetModal} disabled={uploading}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                className="gradient-primary"
                onClick={handleUpload}
                disabled={uploading || validCount === 0}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload {validCount} Trainer{validCount !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Upload Complete!</h3>
            <p className="text-muted-foreground mb-6">
              {validCount} trainers have been successfully added to the system.
            </p>
            <Button onClick={handleClose}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
