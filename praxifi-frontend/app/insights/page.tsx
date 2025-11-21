'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/lib/app-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Grid3x3
} from 'lucide-react';
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
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981'
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

  if (!fullReportData) {
    return null;
  }

  const report = (fullReportData as any).full_analysis_report || fullReportData;

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

        {/* AI-Generated Insights Banner */}
        {report.narratives && (
          <Card className="mb-8 bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/30 backdrop-blur-md">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/20 rounded-lg">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">AI Executive Summary</h3>
                  <p className="text-white/90 mb-4 whitespace-pre-wrap">
                    {report.narratives.summary_text || report.narratives.narrative || 'No summary available.'}
                  </p>
                  {report.narratives.analyst_insights && report.narratives.analyst_insights.length > 0 && (
                    <div className="space-y-2">
                      {report.narratives.analyst_insights.map((insight: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="mt-1">
                            {insight.includes('🚨') || insight.includes('⚠️') ? (
                              <AlertTriangle className="h-4 w-4 text-yellow-400" />
                            ) : insight.includes('✅') ? (
                              <CheckCircle2 className="h-4 w-4 text-green-400" />
                            ) : (
                              <Lightbulb className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <p className="text-sm text-white/80">{insight}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key KPIs Section */}
        <SectionHeader 
          icon={Target} 
          title="Critical KPIs" 
          description="Real-time financial health indicators"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
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
              <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    Detected Anomalies
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    Unusual patterns requiring attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {report.anomalies_table.map((anomaly: any, idx: number) => (
                      <div key={idx} className="p-4 border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold text-white">{anomaly.metric?.toUpperCase()}</p>
                          <span className={`text-xs px-3 py-1 rounded-full font-medium`}
                            style={{ 
                              backgroundColor: `${SEVERITY_COLORS[anomaly.severity as keyof typeof SEVERITY_COLORS]}20`,
                              color: SEVERITY_COLORS[anomaly.severity as keyof typeof SEVERITY_COLORS]
                            }}>
                            {anomaly.severity?.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-white/70 mb-1">{anomaly.date}</p>
                        <p className="text-sm text-white/90">
                          Deviation: <span className="font-bold">{anomaly.deviation_percent?.toFixed(1)}%</span>
                        </p>
                        {anomaly.description && (
                          <p className="text-xs text-white/60 mt-2">{anomaly.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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
          <TabsContent value="forecasts" className="space-y-8">
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
                    <ResponsiveContainer width="100%" height={350}>
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
                  </CardContent>
                </Card>
              );
            })}
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
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
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
    </div>
  );
}
