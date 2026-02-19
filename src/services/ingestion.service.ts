import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { sha256Buffer } from "../lib/hash.js";
import { callStructured } from "../lib/openai.js";
import { extractPdfText } from "./pdfText.service.js";
import { segmentFddText } from "./textSegmentation.service.js";
import { extractExhibitFLocations } from "./exhibitF.service.js";
import * as repo from "../repositories/fdd.repository.js";
import { CategorySchema, ValidationSchema, CategoryJsonSchema, FinancialsJsonSchema, LocationsJsonSchema, RoyaltyJsonSchema, ValidationJsonSchema } from "../schemas/ai.js";
import { CATEGORY_SYSTEM, CATEGORY_USER, FINANCIALS_SYSTEM, FINANCIALS_USER, LOCATIONS_SYSTEM, LOCATIONS_USER, ROYALTY_SYSTEM, ROYALTY_USER, VALIDATION_SYSTEM, VALIDATION_USER } from "../prompts/index.js";

export async function ingestFdd(input: {
  fileBuffer: Buffer;
  brandName: string;
  year: string;
  category?: string;
}) {
  const sha256 = sha256Buffer(input.fileBuffer);

  const existing = await repo.getIngestionBySha(sha256);
  if (existing?.status === "completed") {
    return { duplicate: true, status: "completed", sha256 };
  }

  await repo.upsertIngestion({
    sha256,
    brand_name: input.brandName,
    year: input.year,
    status: "processing"
  });

  try {
    const { text, pageCount } = await extractPdfText(input.fileBuffer);
    const seg = segmentFddText(text);

    const exhibitPromise = (async () => {
      const locations = extractExhibitFLocations({
        text,
        brand: input.brandName,
        year: Number(input.year),
        category: input.category
      });
      await repo.insertFranchiseeLocations(locations);
      return locations.length;
    })();

    const validationRaw = await callStructured<unknown>({
      model: env.OPENAI_MODEL_VALIDATE,
      name: "fdd_validation",
      schema: ValidationJsonSchema as unknown as Record<string, unknown>,
      system: VALIDATION_SYSTEM,
      user: VALIDATION_USER(seg.firstPageForAi, input.brandName)
    });

    const validation = ValidationSchema.parse(validationRaw);
    const gatePass = validation.is_fdd === true && validation.confidence > env.FDD_CONFIDENCE_THRESHOLD;

    if (!gatePass) {
      await repo.upsertIngestion({ sha256, status: "rejected", validation });
      await exhibitPromise;
      return {
        duplicate: false,
        status: "rejected",
        sha256,
        gate: { threshold: env.FDD_CONFIDENCE_THRESHOLD, pass: false },
        validation
      };
    }

    const categoryRaw = await callStructured<unknown>({
      model: env.OPENAI_MODEL_CATEGORY,
      name: "fdd_category",
      schema: CategoryJsonSchema as unknown as Record<string, unknown>,
      system: CATEGORY_SYSTEM,
      user: CATEGORY_USER(seg.firstPageForAi, input.brandName, input.category)
    });
    const category = CategorySchema.parse(categoryRaw);

    await repo.insertBrand({
      brand: input.brandName,
      category: category.category
    });

    const [royalty, financials, locations, exhibitCount] = await Promise.all([
      callStructured<Record<string, unknown>>({
        model: env.OPENAI_MODEL_EXTRACT,
        name: "fdd_royalty",
        schema: RoyaltyJsonSchema as unknown as Record<string, unknown>,
        system: ROYALTY_SYSTEM,
        user: ROYALTY_USER(input.brandName, input.year, seg.item6ForAi, seg.item7ForAi)
      }),
      callStructured<Record<string, unknown>>({
        model: env.OPENAI_MODEL_EXTRACT,
        name: "fdd_financials",
        schema: FinancialsJsonSchema as unknown as Record<string, unknown>,
        system: FINANCIALS_SYSTEM,
        user: FINANCIALS_USER(input.brandName, input.year, seg.item19ForAi)
      }),
      callStructured<Record<string, unknown>>({
        model: env.OPENAI_MODEL_EXTRACT,
        name: "fdd_locations",
        schema: LocationsJsonSchema as unknown as Record<string, unknown>,
        system: LOCATIONS_SYSTEM,
        user: LOCATIONS_USER(input.brandName, input.year, seg.item20ForAi)
      }),
      exhibitPromise
    ]);

    await Promise.all([
      repo.insertRoyalty({ ...royalty, brand: input.brandName, year: input.year, sha256 }),
      repo.insertFinancials({ ...financials, brand: input.brandName, year: input.year, sha256 }),
      repo.insertLocations({ ...locations, brand: input.brandName, year: input.year, sha256 })
    ]);

    await repo.upsertIngestion({
      sha256,
      status: "completed",
      page_count: pageCount,
      validation,
      category,
      segmentation_debug: seg.debug,
      exhibit_f_location_count: exhibitCount
    });

    return {
      duplicate: false,
      status: "completed",
      sha256,
      pageCount,
      gate: { threshold: env.FDD_CONFIDENCE_THRESHOLD, pass: true },
      category: category.category,
      exhibit_f_location_count: exhibitCount
    };
  } catch (error) {
    logger.error({ err: error, sha256 }, "fdd ingestion failed");
    await repo.upsertIngestion({ sha256, status: "failed", error: String(error) });
    throw error;
  }
}