import OpenAI from "openai";
import { env } from "../config/env.js";
import { withRetry } from "./retry.js";

export const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export async function callStructured<T>(args: {
  model: string;
  name: string;
  schema: Record<string, unknown>;
  system: string;
  user: string;
}): Promise<T> {
  const res = await withRetry(() =>
    openai.chat.completions.create({
      model: args.model,
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: args.user }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: args.name,
          schema: args.schema,
          strict: true
        }
      }
    })
  );

  const content = res.choices[0]?.message?.content ?? "{}";
  return JSON.parse(content) as T;
}