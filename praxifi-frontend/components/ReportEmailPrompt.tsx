'use client';

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
import { Mail, Send, X, Loader2 } from 'lucide-react';

interface ReportEmailPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: (email: string | null) => void;
  isLoading?: boolean;
}

export function ReportEmailPrompt({ isOpen, onClose, onProceed, isLoading = false }: ReportEmailPromptProps) {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendReport = () => {
    // Validate email if provided
    if (email.trim()) {
      if (!validateEmail(email)) {
        setEmailError('Please enter a valid email address');
        return;
      }
    }

    setEmailError('');
    onProceed(email.trim() || null);
  };

  const handleSkip = () => {
    setEmailError('');
    setEmail('');
    onProceed(null);
  };

  const handleClose = () => {
    setEmail('');
    setEmailError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <Mail className="w-5 h-5 text-blue-500" />
            Email Report After Generation
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-base mt-2">
            Enter your email address to automatically receive the complete PDF report once generation is complete.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-slate-300">
              Email Address (Optional)
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError('');
              }}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading) {
                  handleSendReport();
                }
              }}
            />
            {emailError && (
              <p className="text-sm text-red-400">{emailError}</p>
            )}
          </div>

          <div className="bg-slate-800 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-slate-300">What happens next:</p>
            <ul className="text-sm text-slate-400 space-y-1 ml-4">
              <li className="list-disc">Report generation starts immediately</li>
              <li className="list-disc">You'll be redirected to view the insights</li>
              <li className="list-disc">If email provided: PDF sent automatically when ready</li>
              <li className="list-disc">If skipped: You can download manually from dashboard</li>
            </ul>
          </div>

          <p className="text-xs text-slate-500">
            💡 Tip: Add your email to receive the report even if you navigate away or close the tab
          </p>
        </div>

        <DialogFooter className="gap-3 sm:gap-4 flex-col sm:flex-row">
          <Button
            type="button"
            variant="glass"
            onClick={handleSkip}
            disabled={isLoading}
            className="text-slate-400 hover:text-white hover:bg-slate-800 w-full sm:w-auto"
          >
            <X className="w-4 h-4 mr-2" />
            Skip
          </Button>
          <Button
            type="button"
            onClick={handleSendReport}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {email.trim() ? 'Send Report' : 'Start Generation'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
