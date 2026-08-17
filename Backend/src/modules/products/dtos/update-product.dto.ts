import { z } from "zod";

export const updateProductSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder los 100 caracteres")
    .optional(),
  price: z.coerce
    .number()
    .positive("El precio debe ser un número positivo")
    .refine((val) => {
      const parts = val.toString().split(".");
      return parts.length === 1 || parts[1].length <= 2;
    }, "El precio puede tener hasta 2 decimales")
    .optional(),
  cost: z.coerce
    .number()
    .nonnegative("El costo debe ser mayor o igual a 0")
    .refine((val) => {
      const parts = val.toString().split(".");
      return parts.length === 1 || parts[1].length <= 2;
    }, "El costo puede tener hasta 2 decimales")
    .optional(),
  minStock: z.coerce
    .number()
    .int("El stock mínimo debe ser un número entero")
    .nonnegative("El stock mínimo debe ser mayor o igual a 0")
    .optional(),
});

export type UpdateProductDto = z.infer<typeof updateProductSchema>;
