"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="relative py-24 bg-foreground text-background overflow-hidden">
      {/* Ambient gradient overlay */}
      <div className="absolute inset-0 bg-grad-radial opacity-20" />
      
      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-8">
            Ready to build trust with verified proof?
          </h2>
          
          <Button 
            size="lg" 
            variant="secondary"
            className="hover-lift group bg-background text-foreground hover:bg-background/90"
          >
            Start verifying now
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}