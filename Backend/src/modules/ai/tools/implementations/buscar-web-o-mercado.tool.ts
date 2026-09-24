import { z } from "zod";
import { ToolDefinition } from "../../providers/ai.provider.interface";

const schema = z.object({
  query: z.string().min(2, "La consulta debe tener al menos 2 caracteres"),
});

export const buscarWebOMercadoToolDefinition: ToolDefinition = {
  type: "function",
  function: {
    name: "buscar_web_o_mercado",
    description: "Busca en la web información de mercado, tendencias de precios, competencia, proveedores, estrategias de venta, insumos y conceptos de negocio para ayudar y asesorar al emprendedor con datos actualizados.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Consulta o término a buscar en la web (ej. 'precios de referencia jabones artesanales colombia', 'tendencias de empaques ecologicos 2026', 'estrategias de marketing para pasteleria')",
        },
      },
      required: ["query"],
    },
  },
};

interface SearchResult {
  title: string;
  snippet: string;
  url?: string;
}

// Búsqueda en DuckDuckGo Instant Answer API
async function searchDuckDuckGoApi(query: string): Promise<SearchResult[]> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) return [];

  const data: any = await response.json();
  const results: SearchResult[] = [];

  if (data.AbstractText) {
    results.push({
      title: data.Heading || query,
      snippet: data.AbstractText,
      url: data.AbstractURL,
    });
  }

  if (Array.isArray(data.RelatedTopics)) {
    for (const topic of data.RelatedTopics.slice(0, 5)) {
      if (topic.Text) {
        results.push({
          title: topic.FirstURL ? topic.FirstURL.split("/").pop()?.replace(/_/g, " ") || query : query,
          snippet: topic.Text,
          url: topic.FirstURL,
        });
      } else if (Array.isArray(topic.Topics)) {
        for (const sub of topic.Topics.slice(0, 3)) {
          if (sub.Text) {
            results.push({
              title: sub.FirstURL ? sub.FirstURL.split("/").pop()?.replace(/_/g, " ") || query : query,
              snippet: sub.Text,
              url: sub.FirstURL,
            });
          }
        }
      }
    }
  }

  return results;
}

// Búsqueda en DuckDuckGo HTML / Lite
async function searchDuckDuckGoHtml(query: string): Promise<SearchResult[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `q=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(6000),
  });

  if (!response.ok) return [];

  const html = await response.text();
  const results: SearchResult[] = [];

  // Extraer resultados usando regex simple sobre HTML
  const resultRegex = /<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
  const titleRegex = /<a[^>]+class="result__url"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

  const snippets: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = resultRegex.exec(html)) !== null) {
    const cleanSnippet = match[1].replace(/<[^>]+>/g, "").trim();
    if (cleanSnippet) snippets.push(cleanSnippet);
  }

  const titles: { title: string; url: string }[] = [];
  while ((match = titleRegex.exec(html)) !== null) {
    const rawUrl = match[1].trim();
    const cleanTitle = match[2].replace(/<[^>]+>/g, "").trim();
    titles.push({ title: cleanTitle || query, url: rawUrl });
  }

  for (let i = 0; i < Math.min(snippets.length, 5); i++) {
    results.push({
      title: titles[i]?.title || `Resultado ${i + 1}`,
      snippet: snippets[i],
      url: titles[i]?.url,
    });
  }

  return results;
}

// Búsqueda en Wikipedia en Español como soporte enciclopédico/mercado
async function searchWikipediaEs(query: string): Promise<SearchResult[]> {
  const url = `https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "EmprendoApp/1.0 (info@emprendo.app)",
    },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) return [];

  const data: any = await response.json();
  const searchItems = data?.query?.search || [];
  return searchItems.slice(0, 4).map((item: any) => ({
    title: item.title,
    snippet: item.snippet?.replace(/<[^>]+>/g, ""),
    url: `https://es.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
  }));
}

export async function executeBuscarWebOMercado(userId: string, args: any) {
  const parsed = schema.parse(args);
  const query = parsed.query.trim();

  let results: SearchResult[] = [];

  try {
    // 1. Intentar DuckDuckGo HTML
    results = await searchDuckDuckGoHtml(query);
  } catch (err) {
    console.warn("Fallo búsqueda DDG HTML, intentando alternativas...", err);
  }

  if (results.length === 0) {
    try {
      // 2. Intentar DuckDuckGo API
      results = await searchDuckDuckGoApi(query);
    } catch (err) {
      console.warn("Fallo búsqueda DDG API...", err);
    }
  }

  if (results.length === 0) {
    try {
      // 3. Intentar Wikipedia
      results = await searchWikipediaEs(query);
    } catch (err) {
      console.warn("Fallo búsqueda Wikipedia...", err);
    }
  }

  if (results.length === 0) {
    return {
      query,
      encontrado: false,
      mensaje: "No se pudieron obtener resultados directos de la web en este momento. Utiliza tu conocimiento base de negocios para responder.",
    };
  }

  return {
    query,
    encontrado: true,
    totalResultados: results.length,
    resultados: results.map((r) => ({
      titulo: r.title,
      resumen: r.snippet,
      enlace: r.url,
    })),
  };
}
