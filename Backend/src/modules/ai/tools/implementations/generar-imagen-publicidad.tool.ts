import { z } from "zod";
import { prisma } from "../../../../config/prisma";
import { env } from "../../../../config/env";
import { ToolDefinition } from "../../providers/ai.provider.interface";

const schema = z.object({
  nombreProducto: z.string().optional(),
  prompt: z.string().min(3, "El prompt descriptivo de la imagen es requerido"),
  estilo: z.enum(["fotografico", "publicitario", "minimalista", "ilustracion", "redes_sociales"]).optional().default("publicitario"),
  formato: z.enum(["cuadrado", "vertical", "horizontal"]).optional().default("cuadrado"),
  forzarGeneracionIA: z.boolean().optional().default(false),
});

export const generarImagenPublicidadToolDefinition: ToolDefinition = {
  type: "function",
  function: {
    name: "generar_imagen_publicidad_o_redes",
    description: "Crea el visual publicitario o contenido gráfico para anuncios y redes sociales. Si el producto ya tiene una foto real subida por el emprendedor, utiliza su foto original. Si no tiene foto o se requiere una nueva creatividad, genera una imagen publicitaria profesional de alta definición.",
    parameters: {
      type: "object",
      properties: {
        nombreProducto: {
          type: "string",
          description: "Nombre del producto del cliente a promocionar (opcional, para usar su foto real si existe)",
        },
        prompt: {
          type: "string",
          description: "Descripción visual del anuncio o producto en inglés o español. Ejemplo: 'Luxury packaging of lavender handmade soap with organic flowers in a warm wooden background, professional commercial lighting'",
        },
        estilo: {
          type: "string",
          enum: ["fotografico", "publicitario", "minimalista", "ilustracion", "redes_sociales"],
          description: "Estilo visual deseado",
        },
        formato: {
          type: "string",
          enum: ["cuadrado", "vertical", "horizontal"],
          description: "Formato: cuadrado (1:1 feed), vertical (9:16 stories/reels/tiktok), horizontal (16:9 banner)",
        },
        forzarGeneracionIA: {
          type: "boolean",
          description: "Si es true, genera una imagen nueva con IA en vez de usar la foto existente del producto (opcional)",
        },
      },
      required: ["prompt"],
    },
  },
};

export async function executeGenerarImagenPublicidad(userId: string, args: any) {
  const parsed = schema.parse(args);
  const alt = parsed.nombreProducto ? `Anuncio publicitario de ${parsed.nombreProducto}` : "Anuncio publicitario";

  // 1. Si se especificó un producto y no se fuerza generación nueva, revisar si tiene foto real
  if (parsed.nombreProducto && !parsed.forzarGeneracionIA) {
    const product = await prisma.product.findFirst({
      where: {
        userId,
        deletedAt: null,
        name: {
          contains: parsed.nombreProducto.trim(),
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
      },
    });

    if (product && product.imageUrl) {
      const productAlt = `Foto de ${product.name}`;
      return {
        exito: true,
        esFotoRealProducto: true,
        nombreProducto: product.name,
        url: product.imageUrl,
        markdownImage: `![${productAlt}](${product.imageUrl})`,
        instrucciones: `Muestra la foto real del producto en tu respuesta usando la sintaxis de markdown: ![${productAlt}](${product.imageUrl}). No muestres la URL suelta en texto.`,
      };
    }
  }

  // Dimensiones según formato
  let width = 1024;
  let height = 1024;
  let imagen3AspectRatio = "1:1";

  if (parsed.formato === "vertical") {
    width = 768;
    height = 1344;
    imagen3AspectRatio = "9:16";
  } else if (parsed.formato === "horizontal") {
    width = 1280;
    height = 720;
    imagen3AspectRatio = "16:9";
  }

  const enhancedPrompt = `Professional commercial product advertisement, ${parsed.prompt}, studio lighting, high-end marketing aesthetic, photorealistic, sharp focus, 8k resolution, award winning advertising photography, clean composition`;

  // 2. Intentar generar con Google Imagen 3 si hay GEMINI_API_KEY configurada
  if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${env.GEMINI_API_KEY.trim()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instances: [{ prompt: enhancedPrompt }],
            parameters: {
              sampleCount: 1,
              aspectRatio: imagen3AspectRatio,
              personGeneration: "allow_adult",
            },
          }),
          signal: AbortSignal.timeout(10000),
        }
      );

      if (response.ok) {
        const data: any = await response.json();
        const firstPred = data?.predictions?.[0];
        if (firstPred?.bytesBase64Encoded) {
          const mime = firstPred.mimeType || "image/jpeg";
          const dataUrl = `data:${mime};base64,${firstPred.bytesBase64Encoded}`;
          return {
            exito: true,
            esFotoRealProducto: false,
            proveedor: "Google Imagen 3",
            url: dataUrl,
            markdownImage: `![${alt}](${dataUrl})`,
            instrucciones: `Muestra la imagen generada usando la sintaxis de markdown: ![${alt}](${dataUrl}). NUNCA muestres la URL en texto plano.`,
          };
        }
      }
    } catch (err) {
      console.warn("Imagen 3 no disponible o límite alcanzado, usando fallback...", err);
    }
  }

  // 3. Fallback con Flux ultra HD
  const seed = Math.floor(Math.random() * 900000) + 100000;
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${width}&height=${height}&model=flux&seed=${seed}&nologo=true`;

  return {
    exito: true,
    esFotoRealProducto: false,
    proveedor: "Flux High Quality",
    url: imageUrl,
    markdownImage: `![${alt}](${imageUrl})`,
    instrucciones: `Muestra la imagen generada usando la sintaxis de markdown exactamente: ![${alt}](${imageUrl}). NUNCA muestres la URL en texto plano ni enlaces largos.`,
  };
}
