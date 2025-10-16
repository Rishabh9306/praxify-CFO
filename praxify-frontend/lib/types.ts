// API Response Types for Praxify-CFO

export interface KPIData {
  total_revenue?: number;
  total_expenses?: number;
  net_profit?: number;
  profit_margin?: number;
  [key: string]: number | undefined;
}

export interface ForecastChart {
  dates: string[];
  actual: number[];
  forecast: number[];
}

export interface Anomaly {
  date: string;
  metric: string;
  actual_value: number;
  expected_value: number;
  deviation_percent: number;
  severity: string;
}

export interface ProfitDriver {
  category: string;
  impact: number;
  percentage: number;
}

export interface Narrative {
  title: string;
  content: string;
  tone?: string;
}

export interface RawDataPreview {
  columns: string[];
  rows: Array<Record<string, any>>;
}

export interface FullReportResponse {
  kpis: KPIData;
  forecast_chart: ForecastChart;
  anomalies: Anomaly[];
  profit_drivers: ProfitDriver[];
  narratives: Narrative[];
  raw_data_preview?: RawDataPreview;
  timestamp?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AgentAnalyzeResponse {
  session_id: string;
  user_query: string;
  ai_response: string;
  full_analysis_report: FullReportResponse;
  conversation_history: ChatMessage[];
}

export interface SimulationResult {
  baseline: {
    kpis: KPIData;
    narrative: string;
  };
  simulation_results: {
    kpis: KPIData;
    narrative: string;
  };
  summary_text: string;
  parameter_changed: string;
  change_percent: number;
}

export interface SessionHistoryItem {
  session_id: string;
  timestamp: string;
  file_name: string;
  last_query?: string;
  data?: AgentAnalyzeResponse;
}

export type PersonaMode = 'finance_guardian' | 'financial_storyteller';

export type ForecastMetric = 'revenue' | 'expenses' | 'profit' | 'cash_flow';

export interface UploadConfig {
  persona: PersonaMode;
  forecast_metric: ForecastMetric;
}
