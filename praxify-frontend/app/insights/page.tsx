'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/lib/app-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, TrendingUp, AlertTriangle, DollarSign, ArrowRight } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function InsightsPage() {
  const router = useRouter();
  const { fullReportData, uploadedFile, uploadConfig, setAgentData, addToSessionHistory } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!fullReportData) {
      router.push('/upload');
    }
  }, [fullReportData, router]);

  const handleSwitchToChat = async () => {
    if (!uploadedFile || !uploadConfig) {
      router.push('/upload');
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

      // Add to session history
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

  // Backend returns forecast_chart as array of {date, predicted, lower, upper}
  const forecastData = fullReportData.forecast_chart?.map((item: any) => ({
    date: item.date,
    forecast: item.predicted,
    lower: item.lower,
    upper: item.upper,
  })) || [];

  const profitDriverData = fullReportData.profit_drivers?.feature_attributions?.map((driver) => ({
    category: driver.feature,
    impact: driver.contribution_score,
  })) || [];

  return (
    <div className="min-h-screen bg-background pt-20 pb-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">Financial Insights Dashboard</h1>
            <p className="text-muted-foreground text-lg">
              Static comprehensive analysis report
            </p>
          </div>
          <Button onClick={handleSwitchToChat} disabled={isLoading} className="gap-2">
            <MessageSquare className="h-4 w-4" />
            {isLoading ? 'Launching...' : 'Switch to AI Chat'}
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Object.entries(fullReportData.kpis || {}).map(([key, value]) => {
            // Format value based on metric type
            let displayValue = '';
            if (typeof value === 'number') {
              if (key === 'profit_margin') {
                // Display as percentage with 2 decimals
                displayValue = `${(value * 100).toFixed(2)}%`;
              } else if (key === 'growth_rate' || key === 'forecast_accuracy') {
                // Add % symbol
                displayValue = `${value.toFixed(2)}%`;
              } else if (key === 'financial_health_score') {
                // Add /100 suffix
                displayValue = `${value.toFixed(2)}/100`;
              } else if (key === 'dso') {
                // Add Days suffix
                displayValue = `${value.toFixed(2)} Days`;
              } else {
                // Default formatting for currency values
                displayValue = value.toLocaleString(undefined, { maximumFractionDigits: 0 });
              }
            } else {
              displayValue = value;
            }

            // Determine if this metric should show a dollar sign (only for currency values)
            const isCurrencyMetric = !['growth_rate', 'forecast_accuracy', 'financial_health_score', 'dso', 'profit_margin'].includes(key);

            return (
              <Card key={key}>
                <CardHeader className="pb-3">
                  <CardDescription className="capitalize">{key.replace(/_/g, ' ')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {isCurrencyMetric && <DollarSign className="h-5 w-5 text-primary" />}
                    <p className="text-3xl font-bold">
                      {displayValue}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Forecast Chart */}
        {forecastData.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Forecast Analysis
              </CardTitle>
              <CardDescription>Historical data vs. predicted forecast</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" stroke="var(--color-foreground)" />
                  <YAxis stroke="var(--color-foreground)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: 'var(--color-foreground)'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="forecast" 
                    stroke="#10b981" 
                    strokeWidth={2.5}
                    name="Forecast"
                    dot={{ fill: '#10b981', r: 4 }}
                    connectNulls={true}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="lower" 
                    stroke="#6366f1" 
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    name="Lower Bound"
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="upper" 
                    stroke="#f59e0b" 
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    name="Upper Bound"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Profit Drivers */}
          {profitDriverData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Profit Drivers</CardTitle>
                <CardDescription>Key factors impacting profitability</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={profitDriverData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="category" stroke="var(--color-foreground)" />
                    <YAxis stroke="var(--color-foreground)" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--color-background)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        color: 'var(--color-foreground)'
                      }}
                    />
                    <Bar dataKey="impact" fill="var(--color-primary)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Anomalies */}
          {fullReportData.anomalies_table && fullReportData.anomalies_table.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Detected Anomalies
                </CardTitle>
                <CardDescription>Unusual patterns in your financial data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {fullReportData.anomalies_table.map((anomaly, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-semibold">{anomaly.metric}</p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          anomaly.severity === 'high' 
                            ? 'bg-red-500/20 text-red-500' 
                            : 'bg-yellow-500/20 text-yellow-500'
                        }`}>
                          {anomaly.severity}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{anomaly.date}</p>
                      <p className="text-sm mt-1">
                        Deviation: {anomaly.deviation_percent.toFixed(1)}%
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Narratives */}
        {fullReportData.narratives && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>AI-Generated Insights</CardTitle>
              <CardDescription>Contextual insights and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Handle financial_storyteller format (narrative field) */}
                {'narrative' in fullReportData.narratives && (
                  <div className="prose prose-invert max-w-none">
                    <h3 className="text-lg font-semibold mb-2">Financial Narrative</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{fullReportData.narratives.narrative}</p>
                  </div>
                )}
                
                {/* Handle finance_guardian format (summary_text + recommendations) */}
                {'summary_text' in fullReportData.narratives && (
                  <>
                    <div className="prose prose-invert max-w-none">
                      <h3 className="text-lg font-semibold mb-2">Summary</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">{fullReportData.narratives.summary_text}</p>
                    </div>
                    {fullReportData.narratives.recommendations && fullReportData.narratives.recommendations.length > 0 && (
                      <div className="prose prose-invert max-w-none">
                        <h3 className="text-lg font-semibold mb-2">Recommendations</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {fullReportData.narratives.recommendations.map((rec, idx) => (
                            <li key={idx} className="text-muted-foreground">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Raw Data Preview */}
        {fullReportData.raw_data_preview && fullReportData.raw_data_preview.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
              <CardDescription>Sample of uploaded financial data (first 5 rows)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {Object.keys(fullReportData.raw_data_preview[0] || {}).map((col, idx) => (
                        <th key={idx} className="text-left p-2 font-semibold text-xs">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fullReportData.raw_data_preview.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50">
                        {Object.values(row).map((value, colIdx) => (
                          <td key={colIdx} className="p-2 text-muted-foreground text-xs">
                            {typeof value === 'number' ? value.toFixed(2) : (value?.toString() || '-')}
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
        <div className="mt-12 p-8 bg-primary/10 border border-primary/20 rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-3">Want to explore deeper insights?</h2>
          <p className="text-muted-foreground mb-6">
            Switch to our interactive AI Chat for personalized analysis and conversational exploration
          </p>
          <Button onClick={handleSwitchToChat} disabled={isLoading} className="gap-2">
            Launch Interactive AI Chat
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
