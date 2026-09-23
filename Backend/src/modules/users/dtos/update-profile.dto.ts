import { z } from "zod";

export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(100, "El nombre no puede exceder los 100 caracteres")
      .optional(),
    profilePictureUrl: z
      .string()
      .url("profilePictureUrl debe ser una URL válida")
      .nullable()
      .optional(),
    profilePicturePublicId: z
      .string()
      .min(1, "profilePicturePublicId no puede estar vacío")
      .nullable()
      .optional(),
  })
  .refine(
    (data) => {
      const hasUrl = data.profilePictureUrl !== undefined;
      const hasPublicId = data.profilePicturePublicId !== undefined;
      if (!hasUrl && !hasPublicId) return true;
      if (hasUrl && hasPublicId) {
        const urlIsNull = data.profilePictureUrl === null;
        const idIsNull = data.profilePicturePublicId === null;
        return urlIsNull === idIsNull;
      }
      return false;
    },
    {
      message: "profilePictureUrl y profilePicturePublicId deben enviarse juntos o ninguno",
      path: ["profilePictureUrl"],
    }
  );

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
