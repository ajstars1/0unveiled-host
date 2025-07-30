// "use client";

// import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import logo from "@/public/abstrack_logo_light.svg";

// import { cn } from "@/lib/utils";

export function Header() {
  // const [isScrolled, setIsScrolled] = useState(false);

  // useEffect(() => {
  //   const handleScroll = () => {
  //     setIsScrolled(window.scrollY > 10);
  //   };
  //   window.addEventListener("scroll", handleScroll);
  //   return () => window.removeEventListener("scroll", handleScroll);
  // }, []);

  return (
    <header
      className={
        " top-0 z-50 w-full transition-all duration-300 bg-background/80 backdrop-blur-sm"
      }
    >
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
                <div className="px-3 ">
                    <Link href="/dashboard" className="flex items-center gap-2 h-10 mb-2 px-2 justify-start">
                        <Image
                            src={logo}
                            alt="0Unveiled Logo"
                            width={24}
                            height={24}
                            className="shrink-0"
                            priority
                        />
                        <span className="font-semibold text-lg whitespace-nowrap">0Unveiled</span>
                    </Link>
          </div>

          {/* Navigation */}
          {/* <nav className="hidden md:flex items-center space-x-8">
            <a
              href="#pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </a>
            <a
              href="#docs"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Docs
            </a>
            <a
              href="#community"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Community
            </a>
          </nav> */}

          {/* Auth buttons */}
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="text-sm">
              Sign in
            </Button>
            <Button size="sm" className="text-sm" variant="default">
              Get started
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}