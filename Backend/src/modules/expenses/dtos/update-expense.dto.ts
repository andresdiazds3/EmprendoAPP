import { z } from "zod";
import { createExpenseSchema } from "./create-expense.dto";

export const updateExpenseSchema = createExpenseSchema.partial();

export type UpdateExpenseDto = z.infer<typeof updateExpenseSchema>;
