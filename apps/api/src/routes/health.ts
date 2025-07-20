import { Router } from "express"

const router = Router()

router.get("/", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  })
})

router.get("/ready", (req, res) => {
  // Add readiness checks here (database, external services, etc.)
  res.json({
    status: "ready",
    timestamp: new Date().toISOString(),
  })
})

export { router as healthRoutes } 