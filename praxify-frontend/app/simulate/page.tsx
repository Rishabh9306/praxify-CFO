'use client';

import { useState, useCallback } from 'react';
import { useAppContext } from '@/lib/app-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, DollarSign, Upload, FileSpreadsheet, X } from 'lucide-react';
import { SimulationResult } from '@/lib/types';

export default function SimulatePage() {
  const { uploadedFile, setUploadedFile } = useAppContext();
  const [file, setFile] = useState<File | null>(uploadedFile);
  const [isDragging, setIsDragging] = useState(false);
  const [parameter, setParameter] = useState<string>('expenses');
  const [changePercent, setChangePercent] = useState<string>('10');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
      setUploadedFile(droppedFile);
      setError(null);
    } else {
      setError('Please upload a valid CSV file');
    }
  }, [setUploadedFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setUploadedFile(selectedFile);
      setError(null);
    } else {
      setError('Please upload a valid CSV file');
    }
  }, [setUploadedFile]);

  const removeFile = () => {
    setFile(null);
    setUploadedFile(null);
  };

  const handleSimulate = async () => {
    if (!file) {
      setError('Please upload a CSV file first');
      return;
    }

    const change = parseFloat(changePercent);
    if (isNaN(change)) {
      setError('Please enter a valid percentage');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('parameter', parameter);
      formData.append('change_percent', change.toString());

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/simulate`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Simulation API response:', data);
      
      // Validate the response structure
      if (!data.baseline || !data.simulation_results) {
        console.error('Invalid response structure:', data);
        throw new Error('Invalid response from API: missing baseline or simulation data');
      }
      
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run simulation');
    } finally {
      setIsLoading(false);
    }
  };

  const ComparisonCard = ({ 
    title, 
    baseline, 
    simulated, 
    label 
  }: { 
    title: string; 
    baseline: number | undefined; 
    simulated: number | undefined; 
    label: string;
  }) => {
    if (baseline === undefined || simulated === undefined) return null;
    
    const difference = simulated - baseline;
    const percentChange = ((difference / baseline) * 100).toFixed(2);
    const isPositive = difference >= 0;

    return (
      <Card className="bg-white/5 border-white/20 backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardDescription className="text-white/60">{title}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-white/50 mb-1">Baseline</p>
            <p className="text-2xl font-bold text-white">
              ${baseline.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/50 mb-1">Simulated</p>
            <p className="text-2xl font-bold text-white">
              ${simulated.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className={`flex items-center gap-2 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span className="font-semibold">
              {isPositive ? '+' : ''}{percentChange}%
            </span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-black pt-20 pb-20">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-6 backdrop-blur-md">
            <TrendingUp className="h-4 w-4 text-white" />
            <span className="text-sm font-medium font-mono text-white">SCENARIO SIMULATOR</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">What-If Analysis</h1>
          <p className="text-white/70 text-lg">
            Test financial scenarios to understand potential outcomes
          </p>
        </div>

        {/* Upload Section */}
        <Card className="mb-8 bg-white/5 border-white/20 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Financial Data
            </CardTitle>
            <CardDescription className="text-white/60">
              Upload your CSV file to begin scenario simulation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-white bg-white/10'
                    : 'border-white/30 hover:border-white/50 hover:bg-white/5'
                }`}
              >
                <input
                  type="file"
                  id="file-upload"
                  accept=".csv"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-white/10 rounded-full">
                      <FileSpreadsheet className="h-12 w-12 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white mb-2">
                        Drop your CSV file here or click to browse
                      </p>
                      <p className="text-sm text-white/60">
                        Supports financial data in CSV format
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-white/10 rounded-lg border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <FileSpreadsheet className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{file.name}</p>
                    <p className="text-sm text-white/60">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button
                  onClick={removeFile}
                  size="sm"
                  variant="glass"
                  className="text-white/60 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Simulation Parameters */}
        <Card className="mb-8 bg-white/5 border-white/20 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">Simulation Parameters</CardTitle>
            <CardDescription className="text-white/60">Configure your what-if scenario</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="parameter" className="text-white">Parameter to Change</Label>
                <Select value={parameter} onValueChange={setParameter}>
                  <SelectTrigger id="parameter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="expenses">Expenses</SelectItem>
                    <SelectItem value="profit">Profit</SelectItem>
                    <SelectItem value="cash_flow">Cash Flow</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="change" className="text-white">Change Percentage</Label>
                <div className="flex gap-2">
                  <Input
                    id="change"
                    type="number"
                    value={changePercent}
                    onChange={(e) => setChangePercent(e.target.value)}
                    placeholder="10"
                    step="0.1"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                  <span className="flex items-center px-3 text-white/60">%</span>
                </div>
                <p className="text-xs text-white/50">
                  Positive values increase, negative values decrease
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Button
              onClick={handleSimulate}
              disabled={!file || isLoading}
              className="w-full gap-2"
            >
              {isLoading ? 'Running Simulation...' : (
                <>
                  <TrendingUp className="h-4 w-4" />
                  Run Simulation
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">Simulation Results</h2>
              <Card className="bg-white/5 border-white/20 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-white">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-4 bg-white/10 rounded-lg border border-white/20">
                    <p className="font-semibold mb-2 text-white">Scenario:</p>
                    <p className="text-white/70">
                      {result.scenario.parameter_changed} changed by {result.scenario.change_percentage > 0 ? '+' : ''}
                      {result.scenario.change_percentage}%
                    </p>
                  </div>
                  <p className="whitespace-pre-wrap text-white/70">
                    {result.summary_text}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 text-white">Before vs. After Comparison</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <ComparisonCard
                  title="TOTAL PROFIT"
                  baseline={result.baseline.total_profit}
                  simulated={result.simulation_results.total_profit}
                  label="total_profit"
                />
                <ComparisonCard
                  title="TOTAL CASHFLOW"
                  baseline={result.baseline.total_cashflow}
                  simulated={result.simulation_results.total_cashflow}
                  label="total_cashflow"
                />
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-white">Impact Analysis</h3>
              <Card className="bg-white/5 border-white/20 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <TrendingUp className="h-5 w-5" />
                    Financial Impact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/10 rounded-lg border border-white/20">
                      <p className="text-xs text-white/50 mb-2">Profit Impact</p>
                      <p className="text-2xl font-bold text-white mb-1">
                        ${result.impact.profit_impact_absolute.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                      <p className={`text-sm font-semibold ${result.impact.profit_impact_absolute >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {result.impact.profit_impact_absolute >= 0 ? '+' : ''}
                        {result.impact.profit_impact_percentage.toFixed(2)}%
                      </p>
                    </div>
                    <div className="p-4 bg-white/10 rounded-lg border border-white/20">
                      <p className="text-xs text-white/50 mb-2">Cashflow Impact</p>
                      <p className="text-2xl font-bold text-white mb-1">
                        ${result.impact.cashflow_impact_absolute.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                      <p className={`text-sm font-semibold ${result.impact.cashflow_impact_absolute >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {result.impact.cashflow_impact_absolute >= 0 ? '+' : ''}
                        {result.impact.cashflow_impact_percentage.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
