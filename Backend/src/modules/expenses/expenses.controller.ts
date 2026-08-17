import { Response } from "express";
import { expensesService } from "./expenses.service";
import { createExpenseSchema } from "./dtos/create-expense.dto";
import { updateExpenseSchema } from "./dtos/update-expense.dto";
import { listExpensesSchema } from "./dtos/list-expenses.dto";
import { created, ok, noContent } from "../../shared/utils/http-response";
import { AuthenticatedRequest } from "../../core/types";

export class ExpensesController {
  // Crea un gasto
  async create(req: AuthenticatedRequest, res: Response) {
    const validatedData = createExpenseSchema.parse(req.body);
    const userId = req.user!.id;
    const result = await expensesService.create(userId, validatedData);
    return created(res, result, "Gasto registrado exitosamente");
  }

  // Lista los gastos paginados y filtrados
  async list(req: AuthenticatedRequest, res: Response) {
    const validatedQuery = listExpensesSchema.parse(req.query);
    const userId = req.user!.id;
    const result = await expensesService.list(userId, validatedQuery);
    return ok(res, result, "Gastos obtenidos exitosamente");
  }

  // Obtiene un gasto por ID
  async getById(req: AuthenticatedRequest, res: Response) {
    const expenseId = req.params.id;
    const userId = req.user!.id;
    const result = await expensesService.getById(userId, expenseId);
    return ok(res, result, "Gasto obtenido exitosamente");
  }

  // Actualiza un gasto por ID
  async update(req: AuthenticatedRequest, res: Response) {
    const validatedData = updateExpenseSchema.parse(req.body);
    const expenseId = req.params.id;
    const userId = req.user!.id;
    const result = await expensesService.update(userId, expenseId, validatedData);
    return ok(res, result, "Gasto actualizado exitosamente");
  }

  // Elimina físicamente un gasto por ID
  async delete(req: AuthenticatedRequest, res: Response) {
    const expenseId = req.params.id;
    const userId = req.user!.id;
    await expensesService.delete(userId, expenseId);
    return noContent(res);
  }
}

export const expensesController = new ExpensesController();
