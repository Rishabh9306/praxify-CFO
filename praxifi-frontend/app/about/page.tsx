'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  TrendingUp, 
  MessageSquare, 
  BarChart3, 
  GitBranch,
  FileText,
  Github,
  Book,
  Mail,
  HelpCircle
} from 'lucide-react';

export default function AboutPage() {
  const features = [
    {
      icon: TrendingUp,
      title: 'Predictive Forecasting',
      description: 'Advanced ML models for accurate financial predictions',
    },
    {
      icon: Sparkles,
      title: 'Anomaly Detection',
      description: 'Automated identification of unusual patterns in your data',
    },
    {
      icon: MessageSquare,
      title: 'Conversational AI',
      description: 'Interactive chat with persistent session memory',
    },
    {
      icon: BarChart3,
      title: 'Scenario Simulation',
      description: 'Test what-if scenarios with real-time impact analysis',
    },
    {
      icon: FileText,
      title: 'Dual-Mode Narratives',
      description: 'Guardian or Storyteller personas for different audiences',
    },
    {
      icon: GitBranch,
      title: 'Explainability',
      description: 'Transparent insights into AI decision-making',
    },
  ];

  const techStack = [
    { category: 'Frontend', items: ['Next.js 14', 'TypeScript', 'React', 'Tailwind CSS', 'Recharts'] },
    { category: 'Backend', items: ['Python FastAPI', 'Google Gemini AI', 'Pandas', 'NumPy'] },
    { category: 'AI/ML', items: ['LangChain', 'Prophet', 'Scikit-learn', 'Isolation Forest'] },
    { category: 'State', items: ['React Context', 'localStorage', 'Session Management'] },
  ];

  const faqs = [
    {
      question: 'What file formats are supported?',
      answer: 'Currently, Praxifi CFO supports CSV files containing financial data with date, revenue, expenses, and other financial metrics.',
    },
    {
      question: 'How does the AI Agent work?',
      answer: 'The AI Agent uses Google Gemini with persistent memory to analyze your financial data, answer questions, and provide contextual insights while maintaining conversation history.',
    },
    {
      question: 'Is my data secure?',
      answer: 'Session data is stored locally in your browser. For production deployment, implement server-side session management and proper data encryption.',
    },
    {
      question: 'What\'s the difference between Finance Guardian and Financial Storyteller?',
      answer: 'Finance Guardian provides conservative, risk-focused analysis for internal stakeholders. Financial Storyteller creates narrative-driven insights optimized for presentations and external communication.',
    },
    {
      question: 'Can I export my analysis?',
      answer: 'Yes! Visit the Reports page to export session data as JSON or conversation history as text files.',
    },
  ];

  return (
    <div className="min-h-screen bg-background pt-20 pb-20">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Praxifi CFO
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            An AI-powered financial analysis platform that combines predictive forecasting, 
            conversational intelligence, and scenario simulation to transform how you understand your business finances.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/upload">Get Started</Link>
            </Button>
            <Button asChild>
              <a 
                href="https://github.com/Rishabh9306/praxifi-CFO/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="gap-2"
              >
                <Github className="h-4 w-4" />
                View on GitHub
              </a>
            </Button>
          </div>
        </div>

        {/* Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Core Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <feature.icon className="h-8 w-8 text-primary mb-3" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Technology Stack</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {techStack.map((stack, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle>{stack.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {stack.items.map((item, itemIdx) => (
                      <span
                        key={itemIdx}
                        className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-sm"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Architecture Overview */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">How It Works</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Upload & Configure</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload your CSV financial data and select your analysis preferences (persona mode, forecast metric).
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Choose Analysis Mode</h3>
                    <p className="text-sm text-muted-foreground">
                      Generate a static comprehensive report for presentations, or launch an interactive AI chat session for exploratory analysis.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Analyze & Explore</h3>
                    <p className="text-sm text-muted-foreground">
                      View KPIs, forecasts, anomalies, and AI-generated narratives. Ask questions in chat mode for deeper insights.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Simulate & Export</h3>
                    <p className="text-sm text-muted-foreground">
                      Test what-if scenarios, review session history, and export your analyses for future reference.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center flex items-center justify-center gap-3">
            <HelpCircle className="h-8 w-8" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Documentation & Support */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Documentation & Support</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Book className="h-8 w-8 text-primary mb-3" />
                <CardTitle>Documentation</CardTitle>
                <CardDescription>Comprehensive guides and API reference</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <a href="/README.md" target="_blank">
                    Read Docs
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Github className="h-8 w-8 text-primary mb-3" />
                <CardTitle>GitHub Repository</CardTitle>
                <CardDescription>Source code and issue tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <a 
                    href="https://github.com/Rishabh9306/praxifi-CFO/" 
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on GitHub
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Mail className="h-8 w-8 text-primary mb-3" />
                <CardTitle>Contact Support</CardTitle>
                <CardDescription>Get help from our team</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <a href="mailto:support@praxifi.com">
                    Email Us
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer CTA */}
        <div className="text-center p-8 bg-primary/10 border border-primary/20 rounded-lg">
          <h2 className="text-2xl font-bold mb-3">Ready to Transform Your Financial Analysis?</h2>
          <p className="text-muted-foreground mb-6">
            Start analyzing your financial data with AI-powered insights today
          </p>
          <Button asChild size="default">
            <Link href="/upload">
              Get Started Now
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
