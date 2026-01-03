import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface User {
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'hr' | 'trainer' | 'project_manager';
  status: 'active' | 'inactive';
}

interface BulkUserUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (users: User[]) => void;
}

export default function BulkUserUploadModal({
  open,
  onOpenChange,
  onUpload,
}: BulkUserUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedUsers, setParsedUsers] = useState<User[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateRole = (role: string): User['role'] | null => {
    const normalizedRole = role?.toLowerCase().trim();
    const roleMap: Record<string, User['role']> = {
      admin: 'admin',
      hr: 'hr',
      'hr manager': 'hr',
      trainer: 'trainer',
      pm: 'project_manager',
      'project manager': 'project_manager',
      project_manager: 'project_manager',
    };
    return roleMap[normalizedRole] || null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];

    if (!validTypes.includes(selectedFile.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an Excel (.xlsx, .xls) or CSV file.',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const users: User[] = [];
        const parseErrors: string[] = [];

        jsonData.forEach((row: any, index) => {
          const rowNum = index + 2;
          const name = row['Name'] || row['name'] || row['Full Name'] || row['full_name'];
          const email = row['Email'] || row['email'] || row['Email Address'] || row['email_address'];
          const phone = row['Phone'] || row['phone'] || row['Phone Number'] || row['phone_number'] || '';
          const roleRaw = row['Role'] || row['role'] || '';
          const role = validateRole(roleRaw);

          if (!name) {
            parseErrors.push(`Row ${rowNum}: Missing name`);
            return;
          }
          if (!email) {
            parseErrors.push(`Row ${rowNum}: Missing email`);
            return;
          }
          if (!role) {
            parseErrors.push(`Row ${rowNum}: Invalid role "${roleRaw}". Use: admin, hr, trainer, or project_manager`);
            return;
          }

          users.push({
            name: String(name).trim(),
            email: String(email).trim(),
            phone: String(phone).trim(),
            role,
            status: 'active',
          });
        });

        setParsedUsers(users);
        setErrors(parseErrors);
      } catch {
        toast({
          title: 'Error parsing file',
          description: 'Could not read the file. Please check the format.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = () => {
    if (parsedUsers.length === 0) {
      toast({
        title: 'No valid users',
        description: 'Please fix the errors and try again.',
        variant: 'destructive',
      });
      return;
    }

    onUpload(parsedUsers);
    handleClose();
  };

  const handleClose = () => {
    setFile(null);
    setParsedUsers([]);
    setErrors([]);
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const template = [
      { Name: 'John Doe', Email: 'john@example.com', Phone: '+1234567890', Role: 'trainer' },
      { Name: 'Jane Smith', Email: 'jane@example.com', Phone: '+1234567891', Role: 'hr' },
      { Name: 'Bob Admin', Email: 'bob@example.com', Phone: '+1234567892', Role: 'admin' },
      { Name: 'Alice PM', Email: 'alice@example.com', Phone: '+1234567893', Role: 'project_manager' },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, 'user_upload_template.xlsx');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Bulk User Upload
          </DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file to add multiple users at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download template button */}
          <Button variant="outline" onClick={downloadTemplate} className="w-full gap-2">
            <Download className="w-4 h-4" />
            Download Template
          </Button>

          {/* File upload area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            {file ? (
              <p className="font-medium">{file.name}</p>
            ) : (
              <>
                <p className="font-medium">Click to upload or drag and drop</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Excel (.xlsx, .xls) or CSV files
                </p>
              </>
            )}
          </div>

          {/* Results */}
          {file && (
            <div className="space-y-3">
              {parsedUsers.length > 0 && (
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{parsedUsers.length} users ready to import</span>
                </div>
              )}

              {errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-danger">
                    <AlertCircle className="w-5 h-5" />
                    <span>{errors.length} errors found</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto text-sm bg-danger/5 rounded-lg p-3 space-y-1">
                    {errors.map((error, i) => (
                      <p key={i} className="text-danger">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={parsedUsers.length === 0}
            className="gradient-primary"
          >
            Import {parsedUsers.length} Users
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
