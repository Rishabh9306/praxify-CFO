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
import { Mail, Send, Download, Loader2, AlertCircle } from 'lucide-react';

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
      <DialogContent className="sm:max-w-[440px] bg-black/95 border border-white/20 backdrop-blur-xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-white">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Mail className="w-4 h-4 text-blue-400" />
            </div>
            Email Report
          </DialogTitle>
          <DialogDescription className="text-white/60 text-sm mt-1.5">
            Receive your complete report via email or download directly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-3">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-medium text-white/80">
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
              className="h-9 bg-white/5 border-white/10 text-white text-sm placeholder:text-white/40 focus:border-white/30 focus:bg-white/10 transition-all"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading) {
                  handleSend();
                }
              }}
            />
            {emailError && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {emailError}
              </p>
            )}
          </div>

          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-lg p-3 space-y-1.5 border border-white/10">
            <p className="text-xs font-medium text-white/90">Included in your report:</p>
            <ul className="text-xs text-white/60 space-y-0.5 ml-3">
              <li className="list-disc">Complete metrics & forecasts</li>
              <li className="list-disc">Strategic insights & recommendations</li>
              <li className="list-disc">Correlation analysis & anomalies</li>
            </ul>
          </div>

          <p className="text-xs text-white/40 flex items-center gap-1">
            Sent from <span className="text-white/60 font-mono text-[11px]">noreply@praxifi.com</span>
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-row">
          <Button
            type="button"
            variant="glass"
            onClick={handleDownload}
            disabled={isLoading}
            className="relative h-9 text-sm text-white/60 hover:text-white hover:bg-white/10 w-full sm:w-auto overflow-hidden group
              before:absolute before:inset-0 before:border before:border-white/20 before:transition-all
              before:origin-center before:scale-x-100 before:scale-y-100
              hover:before:scale-x-105 hover:before:scale-y-105
              after:absolute after:inset-0 after:border after:border-white/10 after:rotate-1 after:transition-all
              hover:after:rotate-2"
          >
            <span className="relative z-10 flex items-center">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download
            </span>
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={isLoading}
            className="relative h-9 text-sm bg-white/10 hover:bg-white/15 text-white border border-white/20 w-full sm:w-auto overflow-hidden
              before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent
              before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700"
          >
            <span className="relative z-10 flex items-center">
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Send Email
                </>
              )}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
