import { reportsRepository } from "./reports.repository";
import { ReportQueryDto } from "./dtos/report-query.dto";
import { PeriodQueryDto } from "./dtos/period-query.dto";
import { TopProductsQueryDto } from "./dtos/top-products-query.dto";
import ExcelJS from "exceljs";

export class ReportsService {
  // Retorna el resumen consolidado de utilidades
  async getUtilidad(userId: string, dto: ReportQueryDto) {
    const fromDate = new Date(dto.from);
    const toDate = new Date(dto.to);
    const data = await reportsRepository.getUtilidad(userId, fromDate, toDate);
    const utilidad = data.ingresos - data.costoVenta - data.gastos;
    return {
      ...data,
      utilidad,
      from: dto.from,
      to: dto.to,
    };
  }

  // Retorna ventas por periodo
  async getVentasPorPeriodo(userId: string, dto: PeriodQueryDto) {
    const fromDate = new Date(dto.from);
    const toDate = new Date(dto.to);
    return reportsRepository.getVentasPorPeriodo(userId, dto.groupBy, fromDate, toDate);
  }

  // Retorna gastos por periodo
  async getGastosPorPeriodo(userId: string, dto: PeriodQueryDto) {
    const fromDate = new Date(dto.from);
    const toDate = new Date(dto.to);
    return reportsRepository.getGastosPorPeriodo(userId, dto.groupBy, fromDate, toDate);
  }

  // Retorna el top de productos más vendidos
  async getTopProductos(userId: string, dto: TopProductsQueryDto) {
    const fromDate = new Date(dto.from);
    const toDate = new Date(dto.to);
    return reportsRepository.getTopProductos(userId, fromDate, toDate, dto.limit, dto.orderBy);
  }

  // Combina ventas y gastos agrupados en una sola serie comparativa temporal
  async getComparativo(userId: string, dto: PeriodQueryDto) {
    const sales = await this.getVentasPorPeriodo(userId, dto);
    const expenses = await this.getGastosPorPeriodo(userId, dto);

    const merged = new Map<number, { period: Date; ventas: number; gastos: number }>();

    for (const s of sales) {
      const time = s.period.getTime();
      merged.set(time, { period: s.period, ventas: s.total, gastos: 0 });
    }

    for (const e of expenses) {
      const time = e.period.getTime();
      const existing = merged.get(time);
      if (existing) {
        existing.gastos = e.total;
      } else {
        merged.set(time, { period: e.period, ventas: 0, gastos: e.total });
      }
    }

    // Utilidad del comparativo es una aproximación simple (ventas - gastos, sin costo de venta)
    return Array.from(merged.values())
      .map((item) => ({
        period: item.period,
        ventas: item.ventas,
        gastos: item.gastos,
        utilidad: item.ventas - item.gastos,
      }))
      .sort((a, b) => a.period.getTime() - b.period.getTime());
  }

  // Genera un archivo Excel consolidado de 4 hojas de reporte
  async exportToExcel(userId: string, dto: ReportQueryDto) {
    const workbook = new ExcelJS.Workbook();

    // 1. Hoja "Resumen"
    const resumenSheet = workbook.addWorksheet("Resumen");
    resumenSheet.columns = [
      { header: "Concepto", key: "concepto", width: 25 },
      { header: "Valor", key: "valor", width: 20 },
    ];
    resumenSheet.getRow(1).font = { bold: true };
    
    const { ingresos, costoVenta, gastos, utilidad } = await this.getUtilidad(userId, dto);
    resumenSheet.addRow({ concepto: "Ingresos", valor: ingresos });
    resumenSheet.addRow({ concepto: "Costo de Venta", valor: costoVenta });
    resumenSheet.addRow({ concepto: "Gastos", valor: gastos });
    resumenSheet.addRow({ concepto: "Utilidad Neta", valor: utilidad });
    
    resumenSheet.getColumn("valor").numFmt = "#,##0.00";

    // 2. Hoja "Ventas por periodo"
    const ventasSheet = workbook.addWorksheet("Ventas por periodo");
    ventasSheet.columns = [
      { header: "Periodo", key: "periodo", width: 25 },
      { header: "Total Ventas", key: "total", width: 20 },
    ];
    ventasSheet.getRow(1).font = { bold: true };
    
    const ventas = await this.getVentasPorPeriodo(userId, { ...dto, groupBy: "day" });
    for (const v of ventas) {
      ventasSheet.addRow({
        periodo: v.period.toLocaleDateString("es-ES"),
        total: v.total,
      });
    }
    ventasSheet.getColumn("total").numFmt = "#,##0.00";

    // 3. Hoja "Top Productos"
    const topSheet = workbook.addWorksheet("Top Productos");
    topSheet.columns = [
      { header: "Producto", key: "producto", width: 35 },
      { header: "Cantidad Vendida", key: "cantidad", width: 20 },
      { header: "Ingresos", key: "ingresos", width: 20 },
    ];
    topSheet.getRow(1).font = { bold: true };
    
    const topProducts = await this.getTopProductos(userId, { ...dto, limit: 20, orderBy: "revenue" });
    for (const tp of topProducts) {
      topSheet.addRow({
        producto: tp.productName,
        cantidad: tp.totalQuantity,
        ingresos: tp.totalRevenue,
      });
    }
    topSheet.getColumn("ingresos").numFmt = "#,##0.00";

    // 4. Hoja "Gastos por periodo"
    const gastosSheet = workbook.addWorksheet("Gastos por periodo");
    gastosSheet.columns = [
      { header: "Periodo", key: "periodo", width: 25 },
      { header: "Total Gastos", key: "total", width: 20 },
    ];
    gastosSheet.getRow(1).font = { bold: true };
    
    const gastosList = await this.getGastosPorPeriodo(userId, { ...dto, groupBy: "day" });
    for (const g of gastosList) {
      gastosSheet.addRow({
        periodo: g.period.toLocaleDateString("es-ES"),
        total: g.total,
      });
    }
    gastosSheet.getColumn("total").numFmt = "#,##0.00";

    return workbook.xlsx.writeBuffer();
  }
}

export const reportsService = new ReportsService();
