import { z } from "zod";
import { baseReportQuerySchema } from "./report-query.dto";

export const periodQuerySchema = baseReportQuerySchema
  .extend({
    groupBy: z.enum(["day", "month", "year"]).default("day"),
  })
  .refine(
    (data) => new Date(data.to) >= new Date(data.from),
    {
      message: "La fecha 'hasta' (to) debe ser posterior o igual a la fecha 'desde' (from)",
      path: ["to"],
    }
  );

export type PeriodQueryDto = z.infer<typeof periodQuerySchema>;
