'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileSpreadsheet, Sparkles, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';
import { PersonaMode, ForecastMetric, UploadConfig } from '@/lib/types';

export default function UploadPage() {
  const router = useRouter();
  const { setUploadedFile, setUploadConfig, setFullReportData, setAgentData, addToSessionHistory } = useAppContext();
  
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [persona, setPersona] = useState<PersonaMode>('finance_guardian');
  const [metric, setMetric] = useState<ForecastMetric>('revenue');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Please upload a valid CSV file');
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please upload a valid CSV file');
    }
  }, []);

  const handleGenerateReport = async () => {
    if (!file) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('persona', persona);
      formData.append('forecast_metric', metric);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/full_report`, {
        method: 'POST',
        body: formData,
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Store in context
      const config: UploadConfig = { persona, forecast_metric: metric };
      setUploadedFile(file);
      setUploadConfig(config);
      setFullReportData(data);

      // Navigate to insights
      router.push('/insights');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLaunchAgent = async () => {
    if (!file) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('persona', persona);
      formData.append('forecast_metric', metric);
      formData.append('user_query', 'Give me a comprehensive summary of this financial data');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agent/analyze_and_respond`, {
        method: 'POST',
        body: formData,
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Store in context
      const config: UploadConfig = { persona, forecast_metric: metric };
      setUploadedFile(file);
      setUploadConfig(config);
      setAgentData(data);

      // Add to session history
      addToSessionHistory({
        session_id: data.session_id,
        timestamp: new Date().toISOString(),
        file_name: file.name,
        last_query: 'Give me a comprehensive summary of this financial data',
        data,
      });

      // Navigate to chat
      router.push('/chat');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to launch AI agent');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-20 pb-20">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-6 backdrop-blur-md">
            <Upload className="h-4 w-4 text-white" />
            <span className="text-sm font-medium font-mono text-white">MVP PORTAL</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Choose Your Analysis Path</h1>
          <p className="text-white/70 text-lg">
            Select the analysis mode that best fits your needs
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Static Report Card */}
          <Card className="bg-gradient-to-br from-white/10 to-white/5 border-white/20 backdrop-blur-md hover:border-white/30 transition-all group">
            <CardHeader>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl">Generate Static Report</CardTitle>
                  <CardDescription className="text-white/60">Complete dashboard analysis</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-white/70">
                Get a comprehensive financial report with KPIs, forecasts, anomalies, profit drivers, and AI-generated narratives. Perfect for presentations and board meetings.
              </p>
              
              <div className="space-y-2">
                <p className="text-xs font-medium text-white/80">Includes:</p>
                <ul className="space-y-1 text-xs text-white/60">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                    37+ KPI metrics dashboard
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                    14 metrics 3-month forecasting
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                    Multi-metric anomaly detection
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                    SHAP profit driver analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                    AI narratives & insights
                  </li>
                </ul>
              </div>

              <Button
                onClick={() => router.push('/mvp/static-report')}
                className="w-full gap-2"
                size="sm"
              >
                <Sparkles className="h-4 w-4" />
                Create Static Report
              </Button>
            </CardContent>
          </Card>

          {/* AI Agent Card */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-white/20 backdrop-blur-md hover:border-white/30 transition-all group">
            <CardHeader>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl">Launch AI Agent Session</CardTitle>
                  <CardDescription className="text-white/60">Interactive conversation</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-white/70">
                Start a conversation with your AI financial analyst powered by Gemini 2.5 Pro. Ask questions, explore insights, and get personalized explanations with persistent memory.
              </p>
              
              <div className="space-y-2">
                <p className="text-xs font-medium text-white/80">Features:</p>
                <ul className="space-y-1 text-xs text-white/60">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-blue-400" />
                    Natural language Q&A interface
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-blue-400" />
                    24-hour session persistence (Redis)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-blue-400" />
                    Full analysis context awareness
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-blue-400" />
                    Dual persona modes
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-blue-400" />
                    Follow-up questions supported
                  </li>
                </ul>
              </div>

              <Button
                onClick={() => router.push('/mvp/ai-agent')}
                className="w-full gap-2"
                size="sm"
              >
                <MessageSquare className="h-4 w-4" />
                Launch AI Chat
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <Card className="mt-8 bg-white/5 border-white/10 backdrop-blur-md">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Not sure which to choose?</h3>
                <div className="space-y-2 text-sm text-white/70">
                  <p>
                    <strong className="text-white">Choose Static Report</strong> if you need:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Complete dashboard for presentations</li>
                    <li>One-time comprehensive analysis</li>
                    <li>Export-ready visualizations</li>
                  </ul>
                  <p className="pt-2">
                    <strong className="text-white">Choose AI Agent</strong> if you need:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Interactive exploration of data</li>
                    <li>Ad-hoc questions and follow-ups</li>
                    <li>Personalized financial guidance</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
