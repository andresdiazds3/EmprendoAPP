import { z } from "zod";

export const sendMessageSchema = z.object({
  sessionId: z.string().cuid("ID de sesión inválido").optional(),
  message: z
    .string({ required_error: "El mensaje es requerido" })
    .min(1, "El mensaje no puede estar vacío")
    .max(2000, "El mensaje no puede superar los 2000 caracteres"),
});

export type SendMessageDto = z.infer<typeof sendMessageSchema>;
