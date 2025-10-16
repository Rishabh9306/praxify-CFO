'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/lib/app-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ChatPage() {
  const router = useRouter();
  const { agentData, uploadedFile, uploadConfig, sessionId, setAgentData, addToSessionHistory } = useAppContext();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!agentData) {
      router.push('/upload');
      return;
    }

    // Initialize messages from conversation history
    if (agentData.conversation_history) {
      setMessages(agentData.conversation_history);
    }
  }, [agentData, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !uploadedFile || !uploadConfig || !sessionId) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('persona', uploadConfig.persona);
      formData.append('forecast_metric', uploadConfig.forecast_metric);
      formData.append('user_query', userMessage);
      formData.append('session_id', sessionId);

      const response = await fetch('/api/agent/analyze_and_respond', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      setAgentData(data);
      setMessages(data.conversation_history || []);

      // Update session history
      addToSessionHistory({
        session_id: data.session_id,
        timestamp: new Date().toISOString(),
        file_name: uploadedFile.name,
        last_query: userMessage,
        data,
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error processing your request.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!agentData) {
    return null;
  }

  const forecastData = agentData.full_analysis_report?.forecast_chart?.dates.map((date, i) => ({
    date,
    actual: agentData.full_analysis_report.forecast_chart.actual[i],
    forecast: agentData.full_analysis_report.forecast_chart.forecast[i],
  })) || [];

  const profitDriverData = agentData.full_analysis_report?.profit_drivers?.map((driver) => ({
    category: driver.category,
    impact: driver.impact,
  })) || [];

  return (
    <div className="min-h-screen bg-background pt-32 pb-20">
      <div className="container mx-auto px-4 h-[calc(100vh-200px)]">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">AI Financial Analyst Chat</h1>
          <p className="text-muted-foreground">
            Session ID: <span className="font-mono text-sm">{sessionId}</span>
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 h-full">
          {/* Chat Interface */}
          <div className="lg:col-span-2 flex flex-col h-full">
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <CardTitle>Conversation</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
                  {messages.map((message, idx) => (
                    <div
                      key={idx}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-4">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask a question about your financial data..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isLoading}
                    className="gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Context Canvas */}
          <div className="lg:col-span-1 flex flex-col gap-6 overflow-y-auto">
            {/* KPIs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Key Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(agentData.full_analysis_report?.kpis || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="font-semibold">
                      {typeof value === 'number'
                        ? value.toLocaleString(undefined, { maximumFractionDigits: 0 })
                        : value}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Forecast Preview */}
            {forecastData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={forecastData.slice(-10)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--foreground))" fontSize={10} />
                      <YAxis stroke="hsl(var(--foreground))" fontSize={10} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="actual"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="forecast"
                        stroke="hsl(var(--muted-foreground))"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Anomalies */}
            {agentData.full_analysis_report?.anomalies && 
             agentData.full_analysis_report.anomalies.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Anomalies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {agentData.full_analysis_report.anomalies.slice(0, 3).map((anomaly, idx) => (
                      <div key={idx} className="p-2 border rounded text-xs">
                        <div className="flex justify-between mb-1">
                          <span className="font-semibold">{anomaly.metric}</span>
                          <span className={`px-1.5 py-0.5 rounded ${
                            anomaly.severity === 'high'
                              ? 'bg-red-500/20 text-red-500'
                              : 'bg-yellow-500/20 text-yellow-500'
                          }`}>
                            {anomaly.severity}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{anomaly.date}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Profit Drivers */}
            {profitDriverData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Profit Drivers</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={profitDriverData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="category" stroke="hsl(var(--foreground))" fontSize={10} />
                      <YAxis stroke="hsl(var(--foreground))" fontSize={10} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="impact" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
