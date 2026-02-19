import { supabase } from "../lib/supabase.js";
import { withRetry } from "../lib/retry.js";

export async function getIngestionBySha(sha256: string) {
  const { data, error } = await withRetry(async () =>
    await supabase.from("fdd_ingestions").select("*").eq("sha256", sha256).maybeSingle()
  );
  if (error) throw error;
  return data;
}

export async function upsertIngestion(row: Record<string, unknown>) {
  const { error } = await withRetry(async () =>
    await supabase.from("fdd_ingestions").upsert(row, { onConflict: "sha256" })
  );
  if (error) throw error;
}

export async function insertBrand(row: Record<string, unknown>) {
  const { error } = await withRetry(async () => await supabase.from("fdd_brands").insert(row));
  if (error) throw error;
}

export async function insertRoyalty(row: Record<string, unknown>) {
  const { error } = await withRetry(async () => await supabase.from("fdd_royalty_data").insert(row));
  if (error) throw error;
}

export async function insertFinancials(row: Record<string, unknown>) {
  const { error } = await withRetry(async () => await supabase.from("fdd_financials_data").insert(row));
  if (error) throw error;
}

export async function insertLocations(row: Record<string, unknown>) {
  const { error } = await withRetry(async () => await supabase.from("fdd_locations_data").insert(row));
  if (error) throw error;
}

export async function insertFranchiseeLocations(rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const { error } = await withRetry(async () =>
    await supabase.from("fdd_franchisee_locations").upsert(rows, { onConflict: "row_hash" })
  );
  if (error) throw error;
}
