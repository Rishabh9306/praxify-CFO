'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { FullReportResponse, AgentAnalyzeResponse, SessionHistoryItem, UploadConfig } from './types';

interface AppState {
  // File management
  uploadedFile: File | null;
  uploadConfig: UploadConfig | null;
  
  // Session management
  sessionId: string | null;
  
  // Data caching
  fullReportData: FullReportResponse | null;
  agentData: AgentAnalyzeResponse | null;
  
  // Session history
  sessionHistory: SessionHistoryItem[];
}

interface AppContextValue extends AppState {
  setUploadedFile: (file: File | null) => void;
  setUploadConfig: (config: UploadConfig | null) => void;
  setSessionId: (id: string | null) => void;
  setFullReportData: (data: FullReportResponse | null) => void;
  setAgentData: (data: AgentAnalyzeResponse | null) => void;
  addToSessionHistory: (session: SessionHistoryItem) => void;
  clearAppState: () => void;
  loadSessionFromHistory: (sessionId: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = 'praxify-cfo-sessions';

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    // Load session history from localStorage on init
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return {
          uploadedFile: null,
          uploadConfig: null,
          sessionId: null,
          fullReportData: null,
          agentData: null,
          sessionHistory: stored ? JSON.parse(stored) : [],
        };
      } catch (e) {
        console.error('Failed to load session history:', e);
      }
    }
    
    return {
      uploadedFile: null,
      uploadConfig: null,
      sessionId: null,
      fullReportData: null,
      agentData: null,
      sessionHistory: [],
    };
  });

  const setUploadedFile = useCallback((file: File | null) => {
    setState(prev => ({ ...prev, uploadedFile: file }));
  }, []);

  const setUploadConfig = useCallback((config: UploadConfig | null) => {
    setState(prev => ({ ...prev, uploadConfig: config }));
  }, []);

  const setSessionId = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, sessionId: id }));
  }, []);

  const setFullReportData = useCallback((data: FullReportResponse | null) => {
    setState(prev => ({ ...prev, fullReportData: data }));
  }, []);

  const setAgentData = useCallback((data: AgentAnalyzeResponse | null) => {
    setState(prev => ({ 
      ...prev, 
      agentData: data,
      sessionId: data?.session_id || prev.sessionId,
    }));
  }, []);

  const addToSessionHistory = useCallback((session: SessionHistoryItem) => {
    setState(prev => {
      const newHistory = [session, ...prev.sessionHistory.filter(s => s.session_id !== session.session_id)];
      
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
        } catch (e) {
          console.error('Failed to save session history:', e);
        }
      }
      
      return { ...prev, sessionHistory: newHistory };
    });
  }, []);

  const loadSessionFromHistory = useCallback((sessionId: string) => {
    const session = state.sessionHistory.find(s => s.session_id === sessionId);
    if (session?.data) {
      setState(prev => ({
        ...prev,
        sessionId: session.session_id,
        agentData: session.data || null,
        fullReportData: session.data?.full_analysis_report || null,
      }));
    }
  }, [state.sessionHistory]);

  const clearAppState = useCallback(() => {
    setState(prev => ({
      ...prev,
      uploadedFile: null,
      uploadConfig: null,
      sessionId: null,
      fullReportData: null,
      agentData: null,
    }));
  }, []);

  const value: AppContextValue = {
    ...state,
    setUploadedFile,
    setUploadConfig,
    setSessionId,
    setFullReportData,
    setAgentData,
    addToSessionHistory,
    clearAppState,
    loadSessionFromHistory,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
