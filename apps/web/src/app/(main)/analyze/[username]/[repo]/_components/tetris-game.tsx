"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

type Cell = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 // 0 empty, 1..7 pieces

const COLS = 10
const ROWS = 20
const TILE = 24
const BOARD_W = COLS * TILE
const BOARD_H = ROWS * TILE

const COLORS: Record<Cell, string> = {
  0: "#ffffff",
  1: "#00BCD4", // I - cyan
  2: "#3F51B5", // J - blue
  3: "#FF9800", // L - orange
  4: "#FFEB3B", // O - yellow
  5: "#4CAF50", // S - green
  6: "#9C27B0", // T - purple
  7: "#F44336", // Z - red
}

type ShapeMatrix = number[][]

// Tetromino definitions (minimized, rotate via matrix rotation)
const SHAPES: Record<Exclude<Cell, 0>, ShapeMatrix> = {
  1: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ], // I
  2: [
    [2, 0, 0],
    [2, 2, 2],
    [0, 0, 0],
  ], // J
  3: [
    [0, 0, 3],
    [3, 3, 3],
    [0, 0, 0],
  ], // L
  4: [
    [4, 4],
    [4, 4],
  ], // O
  5: [
    [0, 5, 5],
    [5, 5, 0],
    [0, 0, 0],
  ], // S
  6: [
    [0, 6, 0],
    [6, 6, 6],
    [0, 0, 0],
  ], // T
  7: [
    [7, 7, 0],
    [0, 7, 7],
    [0, 0, 0],
  ], // Z
}

function rotateMatrix(mat: ShapeMatrix): ShapeMatrix {
  const N = mat.length
  const res: ShapeMatrix = Array.from({ length: N }, () => Array(N).fill(0))
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      res[x][N - 1 - y] = mat[y][x]
    }
  }
  return res
}

function cloneBoard(b: Cell[][]): Cell[][] {
  return b.map((r) => r.slice())
}

function createEmptyBoard(): Cell[][] {
  return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(0))
}

// 7-bag generator for fair piece distribution
function* bagGenerator(): Generator<Exclude<Cell, 0>, never, unknown> {
  const pieces: Exclude<Cell, 0>[] = [1, 2, 3, 4, 5, 6, 7]
  while (true) {
    // shuffle
    const bag = pieces.slice()
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[bag[i], bag[j]] = [bag[j], bag[i]]
    }
    for (const p of bag) yield p
  }
}

interface ActivePiece {
  shape: ShapeMatrix
  type: Exclude<Cell, 0>
  x: number
  y: number
}

function collides(board: Cell[][], piece: ActivePiece, offX = 0, offY = 0): boolean {
  const N = piece.shape.length
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const val = piece.shape[y][x]
      if (!val) continue
      const bx = piece.x + x + offX
      const by = piece.y + y + offY
      if (bx < 0 || bx >= COLS || by >= ROWS) return true
      if (by >= 0 && board[by][bx] !== 0) return true
    }
  }
  return false
}

function lockPiece(board: Cell[][], piece: ActivePiece): Cell[][] {
  const newBoard = cloneBoard(board)
  const N = piece.shape.length
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const val = piece.shape[y][x]
      if (!val) continue
      const bx = piece.x + x
      const by = piece.y + y
      if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
        newBoard[by][bx] = piece.type
      }
    }
  }
  return newBoard
}

function clearLines(board: Cell[][]): { board: Cell[][]; lines: number } {
  const newBoard: Cell[][] = []
  let cleared = 0
  for (let y = 0; y < ROWS; y++) {
    if (board[y].every((c) => c !== 0)) {
      cleared++
    } else {
      newBoard.push(board[y].slice())
    }
  }
  while (newBoard.length < ROWS) newBoard.unshift(Array<Cell>(COLS).fill(0))
  return { board: newBoard, lines: cleared }
}

function computeGhostY(board: Cell[][], piece: ActivePiece): number {
  let gy = piece.y
  while (!collides(board, piece, 0, gy - piece.y + 1)) gy++
  return gy
}

function scoreForLines(lines: number, level: number): number {
  switch (lines) {
    case 1:
      return 100 * (level + 1)
    case 2:
      return 300 * (level + 1)
    case 3:
      return 500 * (level + 1)
    case 4:
      return 800 * (level + 1)
    default:
      return 0
  }
}

