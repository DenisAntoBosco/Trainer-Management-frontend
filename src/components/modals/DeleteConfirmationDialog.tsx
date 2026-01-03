import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName: string;
  itemType: string;
  description?: string;
}

export default function DeleteConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType,
  description,
}: DeleteConfirmationDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const isValid = confirmText === itemName;

  const handleConfirm = () => {
    if (isValid) {
      onConfirm();
      setConfirmText('');
      onClose();
    }
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-danger">
            <AlertTriangle className="w-5 h-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description || `This action cannot be undone. This will permanently delete the ${itemType}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 rounded-lg bg-danger/10 border border-danger/30">
            <p className="text-sm font-medium mb-2">
              To confirm deletion, please type the {itemType} name:
            </p>
            <p className="text-sm font-mono font-bold text-danger">
              {itemName}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-text">
              Type <span className="font-mono font-bold">{itemName}</span> to confirm
            </Label>
            <Input
              id="confirm-text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={`Enter ${itemType} name`}
              className={confirmText && !isValid ? 'border-danger' : ''}
            />
            {confirmText && !isValid && (
              <p className="text-xs text-danger">Name does not match</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValid}
            className="bg-danger hover:bg-danger/90"
          >
            Delete {itemType}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
