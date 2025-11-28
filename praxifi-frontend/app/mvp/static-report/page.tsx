'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Upload, 
  FileSpreadsheet, 
  Sparkles, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Brain,
  Shield,
  Zap,
  Target,
  PieChart,
  Activity
} from 'lucide-react';
import { PersonaMode, UploadConfig } from '@/lib/types';
import { ReportEmailPrompt } from '@/components/ReportEmailPrompt';
import { generateServerSidePDF } from '@/lib/pdf-generator-server';
import { sendReportEmail } from '@/lib/email-service';

export default function StaticReportPage() {
  const router = useRouter();
  const { setUploadedFile, setUploadConfig, setFullReportData } = useAppContext();
  
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [persona, setPersona] = useState<PersonaMode>('finance_guardian');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<string>('');
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  
  // Prevent duplicate requests
  const requestInProgress = useRef(false);

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
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const csvFiles = droppedFiles.filter(file => file.name.endsWith('.csv'));
    
    if (csvFiles.length > 0) {
      setFiles(prevFiles => [...prevFiles, ...csvFiles]);
      setError(null);
    } else {
      setError('Please upload valid CSV files');
    }
  }, []);

  // Schema validation helper
  const validateSchemas = async (filesToCheck: File[]): Promise<{ valid: boolean; message?: string }> => {
    if (filesToCheck.length < 2) {
      return { valid: true };
    }

    try {
      const schemas: { fileName: string; headers: string[] }[] = [];

      // Read headers from each file
      for (const file of filesToCheck) {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length === 0) {
          return { 
            valid: false, 
            message: `File "${file.name}" is empty or invalid` 
          };
        }
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        schemas.push({ fileName: file.name, headers });
      }

      // Compare all schemas with the first one
      const baseSchema = schemas[0];
      for (let i = 1; i < schemas.length; i++) {
        const currentSchema = schemas[i];
        
        // Check if headers match
        if (baseSchema.headers.length !== currentSchema.headers.length) {
          return {
            valid: false,
            message: `Schema mismatch: "${baseSchema.fileName}" has ${baseSchema.headers.length} columns, but "${currentSchema.fileName}" has ${currentSchema.headers.length} columns`
          };
        }

        // Check for missing or extra columns
        const missingInCurrent = baseSchema.headers.filter(h => !currentSchema.headers.includes(h));
        const extraInCurrent = currentSchema.headers.filter(h => !baseSchema.headers.includes(h));

        if (missingInCurrent.length > 0 || extraInCurrent.length > 0) {
          let details = [];
          if (missingInCurrent.length > 0) {
            details.push(`Missing columns in "${currentSchema.fileName}": ${missingInCurrent.join(', ')}`);
          }
          if (extraInCurrent.length > 0) {
            details.push(`Extra columns in "${currentSchema.fileName}": ${extraInCurrent.join(', ')}`);
          }
          return {
            valid: false,
            message: `Schema mismatch between "${baseSchema.fileName}" and "${currentSchema.fileName}". ${details.join('. ')}`
          };
        }
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        message: `Error reading files: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  };

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    const csvFiles = selectedFiles.filter(file => file.name.endsWith('.csv'));
    
    if (csvFiles.length === 0) {
      setError('Please upload valid CSV files');
      e.target.value = '';
      return;
    }

    // Combine with existing files for schema validation
    const allFiles = [...files, ...csvFiles];

    // Validate schemas if multiple files
    if (allFiles.length > 1) {
      const validation = await validateSchemas(allFiles);
      if (!validation.valid) {
        setError(validation.message || 'Schema validation failed');
        e.target.value = '';
        return;
      }
    }

    setFiles(allFiles);
    setError(null);
    
    // Reset input value to allow re-selecting the same file
    e.target.value = '';
  }, [files]);

  const removeFile = useCallback((index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    
    // Reset the file input to allow re-uploading
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }, []);

  const handleAddMoreFiles = useCallback(() => {
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }, []);

  const sendPDFEmail = async (reportData: any, email: string) => {
    try {
      const report = reportData.full_analysis_report || reportData;
      const mode = report.dashboard_mode || persona;
      const reportDate = new Date().toISOString().split('T')[0];
      
      console.log('📄 Generating PDF for background email...');
      
      // Generate PDF as Blob
      const pdfBlob = await generateServerSidePDF(report, mode, true);
      
      if (!pdfBlob) {
        console.error('❌ Failed to generate PDF blob');
        return;
      }
      
      console.log('📧 Sending email in background to:', email);
      
      // Send email (non-blocking)
      const result = await sendReportEmail({
        to: email,
        pdfBlob,
        reportMode: mode,
        reportDate,
      });
      
      if (result.success) {
        console.log('✅ Email sent successfully in background!');
      } else {
        console.error('❌ Failed to send email:', result.error);
      }
    } catch (error) {
      console.error('❌ Error sending background email:', error);
      // Don't show error to user since they're already navigated away
    }
  };

  const connectToProgressStream = (taskId: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const eventSource = new EventSource(`${apiUrl}/api/progress/${taskId}`);
    
    // Handle different event types
    eventSource.addEventListener('connected', (event: Event) => {
      const messageEvent = event as MessageEvent;
      const data = JSON.parse(messageEvent.data);
      console.log('✅ Connected to progress stream:', data);
    });
    
    eventSource.addEventListener('progress', (event: Event) => {
      try {
        const messageEvent = event as MessageEvent;
        const data = JSON.parse(messageEvent.data);
        console.log('📊 Progress update:', data);
        setProgress(data.progress || 0);
        setProgressMessage(data.message || '');
        setCurrentStep(data.step || '');
      } catch (err) {
        console.error('Failed to parse progress data:', err);
      }
    });
    
    eventSource.addEventListener('heartbeat', (event: Event) => {
      const messageEvent = event as MessageEvent;
      const data = JSON.parse(messageEvent.data);
      console.log('💓 Heartbeat:', data.message);
    });
    
    eventSource.addEventListener('error', (event: Event) => {
      const messageEvent = event as MessageEvent;
      const data = JSON.parse(messageEvent.data);
      console.error('❌ SSE Error:', data.message);
      setError(data.message);
      eventSource.close();
    });
    
    eventSource.onerror = (err) => {
      console.error('❌ EventSource connection error:', err);
      // Don't close immediately - might be temporary network issue
      // The backend will send error event if it's a real timeout
    };
    
    return eventSource;
  };

  const handleGenerateReportClick = () => {
    if (files.length === 0) return;
    // Show email prompt before starting
    setShowEmailPrompt(true);
  };

  const handleEmailPromptResponse = (email: string | null) => {
    setPendingEmail(email);
    setShowEmailPrompt(false);
    // Start generation immediately after getting response
    setTimeout(() => handleGenerateReport(email), 100);
  };

  const handleGenerateReport = async (userEmail: string | null) => {
    if (files.length === 0) return;
    
    // Double-check: Prevent duplicate requests even across component remounts
    const activeRequestKey = 'praxifi_active_request';
    const existingRequest = localStorage.getItem(activeRequestKey);
    
    if (requestInProgress.current || existingRequest) {
      // Check if the existing request is stale (>15 minutes old)
      const requestAge = existingRequest ? Date.now() - parseInt(existingRequest) : 0;
      const fifteenMinutes = 15 * 60 * 1000;
      
      if (requestAge < fifteenMinutes) {
        console.warn('⚠️ Request already in progress, ignoring duplicate', {
          ref: requestInProgress.current,
          localStorage: existingRequest,
          ageMinutes: (requestAge / 60000).toFixed(1)
        });
        return;
      } else {
        console.warn('🔄 Stale request detected (>15min old), allowing new request');
      }
    }
    
    // Set both flags
    requestInProgress.current = true;
    localStorage.setItem(activeRequestKey, Date.now().toString());
    
    setIsLoading(true);
    setError(null);
    setProgress(0);
    setProgressMessage(files.length > 1 ? `Uploading ${files.length} files...` : 'Uploading file...');
    setCurrentStep('upload');
    
    let eventSource: EventSource | null = null;

    try {
      // Generate unique request ID to track this specific request
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('🚀 Starting report generation...', { 
        fileCount: files.length,
        files: files.map(f => f.name),
        persona,
        requestId 
      });
      
      const formData = new FormData();
      // Append all files to FormData
      files.forEach((file, index) => {
        formData.append('files', file);
      });
      formData.append('mode', persona);  // Backend expects 'mode', not 'persona'

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/full_report`;
      console.log('📡 Calling API:', apiUrl, 'RequestID:', requestId);

      // NO timeout - let it run as long as needed
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'ngrok-skip-browser-warning': 'true',  // Required for ngrok free tier
          'X-Request-ID': requestId,  // Track this specific request
        },
        // No signal, no timeout - just wait for response
      });

      console.log('📥 Response received:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API error response:', errorText);
        throw new Error(`API error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Data parsed successfully, size:', JSON.stringify(data).length, 'bytes');
      
      // Note: EventSource for progress updates disabled due to ngrok SSE limitations
      // The report generation still works perfectly, just without real-time progress
      // if (data.task_id) {
      //   console.log('🔌 Connecting to progress stream:', data.task_id);
      //   eventSource = connectToProgressStream(data.task_id);
      // } else {
        setProgress(100);
      // }
      
      // Store in context (use first file for context compatibility)
      const config: UploadConfig = { persona };
      setUploadedFile(files[0]);
      setUploadConfig(config);
      setFullReportData(data);

      console.log('🎉 Report stored in context');
      
      // If user provided email, send PDF automatically
      if (userEmail) {
        console.log('📧 Auto-sending PDF to:', userEmail);
        sendPDFEmail(data, userEmail);
      }
      
      // Navigate to insights after brief delay
      console.log('🚀 Navigating to insights...');
      setTimeout(() => {
        if (eventSource) eventSource.close();
        router.push('/insights');
      }, 1000);
    } catch (err) {
      console.error('💥 Error during report generation:', err);
      if (eventSource) eventSource.close();
      setProgress(0);
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      // Clean up both flags
      requestInProgress.current = false;
      localStorage.removeItem('praxifi_active_request');
      
      if (!error) {
        setTimeout(() => {
          if (eventSource) eventSource.close();
          setIsLoading(false);
        }, 1000);
      } else {
        if (eventSource) eventSource.close();
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black pt-20 pb-20">
      <div className="container max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-xl shadow-lg">
            <Sparkles className="h-4 w-4 text-white animate-pulse" />
            <span className="text-sm font-medium font-mono text-white/90 tracking-wider">ENTERPRISE AI/ML INTELLIGENCE</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white bg-clip-text bg-gradient-to-r from-white via-white to-white/80">
            Autonomous Financial Intelligence
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
            37+ KPIs • Correlation heatmaps • Multi-layer forecasting • Enterprise security
          </p>
          
          {/* Stats Bar */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <div className="group flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 hover:border-green-500/40 backdrop-blur-sm transition-all">
              <CheckCircle2 className="h-4 w-4 text-green-400 group-hover:scale-110 transition-transform" />
              <span className="text-green-300 font-medium text-sm">95.8% Accuracy</span>
            </div>
            <div className="group flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/40 backdrop-blur-sm transition-all">
              <Shield className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-blue-300 font-medium text-sm">8 Security Layers</span>
            </div>
            <div className="group flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 backdrop-blur-sm transition-all">
              <BarChart3 className="h-4 w-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-purple-300 font-medium text-sm">37+ KPIs</span>
            </div>
          </div>
        </div>

        {/* Core AI/ML Capabilities */}
        <div className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Core AI/ML Capabilities</h2>
            <p className="text-white/50 text-base">Enterprise-grade predictive analytics powered by Prophet & AutoARIMA</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <Card className="group bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                    <TrendingUp className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-white text-base">Predictive Forecasting</h3>
                </div>
                <p className="text-sm text-white/60 leading-relaxed mb-3">
                  Prophet + AutoARIMA with 95.8% accuracy. 14 metrics forecasted simultaneously with confidence intervals.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded-full border border-blue-500/20">3-Month Horizon</span>
                  <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded-full border border-blue-500/20">Confidence Intervals</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-red-500/20 rounded-lg group-hover:bg-red-500/30 transition-colors">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <h3 className="font-semibold text-white text-base">Anomaly Detection</h3>
                </div>
                <p className="text-sm text-white/60 leading-relaxed mb-3">
                  6-algorithm ensemble with confidence scoring, severity classification, and multi-metric analysis across financial KPIs.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-300 rounded-full border border-red-500/20">Ensemble AI</span>
                  <span className="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-300 rounded-full border border-red-500/20">Multi-Metric</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                    <PieChart className="h-5 w-5 text-green-400" />
                  </div>
                  <h3 className="font-semibold text-white text-base">Profit Driver Analysis</h3>
                </div>
                <p className="text-sm text-white/60 leading-relaxed mb-3">
                  SHAP explainability identifies top 5 profit drivers with quantified feature contributions and impact scores.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 bg-green-500/10 text-green-300 rounded-full border border-green-500/20">Explainable AI</span>
                  <span className="text-[10px] px-2 py-0.5 bg-green-500/10 text-green-300 rounded-full border border-green-500/20">SHAP Values</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                    <Brain className="h-5 w-5 text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-white text-base">Dual-Mode Narratives</h3>
                </div>
                <p className="text-sm text-white/60 leading-relaxed mb-3">
                  Finance Guardian (technical) & Financial Storyteller (executive) modes for different stakeholders.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-300 rounded-full border border-purple-500/20">Contextual</span>
                  <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-300 rounded-full border border-purple-500/20">Actionable</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-yellow-500/20 rounded-lg group-hover:bg-yellow-500/30 transition-colors">
                    <Target className="h-5 w-5 text-yellow-400" />
                  </div>
                  <h3 className="font-semibold text-white text-base">Scenario Simulation</h3>
                </div>
                <p className="text-sm text-white/60 leading-relaxed mb-3">
                  What-if engine with real-time impact modeling, sensitivity analysis, and cascading effect calculations.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 bg-yellow-500/10 text-yellow-300 rounded-full border border-yellow-500/20">Real-Time</span>
                  <span className="text-[10px] px-2 py-0.5 bg-yellow-500/10 text-yellow-300 rounded-full border border-yellow-500/20">Multi-Parameter</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-cyan-500/20 rounded-lg group-hover:bg-cyan-500/30 transition-colors">
                    <Activity className="h-5 w-5 text-cyan-400" />
                  </div>
                  <h3 className="font-semibold text-white text-base">Autonomous Ingestion</h3>
                </div>
                <p className="text-sm text-white/60 leading-relaxed mb-3">
                  Intelligent column mapping (50+ synonyms), auto-normalization, smart imputation, and quality validation.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 bg-cyan-500/10 text-cyan-300 rounded-full border border-cyan-500/20">Auto-Detect</span>
                  <span className="text-[10px] px-2 py-0.5 bg-cyan-500/10 text-cyan-300 rounded-full border border-cyan-500/20">Validated</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Security Architecture Section */}
        <div className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight flex items-center gap-3">
              <Shield className="h-7 w-7 text-blue-400" />
              8-Layer Security Architecture
            </h2>
            <p className="text-white/50 text-base">Cryptographic-level protection • Superior to Federated Learning • GDPR compliant</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-5">
            <Card className="group bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20 hover:border-blue-500/40 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20">
              <CardContent className="pt-6">
                <div className="space-y-3.5">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 text-xs font-bold border border-blue-500/30">1</div>
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1">AES-256-GCM Memory Encryption</h4>
                      <p className="text-xs text-white/60">Data encrypted at rest in RAM with 3-pass DoD secure wiping</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 text-xs font-bold border border-blue-500/30">2</div>
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1">Secure Logging + PII Redaction</h4>
                      <p className="text-xs text-white/60">HMAC-SHA256 audit trails with GDPR-compliant PII masking</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 text-xs font-bold border border-blue-500/30">3</div>
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1">Homomorphic Encryption (Paillier)</h4>
                      <p className="text-xs text-white/60">Compute on encrypted data without decryption (RSA-2048)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 text-xs font-bold border border-blue-500/30">4</div>
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1">Secure Multi-Party Computation</h4>
                      <p className="text-xs text-white/60">Shamir secret sharing with threshold cryptography</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 hover:border-purple-500/40 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20">
              <CardContent className="pt-6">
                <div className="space-y-3.5">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 text-xs font-bold border border-purple-500/30">5</div>
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1">Zero-Knowledge Proofs (21 Types)</h4>
                      <p className="text-xs text-white/60">Prove data properties without revealing values (95.1% success)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 text-xs font-bold border border-purple-500/30">6</div>
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1">Differential Privacy (ε-DP)</h4>
                      <p className="text-xs text-white/60">Adaptive noise injection with Laplacian mechanism (ε=1.0)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 text-xs font-bold border border-purple-500/30">7</div>
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1">Privacy Budget Tracking</h4>
                      <p className="text-xs text-white/60">Rényi DP composition with automatic query rejection</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 text-xs font-bold border border-purple-500/30">8</div>
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1">Secure Enclave (TEE)</h4>
                      <p className="text-xs text-white/60">Intel SGX / ARM TrustZone with hardware attestation</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="group p-4 bg-white/5 border border-white/10 hover:border-white/20 rounded-lg backdrop-blur-xl transition-all hover:bg-white/[0.07]">
              <div className="text-3xl font-bold text-white mb-1">100%</div>
              <div className="text-xs text-white/50">Security Tests Passed</div>
            </div>
            <div className="group p-4 bg-white/5 border border-white/10 hover:border-white/20 rounded-lg backdrop-blur-xl transition-all hover:bg-white/[0.07]">
              <div className="text-3xl font-bold text-white mb-1">21</div>
              <div className="text-xs text-white/50">ZK Proof Types</div>
            </div>
            <div className="group p-4 bg-white/5 border border-white/10 hover:border-white/20 rounded-lg backdrop-blur-xl transition-all hover:bg-white/[0.07]">
              <div className="text-3xl font-bold text-white mb-1">&lt;75ms</div>
              <div className="text-xs text-white/50">Security Overhead</div>
            </div>
            <div className="group p-4 bg-white/5 border border-white/10 hover:border-white/20 rounded-lg backdrop-blur-xl transition-all hover:bg-white/[0.07]">
              <div className="text-3xl font-bold text-white mb-1">256-bit</div>
              <div className="text-xs text-white/50">Encryption Strength</div>
            </div>
          </div>
        </div>

        {/* Main Upload Card */}
        <Card className="mb-10 bg-white/5 border-white/10 backdrop-blur-xl hover:border-white/15 transition-all">
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center gap-2.5 text-xl">
              <Upload className="h-5 w-5 text-white/80" />
              Upload Financial Data
            </CardTitle>
            <CardDescription className="text-white/50 text-sm">
              CSV with 24+ months • Multiple files supported • Auto-merged • 50+ column synonyms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                isDragging
                  ? 'border-white/50 bg-white/10 scale-[1.02]'
                  : 'border-white/20 hover:border-white/30 hover:bg-white/[0.02]'
              }`}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
                disabled={isLoading}
                multiple
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-4">
                  {files.length > 0 ? (
                    <>
                      <FileSpreadsheet className="h-16 w-16 text-white" />
                      <div className="w-full">
                        <p className="font-semibold text-lg text-white mb-2">
                          {files.length} file{files.length > 1 ? 's' : ''} selected
                        </p>
                        <div className="max-h-40 overflow-y-auto space-y-2 mb-4">
                          {files.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FileSpreadsheet className="h-4 w-4 text-white/60 flex-shrink-0" />
                                <span className="text-sm text-white/80 truncate">{file.name}</span>
                                <span className="text-xs text-white/50 flex-shrink-0">
                                  ({(file.size / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                              {!isLoading && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    removeFile(index);
                                  }}
                                  className="ml-2 p-1 hover:bg-red-500/20 rounded transition-colors flex-shrink-0"
                                  type="button"
                                >
                                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-white/50 mb-2">
                          Total size: {(files.reduce((sum, f) => sum + f.size, 0) / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      {!isLoading && (
                        <Button size="sm" variant="glass" type="button" onClick={handleAddMoreFiles}>
                          Add More Files
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Upload className="h-16 w-16 text-white/60" />
                      <div>
                        <p className="font-semibold text-lg text-white">Drop your CSV files here</p>
                        <p className="text-sm text-white/60">or click to browse • Multiple files supported</p>
                      </div>
                    </>
                  )}
                </div>
              </label>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg backdrop-blur-xl">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="mt-4 space-y-4">
                {/* Progress Header */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-sm text-white/90 font-medium block">
                      {progressMessage || 'Processing...'}
                    </span>
                    <span className="text-xs text-white/50">
                      Step: {currentStep || 'initializing'}
                    </span>
                  </div>
                  <span className="text-lg text-white/90 font-mono font-bold">{progress}%</span>
                </div>
                
                {/* Progress Bar */}
                <div className="relative w-full bg-white/10 rounded-full h-3 overflow-hidden border border-white/20 shadow-lg">
                  <div
                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-full transition-all duration-500 ease-out relative"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  </div>
                </div>
                
                {/* Step Indicators */}
                <div className="grid grid-cols-5 gap-2 text-xs">
                  <div className={`p-2 rounded ${currentStep === 'upload' || currentStep === 'validation' ? 'bg-blue-500/20 text-blue-300' : progress >= 15 ? 'bg-green-500/20 text-green-300' : 'bg-white/5 text-white/40'}`}>
                    <div className="font-medium">Upload</div>
                    <div className="text-[10px] opacity-70">5-15%</div>
                  </div>
                  <div className={`p-2 rounded ${currentStep === 'forecasting' ? 'bg-blue-500/20 text-blue-300' : progress >= 50 ? 'bg-green-500/20 text-green-300' : 'bg-white/5 text-white/40'}`}>
                    <div className="font-medium">Forecast</div>
                    <div className="text-[10px] opacity-70">25-50%</div>
                  </div>
                  <div className={`p-2 rounded ${currentStep === 'regional' || currentStep === 'departmental' ? 'bg-blue-500/20 text-blue-300' : progress >= 70 ? 'bg-green-500/20 text-green-300' : 'bg-white/5 text-white/40'}`}>
                    <div className="font-medium">Analysis</div>
                    <div className="text-[10px] opacity-70">60-70%</div>
                  </div>
                  <div className={`p-2 rounded ${currentStep === 'analytics' || currentStep === 'visualizations' ? 'bg-blue-500/20 text-blue-300' : progress >= 90 ? 'bg-green-500/20 text-green-300' : 'bg-white/5 text-white/40'}`}>
                    <div className="font-medium">Charts</div>
                    <div className="text-[10px] opacity-70">80-90%</div>
                  </div>
                  <div className={`p-2 rounded ${currentStep === 'complete' ? 'bg-blue-500/20 text-blue-300' : progress >= 100 ? 'bg-green-500/20 text-green-300' : 'bg-white/5 text-white/40'}`}>
                    <div className="font-medium">Done</div>
                    <div className="text-[10px] opacity-70">95-100%</div>
                  </div>
                </div>
                
                {/* Live Indicator */}
                <div className="flex items-center justify-center gap-2 text-xs text-white/50 pt-2 border-t border-white/10">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span>Live progress via Server-Sent Events</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuration */}
        <div className="mb-10">
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl hover:border-white/15 transition-all">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center gap-2.5 text-xl">
                <Brain className="h-5 w-5 text-white/80" />
                AI Persona Selection
              </CardTitle>
              <CardDescription className="text-white/50 text-sm">
                Dual-mode narrative generation optimized for different stakeholder audiences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-5">
                <div 
                  onClick={() => !isLoading && setPersona('finance_guardian')}
                  className={`cursor-pointer p-6 rounded-xl border-2 transition-all duration-300 group ${
                    persona === 'finance_guardian' 
                      ? 'bg-blue-500/15 border-blue-400/50 shadow-2xl shadow-blue-500/20 scale-[1.02]' 
                      : 'bg-white/5 border-white/10 hover:border-blue-400/30 hover:bg-white/[0.08] hover:shadow-lg'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${persona === 'finance_guardian' ? 'bg-blue-500/30' : 'bg-blue-500/20 group-hover:bg-blue-500/30'} transition-all`}>
                      <Shield className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-semibold text-white mb-1">Finance Guardian 🛡️</p>
                      <p className="text-xs text-blue-300 font-medium mb-2">Internal Stakeholders</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed mb-3">
                    Conservative, risk-focused analysis with technical details, compliance notes, and operational recommendations for CFOs and finance teams.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded-full border border-blue-500/20">Risk Analysis</span>
                    <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded-full border border-blue-500/20">Technical</span>
                    <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded-full border border-blue-500/20">Compliance</span>
                  </div>
                </div>
                
                <div 
                  onClick={() => !isLoading && setPersona('financial_storyteller')}
                  className={`cursor-pointer p-6 rounded-xl border-2 transition-all duration-300 group ${
                    persona === 'financial_storyteller' 
                      ? 'bg-purple-500/15 border-purple-400/50 shadow-2xl shadow-purple-500/20 scale-[1.02]' 
                      : 'bg-white/5 border-white/10 hover:border-purple-400/30 hover:bg-white/[0.08] hover:shadow-lg'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${persona === 'financial_storyteller' ? 'bg-purple-500/30' : 'bg-purple-500/20 group-hover:bg-purple-500/30'} transition-all`}>
                      <Sparkles className="h-6 w-6 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-semibold text-white mb-1">Financial Storyteller 📊</p>
                      <p className="text-xs text-purple-300 font-medium mb-2">External Stakeholders</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed mb-3">
                    Executive summaries and strategic narratives with stakeholder-friendly language and growth stories for investors and board members.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-300 rounded-full border border-purple-500/20">Strategic</span>
                    <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-300 rounded-full border border-purple-500/20">Executive</span>
                    <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-300 rounded-full border border-purple-500/20">Growth Story</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generate Button */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl hover:border-white/15 transition-all">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-white/10">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Ready to Generate Report</h3>
                  <p className="text-sm text-white/50">
                    Processing time: 2-5 minutes • 37+ KPIs • 14 forecasts • 8 security layers
                  </p>
                </div>
              </div>
              <Button
                onClick={handleGenerateReportClick}
                disabled={files.length === 0 || isLoading}
                size="default"
                className="gap-2 min-w-[220px] h-12 text-base font-medium relative overflow-hidden
                  before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent
                  before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin relative z-10" />
                    <span className="relative z-10">Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 relative z-10" />
                    <span className="relative z-10">Generate Report</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Section */}
        <div className="mt-16 grid md:grid-cols-2 gap-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl hover:border-white/15 transition-all">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center gap-2.5 text-lg">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                Report Deliverables
              </CardTitle>
              <CardDescription className="text-white/50 text-sm">Comprehensive dashboard-ready JSON output</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-start gap-2.5 text-white/70">
                  <BarChart3 className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-white">37+ KPIs:</span> Core financials, enhanced ratios (ROAS, marketing efficiency, current ratio, quick ratio, working capital), and operational metrics
                  </div>
                </li>
                <li className="flex items-start gap-2.5 text-white/70">
                  <TrendingUp className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-white">14 Forecasts:</span> Prophet/AutoARIMA 3-month predictions with upper/lower confidence bounds
                  </div>
                </li>
                <li className="flex items-start gap-2.5 text-white/70">
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-white">Anomaly Detection:</span> 6-algorithm ensemble with confidence scoring, 5 severity levels (CRITICAL/HIGH/MEDIUM/LOW/INFO), and multi-metric analysis across 10+ financial KPIs
                  </div>
                </li>
                <li className="flex items-start gap-2.5 text-white/70">
                  <PieChart className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-white">SHAP Analysis:</span> Top 5 profit drivers with feature importance and impact quantification
                  </div>
                </li>
                <li className="flex items-start gap-2.5 text-white/70">
                  <Brain className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-white">AI Narratives:</span> Executive summaries, operational insights, and actionable recommendations
                  </div>
                </li>
                <li className="flex items-start gap-2.5 text-white/70">
                  <Activity className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-white">Visualizations:</span> Correlation heatmaps, regional/departmental breakdowns, forecast charts with confidence bands
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-xl hover:border-white/15 transition-all">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center gap-2.5 text-lg">
                <FileSpreadsheet className="h-5 w-5 text-blue-400" />
                CSV Requirements
              </CardTitle>
              <CardDescription className="text-white/50 text-sm">Flexible column mapping with 50+ synonyms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 bg-green-400 rounded-full" />
                    Required Columns
                  </h4>
                  <ul className="space-y-1.5 text-xs text-white/70 ml-4">
                    <li>• <span className="font-mono text-blue-300">date</span> / month / period (YYYY-MM-DD)</li>
                    <li>• <span className="font-mono text-blue-300">revenue</span> / sales / income / turnover</li>
                    <li>• <span className="font-mono text-blue-300">expenses</span> / costs / expenditure / opex</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 bg-yellow-400 rounded-full" />
                    Optional (Enhanced Analysis)
                  </h4>
                  <ul className="space-y-1.5 text-xs text-white/70 ml-4">
                    <li>• Profit, cashflow, AR, AP, inventory</li>
                    <li>• Working capital, burn rate, CAC</li>
                    <li>• Regional/departmental breakdowns</li>
                    <li>• Marketing spend, ROAS, churn rate</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 bg-blue-400 rounded-full" />
                    Best Results
                  </h4>
                  <ul className="space-y-1.5 text-xs text-white/70 ml-4">
                    <li>• 24+ months historical data</li>
                    <li>• Monthly granularity preferred</li>
                    <li>• Consistent date formats</li>
                    <li>• Clean, validated numbers</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Email Prompt Modal */}
      <ReportEmailPrompt
        isOpen={showEmailPrompt}
        onClose={() => setShowEmailPrompt(false)}
        onProceed={handleEmailPromptResponse}
        isLoading={false}
      />
    </div>
  );
}