export interface TetrisGameProps {
  className?: string
  variant?: "light" | "dark"
}

export default function TetrisGame({ className, variant = "light" }: TetrisGameProps) {
  const isDark = variant === "dark"
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nextRef = useRef<HTMLCanvasElement>(null)
  const [board, setBoard] = useState<Cell[][]>(createEmptyBoard())
  const bagRef = useRef<Generator<Exclude<Cell, 0>> | null>(null)
  const [active, setActive] = useState<ActivePiece | null>(null)
  const [next, setNext] = useState<Exclude<Cell, 0>[]>([])
  const [running, setRunning] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  // Difficulty mode
  const [mode, setMode] = useState<"easy" | "medium" | "hard" | "insane">("medium")
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(0)
  const [linesCleared, setLinesCleared] = useState(0)
  const dropIntervalRef = useRef<number>(1000)
  const lastDropRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)

  const BASE_INTERVAL: Record<typeof mode, number> = {
    easy: 1000,
    medium: 700,
    hard: 180, // super fast hard mode
    insane: 120, // even faster
  }
  const MIN_INTERVAL = mode === "insane" ? 50 : mode === "hard" ? 80 : 120

  const seedQueue = useCallback((): Exclude<Cell, 0>[] => {
    const q: Exclude<Cell, 0>[] = []
    if (!bagRef.current) return q
    for (let i = 0; i < 3; i++) q.push(bagRef.current.next().value as Exclude<Cell, 0>)
    return q
  }, [])

  const initActiveFromQueue = useCallback((queue: Exclude<Cell, 0>[]) => {
    if (!queue.length) return null
    const t = queue[0]
    const shape = SHAPES[t]
    const spawnX = Math.floor((COLS - shape.length) / 2)
    const piece: ActivePiece = { shape, type: t, x: spawnX, y: -2 }
    setActive(piece)
    return piece
  }, [])

  // Initialize bag and queue
  useEffect(() => {
    bagRef.current = bagGenerator()
    const q = seedQueue()
    setNext(q)
    initActiveFromQueue(q)
  }, [seedQueue, initActiveFromQueue])

  const spawnNextPiece = useCallback((): ActivePiece | null => {
    if (!bagRef.current || next.length === 0) return null
    const rest = next.slice(1)
    const nextVal = bagRef.current.next().value as Exclude<Cell, 0>
    const refill: Exclude<Cell, 0>[] = [...rest, nextVal]
    const t: Exclude<Cell, 0> = refill[0]
    const piece: ActivePiece = {
      shape: SHAPES[t],
      type: t,
      x: Math.floor((COLS - SHAPES[t].length) / 2),
      y: -2,
    }
    setActive(piece)
    setNext(refill)
    return piece
  }, [next])

  const hardDrop = useCallback(() => {
    if (!active) return
    const gy = computeGhostY(board, active)
    // If the ghost lands above the visible board, it's a top-out
    if (gy < 0) {
      setRunning(false)
      setGameOver(true)
      return
    }
    const dist = gy - active.y
    const locked = lockPiece(board, { ...active, y: gy })
    const { board: cleared, lines } = clearLines(locked)
    setBoard(cleared)
    setScore((s) => s + dist * 2 + scoreForLines(lines, level))
    if (lines > 0) {
      setLinesCleared((n) => n + lines)
      const newLevel = Math.floor((linesCleared + lines) / 10)
      setLevel(newLevel)
  dropIntervalRef.current = Math.max(MIN_INTERVAL, BASE_INTERVAL[mode] - newLevel * 80)
    }
    const newPiece = spawnNextPiece()
    if (newPiece && collides(cleared, newPiece, 0, 0)) {
      // game over only if the freshly spawned piece collides immediately
      setRunning(false)
      setGameOver(true)
    }
  }, [active, board, level, linesCleared, spawnNextPiece, mode])

  const tryMove = useCallback((dx: number, dy: number) => {
    setActive((cur) => {
      if (!cur) return cur
      if (!collides(board, cur, dx, dy)) {
        return { ...cur, x: cur.x + dx, y: cur.y + dy }
      }
      return cur
    })
  }, [board])

  const tryRotate = useCallback(() => {
    setActive((cur) => {
      if (!cur) return cur
      const rotated = rotateMatrix(cur.shape)
      const test: ActivePiece = { ...cur, shape: rotated }
      // simple wall kicks: try offsets
      const kicks = [0, -1, 1, -2, 2]
      for (const k of kicks) {
        if (!collides(board, test, k, 0)) return { ...test, x: test.x + k }
      }
      return cur
    })
  }, [board])

  const tick = useCallback((time: number) => {
    if (!running) {
      rafRef.current = requestAnimationFrame(tick)
      return
    }
    if (!active) {
      rafRef.current = requestAnimationFrame(tick)
      return
    }
    if (!lastDropRef.current) lastDropRef.current = time
    const elapsed = time - lastDropRef.current
    if (elapsed >= dropIntervalRef.current) {
      lastDropRef.current = time
      // attempt to move down; if collide, lock
      if (!collides(board, active, 0, 1)) {
        setActive((p) => (p ? { ...p, y: p.y + 1 } : p))
      } else {
        // If we collide while the piece is partially above the board, that's a top-out
        if (active.y < 0) {
          setRunning(false)
          setGameOver(true)
          rafRef.current = requestAnimationFrame(tick)
          return
        }
        // lock and clear
        const locked = lockPiece(board, active)
        const { board: cleared, lines } = clearLines(locked)
        setBoard(cleared)
        if (lines > 0) {
          setScore((s) => s + scoreForLines(lines, level))
          setLinesCleared((n) => n + lines)
          const newLevel = Math.floor((linesCleared + lines) / 10)
          setLevel(newLevel)
          dropIntervalRef.current = Math.max(MIN_INTERVAL, BASE_INTERVAL[mode] - newLevel * 80)
        }
        const newPiece = spawnNextPiece()
        if (newPiece && collides(cleared, newPiece, 0, 0)) {
          setRunning(false)
          setGameOver(true)
        }
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [active, board, level, linesCleared, running, spawnNextPiece, mode])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [tick])

  // Controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      switch (e.code) {
        case "Space":
          e.preventDefault()
          if (!running) {
            // If previously game over, do a light init and start
            if (gameOver) {
              // re-init state similar to Reset but start immediately
              setBoard(createEmptyBoard())
              setScore(0)
              setLevel(0)
              setLinesCleared(0)
              dropIntervalRef.current = BASE_INTERVAL[mode]
              lastDropRef.current = 0
              setGameOver(false)
              // re-seed bag and queue
              bagRef.current = bagGenerator()
              const q = seedQueue()
              setNext(q)
              initActiveFromQueue(q)
            } else {
              dropIntervalRef.current = BASE_INTERVAL[mode]
              lastDropRef.current = 0
            }
            setRunning(true)
          } else {
            hardDrop()
          }
          break
        case "ArrowLeft":
          e.preventDefault()
          tryMove(-1, 0)
          break
        case "ArrowRight":
          e.preventDefault()
          tryMove(1, 0)
          break
        case "ArrowDown":
          e.preventDefault()
          if (running) {
            // soft drop
            if (!collides(board, active!, 0, 1)) {
              setActive((p) => (p ? { ...p, y: p.y + 1 } : p))
              setScore((s) => s + 1)
              lastDropRef.current = 0
            }
          }
          break
        case "ArrowUp":
          e.preventDefault()
          tryRotate()
          break
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [running, board, active, hardDrop, tryMove, tryRotate, mode, gameOver, seedQueue, initActiveFromQueue])

  // Draw board
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, BOARD_W, BOARD_H)

    // background
    ctx.fillStyle = "#fafafa"
    ctx.fillRect(0, 0, BOARD_W, BOARD_H)

    // grid
    ctx.strokeStyle = "#eee"
    ctx.lineWidth = 1
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath()
      ctx.moveTo(x * TILE + 0.5, 0)
      ctx.lineTo(x * TILE + 0.5, BOARD_H)
      ctx.stroke()
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath()
      ctx.moveTo(0, y * TILE + 0.5)
      ctx.lineTo(BOARD_W, y * TILE + 0.5)
      ctx.stroke()
    }

    // settled blocks
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const v = board[y][x] as Cell
        if (v) {
          ctx.fillStyle = COLORS[v]
          ctx.fillRect(x * TILE + 1, y * TILE + 1, TILE - 2, TILE - 2)
        }
      }
    }

    // ghost
    if (active) {
      const gy = computeGhostY(board, active)
      const N = active.shape.length
      ctx.globalAlpha = 0.25
      ctx.fillStyle = COLORS[active.type]
      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          if (!active.shape[y][x]) continue
          const bx = (active.x + x) * TILE
          const by = (gy + y) * TILE
          if (gy + y >= 0)
            ctx.fillRect(bx + 1, by + 1, TILE - 2, TILE - 2)
        }
      }
      ctx.globalAlpha = 1
    }

    // active piece
    if (active) {
      const N = active.shape.length
      ctx.fillStyle = COLORS[active.type]
      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          if (!active.shape[y][x]) continue
          const bx = (active.x + x) * TILE
          const by = (active.y + y) * TILE
          if (active.y + y >= 0)
            ctx.fillRect(bx + 1, by + 1, TILE - 2, TILE - 2)
        }
      }
    }
  }, [board, active])

  // draw next preview
  const drawNext = useCallback(() => {
    const canvas = nextRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, 4 * TILE, 4 * TILE)
    ctx.fillStyle = "#fff"
    ctx.fillRect(0, 0, 4 * TILE, 4 * TILE)
    if (!next.length) return
    const t = next[0]
    const shape = SHAPES[t]
    ctx.fillStyle = COLORS[t]
    const offsetX = Math.floor((4 - shape.length) / 2)
    const offsetY = Math.floor((4 - shape.length) / 2)
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape.length; x++) {
        if (shape[y][x]) {
          ctx.fillRect((x + offsetX) * TILE + 1, (y + offsetY) * TILE + 1, TILE - 2, TILE - 2)
        }
      }
    }
  }, [next])

  useEffect(() => {
    draw()
  }, [draw])

  useEffect(() => {
    drawNext()
  }, [drawNext])

  const onCanvasClick = useCallback(() => {
    if (!running) {
      // Mirror keyboard start behavior
      if (gameOver) {
        setBoard(createEmptyBoard())
        setScore(0)
        setLevel(0)
        setLinesCleared(0)
        dropIntervalRef.current = BASE_INTERVAL[mode]
        lastDropRef.current = 0
        setGameOver(false)
        bagRef.current = bagGenerator()
        const q = seedQueue()
        setNext(q)
        initActiveFromQueue(q)
      } else {
        dropIntervalRef.current = BASE_INTERVAL[mode]
        lastDropRef.current = 0
      }
      setRunning(true)
    } else {
      hardDrop()
    }
  }, [running, hardDrop, gameOver, mode, seedQueue, initActiveFromQueue])

  // Controls panel
  const overlay = useMemo(() => {
  if (!running && !gameOver) {
      return (
        <div className={`absolute inset-0 z-10 flex items-center justify-center ${isDark ? "bg-black/60" : "bg-white/90"} px-3 pointer-events-none`}>
          <div className="text-center space-y-3 max-w-full">
            <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}>Tetris</h3>
            <p className={`text-xs ${isDark ? "text-white/70" : "text-gray-500"}`}>Mode: <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>{mode[0].toUpperCase() + mode.slice(1)}</span> (change in sidebar)</p>
            <p className={`text-sm ${isDark ? "text-white/80" : "text-gray-600"}`}>Press Space or Tap to Start</p>
            <p className={`text-xs ${isDark ? "text-white/70" : "text-gray-500"}`}>Arrows: Move • Up: Rotate • Space: Hard Drop</p>
          </div>
        </div>
      )
    }
    if (!running && gameOver) {
      return (
        <div className={`absolute inset-0 z-10 flex items-center justify-center ${isDark ? "bg-black/60" : "bg-white/90"} px-3`}>
          <div className="text-center space-y-3 max-w-full">
            <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}>Game Over</h3>
            <div className={`text-sm ${isDark ? "text-white/80" : "text-gray-600"}`}>Score: {score} • Lines: {linesCleared} • Level: {level}</div>
            <button
              className={`px-4 py-1.5 text-sm rounded ${isDark ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90"}`}
              onClick={() => {
                setBoard(createEmptyBoard())
                setScore(0)
                setLevel(0)
                setLinesCleared(0)
                dropIntervalRef.current = BASE_INTERVAL[mode]
                lastDropRef.current = 0
                setGameOver(false)
                bagRef.current = bagGenerator()
                const q = seedQueue()
                setNext(q)
                initActiveFromQueue(q)
                setRunning(true)
              }}
            >
              Restart
            </button>
            <p className={`text-xs ${isDark ? "text-white/70" : "text-gray-500"}`}>Mode: <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>{mode[0].toUpperCase() + mode.slice(1)}</span> (change in sidebar)</p>
          </div>
        </div>
      )
    }
    return null
  }, [running, gameOver, mode, score, linesCleared, level, seedQueue, initActiveFromQueue])

  return (
    <div className={`relative flex gap-6 ${className ?? ""}`}>
      <div className="relative select-none overflow-hidden">
        {overlay}
        <canvas
          ref={canvasRef}
          width={BOARD_W}
          height={BOARD_H}
          className={`block border rounded ${isDark ? "border-white/20" : "border-gray-200"}`}
          onClick={onCanvasClick}
        />
      </div>
      <div className="w-56 md:w-64">
        <div className={`rounded p-3 overflow-hidden border ${isDark ? "bg-black/60 border-white/20 text-white backdrop-blur-sm" : "bg-white border-gray-200"}`}>
          <div className={`text-xs mb-2 ${isDark ? "text-white/70" : "text-gray-500"}`}>Mode</div>
          <div className="flex flex-wrap gap-2 mb-3">
            {(["easy", "medium", "hard", "insane"] as const).map((m) => (
              <button
                key={m}
                disabled={running}
                className={`text-xs rounded px-3 py-1 border ${
                  mode === m
                    ? isDark
                      ? "bg-white text-black border-white"
                      : "bg-black text-white border-black"
                    : isDark
                      ? "border-white/30 text-white hover:bg-white/10"
                      : "border-gray-300 hover:bg-gray-50"
                } ${running ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => setMode(m)}
              >
                {m[0].toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
          <div className={`text-xs ${isDark ? "text-white/70" : "text-gray-500"}`}>Next</div>
          <canvas ref={nextRef} width={4 * TILE} height={4 * TILE} className={`mt-2 border rounded ${isDark ? "border-white/20" : "border-gray-100"}`} />
          <div className="mt-4 text-sm">
            <div className="flex justify-between"><span className={`${isDark ? "text-white/70" : "text-gray-500"}`}>Score</span><span className={`font-semibold ${isDark ? "text-white" : ""}`}>{score}</span></div>
            <div className="flex justify-between"><span className={`${isDark ? "text-white/70" : "text-gray-500"}`}>Level</span><span className={`font-semibold ${isDark ? "text-white" : ""}`}>{level}</span></div>
            <div className="flex justify-between"><span className={`${isDark ? "text-white/70" : "text-gray-500"}`}>Lines</span><span className={`font-semibold ${isDark ? "text-white" : ""}`}>{linesCleared}</span></div>
          </div>
          <div className="mt-4">
            <button
              className={`w-full text-sm rounded px-3 py-1.5 disabled:opacity-50 ${isDark ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90"}`}
              onClick={() => {
                if (!running) {
                  if (gameOver) {
                    setBoard(createEmptyBoard())
                    setScore(0)
                    setLevel(0)
                    setLinesCleared(0)
                    dropIntervalRef.current = BASE_INTERVAL[mode]
                    lastDropRef.current = 0
                    setGameOver(false)
                    bagRef.current = bagGenerator()
                    const q = seedQueue()
                    setNext(q)
                    initActiveFromQueue(q)
                  } else {
                    dropIntervalRef.current = BASE_INTERVAL[mode]
                    lastDropRef.current = 0
                  }
                  setRunning(true)
                }
              }}
              disabled={running}
            >
              Start
            </button>
            <button
              className={`w-full mt-2 text-sm border rounded px-3 py-1.5 ${isDark ? "border-white/30 text-white hover:bg-white/10" : "border-gray-300 hover:bg-gray-50"}`}
              onClick={() => {
                setBoard(createEmptyBoard())
                setScore(0)
                setLevel(0)
                setLinesCleared(0)
                dropIntervalRef.current = BASE_INTERVAL[mode]
                lastDropRef.current = 0
                setRunning(false)
                setGameOver(false)
                // re-seed bag and queue
                bagRef.current = bagGenerator()
                const q: Exclude<Cell, 0>[] = seedQueue()
                setNext(q)
                const t = q[0]
                const shape = SHAPES[t]
                setActive({ shape, type: t, x: Math.floor((COLS - shape.length) / 2), y: -2 })
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
