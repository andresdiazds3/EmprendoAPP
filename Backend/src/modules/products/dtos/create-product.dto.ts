import { z } from "zod";

export const createProductSchema = z.object({
  name: z
    .string({ required_error: "El nombre es requerido" })
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder los 100 caracteres"),
  price: z.coerce
    .number({ required_error: "El precio es requerido" })
    .positive("El precio debe ser un número positivo")
    .refine((val) => {
      const parts = val.toString().split(".");
      return parts.length === 1 || parts[1].length <= 2;
    }, "El precio puede tener hasta 2 decimales"),
  cost: z.coerce
    .number({ required_error: "El costo es requerido" })
    .nonnegative("El costo debe ser mayor o igual a 0")
    .refine((val) => {
      const parts = val.toString().split(".");
      return parts.length === 1 || parts[1].length <= 2;
    }, "El costo puede tener hasta 2 decimales"),
  minStock: z.coerce
    .number()
    .int("El stock mínimo debe ser un número entero")
    .nonnegative("El stock mínimo debe ser mayor o igual a 0")
    .default(0),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
