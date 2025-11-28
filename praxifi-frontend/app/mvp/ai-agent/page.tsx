'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAppContext } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { 
  Send, 
  Paperclip,
  FileSpreadsheet, 
  X,
  Loader2,
  Plus,
  MessageSquare,
  FileText,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  file?: {
    name: string;
    size: number;
  };
}

export default function AIAgentPage() {
  const router = useRouter();
  const { setUploadedFile, setAgentData: setContextAgentData, setSessionId, addToSessionHistory } = useAppContext();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your AI Financial Analyst powered by **PRAXIFI**. Upload a CSV file with your financial data and ask me anything about it.",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [showReportPanel, setShowReportPanel] = useState(false);
  const [agentData, setAgentData] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const reportPanelRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  // Scroll report panel to top when it opens
  useEffect(() => {
    if (showReportPanel && reportPanelRef.current) {
      reportPanelRef.current.scrollTop = 0;
    }
  }, [showReportPanel]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
    }
  }, []);

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && !file) || isLoading) return;

    // Check if we have a file (required for first message or if no session exists)
    if (!file && !sessionActive) {
      setMessages(prev => [...prev, {
        role: 'system',
        content: 'Please upload a CSV file first before asking questions.',
        timestamp: new Date(),
      }]);
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: input.trim() || 'Analyze this file',
      timestamp: new Date(),
      ...(file && { file: { name: file.name, size: file.size } })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const formData = new FormData();
      // File is required - use current file or the one from the session
      if (file) {
        formData.append('file', file);
      } else {
        // This should not happen due to the check above, but adding for safety
        throw new Error('File is required');
      }
      formData.append('user_query', userMessage.content);
      if (currentSessionId) {
        formData.append('session_id', currentSessionId);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agent/analyze_and_respond`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!sessionActive && file) {
        setSessionActive(true);
        setCurrentSessionId(data.session_id);
        setSessionId(data.session_id);
        setUploadedFile(file);
        setContextAgentData(data);
        
        addToSessionHistory({
          session_id: data.session_id,
          timestamp: new Date().toISOString(),
          file_name: file.name,
          last_query: userMessage.content,
          data,
        });
      }

      // Update agent data for report panel
      setAgentData(data);
      setContextAgentData(data);
      
      // Show report panel with dramatic slide animation if we have a full report
      if (data.full_analysis_report) {
        setTimeout(() => setShowReportPanel(true), 300);
      }
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.ai_response || data.response || data.answer || 'I apologize, but I encountered an issue.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (file) {
        removeFile();
      }

    } catch (err) {
      console.error('API Error:', err);
      const errorMessage: Message = {
        role: 'system',
        content: `Error: ${err instanceof Error ? err.message : 'Failed to get response'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
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

  const startNewChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Hello! I'm your AI Financial Analyst. Upload a CSV file and ask me anything.",
        timestamp: new Date(),
      }
    ]);
    setSessionActive(false);
    setCurrentSessionId('');
    setShowReportPanel(false);
    setAgentData(null);
    removeFile();
  };

  // Markdown parser for AI responses
  const parseMarkdown = (text: string) => {
    const lines = text.split('\n');
    
    return lines.map((line, idx) => {
      // Parse headers
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-sm font-bold mt-2 mb-0.5">{line.replace(/^### /, '')}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-base font-bold mt-2 mb-0.5">{line.replace(/^## /, '')}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={idx} className="text-lg font-bold mt-2 mb-1">{line.replace(/^# /, '')}</h1>;
      }
      
      // Parse bullet points
      if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) {
        const content = line.replace(/^[•\-\*]\s*/, '');
        return (
          <div key={idx} className="flex items-start gap-2 ml-2 my-0.5">
            <span className="text-primary mt-0.5 text-xs">•</span>
            <span className="flex-1">{parseBoldAndInline(content)}</span>
          </div>
        );
      }
      
      // Empty lines
      if (line.trim() === '') {
        return <div key={idx} className="h-1" />;
      }
      
      // Regular text with inline formatting
      return <p key={idx} className="my-0.5">{parseBoldAndInline(line)}</p>;
    });
  };

  // Parse inline formatting like **bold**
  const parseBoldAndInline = (text: string) => {
    // More robust inline parser that handles **bold**, *italic*, and `code`.
    const nodes: React.ReactNode[] = [];
    let rest = text;
    let key = 0;
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/;

    while (rest.length) {
      const m = rest.match(pattern);
      if (!m) {
        nodes.push(rest);
        break;
      }

      const index = m.index ?? 0;
      if (index > 0) {
        nodes.push(rest.slice(0, index));
      }

      if (m[2]) {
        // **bold**
        nodes.push(<strong key={key++} className="font-bold">{m[2]}</strong>);
      } else if (m[3]) {
        // *italic*
        nodes.push(<em key={key++} className="italic">{m[3]}</em>);
      } else if (m[4]) {
        // `code`
        nodes.push(<code key={key++} className="bg-muted px-1 rounded">{m[4]}</code>);
      }

      rest = rest.slice(index + m[0].length);
    }

    return nodes;
  };

  // Prepare data for visualizations
  const forecastData = agentData?.full_analysis_report?.forecast_chart?.map((item: any) => ({
    date: item.date,
    forecast: item.predicted,
    lower: item.lower,
    upper: item.upper,
  })) || [];

  const profitDriverData = agentData?.full_analysis_report?.profit_drivers?.feature_attributions?.map((driver: any) => ({
    category: driver.feature,
    impact: driver.contribution_score,
  })) || [];

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="flex h-[calc(100vh-5rem)]">
      {/* Main Chat Section */}
      <div className={`transition-all duration-500 ${showReportPanel ? 'w-2/3' : 'w-full'} flex flex-col`}>
      <div className="sticky top-20 z-10 border-b border-white/10 bg-black/90 backdrop-blur-md flex-shrink-0">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between min-h-[48px]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg overflow-hidden relative">
                <Image src="/praxifi-logo.svg" alt="Praxifi" fill className="object-cover scale-150" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white">AI Financial Analyst</h1>
                <p className="text-xs text-white/60">Powered by Gemini 2.5 Pro</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!showReportPanel && agentData && (
                <Button 
                  onClick={() => setShowReportPanel(true)} 
                  size="sm" 
                  variant="glass" 
                  className="gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  View Report
                </Button>
              )}
              <Button onClick={startNewChat} size="sm" variant="glass" className="gap-2">
                <Plus className="h-4 w-4" />
                New Chat
              </Button>
            </div>
          </div>
          
          {sessionActive && (
            <div className="mt-2 flex items-center gap-2 text-xs text-white/60">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
              Session active
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-4 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-9 h-9 bg-white/10 rounded-lg overflow-hidden relative">
                    <Image src="/praxifi-logo.svg" alt="Praxifi" fill className="object-cover scale-150" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-white/10 backdrop-blur-md border border-white/20 text-white'
                      : message.role === 'system'
                      ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                      : 'bg-white/5 backdrop-blur-md border border-white/10 text-white'
                  }`}
                >
                  {message.file && (
                    <div className="mb-2 flex items-center gap-2 p-2 bg-white/10 rounded-lg text-xs">
                      <FileSpreadsheet className="h-4 w-4 text-white/60" />
                      <div>
                        <p className="font-medium text-white">{message.file.name}</p>
                        <p className="text-white/60">{(message.file.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                  )}
                  <div className="text-sm leading-snug">
                    {message.role === 'assistant' ? parseMarkdown(message.content) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                  <p className="text-xs text-white/40 mt-2">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4 justify-start">
                <div className="flex-shrink-0 w-9 h-9 bg-white/10 rounded-lg overflow-hidden relative">
                  <Image src="/praxifi-logo.svg" alt="Praxifi" fill className="object-cover scale-150" />
                </div>
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                    <span className="text-sm text-white/70">Analyzing...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-black/50 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          {file && (
            <div className="mb-3 inline-flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg border border-white/20">
              <FileSpreadsheet className="h-4 w-4 text-white" />
              <div className="text-sm">
                <p className="font-medium text-white">{file.name}</p>
                <p className="text-xs text-white/60">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
              <button
                onClick={removeFile}
                className="ml-2 p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="h-4 w-4 text-white/60" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <div className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden focus-within:border-white/40 transition-colors">
              <div className="flex items-end">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-input"
                />
                <label
                  htmlFor="file-input"
                  className="p-3 cursor-pointer hover:bg-white/10 transition-colors"
                >
                  <Paperclip className="h-5 w-5 text-white/60 hover:text-white" />
                </label>
                
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about your financial data..."
                  disabled={isLoading}
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/40 px-2 py-3 resize-none min-h-[44px] max-h-[200px]"
                  rows={1}
                />
              </div>
            </div>

            <Button
              onClick={handleSendMessage}
              disabled={(!input.trim() && !file) || isLoading}
              size="sm"
              className="h-[44px] w-[44px] rounded-xl p-0"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>

          <p className="text-xs text-white/40 mt-2 text-center">
            Upload CSV files and ask questions. Session persists for 24 hours.
          </p>
        </div>
      </div>
      </div>

      {/* Sliding Report Panel */}
      {showReportPanel && agentData && (
        <div 
          className="w-1/3 bg-black/80 backdrop-blur-xl border-l border-white/10 flex flex-col"
          style={{
            animation: 'slideInFromRight 0.7s ease-out forwards'
          }}
        >
          <style jsx>{`
            @keyframes slideInFromRight {
              from {
                transform: translateX(100%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
          `}</style>

          <div className="sticky top-20 z-20 bg-black/90 backdrop-blur-md px-4 py-4 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center justify-between min-h-[48px]">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analysis Report
              </h2>
              <Button
                size="sm"
                onClick={() => setShowReportPanel(false)}
                className="gap-2 bg-white/10 hover:bg-white/20 border border-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div ref={reportPanelRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* KPIs */}
            {agentData.full_analysis_report?.kpis && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-white">
                    <DollarSign className="h-4 w-4" />
                    Key Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(agentData.full_analysis_report.kpis).slice(0, 6).map(([key, value]: [string, any]) => {
                    let displayValue = '';
                    if (typeof value === 'number') {
                      if (key === 'profit_margin') {
                        displayValue = `${(value * 100).toFixed(2)}%`;
                      } else if (key === 'growth_rate' || key === 'forecast_accuracy') {
                        displayValue = `${value.toFixed(2)}%`;
                      } else if (key === 'financial_health_score') {
                        displayValue = `${value.toFixed(2)}/100`;
                      } else {
                        displayValue = value.toLocaleString(undefined, { maximumFractionDigits: 0 });
                      }
                    } else {
                      displayValue = value;
                    }

                    return (
                      <div key={key} className="flex justify-between items-center text-sm">
                        <span className="text-white/60 capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="font-semibold text-white">
                          {displayValue}
                        </span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Forecast Preview */}
            {forecastData.length > 0 && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-white">
                    <TrendingUp className="h-4 w-4" />
                    Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={forecastData.slice(-10)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.6)" fontSize={10} />
                      <YAxis stroke="rgba(255,255,255,0.6)" fontSize={10} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0,0,0,0.9)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="forecast"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: '#10b981', r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Anomalies */}
            {agentData.full_analysis_report?.anomalies_table && 
             agentData.full_analysis_report.anomalies_table.length > 0 && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-white">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Anomalies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {agentData.full_analysis_report.anomalies_table.slice(0, 3).map((anomaly: any, idx: number) => (
                      <div key={idx} className="p-2 bg-white/5 border border-white/10 rounded text-xs">
                        <div className="flex justify-between mb-1">
                          <span className="font-semibold text-white">{anomaly.metric}</span>
                          <span className={`px-1.5 py-0.5 rounded ${
                            anomaly.severity === 'high'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {anomaly.severity}
                          </span>
                        </div>
                        <p className="text-white/60">{anomaly.date}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Profit Drivers */}
            {profitDriverData.length > 0 && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-base text-white">Profit Drivers</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={profitDriverData.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="category" stroke="rgba(255,255,255,0.6)" fontSize={10} />
                      <YAxis stroke="rgba(255,255,255,0.6)" fontSize={10} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0,0,0,0.9)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="impact" fill="#eab308" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}