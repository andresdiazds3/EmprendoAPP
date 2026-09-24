import { z } from "zod";
import { ToolDefinition } from "../../providers/ai.provider.interface";

const schema = z.object({
  prompt: z.string().min(3, "El prompt descriptivo de la imagen es requerido"),
  estilo: z.enum(["fotografico", "publicitario", "minimalista", "ilustracion", "redes_sociales"]).optional().default("publicitario"),
  formato: z.enum(["cuadrado", "vertical", "horizontal"]).optional().default("cuadrado"),
});

export const generarImagenPublicidadToolDefinition: ToolDefinition = {
  type: "function",
  function: {
    name: "generar_imagen_publicidad_o_redes",
    description: "Genera imágenes publicitarias, mockups de productos, artes gráficos y creatividades visuales para anuncios o publicaciones de redes sociales (Instagram, TikTok, Facebook). Retorna la URL de la imagen generada para que el usuario la visualice directamente en la app.",
    parameters: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Descripción visual detallada de la imagen a generar (en inglés o español) incluyendo producto, iluminación, estilo y ambiente comercial. Ejemplo: 'Professional studio product photography of organic chocolate bars with luxury purple packaging, soft background lighting, high resolution'",
        },
        estilo: {
          type: "string",
          enum: ["fotografico", "publicitario", "minimalista", "ilustracion", "redes_sociales"],
          description: "Estilo visual deseado",
        },
        formato: {
          type: "string",
          enum: ["cuadrado", "vertical", "horizontal"],
          description: "Formato de la imagen: cuadrado (1:1 para feed), vertical (9:16 para stories/reels), horizontal (16:9 para banners)",
        },
      },
      required: ["prompt"],
    },
  },
};

export async function executeGenerarImagenPublicidad(userId: string, args: any) {
  const parsed = schema.parse(args);

  let width = 1024;
  let height = 1024;

  if (parsed.formato === "vertical") {
    width = 768;
    height = 1344; // 9:16 aprox
  } else if (parsed.formato === "horizontal") {
    width = 1280;
    height = 720; // 16:9 aprox
  }

  // Enriquecer el prompt con estilo profesional
  const enhancedPrompt = `${parsed.prompt}, high quality commercial photography, marketing advertisement, vibrant, clean details, 4k`;
  const seed = Math.floor(Math.random() * 1000000);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${width}&height=${height}&model=flux&seed=${seed}&nologo=true`;

  return {
    exito: true,
    url: imageUrl,
    markdownImage: `![${parsed.prompt}](${imageUrl})`,
    instrucciones: "Muestra esta imagen en tu respuesta usando la sintaxis de markdown exactamente: ![" + parsed.prompt.slice(0, 40) + "](" + imageUrl + ")",
  };
}
