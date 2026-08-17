import { z } from "zod";

export const createSaleSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z
          .string({ required_error: "El ID del producto es requerido" })
          .cuid("El ID del producto debe ser un CUID válido"),
        quantity: z
          .number({ required_error: "La cantidad es requerida" })
          .int("La cantidad debe ser un número entero")
          .positive("La cantidad debe ser mayor a cero"),
      })
    )
    .min(1, "Debe incluir al menos un producto en la venta")
    .refine(
      (items) => {
        const ids = items.map((item) => item.productId);
        return new Set(ids).size === ids.length;
      },
      {
        message: "No se permiten productos duplicados en la misma venta",
        path: ["items"],
      }
    ),
});

export type CreateSaleDto = z.infer<typeof createSaleSchema>;
