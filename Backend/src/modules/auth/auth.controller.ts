import { Request, Response } from "express";
import { authService } from "./auth.service";
import { registerSchema } from "./dtos/register.dto";
import { loginSchema } from "./dtos/login.dto";
import { created, ok } from "../../shared/utils/http-response";
import { AuthenticatedRequest } from "../../core/types";

export class AuthController {
  async register(req: Request, res: Response) {
    const validatedData = registerSchema.parse(req.body);
    const result = await authService.register(validatedData);
    return created(res, result, "Usuario registrado exitosamente");
  }

  async login(req: Request, res: Response) {
    const validatedData = loginSchema.parse(req.body);
    const result = await authService.login(validatedData);
    return ok(res, result, "Inicio de sesión exitoso");
  }

  async logout(_req: AuthenticatedRequest, res: Response) {
    return ok(res, { success: true }, "Sesión cerrada");
  }

  async me(req: AuthenticatedRequest, res: Response) {
    const userId = req.user!.id;
    const user = await authService.getMe(userId);
    return ok(res, user, "Datos del usuario obtenidos");
  }
}

export const authController = new AuthController();
