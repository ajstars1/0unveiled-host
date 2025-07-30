"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

// Example data structure for the visualization
const impactData = [
  { month: "Jan", value: 12 },
  { month: "Feb", value: 28 },
  { month: "Mar", value: 45 },
  { month: "Apr", value: 72 },
  { month: "May", value: 96 },
  { month: "Jun", value: 128 },
];

export function ImpactSection() {
  const maxValue = Math.max(...impactData.map((d) => d.value));

  return (
    <section className="py-24">
      <div className="container mx-auto px-4 lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Impact over time
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See how verified portfolios increase hiring success rates month over month.
          </p>
        </motion.div>

        <Card className="p-8 bg-card/50 backdrop-blur-sm border-muted">
          <div className="h-64 flex items-end justify-between space-x-4">
            {impactData.map((data, index) => (
              <motion.div
                key={data.month}
                initial={{ height: 0, opacity: 0 }}
                whileInView={{ 
                  height: `${(data.value / maxValue) * 100}%`,
                  opacity: 1 
                }}
                transition={{ 
                  duration: 0.8, 
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
                viewport={{ once: true }}
                className="flex-1 max-w-12 flex flex-col items-center"
              >
                <div className="w-full bg-foreground/20 rounded-t-sm mb-2" />
                <span className="text-xs text-muted-foreground">
                  {data.month}
                </span>
              </motion.div>
            ))}
          </div>
          
          {/* Metrics */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Verified Projects", value: "2.4k+" },
              { label: "Success Rate", value: "94%" },
              { label: "Avg. Response Time", value: "2.3x" },
              { label: "Portfolio Views", value: "127k+" },
            ].map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-2xl font-bold mb-1">{metric.value}</div>
                <div className="text-sm text-muted-foreground">{metric.label}</div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}