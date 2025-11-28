"use client"
import Link from "next/link"
import Image from "next/image"
import { Button } from "./ui/button"
import { GL } from "./gl"
import { Sparkles, TrendingUp, ArrowRight, Brain, Zap, Shield, ChevronDown } from "lucide-react"

export function Hero() {
  const scrollToContent = () => {
    const element = document.getElementById('main-content');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" className="h-svh relative overflow-hidden">
      {/* Animated Background - Only in Hero */}
      <GL hovering={false} />
      
      {/* Branding - Top Left */}
      <div className="absolute top-8 left-8 z-20">
        <Link href="/">
          <Image 
            src="/praxifi-text.svg" 
            alt="Praxifi" 
            width={151} 
            height={40}
            className="h-[35px] md:h-[40px] w-auto"
            priority
          />
        </Link>
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex items-center z-10">
        <div className="container mx-auto px-8 md:px-12 lg:px-16">
          <div className="max-w-3xl">
            {/* Main Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight text-white">
              Agentic CFO Copilot
            </h1>
            
            {/* Subheading */}
            <p className="text-base md:text-lg lg:text-xl text-white/90 mb-6 leading-relaxed max-w-2xl">
              Transform your financial data into actionable insights with{" "}
              <span className="text-white font-semibold">predictive forecasting</span>,{" "}
              <span className="text-white font-semibold">conversational AI</span>, and{" "}
              <span className="text-white font-semibold">intelligent scenario planning</span>.
            </p>
            
            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                <Brain className="h-4 w-4 text-blue-400" />
                <span className="text-xs md:text-sm font-mono text-white">ML-Powered</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="text-xs md:text-sm font-mono text-white">Real-Time</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                <Shield className="h-4 w-4 text-green-400" />
                <span className="text-xs md:text-sm font-mono text-white">Enterprise-Grade</span>
              </div>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button asChild size="sm" className="gap-2 group">
                <Link href="/upload">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
                  Start Analysis
                  <ArrowRight className="h-3 w-3 md:h-4 md:w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="sm" variant="glass" className="gap-2">
                <Link href="/simulate">
                  Try Simulation
                </Link>
              </Button>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 md:gap-6 max-w-xl pt-4 border-t border-white/20">
              <div>
                <div className="text-2xl md:text-3xl font-bold mb-1 text-white">
                  99%
                </div>
                <div className="text-[10px] md:text-xs text-white/70 uppercase tracking-wider font-mono">
                  Forecast Accuracy
                </div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold mb-1 text-white">
                  24/7
                </div>
                <div className="text-[10px] md:text-xs text-white/70 uppercase tracking-wider font-mono">
                  AI Assistant
                </div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold mb-1 text-white">
                  ∞
                </div>
                <div className="text-[10px] md:text-xs text-white/70 uppercase tracking-wider font-mono">
                  Scenarios
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <button 
        onClick={scrollToContent}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-white/70 hover:text-white transition-colors cursor-pointer group animate-bounce"
        aria-label="Scroll to content"
      >
        <span className="text-xs font-mono uppercase tracking-wider">Explore More</span>
        <ChevronDown className="h-6 w-6 group-hover:translate-y-1 transition-transform" />
      </button>
    </section>
  )
}
