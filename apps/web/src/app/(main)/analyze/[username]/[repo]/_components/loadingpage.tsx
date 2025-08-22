"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface AIAnalysisGameProps {
  currentRepo?: string
  status?: string
  progress?: number // 0..100
  complete?: boolean
}

interface Obstacle {
  x: number
  gapY: number
  passed: boolean
  type?: "normal" | "golden" | "rainbow"
}

interface GameState {
  playerY: number
  velocity: number
  obstacles: Obstacle[]
  gameActive: boolean
  progress: number
  analysisComplete: boolean
  gameStarted: boolean
  score: number
  highScore: number
  streak: number
  showEasterEgg: boolean
  easterEggType: string
  consecutiveQuickLosses: number
  // New mechanics
  multiplier: number
  shieldCharges: number
  slowMoUntil: number // epoch ms; if > Date.now() slow motion is active
  assistModeUntil: number // after repeated quick losses, make it easier for a bit
}

const GAME_CONFIG = {
  gravity: 0.5, // increased gravity for more challenge
  jumpForce: -9, // increased jump force
  obstacleWidth: 44, // slightly narrower for faster feel
  obstacleGap: 160, // reduced gap for more difficulty
  obstacleSpacing: 240, // closer obstacles for more action
  gameSpeed: 4.2, // faster base speed
  playerSize: 24,
}

const EASTER_EGGS = [
  "🚀 Speed Boost!",
  "⭐ Golden Path!",
  "🌈 Rainbow Mode!",
  "💎 Gem Collector!",
  "🎯 Perfect Aim!",
  "🔥 On Fire!",
  "⚡ Lightning Fast!",
  "🎪 Circus Time!",
]

