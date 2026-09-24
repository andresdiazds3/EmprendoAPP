import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .string({ required_error: "El email es requerido" })
    .email("Email inválido"),
  password: z
    .string({ required_error: "La contraseña es requerida" })
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
  name: z
    .string({ required_error: "El nombre es requerido" })
    .min(1, "El nombre no puede estar vacío"),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar los Términos y Condiciones para crear una cuenta" }),
  }),
});

export type RegisterDto = z.infer<typeof registerSchema>;
