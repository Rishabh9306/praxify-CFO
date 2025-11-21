'use client';

import { useRouter } from 'next/navigation';
import { useAppContext } from '@/lib/app-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, Download, MessageSquare, FileText, Calendar, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function ReportsPage() {
  const router = useRouter();
  const { sessionHistory, loadSessionFromHistory } = useAppContext();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleLoadSession = (sessionId: string) => {
    loadSessionFromHistory(sessionId);
    router.push('/chat');
  };

  const handleExportJSON = (sessionId: string) => {
    const session = sessionHistory.find(s => s.session_id === sessionId);
    if (!session) return;

    const dataStr = JSON.stringify(session.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `praxifi-cfo-session-${sessionId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportConversation = (sessionId: string) => {
    const session = sessionHistory.find(s => s.session_id === sessionId);
    if (!session?.data?.conversation_history) return;

    const conversationText = session.data.conversation_history
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n');

    const textBlob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(textBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `praxifi-cfo-conversation-${sessionId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteSession = (sessionId: string) => {
    if (confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      setDeletingId(sessionId);
      // Update localStorage
      const updatedHistory = sessionHistory.filter(s => s.session_id !== sessionId);
      localStorage.setItem('praxifi-cfo-sessions', JSON.stringify(updatedHistory));
      window.location.reload();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-20">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Session History & Reports</h1>
          <p className="text-muted-foreground text-lg">
            Review past analyses and export your financial insights
          </p>
        </div>

        {sessionHistory.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <History className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Sessions Yet</h3>
              <p className="text-muted-foreground mb-6">
                Start by uploading a file and running an analysis
              </p>
              <Button onClick={() => router.push('/upload')}>
                Go to Upload
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {sessionHistory.map((session) => (
              <Card key={session.session_id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-3 mb-2">
                        <FileText className="h-5 w-5" />
                        {session.file_name}
                      </CardTitle>
                      <CardDescription className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(session.timestamp)}</span>
                        </div>
                        <div className="font-mono text-xs">
                          Session ID: {session.session_id}
                        </div>
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleDeleteSession(session.session_id)}
                      disabled={deletingId === session.session_id}
                      className="gap-2"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {session.last_query && (
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-semibold mb-1">Last Query:</p>
                      <p className="text-sm text-muted-foreground">{session.last_query}</p>
                    </div>
                  )}

                  {session.data && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold mb-2">Session Stats:</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Messages</p>
                          <p className="font-semibold">
                            {session.data.conversation_history?.length || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">KPIs</p>
                          <p className="font-semibold">
                            {Object.keys(session.data.full_analysis_report?.kpis || {}).length}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Anomalies</p>
                          <p className="font-semibold">
                            {session.data.full_analysis_report?.anomalies?.length || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Narratives</p>
                          <p className="font-semibold">
                            {session.data.full_analysis_report?.narratives?.length || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => handleLoadSession(session.session_id)}
                      className="gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Resume Session
                    </Button>
                    <Button
                      onClick={() => handleExportJSON(session.session_id)}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export JSON
                    </Button>
                    {session.data?.conversation_history && (
                      <Button
                        onClick={() => handleExportConversation(session.session_id)}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Export Conversation
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="mt-12">
          <CardHeader>
            <CardTitle>About Session Storage</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              • Sessions are stored locally in your browser's localStorage
            </p>
            <p>
              • Data persists between browser sessions but is device-specific
            </p>
            <p>
              • For production use, consider implementing server-side session management
            </p>
            <p>
              • Export important analyses to preserve them permanently
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
