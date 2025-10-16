"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Upload, 
  GitBranch, 
  FileText, 
  BookOpen,
  TrendingUp,
  Settings,
  Home
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function SidebarNav() {
  const pathname = usePathname()
  
  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "MVP", href: "/upload", icon: Upload },
    { name: "Simulate", href: "/simulate", icon: GitBranch },
    { name: "Reports", href: "/reports", icon: FileText },
    { name: "Docs", href: "/docs", icon: BookOpen },
    { name: "Performance", href: "/performance", icon: TrendingUp },
    { name: "Settings", href: "/settings", icon: Settings },
  ]

  return (
    <TooltipProvider delayDuration={0}>
      <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3 shadow-2xl">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300",
                    isActive
                      ? "bg-white/20 text-white shadow-lg scale-110 border border-white/30"
                      : "bg-white/5 text-white/70 hover:bg-white/15 hover:text-white hover:scale-105 border border-white/10"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="left" className="font-mono bg-white/10 backdrop-blur-xl border-white/20 text-white">
                <p>{item.name}</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
