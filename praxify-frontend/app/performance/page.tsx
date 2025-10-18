'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Clock, 
  Database, 
  Cpu, 
  RefreshCw, 
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Zap
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PerformancePage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metrics, setMetrics] = useState({
    apiResponseTime: 3.2,
    dataProcessingTime: 2.5,
    mlModelTraining: 4.1,
    totalAnalysisTime: 9.8,
    successRate: 98.5,
    errorRate: 1.5,
    averageFileSize: 2.3,
    sessionsActive: 12,
  });

  const [performanceHistory] = useState([
    { time: '10:00', responseTime: 3.1, requests: 45 },
    { time: '10:15', responseTime: 3.3, requests: 52 },
    { time: '10:30', responseTime: 2.9, requests: 48 },
    { time: '10:45', responseTime: 3.2, requests: 55 },
    { time: '11:00', responseTime: 3.4, requests: 61 },
    { time: '11:15', responseTime: 3.0, requests: 49 },
    { time: '11:30', responseTime: 3.2, requests: 58 },
  ]);

  const [componentMetrics] = useState([
    { component: 'Data Ingestion', avgTime: 0.5, percentage: 5 },
    { component: 'Validation', avgTime: 0.2, percentage: 2 },
    { component: 'Feature Engineering', avgTime: 0.3, percentage: 3 },
    { component: 'Forecasting', avgTime: 4.1, percentage: 42 },
    { component: 'Anomaly Detection', avgTime: 0.5, percentage: 5 },
    { component: 'Correlation', avgTime: 0.8, percentage: 8 },
    { component: 'Explainability', avgTime: 1.2, percentage: 12 },
    { component: 'Dashboard Gen', avgTime: 0.4, percentage: 4 },
    { component: 'AI Agent', avgTime: 1.8, percentage: 18 },
  ]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setMetrics(prev => ({
        ...prev,
        apiResponseTime: +(prev.apiResponseTime + (Math.random() * 0.4 - 0.2)).toFixed(2),
        dataProcessingTime: +(prev.dataProcessingTime + (Math.random() * 0.3 - 0.15)).toFixed(2),
        mlModelTraining: +(prev.mlModelTraining + (Math.random() * 0.5 - 0.25)).toFixed(2),
      }));
      setIsRefreshing(false);
    }, 1000);
  };

  useEffect(() => {
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      handleRefresh();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const MetricCard = ({ 
    icon: Icon, 
    title, 
    value, 
    unit, 
    status, 
    description 
  }: {
    icon: any;
    title: string;
    value: number;
    unit: string;
    status: 'good' | 'warning' | 'error';
    description: string;
  }) => {
    const statusColors = {
      good: 'text-green-500',
      warning: 'text-yellow-500',
      error: 'text-red-500',
    };

    const StatusIcon = status === 'good' ? CheckCircle2 : AlertCircle;

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardDescription>{title}</CardDescription>
            <StatusIcon className={`h-4 w-4 ${statusColors[status]}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 mb-1">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <p className="text-3xl font-bold">
              {value}
              <span className="text-lg font-normal text-muted-foreground ml-1">{unit}</span>
            </p>
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-20">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Performance Dashboard</h1>
            <p className="text-muted-foreground text-lg">
              Real-time monitoring of system performance and health metrics
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            icon={Clock}
            title="API Response Time"
            value={metrics.apiResponseTime}
            unit="sec"
            status={metrics.apiResponseTime < 4 ? 'good' : 'warning'}
            description="Average end-to-end response"
          />
          <MetricCard
            icon={Cpu}
            title="ML Model Training"
            value={metrics.mlModelTraining}
            unit="sec"
            status={metrics.mlModelTraining < 5 ? 'good' : 'warning'}
            description="Forecasting model training time"
          />
          <MetricCard
            icon={Zap}
            title="Success Rate"
            value={metrics.successRate}
            unit="%"
            status={metrics.successRate > 95 ? 'good' : metrics.successRate > 90 ? 'warning' : 'error'}
            description="Successful API requests"
          />
          <MetricCard
            icon={Activity}
            title="Active Sessions"
            value={metrics.sessionsActive}
            unit=""
            status="good"
            description="Current active chat sessions"
          />
        </div>

        {/* Performance Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Response Time Trends
              </CardTitle>
              <CardDescription>API response times over the last hour</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="time" stroke="var(--color-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-foreground)" fontSize={12} label={{ value: 'Seconds', angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: 'var(--color-foreground)'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="responseTime"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--color-primary)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Request Volume
              </CardTitle>
              <CardDescription>Number of API requests per period</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="time" stroke="var(--color-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-foreground)" fontSize={12} label={{ value: 'Requests', angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: 'var(--color-foreground)'
                    }}
                  />
                  <Bar dataKey="requests" fill="var(--color-primary)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Component Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Component Performance Breakdown
            </CardTitle>
            <CardDescription>Average processing time by pipeline component</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={componentMetrics} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" stroke="var(--color-foreground)" fontSize={12} label={{ value: 'Seconds', position: 'insideBottom', offset: -5 }} />
                <YAxis type="category" dataKey="component" stroke="var(--color-foreground)" fontSize={12} width={150} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-foreground)'
                  }}
                />
                <Bar dataKey="avgTime" fill="var(--color-primary)" />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              {componentMetrics.map((metric, idx) => (
                <div key={idx} className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">{metric.component}</h4>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{metric.avgTime}s</span>
                    <span className="text-primary font-semibold">{metric.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Data Processing Pipeline</CardTitle>
              <CardDescription>Average time: {metrics.totalAnalysisTime}s</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Data Ingestion</span>
                    <span className="text-muted-foreground">0.5s</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '5%' }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Validation & QA</span>
                    <span className="text-muted-foreground">0.2s</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '2%' }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Feature Engineering</span>
                    <span className="text-muted-foreground">0.3s</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '3%' }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>ML Forecasting</span>
                    <span className="text-muted-foreground">{metrics.mlModelTraining}s</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '42%' }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Anomaly Detection</span>
                    <span className="text-muted-foreground">0.5s</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '5%' }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Dashboard Generation</span>
                    <span className="text-muted-foreground">0.4s</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '4%' }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>AI Agent Response</span>
                    <span className="text-muted-foreground">1.8s</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '18%' }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Resources</CardTitle>
              <CardDescription>Current utilization levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">CPU Usage</span>
                    </div>
                    <span className="text-sm text-muted-foreground">45%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div className="bg-green-500 h-3 rounded-full" style={{ width: '45%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">Memory Usage</span>
                    </div>
                    <span className="text-sm text-muted-foreground">62%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div className="bg-yellow-500 h-3 rounded-full" style={{ width: '62%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">Redis Connection</span>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-xs text-muted-foreground">Healthy • {metrics.sessionsActive} active sessions</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">Storage Used</span>
                    </div>
                    <span className="text-sm text-muted-foreground">12.3 GB</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Uploads: 8.4 GB • Outputs: 3.9 GB</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Optimization Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Recommendations</CardTitle>
            <CardDescription>Suggestions to improve system performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Model Caching Enabled</h4>
                    <p className="text-sm text-muted-foreground">
                      Trained models are cached by file hash, reducing repeat analysis time by 60%
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 border border-yellow-500/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Consider Async Processing</h4>
                    <p className="text-sm text-muted-foreground">
                      Implement FastAPI BackgroundTasks for long-running forecasting operations
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 border border-yellow-500/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Redis Result Caching</h4>
                    <p className="text-sm text-muted-foreground">
                      Cache analysis results in Redis to handle repeated queries faster
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
