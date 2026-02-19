import { z } from "zod";

export const ValidationSchema = z.object({
  is_fdd: z.boolean(),
  brand_name: z.string().nullable(),
  fdd_year: z.number().int().min(1900).max(2100).nullable(),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
  date_source: z.string().nullable(),
  flags: z.array(z.string()).max(8)
});

export const CategorySchema = z.object({
  category: z.enum([
    "Food & Beverage",
    "Health & Wellness",
    "Child Enrichment",
    "Senior Care",
    "Home Services",
    "B2B Services",
    "Automotive",
    "Retail",
    "Hospitality",
    "Property Services",
    "Other"
  ]),
  confidence: z.number().min(0).max(1),
  franchise_name: z.string().optional(),
  evidence: z.array(z.string()).min(2).max(6),
  notes: z.string().optional()
});

export const ValidationJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["is_fdd", "brand_name", "fdd_year", "confidence", "reason", "date_source", "flags"],
  properties: {
    is_fdd: { type: "boolean" },
    brand_name: { type: ["string", "null"] },
    fdd_year: { type: ["integer", "null"], minimum: 1900, maximum: 2100 },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    reason: { type: "string" },
    date_source: { type: ["string", "null"] },
    flags: { type: "array", items: { type: "string" }, maxItems: 8 }
  }
} as const;

export const CategoryJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["category", "confidence", "evidence"],
  properties: {
    category: {
      type: "string",
      enum: [
        "Food & Beverage",
        "Health & Wellness",
        "Child Enrichment",
        "Senior Care",
        "Home Services",
        "B2B Services",
        "Automotive",
        "Retail",
        "Hospitality",
        "Property Services",
        "Other"
      ]
    },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    franchise_name: { type: "string" },
    evidence: {
      type: "array",
      minItems: 2,
      maxItems: 6,
      items: { type: "string" }
    },
    notes: { type: "string" }
  }
} as const;

export const RoyaltyJsonSchema = {
  type: "object",
  properties: {
    brand: { type: "string" },
    year: { type: ["number", "string"] },
    startup_cost_low: { type: ["number", "null"] },
    startup_cost_high: { type: ["number", "null"] },
    royalty_percent: { type: ["number", "null"] },
    royalty_minimum_monthly: { type: ["number", "null"] },
    brand_fund_percent: { type: ["number", "null"] },
    alternate_royalty_structures: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          royalty_percent: { type: ["number", "null"] },
          royalty_minimum_monthly: { type: ["number", "null"] },
          timeframe: { type: ["string", "null"] },
          notes: { type: ["string", "null"] }
        },
        required: ["name", "royalty_percent", "royalty_minimum_monthly", "timeframe", "notes"]
      }
    },
    initial_fees_paid_to_franchisor: { type: ["number", "null"] },
    issues: { type: "array", items: { type: "string" } },
    confidence_overall: { type: "number" }
  },
  required: [
    "brand",
    "year",
    "startup_cost_low",
    "startup_cost_high",
    "royalty_percent",
    "royalty_minimum_monthly",
    "brand_fund_percent",
    "alternate_royalty_structures",
    "initial_fees_paid_to_franchisor",
    "issues",
    "confidence_overall"
  ]
} as const;

export const FinancialsJsonSchema = {
  type: "object",
  properties: {
    brand: { type: "string" },
    year: { type: ["number", "string"] },
    reporting_period: { type: ["string", "null"] },
    unit_scope: { type: ["string", "null"] },
    basis: { type: ["string", "null"] },
    median_revenue_usd: { type: ["number", "null"] },
    top_revenue_usd: { type: ["number", "null"] },
    median_metric_label: { type: ["string", "null"] },
    top_metric_label: { type: ["string", "null"] },
    sample_size: { type: ["number", "null"] },
    notes: { type: ["string", "null"] },
    issues: { type: "array", items: { type: "string" } },
    confidence_overall: { type: "number" }
  },
  required: [
    "brand",
    "year",
    "reporting_period",
    "unit_scope",
    "basis",
    "median_revenue_usd",
    "top_revenue_usd",
    "median_metric_label",
    "top_metric_label",
    "sample_size",
    "notes",
    "issues",
    "confidence_overall"
  ]
} as const;

export const LocationsJsonSchema = {
  type: "object",
  properties: {
    brand: { type: "string" },
    year: { type: ["number", "string"] },
    as_of_date: { type: ["string", "null"] },
    outlets: {
      type: "object",
      properties: {
        franchised_total: { type: ["number", "null"] },
        company_owned_total: { type: ["number", "null"] },
        total_systemwide: { type: ["number", "null"] },
        franchised_opened: { type: ["number", "null"] },
        franchised_closed: { type: ["number", "null"] },
        franchised_transferred: { type: ["number", "null"] },
        company_opened: { type: ["number", "null"] },
        company_closed: { type: ["number", "null"] }
      },
      required: [
        "franchised_total",
        "company_owned_total",
        "total_systemwide",
        "franchised_opened",
        "franchised_closed",
        "franchised_transferred",
        "company_opened",
        "company_closed"
      ]
    },
    franchisee_contact_list: {
      type: "object",
      properties: {
        present: { type: "boolean" },
        where: { type: ["string", "null"] },
        fields_listed: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: ["present", "where", "fields_listed"]
    },
    notes: { type: ["string", "null"] },
    issues: { type: "array", items: { type: "string" } },
    confidence_overall: { type: "number" }
  },
  required: [
    "brand",
    "year",
    "as_of_date",
    "outlets",
    "franchisee_contact_list",
    "notes",
    "issues",
    "confidence_overall"
  ]
} as const;