export default function AIAnalysisGame({ currentRepo, status, progress, complete }: AIAnalysisGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const runStartRef = useRef<number | null>(null)
  const lastFrameRef = useRef<number | null>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const rainbowGradientRef = useRef<CanvasGradient | null>(null)
  const stateRef = useRef<GameState | null>(null)
  const [gameState, setGameState] = useState<GameState>({
    playerY: 250,
    velocity: 0,
    obstacles: [],
    gameActive: false,
    progress: 0,
    analysisComplete: false,
    gameStarted: false,
    score: 0,
    highScore: Number.parseInt(localStorage?.getItem("aiGameHighScore") || "0"),
    streak: 0,
    showEasterEgg: false,
    easterEggType: "",
    consecutiveQuickLosses: 0,
    multiplier: 1,
    shieldCharges: 0,
    slowMoUntil: 0,
    assistModeUntil: 0,
  })
  // Mirror state into a ref for fast reads in RAF without triggering React work
  useEffect(() => {
    stateRef.current = gameState
  }, [gameState])

  const words = ["0Unveiled", "Insight", "Vision", "Analyze", "Discover", "Create", "Build", "Code"]
  const [currentWord, setCurrentWord] = useState(words[0])

  // Friendly phases mapped from backend status
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
    const idx = PHASES.findIndex(p => s.toLowerCase().includes(p.key.toLowerCase()))
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
  const byProgress = phaseFromProgress(progress)
  if (byStatus < 0 && byProgress < 0) return 0 // default to first phase
  return Math.max(byStatus, byProgress)
  })()

  // Initialize obstacles with special types
  const initializeObstacles = useCallback((): Obstacle[] => {
    const obstacles: Obstacle[] = []
    for (let i = 0; i < 4; i++) {
      const rand = Math.random()
      let type: "normal" | "golden" | "rainbow" = "normal"
  // Generate rainbow first; previous order made rainbow unreachable
  if (rand < 0.05) type = "rainbow"
  else if (rand < 0.15) type = "golden"

      obstacles.push({
        x: 800 + i * GAME_CONFIG.obstacleSpacing,
        gapY: 120 + Math.random() * 260, // more varied gap positions
        passed: false,
        type,
      })
    }
    return obstacles
  }, [])

  // Reset game
  const resetGame = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      playerY: 250,
      velocity: 0,
      obstacles: initializeObstacles(),
      gameActive: true,
      score: 0,
      streak: 0,
      showEasterEgg: false,
  multiplier: 1,
  shieldCharges: 0,
  slowMoUntil: 0,
    }))
    setCurrentWord(words[Math.floor(Math.random() * words.length)])
  }, [initializeObstacles])

  // Handle jump and start
  const handleSpacePress = useCallback(() => {
    if (!gameState.gameStarted || !gameState.gameActive) {
      setGameState((prev) => ({
        ...prev,
        gameStarted: true,
        gameActive: true,
        obstacles: initializeObstacles(),
        consecutiveQuickLosses: 0,
        // Grant assist mode for a few seconds if we recently had many quick losses
        assistModeUntil: Date.now() + 8000,
        multiplier: 1,
        shieldCharges: 0,
        slowMoUntil: 0,
      }))
      runStartRef.current = Date.now()
      lastFrameRef.current = performance.now()
    } else if (!gameState.analysisComplete && gameState.gameActive) {
      setGameState((prev) => ({
        ...prev,
        velocity: GAME_CONFIG.jumpForce,
      }))
    }
  }, [gameState.gameStarted, gameState.analysisComplete, gameState.gameActive, initializeObstacles])

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault()
        handleSpacePress()
      } else if (event.code === "KeyP") {
        // Pause/Resume
        setGameState((prev) => ({ ...prev, gameActive: !prev.gameActive }))
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => {
      window.removeEventListener("keydown", handleKeyPress)
    }
  }, [handleSpacePress])

  // Mouse/touch controls on canvas (mobile friendly)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onPointer = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      handleSpacePress()
    }
    canvas.addEventListener("mousedown", onPointer)
    canvas.addEventListener("touchstart", onPointer)
    return () => {
      canvas.removeEventListener("mousedown", onPointer)
      canvas.removeEventListener("touchstart", onPointer)
    }
  }, [handleSpacePress])

  // No auto-start; show overlay and wait for SPACE

  // Collision detection
  const checkCollision = useCallback((playerY: number, obstacles: Obstacle[]): boolean => {
    const playerX = 150

    for (const obstacle of obstacles) {
      if (playerX + GAME_CONFIG.playerSize > obstacle.x && playerX < obstacle.x + GAME_CONFIG.obstacleWidth) {
        if (playerY < obstacle.gapY || playerY + GAME_CONFIG.playerSize > obstacle.gapY + GAME_CONFIG.obstacleGap) {
          return true
        }
      }
    }

    return playerY < 0 || playerY > 500 - GAME_CONFIG.playerSize
  }, [])

  // Game loop
  const useExternalProgress = typeof progress === "number" || !!complete

  // Sync external progress/complete into local state
  useEffect(() => {
    if (typeof progress === "number") {
      const clamped = Math.max(0, Math.min(100, progress))
      setGameState((prev) => ({ ...prev, progress: clamped }))
    }
  }, [progress])

  useEffect(() => {
    if (complete) {
      setGameState((prev) => ({ ...prev, progress: 100, analysisComplete: true }))
    }
  }, [complete])

  const gameLoop = useCallback(() => {
    if (!gameState.gameActive || gameState.analysisComplete || !gameState.gameStarted) return

  setGameState((prev) => {
      // Time-based delta for smoother animations
      const now = performance.now()
      const last = lastFrameRef.current ?? now
      const dt = Math.min(32, now - last) / 16.67 // normalize to ~60fps units
      lastFrameRef.current = now

      const newPlayerY = prev.playerY + prev.velocity * dt
      const newVelocity = prev.velocity + GAME_CONFIG.gravity * dt
      let newObstacles = [...prev.obstacles]
      // When external progress is controlling, don't auto-increment
      const newProgress = useExternalProgress ? prev.progress : Math.min(prev.progress + 0.033 * dt, 100)

      // Difficulty scaling: increase speed and reduce gap slightly over time and with progress
      const seconds = runStartRef.current ? (Date.now() - runStartRef.current) / 1000 : 0
      const progressFactor = (newProgress || 0) / 100
  const baseSpeed = GAME_CONFIG.gameSpeed
  // Stronger ramp so the game feels snappy early and scales faster
  const speedBoost = 1 + Math.min(1.0, 0.35 * progressFactor + 0.04 * seconds)
  const assistActive = prev.assistModeUntil > Date.now()
  const slowMoActive = prev.slowMoUntil > Date.now()
  // Keep speed high: no assist penalty; slow-mo effect is milder
  let effectiveSpeed = baseSpeed * speedBoost
  if (slowMoActive) effectiveSpeed *= 0.85
      const baseGap = GAME_CONFIG.obstacleGap
      const gapReduction = Math.min(60, 30 * progressFactor + 10 * Math.log10(1 + seconds))
      const effectiveGap = Math.max(110, baseGap - (assistActive ? gapReduction * 0.5 : gapReduction))
      const spacing = GAME_CONFIG.obstacleSpacing * (assistActive ? 1.05 : 1)

      // Update obstacles and check for scoring
      let newScore = prev.score
      let newStreak = prev.streak
      let showEasterEgg = false
      let easterEggType = ""
      let multiplier = prev.multiplier
      let shieldCharges = prev.shieldCharges
      let slowMoUntil = prev.slowMoUntil

      newObstacles = newObstacles.map((obstacle) => {
        const updatedObstacle = { ...obstacle, x: obstacle.x - effectiveSpeed * dt }

        if (!obstacle.passed && updatedObstacle.x + GAME_CONFIG.obstacleWidth < 150) {
          updatedObstacle.passed = true
          const base = obstacle.type === "golden" ? 3 : obstacle.type === "rainbow" ? 5 : 1
          newScore += base * multiplier
          newStreak += 1

          if (newStreak > 0 && newStreak % 5 === 0) {
            showEasterEgg = true
            easterEggType = EASTER_EGGS[Math.floor(Math.random() * EASTER_EGGS.length)]
          }

          // Power-ups on special obstacles
          if (obstacle.type === "golden") {
            shieldCharges = Math.min(2, shieldCharges + 1) // up to 2 shields
            showEasterEgg = true
            easterEggType = "🛡️ Shield +1"
          } else if (obstacle.type === "rainbow") {
            slowMoUntil = Date.now() + 2000 // 2s slow motion (lighter effect)
            showEasterEgg = true
            easterEggType = "🐢 Slow Motion"
          }
        }

        return updatedObstacle
      })

      // Add new obstacles with varying difficulty
  if (newObstacles[newObstacles.length - 1].x < 560) {
        const rand = Math.random()
        let type: "normal" | "golden" | "rainbow" = "normal"
        if (rand < 0.08) type = "rainbow"
        else if (rand < 0.15) type = "golden"

        newObstacles.push({
          x: newObstacles[newObstacles.length - 1].x + spacing,
          gapY: 100 + Math.random() * 300, // more challenging gap positions
          passed: false,
          type,
        })
      }

      // Remove off-screen obstacles
      newObstacles = newObstacles.filter((obstacle) => obstacle.x > -GAME_CONFIG.obstacleWidth)

      // Check collision with quick-loss handling
      // Collision handling with shield
      if (checkCollision(newPlayerY, newObstacles)) {
        if (shieldCharges > 0) {
          // Consume shield and give a bounce back instead of dying
          shieldCharges -= 1
          showEasterEgg = true
          easterEggType = "🛡️ Shield Saved You!"
          return {
            ...prev,
            playerY: Math.max(0, newPlayerY + GAME_CONFIG.jumpForce * 2),
            velocity: GAME_CONFIG.jumpForce * 0.75,
            obstacles: newObstacles,
            progress: newProgress,
            score: newScore,
            streak: 0,
            multiplier: 1,
            shieldCharges,
            slowMoUntil,
            showEasterEgg,
            easterEggType,
          }
        }
        const newHighScore = Math.max(prev.highScore, newScore)
        if (typeof window !== "undefined") {
          localStorage.setItem("aiGameHighScore", newHighScore.toString())
        }

        const runDuration = runStartRef.current ? Date.now() - runStartRef.current : Number.MAX_SAFE_INTEGER
        const quickLoss = runDuration < 2500 && newScore === 0
        const consecutiveQuickLosses = quickLoss ? prev.consecutiveQuickLosses + 1 : 0
        const shouldPause = consecutiveQuickLosses >= 3

    if (shouldPause) {
          // Pause the game and require SPACE to start again
          return {
            ...prev,
            playerY: 250,
            velocity: 0,
            obstacles: initializeObstacles(),
      gameActive: false,
      gameStarted: true,
            score: 0,
            streak: 0,
            highScore: newHighScore,
            showEasterEgg: false,
            consecutiveQuickLosses: 0,
            multiplier: 1,
            shieldCharges: 0,
            slowMoUntil: 0,
            assistModeUntil: Date.now() + 12000, // stronger assist on return
          }
        }

        // Continue running but reset player
        runStartRef.current = Date.now()
        return {
          ...prev,
          playerY: 250,
          velocity: 0,
          obstacles: initializeObstacles(),
          gameActive: true,
          score: 0,
          streak: 0,
          highScore: newHighScore,
          showEasterEgg: false,
          consecutiveQuickLosses,
          multiplier: 1,
          shieldCharges: 0,
          slowMoUntil: 0,
          assistModeUntil: Date.now() + 6000,
        }
      }

      // Check if analysis is complete
  if (newProgress >= 100) {
        const finalHighScore = Math.max(prev.highScore, newScore)
        if (typeof window !== "undefined") {
          localStorage.setItem("aiGameHighScore", finalHighScore.toString())
        }

        return {
          ...prev,
          progress: 100,
          analysisComplete: true,
          highScore: finalHighScore,
        }
      }

      // Update score multiplier based on streak (1x..5x)
      multiplier = Math.min(5, 1 + Math.floor(newStreak / 5))

      const nextState: GameState = {
        ...prev,
        playerY: newPlayerY,
        velocity: newVelocity,
        obstacles: newObstacles,
        progress: newProgress,
        score: newScore,
        streak: newStreak,
        showEasterEgg,
        easterEggType,
        multiplier,
        shieldCharges,
        slowMoUntil,
      }
      // Mirror to ref for draw loop
      stateRef.current = nextState
      return nextState
    })
  }, [gameState.gameActive, gameState.analysisComplete, gameState.gameStarted, checkCollision, initializeObstacles, useExternalProgress])

  // Setup canvas context and cached gradient
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctxRef.current = ctx

    const setupSize = () => {
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
      const cssWidth = 800
      const cssHeight = 400
      if (canvas.width !== cssWidth * dpr || canvas.height !== cssHeight * dpr) {
        canvas.width = cssWidth * dpr
        canvas.height = cssHeight * dpr
        canvas.style.width = cssWidth + "px"
        canvas.style.height = cssHeight + "px"
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
      // Cache a horizontal rainbow gradient across obstacle width
      const grad = ctx.createLinearGradient(0, 0, GAME_CONFIG.obstacleWidth, 0)
      grad.addColorStop(0, "#FF6B6B")
      grad.addColorStop(0.33, "#4ECDC4")
      grad.addColorStop(0.66, "#45B7D1")
      grad.addColorStop(1, "#96CEB4")
      rainbowGradientRef.current = grad
    }
    setupSize()
    const onResize = () => setupSize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  // Combined RAF: advance game logic and draw frame
  useEffect(() => {
    const draw = () => {
      const ctx = ctxRef.current
      const gs = stateRef.current || gameState
      const canvas = canvasRef.current
      if (!ctx || !canvas) return

      // Clear & background
      const w = 800
      const h = 400
      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, "#ffffff")
      bg.addColorStop(1, "#f6f7f9")
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      if (!gs.gameStarted) {
        ctx.fillStyle = "black"
        ctx.font = "48px system-ui, -apple-system, sans-serif"
        ctx.textAlign = "center"
        ctx.fillText("AI Analysis Game", w / 2, h / 2 - 60)
        ctx.font = "24px system-ui, -apple-system, sans-serif"
        ctx.fillText("Press SPACE or Tap to Start", w / 2, h / 2 + 20)
        ctx.font = "16px system-ui, -apple-system, sans-serif"
        ctx.fillStyle = "gray"
        ctx.fillText(`High Score: ${gs.highScore}`, w / 2, h / 2 + 60)
      } else if (!gs.analysisComplete) {
        // Obstacles
        for (const obstacle of gs.obstacles) {
          if (obstacle.type === "golden") {
            ctx.fillStyle = "#FFD700"
          } else if (obstacle.type === "rainbow" && rainbowGradientRef.current) {
            ctx.fillStyle = rainbowGradientRef.current
          } else {
            ctx.fillStyle = "black"
          }
          // Top
          ctx.fillRect(obstacle.x, 0, GAME_CONFIG.obstacleWidth, obstacle.gapY)
          // Bottom
          const gap = Math.max(110, GAME_CONFIG.obstacleGap)
          ctx.fillRect(obstacle.x, obstacle.gapY + gap, GAME_CONFIG.obstacleWidth, h - (obstacle.gapY + gap))
        }

        // Player
        ctx.shadowBlur = gs.streak >= 10 ? 10 : 0
        ctx.shadowColor = gs.streak >= 10 ? "#4ECDC4" : "transparent"
        ctx.fillStyle = "black"
        ctx.font = "20px system-ui, -apple-system, sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(currentWord, 150 + GAME_CONFIG.playerSize / 2, gs.playerY + 15)

        // Shield aura
        if (gs.shieldCharges > 0) {
          ctx.strokeStyle = "#FFD700"
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(150 + GAME_CONFIG.playerSize / 2, gs.playerY + 8, 18, 0, Math.PI * 2)
          ctx.stroke()
        }

        // HUD
        ctx.shadowBlur = 0
        ctx.fillStyle = "#111"
        ctx.font = "14px system-ui, -apple-system, sans-serif"
        ctx.textAlign = "left"
        ctx.fillText(`Score: ${gs.score}`, 12, 22)
        ctx.fillText(`x${gs.multiplier} combo`, 12, 40)
        if (gs.shieldCharges > 0) ctx.fillText(`Shield: ${gs.shieldCharges}`, 12, 58)
        if (gs.slowMoUntil > Date.now()) {
          ctx.textAlign = "center"
          ctx.fillStyle = "#0a0a0a"
          ctx.fillText("SLOW MOTION", w / 2, 28)
        }

        // Toast
        if (gs.showEasterEgg) {
          ctx.fillStyle = "rgba(0,0,0,0.8)"
          const msg = gs.easterEggType
          const padX = 10
          const padY = 6
          const textW = ctx.measureText(msg).width
          const boxW = textW + padX * 2
          const boxH = 28
          const x = w / 2 - boxW / 2
          const y = 60
          ctx.fillRect(x, y, boxW, boxH)
          ctx.fillStyle = "#fff"
          ctx.textAlign = "center"
          ctx.font = "14px system-ui, -apple-system, sans-serif"
          ctx.fillText(msg, w / 2, y + 18)
        }
      } else {
        ctx.fillStyle = "black"
        ctx.font = "32px system-ui, -apple-system, sans-serif"
        ctx.textAlign = "center"
        ctx.fillText("Analysis Complete!", w / 2, h / 2 - 40)
        ctx.font = "24px system-ui, -apple-system, sans-serif"
        ctx.fillText(`Final Score: ${gs.score}`, w / 2, h / 2)
        if (gs.score === gs.highScore && gs.score > 0) {
          ctx.fillStyle = "#FFD700"
          ctx.fillText("🏆 NEW HIGH SCORE! 🏆", w / 2, h / 2 + 40)
        }
        ctx.fillStyle = "gray"
        ctx.font = "18px system-ui, -apple-system, sans-serif"
        ctx.fillText("Transitioning to results...", w / 2, h / 2 + 80)
      }
    }

    const animate = () => {
      gameLoop()
      draw()
      animationRef.current = requestAnimationFrame(animate)
    }

    if (gameState.gameStarted && !gameState.analysisComplete) {
      animationRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [gameLoop, gameState.gameStarted, gameState.analysisComplete, currentWord])

  // Hide easter egg after delay
  useEffect(() => {
    if (gameState.showEasterEgg) {
      const timer = setTimeout(() => {
        setGameState((prev) => ({ ...prev, showEasterEgg: false }))
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [gameState.showEasterEgg])


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 mb-3">
          <div className="w-6 h-6 border border-black/20 border-t-black rounded-full animate-spin" />
          <h1 className="text-xl font-semibold text-black">Processing Analysis</h1>
        </div>
        <p className="text-gray-500 text-sm">Please wait while we analyze your request...</p>
      </div>

  {
        <div className="w-full max-w-md px-6 mb-6">
          <div className="bg-white rounded-lg p-5 border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-black">Analysis Progress</span>
              {typeof progress === "number" ? (
                <span className="text-sm font-mono text-black/80">{Math.round(gameState.progress)}%</span>
              ) : null}
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              {typeof progress === "number" ? (
                <div
                  className="h-full bg-black transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${gameState.progress}%` }}
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
                : gameState.progress < 30
                ? "Initializing..."
                : gameState.progress < 60
                ? "Processing data..."
                : gameState.progress < 90
                ? "Finalizing results..."
                : "Almost complete..."}
            </div>
            {currentRepo ? (
              <div className="mt-1 text-[11px] text-black/70 font-medium">
                Currently analyzing: {currentRepo}
              </div>
            ) : null}

            {/* Analysis steps merged into this card */}
            <div className="mt-4">
              <div className="text-xs font-medium text-black mb-2">Analysis steps</div>
              <ol className="space-y-1">
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
                          <svg viewBox="0 0 20 20" className="w-3 h-3 text-white"><path fill="currentColor" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"/></svg>
                        ) : isCurrent ? (
                          <svg viewBox="0 0 20 20" className="w-3 h-3 text-white"><circle cx="10" cy="10" r="3" fill="currentColor"/></svg>
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
          </div>
        </div>
      }

  <div className="relative bg-white rounded-xl border border-gray-200 overflow-hidden">
  {!gameState.gameActive && !gameState.analysisComplete && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <div className="text-center space-y-4">
      <h2 className="text-xl font-medium text-gray-800">Press SPACE to start the game</h2>
      <p className="text-gray-500 text-sm">Crash instantly 3 times and we’ll pause again. Press SPACE to try again.</p>
              {gameState.highScore > 0 && <p className="text-xs text-gray-400">Best Score: {gameState.highScore}</p>}
            </div>
          </div>
        )}

  <canvas ref={canvasRef} width={800} height={400} className="block" style={{ background: "transparent" }} />

  {/* Minimal: hide on-canvas instruction pill */}
      </div>

  {/* Steps card removed; now merged into the progress card above */}

      {/* Minimal: remove extra footers/estimates */}

      {gameState.analysisComplete && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 text-green-600 mb-2">
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
    </div>
  )
}
