import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { UserPlus, Mail, Key, Copy, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

interface User {
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'hr' | 'trainer' | 'project_manager';
  status: 'active' | 'inactive';
  avatar?: string;
  temporaryPassword?: string;
  sendEmail?: boolean;
}

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (user: User) => void;
}

// Generate a secure temporary password
const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export default function AddUserModal({
  open,
  onOpenChange,
  onAdd,
}: AddUserModalProps) {
  const [formData, setFormData] = useState<User>({
    name: '',
    email: '',
    phone: '',
    role: 'trainer',
    status: 'active',
    temporaryPassword: generatePassword(),
    sendEmail: true,
  });
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'trainer',
      status: 'active',
      temporaryPassword: generatePassword(),
      sendEmail: true,
    });
    onOpenChange(false);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(formData.temporaryPassword || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegeneratePassword = () => {
    setFormData({ ...formData, temporaryPassword: generatePassword() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Add New User
          </DialogTitle>
          <DialogDescription>
            Create a new user account. A temporary password will be generated and sent via email.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Enter full name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="+1 234 567 8900"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: User['role']) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="hr">HR Manager</SelectItem>
                  <SelectItem value="trainer">Trainer</SelectItem>
                  <SelectItem value="project_manager">Project Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: User['status']) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Temporary Password Section */}
          <div className="space-y-3 pt-2 border-t">
            <Label className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              Temporary Password
            </Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={formData.temporaryPassword}
                readOnly
                className="font-mono text-sm flex-1"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyPassword}
                  title="Copy password"
                  className="shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRegeneratePassword}
                  title="Generate new password"
                  className="shrink-0"
                >
                  Regenerate
                </Button>
              </div>
            </div>
            
            <Alert className="bg-primary/5 border-primary/20">
              <AlertDescription className="text-sm">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="sendEmail"
                    checked={formData.sendEmail}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, sendEmail: checked as boolean })
                    }
                    className="mt-0.5"
                  />
                  <label htmlFor="sendEmail" className="text-sm cursor-pointer leading-relaxed">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Send welcome email with login credentials to <strong className="break-all">{formData.email || 'user'}</strong>.
                    User will be required to change password on first login.
                  </label>
                </div>
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" className="gradient-primary w-full sm:w-auto">
              <UserPlus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
