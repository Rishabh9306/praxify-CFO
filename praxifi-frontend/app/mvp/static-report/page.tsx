'use client';

import { useState, useCallback } from 'react';
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
import { PersonaMode, ForecastMetric, UploadConfig } from '@/lib/types';

export default function StaticReportPage() {
  const router = useRouter();
  const { setUploadedFile, setUploadConfig, setFullReportData } = useAppContext();
  
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [persona, setPersona] = useState<PersonaMode>('finance_guardian');
  const [metric, setMetric] = useState<ForecastMetric>('revenue');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<string>('');

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

  const handleGenerateReport = async () => {
    if (!file) return;
    
    setIsLoading(true);
    setError(null);
    setProgress(0);
    setProgressMessage('Uploading file...');
    setCurrentStep('upload');
    
    let eventSource: EventSource | null = null;

    try {
      console.log('🚀 Starting report generation...', { file: file.name, persona, metric });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', persona);  // Backend expects 'mode', not 'persona'
      // Note: forecast_metric is not used by the backend, it forecasts all metrics automatically

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/full_report`;
      console.log('📡 Calling API:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      console.log('📥 Response received:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API error response:', errorText);
        throw new Error(`API error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Data parsed successfully, size:', JSON.stringify(data).length, 'bytes');
      
      // Start listening to progress updates if task_id is provided
      if (data.task_id) {
        console.log('🔌 Connecting to progress stream:', data.task_id);
        eventSource = connectToProgressStream(data.task_id);
      } else {
        setProgress(100);
      }
      
      // Store in context
      const config: UploadConfig = { persona, forecast_metric: metric };
      setUploadedFile(file);
      setUploadConfig(config);
      setFullReportData(data);

      console.log('🎉 Report stored in context, navigating to insights...');
      
      // Navigate to insights after brief delay
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
      <div className="container max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-6 backdrop-blur-md">
            <Sparkles className="h-4 w-4 text-white" />
            <span className="text-sm font-medium font-mono text-white">STATIC REPORT GENERATOR</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white">
            Comprehensive Financial Analysis
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Generate a complete static report with KPIs, forecasts, anomalies, profit drivers, and AI-generated narratives
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <Card className="bg-white/5 border-white/10 backdrop-blur-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white">8 Key KPIs</h3>
              </div>
              <p className="text-sm text-white/60">
                Total revenue, expenses, profit margin, cashflow, growth rate, financial health score, and more
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                </div>
                <h3 className="font-semibold text-white">Predictive Forecasting</h3>
              </div>
              <p className="text-sm text-white/60">
                3-month forecasts using Prophet & AutoARIMA with confidence intervals
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <h3 className="font-semibold text-white">Anomaly Detection</h3>
              </div>
              <p className="text-sm text-white/60">
                IQR and Isolation Forest algorithms to identify outliers
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <PieChart className="h-5 w-5 text-green-400" />
                </div>
                <h3 className="font-semibold text-white">Profit Drivers</h3>
              </div>
              <p className="text-sm text-white/60">
                SHAP-based explainable AI showing top factors impacting profit
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Brain className="h-5 w-5 text-yellow-400" />
                </div>
                <h3 className="font-semibold text-white">AI Narratives</h3>
              </div>
              <p className="text-sm text-white/60">
                Executive summaries and actionable recommendations
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <Activity className="h-5 w-5 text-cyan-400" />
                </div>
                <h3 className="font-semibold text-white">Data Validation</h3>
              </div>
              <p className="text-sm text-white/60">
                Automatic quality checks, missing value handling, outlier screening
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Upload Card */}
        <Card className="mb-8 bg-white/5 border-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">Upload Financial Data</CardTitle>
            <CardDescription className="text-white/60">
              Upload a CSV file with financial data (minimum 24 months recommended)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                isDragging
                  ? 'border-white/50 bg-white/10'
                  : 'border-white/20 hover:border-white/40'
              }`}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
                disabled={isLoading}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-4">
                  {file ? (
                    <>
                      <FileSpreadsheet className="h-16 w-16 text-white" />
                      <div>
                        <p className="font-semibold text-lg text-white">{file.name}</p>
                        <p className="text-sm text-white/60">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      {!isLoading && (
                        <Button size="sm" variant="glass" type="button">
                          Change File
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Upload className="h-16 w-16 text-white/60" />
                      <div>
                        <p className="font-semibold text-lg text-white">Drop your CSV file here</p>
                        <p className="text-sm text-white/60">or click to browse</p>
                      </div>
                    </>
                  )}
                </div>
              </label>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-md backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400" />
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
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white/5 border-white/10 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white">Analysis Persona</CardTitle>
              <CardDescription className="text-white/60">
                Choose the AI persona for narrative generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={persona} onValueChange={(v) => setPersona(v as PersonaMode)} disabled={isLoading}>
                <SelectTrigger id="persona">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="finance_guardian">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-400" />
                      <span>Finance Guardian</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="financial_storyteller">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-400" />
                      <span>Financial Storyteller</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="space-y-2">
                <div className="flex items-start gap-2 p-3 bg-white/5 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white">Finance Guardian</p>
                    <p className="text-xs text-white/60">
                      Conservative, risk-focused analysis with technical details and operational recommendations
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 bg-white/5 rounded-lg">
                  <Sparkles className="h-5 w-5 text-purple-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white">Financial Storyteller</p>
                    <p className="text-xs text-white/60">
                      Executive narrative with stakeholder-friendly language and strategic positioning
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white">Forecast Metric</CardTitle>
              <CardDescription className="text-white/60">
                Select primary metric for predictive forecasting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={metric} onValueChange={(v) => setMetric(v as ForecastMetric)} disabled={isLoading}>
                <SelectTrigger id="metric">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                      <span>Revenue</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="expenses">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-red-400" />
                      <span>Expenses</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="profit">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-400" />
                      <span>Profit</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="cash_flow">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-cyan-400" />
                      <span>Cash Flow</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-sm text-white/70">
                  <strong className="text-white">Selected:</strong> {metric.replace('_', ' ').toUpperCase()}
                </p>
                <p className="text-xs text-white/60 mt-1">
                  The system will generate 3-month forecasts using Prophet & AutoARIMA models
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generate Button */}
        <Card className="bg-gradient-to-r from-white/10 to-white/5 border-white/20 backdrop-blur-md">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-lg">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Ready to Generate Report</h3>
                  <p className="text-sm text-white/60">
                    Complete analysis takes 5-10 seconds
                  </p>
                </div>
              </div>
              <Button
                onClick={handleGenerateReport}
                disabled={!file || isLoading}
                size="sm"
                className="gap-2 min-w-[200px]"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Section */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                What's Included
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-white/70 rounded-full" />
                  Complete KPI dashboard with 8+ metrics
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-white/70 rounded-full" />
                  Interactive forecast chart with confidence intervals
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-white/70 rounded-full" />
                  Anomaly detection table with severity levels
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-white/70 rounded-full" />
                  Profit driver analysis with SHAP scores
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-white/70 rounded-full" />
                  AI-generated narratives and recommendations
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-white/70 rounded-full" />
                  Raw data preview for verification
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-400" />
                Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-white/70 rounded-full" />
                  Upload CSV with at least 24 months of data
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-white/70 rounded-full" />
                  Include columns: date, revenue, expenses
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-white/70 rounded-full" />
                  Use consistent date formats (YYYY-MM-DD)
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-white/70 rounded-full" />
                  Choose Finance Guardian for risk analysis
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-white/70 rounded-full" />
                  Choose Storyteller for board presentations
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-white/70 rounded-full" />
                  Review generated report in Insights page
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
