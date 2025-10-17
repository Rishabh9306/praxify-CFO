'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Book, 
  Code, 
  Database, 
  Cpu, 
  ArrowRight, 
  Copy, 
  CheckCircle2,
  FileCode,
  Server,
  Layers
} from 'lucide-react';

export default function DocsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const apiEndpoints = [
    {
      method: 'POST',
      path: '/api/full_report',
      description: 'Generate complete static financial report',
      params: [
        { name: 'file', type: 'File', required: true, description: 'CSV file with financial data' },
        { name: 'persona', type: 'string', required: true, description: 'finance_guardian | financial_storyteller' },
        { name: 'forecast_metric', type: 'string', required: true, description: 'revenue | expenses | profit | cash_flow' },
      ],
      example: `curl -X POST http://localhost:8000/api/full_report \\
  -F "file=@data.csv" \\
  -F "persona=finance_guardian" \\
  -F "forecast_metric=revenue"`
    },
    {
      method: 'POST',
      path: '/api/agent/analyze_and_respond',
      description: 'Interactive conversational analysis with memory',
      params: [
        { name: 'file', type: 'File', required: true, description: 'CSV file with financial data' },
        { name: 'persona', type: 'string', required: true, description: 'finance_guardian | financial_storyteller' },
        { name: 'forecast_metric', type: 'string', required: true, description: 'revenue | expenses | profit | cash_flow' },
        { name: 'user_query', type: 'string', required: true, description: 'User question or query' },
        { name: 'session_id', type: 'string', required: false, description: 'Session ID for conversation history' },
      ],
      example: `curl -X POST http://localhost:8000/api/agent/analyze_and_respond \\
  -F "file=@data.csv" \\
  -F "persona=finance_guardian" \\
  -F "forecast_metric=revenue" \\
  -F "user_query=What are the key risks?" \\
  -F "session_id=abc-123"`
    },
    {
      method: 'POST',
      path: '/api/simulate',
      description: 'Run what-if scenario simulation',
      params: [
        { name: 'file', type: 'File', required: true, description: 'CSV file with financial data' },
        { name: 'persona', type: 'string', required: true, description: 'finance_guardian | financial_storyteller' },
        { name: 'forecast_metric', type: 'string', required: true, description: 'revenue | expenses | profit | cash_flow' },
        { name: 'parameter', type: 'string', required: true, description: 'Parameter to change' },
        { name: 'change_pct', type: 'number', required: true, description: 'Percentage change (e.g., 10, -5)' },
      ],
      example: `curl -X POST http://localhost:8000/api/simulate \\
  -F "file=@data.csv" \\
  -F "persona=finance_guardian" \\
  -F "forecast_metric=revenue" \\
  -F "parameter=expenses" \\
  -F "change_pct=-10"`
    },
  ];

  const architectureComponents = [
    {
      name: 'Data Ingestion',
      description: 'NLP-based column mapping using spaCy for flexible CSV parsing',
      features: ['Synonym matching', 'Similarity threshold > 0.75', 'Auto-normalization']
    },
    {
      name: 'Validation & QA',
      description: 'Missing value imputation and outlier detection',
      features: ['Median/mean imputation', 'Z-score outlier detection', 'Correction logging']
    },
    {
      name: 'Forecasting',
      description: 'Multi-model time series prediction',
      features: ['Prophet & AutoARIMA', 'RMSE comparison', '3-month horizon']
    },
    {
      name: 'Anomaly Detection',
      description: 'Automated pattern recognition',
      features: ['IQR method', 'Isolation Forest', 'Severity classification']
    },
    {
      name: 'AI Agent',
      description: 'Conversational intelligence with Google Gemini',
      features: ['Context injection', 'Session memory', 'Natural language queries']
    },
    {
      name: 'Explainability',
      description: 'SHAP-based profit driver analysis',
      features: ['RandomForest training', 'Feature attribution', 'Top 5 contributors']
    },
  ];

  return (
    <div className="min-h-screen bg-background pt-32 pb-20">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Documentation</h1>
          <p className="text-muted-foreground text-lg">
            Comprehensive guides, API reference, and architecture documentation
          </p>
        </div>

        <Tabs defaultValue="quickstart" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
            <TabsTrigger value="api">API Reference</TabsTrigger>
            <TabsTrigger value="architecture">Architecture</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
          </TabsList>

          {/* Quick Start */}
          <TabsContent value="quickstart" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="h-5 w-5" />
                  Getting Started
                </CardTitle>
                <CardDescription>Follow these steps to start analyzing your financial data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Prepare Your CSV File</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Your CSV should contain financial data with at minimum: date, revenue, and expenses columns.
                        The system uses NLP to map column names automatically.
                      </p>
                      <div className="bg-muted p-4 rounded-lg font-mono text-xs">
                        <div>date,revenue,expenses,profit</div>
                        <div>2024-01-01,100000,70000,30000</div>
                        <div>2024-02-01,110000,75000,35000</div>
                        <div>...</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Upload & Configure</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Navigate to the Upload page, drag and drop your CSV file, and select:
                      </p>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>Persona Mode (Guardian or Storyteller)</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>Forecast Metric (Revenue, Expenses, Profit, or Cash Flow)</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Choose Analysis Path</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Select between two analysis modes:
                      </p>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-3 border rounded-lg">
                          <h4 className="font-semibold text-sm mb-1">Static Report</h4>
                          <p className="text-xs text-muted-foreground">
                            One-shot comprehensive analysis with dashboards
                          </p>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <h4 className="font-semibold text-sm mb-1">AI Agent Chat</h4>
                          <p className="text-xs text-muted-foreground">
                            Interactive Q&A with persistent memory
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      4
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Explore & Export</h3>
                      <p className="text-sm text-muted-foreground">
                        View KPIs, forecasts, anomalies, and AI narratives. Export session data from the Reports page.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Data Requirements</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• CSV format</li>
                      <li>• Maximum file size: 100MB</li>
                      <li>• Minimum 24 months of data (for forecasting)</li>
                      <li>• Required columns: date, revenue, expenses</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Browser Support</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Chrome 90+</li>
                      <li>• Firefox 88+</li>
                      <li>• Safari 14+</li>
                      <li>• Edge 90+</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Reference */}
          <TabsContent value="api" className="space-y-6">
            {apiEndpoints.map((endpoint, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded">
                          {endpoint.method}
                        </span>
                        <code className="text-lg font-mono">{endpoint.path}</code>
                      </CardTitle>
                      <CardDescription className="mt-2">{endpoint.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">Parameters</h4>
                    <div className="space-y-2">
                      {endpoint.params.map((param, pIdx) => (
                        <div key={pIdx} className="flex items-start gap-3 text-sm p-3 bg-muted/50 rounded-lg">
                          <code className="text-primary font-semibold">{param.name}</code>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 bg-background border rounded text-xs font-mono">
                                {param.type}
                              </span>
                              {param.required && (
                                <span className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded text-xs font-semibold">
                                  Required
                                </span>
                              )}
                            </div>
                            <p className="text-muted-foreground">{param.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">Example Request</h4>
                      <Button
                        size="sm"
                        onClick={() => copyToClipboard(endpoint.example, endpoint.path)}
                        className="gap-2"
                      >
                        {copiedCode === endpoint.path ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="bg-muted p-4 rounded-lg font-mono text-xs overflow-x-auto">
                      <pre>{endpoint.example}</pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Architecture */}
          <TabsContent value="architecture" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  System Architecture
                </CardTitle>
                <CardDescription>Overview of the Praxify CFO platform architecture</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4">Technology Stack</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <Code className="h-5 w-5 text-primary" />
                          <h4 className="font-semibold">Frontend</h4>
                        </div>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>Next.js 15</li>
                          <li>TypeScript</li>
                          <li>Tailwind CSS</li>
                          <li>Recharts</li>
                        </ul>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <Server className="h-5 w-5 text-primary" />
                          <h4 className="font-semibold">Backend</h4>
                        </div>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>Python FastAPI</li>
                          <li>Google Gemini AI</li>
                          <li>Prophet</li>
                          <li>SHAP</li>
                        </ul>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <Database className="h-5 w-5 text-primary" />
                          <h4 className="font-semibold">Storage</h4>
                        </div>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>Redis (Memory)</li>
                          <li>Local Storage</li>
                          <li>Docker Volumes</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-4">Core Components</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {architectureComponents.map((component, idx) => (
                        <div key={idx} className="p-4 border rounded-lg">
                          <h4 className="font-semibold mb-2">{component.name}</h4>
                          <p className="text-sm text-muted-foreground mb-3">{component.description}</p>
                          <ul className="space-y-1">
                            {component.features.map((feature, fIdx) => (
                              <li key={fIdx} className="text-xs text-muted-foreground flex items-center gap-2">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-4">Data Flow</h3>
                    <div className="bg-muted/50 p-6 rounded-lg font-mono text-xs space-y-2">
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-primary" />
                        <span>CSV Upload → Data Ingestion (NLP Mapping)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-primary" />
                        <span>Validation & QA → Feature Engineering</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-primary" />
                        <span>Forecasting + Anomaly Detection (Parallel)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-primary" />
                        <span>Correlation Analysis + Explainability</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-primary" />
                        <span>Dashboard Generation → JSON Response</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Examples */}
          <TabsContent value="examples" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCode className="h-5 w-5" />
                  Code Examples
                </CardTitle>
                <CardDescription>Common use cases and integration examples</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">TypeScript Client Example</h3>
                  <div className="bg-muted p-4 rounded-lg font-mono text-xs overflow-x-auto">
                    <pre>{`// Upload and get static report
async function generateReport(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('persona', 'finance_guardian');
  formData.append('forecast_metric', 'revenue');

  const response = await fetch(\`\${process.env.NEXT_PUBLIC_API_URL}/api/full_report\`, {
    method: 'POST',
    body: formData,
  });

  return await response.json();
}`}</pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Conversational Agent Example</h3>
                  <div className="bg-muted p-4 rounded-lg font-mono text-xs overflow-x-auto">
                    <pre>{`// Start a conversation session
async function startChat(file: File, query: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('persona', 'financial_storyteller');
  formData.append('forecast_metric', 'profit');
  formData.append('user_query', query);
  formData.append('session_id', ''); // Empty for first query

  const response = await fetch(\`\${process.env.NEXT_PUBLIC_API_URL}/api/agent/analyze_and_respond\`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  return data.session_id; // Save for follow-up queries
}`}</pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Scenario Simulation Example</h3>
                  <div className="bg-muted p-4 rounded-lg font-mono text-xs overflow-x-auto">
                    <pre>{`// Test what-if scenario
async function simulate(file: File, parameter: string, change: number) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('persona', 'finance_guardian');
  formData.append('forecast_metric', 'revenue');
  formData.append('parameter', parameter); // e.g., 'expenses'
  formData.append('change_percent', change.toString()); // Updated parameter name

  const response = await fetch(\`\${process.env.NEXT_PUBLIC_API_URL}/api/simulate\`, {
    method: 'POST',
    body: formData,
  });

  return await response.json();
}`}</pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer CTA */}
        <div className="mt-12 p-8 bg-primary/10 border border-primary/20 rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-3">Need More Help?</h2>
          <p className="text-muted-foreground mb-6">
            Check out our comprehensive documentation or contact support
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <a href="https://github.com/your-repo/praxify-cfo" target="_blank" rel="noopener noreferrer">
                View on GitHub
              </a>
            </Button>
            <Button asChild>
              <a href="mailto:support@praxify.com">
                Contact Support
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
