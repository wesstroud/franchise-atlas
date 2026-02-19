export const VALIDATION_SYSTEM = `Determine whether the text is from a Franchise Disclosure Document (FDD). Return only valid JSON.`;

export const VALIDATION_USER = (firstPageForAi: string, brandName: string) => `TEXT (primary):\n${firstPageForAi}\n\nOther helpful context:\n- User reported franchise name: ${brandName}`;

export const CATEGORY_SYSTEM = `You are a categorization agent. Choose exactly ONE category from the allowed list and output ONLY valid JSON matching the schema.`;

export const CATEGORY_USER = (firstPageForAi: string, brandName: string, suggestedCategory?: string) =>
  `Here is the first page of the Franchise Disclosure Document (FDD).\nThis section typically describes the nature of the business, the services or products offered, and the primary customer type.\n\nUse this text as the PRIMARY source of truth for categorization:\n${firstPageForAi}\n\nAdditional context (use as secondary signals only):\n- Reported franchise name: ${brandName}\n- User-suggested category (may be incorrect): ${suggestedCategory ?? ""}\n\nInstructions:\n- Base your decision primarily on the business activities and customer described in the FDD text.\n- Use the franchise name only to clarify ambiguity, not to override the text.\n- Treat the suggested category as a weak hint; override it if the text indicates a better fit.\n- Do NOT infer categories based on branding, buzzwords, or assumptions not supported by the text.\n- If the category is unclear from the provided text, select "Other" and assign a low confidence score.`;

export const ROYALTY_SYSTEM = `You extract franchise fee and startup investment information from FDD text. Return only strict JSON.`;

export const ROYALTY_USER = (brand: string, year: string, item6: string, item7: string) =>
  `brand: ${brand}\nyear: ${year}\n\nItem 6 text:\n${item6}\n\nItem 7 text:\n${item7}\n\nExtract:\n- startup_cost_low, startup_cost_high (USD)\n- initial fees paid to franchisor if explicitly stated (USD)\n- royalty_percent (primary/standard), royalty_minimum_monthly if present (USD)\n- brand_fund_percent if present\n- any alternate royalty structures as a list`;

export const FINANCIALS_SYSTEM = `You extract Item 19 (Financial Performance Representations) data from FDD text. Return only strict JSON.`;

export const FINANCIALS_USER = (brand: string, year: string, item19: string) =>
  `brand: ${brand}\nyear: ${year}\n\nItem 19 text:\n${item19}\n\nExtract:\n- median_revenue_usd\n- top_revenue_usd\n- reporting_period\n- unit_scope\n- basis\n- sample_size\n- notes\n- issues[]`;

export const LOCATIONS_SYSTEM = `You extract Item 20 (Outlets and Franchisee Information) data from FDD text. Return only strict JSON.`;

export const LOCATIONS_USER = (brand: string, year: string, item20: string) =>
  `brand: ${brand}\nyear: ${year}\n\nItem 20 text:\n${item20}\n\nExtract:\n- as_of_date\n- franchised_total, company_owned_total, total_systemwide\n- franchised_opened, franchised_closed, franchised_transferred\n- company_opened, company_closed\n- franchisee contact list presence/location/fields\n- notes + issues[]`;