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
import { Mail, Send, Download, Loader2 } from 'lucide-react';

interface EmailReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (email: string) => Promise<void>;
  onDownload: () => void;
  isLoading?: boolean;
}

export function EmailReportDialog({ isOpen, onClose, onSend, onDownload, isLoading = false }: EmailReportDialogProps) {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSend = async () => {
    // Validate email
    if (!email.trim()) {
      setEmailError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setEmailError('');
    await onSend(email);
  };

  const handleDownload = () => {
    setEmail('');
    setEmailError('');
    onDownload();
    onClose();
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
            Receive Your Complete Report via Email
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-base mt-2">
            Enter your email address to receive your report via email, or download it directly to your device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-slate-300">
              Email Address
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
                  handleSend();
                }
              }}
            />
            {emailError && (
              <p className="text-sm text-red-400">{emailError}</p>
            )}
          </div>

          <div className="bg-slate-800 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-slate-300">What you'll receive:</p>
            <ul className="text-sm text-slate-400 space-y-1 ml-4">
              <li className="list-disc">📊 Complete PDF report with all metrics</li>
              <li className="list-disc">📈 Detailed forecasts and breakdowns</li>
              <li className="list-disc">💡 Strategic insights & recommendations</li>
              <li className="list-disc">🔥 Correlation analysis & anomaly detection</li>
            </ul>
          </div>

          <p className="text-xs text-slate-500">
            By sending this report, you agree that the email will be sent from{' '}
            <span className="text-blue-400 font-mono">noreply@praxifi.com</span> to the address provided above.
          </p>
        </div>

        <DialogFooter className="gap-3 sm:gap-4 flex-col sm:flex-row">
          <Button
            type="button"
            variant="glass"
            onClick={handleDownload}
            disabled={isLoading}
            className="text-slate-400 hover:text-white hover:bg-slate-800 w-full sm:w-auto"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
