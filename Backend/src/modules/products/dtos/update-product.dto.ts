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
  imageUrl: z
    .string()
    .url("imageUrl debe ser una URL válida")
    .nullable()
    .optional(),
  imagePublicId: z
    .string()
    .min(1, "imagePublicId no puede estar vacío")
    .nullable()
    .optional(),
}).refine(
  (data) => {
    const hasUrl = data.imageUrl !== undefined;
    const hasPublicId = data.imagePublicId !== undefined;
    if (!hasUrl && !hasPublicId) return true;
    if (hasUrl && hasPublicId) {
      const urlIsNull = data.imageUrl === null;
      const idIsNull = data.imagePublicId === null;
      return urlIsNull === idIsNull;
    }
    return false;
  },
  {
    message: "imageUrl e imagePublicId deben enviarse juntos o ninguno",
    path: ["imageUrl"],
  }
);

export type UpdateProductDto = z.infer<typeof updateProductSchema>;

