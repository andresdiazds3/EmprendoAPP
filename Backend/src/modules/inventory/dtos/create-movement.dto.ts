import { z } from "zod";

export const createMovementSchema = z
  .object({
    productId: z
      .string({ required_error: "El ID de producto es requerido" })
      .cuid("El ID de producto debe ser un CUID válido"),
    type: z.enum(["RESTOCK", "ADJUSTMENT"], {
      errorMap: (issue) => {
        if (issue.code === "invalid_enum_value") {
          return { message: "El tipo de movimiento debe ser RESTOCK o ADJUSTMENT (el tipo SALE está prohibido en este endpoint)" };
        }
        return { message: "Tipo de movimiento inválido" };
      },
    }),
    quantity: z.coerce
      .number({ required_error: "La cantidad es requerida" })
      .int("La cantidad debe ser un número entero")
      .refine((val) => val !== 0, "La cantidad no puede ser cero"),
    reason: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "RESTOCK" && data.quantity <= 0) {
        return false;
      }
      return true;
    },
    {
      message: "La cantidad para un RESTOCK debe ser mayor a cero",
      path: ["quantity"],
    }
  )
  .refine(
    (data) => {
      if (data.type === "ADJUSTMENT" && (!data.reason || data.reason.trim() === "")) {
        return false;
      }
      return true;
    },
    {
      message: "Un ajuste manual (ADJUSTMENT) requiere una justificación (reason)",
      path: ["reason"],
    }
  );

export type CreateMovementDto = z.infer<typeof createMovementSchema>;
