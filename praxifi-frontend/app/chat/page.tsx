'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/lib/app-context';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, TrendingUp, DollarSign, AlertTriangle, X, FileText, Paperclip } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ChatPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { agentData, uploadedFile, uploadConfig, sessionId, setAgentData, addToSessionHistory, setUploadedFile } = useAppContext();
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    { 
      role: 'assistant', 
      content: 'Hello! I\'m your AI Financial Analyst. Ask me anything about the uploaded financial data.' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showReportPanel, setShowReportPanel] = useState(false);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // DEBUG: Log auth state changes
  useEffect(() => {
    console.log('🔍 CHAT PAGE: Auth state changed');
    console.log('🔍 user:', user);
    console.log('🔍 user?.email:', user?.email);
    console.log('🔍 user?.uid:', user?.uid);
    console.log('🔍 typeof user:', typeof user);
    console.log('🔍 user is null?', user === null);
    console.log('🔍 user is undefined?', user === undefined);
  }, [user]);

  useEffect(() => {
    // Initialize messages from conversation history
    // Backend conversation_history format: [{query_id, summary: {user_query, ai_response, key_kpis}, timestamp}]
    // Convert to chat format: [{role, content}]
    if (agentData && agentData.conversation_history && agentData.conversation_history.length > 0) {
      const chatMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
        { 
          role: 'assistant', 
          content: 'Hello! I\'m your AI Financial Analyst. Ask me anything about the uploaded financial data.' 
        }
      ];
      
      // Process conversation history from backend
      agentData.conversation_history.forEach((item: any) => {
        if (item.summary) {
          const userQuery = item.summary.user_query || '';
          const aiResponse = item.summary.ai_response || '';
          
          if (userQuery) {
            chatMessages.push({ role: 'user', content: userQuery });
          }
          if (aiResponse) {
            chatMessages.push({ role: 'assistant', content: aiResponse });
          }
        }
      });
      
      setMessages(chatMessages);
    }
  }, [agentData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setLocalFile(selectedFile);
      setUploadedFile(selectedFile);
    }
  };

  const removeFile = () => {
    setLocalFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    console.log('🔍 CHAT STEP 1: Checking user authentication state...');
    console.log('🔍 user object:', user);
    console.log('🔍 user?.email:', user?.email);
    console.log('🔍 user?.uid:', user?.uid);
    
    // CRITICAL: Check if user is logged in BEFORE proceeding
    if (!user) {
      console.error('❌ CHAT STEP 1 FAILED: User is NOT authenticated!');
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '⚠️ You must be logged in to use this feature. Please sign in with Google first.' },
      ]);
      alert('⚠️ You must be logged in to use this feature. Please sign in with Google first.');
      return;
    }
    
    console.log('✅ CHAT STEP 2: User is authenticated!');
    console.log('🔍 DEBUG: User object:', user);
    console.log('🔍 DEBUG: User email:', user.email);
    
    // Determine which file to use
    const fileToUse = localFile || uploadedFile;
    
    if (!input.trim() && !fileToUse) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Please upload a CSV file or enter a query.' },
      ]);
      return;
    }

    if (!fileToUse) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Please upload a CSV file first before asking questions.' },
      ]);
      return;
    }

    const userMessage = input.trim() || 'Analyze this file';
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      console.log('🔍 CHAT STEP 3: Calling user.getIdToken()...');
      // CRITICAL: Get Firebase ID token FIRST before creating FormData
      let token: string | null = null;
      if (user) {
        try {
          token = await user.getIdToken();
          console.log('✅ CHAT STEP 4: Got Firebase ID token successfully!');
          console.log('✅ Got Firebase ID token for user:', user.email);
          console.log('🔐 Token (first 50 chars):', token.substring(0, 50));
          console.log('🔐 Token length:', token.length);
        } catch (error) {
          console.error('❌ CHAT STEP 4 FAILED: Error getting token:', error);
          console.error('⚠️ Failed to get Firebase ID token:', error);
        }
      } else {
        console.error('❌ CHAT STEP 3 FAILED: User object is null at token retrieval time!');
        console.warn('👤 No user logged in - request will be anonymous');
      }

      console.log('🔍 CHAT STEP 5: Creating FormData...');
      const formData = new FormData();
      formData.append('file', fileToUse);
      formData.append('user_query', userMessage);
      
      // IMPORTANT: Include session_id for conversation continuity
      if (sessionId) {
        formData.append('session_id', sessionId);
        console.log('📤 Continuing conversation with session_id:', sessionId);
      } else {
        console.log('📤 Starting new conversation (no session_id)');
      }

      console.log('🔍 CHAT STEP 6: Appending authorization_token to FormData...');
      // CRITICAL FIX: Add token as FormData field instead of header
      if (token) {
        formData.append('authorization_token', token);
        console.log('✅ CHAT STEP 7: Token appended to FormData!');
        console.log('📦 FormData has authorization_token:', formData.has('authorization_token'));
        console.log('� FormData has file:', formData.has('file'));
        console.log('📦 FormData has user_query:', formData.has('user_query'));
        console.log('�📤 Sending authenticated request');
        console.log('📤 Token being sent as FormData field (first 50 chars):', token.substring(0, 50));
      } else {
        console.error('❌ CHAT STEP 6 FAILED: No token to append!');
        console.log('📤 Sending anonymous request (no token)');
      }

      // Only set ngrok header
      const headers = new Headers();
      headers.append('ngrok-skip-browser-warning', 'true');

      console.log('📤 CHAT STEP 8: Sending request to API...');
      console.log('📤 API URL:', `${process.env.NEXT_PUBLIC_API_URL}/api/agent/analyze_and_respond`);
      console.log('📤 Final check - FormData has authorization_token:', formData.has('authorization_token'));

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agent/analyze_and_respond`, {
        method: 'POST',
        body: formData,
        headers: headers,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Received response:', { 
        session_id: data.session_id, 
        history_length: data.conversation_history?.length 
      });
      
      setAgentData(data);
      
      // The AI response is in the ai_response field
      const aiResponse = data.ai_response || 'No response received';
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);

      // Show the report panel with dramatic slide animation
      if (data.full_analysis_report) {
        setTimeout(() => setShowReportPanel(true), 300);
      }

      // Update session history
      addToSessionHistory({
        session_id: data.session_id,
        timestamp: new Date().toISOString(),
        file_name: fileToUse.name,
        last_query: userMessage,
        data,
      });

      // Clear local file after successful submission
      if (localFile) {
        setLocalFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error processing your request. Please try again.' },
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

  // Markdown parser for chat messages
  const parseMarkdown = (text: string) => {
    const lines = text.split('\n');
    
    return lines.map((line, idx) => {
      // Parse headers
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-base font-bold mt-3 mb-1">{line.replace(/^### /, '')}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-lg font-bold mt-3 mb-2">{line.replace(/^## /, '')}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={idx} className="text-xl font-bold mt-4 mb-2">{line.replace(/^# /, '')}</h1>;
      }
      
      // Parse bullet points
      if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) {
        const content = line.replace(/^[•\-\*]\s*/, '');
        return (
          <div key={idx} className="flex items-start gap-2 ml-2 my-1">
            <span className="text-primary mt-1 text-xs">•</span>
            <span className="flex-1">{parseBoldAndInline(content)}</span>
          </div>
        );
      }
      
      // Empty lines
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      
      // Regular text with inline formatting
      return <p key={idx} className="my-1">{parseBoldAndInline(line)}</p>;
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

  // Backend returns forecast_chart as array of {date, predicted, lower, upper}
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
    <div className="min-h-screen bg-background pt-20 pb-20 relative overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="container max-w-7xl mx-auto px-4 h-full flex flex-col">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">AI Financial Analyst Chat</h1>
          <p className="text-muted-foreground">
            {sessionId ? (
              <>Session ID: <span className="font-mono text-sm">{sessionId}</span></>
            ) : (
              'Upload a file to start a session'
            )}
          </p>
        </div>

        <div className={`transition-all duration-500 ${showReportPanel ? 'grid lg:grid-cols-3 gap-6' : 'grid lg:grid-cols-1'} h-full`}>
          {/* Chat Interface */}
          <div className={`transition-all duration-500 ${showReportPanel ? 'lg:col-span-2' : 'lg:col-span-1 max-w-4xl mx-auto w-full'} flex flex-col h-full`}>
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
                        className={`max-w-[80%] rounded-xl p-5 ${
                          message.role === 'user'
                            ? 'bg-gradient-to-br from-primary to-primary/90 text-black border border-primary/30 shadow-xl'
                            : 'bg-gradient-to-br from-blue-500/15 to-purple-500/10 text-white border border-blue-500/30 backdrop-blur-md shadow-2xl'
                        }`}
                      >
                        <div className="text-sm space-y-2 leading-relaxed">
                          {message.role === 'assistant' ? parseMarkdown(message.content) : (
                            <p className="whitespace-pre-wrap font-medium">{message.content}</p>
                          )}
                        </div>
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

                {/* File attachment area */}
                {(localFile || (!uploadedFile && !sessionId)) && (
                  <div className="mb-3">
                    {localFile ? (
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm flex-1 truncate">{localFile.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {(localFile.size / 1024).toFixed(1)} KB
                        </span>
                        <Button
                          size="sm"
                          onClick={removeFile}
                          className="h-6 w-6 p-0 bg-transparent hover:bg-muted"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full gap-2 border border-border bg-transparent hover:bg-muted"
                      >
                        <Paperclip className="h-4 w-4" />
                        Upload CSV File
                      </Button>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  {!localFile && (uploadedFile || sessionId) && (
                    <Button
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      title="Attach file"
                      className="px-3 border border-border bg-transparent hover:bg-muted"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  )}
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
                    disabled={isLoading}
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

          {/* Report Panel - Slides in dramatically from right */}
          {showReportPanel && agentData && (
            <div 
              className="lg:col-span-1 flex flex-col gap-6 overflow-y-auto animate-in slide-in-from-right duration-700"
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
              
              {/* Close button */}
              <div className="sticky top-20 z-20 flex justify-end bg-transparent p-4">
                <Button
                  size="sm"
                  onClick={() => setShowReportPanel(false)}
                  className="gap-2 bg-transparent border border-border hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                  Close Report
                </Button>
              </div>

              {/* AI Response Box */}
              {agentData.ai_response && (
                <Card className="border-2 border-primary/50 shadow-xl">
                  <CardHeader className="bg-gradient-to-br from-primary/10 to-purple-500/10">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      AI Analysis Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="prose prose-sm max-w-none text-sm leading-relaxed">
                      {parseMarkdown(agentData.ai_response)}
                    </div>
                  </CardContent>
                </Card>
              )}
            
            {/* Context Canvas */}
            <div className="flex flex-col gap-6">
            {/* KPIs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Key Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(agentData.full_analysis_report?.kpis || {}).map(([key, value]) => {
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

                  return (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="font-semibold">
                        {displayValue}
                      </span>
                    </div>
                  );
                })}
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
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="date" stroke="var(--color-foreground)" fontSize={10} />
                      <YAxis stroke="var(--color-foreground)" fontSize={10} />
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
                        dataKey="forecast"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Forecast"
                        dot={{ fill: '#10b981', r: 3 }}
                        connectNulls={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Anomalies */}
            {agentData.full_analysis_report?.anomalies_table && 
             agentData.full_analysis_report.anomalies_table.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Anomalies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {agentData.full_analysis_report.anomalies_table.slice(0, 3).map((anomaly, idx) => (
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
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="category" stroke="var(--color-foreground)" fontSize={10} />
                      <YAxis stroke="var(--color-foreground)" fontSize={10} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="impact" fill="var(--color-primary)" />
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
    </div>
  );
}
