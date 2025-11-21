// API Response Types for Praxifi-CFO

export interface KPIData {
  total_revenue?: number;
  total_expenses?: number;
  net_profit?: number;
  profit_margin?: number;
  [key: string]: number | undefined;
}

export interface ForecastChart {
  date: string;
  predicted: number;
  lower: number;
  upper: number;
}

export interface Anomaly {
  date: string;
  metric: string;
  actual_value: number;
  expected_value: number;
  deviation_percent: number;
  severity: string;
}

export interface ProfitDriverFeature {
  feature: string;
  contribution_score: number;
}

export interface ProfitDriver {
  insight: string;
  feature_attributions: ProfitDriverFeature[];
  model_version: string;
}

// Narratives can be in two formats depending on persona:
// finance_guardian: {summary_text, recommendations}
// financial_storyteller: {narrative}
export type Narrative = 
  | { summary_text: string; recommendations: string[] }
  | { narrative: string };

// Backend returns raw_data_preview as array of record objects
export type RawDataPreview = Array<Record<string, any>>;

export interface FullReportResponse {
  kpis: KPIData;
  forecast_chart: ForecastChart[];  // Array of forecast points
  anomalies_table: Anomaly[];  // Backend uses anomalies_table
  profit_drivers: ProfitDriver;  // Single object with feature_attributions array
  narratives: Narrative;  // Single object with summary_text and recommendations
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
  scenario: {
    parameter_changed: string;
    change_percentage: number;
  };
  baseline: {
    total_profit: number;
    total_cashflow: number;
  };
  simulation_results: {
    total_profit: number;
    total_cashflow: number;
  };
  impact: {
    profit_impact_absolute: number;
    profit_impact_percentage: number;
    cashflow_impact_absolute: number;
    cashflow_impact_percentage: number;
  };
  summary_text: string;
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
