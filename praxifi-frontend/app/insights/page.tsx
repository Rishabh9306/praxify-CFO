'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/lib/app-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CorrelationHeatmap } from '@/components/CorrelationHeatmap';
import { 
  MessageSquare, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  DollarSign, 
  ArrowRight,
  BarChart3,
  PieChart,
  Activity,
  Target,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lightbulb,
  Brain,
  Database,
  LineChart as LineChartIcon,
  Grid3x3,
  Download
} from 'lucide-react';
import { generateServerSidePDF } from '@/lib/pdf-generator-server';
import { sendReportEmail } from '@/lib/email-service';
import { EmailReportDialog } from '@/components/EmailReportDialog';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  ScatterChart,
  Scatter,
  ComposedChart
} from 'recharts';

// Color palette for charts
const COLORS = ['#FFC700', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const SEVERITY_COLORS = {
  critical: '#dc2626',
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
  info: '#6366f1'
};

interface KPICardProps {
  title: string;
  value: string | number;
  icon: any;
  trend?: number;
  suffix?: string;
  isCurrency?: boolean;
}

const KPICard = ({ title, value, icon: Icon, trend, suffix = '', isCurrency = false }: KPICardProps) => {
  const displayValue = typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value;
  
  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardDescription className="text-white/70 text-sm font-medium">{title}</CardDescription>
          <div className="p-2 bg-primary/20 rounded-lg">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              {isCurrency && <span className="text-xl font-bold text-white">$</span>}
              <p className="text-3xl font-bold text-white">{displayValue}</p>
              {suffix && <span className="text-sm text-white/70 ml-1">{suffix}</span>}
            </div>
            {trend !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {trend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span>{Math.abs(trend).toFixed(2)}%</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface SectionHeaderProps {
  icon: any;
  title: string;
  description: string;
}

const SectionHeader = ({ icon: Icon, title, description }: SectionHeaderProps) => (
  <div className="mb-6">
    <div className="flex items-center gap-3 mb-2">
      <div className="p-2 bg-primary/20 rounded-lg">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-white">{title}</h2>
    </div>
    <p className="text-white/60 ml-11">{description}</p>
  </div>
);

export default function InsightsPage() {
  const router = useRouter();
  const { fullReportData, uploadedFile, uploadConfig, setAgentData, addToSessionHistory } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    if (!fullReportData) {
      router.push('/mvp/static-report');
    }
  }, [fullReportData, router]);

  const handleSwitchToChat = async () => {
    if (!uploadedFile || !uploadConfig) {
      router.push('/mvp/static-report');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('persona', uploadConfig.persona);
      formData.append('forecast_metric', uploadConfig.forecast_metric);
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
      setAgentData(data);

      addToSessionHistory({
        session_id: data.session_id,
        timestamp: new Date().toISOString(),
        file_name: uploadedFile.name,
        last_query: 'Give me a comprehensive summary of this financial data',
        data,
      });

      router.push('/chat');
    } catch (err) {
      console.error('Failed to launch AI chat:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!fullReportData) return;
    
    // Show email dialog instead of directly downloading
    setShowEmailDialog(true);
  };

  const handleDirectDownload = async () => {
    if (!fullReportData) return;
    
    setIsGeneratingPDF(true);
    
    try {
      const report = (fullReportData as any).full_analysis_report || fullReportData;
      const mode = report.dashboard_mode || 'finance_guardian';
      
      console.log('🚀 Generating PDF for direct download...');
      
      // Generate and download PDF directly
      await generateServerSidePDF(report, mode, false);
      
      console.log('✅ PDF downloaded successfully!');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSendEmail = async (email: string) => {
    if (!fullReportData) return;
    
    setIsSendingEmail(true);
    
    try {
      const report = (fullReportData as any).full_analysis_report || fullReportData;
      const mode = report.dashboard_mode || 'finance_guardian';
      const reportDate = new Date().toISOString().split('T')[0];
      
      console.log('🚀 Generating PDF for email...');
      
      // Generate PDF as Blob
      const pdfBlob = await generateServerSidePDF(report, mode, true);
      
      if (!pdfBlob) {
        throw new Error('Failed to generate PDF');
      }
      
      console.log('📧 Sending email to:', email);
      
      // Send email
      const result = await sendReportEmail({
        to: email,
        pdfBlob,
        reportMode: mode,
        reportDate,
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send email');
      }
      
      console.log('✅ Email sent successfully!');
      alert('✅ Report sent successfully! Check your inbox.');
      setShowEmailDialog(false);
      
    } catch (error) {
      console.error('Error sending report:', error);
      alert(`Failed to send report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (!fullReportData) {
    return null;
  }

  const report = (fullReportData as any).full_analysis_report || fullReportData;

  // Debug: Log correlation data availability
  console.log('🔍 Correlation Debug:', {
    hasCorrelations: !!report.correlations,
    hasCorrelationMatrix: !!report.correlations?.correlation_matrix,
    hasColumns: !!report.correlations?.correlation_matrix?.columns,
    hasValues: !!report.correlations?.correlation_matrix?.values,
    columnsLength: report.correlations?.correlation_matrix?.columns?.length,
    valuesLength: report.correlations?.correlation_matrix?.values?.length
  });

  // Prepare KPIs data
  const kpis = report.kpis || {};
  
  // Prepare forecast chart data for all metrics
  const forecastMetrics = ['revenue', 'expenses', 'profit', 'cashflow', 'dso', 'dpo', 'cash_conversion_cycle', 
    'ar', 'ap', 'working_capital', 'profit_margin', 'expense_ratio', 'debt_to_equity_ratio', 'growth_rate'];
  
  const prepareForecastData = (metricName: string) => {
    const data = report.forecast_chart?.[metricName];
    if (!data) return [];
    return data.map((item: any) => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      forecast: item.predicted,
      lower: item.lower,
      upper: item.upper,
    }));
  };

  // Prepare profit drivers
  const profitDriverData = report.profit_drivers?.feature_attributions?.map((driver: any) => ({
    category: driver.feature.replace(/_/g, ' ').toUpperCase(),
    impact: driver.contribution_score,
  })) || [];

  // Prepare correlation data
  const correlationData = report.correlation_insights?.slice(0, 10).map((corr: any) => ({
    name: `${corr.metric_a} vs ${corr.metric_b}`,
    correlation: (corr.correlation * 100).toFixed(2),
    value: Math.abs(corr.correlation * 100),
  })) || [];

  // Prepare enhanced KPIs data
  const enhancedKPIs = report.enhanced_kpis || {};

  // Prepare model health data
  const modelHealthData = Object.entries(report.model_health_report || {}).map(([key, value]: [string, any]) => ({
    metric: key.replace(/_/g, ' ').toUpperCase(),
    model: value.best_model_selected || 'N/A',
    status: value.status,
  }));

  // Prepare regional/departmental breakdowns
  const revenueByRegionRaw = report.visualizations?.breakdowns?.revenue_by_region || [];
  const revenueByRegion = revenueByRegionRaw.map((item: any) => ({
    name: item.region || item.name,
    value: item.total_revenue || item.value || 0
  }));

  const expensesByDepartmentRaw = report.visualizations?.breakdowns?.expenses_by_department || [];
  const expensesByDepartment = expensesByDepartmentRaw.map((item: any) => ({
    name: item.department || item.name,
    value: item.total_expenses || item.value || 0
  }));

  const profitByRegionRaw = report.visualizations?.breakdowns?.profit_by_region || [];
  const profitByRegion = profitByRegionRaw.map((item: any) => ({
    name: item.region || item.name,
    value: item.total_profit || item.value || 0
  }));

  // Prepare time series data
  const revenueTrendRaw = report.visualizations?.time_series?.revenue_rolling_avg || [];
  const revenueTrend = revenueTrendRaw.map((item: any) => ({
    date: item.date,
    actual: item.actual || 0,
    rolling_avg: item.rolling_avg || 0
  }));

  const profitTrendRaw = report.visualizations?.time_series?.profit_rolling_avg || [];
  const profitTrend = profitTrendRaw.map((item: any) => ({
    date: item.date,
    actual: item.actual || 0,
    rolling_avg: item.rolling_avg || 0
  }));

  const cashflowTrendRaw = report.visualizations?.time_series?.cashflow_trend || [];
  const cashflowTrend = cashflowTrendRaw.map((item: any) => ({
    date: item.date,
    value: item.value || item.cashflow || 0
  }));

  // Debug: Log breakdown data
  console.log('Breakdown Data:', {
    revenueByRegion: revenueByRegion.length,
    expensesByDepartment: expensesByDepartment.length,
    profitByRegion: profitByRegion.length,
    revenueTrend: revenueTrend.length,
    sampleRevenue: revenueByRegion[0],
    sampleExpense: expensesByDepartment[0]
  });

  // Prepare diagnostics data
  const topRevenueSpikes = report.tables?.diagnostics?.top_revenue_spikes || [];
  const topExpenseSpikes = report.tables?.diagnostics?.top_expense_spikes || [];
  const highRiskPeriods = report.tables?.diagnostics?.high_risk_periods || [];

  return (
    <div className="min-h-screen bg-black pt-20 pb-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-4 backdrop-blur-md">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium font-mono text-white">
                {report.dashboard_mode?.replace(/_/g, ' ').toUpperCase() || 'FINANCE DASHBOARD'}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-2 text-white">
              Comprehensive Financial Analysis
            </h1>
            <p className="text-white/70 text-lg">
              Generated: {new Date(report.metadata?.generated_at || Date.now()).toLocaleString()} | 
              Data Period: {report.metadata?.data_start_date} to {report.metadata?.data_end_date}
            </p>
          </div>
          <Button 
            onClick={handleSwitchToChat} 
            disabled={isLoading} 
            className="gap-2 bg-primary text-black hover:bg-primary/90"
          >
            <MessageSquare className="h-4 w-4" />
            {isLoading ? 'Launching...' : 'AI Chat'}
          </Button>
        </div>

        {/* AI Summary Section */}
        {((fullReportData as any).ai_response || (fullReportData as any).full_analysis_report?.narratives?.narrative) && (() => {
          // Inline markdown parser for bold, italic, code
          const parseInline = (text: string) => {
            const parts: (string | React.JSX.Element)[] = [];
            const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
            let lastIndex = 0;
            let match;
            let keyCounter = 0;
            
            while ((match = regex.exec(text)) !== null) {
              if (match.index > lastIndex) {
                parts.push(text.slice(lastIndex, match.index));
              }
              
              if (match[2]) {
                parts.push(<strong key={keyCounter++} className="font-semibold text-white">{match[2]}</strong>);
              } else if (match[3]) {
                parts.push(<em key={keyCounter++} className="italic text-white/90">{match[3]}</em>);
              } else if (match[4]) {
                parts.push(<code key={keyCounter++} className="px-1 py-0.5 bg-white/10 rounded text-xs font-mono text-primary">{match[4]}</code>);
              }
              
              lastIndex = regex.lastIndex;
            }
            
            if (lastIndex < text.length) {
              parts.push(text.slice(lastIndex));
            }
            
            return parts.length > 0 ? parts : text;
          };
          
          // Markdown parser function
          const parseMarkdown = (text: string) => {
            const lines = text.split('\n');
            const elements: React.JSX.Element[] = [];
            
            lines.forEach((line, idx) => {
              // Skip empty lines with minimal spacing
              if (line.trim() === '') {
                elements.push(<div key={idx} className="h-1" />);
                return;
              }
              
              // Parse headers
              if (line.startsWith('### ')) {
                elements.push(
                  <h3 key={idx} className="text-sm font-semibold text-white mt-2 mb-0.5">
                    {line.replace(/^### /, '')}
                  </h3>
                );
                return;
              }
              if (line.startsWith('## ')) {
                elements.push(
                  <h2 key={idx} className="text-base font-bold text-white mt-2.5 mb-1 border-b border-primary/20 pb-0.5">
                    {line.replace(/^## /, '')}
                  </h2>
                );
                return;
              }
              if (line.startsWith('# ')) {
                elements.push(
                  <h1 key={idx} className="text-lg font-bold text-white mt-3 mb-1">
                    {line.replace(/^# /, '')}
                  </h1>
                );
                return;
              }
              
              // Parse bullet points
              if (line.trim().match(/^[-•*]\s/)) {
                const text = line.trim().replace(/^[-•*]\s/, '');
                const parsed = parseInline(text);
                elements.push(
                  <div key={idx} className="flex items-start gap-2 my-0.5">
                    <span className="text-primary mt-0.5 text-xs flex-shrink-0">•</span>
                    <span className="text-sm text-white/80 leading-snug">{parsed}</span>
                  </div>
                );
                return;
              }
              
              // Regular text with inline formatting
              const parsed = parseInline(line);
              elements.push(
                <p key={idx} className="text-sm text-white/80 my-0.5 leading-snug">
                  {parsed}
                </p>
              );
            });
            
            return elements;
          };
          
          const report = (fullReportData as any).full_analysis_report || {};
          const dashboardMode = report.dashboard_mode || '';
          const isStorytellerMode = dashboardMode === 'financial_storyteller';
          
          // For storyteller mode, use narrative from full_analysis_report.narratives.narrative
          if (isStorytellerMode && report.narratives?.narrative) {
            const narrativeText = report.narratives.narrative;
            
            return (
              <Card className="mb-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30 backdrop-blur-md">
                <CardContent className="pt-2 pb-2 px-3">
                  <div className="flex items-center gap-2 mb-2 pb-1 border-b border-white/10">
                    <div className="p-1.5 bg-blue-500/20 rounded-lg">
                      <Brain className="h-4 w-4 text-blue-400" />
                    </div>
                    <h3 className="text-sm font-bold text-white">AI Summary</h3>
                  </div>
                  
                  <div className="space-y-0">
                    {parseMarkdown(narrativeText)}
                  </div>
                </CardContent>
              </Card>
            );
          }
          
          // For guardian mode, use existing logic with ai_response
          const aiSummaryText = (fullReportData as any).ai_response as string;
          const lines = aiSummaryText.split('\n');
          
          // Parse content into sections based on ## headers
          const allSections: { title: string; content: string[] }[] = [];
          let currentSection: { title: string; content: string[] } | null = null;
          
          lines.forEach((line) => {
            if (line.startsWith('## ')) {
              if (currentSection) {
                allSections.push(currentSection);
              }
              currentSection = { title: line.replace(/^## /, ''), content: [] };
            } else if (currentSection) {
              currentSection.content.push(line);
            }
          });
          
          if (currentSection) {
            allSections.push(currentSection);
          }
          
          // Organize sections by column
          const leftSectionTitles = ['Financial Health Assessment', 'Critical KPIs'];
          const rightSectionTitles = ['Operational Insights', 'Action Items'];
          const bottomSectionTitles = ['Model Performance'];
          
          const leftSections = allSections.filter(s => 
            leftSectionTitles.some(title => s.title.toLowerCase().includes(title.toLowerCase()))
          );
          const rightSections = allSections.filter(s => 
            rightSectionTitles.some(title => s.title.toLowerCase().includes(title.toLowerCase()))
          );
          const bottomSections = allSections.filter(s => 
            bottomSectionTitles.some(title => s.title.toLowerCase().includes(title.toLowerCase()))
          );
          
          const renderLine = (line: string, idx: number, forcePoints = false) => {
            // Empty lines
            if (line.trim() === '') {
              return <div key={idx} className="h-0.5" />;
            }
            
            // Parse markdown headers (not affected by forcePoints)
            if (!forcePoints && line.startsWith('# ')) {
              return <h1 key={idx} className="text-base font-bold text-white mt-2 mb-1">{line.replace(/^# /, '')}</h1>;
            }
            if (!forcePoints && line.startsWith('### ')) {
              return <h3 key={idx} className="text-sm font-semibold text-white mt-1.5 mb-0.5">{line.replace(/^### /, '')}</h3>;
            }
            
            // For operational insights/action items, treat ALL non-empty lines as bullet points
            if (forcePoints && line.trim() !== '') {
              // Remove leading "- " or "• " if present
              let text = line.trim();
              if (text.startsWith('- ') || text.startsWith('• ')) {
                text = text.replace(/^[•\-]\s*/, '');
              }
              
              // Parse bold text
              const boldParsed = text.split(/(\*\*.*?\*\*)/).map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
                }
                return part;
              });
              
              return (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5 text-xs flex-shrink-0">•</span>
                  <span className="text-sm text-white/80">{boldParsed}</span>
                </div>
              );
            }
            
            // Parse bullet points (for non-forcePoints sections)
            if (line.startsWith('- ') || line.startsWith('• ')) {
              const text = line.replace(/^[•\-]\s*/, '');
              const boldParsed = text.split(/(\*\*.*?\*\*)/).map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
                }
                return part;
              });
              
              return (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5 text-xs flex-shrink-0">•</span>
                  <span className="text-sm text-white/80">{boldParsed}</span>
                </div>
              );
            }
            
            // Parse bold text for regular content
            const boldParsed = line.split(/(\*\*.*?\*\*)/).map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
              }
              return part;
            });
            // Regular text
            return <p key={idx} className="text-sm text-white/80">{boldParsed}</p>;
          };
          
          const renderSection = (section: { title: string; content: string[] }, sectionIdx: number, compact = false, asPoints = false) => (
            <div key={sectionIdx} className={compact ? "mb-2.5" : "mb-3"}>
              <h2 className="text-sm font-bold text-white mb-1 pb-0.5 border-b border-primary/20 flex items-center gap-1.5">
                <span className="text-primary">▸</span>
                {section.title}
              </h2>
              <div className={compact ? "space-y-0.5 mt-1" : "space-y-1 mt-1.5"}>
                {section.content.map((line, lineIdx) => {
                  const key = sectionIdx * 1000 + lineIdx;
                  return renderLine(line, key, asPoints);
                })}
              </div>
            </div>
          );
          
          return (
            <Card className="mb-6 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30 backdrop-blur-md">
              <CardContent className="pt-2 pb-2">
                <div className="flex items-center gap-2.5 mb-2 pb-1.5 border-b border-white/10">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Brain className="h-4 w-4 text-blue-400" />
                  </div>
                  <h3 className="text-base font-bold text-white">AI Summary</h3>
                </div>
                
                {/* Two Column Layout */}
                <div className="grid md:grid-cols-2 gap-5 mb-2">
                  {/* Left Column: Financial Health & KPIs */}
                  <div className="space-y-2">
                    {leftSections.map((section, idx) => renderSection(section, idx, true, false))}
                  </div>
                  
                  {/* Right Column: Operational Insights & Action Items as bullet points */}
                  <div className="space-y-2">
                    {rightSections.map((section, idx) => renderSection(section, idx + 100, true, true))}
                  </div>
                </div>
                
                {/* Bottom Section: Model Performance */}
                {bottomSections.length > 0 && (
                  <div className="border-t border-white/10 pt-1.5">
                    {bottomSections.map((section, idx) => renderSection(section, idx + 200))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })()}

        {/* Key KPIs Section */}
        <SectionHeader 
          icon={Target} 
          title="Critical KPIs" 
          description="Real-time financial health indicators"
        />
        
        <div id="kpi-section" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <KPICard
            title="Total Revenue"
            value={kpis.total_revenue || 0}
            icon={DollarSign}
            isCurrency={true}
            trend={kpis.growth_rate}
          />
          <KPICard
            title="Total Expenses"
            value={kpis.total_expenses || 0}
            icon={TrendingDown}
            isCurrency={true}
          />
          <KPICard
            title="Profit Margin"
            value={((kpis.profit_margin || 0) * 100).toFixed(2)}
            icon={Target}
            suffix="%"
          />
          <KPICard
            title="Cashflow"
            value={kpis.cashflow || 0}
            icon={Activity}
            isCurrency={true}
          />
          <KPICard
            title="Growth Rate"
            value={kpis.growth_rate?.toFixed(2) || 0}
            icon={TrendingUp}
            suffix="%"
          />
          <KPICard
            title="Forecast Accuracy"
            value={kpis.forecast_accuracy?.toFixed(2) || 0}
            icon={Brain}
            suffix="%"
          />
          <KPICard
            title="Financial Health Score"
            value={kpis.financial_health_score?.toFixed(2) || 0}
            icon={CheckCircle2}
            suffix="/100"
          />
          <KPICard
            title="DSO (Days)"
            value={kpis.dso?.toFixed(2) || 0}
            icon={Activity}
            suffix="days"
          />
        </div>

        {/* Enhanced KPIs */}
        {Object.keys(enhancedKPIs).length > 0 && (
          <>
            <SectionHeader 
              icon={BarChart3} 
              title="Enhanced Metrics" 
              description="Advanced financial indicators"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              {Object.entries(enhancedKPIs).map(([key, value]: [string, any]) => {
                const isCurrency = key.includes('capital') || key === 'free_cash_flow';
                const isRatio = key.includes('ratio') || key.includes('turnover');
                const isPercentage = key.includes('efficiency') || key === 'expense_ratio';
                
                return (
                  <KPICard
                    key={key}
                    title={key.replace(/_/g, ' ').toUpperCase()}
                    value={typeof value === 'number' ? value : 0}
                    icon={Activity}
                    isCurrency={isCurrency}
                    suffix={isPercentage ? '%' : isRatio ? 'x' : ''}
                  />
                );
              })}
            </div>
          </>
        )}

        {/* Download PDF Button */}
        <div className="flex justify-end mb-6">
          <Button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="bg-primary hover:bg-primary/90 text-black font-semibold"
          >
            <Download className="h-4 w-4 mr-2" />
            {isGeneratingPDF ? 'Generating PDF...' : 'Download Full Report PDF'}
          </Button>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-12">
          <TabsList className="bg-white/5 border border-white/10 backdrop-blur-md mb-6">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              <Grid3x3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="forecasts" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              <LineChartIcon className="h-4 w-4 mr-2" />
              Forecasts
            </TabsTrigger>
            <TabsTrigger value="breakdowns" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              <PieChart className="h-4 w-4 mr-2" />
              Breakdowns
            </TabsTrigger>
            <TabsTrigger value="diagnostics" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Diagnostics
            </TabsTrigger>
            <TabsTrigger value="correlations" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              <Activity className="h-4 w-4 mr-2" />
              Correlations
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Profit Drivers */}
            {profitDriverData.length > 0 && (
              <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Target className="h-5 w-5 text-primary" />
                    Profit Drivers Analysis
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    {report.profit_drivers?.insight || 'Key factors impacting profitability'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={profitDriverData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis type="number" stroke="#fff" />
                      <YAxis type="category" dataKey="category" stroke="#fff" width={150} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0,0,0,0.9)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                      <Bar dataKey="impact" fill="#FFC700" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Correlation Insights */}
            {correlationData.length > 0 && (
              <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Activity className="h-5 w-5 text-primary" />
                    Correlation Analysis
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    Relationship strength between key metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={correlationData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" stroke="#fff" angle={-45} textAnchor="end" height={100} />
                      <YAxis stroke="#fff" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0,0,0,0.9)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                      <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Anomalies Table */}
            {report.anomalies_table && report.anomalies_table.length > 0 && (
              <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur-md shadow-2xl">
                <CardHeader className="border-b border-white/10 pb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-3 text-white text-2xl">
                        <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-lg">
                          <AlertTriangle className="h-6 w-6 text-white" />
                        </div>
                        Anomaly Detection Dashboard
                      </CardTitle>
                      <CardDescription className="text-white/70 mt-2 text-sm">
                        🤖 AI-powered 6-algorithm ensemble • Real-time confidence scoring • Multi-metric analysis
                      </CardDescription>
                    </div>
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-xs text-white/70 font-medium">Live Detection</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="relative p-4 bg-gradient-to-br from-slate-500/20 to-slate-600/10 border border-white/20 rounded-xl overflow-hidden group hover:scale-105 transition-transform">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform" />
                      <p className="text-xs text-white/60 mb-1 font-medium uppercase tracking-wider">Total Detected</p>
                      <p className="text-3xl font-black text-white relative z-10">{report.anomalies_table.length}</p>
                      <div className="mt-1 text-[10px] text-white/40">anomalies found</div>
                    </div>
                    <div className="relative p-4 bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 rounded-xl overflow-hidden group hover:scale-105 transition-transform shadow-lg shadow-red-500/10">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform" />
                      <p className="text-xs text-red-300 mb-1 font-medium uppercase tracking-wider">Critical</p>
                      <p className="text-3xl font-black text-red-400 relative z-10">
                        {report.anomalies_table.filter((a: any) => 
                          (a.severity_level || a.severity)?.toLowerCase() === 'critical'
                        ).length}
                      </p>
                      <div className="mt-1 text-[10px] text-red-300/60">requires immediate action</div>
                    </div>
                    <div className="relative p-4 bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-xl overflow-hidden group hover:scale-105 transition-transform shadow-lg shadow-orange-500/10">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform" />
                      <p className="text-xs text-orange-300 mb-1 font-medium uppercase tracking-wider">High Priority</p>
                      <p className="text-3xl font-black text-orange-400 relative z-10">
                        {report.anomalies_table.filter((a: any) => 
                          (a.severity_level || a.severity)?.toLowerCase() === 'high'
                        ).length}
                      </p>
                      <div className="mt-1 text-[10px] text-orange-300/60">needs attention soon</div>
                    </div>
                    <div className="relative p-4 bg-gradient-to-br from-blue-500/20 to-purple-600/10 border border-blue-500/30 rounded-xl overflow-hidden group hover:scale-105 transition-transform shadow-lg shadow-blue-500/10">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform" />
                      <p className="text-xs text-blue-300 mb-1 font-medium uppercase tracking-wider">Avg Confidence</p>
                      <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 relative z-10">
                        {report.anomalies_table[0]?.confidence 
                          ? `${(report.anomalies_table.reduce((sum: number, a: any) => sum + (a.confidence || 0), 0) / report.anomalies_table.length * 100).toFixed(0)}%`
                          : 'N/A'
                        }
                      </p>
                      <div className="mt-1 text-[10px] text-blue-300/60">ensemble accuracy</div>
                    </div>
                  </div>

                  {/* Anomaly Cards */}
                  <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                    {[...report.anomalies_table]
                      .sort((a: any, b: any) => {
                        // Sort by severity_level first (critical > high > medium > low > info)
                        const severityOrder: { [key: string]: number } = { 
                          'critical': 0, 
                          'high': 1, 
                          'medium': 2, 
                          'low': 3, 
                          'info': 4 
                        };
                        const aSeverity = (a.severity_level || a.severity || 'low').toLowerCase().trim();
                        const bSeverity = (b.severity_level || b.severity || 'low').toLowerCase().trim();
                        const aOrder = severityOrder[aSeverity] !== undefined ? severityOrder[aSeverity] : 5;
                        const bOrder = severityOrder[bSeverity] !== undefined ? severityOrder[bSeverity] : 5;
                        const severityDiff = aOrder - bOrder;
                        
                        // If same severity, sort by confidence (higher first)
                        if (severityDiff === 0) {
                          return (b.confidence || 0) - (a.confidence || 0);
                        }
                        return severityDiff;
                      })
                      .map((anomaly: any, idx: number) => {
                        const severity = (anomaly.severity_level || anomaly.severity || 'low').toLowerCase();
                        const confidence = anomaly.confidence || 0;
                        const hasEnsembleData = anomaly.detection_methods || anomaly.algorithms_agreed;
                        
                        return (
                          <div 
                            key={idx} 
                            className="relative p-5 border rounded-xl bg-gradient-to-br from-white/5 to-white/3 backdrop-blur-sm"
                            style={{
                              borderLeftWidth: '4px',
                              borderColor: `${SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS]}30`,
                              borderLeftColor: SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS],
                              boxShadow: `0 2px 10px ${SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS]}10`
                            }}
                          >
                            {/* Header Row */}
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="p-2.5 rounded-lg"
                                  style={{ 
                                    backgroundColor: `${SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS]}20`
                                  }}
                                >
                                  <AlertTriangle 
                                    className="h-4 w-4" 
                                    style={{ 
                                      color: SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS]
                                    }}
                                  />
                                </div>
                                <div>
                                  <p className="font-bold text-white text-lg tracking-tight">
                                    {anomaly.metric?.replace(/_/g, ' ').toUpperCase()}
                                  </p>
                                  <p className="text-xs text-white/50 mt-0.5">
                                    {anomaly.date}
                                  </p>
                                </div>
                              </div>
                              <span 
                                className="text-xs px-3 py-1.5 rounded-lg font-bold uppercase tracking-wide"
                                style={{ 
                                  backgroundColor: `${SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS]}25`,
                                  color: SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS],
                                  border: `1.5px solid ${SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS]}40`
                                }}
                              >
                                {severity}
                              </span>
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="p-4 bg-gradient-to-br from-white/10 to-white/5 rounded-xl border border-white/20 hover:border-white/30 transition-colors">
                                <p className="text-xs text-white/60 mb-1.5 font-medium uppercase tracking-wide">Actual Value</p>
                                <p className="text-2xl font-black text-white">
                                  {typeof anomaly.value === 'number' 
                                    ? `$${anomaly.value.toLocaleString()}` 
                                    : anomaly.value}
                                </p>
                              </div>
                              <div className="p-4 bg-gradient-to-br from-white/5 to-white/3 rounded-xl border border-white/10 hover:border-white/20 transition-colors">
                                <p className="text-xs text-white/60 mb-1.5 font-medium uppercase tracking-wide">Expected Value</p>
                                <p className="text-2xl font-black text-white/70">
                                  {typeof anomaly.expected_value_mean === 'number'
                                    ? `$${anomaly.expected_value_mean.toLocaleString()}`
                                    : anomaly.expected_value_mean || 'N/A'}
                                </p>
                              </div>
                            </div>

                            {/* Deviation Bar */}
                            <div className="mb-4">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-white/60 font-medium uppercase tracking-wide">Deviation Impact</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-black" style={{
                                    color: SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS]
                                  }}>
                                    {(anomaly.deviation_pct || anomaly.deviation_percent || 0).toFixed(1)}%
                                  </span>
                                  {anomaly.direction && (
                                    <span 
                                      className="px-2 py-1 rounded-lg text-xs font-bold"
                                      style={{
                                        backgroundColor: `${SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS]}20`,
                                        color: SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS]
                                      }}
                                    >
                                      {anomaly.direction === 'spike' ? '↑ SPIKE' : '↓ DROP'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="relative w-full h-3 bg-white/10 rounded-full overflow-hidden shadow-inner">
                                <div 
                                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"
                                />
                                <div 
                                  className="h-full rounded-full transition-all duration-700 shadow-lg"
                                  style={{ 
                                    width: `${Math.min(Math.abs(anomaly.deviation_pct || anomaly.deviation_percent || 0), 100)}%`,
                                    background: `linear-gradient(90deg, ${SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS]} 0%, ${SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS]}80 100%)`,
                                    boxShadow: `0 0 15px ${SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS]}60`
                                  }}
                                />
                              </div>
                            </div>

                            {/* Ensemble Detection Info */}
                            {hasEnsembleData && (
                              <div className="p-4 bg-gradient-to-r from-blue-500/15 to-purple-500/10 border border-blue-500/30 rounded-xl mb-4 backdrop-blur-sm">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg shadow-lg">
                                      <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    </div>
                                    <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">
                                      Ensemble Detection
                                    </span>
                                  </div>
                                  {anomaly.algorithms_agreed && (
                                    <span className="px-3 py-1 bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-blue-300 rounded-lg border border-blue-400/40 text-sm font-black font-mono shadow-lg">
                                      {anomaly.algorithms_agreed}
                                    </span>
                                  )}
                                </div>
                                {anomaly.detection_methods && (
                                  <div className="flex flex-wrap gap-2">
                                    {anomaly.detection_methods.map((method: string, i: number) => (
                                      <span 
                                        key={i}
                                        className="text-xs px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 rounded-lg border border-blue-500/40 font-mono font-medium hover:from-blue-500/30 hover:to-purple-500/30 transition-all shadow-sm"
                                      >
                                        {method.replace(/_/g, '-')}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Description/Reason */}
                            {(anomaly.reason || anomaly.description) && (
                              <div className="p-4 bg-gradient-to-br from-white/10 to-white/5 rounded-xl border border-white/20 backdrop-blur-sm">
                                <div className="flex items-start gap-3">
                                  <div className="mt-1 p-1.5 bg-yellow-500/20 rounded-lg">
                                    <svg className="h-4 w-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </div>
                                  <p className="text-sm text-white/80 leading-relaxed flex-1">
                                    {anomaly.reason || anomaly.description}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Context Info */}
                            {anomaly.context && Object.keys(anomaly.context).length > 0 && (
                              <div className="mt-4 pt-4 border-t border-white/10">
                                <p className="text-xs text-white/50 mb-2.5 font-medium uppercase tracking-wide">Analysis Context</p>
                                <div className="flex flex-wrap gap-2">
                                  {anomaly.context.volatility !== undefined && (
                                    <span className="text-xs px-3 py-1.5 bg-gradient-to-r from-purple-500/15 to-pink-500/10 text-purple-300 rounded-lg border border-purple-500/30 font-medium shadow-sm">
                                      📊 Volatility: {(anomaly.context.volatility * 100).toFixed(0)}%
                                    </span>
                                  )}
                                  {anomaly.context.multiplier !== undefined && (
                                    <span className="text-xs px-3 py-1.5 bg-gradient-to-r from-purple-500/15 to-pink-500/10 text-purple-300 rounded-lg border border-purple-500/30 font-medium shadow-sm">
                                      🎯 Threshold: {anomaly.context.multiplier.toFixed(1)}×
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Anomalies Detected State */}
            {report.anomalies_table && report.anomalies_table.length === 0 && (
              <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10 backdrop-blur-md shadow-2xl">
                <CardHeader className="border-b border-white/10 pb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-3 text-white text-2xl">
                        <div className="p-2 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg shadow-lg">
                          <AlertTriangle className="h-6 w-6 text-white" />
                        </div>
                        Anomaly Detection Dashboard
                      </CardTitle>
                      <CardDescription className="text-white/70 mt-2 text-sm">
                        🤖 AI-powered 6-algorithm ensemble • Real-time confidence scoring • Multi-metric analysis
                      </CardDescription>
                    </div>
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-xs text-white/70 font-medium">All Clear</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {/* Empty State Message */}
                  <div className="flex flex-col items-center justify-center py-16 px-8">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl" />
                      <div className="relative p-6 bg-gradient-to-br from-green-500/20 to-emerald-600/10 border border-green-500/30 rounded-full">
                        <svg 
                          className="h-16 w-16 text-green-400" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                          />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">No Anomalies Detected</h3>
                    <p className="text-white/60 text-center max-w-md mb-6">
                      Your financial data appears healthy and within expected parameters. Our AI ensemble of 6 algorithms found no irregularities in the current dataset.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
                      <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                        <div className="text-2xl font-bold text-green-400 mb-1">✓</div>
                        <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Status</div>
                        <div className="text-sm font-semibold text-white">All Systems Normal</div>
                      </div>
                      <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                        <div className="text-2xl font-bold text-blue-400 mb-1">6</div>
                        <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Algorithms</div>
                        <div className="text-sm font-semibold text-white">Monitoring Active</div>
                      </div>
                      <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                        <div className="text-2xl font-bold text-purple-400 mb-1">0</div>
                        <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Flags</div>
                        <div className="text-sm font-semibold text-white">No Issues Found</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Analyst Key Insights */}
            {(() => {
              // Inline markdown parser for bold, italic, code
              const parseInline = (text: string) => {
                const parts: (string | React.JSX.Element)[] = [];
                const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
                let lastIndex = 0;
                let match;
                let keyCounter = 0;
                
                while ((match = regex.exec(text)) !== null) {
                  if (match.index > lastIndex) {
                    parts.push(text.slice(lastIndex, match.index));
                  }
                  
                  if (match[2]) {
                    parts.push(<strong key={keyCounter++} className="font-semibold text-white">{match[2]}</strong>);
                  } else if (match[3]) {
                    parts.push(<em key={keyCounter++} className="italic text-white/90">{match[3]}</em>);
                  } else if (match[4]) {
                    parts.push(<code key={keyCounter++} className="px-1 py-0.5 bg-white/10 rounded text-xs font-mono text-primary">{match[4]}</code>);
                  }
                  
                  lastIndex = regex.lastIndex;
                }
                
                if (lastIndex < text.length) {
                  parts.push(text.slice(lastIndex));
                }
                
                return parts.length > 0 ? parts : text;
              };
              
              // Markdown parser function
              const parseMarkdown = (text: string) => {
                const lines = text.split('\n');
                const elements: React.JSX.Element[] = [];
                
                lines.forEach((line, idx) => {
                  // Skip empty lines with minimal spacing
                  if (line.trim() === '') {
                    elements.push(<div key={idx} className="h-1" />);
                    return;
                  }
                  
                  // Parse headers
                  if (line.startsWith('### ')) {
                    elements.push(
                      <h3 key={idx} className="text-sm font-semibold text-white mt-2 mb-0.5">
                        {line.replace(/^### /, '')}
                      </h3>
                    );
                    return;
                  }
                  if (line.startsWith('## ')) {
                    elements.push(
                      <h2 key={idx} className="text-base font-bold text-white mt-2.5 mb-1 border-b border-primary/20 pb-0.5">
                        {line.replace(/^## /, '')}
                      </h2>
                    );
                    return;
                  }
                  if (line.startsWith('# ')) {
                    elements.push(
                      <h1 key={idx} className="text-lg font-bold text-white mt-3 mb-1">
                        {line.replace(/^# /, '')}
                      </h1>
                    );
                    return;
                  }
                  
                  // Parse bullet points
                  if (line.trim().match(/^[-•*]\s/)) {
                    const text = line.trim().replace(/^[-•*]\s/, '');
                    const parsed = parseInline(text);
                    elements.push(
                      <div key={idx} className="flex items-start gap-2 my-0.5">
                        <span className="text-primary mt-0.5 text-xs flex-shrink-0">•</span>
                        <span className="text-sm text-white/80 leading-snug">{parsed}</span>
                      </div>
                    );
                    return;
                  }
                  
                  // Regular text with inline formatting
                  const parsed = parseInline(line);
                  elements.push(
                    <p key={idx} className="text-sm text-white/80 my-0.5 leading-snug">
                      {parsed}
                    </p>
                  );
                });
                
                return elements;
              };
              
              const report = (fullReportData as any).full_analysis_report || {};
              const dashboardMode = report.dashboard_mode || '';
              const isStorytellerMode = dashboardMode === 'financial_storyteller';
              
              // For storyteller mode, use ai_response; for guardian mode, use analyst_insights
              if (isStorytellerMode) {
                const aiResponseText = (fullReportData as any).ai_response as string;
                if (!aiResponseText) return null;
                
                return (
                  <Card className="mb-4 bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/30 backdrop-blur-md">
                    <CardContent className="pt-2 pb-2 px-3">
                      <div className="flex items-center gap-2 mb-2 pb-1 border-b border-white/10">
                        <div className="p-1.5 bg-primary/20 rounded-lg">
                          <Lightbulb className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="text-sm font-bold text-white">Analyst Key Insights</h3>
                      </div>
                      
                      <div className="space-y-0">
                        {parseMarkdown(aiResponseText)}
                      </div>
                    </CardContent>
                  </Card>
                );
              } else {
                // Guardian mode - show analyst_insights array
                if (!report.narratives?.analyst_insights || report.narratives.analyst_insights.length === 0) {
                  return null;
                }
                
                return (
                  <Card className="mb-4 bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/30 backdrop-blur-md">
                    <CardContent className="pt-2 pb-2 px-3">
                      <div className="flex items-center gap-2 mb-2 pb-1 border-b border-white/10">
                        <div className="p-1.5 bg-primary/20 rounded-lg">
                          <Lightbulb className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="text-sm font-bold text-white">Analyst Key Insights</h3>
                      </div>
                      
                      <div className="space-y-2">
                        {report.narratives.analyst_insights.map((insight: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                            <div className="mt-0.5 flex-shrink-0">
                              {insight.includes('🚨') || insight.includes('⚠️') ? (
                                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                              ) : insight.includes('✅') ? (
                                <CheckCircle2 className="h-4 w-4 text-green-400" />
                              ) : (
                                <Lightbulb className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <p className="text-sm text-white/90 leading-snug">{insight}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              }
            })()}

            {/* Recommendations */}
            {report.recommendations && report.recommendations.length > 0 && (
              <Card className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border-green-500/30 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    Strategic Recommendations
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    AI-powered action items
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {report.recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <p className="text-white/90">{rec}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Forecasts Tab */}
          <TabsContent value="forecasts" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {forecastMetrics.map((metric) => {
                const data = prepareForecastData(metric);
                if (data.length === 0) return null;

                return (
                  <Card key={metric} className="bg-white/5 border-white/10 backdrop-blur-md">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        {metric.replace(/_/g, ' ').toUpperCase()} Forecast
                      </CardTitle>
                      <CardDescription className="text-white/60">
                        3-month prediction with confidence intervals
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div id={`forecast-chart-${metric}`}>
                        <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="date" stroke="#fff" />
                          <YAxis stroke="#fff" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(0,0,0,0.9)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                          />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="upper" 
                            fill="#FFC700" 
                            fillOpacity={0.1}
                            stroke="none"
                            name="Upper Bound"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="lower" 
                            fill="#FFC700" 
                            fillOpacity={0.1}
                            stroke="none"
                            name="Lower Bound"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="forecast" 
                            stroke="#FFC700" 
                            strokeWidth={3}
                            name="Forecast"
                            dot={{ fill: '#FFC700', r: 5 }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Breakdowns Tab */}
          <TabsContent value="breakdowns" className="space-y-8">
            {/* Show message if no breakdown data */}
            {revenueByRegion.length === 0 && expensesByDepartment.length === 0 && profitByRegion.length === 0 && revenueTrend.length === 0 && (
              <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-white/40 mx-auto mb-4" />
                    <p className="text-white/60 text-lg">No breakdown data available</p>
                    <p className="text-white/40 text-sm mt-2">The uploaded data may not contain regional or departmental information</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Revenue by Region */}
              {revenueByRegion.length > 0 && (
                <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <PieChart className="h-5 w-5 text-primary" />
                      Revenue by Region
                    </CardTitle>
                    <CardDescription className="text-white/60">
                      Geographic distribution ({revenueByRegion.length} regions)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div id="revenue-by-region-chart">
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                          <Pie
                            data={revenueByRegion}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {revenueByRegion.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(0,0,0,0.9)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: any, name: any, props: any) => [
                              `$${Number(value).toLocaleString()}`,
                              props.payload.name
                            ]}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Expenses by Department */}
              {expensesByDepartment.length > 0 && (
                <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Expenses by Department
                    </CardTitle>
                    <CardDescription className="text-white/60">
                      Operational cost breakdown ({expensesByDepartment.length} departments)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div id="expenses-by-department-chart">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={expensesByDepartment}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="name" stroke="#fff" />
                        <YAxis stroke="#fff" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(0,0,0,0.9)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                        />
                        <Bar dataKey="value" fill="#ef4444" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Profit by Region */}
              {profitByRegion.length > 0 && (
                <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Target className="h-5 w-5 text-primary" />
                      Profit by Region
                    </CardTitle>
                    <CardDescription className="text-white/60">
                      Regional profitability ({profitByRegion.length} regions)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div id="profit-by-region-chart">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={profitByRegion}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="name" stroke="#fff" />
                        <YAxis stroke="#fff" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(0,0,0,0.9)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                        />
                        <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Time Series Trends */}
              {revenueTrend.length > 0 && (
                <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Activity className="h-5 w-5 text-primary" />
                      Revenue Trend (Rolling Avg)
                    </CardTitle>
                    <CardDescription className="text-white/60">
                      Historical performance trend ({revenueTrend.length} data points)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div id="revenue-trend-chart">
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={revenueTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="date" stroke="#fff" />
                        <YAxis stroke="#fff" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(0,0,0,0.9)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                        />
                        <Area type="monotone" dataKey="actual" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.2} name="Actual" />
                        <Area type="monotone" dataKey="rolling_avg" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Rolling Avg" />
                      </AreaChart>
                    </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Diagnostics Tab */}
          <TabsContent value="diagnostics" className="space-y-8">
            {/* Model Health Report */}
            {modelHealthData.length > 0 && (
              <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Brain className="h-5 w-5 text-primary" />
                    Model Performance Report
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    Forecasting model accuracy and status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left p-3 font-semibold text-white">Metric</th>
                          <th className="text-left p-3 font-semibold text-white">Model</th>
                          <th className="text-left p-3 font-semibold text-white">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modelHealthData.map((row: any, idx: number) => (
                          <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                            <td className="p-3 text-white/80">{row.metric}</td>
                            <td className="p-3 text-white/80">{row.model}</td>
                            <td className="p-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                row.status === 'Success' 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {row.status === 'Success' ? (
                                  <CheckCircle2 className="h-3 w-3" />
                                ) : (
                                  <XCircle className="h-3 w-3" />
                                )}
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* High Risk Periods */}
            {highRiskPeriods.length > 0 && (
              <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    High Risk Periods
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    Critical periods requiring attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {highRiskPeriods.map((period: any, idx: number) => (
                      <div key={idx} className="p-4 border border-red-500/30 rounded-lg bg-red-500/10">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-white">{period.date}</p>
                            <p className="text-sm text-white/70 mt-1">{period.reason || period.description}</p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400 font-medium">
                            HIGH RISK
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Top Revenue Spikes */}
              {topRevenueSpikes.length > 0 && (
                <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <TrendingUp className="h-5 w-5 text-green-400" />
                      Top Revenue Spikes
                    </CardTitle>
                    <CardDescription className="text-white/60">
                      Exceptional performance periods
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {topRevenueSpikes.map((spike: any, idx: number) => (
                        <div key={idx} className="p-3 border border-white/10 rounded-lg bg-white/5 flex justify-between items-center">
                          <div>
                            <p className="font-medium text-white">{spike.date}</p>
                            <p className="text-xs text-white/60">Revenue</p>
                          </div>
                          <p className="text-lg font-bold text-green-400">
                            ${spike.value?.toLocaleString() || spike.revenue?.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Expense Spikes */}
              {topExpenseSpikes.length > 0 && (
                <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <TrendingDown className="h-5 w-5 text-red-400" />
                      Top Expense Spikes
                    </CardTitle>
                    <CardDescription className="text-white/60">
                      Periods of high expenditure
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {topExpenseSpikes.map((spike: any, idx: number) => (
                        <div key={idx} className="p-3 border border-white/10 rounded-lg bg-white/5 flex justify-between items-center">
                          <div>
                            <p className="font-medium text-white">{spike.date}</p>
                            <p className="text-xs text-white/60">Expenses</p>
                          </div>
                          <p className="text-lg font-bold text-red-400">
                            ${spike.value?.toLocaleString() || spike.expenses?.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Data Validation Report */}
            {report.supporting_reports?.validation_report && (
              <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Database className="h-5 w-5 text-primary" />
                    Data Quality Report
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    Validation and data integrity checks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white/5 rounded-lg">
                      <p className="text-sm text-white/70 mb-1">Original Shape</p>
                      <p className="text-2xl font-bold text-white">
                        {report.supporting_reports.validation_report.original_shape?.join(' × ')}
                      </p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg">
                      <p className="text-sm text-white/70 mb-1">Cleaned Shape</p>
                      <p className="text-2xl font-bold text-white">
                        {report.supporting_reports.validation_report.cleaned_shape?.join(' × ')}
                      </p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg">
                      <p className="text-sm text-white/70 mb-1">Missing Values</p>
                      <p className="text-2xl font-bold text-white">
                        {report.supporting_reports.validation_report.missing_values_imputed ? 'Imputed' : 'None'}
                      </p>
                    </div>
                  </div>
                  
                  {report.supporting_reports.corrections_log && report.supporting_reports.corrections_log.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-white mb-3">Data Corrections Applied</h4>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {report.supporting_reports.corrections_log.map((correction: any, idx: number) => (
                          <div key={idx} className="p-3 border border-white/10 rounded-lg bg-white/5 text-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-white"><span className="font-medium">Row {correction.row_id}</span> • {correction.column}</p>
                                <p className="text-white/60 text-xs mt-1">Method: {correction.method}</p>
                              </div>
                              <p className="text-white/80">{correction.original} → {correction.correction}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Correlations Tab with Heatmap */}
          <TabsContent value="correlations" className="space-y-8">
            {(() => {
              // Get correlation data from the correct path: full_analysis_report.visualizations.correlations
              const analysisReport = (fullReportData as any).full_analysis_report || fullReportData;
              const visualizations = analysisReport.visualizations;
              const correlationMatrix = visualizations?.correlations?.correlation_matrix;
              
              // Debug logging
              console.log('📊 Heatmap Data Check:', {
                hasVisualization: !!visualizations,
                hasCorrelations: !!visualizations?.correlations,
                hasMatrix: !!correlationMatrix,
                hasColumns: !!correlationMatrix?.columns,
                hasValues: !!correlationMatrix?.values,
                columnsCount: correlationMatrix?.columns?.length,
                valuesCount: correlationMatrix?.values?.length,
                fullReportDataKeys: Object.keys(fullReportData || {}),
                analysisReportKeys: Object.keys(analysisReport || {}),
                visualizationsKeys: visualizations ? Object.keys(visualizations) : []
              });
              
              if (!correlationMatrix?.columns || !correlationMatrix?.values) {
                return (
                  <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                    <CardContent className="pt-6">
                      <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-white/40 mx-auto mb-4" />
                        <p className="text-white/60 text-lg">No correlation data available</p>
                        <p className="text-white/40 text-sm mt-2">Correlation matrix was not generated for this dataset</p>
                        <p className="text-white/20 text-xs mt-4 font-mono">
                          Debug: Check console for data structure
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              return (
                <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Activity className="h-5 w-5 text-primary" />
                      Correlation Matrix Heatmap
                    </CardTitle>
                    <CardDescription className="text-white/60">
                      Interactive heatmap showing correlations between {correlationMatrix.columns.length} financial metrics (-1 to +1)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <CorrelationHeatmap 
                      columns={correlationMatrix.columns}
                      values={correlationMatrix.values}
                    />
                  </CardContent>
                </Card>
              );
            })()}
          </TabsContent>
        </Tabs>

        {/* Raw Data Preview */}
        {report.raw_data_preview && report.raw_data_preview.length > 0 && (
          <Card className="mb-8 bg-white/5 border-white/10 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Database className="h-5 w-5 text-primary" />
                Data Preview
              </CardTitle>
              <CardDescription className="text-white/60">
                Sample of uploaded financial data (first 5 rows)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      {Object.keys(report.raw_data_preview[0] || {}).slice(0, 10).map((col: string, idx: number) => (
                        <th key={idx} className="text-left p-3 font-semibold text-white text-xs">
                          {col.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.raw_data_preview.slice(0, 5).map((row: any, idx: number) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                        {Object.values(row).slice(0, 10).map((value: any, colIdx: number) => (
                          <td key={colIdx} className="p-3 text-white/70 text-xs">
                            {typeof value === 'number' 
                              ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
                              : (value?.toString() || '-')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA Banner */}
        <div className="mt-12 p-8 bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30 rounded-lg text-center backdrop-blur-md">
          <h2 className="text-2xl font-bold mb-3 text-white">Need Deeper Insights?</h2>
          <p className="text-white/70 mb-6 max-w-2xl mx-auto">
            Switch to our interactive AI Chat for personalized analysis, what-if scenarios, and conversational exploration of your financial data.
          </p>
          <Button 
            onClick={handleSwitchToChat} 
            disabled={isLoading} 
            className="gap-2 bg-primary text-black hover:bg-primary/90 px-8 py-6 text-lg"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Launching...
              </>
            ) : (
              <>
                Launch Interactive AI Chat
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Email Report Dialog */}
      <EmailReportDialog
        isOpen={showEmailDialog}
        onClose={() => setShowEmailDialog(false)}
        onSend={handleSendEmail}
        onDownload={handleDirectDownload}
        isLoading={isSendingEmail}
      />
    </div>
  );
}
