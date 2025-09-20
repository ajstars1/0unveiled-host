// Import global styles and fonts
import "./globals.css";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { NotFoundContent } from "@/components/404/not-found-content";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "404 - Page Not Found",
  description: "The page you are looking for does not exist.",
};

export default function GlobalNotFound() {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <div className="min-h-screen bg-linear-to-b from-background to-secondary flex items-center justify-center p-4">
              <div className="max-w-2xl w-full text-center space-y-8">
                <NotFoundContent />
              </div>
            </div>
      </body>
    </html>
  );
}
