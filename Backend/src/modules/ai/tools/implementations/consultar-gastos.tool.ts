import { z } from "zod";
import { prisma } from "../../../../config/prisma";
import { ToolDefinition } from "../../providers/ai.provider.interface";

const schema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().optional().default(30),
});

export const consultarGastosToolDefinition: ToolDefinition = {
  type: "function",
  function: {
    name: "consultar_gastos",
    description: "Consulta los gastos operativos registrados por el emprendedor en un periodo de fechas o los más recientes. Retorna el total gastado y el detalle de cada gasto (concepto, monto y fecha).",
    parameters: {
      type: "object",
      properties: {
        from: { type: "string", description: "Fecha inicial en formato ISO 8601 (opcional, por defecto inicio del mes actual)" },
        to: { type: "string", description: "Fecha final en formato ISO 8601 (opcional, por defecto fecha y hora actual)" },
        limit: { type: "number", description: "Límite de registros a retornar (por defecto 30)" },
      },
      required: [],
    },
  },
};

export async function executeConsultarGastos(userId: string, args: any) {
  const parsed = schema.parse(args || {});

  const now = new Date();
  const fromDate = parsed.from ? new Date(parsed.from) : new Date(now.getFullYear(), now.getMonth(), 1);
  const toDate = parsed.to ? new Date(parsed.to) : now;

  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      expenseDate: {
        gte: fromDate,
        lte: toDate,
      },
    },
    orderBy: { expenseDate: "desc" },
    take: parsed.limit,
  });

  const total = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

  return {
    periodo: {
      desde: fromDate.toISOString(),
      hasta: toDate.toISOString(),
    },
    totalGastos: total,
    cantidadRegistros: expenses.length,
    gastos: expenses.map((e) => ({
      id: e.id,
      concepto: e.concept,
      monto: Number(e.amount),
      fecha: e.expenseDate.toISOString(),
    })),
  };
}
