import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/auth-modal';
import { AlertTriangle, User, UserPlus, X } from 'lucide-react';

export function AuthWarning() {
  const { user } = useAuth();
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('bolt_auth_warning_dismissed') === 'true';
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'login' | 'signup'>('login');

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('bolt_auth_warning_dismissed', 'true');
  };

  // Don't show if user is logged in or warning is dismissed
  if (user || isDismissed) {
    return null;
  }

  const openModal = (tab: 'login' | 'signup') => {
    setModalTab(tab);
    setIsModalOpen(true);
  };

  return (
    <>
      <Alert className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
        <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex-1">
            <strong className="font-medium text-orange-800 dark:text-orange-200">
              Guest Mode Notice:
            </strong>
            <span className="text-orange-700 dark:text-orange-300 ml-2">
              Files uploaded without an account will be lost when you close this website. 
              Create an account to keep track of your files.
            </span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => openModal('login')}
              className="border-orange-200 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900"
              data-testid="button-login-warning"
            >
              <User className="w-4 h-4 mr-1" />
              Login
            </Button>
            <Button
              size="sm"
              onClick={() => openModal('signup')}
              className="bg-orange-600 hover:bg-orange-700 text-white dark:bg-orange-600 dark:hover:bg-orange-700"
              data-testid="button-signup-warning"
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Sign Up
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 p-1"
              data-testid="button-dismiss-warning"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      <AuthModal
        defaultTab={modalTab}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}