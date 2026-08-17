import { z } from "zod";

export const listSalesSchema = z.object({
  page: z.coerce
    .number()
    .int("La página debe ser un número entero")
    .positive("La página debe ser positiva")
    .default(1),
  pageSize: z.coerce
    .number()
    .int("El tamaño de página debe ser un número entero")
    .positive("El tamaño de página debe ser positivo")
    .default(20),
  from: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "La fecha 'desde' (from) debe ser una fecha válida" })
    .optional(),
  to: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "La fecha 'hasta' (to) debe ser una fecha válida" })
    .optional(),
});

export type ListSalesDto = z.infer<typeof listSalesSchema>;
