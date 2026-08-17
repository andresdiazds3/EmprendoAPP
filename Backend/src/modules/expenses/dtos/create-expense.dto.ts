import { z } from "zod";

export const createExpenseSchema = z.object({
  concept: z
    .string({ required_error: "El concepto es requerido" })
    .min(2, "El concepto debe tener al menos 2 caracteres")
    .max(150, "El concepto no puede exceder los 150 caracteres"),
  amount: z.coerce
    .number({ required_error: "El monto es requerido" })
    .positive("El monto debe ser un número positivo"),
  expenseDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "La fecha del gasto debe ser válida" })
    .optional(),
});

export type CreateExpenseDto = z.infer<typeof createExpenseSchema>;
