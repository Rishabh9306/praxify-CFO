"use client"

import type React from "react"
import { Geist_Mono } from "next/font/google"
import "./globals.css"
import { AppProvider } from "@/lib/app-context"
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/header"
import { SidebarNav } from "@/components/sidebar-nav"
import { usePathname } from "next/navigation"

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistMono.variable} antialiased`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            <AppProvider>
              <LayoutContent>{children}</LayoutContent>
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isHomePage = pathname === "/"
  const isLoginPage = pathname === "/login"
  
  return (
    <>
      {!isHomePage && !isLoginPage && <Header />}
      {isHomePage && <SidebarNav />}
      {children}
    </>
  )
}
