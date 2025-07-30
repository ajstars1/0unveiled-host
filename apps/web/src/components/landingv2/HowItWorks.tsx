"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Upload, Cpu, Share2 } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Import work",
    description: "Upload projects and code samples",
  },
  {
    icon: Cpu,
    title: "AI verifies",
    description: "Smart analysis validates authenticity",
  },
  {
    icon: Share2,
    title: "Share link",
    description: "Get recruiter-ready portfolio instantly",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-foreground">
      <div className="container mx-auto px-4 lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl text-background font-bold tracking-tight mb-4">
            How it works
          </h2>
          <p className="text-muted max-w-2xl mx-auto">
            Three simple steps to transform your projects into verified proof.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-px bg-border -translate-y-1/2" />
          
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <Card className="p-8 text-center hover-lift relative z-10 bg-card">
                  {/* Step number */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-muted text-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  
                  {/* Icon */}
                  <div className="mb-6 flex justify-center">
                    <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center">
                      <step.icon className="w-8 h-8 text-foreground" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {step.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}