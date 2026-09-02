import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.string().url(),

  JWT_SECRET: z.string().min(16, "JWT_SECRET debe tener al menos 16 caracteres"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY es requerida"),
  OPENROUTER_MODELS: z.string().default("openai/gpt-oss-20b:free,openrouter/free"),
  AI_MAX_TOOL_ITERATIONS: z.coerce.number().default(5),
  AI_DEFAULT_PROVIDER: z.enum(["openai", "gemini", "groq", "openrouter"]).default("openai"),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),

  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY es requerido"),
  RESEND_FROM_EMAIL: z.string().default("onboarding@resend.dev"),
  PASSWORD_RESET_CODE_EXPIRES_MIN: z.coerce.number().default(15),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Variables de entorno inválidas:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
