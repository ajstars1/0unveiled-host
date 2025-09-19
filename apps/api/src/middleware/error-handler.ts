import type { Request, Response } from "express";
import { ZodError } from "zod";

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function errorHandler(error: ApiError, req: Request, res: Response) {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "Validation Error",
      message: "Invalid request data",
      details: error.errors,
    });
  }

  // Handle operational errors
  if (error.isOperational) {
    return res.status(error.statusCode || 500).json({
      error: "API Error",
      message: error.message,
    });
  }

  // Handle unexpected errors
  res.status(500).json({
    error: "Internal Server Error",
    message: "Something went wrong",
  });
}
