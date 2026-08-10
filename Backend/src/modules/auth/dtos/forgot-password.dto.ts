import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: "El email es requerido" })
    .email("Email inválido"),
});

export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
