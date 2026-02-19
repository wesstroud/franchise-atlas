# Franchise Atlas FDD Ingestion Backend

Express + OpenAI + Supabase backend that recreates the n8n FDD ingestion workflow.

## Functional Specification

### Trigger
- `POST /fdd/upload`
- Multipart form-data with:
  - `file` (PDF)
  - `brandName` (string)
  - `year` (string or number)
  - `category` (optional string)

### Data Transformations
- Parse PDF text from uploaded binary.
- Strip TOC heuristically:
  - Find `TABLE OF CONTENTS` near start.
  - Remove TOC block only when an end marker is found (`ITEM 23` or `EXHIBIT A`).
- OCR-tolerant Item extraction with line-anchored regex:
  - `I\s*T\s*E\s*M` + spaced digits.
- Extract and cap text windows:
  - First page preamble (to `HOW TO USE THIS FRANCHISE DISCLOSURE DOCUMENT`) capped 60k.
  - Item 6 capped 80k.
  - Item 7 capped 120k.
  - Item 19 capped 120k.
  - Item 20 capped 200k.

### AI Extraction Logic
- FDD validation agent (structured JSON).
- Category agent (structured JSON enum).
- Royalty parser for Items 6+7.
- Financials parser for Item 19.
- Locations parser for Item 20.

### Validation Gating
- Continue full pipeline only if:
  - `is_fdd === true`
  - `confidence > 0.7` (configurable via `FDD_CONFIDENCE_THRESHOLD`)

### Branching
- Main branch: validation gate -> category + parsers -> table writes.
- Exhibit F branch runs in parallel:
  - Parse Part A rows via Part B anchor.
  - Normalize rows and hash deterministically.
  - Upsert to franchisee location table.

### Database Writes
- `fdd_brands`
- `fdd_royalty_data`
- `fdd_financials_data`
- `fdd_locations_data`
- `fdd_franchisee_locations`
- `fdd_ingestions` (idempotency lifecycle and status)

### Idempotency
- Compute SHA-256 on uploaded PDF bytes.
- Lookup `fdd_ingestions.sha256`.
- If status is `completed`, return duplicate response without reprocessing.
- Otherwise mark `processing` -> `completed` / `failed` / `rejected`.

## Example POST Payload

```bash
curl -X POST "http://localhost:3000/fdd/upload" \
  -F "file=@/path/to/franchise-fdd.pdf;type=application/pdf" \
  -F "brandName=Example Franchise" \
  -F "year=2024" \
  -F "category=Home Services"
```

## Environment Variables

See `.env.example`.

## Run

```bash
npm install
npm run dev
```

## Notes for Replit
- Add all env vars in Replit Secrets.
- Ensure your Supabase tables include expected columns and unique constraints:
  - `fdd_ingestions.sha256` unique
  - `fdd_franchisee_locations.row_hash` unique