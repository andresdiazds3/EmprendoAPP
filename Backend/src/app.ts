import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./core/middlewares/error-handler.middleware";
import { rateLimiter } from "./core/middlewares/rate-limiter.middleware";

import { authRoutes } from "./modules/auth/auth.routes";
import { productsRoutes } from "./modules/products/products.routes";
import { inventoryRoutes } from "./modules/inventory/inventory.routes";
import { salesRoutes } from "./modules/sales/sales.routes";
import { expensesRoutes } from "./modules/expenses/expenses.routes";
import { reportsRoutes } from "./modules/reports/reports.routes";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(rateLimiter);

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "API activa", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/reports", reportsRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Ruta no encontrada: ${req.originalUrl}` });
});

app.use(errorHandler);
