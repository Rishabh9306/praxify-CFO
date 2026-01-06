"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Shield,
  Target,
  DollarSign,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
  Sparkles,
  FileCheck,
  XCircle,
  Info
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TaxDashboard {
  summary: any
  itc_analysis: any
  rcm_analysis: any
  optimization: any
  risk_assessment: any
  reconciliation: any
}

export default function TaxIQPage() {
  const [uploadedFiles, setUploadedFiles] = useState<{
    purchase: File | null
    sales: File | null
    expense: File | null
  }>({
    purchase: null,
    sales: null,
    expense: null
  })
  
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dashboard, setDashboard] = useState<TaxDashboard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    itc: true,
    rcm: true,
    optimization: true,
    risk: true,
    reconciliation: false
  })

  const handleFileUpload = (type: 'purchase' | 'sales' | 'expense', file: File) => {
    setUploadedFiles(prev => ({ ...prev, [type]: file }))
    setError(null)
  }

  const uploadFilesAndGetDashboard = async () => {
    if (!uploadedFiles.purchase || !uploadedFiles.sales || !uploadedFiles.expense) {
      setError("Please upload all three CSV files before proceeding")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

      // Upload Purchase Register
      setUploadProgress(10)
      const purchaseFormData = new FormData()
      purchaseFormData.append('file', uploadedFiles.purchase)
      const purchaseRes = await fetch(`${API_BASE}/api/tax/upload/purchase-register`, {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
        body: purchaseFormData
      })
      if (!purchaseRes.ok) {
        const errorText = await purchaseRes.text()
        throw new Error(`Failed to upload purchase register: ${errorText.substring(0, 100)}`)
      }
      setUploadProgress(30)

      // Upload Sales Register
      const salesFormData = new FormData()
      salesFormData.append('file', uploadedFiles.sales)
      const salesRes = await fetch(`${API_BASE}/api/tax/upload/sales-register`, {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
        body: salesFormData
      })
      if (!salesRes.ok) {
        const errorText = await salesRes.text()
        throw new Error(`Failed to upload sales register: ${errorText.substring(0, 100)}`)
      }
      setUploadProgress(60)

      // Upload Expense Register
      const expenseFormData = new FormData()
      expenseFormData.append('file', uploadedFiles.expense)
      const expenseRes = await fetch(`${API_BASE}/api/tax/upload/expense-register`, {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
        body: expenseFormData
      })
      if (!expenseRes.ok) {
        const errorText = await expenseRes.text()
        throw new Error(`Failed to upload expense register: ${errorText.substring(0, 100)}`)
      }
      setUploadProgress(80)

      // Get Dashboard
      const dashboardRes = await fetch(`${API_BASE}/api/tax/dashboard?include_reconciliation=true`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      })
      if (!dashboardRes.ok) {
        const errorText = await dashboardRes.text()
        throw new Error(`Failed to generate dashboard: ${errorText.substring(0, 100)}`)
      }
      const dashboardData = await dashboardRes.json()
      setDashboard(dashboardData)
      setUploadProgress(100)

    } catch (err: any) {
      setError(err.message || "An error occurred during upload")
    } finally {
      setIsUploading(false)
    }
  }

  const resetDashboard = () => {
    setDashboard(null)
    setUploadedFiles({ purchase: null, sales: null, expense: null })
    setError(null)
    setUploadProgress(0)
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  const getRiskColor = (level: string) => {
    switch(level.toLowerCase()) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/30'
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/30'
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30'
      case 'low': return 'text-blue-500 bg-blue-500/10 border-blue-500/30'
      default: return 'text-green-500 bg-green-500/10 border-green-500/30'
    }
  }

  return (
    <div className="min-h-screen bg-black text-white pt-24">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">
                TaxIQ - GST Intelligence Engine
              </h1>
              <p className="text-muted-foreground mt-1">
                AI-powered GST compliance, ITC optimization, and tax intelligence for Indian businesses
              </p>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        {!dashboard && (
          <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Upload Your GST Data
              </CardTitle>
              <CardDescription>
                Upload your purchase register, sales register, and expense register CSV files to get instant AI-powered tax intelligence
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload Cards */}
              <div className="grid md:grid-cols-3 gap-4">
                {/* Purchase Register */}
                <Card className={`border-2 transition-all relative overflow-hidden ${uploadedFiles.purchase ? 'border-green-500/50 bg-green-500/5' : 'border-dashed border-muted-foreground/30'}`}>
                  {/* Diagonal Styling */}
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary/20 to-transparent transform rotate-45 translate-x-8 -translate-y-8" />
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tl from-primary/20 to-transparent transform rotate-45 -translate-x-8 translate-y-8" />
                  
                  <CardHeader className="relative z-10">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Purchase Register
                      </span>
                      {uploadedFiles.purchase && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => e.target.files && handleFileUpload('purchase', e.target.files[0])}
                      className="hidden"
                      id="purchase-upload"
                    />
                    <label htmlFor="purchase-upload" className="block relative overflow-hidden rounded-lg">
                      {/* Diagonal styling for button */}
                      <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-primary/20 to-transparent transform rotate-45 translate-x-4 -translate-y-4 pointer-events-none z-20" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 bg-gradient-to-tl from-primary/20 to-transparent transform rotate-45 -translate-x-4 translate-y-4 pointer-events-none z-20" />
                      <Button variant="glass" size="sm" className="w-full relative z-10" asChild>
                        <span className="cursor-pointer">
                          {uploadedFiles.purchase ? uploadedFiles.purchase.name : 'Choose CSV File'}
                        </span>
                      </Button>
                    </label>
                    <p className="text-xs text-muted-foreground mt-2">
                      Required: invoice_no, date, vendor_name, amount
                    </p>
                  </CardContent>
                </Card>

                {/* Sales Register */}
                <Card className={`border-2 transition-all relative overflow-hidden ${uploadedFiles.sales ? 'border-green-500/50 bg-green-500/5' : 'border-dashed border-muted-foreground/30'}`}>
                  {/* Diagonal Styling */}
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary/20 to-transparent transform rotate-45 translate-x-8 -translate-y-8" />
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tl from-primary/20 to-transparent transform rotate-45 -translate-x-8 translate-y-8" />
                  
                  <CardHeader className="relative z-10">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Sales Register
                      </span>
                      {uploadedFiles.sales && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => e.target.files && handleFileUpload('sales', e.target.files[0])}
                      className="hidden"
                      id="sales-upload"
                    />
                    <label htmlFor="sales-upload" className="block relative overflow-hidden rounded-lg">
                      {/* Diagonal styling for button */}
                      <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-primary/20 to-transparent transform rotate-45 translate-x-4 -translate-y-4 pointer-events-none z-20" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 bg-gradient-to-tl from-primary/20 to-transparent transform rotate-45 -translate-x-4 translate-y-4 pointer-events-none z-20" />
                      <Button variant="glass" size="sm" className="w-full relative z-10" asChild>
                        <span className="cursor-pointer">
                          {uploadedFiles.sales ? uploadedFiles.sales.name : 'Choose CSV File'}
                        </span>
                      </Button>
                    </label>
                    <p className="text-xs text-muted-foreground mt-2">
                      Required: invoice_no, date, buyer_name, amount
                    </p>
                  </CardContent>
                </Card>

                {/* Expense Register */}
                <Card className={`border-2 transition-all relative overflow-hidden ${uploadedFiles.expense ? 'border-green-500/50 bg-green-500/5' : 'border-dashed border-muted-foreground/30'}`}>
                  {/* Diagonal Styling */}
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary/20 to-transparent transform rotate-45 translate-x-8 -translate-y-8" />
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tl from-primary/20 to-transparent transform rotate-45 -translate-x-8 translate-y-8" />
                  
                  <CardHeader className="relative z-10">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Expense Register
                      </span>
                      {uploadedFiles.expense && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => e.target.files && handleFileUpload('expense', e.target.files[0])}
                      className="hidden"
                      id="expense-upload"
                    />
                    <label htmlFor="expense-upload" className="block relative overflow-hidden rounded-lg">
                      {/* Diagonal styling for button */}
                      <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-primary/20 to-transparent transform rotate-45 translate-x-4 -translate-y-4 pointer-events-none z-20" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 bg-gradient-to-tl from-primary/20 to-transparent transform rotate-45 -translate-x-4 translate-y-4 pointer-events-none z-20" />
                      <Button variant="glass" size="sm" className="w-full relative z-10" asChild>
                        <span className="cursor-pointer">
                          {uploadedFiles.expense ? uploadedFiles.expense.name : 'Choose CSV File'}
                        </span>
                      </Button>
                    </label>
                    <p className="text-xs text-muted-foreground mt-2">
                      Required: date, description, amount
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-sm text-center text-muted-foreground">
                    {uploadProgress < 30 ? 'Uploading purchase register...' :
                     uploadProgress < 60 ? 'Uploading sales register...' :
                     uploadProgress < 80 ? 'Uploading expense register...' :
                     'Generating TaxIQ dashboard...'}
                  </p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Generate Button */}
              <Button 
                onClick={uploadFilesAndGetDashboard}
                disabled={!uploadedFiles.purchase || !uploadedFiles.sales || !uploadedFiles.expense || isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing GST Data...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate TaxIQ Dashboard
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Dashboard Display */}
        {dashboard && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-sm px-4 py-2">
                <Clock className="mr-2 h-4 w-4" />
                Generated: {new Date(dashboard.summary.analysis_date).toLocaleString('en-IN')}
              </Badge>
              <Button onClick={resetDashboard} variant="glass" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                New Analysis
              </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              {/* Total Purchases */}
              <Card className="border-blue-500/30 bg-blue-500/5">
                <CardHeader className="pb-3">
                  <CardDescription className="text-xs">Total Purchases</CardDescription>
                  <CardTitle className="text-2xl">{formatCurrency(dashboard.summary.total_purchases)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{dashboard.summary.purchase_count} records</p>
                </CardContent>
              </Card>

              {/* Total Sales */}
              <Card className="border-green-500/30 bg-green-500/5">
                <CardHeader className="pb-3">
                  <CardDescription className="text-xs">Total Sales</CardDescription>
                  <CardTitle className="text-2xl">{formatCurrency(dashboard.summary.total_sales)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{dashboard.summary.sales_count} records</p>
                </CardContent>
              </Card>

              {/* Net GST */}
              <Card className={`border-2 ${dashboard.summary.net_gst_liability < 0 ? 'border-green-500/30 bg-green-500/5' : 'border-orange-500/30 bg-orange-500/5'}`}>
                <CardHeader className="pb-3">
                  <CardDescription className="text-xs">Net GST Position</CardDescription>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    {dashboard.summary.net_gst_liability < 0 ? (
                      <TrendingDown className="h-5 w-5 text-green-500" />
                    ) : (
                      <TrendingUp className="h-5 w-5 text-orange-500" />
                    )}
                    {formatCurrency(Math.abs(dashboard.summary.net_gst_liability))}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className={dashboard.summary.net_gst_liability < 0 ? 'text-green-500' : 'text-orange-500'}>
                    {dashboard.summary.net_gst_liability < 0 ? 'Refund Position' : 'Payable'}
                  </Badge>
                </CardContent>
              </Card>

              {/* Potential Savings */}
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardDescription className="text-xs">Total Potential Savings</CardDescription>
                  <CardTitle className="text-2xl">{formatCurrency(dashboard.summary.total_potential_savings)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className="text-primary">
                    <Target className="mr-1 h-3 w-3" />
                    Recoverable
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Compliance Score */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Compliance Overview</CardTitle>
                    <CardDescription>Your GST compliance health at a glance</CardDescription>
                  </div>
                  <Badge className={getRiskColor(dashboard.risk_assessment.risk_level)}>
                    {dashboard.risk_assessment.risk_level} Risk
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Compliance Score</span>
                      <span className="text-xl font-bold">{dashboard.summary.compliance_score}/100</span>
                    </div>
                    <Progress value={dashboard.summary.compliance_score} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Audit Probability</span>
                      <span className="text-xl font-bold text-orange-500">{dashboard.risk_assessment.audit_probability}%</span>
                    </div>
                    <Progress value={dashboard.risk_assessment.audit_probability} className="h-2 [&>div]:bg-orange-500" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Risk Score</span>
                      <span className="text-xl font-bold text-red-500">{dashboard.summary.risk_score}/100</span>
                    </div>
                    <Progress value={dashboard.summary.risk_score} className="h-2 [&>div]:bg-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Analysis Tabs */}
            <Tabs defaultValue="itc" className="space-y-4">
              <TabsList className="inline-flex h-12 w-full items-center justify-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-1 gap-1">
                <TabsTrigger 
                  value="itc" 
                  className="inline-flex items-center justify-center whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200 rounded-lg px-3 h-10 font-medium text-sm cursor-pointer flex-1"
                >
                  ITC Analysis
                </TabsTrigger>
                <TabsTrigger 
                  value="rcm" 
                  className="inline-flex items-center justify-center whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200 rounded-lg px-3 h-10 font-medium text-sm cursor-pointer flex-1"
                >
                  RCM Detection
                </TabsTrigger>
                <TabsTrigger 
                  value="optimization" 
                  className="inline-flex items-center justify-center whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200 rounded-lg px-3 h-10 font-medium text-sm cursor-pointer flex-1"
                >
                  Tax Optimization
                </TabsTrigger>
                <TabsTrigger 
                  value="risk" 
                  className="inline-flex items-center justify-center whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200 rounded-lg px-3 h-10 font-medium text-sm cursor-pointer flex-1"
                >
                  Risk Assessment
                </TabsTrigger>
                <TabsTrigger 
                  value="reconciliation" 
                  className="inline-flex items-center justify-center whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200 rounded-lg px-3 h-10 font-medium text-sm cursor-pointer flex-1"
                >
                  Reconciliation
                </TabsTrigger>
              </TabsList>

              {/* ITC Analysis Tab */}
              <TabsContent value="itc" className="space-y-4">
                {/* ITC Summary Cards */}
                <div className="grid md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs">Total ITC Available</CardDescription>
                      <CardTitle className="text-xl">{formatCurrency(dashboard.itc_analysis.total_itc_available)}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="border-green-500/30 bg-green-500/5">
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs">ITC Ready to Claim</CardDescription>
                      <CardTitle className="text-xl text-green-500">{formatCurrency(dashboard.itc_analysis.itc_unclaimed)}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="border-orange-500/30 bg-orange-500/5">
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs">ITC at Risk</CardDescription>
                      <CardTitle className="text-xl text-orange-500">{formatCurrency(dashboard.itc_analysis.itc_at_risk)}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="border-primary/30 bg-primary/5">
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs">Potential Savings</CardDescription>
                      <CardTitle className="text-xl text-primary">{formatCurrency(dashboard.itc_analysis.potential_savings)}</CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                {/* Vendor Risks */}
                {dashboard.itc_analysis.vendor_risks.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>High-Risk Vendors</CardTitle>
                      <CardDescription>Vendors requiring immediate attention for ITC compliance</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {dashboard.itc_analysis.vendor_risks.map((vendor: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-lg border border-border bg-card/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge className={getRiskColor(vendor.risk_level)}>
                                {vendor.risk_level} Risk
                              </Badge>
                              <span className="font-semibold">{vendor.vendor_name}</span>
                            </div>
                            <span className="text-orange-500 font-bold">{formatCurrency(vendor.itc_at_risk)}</span>
                          </div>
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <AlertCircle className="h-4 w-4 mt-0.5" />
                            <span>{vendor.recommendation}</span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* ITC Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle>Action Items</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {dashboard.itc_analysis.recommendations.map((rec: string, idx: number) => (
                      <Alert key={idx}>
                        <Info className="h-4 w-4" />
                        <AlertDescription>{rec}</AlertDescription>
                      </Alert>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* RCM Detection Tab */}
              <TabsContent value="rcm" className="space-y-4">
                {/* RCM Summary */}
                <div className="grid md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs">Total RCM Applicable</CardDescription>
                      <CardTitle className="text-xl">{formatCurrency(dashboard.rcm_analysis.total_rcm_applicable)}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="border-green-500/30 bg-green-500/5">
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs">RCM Paid</CardDescription>
                      <CardTitle className="text-xl text-green-500">{formatCurrency(dashboard.rcm_analysis.rcm_paid)}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="border-red-500/30 bg-red-500/5">
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs">RCM Pending</CardDescription>
                      <CardTitle className="text-xl text-red-500">{formatCurrency(dashboard.rcm_analysis.rcm_pending)}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="border-orange-500/30 bg-orange-500/5">
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs">Penalties at Risk</CardDescription>
                      <CardTitle className="text-xl text-orange-500">{formatCurrency(dashboard.rcm_analysis.penalties_at_risk)}</CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                {/* RCM Detected Expenses */}
                <Card>
                  <CardHeader>
                    <CardTitle>RCM Transactions Detected</CardTitle>
                    <CardDescription>{dashboard.rcm_analysis.detected_expenses.length} transactions require RCM compliance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {dashboard.rcm_analysis.detected_expenses.slice(0, 10).map((expense: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-lg border border-border bg-card/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">{expense.category}</Badge>
                              <span className="text-sm">{expense.description || expense.vendor_name}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{formatCurrency(expense.rcm_liability)}</div>
                              {expense.paid ? (
                                <Badge className="text-green-500 bg-green-500/10">Paid</Badge>
                              ) : (
                                <Badge className="text-red-500 bg-red-500/10">Pending</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {(expense.confidence * 100).toFixed(0)}% confidence
                            </Badge>
                            <span>{expense.reason}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* RCM Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle>RCM Action Items</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {dashboard.rcm_analysis.recommendations.map((rec: string, idx: number) => (
                      <Alert key={idx} variant={rec.includes('URGENT') ? 'destructive' : 'default'}>
                        {rec.includes('URGENT') ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                        <AlertDescription>{rec}</AlertDescription>
                      </Alert>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tax Optimization Tab */}
              <TabsContent value="optimization" className="space-y-4">
                {/* Optimization Summary */}
                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs">Current Tax Liability</CardDescription>
                      <CardTitle className="text-xl">{formatCurrency(dashboard.optimization.current_tax_liability)}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="border-green-500/30 bg-green-500/5">
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs">Potential Savings</CardDescription>
                      <CardTitle className="text-xl text-green-500">{formatCurrency(dashboard.optimization.potential_savings)}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="border-blue-500/30 bg-blue-500/5">
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs">Savings Percentage</CardDescription>
                      <CardTitle className="text-xl text-blue-500">{dashboard.optimization.savings_percentage.toFixed(1)}%</CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                {/* Optimization Scenarios */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tax Saving Scenarios</CardTitle>
                    <CardDescription>Actionable strategies to reduce your tax liability</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {dashboard.optimization.scenarios.map((scenario: any, idx: number) => (
                      <div key={idx} className="p-6 rounded-lg border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="text-xl font-bold">{scenario.name}</h4>
                            <p className="text-sm text-muted-foreground">{scenario.description}</p>
                          </div>
                          <Badge className="text-green-500 bg-green-500/10 border-green-500/30 text-lg px-4 py-2">
                            {formatCurrency(scenario.savings)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground block mb-1">Impact</span>
                            <span className="font-semibold">{scenario.impact}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block mb-1">Timeline</span>
                            <span className="font-semibold">{scenario.timeline}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block mb-1">Effort</span>
                            <Badge variant="outline">{scenario.effort}</Badge>
                          </div>
                          <div>
                            <span className="text-muted-foreground block mb-1">Risk</span>
                            <Badge variant="outline">{scenario.risk}</Badge>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-border">
                          <p className="text-sm">
                            <span className="font-semibold">Implementation: </span>
                            {scenario.implementation}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Optimization Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle>Optimization Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {dashboard.optimization.recommendations.map((rec: string, idx: number) => (
                      <Alert key={idx}>
                        <TrendingUp className="h-4 w-4" />
                        <AlertDescription>{rec}</AlertDescription>
                      </Alert>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Risk Assessment Tab */}
              <TabsContent value="risk" className="space-y-4">
                {/* Critical Issues */}
                {dashboard.risk_assessment.critical_issues.length > 0 && (
                  <Card className="border-red-500/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-500">
                        <AlertTriangle className="h-5 w-5" />
                        Critical Issues
                      </CardTitle>
                      <CardDescription>Immediate action required to avoid penalties</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {dashboard.risk_assessment.critical_issues.map((issue: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <Badge className="bg-red-500/20 text-red-500 border-red-500/30">{issue.severity}</Badge>
                              <h4 className="font-bold text-lg">{issue.type}</h4>
                              <p className="text-sm text-muted-foreground">{issue.description}</p>
                            </div>
                          </div>
                          <Separator />
                          <div className="space-y-1 text-sm">
                            <div><span className="font-semibold">Impact:</span> {issue.impact}</div>
                            {issue.penalty_risk > 0 && (
                              <div className="text-red-500 font-semibold">
                                Penalty Risk: {formatCurrency(issue.penalty_risk)}
                              </div>
                            )}
                            <div className="pt-2">
                              <span className="font-semibold">Action Required:</span> {issue.action_required}
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Warnings */}
                {dashboard.risk_assessment.warnings.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                        Warnings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {dashboard.risk_assessment.warnings.map((warning: any, idx: number) => (
                        <Alert key={idx}>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>{warning.type}</AlertTitle>
                          <AlertDescription>
                            {warning.description}
                            <br />
                            <span className="font-semibold">Recommendation: </span>{warning.recommendation}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Action Items */}
                <Card>
                  <CardHeader>
                    <CardTitle>Action Items</CardTitle>
                    <CardDescription>Prioritized tasks to improve compliance</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dashboard.risk_assessment.action_items.map((item: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-lg border border-border bg-card/30 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Badge className={getRiskColor(item.priority.toLowerCase())}>
                              {item.priority}
                            </Badge>
                            <span className="font-semibold">{item.issue}</span>
                          </div>
                          <Badge variant="outline">{item.deadline}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.action}</p>
                        <p className="text-xs text-muted-foreground">Impact: {item.impact}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Upcoming Deadlines */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Upcoming GST Deadlines
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboard.risk_assessment.upcoming_deadlines.map((deadline: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-card/30 border border-border">
                          <div>
                            <div className="font-semibold">{deadline.return_type}</div>
                            <div className="text-sm text-muted-foreground">{deadline.period}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{new Date(deadline.deadline).toLocaleDateString('en-IN')}</div>
                            <Badge variant="outline" className={deadline.days_remaining < 10 ? 'text-red-500' : 'text-green-500'}>
                              {deadline.days_remaining} days left
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reconciliation Tab */}
              <TabsContent value="reconciliation" className="space-y-4">
                {/* Reconciliation Summary */}
                <div className="grid md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs">Matched Invoices</CardDescription>
                      <CardTitle className="text-xl text-green-500">{dashboard.reconciliation.matched_invoices}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="border-orange-500/30 bg-orange-500/5">
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs">Unmatched in Books</CardDescription>
                      <CardTitle className="text-xl text-orange-500">{dashboard.reconciliation.unmatched_in_books}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs">Match Rate</CardDescription>
                      <CardTitle className="text-xl">{dashboard.reconciliation.match_rate}%</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="border-red-500/30 bg-red-500/5">
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs">ITC at Risk</CardDescription>
                      <CardTitle className="text-xl text-red-500">{formatCurrency(dashboard.reconciliation.itc_impact)}</CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                {/* Discrepancies */}
                {dashboard.reconciliation.discrepancies.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>GSTR-2A/2B Discrepancies</CardTitle>
                      <CardDescription>Invoices not found in government portal</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {dashboard.reconciliation.discrepancies.map((disc: any, idx: number) => (
                          <div key={idx} className="p-4 rounded-lg border border-border bg-card/30 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{disc.invoice_no}</Badge>
                                  <span className="text-sm font-semibold">{disc.vendor_name}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{disc.vendor_gstin}</p>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">{formatCurrency(disc.amount)}</div>
                                <div className="text-sm text-red-500">{formatCurrency(disc.itc_at_risk)} ITC at risk</div>
                              </div>
                            </div>
                            <Separator />
                            <div className="text-sm space-y-1">
                              <div className="text-muted-foreground">{disc.description}</div>
                              <div>
                                <span className="font-semibold">Action: </span>
                                {disc.action}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Reconciliation Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle>Reconciliation Action Items</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {dashboard.reconciliation.recommendations.map((rec: string, idx: number) => (
                      <Alert key={idx} variant={rec.includes('CRITICAL') ? 'destructive' : 'default'}>
                        {rec.includes('CRITICAL') ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                        <AlertDescription>{rec}</AlertDescription>
                      </Alert>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}
