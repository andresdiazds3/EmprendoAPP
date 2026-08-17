import { z } from "zod";

export const listProductsSchema = z.object({
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
  search: z.string().optional(),
  lowStock: z.preprocess(
    (val) => val === "true" || val === "1" || val === true,
    z.boolean()
  ).optional(),
  trash: z.preprocess(
    (val) => val === "true" || val === "1" || val === true,
    z.boolean()
  ).optional(),
});

export type ListProductsDto = z.infer<typeof listProductsSchema>;
