'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { 
  Send, 
  Paperclip,
  FileSpreadsheet, 
  X,
  Sparkles,
  Loader2,
  Plus,
  MessageSquare
} from 'lucide-react';

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
  const { setUploadedFile, setAgentData, setSessionId, addToSessionHistory } = useAppContext();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your AI Financial Analyst powered by Gemini 2.5 Pro. Upload a CSV file with your financial data and ask me anything about it.",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        setAgentData(data);
        
        addToSessionHistory({
          session_id: data.session_id,
          timestamp: new Date().toISOString(),
          file_name: file.name,
          last_query: userMessage.content,
          data,
        });
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || data.answer || 'I apologize, but I encountered an issue.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (file) {
        removeFile();
      }

    } catch (err) {
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
    removeFile();
  };

  return (
    <div className="min-h-screen bg-black flex flex-col pt-20">
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-20 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white">AI Financial Analyst</h1>
                <p className="text-xs text-white/60">Powered by Gemini 2.5 Pro</p>
              </div>
            </div>
            <Button onClick={startNewChat} size="sm" variant="glass" className="gap-2">
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
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
                  <div className="flex-shrink-0 w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
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
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                  <p className="text-xs text-white/40 mt-2">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                <div className="flex-shrink-0 w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
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
  );
}