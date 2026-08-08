import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";

async function main() {
  await prisma.$connect();
  console.log("✅ Conectado a la base de datos");

  app.listen(env.PORT, () => {
    console.log(`🚀 Servidor escuchando en http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  console.error("❌ Error al iniciar el servidor:", err);
  process.exit(1);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
