"use client"

import { Hero } from "@/components/hero"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Upload, 
  BarChart3, 
  MessageSquare, 
  GitBranch, 
  FileText, 
  Settings,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Brain,
  LineChart,
  Shield,
  Zap,
  Target,
  Database,
  Lock,
  Clock,
  CheckCircle2
} from "lucide-react"

export default function Home() {
  const features = [
    {
      icon: Upload,
      title: "Smart Data Ingestion",
      description: "Upload any CSV format. Our NLP engine automatically maps columns to standardized financial schemas.",
      href: "/upload",
      color: "text-blue-500",
      gradient: "from-blue-500/20 to-blue-500/5"
    },
    {
      icon: LineChart,
      title: "Predictive Forecasting",
      description: "Prophet & AutoARIMA models compete to deliver the most accurate 3-month financial projections.",
      href: "/upload",
      color: "text-green-500",
      gradient: "from-green-500/20 to-green-500/5"
    },
    {
      icon: AlertTriangle,
      title: "Anomaly Detection",
      description: "Isolation Forest & IQR algorithms automatically flag unusual patterns and outliers in real-time.",
      href: "/upload",
      color: "text-orange-500",
      gradient: "from-orange-500/20 to-orange-500/5"
    },
    {
      icon: MessageSquare,
      title: "Conversational AI",
      description: "Chat with your data using Google Gemini 2.5 Pro. Persistent memory tracks entire conversation context.",
      href: "/upload",
      color: "text-purple-500",
      gradient: "from-purple-500/20 to-purple-500/5"
    },
    {
      icon: GitBranch,
      title: "Scenario Simulation",
      description: "Test what-if scenarios instantly. See real-time impact on KPIs with ±100% parameter adjustments.",
      href: "/simulate",
      color: "text-pink-500",
      gradient: "from-pink-500/20 to-pink-500/5"
    },
    {
      icon: Brain,
      title: "Explainable AI",
      description: "SHAP analysis reveals which features drive your profitability with transparent feature attributions.",
      href: "/upload",
      color: "text-cyan-500",
      gradient: "from-cyan-500/20 to-cyan-500/5"
    }
  ]

  const capabilities = [
    {
      icon: TrendingUp,
      title: "Multi-Model Forecasting",
      description: "AutoARIMA vs Prophet model competition ensures optimal prediction accuracy for your time series",
      stats: "99% accuracy"
    },
    {
      icon: Sparkles,
      title: "Dual-Persona Narratives",
      description: "Finance Guardian for risk analysis or Financial Storyteller for executive presentations",
      stats: "2 AI modes"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Non-root Docker containers, network policies, rate limiting, and secret management built-in",
      stats: "Production-ready"
    }
  ]

  const techStack = [
    { name: "Next.js 15", category: "Frontend" },
    { name: "FastAPI", category: "Backend" },
    { name: "Gemini 2.5 Pro", category: "AI" },
    { name: "Prophet", category: "ML" },
    { name: "SHAP", category: "Explainability" },
    { name: "Redis", category: "Memory" },
    { name: "Docker", category: "Deploy" },
    { name: "Kubernetes", category: "Scale" }
  ]

  const benefits = [
    "Autonomous data normalization with NLP",
    "Real-time anomaly detection and alerting",
    "Conversational analysis with 24hr memory",
    "Multi-model forecasting competition",
    "SHAP-powered feature attribution",
    "Instant what-if scenario testing"
  ]

  return (
    <div className="relative">
      <Hero />
      
      {/* Main Content with Pitch Black Background */}
      <div id="main-content" className="bg-black relative">
        {/* Features Grid Section */}
        <section className="py-20 md:py-32 relative z-10 scroll-smooth">
          <div className="container mx-auto px-6 md:px-12 lg:px-16">
            <div className="text-center mb-16 md:mb-24">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs md:text-sm font-medium font-mono">CORE CAPABILITIES</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-white">
                Enterprise-Grade Financial Intelligence
              </h2>
              <p className="text-muted-foreground text-base md:text-lg lg:text-xl max-w-3xl mx-auto">
                Six powerful engines working together to transform raw CSV data into strategic financial insights
              </p>
            </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {features.map((feature, idx) => (
              <Link key={idx} href={feature.href}>
                <Card className={`h-full transition-all duration-300 hover:border-primary/50 hover:shadow-2xl cursor-pointer group relative overflow-hidden`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <CardHeader className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-background border border-border`}>
                        <feature.icon className={`h-7 w-7 ${feature.color}`} />
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                    <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-20 md:py-32 relative z-10">
        <div className="container mx-auto px-6 md:px-12 lg:px-16">
          <div className="text-center mb-16 md:mb-24">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-xs md:text-sm font-medium font-mono">INTELLIGENT SYSTEMS</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-white">
              Built on Cutting-Edge AI/ML
            </h2>
            <p className="text-muted-foreground text-base md:text-lg lg:text-xl max-w-3xl mx-auto">
              Google Gemini, Prophet, AutoARIMA, and SHAP power your financial decision-making
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {capabilities.map((capability, idx) => (
              <Card key={idx} className="text-center border-2 hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6 mx-auto">
                    <capability.icon className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle className="text-2xl mb-3">{capability.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed mb-4">{capability.description}</CardDescription>
                  <div className="inline-flex px-4 py-2 rounded-full bg-background text-sm font-mono font-semibold">
                    {capability.stats}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20 md:py-32 relative z-10">
        <div className="container mx-auto px-6 md:px-12 lg:px-16">
          <div className="text-center mb-12 md:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-xs md:text-sm font-medium font-mono">TECHNOLOGY</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-white">
              Modern Tech Stack
            </h2>
            <p className="text-muted-foreground text-base md:text-lg lg:text-xl max-w-3xl mx-auto">
              Production-ready infrastructure with Docker, Kubernetes, and enterprise-grade security
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-16">
            {techStack.map((tech, idx) => (
              <Card key={idx} className="text-center p-6 hover:border-primary/50 transition-colors">
                <div className="text-sm text-muted-foreground font-mono mb-2">{tech.category}</div>
                <div className="text-lg font-bold">{tech.name}</div>
              </Card>
            ))}
          </div>

          <div className="max-w-3xl mx-auto">
            <h3 className="text-xl md:text-2xl font-bold mb-6 text-center text-white">Key Benefits</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
                  <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm md:text-base text-muted-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-32 relative z-10">
        <div className="container mx-auto px-6 md:px-12 lg:px-16">
          <div className="text-center mb-16 md:mb-24">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-xs md:text-sm font-medium font-mono">WORKFLOW</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-white">
              Four Steps to Financial Clarity
            </h2>
            <p className="text-muted-foreground text-base md:text-lg lg:text-xl max-w-3xl mx-auto">
              From raw CSV upload to actionable intelligence in minutes, not days
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-8 relative overflow-hidden group hover:border-primary/50 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full" />
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-3xl mb-6">
                    1
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Upload & Configure</h3>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    Drop your CSV file and select analysis mode (Finance Guardian or Financial Storyteller) and forecast metric
                  </p>
                </div>
              </Card>

              <Card className="p-8 relative overflow-hidden group hover:border-primary/50 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full" />
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-3xl mb-6">
                    2
                  </div>
                  <h3 className="text-2xl font-bold mb-3">AI Processing</h3>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    NLP engine normalizes your data, runs forecasting models, detects anomalies, and generates insights
                  </p>
                </div>
              </Card>

              <Card className="p-8 relative overflow-hidden group hover:border-primary/50 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full" />
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-3xl mb-6">
                    3
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Interactive Analysis</h3>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    Chat with your data using conversational AI or explore static dashboards with KPIs, charts, and narratives
                  </p>
                </div>
              </Card>

              <Card className="p-8 relative overflow-hidden group hover:border-primary/50 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full" />
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-3xl mb-6">
                    4
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Scenario Testing</h3>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    Run what-if simulations, review session history, and export insights for strategic decision-making
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-40 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/10" />
        <div className="container mx-auto px-6 md:px-12 lg:px-16 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 md:mb-8 leading-tight text-white">
              Ready to Transform Your{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Financial Analysis?
              </span>
            </h2>
            <p className="text-muted-foreground text-lg md:text-xl lg:text-2xl mb-10 md:mb-12 leading-relaxed">
              Join forward-thinking CFOs using AI to make data-driven decisions. 
              <br className="hidden md:block" />
              Start analyzing in under 60 seconds. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10 md:mb-12">
              <Button asChild size="sm" className="text-base md:text-lg gap-2 group">
                <Link href="/upload">
                  <TrendingUp className="h-5 w-5" />
                  Start Free Analysis
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="sm" variant="glass" className="text-base md:text-lg gap-2">
                <Link href="/simulate">
                  Try Scenario Simulation
                </Link>
              </Button>
            </div>
            
            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 pt-8 border-t border-border/30">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-xs md:text-sm font-mono">Enterprise Security</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-xs md:text-sm font-mono">24/7 Availability</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Database className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-xs md:text-sm font-mono">Your Data Stays Private</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-black/50 border-t border-border/30">
        <div className="container mx-auto px-8 md:px-12 lg:px-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <h3 className="font-bold text-lg mb-6 font-mono text-white">PRODUCT</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/upload" className="hover:text-foreground transition-colors">MVP Portal</Link></li>
                <li><Link href="/simulate" className="hover:text-foreground transition-colors">Scenario Simulation</Link></li>
                <li><Link href="/reports" className="hover:text-foreground transition-colors">Session Reports</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-6 font-mono text-white">RESOURCES</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
                <li><a href="https://github.com/Rishabh9306/praxifi-CFO" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-6 font-mono text-white">TECHNOLOGY</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><span className="text-foreground">Next.js 15</span> / Frontend</li>
                <li><span className="text-foreground">FastAPI</span> / Backend</li>
                <li><span className="text-foreground">Gemini 2.5</span> / AI</li>
                <li><span className="text-foreground">Prophet</span> / Forecasting</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-6 font-mono text-white">PRAXIFI CFO</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Enterprise-grade AI-powered financial analysis platform combining predictive forecasting, conversational intelligence, and scenario simulation.
              </p>
              <div className="flex gap-3">
                <Link href="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Settings className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground border-t border-border/50 pt-8">
            <p className="font-mono">© {new Date().getFullYear()} Praxifi CFO. All rights reserved. Built with ❤️ using AI/ML</p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  )
}

