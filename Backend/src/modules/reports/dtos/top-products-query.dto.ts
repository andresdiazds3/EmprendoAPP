import { z } from "zod";
import { baseReportQuerySchema } from "./report-query.dto";

export const topProductsQuerySchema = baseReportQuerySchema
  .extend({
    limit: z.coerce
      .number()
      .int("El límite debe ser un número entero")
      .positive("El límite debe ser positivo")
      .max(50, "El límite máximo es 50")
      .default(10),
    orderBy: z.enum(["quantity", "revenue"]).default("revenue"),
  })
  .refine(
    (data) => new Date(data.to) >= new Date(data.from),
    {
      message: "La fecha 'hasta' (to) debe ser posterior o igual a la fecha 'desde' (from)",
      path: ["to"],
    }
  );

export type TopProductsQueryDto = z.infer<typeof topProductsQuerySchema>;
