'use client';

import Link from "next/link";
import Image from "next/image";
import { MobileMenu } from "./mobile-menu";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "./ui/button";
import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <div className={`fixed z-50 py-1 md:py-2 top-4 left-0 w-full transition-all duration-300 ${
      isScrolled ? 'backdrop-blur-lg bg-background/80 shadow-md border-b border-border/40' : ''
    }`}>
      <header className="flex items-center container relative">
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
        <nav className="flex max-lg:hidden items-center justify-center gap-x-8 absolute left-1/2 -translate-x-1/2">
          {[
            { name: "MVP", href: "/upload" },
            { name: "TaxIQ", href: "/taxiq" },
            { name: "Simulate", href: "/simulate" },
            { name: "Reports", href: "/reports" },
          ].map((item) => (
            <Link
              className="uppercase inline-block font-mono text-white/60 hover:text-white duration-150 transition-colors ease-out"
              href={item.href}
              key={item.name}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-6 max-lg:hidden absolute right-0">
          {user && (
            <>
              {/* User Name and Sign Out stacked vertically */}
              <div className="flex flex-col items-center gap-1">
                {/* User Name - Smaller size on top, centered */}
                <div className="flex items-center gap-2 text-xs">
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span className="font-mono text-primary/80">{user.displayName || user.email}</span>
                </div>
                
                {/* Sign Out Button - Below the name */}
                <button
                  onClick={handleSignOut}
                  className="relative uppercase transition-all ease-out duration-150 font-mono text-white/60 hover:text-white flex items-center gap-1.5 text-xs px-3 py-1.5 bg-transparent group overflow-visible"
                >
                  {/* Background with diagonal corners */}
                  <div 
                    className="absolute inset-0 border border-white/30 group-hover:border-white/50 transition-colors"
                    style={{
                      clipPath: 'polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)'
                    }}
                  />
                  {/* Diagonal corner lines */}
                  <svg className="absolute top-0 left-0 w-2 h-2 pointer-events-none" style={{ transform: 'translate(-1px, -1px)' }}>
                    <line x1="0" y1="8" x2="8" y2="0" stroke="currentColor" strokeWidth="1" className="text-white/30 group-hover:text-white/50 transition-colors" />
                  </svg>
                  <svg className="absolute bottom-0 right-0 w-2 h-2 pointer-events-none" style={{ transform: 'translate(1px, 1px)' }}>
                    <line x1="8" y1="0" x2="0" y2="8" stroke="currentColor" strokeWidth="1" className="text-white/30 group-hover:text-white/50 transition-colors" />
                  </svg>
                  <LogOut className="h-3.5 w-3.5 relative z-10" />
                  <span className="relative z-10">Sign Out</span>
                </button>
              </div>
              
              {/* Settings Link - Keep normal size at same vertical center */}
              <Link 
                className="uppercase transition-colors ease-out duration-150 font-mono text-white/60 hover:text-white"
                href="/settings"
              >
                Settings
              </Link>
            </>
          )}
        </div>
        <MobileMenu />
      </header>
    </div>
  );
};
