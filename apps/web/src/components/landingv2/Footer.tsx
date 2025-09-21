"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

const links = {
  Product: ["Features", "Pricing", "Documentation", "API"],
  Company: ["About", "Blog", "Careers", "Contact"],
  Resources: ["Help Center", "Community", "Status", "Privacy"],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/20">
      <div className="container mx-auto px-4 lg:px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <span className="text-lg font-semibold tracking-tight">
                0unveiled
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              AI-powered skill verification for the modern developer.
            </p>
            
            {/* Theme toggle placeholder */}
            <Button variant="outline" size="sm" className="text-xs">
              Toggle theme
            </Button>
          </div>

          {/* Links */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h3 className="font-medium mb-3 text-sm">{category}</h3>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item}>
                    <Link
                      href={`#${item.toLowerCase().replace(' ', '-')}`}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-xs text-muted-foreground">
            © 2024 0unveiled. All rights reserved.
          </p>
          
          <div className="flex space-x-6">
            <Link
              href="#terms"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <Link
              href="#privacy"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="#cookies"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}