import { z } from "zod";

export const resetPasswordSchema = z.object({
  email: z
    .string({ required_error: "El email es requerido" })
    .email("Email inválido"),
  code: z
    .string({ required_error: "El código es requerido" })
    .length(6, "El código debe tener exactamente 6 dígitos")
    .regex(/^\d{6}$/, "El código debe ser numérico"),
  newPassword: z
    .string({ required_error: "La nueva contraseña es requerida" })
    .min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
});

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
