import { PrismaClient, StockMovementType } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  const passwordHash = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@emprendedor.com" },
    update: {},
    create: {
      email: "demo@emprendedor.com",
      passwordHash,
      name: "Emprendedor Demo",
    },
  });

  const product1 = await prisma.product.create({
    data: {
      userId: user.id,
      name: "Camiseta básica",
      price: 45000,
      cost: 22000,
      stock: 0,
      minStock: 5,
    },
  });

  const product2 = await prisma.product.create({
    data: {
      userId: user.id,
      name: "Gorra bordada",
      price: 35000,
      cost: 15000,
      stock: 0,
      minStock: 3,
    },
  });

  // Entradas de inventario (restock) — actualiza stock cacheado igual que hará el service real
  await prisma.$transaction([
    prisma.stockMovement.create({
      data: { userId: user.id, productId: product1.id, type: StockMovementType.RESTOCK, quantity: 20 },
    }),
    prisma.product.update({ where: { id: product1.id }, data: { stock: { increment: 20 } } }),
    prisma.stockMovement.create({
      data: { userId: user.id, productId: product2.id, type: StockMovementType.RESTOCK, quantity: 15 },
    }),
    prisma.product.update({ where: { id: product2.id }, data: { stock: { increment: 15 } } }),
  ]);

  // Una venta con dos líneas de detalle
  const sale = await prisma.sale.create({
    data: {
      userId: user.id,
      total: 45000 + 35000,
      items: {
        create: [
          { productId: product1.id, quantity: 1, unitPrice: 45000, unitCost: 22000 },
          { productId: product2.id, quantity: 1, unitPrice: 35000, unitCost: 15000 },
        ],
      },
    },
    include: { items: true },
  });

  for (const item of sale.items) {
    await prisma.stockMovement.create({
      data: {
        userId: user.id,
        productId: item.productId,
        type: StockMovementType.SALE,
        quantity: -item.quantity,
        saleItemId: item.id,
      },
    });
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }

  await prisma.expense.create({
    data: {
      userId: user.id,
      concept: "Arriendo local",
      amount: 500000,
      expenseDate: new Date(),
    },
  });

  const chatSession = await prisma.chatSession.create({
    data: { userId: user.id, title: "Primera conversación" },
  });

  await prisma.chatMessage.create({
    data: {
      sessionId: chatSession.id,
      role: "USER",
      content: "¿Cuánto vendí hoy?",
    },
  });

  console.log("✅ Seed completado. Usuario demo: demo@emprendedor.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
