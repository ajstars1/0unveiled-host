"use client"

import { useMemo } from "react"
import TetrisGame from "./tetris-game"
import { useDeviceDetection } from "@/hooks/use-device-detection"

interface LoadingPageProps {
  currentRepo?: string
  status?: string
  progress?: number // 0..100
  complete?: boolean
}

export default function LoadingPage({ currentRepo, status, progress, complete }: LoadingPageProps) {
  const { isMobile, isTablet } = useDeviceDetection()
  
  const clampedProgress = useMemo(() => {
    const p = typeof progress === "number" ? progress : undefined
    if (typeof p !== "number") return undefined
    return Math.max(0, Math.min(100, p))
  }, [progress])

  const PHASES = [
    { key: "Validating request", label: "Validating request" },
    { key: "Resolving user", label: "Authenticating user" },
    { key: "Starting analyzer", label: "Starting analyzer" },
    { key: "Fetching", label: "Fetching repository data" },
    { key: "Scanning", label: "Scanning files" },
    { key: "Running", label: "Running AI analysis" },
    { key: "Aggregating", label: "Aggregating results" },
    { key: "Processing response", label: "Preparing results" },
    { key: "Completed", label: "Completed" },
  ] as const

  const phaseFromStatus = (s?: string): number => {
    if (!s) return -1
    const idx = PHASES.findIndex((p) => s.toLowerCase().includes(p.key.toLowerCase()))
    return idx
  }

  const phaseFromProgress = (p?: number): number => {
    if (typeof p !== "number") return -1
    if (p < 5) return 0
    if (p < 15) return 1
    if (p < 25) return 2
    if (p < 40) return 3
    if (p < 60) return 4
    if (p < 75) return 5
    if (p < 90) return 6
    if (p < 100) return 7
    return 8
  }

  const currentPhaseIndex = (() => {
    const byStatus = phaseFromStatus(status)
    const byProgress = phaseFromProgress(clampedProgress)
    if (byStatus < 0 && byProgress < 0) return 0
    return Math.max(byStatus, byProgress)
  })()

  // Mobile-specific UI
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-bg-gradient-start to-bg-gradient-end">
        <div className="h-screen flex flex-col">
          {/* Mobile Header - Compact Loading Status */}
          <div className="bg-card/95 backdrop-blur-sm border-b border-border/50 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                  <div className="absolute inset-0 w-6 h-6 border-2 border-transparent border-t-accent rounded-full animate-spin" style={{ animationDuration: '0.8s' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-sm font-heading font-bold text-foreground tracking-tight truncate">Processing Analysis</h1>
                  <p className="text-xs text-muted-foreground truncate">
                    {status || "Working..."}
                  </p>
                </div>
              </div>
              {typeof clampedProgress === "number" && (
                <div className="text-right">
                  <div className="text-lg font-mono font-bold text-foreground">{Math.round(clampedProgress)}%</div>
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-700 ease-out rounded-full"
                      style={{ width: `${clampedProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {currentRepo && (
              <div className="mt-2 text-xs text-muted-foreground font-mono truncate">
                Analyzing: {currentRepo}
              </div>
            )}
          </div>

          {/* Mobile Game Area - Full Screen */}
          <div className="flex-1 relative bg-gradient-to-br from-primary via-primary/95 to-primary/90">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_49%,rgba(255,255,255,0.05)_50%,transparent_51%)] bg-[size:20px_20px]" />
            <div className="relative z-10 h-full flex items-center justify-center p-2">
              <TetrisGame variant="dark" className="w-full h-full" />
            </div>
          </div>

          {/* Mobile Bottom Status Bar */}
          <div className="bg-card/95 backdrop-blur-sm border-t border-border/50 px-4 py-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 overflow-x-auto flex-1">
                {PHASES.slice(0, 4).map((p, idx) => {
                  const isDone = currentPhaseIndex > idx
                  const isCurrent = currentPhaseIndex === idx
                  return (
                    <div key={p.key} className={`flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                      isCurrent ? "text-foreground font-semibold" : "text-muted-foreground/70"
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        isDone ? "bg-primary" : isCurrent ? "bg-accent animate-pulse" : "bg-muted-foreground/30"
                      }`} />
                      <span className="text-xs">{p.label.split(' ')[0]}</span>
                    </div>
                  )
                })}
              </div>
              {complete && (
                <div className="flex items-center gap-1.5 text-accent-foreground ml-2">
                  <div className="w-3 h-3 bg-accent rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold">Complete!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Tablet Layout - Slightly different from mobile
  if (isTablet) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-bg-gradient-start to-bg-gradient-end">
        <div className="h-screen flex flex-col">
          {/* Tablet Header */}
          <div className="bg-card/95 backdrop-blur-sm border-b border-border/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                  <div className="absolute inset-0 w-8 h-8 border-2 border-transparent border-t-accent rounded-full animate-spin" style={{ animationDuration: '0.8s' }} />
                </div>
                <div>
                  <h1 className="text-lg font-heading font-bold text-foreground tracking-tight">Processing Analysis</h1>
                  <p className="text-sm text-muted-foreground">{status || "Working..."}</p>
                </div>
              </div>
              {typeof clampedProgress === "number" && (
                <div className="text-right">
                  <div className="text-2xl font-mono font-bold text-foreground">{Math.round(clampedProgress)}%</div>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-700 ease-out rounded-full"
                      style={{ width: `${clampedProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {currentRepo && (
              <div className="mt-3 text-sm text-muted-foreground font-mono">
                Analyzing: {currentRepo}
              </div>
            )}
          </div>

          {/* Tablet Game Area */}
          <div className="flex-1 relative bg-gradient-to-br from-primary via-primary/95 to-primary/90">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_49%,rgba(255,255,255,0.05)_50%,transparent_51%)] bg-[size:20px_20px]" />
            <div className="relative z-10 h-full flex items-center justify-center p-4">
              <TetrisGame variant="dark" className="w-full h-full" />
            </div>
          </div>

          {/* Tablet Bottom Status */}
          <div className="bg-card/95 backdrop-blur-sm border-t border-border/50 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 overflow-x-auto flex-1">
                {PHASES.slice(0, 6).map((p, idx) => {
                  const isDone = currentPhaseIndex > idx
                  const isCurrent = currentPhaseIndex === idx
                  return (
                    <div key={p.key} className={`flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
                      isCurrent ? "text-foreground font-semibold" : "text-muted-foreground/70"
                    }`}>
                      <div className={`w-3 h-3 rounded-full ${
                        isDone ? "bg-primary" : isCurrent ? "bg-accent animate-pulse" : "bg-muted-foreground/30"
                      }`} />
                      <span className="text-sm">{p.label}</span>
                    </div>
                  )
                })}
              </div>
              {complete && (
                <div className="flex items-center gap-2 text-accent-foreground ml-4">
                  <div className="w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold">Analysis Complete!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Desktop Layout - Original side-by-side design
  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-gradient-start to-bg-gradient-end">
      <div className="h-screen max-w-7xl mx-auto p-6 md:p-8">
        <div className="h-full rounded-3xl border border-border shadow-xl bg-card overflow-hidden backdrop-blur-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 h-full divide-y lg:divide-y-0 lg:divide-x divide-border">
            {/* Left: Analysis Progress (50%) */}
            <section className="h-full p-8 lg:p-12 flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                <div className="relative">
                  <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                  <div className="absolute inset-0 w-8 h-8 border-2 border-transparent border-t-accent rounded-full animate-spin" style={{ animationDuration: '0.8s' }} />
                </div>
                <h1 className="text-xl lg:text-2xl font-heading font-bold text-foreground tracking-tight">Processing Analysis</h1>
              </div>
              {currentRepo ? (
                <div className="text-sm text-muted-foreground font-sans font-medium mb-6 px-4 py-3 bg-muted/50 rounded-lg border border-border/50">
                  <span className="text-muted-foreground/80">Currently analyzing:</span> <span className="font-semibold text-foreground font-mono">{currentRepo}</span>
                </div>
              ) : null}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-base font-heading font-semibold text-foreground tracking-tight">Analysis Progress</span>
                  {typeof clampedProgress === "number" ? (
                    <span className="text-base font-mono font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border/30">{Math.round(clampedProgress)}%</span>
                  ) : null}
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden shadow-inner border border-border/30">
                  {typeof clampedProgress === "number" ? (
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-700 ease-out rounded-full relative"
                      style={{ width: `${clampedProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                    </div>
                  ) : (
                    <div className="relative h-full w-full overflow-hidden">
                      <div className="absolute inset-0 -translate-x-1/2 w-1/2 bg-gradient-to-r from-primary to-accent animate-pulse rounded-full opacity-60" />
                    </div>
                  )}
                </div>
                <div className="mt-3 text-sm text-muted-foreground font-sans font-medium">
                  {status
                    ? status
                    : typeof clampedProgress === "number"
                    ? clampedProgress < 30
                      ? "Initializing..."
                      : clampedProgress < 60
                      ? "Processing data..."
                      : clampedProgress < 90
                      ? "Finalizing results..."
                      : "Almost complete..."
                    : "Working..."}
                </div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-heading font-semibold text-foreground mb-4 tracking-tight">Analysis Pipeline</div>
                <ol className="space-y-3 max-h-[50vh] lg:max-h-none flex-1 overflow-auto pr-2">
                  {PHASES.slice(0, 8).map((p, idx) => {
                    const isDone = currentPhaseIndex > idx
                    const isCurrent = currentPhaseIndex === idx
                    return (
                      <li key={p.key} className="flex items-center gap-3 text-sm group">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                            isDone 
                              ? "bg-primary border-primary shadow-md" 
                              : isCurrent 
                                ? "bg-accent border-accent shadow-lg shadow-accent/20 animate-pulse" 
                                : "border-border bg-muted/30"
                          }`}
                        >
                          {isDone ? (
                            <svg viewBox="0 0 20 20" className="w-4 h-4 text-primary-foreground">
                              <path
                                fill="currentColor"
                                d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 10-1.414 1.414l4 4a 1 1 0 001.414 0l8-8a 1 1 0 000-1.414z"
                              />
                            </svg>
                          ) : isCurrent ? (
                            <div className="w-2.5 h-2.5 bg-accent-foreground rounded-full animate-pulse" />
                          ) : (
                            <div className="w-2 h-2 bg-muted-foreground/30 rounded-full" />
                          )}
                        </span>
                        <span className={`font-sans font-medium transition-colors duration-300 ${
                          isDone 
                            ? "text-muted-foreground line-through" 
                            : isCurrent 
                              ? "text-foreground font-semibold" 
                              : "text-muted-foreground/70"
                        }`}>
                          {p.label}
                        </span>
                      </li>
                    )
                  })}
                </ol>
              </div>
              {complete && (
                <div className="pt-6 px-4 py-4 bg-accent/10 rounded-xl border border-accent/20">
                  <div className="inline-flex items-center gap-3 text-accent-foreground mb-2">
                    <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="font-heading font-bold text-lg tracking-tight">Analysis Complete!</span>
                  </div>
                  <p className="text-muted-foreground font-sans font-medium ml-9">Preparing your comprehensive results...</p>
                </div>
              )}
            </section>

            {/* Right: Game (50%) */}
            <section className="h-full p-6 lg:p-8 flex items-center justify-center bg-gradient-to-br from-primary via-primary/95 to-primary/90 relative">
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_49%,rgba(255,255,255,0.05)_50%,transparent_51%)] bg-[size:20px_20px]" />
              <div className="relative z-10 max-w-full rounded-2xl w-full h-full flex items-center justify-center p-4">
                <TetrisGame variant="dark" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
