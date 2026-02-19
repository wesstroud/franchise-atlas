import pdf from "pdf-parse";

export async function extractPdfText(buffer: Buffer): Promise<{ text: string; pageCount: number | null }> {
  const parsed = await pdf(buffer);
  return { text: parsed.text ?? "", pageCount: parsed.numpages ?? null };
}