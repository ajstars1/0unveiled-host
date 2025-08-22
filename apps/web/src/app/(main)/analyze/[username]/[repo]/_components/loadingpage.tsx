"use client"

import { useMemo } from "react"
import TetrisGame from "./tetris-game"

interface LoadingPageProps {
  currentRepo?: string
  status?: string
  progress?: number // 0..100
  complete?: boolean
}

export default function LoadingPage({ currentRepo, status, progress, complete }: LoadingPageProps) {
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

  return (
    <div className="h-screen bg-white">
      <div className="h-full max-w-7xl mx-auto p-4 md:p-6">
        <div className="h-full rounded-2xl border border-gray-200 shadow-sm bg-white overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 h-full divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
            {/* Left: Analysis Progress (50%) */}
            <section className="h-full p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 border border-black/20 border-t-black rounded-full animate-spin" />
                <h1 className="text-lg font-semibold text-black">Processing Analysis</h1>
              </div>
              {currentRepo ? (
                <div className="text-xs text-black/70 font-medium mb-2">Currently analyzing: {currentRepo}</div>
              ) : null}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-black">Analysis Progress</span>
                  {typeof clampedProgress === "number" ? (
                    <span className="text-sm font-mono text-black/80">{Math.round(clampedProgress)}%</span>
                  ) : null}
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  {typeof clampedProgress === "number" ? (
                    <div
                      className="h-full bg-black transition-all duration-500 ease-out rounded-full"
                      style={{ width: `${clampedProgress}%` }}
                    />
                  ) : (
                    <div className="relative h-full w-full overflow-hidden">
                      <div className="absolute inset-0 -translate-x-1/2 w-1/2 bg-black/60 animate-pulse rounded-full" />
                    </div>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-500">
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
              <div className="mt-5">
                <div className="text-xs font-medium text-black mb-2">Analysis steps</div>
                <ol className="space-y-1 max-h-[50vh] lg:max-h-none flex-1 overflow-auto pr-1">
                  {PHASES.slice(0, 8).map((p, idx) => {
                    const isDone = currentPhaseIndex > idx
                    const isCurrent = currentPhaseIndex === idx
                    return (
                      <li key={p.key} className="flex items-center gap-2 text-xs">
                        <span
                          className={`inline-flex items-center justify-center w-4 h-4 rounded-full border ${
                            isDone ? "bg-black border-black" : isCurrent ? "bg-black/70 border-black/70" : "border-gray-300"
                          }`}
                        >
                          {isDone ? (
                            <svg viewBox="0 0 20 20" className="w-3 h-3 text-white">
                              <path
                                fill="currentColor"
                                d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 10-1.414 1.414l4 4a 1 1 0 001.414 0l8-8a 1 1 0 000-1.414z"
                              />
                            </svg>
                          ) : isCurrent ? (
                            <svg viewBox="0 0 20 20" className="w-3 h-3 text-white">
                              <circle cx="10" cy="10" r="3" fill="currentColor" />
                            </svg>
                          ) : null}
                        </span>
                        <span className={`${isDone ? "text-black/60" : isCurrent ? "text-black" : "text-gray-400"}`}>
                          {p.label}
                        </span>
                      </li>
                    )
                  })}
                </ol>
              </div>
              {complete && (
                <div className="pt-4">
                  <div className="inline-flex items-center gap-2 text-green-600 mb-1">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-medium">Analysis Complete</span>
                  </div>
                  <p className="text-sm text-gray-500">Preparing your results...</p>
                </div>
              )}
            </section>

            {/* Right: Game (50%) */}
            <section className="h-full p-4 lg:p-6 flex items-center justify-center bg-black/95">
              <div className="max-w-full rounded-xl w-full h-full flex items-center justify-center">
                <TetrisGame variant="dark" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
