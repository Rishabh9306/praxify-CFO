import Link from "next/link";
import { MobileMenu } from "./mobile-menu";

export const Header = () => {
  return (
    <div className="fixed z-50 pt-8 md:pt-14 top-0 left-0 w-full">
      <header className="flex items-center justify-between container">
        <Link href="/">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Praxify
          </h2>
        </Link>
        <nav className="flex max-lg:hidden absolute left-1/2 -translate-x-1/2 items-center justify-center gap-x-10">
          {[
            { name: "MVP", href: "/upload" },
            { name: "Simulate", href: "/simulate" },
            { name: "Reports", href: "/reports" },
            { name: "Docs", href: "/docs" },
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
        <div className="flex items-center gap-4 max-lg:hidden">
          <Link className="uppercase transition-colors ease-out duration-150 font-mono text-white/60 hover:text-white" href="/performance">
            Performance
          </Link>
          <Link className="uppercase transition-colors ease-out duration-150 font-mono text-white/60 hover:text-white" href="/settings">
            Settings
          </Link>
        </div>
        <MobileMenu />
      </header>
    </div>
  );
};
