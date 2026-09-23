import { Response } from "express";
import { AuthenticatedRequest } from "../../core/types";
import { updateProfileSchema } from "./dtos/update-profile.dto";
import { usersService } from "./users.service";
import { ok } from "../../shared/utils/http-response";

export class UsersController {
  async updateProfile(req: AuthenticatedRequest, res: Response) {
    const userId = req.user!.id;
    const validatedData = updateProfileSchema.parse(req.body);
    const updatedUser = await usersService.updateProfile(userId, validatedData);
    return ok(res, updatedUser, "Perfil actualizado exitosamente");
  }
}

export const usersController = new UsersController();
