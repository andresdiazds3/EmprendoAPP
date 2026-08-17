import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { CreateExpenseDto } from "./dtos/create-expense.dto";
import { UpdateExpenseDto } from "./dtos/update-expense.dto";
import { ListExpensesDto } from "./dtos/list-expenses.dto";
import { getPaginationArgs } from "../../shared/utils/pagination";

export class ExpensesRepository {
  // Crea un nuevo registro de gasto
  async create(userId: string, data: CreateExpenseDto) {
    return prisma.expense.create({
      data: {
        concept: data.concept,
        amount: new Prisma.Decimal(data.amount),
        expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(),
        userId,
      },
    });
  }

  // Lista y filtra los gastos de un usuario con paginación
  async findMany(userId: string, filters: ListExpensesDto) {
    const { skip, take, page, pageSize } = getPaginationArgs({
      page: filters.page,
      pageSize: filters.pageSize,
    });

    const where: Prisma.ExpenseWhereInput = {
      userId,
    };

    if (filters.from || filters.to) {
      where.expenseDate = {};
      if (filters.from) {
        where.expenseDate.gte = new Date(filters.from);
      }
      if (filters.to) {
        where.expenseDate.lte = new Date(filters.to);
      }
    }

    const [items, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take,
        orderBy: {
          expenseDate: "desc",
        },
      }),
      prisma.expense.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  // Obtiene un gasto por ID
  async findById(userId: string, expenseId: string) {
    return prisma.expense.findFirst({
      where: {
        id: expenseId,
        userId,
      },
    });
  }

  // Actualiza los campos modificables de un gasto
  async update(expenseId: string, data: UpdateExpenseDto) {
    const updateData: Prisma.ExpenseUpdateInput = {};
    if (data.concept !== undefined) updateData.concept = data.concept;
    if (data.amount !== undefined) updateData.amount = new Prisma.Decimal(data.amount);
    if (data.expenseDate !== undefined) updateData.expenseDate = new Date(data.expenseDate);

    return prisma.expense.update({
      where: { id: expenseId },
      data: updateData,
    });
  }

  // Eliminación física de un gasto
  async delete(expenseId: string) {
    return prisma.expense.delete({
      where: { id: expenseId },
    });
  }
}

export const expensesRepository = new ExpensesRepository();
