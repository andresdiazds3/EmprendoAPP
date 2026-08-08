import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors";
import { env } from "../../config/env";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      message: "Datos de entrada inválidos",
      errors: err.flatten().fieldErrors,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  console.error("💥 Error no controlado:", err);

  return res.status(500).json({
    success: false,
    message: "Error interno del servidor",
    ...(env.NODE_ENV === "development" && {
      detail: err instanceof Error ? err.message : String(err),
    }),
  });
}
