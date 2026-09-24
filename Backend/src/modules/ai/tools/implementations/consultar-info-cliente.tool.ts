import { prisma } from "../../../../config/prisma";
import { ToolDefinition } from "../../providers/ai.provider.interface";

export const consultarInfoClienteToolDefinition: ToolDefinition = {
  type: "function",
  function: {
    name: "consultar_info_cliente",
    description: "Consulta los datos de la cuenta y perfil del emprendedor (nombre, email, fecha de registro) junto con el conteo general de productos, ventas y gastos registrados en su negocio.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
};

export async function executeConsultarInfoCliente(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      profilePictureUrl: true,
      createdAt: true,
    },
  });

  if (!user) {
    return { error: "Usuario no encontrado" };
  }

  const [totalProductosActivos, totalVentas, totalGastos] = await Promise.all([
    prisma.product.count({
      where: { userId, deletedAt: null },
    }),
    prisma.sale.count({
      where: { userId },
    }),
    prisma.expense.count({
      where: { userId },
    }),
  ]);

  return {
    nombre: user.name,
    email: user.email,
    tieneFotoPerfil: !!user.profilePictureUrl,
    fechaRegistro: user.createdAt.toISOString(),
    totalesRegistrados: {
      productosActivos: totalProductosActivos,
      ventasRealizadas: totalVentas,
      gastosRegistrados: totalGastos,
    },
  };
}
