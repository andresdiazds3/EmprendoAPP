import { z } from "zod";

export const baseReportQuerySchema = z.object({
  from: z
    .string({ required_error: "La fecha 'desde' (from) es requerida" })
    .refine((val) => !isNaN(Date.parse(val)), { message: "La fecha 'desde' (from) debe ser una fecha válida" }),
  to: z
    .string({ required_error: "La fecha 'hasta' (to) es requerida" })
    .refine((val) => !isNaN(Date.parse(val)), { message: "La fecha 'hasta' (to) debe ser una fecha válida" }),
});

export const reportQuerySchema = baseReportQuerySchema.refine(
  (data) => new Date(data.to) >= new Date(data.from),
  {
    message: "La fecha 'hasta' (to) debe ser posterior o igual a la fecha 'desde' (from)",
    path: ["to"],
  }
);

export type ReportQueryDto = z.infer<typeof reportQuerySchema>;
