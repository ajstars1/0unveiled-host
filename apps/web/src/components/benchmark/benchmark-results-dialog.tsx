"use client"

import { useState, useEffect } from "react"
import { CheckCircle, Lightbulb, TrendingUp, Sparkles } from "lucide-react"
import type { AIBatchEvaluationResponse } from "@/actions/AI"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Spotlight } from "@/components/ui/Spotlight"
import { ChartContainer } from "@/components/ui/chart"
import { PieChart, Pie, Cell } from "recharts"
import { cn } from "@/lib/utils"

// Helper component to render lists of feedback
const FeedbackList = ({ title, items, icon: Icon, colorClass }: { title: string, items: string[], icon: React.ElementType, colorClass: string }) => (
  <div>
    <h4 className={`text-md font-semibold mb-4 flex items-center ${colorClass}`}>
      <Icon className="h-5 w-5 mr-2.5" />
      {title}
    </h4>
    <ul className="space-y-2.5 list-disc list-inside text-slate-400 pl-2 text-sm">
      {(items ?? []).map((item, index) => (
        <li key={index} className="leading-relaxed">{item}</li>
      ))}
    </ul>
  </div>
)

// Modern color palette for the donut chart
const PIE_COLORS = ['#6366F1', '#38BDF8', '#A78BFA']; // Indigo, Sky, Purple

// Helper to aggregate feedback counts for pie chart
function getPieData(insights: AIBatchEvaluationResponse | null) {
  if (!insights || !insights.projectEvaluations) return [];
  let positive = 0, improvement = 0, suggestions = 0;
  for (const project of insights.projectEvaluations) {
    positive += project.positiveFeedback?.length || 0;
    improvement += project.areasForImprovement?.length || 0;
    suggestions += project.actionableSuggestions?.length || 0;
  }
  return [
    { name: 'Positive', value: positive },
    { name: 'Improvement', value: improvement },
    { name: 'Suggestions', value: suggestions },
  ].filter(d => d.value > 0);
}

export default function BenchmarkResultsDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<AIBatchEvaluationResponse | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setIsLoading(true);
        setInsights(null);
        setError(null);
      }, 300);
      return
    };

    setIsLoading(true);
    try {
      const storedInsights = sessionStorage.getItem('benchmarkInsights');
      if (storedInsights) {
        setInsights(JSON.parse(storedInsights));
      } else {
        setError("Analysis results were not found. Please try analyzing your portfolio again.");
      }
    } catch (e) {
      console.error("Failed to parse insights from sessionStorage:", e);
      setError("There was an error loading your results.");
    } finally {
      setIsLoading(false);
    }
  }, [open]);

  const pieData = getPieData(insights);
  const totalFeedback = pieData.reduce((acc, entry) => acc + entry.value, 0);
  
  const activeSegment = activeIndex !== null ? pieData[activeIndex] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full bg-black/96 text-slate-300 p-0 border border-slate-800 shadow-2xl rounded-2xl overflow-hidden">
        {/* <DialogTitle className="text-3xl md:text-4xl font-bold text-center bg-clip-text text-transparent bg-linear-to-b from-neutral-50 to-neutral-400 bg-opacity-50 py-8">
          AI Benchmark Insights
        </DialogTitle> */}
        <DialogTitle className="sr-only" asChild>
          <h1 className="sr-only">AI Benchmark Insights</h1>
        </DialogTitle>
        <div className="py-10 px-6 md:px-10 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent bg-grid-white/[0.02] relative">
          <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />
          <Spotlight className="top-10 left-full md:left-60 md:-top-20" fill="#A78BFA" />
          
          {isLoading && (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="text-slate-400 text-lg z-10">Loading results...</div>
            </div>
          )}

          {error && (
            <div className="min-h-[400px] flex flex-col justify-center items-center text-center z-10">
                <h2 className="text-2xl font-bold text-red-400">Oops! Something went wrong.</h2>
                <p className="mt-2 text-red-400/80">{error}</p>
            </div>
          )}

          {insights && !isLoading && !error && (
            <div className="space-y-12 relative z-10 animate-fade-in-up">
              <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-center bg-clip-text text-transparent bg-linear-to-b from-neutral-50 to-neutral-400 bg-opacity-50">
                  AI Benchmark Insights
                </h1>
                <p className="mt-3 font-normal text-sm text-neutral-300 max-w-lg text-center mx-auto">
                  A detailed analysis of your portfolio&apos;s strengths and weaknesses.
                </p>
              </div>

              <div className="p-px bg-linear-to-br from-indigo-500/30 via-slate-800/80 to-purple-500/30 rounded-2xl">
                <div className="rounded-[inherit] bg-slate-950/80 p-6 backdrop-blur-md">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                      <h2 className="flex items-center text-xl font-semibold text-white gap-3">
                        <Sparkles className="h-5 w-5 text-indigo-400" />
                        Overall Analysis
                      </h2>
                      <div className="text-slate-300 text-sm leading-relaxed border-l-2 border-indigo-500/50 pl-4 py-2">
                        {insights.overallPortfolioAnalysis ? <p>{insights.overallPortfolioAnalysis}</p> : <p className="italic text-slate-500">No overall portfolio analysis provided.</p>}
                      </div>
                    </div>

                    <div className="relative">
                      <ChartContainer id="benchmark-results-chart" config={{}} className="mx-auto aspect-square max-h-[280px]">
                        <PieChart>
                          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={3} onMouseEnter={(_, index) => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(null)}>
                            {pieData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} className={cn("stroke-transparent transition-opacity duration-300", activeIndex !== null && activeIndex !== index && "opacity-30")} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ChartContainer>
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-300">
                          {activeSegment ? (
                            <>
                              <span className="text-3xl font-bold text-white">{activeSegment.value}</span>
                              <span className="text-xs font-medium" style={{color: PIE_COLORS[activeIndex !== null ? activeIndex % PIE_COLORS.length : 0]}}>{activeSegment.name}</span>
                            </>
                          ) : (
                            <>
                              <span className="text-3xl font-bold text-white">{totalFeedback}</span>
                              <span className="text-xs text-slate-500">Total Feedback</span>
                            </>
                          )}
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-white text-center tracking-tight">Project-by-Project Breakdown</h2>
                <div className="space-y-8">
                  {insights.projectEvaluations.map((project, index) => (
                    <div key={index} className="border-b border-slate-800 pb-8 last:border-b-0 last:pb-0 group" style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}>
                      <h3 className="text-lg font-semibold text-white mb-5 truncate transition-transform duration-300 group-hover:translate-x-1">
                        {project.projectTitle}
                      </h3>
                      <div className="grid md:grid-cols-3 gap-x-8 gap-y-6">
                        <FeedbackList title="Positive Feedback" items={project.positiveFeedback} icon={CheckCircle} colorClass="text-success" />
                        <FeedbackList title="Areas for Improvement" items={project.areasForImprovement} icon={Lightbulb} colorClass="text-warning" />
                        <FeedbackList title="Actionable Suggestions" items={project.actionableSuggestions} icon={TrendingUp} colorClass="text-blue-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
