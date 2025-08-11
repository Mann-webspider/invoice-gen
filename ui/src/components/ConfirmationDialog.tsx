import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmationDialogProps {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: 'destructive' | 'default';
  icon?: React.ReactNode;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  trigger,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  variant = 'destructive',
  icon
}) => {
  const defaultIcon = variant === 'destructive' ? (
    <AlertTriangle className="w-8 h-8 text-red-600" />
  ) : (
    <AlertTriangle className="w-8 h-8 text-blue-600" />
  );

  const iconBgColor = variant === 'destructive' ? 'bg-red-100' : 'bg-blue-100';
  const confirmButtonColor = variant === 'destructive' 
    ? 'bg-red-600 hover:bg-red-700' 
    : 'bg-blue-600 hover:bg-blue-700';

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>
      
      <AlertDialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-xl">
        <AlertDialogHeader className="text-center pb-4">
          <div className={`mx-auto mb-4 w-16 h-16 ${iconBgColor} rounded-full flex items-center justify-center`}>
            {icon || defaultIcon}
          </div>
          
          <AlertDialogTitle className="text-xl font-semibold text-gray-900 mb-2">
            {title}
          </AlertDialogTitle>
          
          <AlertDialogDescription className="text-gray-600 text-sm leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex gap-3 pt-6">
          <AlertDialogCancel asChild>
            <Button 
              variant="outline" 
              className="flex-1 bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700 font-medium py-2.5 rounded-lg transition-all duration-200"
            >
              {cancelText}
            </Button>
          </AlertDialogCancel>
          
          <AlertDialogAction asChild>
            <Button 
              onClick={onConfirm}
              className={`flex-1 ${confirmButtonColor} text-white font-medium py-2.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md`}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              {confirmText}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
