import { expensesRepository } from "./expenses.repository";
import { CreateExpenseDto } from "./dtos/create-expense.dto";
import { UpdateExpenseDto } from "./dtos/update-expense.dto";
import { ListExpensesDto } from "./dtos/list-expenses.dto";
import { NotFoundError } from "../../core/errors";
import { buildPaginatedResult } from "../../shared/utils/pagination";

export class ExpensesService {
  // Crea un nuevo registro de gasto
  async create(userId: string, dto: CreateExpenseDto) {
    return expensesRepository.create(userId, dto);
  }

  // Lista y pagina los gastos del usuario
  async list(userId: string, query: ListExpensesDto) {
    const { items, total, page, pageSize } = await expensesRepository.findMany(userId, query);
    return buildPaginatedResult(items, total, page, pageSize);
  }

  // Obtiene un gasto por ID, validando pertenencia
  async getById(userId: string, expenseId: string) {
    const expense = await expensesRepository.findById(userId, expenseId);
    if (!expense) {
      throw new NotFoundError("Gasto");
    }
    return expense;
  }

  // Actualiza un gasto validando pertenencia
  async update(userId: string, expenseId: string, dto: UpdateExpenseDto) {
    await this.getById(userId, expenseId);
    return expensesRepository.update(expenseId, dto);
  }

  // Elimina físicamente un gasto validando pertenencia
  async delete(userId: string, expenseId: string) {
    await this.getById(userId, expenseId);
    return expensesRepository.delete(expenseId);
  }
}

export const expensesService = new ExpensesService();
