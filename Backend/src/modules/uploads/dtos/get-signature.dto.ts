import { z } from "zod";

export const getSignatureSchema = z.object({
  folder: z.enum(["products", "profiles"], {
    required_error: "El parámetro folder es requerido",
    invalid_type_error: "Folder inválido. Debe ser 'products' o 'profiles'",
  }),
});

export type GetSignatureDto = z.infer<typeof getSignatureSchema>;
