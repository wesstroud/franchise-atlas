import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(3000),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL_VALIDATE: z.string().default("gpt-4.1-mini"),
  OPENAI_MODEL_CATEGORY: z.string().default("gpt-4.1-mini"),
  OPENAI_MODEL_EXTRACT: z.string().default("gpt-5.2"),
  FDD_CONFIDENCE_THRESHOLD: z.coerce.number().default(0.7),
  LOG_LEVEL: z.string().default("info")
});

export const env = schema.parse(process.env);