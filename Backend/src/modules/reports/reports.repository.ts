import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";

export class ReportsRepository {
  // Obtiene los ingresos, costo de venta y gastos consolidados en un rango de fechas
  async getUtilidad(userId: string, from: Date, to: Date) {
    const res = await prisma.$queryRaw<[{ ingresos: any; costoVenta: any; gastos: any }]>`
      SELECT 
        (SELECT COALESCE(SUM("total"), 0) FROM "sales" WHERE "userId" = ${userId} AND "saleDate" >= ${from} AND "saleDate" <= ${to}) as "ingresos",
        (SELECT COALESCE(SUM(si."unitCost" * si."quantity"), 0) FROM "sale_items" si INNER JOIN "sales" s ON si."saleId" = s."id" WHERE s."userId" = ${userId} AND s."saleDate" >= ${from} AND s."saleDate" <= ${to}) as "costoVenta",
        (SELECT COALESCE(SUM("amount"), 0) FROM "expenses" WHERE "userId" = ${userId} AND "expenseDate" >= ${from} AND "expenseDate" <= ${to}) as "gastos"
    `;

    const row = res[0];
    return {
      ingresos: row?.ingresos ? Number(row.ingresos) : 0,
      costoVenta: row?.costoVenta ? Number(row.costoVenta) : 0,
      gastos: row?.gastos ? Number(row.gastos) : 0,
    };
  }

  // Agrupa ventas por periodo (day/month/year)
  async getVentasPorPeriodo(userId: string, groupBy: "day" | "month" | "year", from: Date, to: Date) {
    const sqlGroupBy = groupBy === "month" ? "month" : groupBy === "year" ? "year" : "day";
    
    const result = await prisma.$queryRaw<any[]>`
      SELECT DATE_TRUNC(${Prisma.raw(`'${sqlGroupBy}'`)}, "saleDate") AS "period", SUM("total")::numeric AS "total"
      FROM "sales"
      WHERE "userId" = ${userId}
        AND "saleDate" >= ${from}
        AND "saleDate" <= ${to}
      GROUP BY "period"
      ORDER BY "period" ASC
    `;

    return result.map((r) => ({
      period: r.period instanceof Date ? r.period : new Date(r.period),
      total: r.total ? Number(r.total) : 0,
    }));
  }

  // Agrupa gastos por periodo (day/month/year)
  async getGastosPorPeriodo(userId: string, groupBy: "day" | "month" | "year", from: Date, to: Date) {
    const sqlGroupBy = groupBy === "month" ? "month" : groupBy === "year" ? "year" : "day";
    
    const result = await prisma.$queryRaw<any[]>`
      SELECT DATE_TRUNC(${Prisma.raw(`'${sqlGroupBy}'`)}, "expenseDate") AS "period", SUM("amount")::numeric AS "total"
      FROM "expenses"
      WHERE "userId" = ${userId}
        AND "expenseDate" >= ${from}
        AND "expenseDate" <= ${to}
      GROUP BY "period"
      ORDER BY "period" ASC
    `;

    return result.map((r) => ({
      period: r.period instanceof Date ? r.period : new Date(r.period),
      total: r.total ? Number(r.total) : 0,
    }));
  }

  // Obtiene el top de productos más vendidos ordenados por cantidad o ingresos
  async getTopProductos(userId: string, from: Date, to: Date, limit: number, orderBy: "quantity" | "revenue") {
    const sqlOrder = orderBy === "quantity" ? '"totalQuantity"' : '"totalRevenue"';

    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        si."productId" AS "productId",
        p."name" AS "productName",
        SUM(si."quantity")::integer AS "totalQuantity",
        SUM(si."unitPrice" * si."quantity")::numeric AS "totalRevenue"
      FROM "sale_items" si
      INNER JOIN "sales" s ON si."saleId" = s."id"
      INNER JOIN "products" p ON si."productId" = p."id"
      WHERE s."userId" = ${userId}
        AND s."saleDate" >= ${from}
        AND s."saleDate" <= ${to}
      GROUP BY si."productId", p."name"
      ORDER BY ${Prisma.raw(sqlOrder)} DESC
      LIMIT ${limit}
    `;

    return result.map((r) => ({
      productId: r.productId as string,
      productName: r.productName as string,
      totalQuantity: r.totalQuantity ? Number(r.totalQuantity) : 0,
      totalRevenue: r.totalRevenue ? Number(r.totalRevenue) : 0,
    }));
  }
}

export const reportsRepository = new ReportsRepository();
