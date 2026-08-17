import { z } from "zod";

export const listMovementsSchema = z.object({
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
});

export type ListMovementsDto = z.infer<typeof listMovementsSchema>;
