import { deterministicRowHash } from "../lib/hash.js";

type ExhibitLocationRow = {
  record_type: "location";
  fdd_id: string | null;
  brand: string | null;
  year: number | null;
  category: string | null;
  source: "EXHIBIT_F_PART_A";
  state: string;
  city: string;
  address: string;
  telephone: string;
  franchisee_name: string;
  row_hash: string;
};

const PART_B_FORMER =
  /(?:^|\n)\s*Part\s*B\b[\s\S]{0,200}Former\s+Franchisees|Former\s+Franchisees\s+Who\s+Left\s+System/i;
const PART_A = /(?:^|\n)\s*Part\s*A\b/i;
const HEADER_PART_A = /(?:^|\n)\s*State\s+City\s+Address\s+Phone\s+Owner\s+Name\b/i;
const PHONE_RE = /(?:\(\s*\d{3}\s*\)\s*|\b\d{3}[\s.\-]?)\d{3}[\s.\-]?\d{4}\b/;
const ROW_START_STATE_RE = /^[A-Z]\s*[A-Z]\s+/m;

function normalizeBrandForId(s: string): string {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function toGlobalRegex(re: RegExp): RegExp {
  const flags = re.flags.includes("g") ? re.flags : `${re.flags}g`;
  return new RegExp(re.source, flags);
}

function lastIndexOfRegex(text: string, re: RegExp): number {
  const idxs = [...text.matchAll(toGlobalRegex(re))]
    .map((m) => m.index)
    .filter((i): i is number => i != null);
  return idxs.length ? idxs[idxs.length - 1] : -1;
}

function buildRows(text: string): string[] {
  const lines = (text || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows: string[] = [];
  let current = "";

  for (const line of lines) {
    if (ROW_START_STATE_RE.test(line)) {
      if (current) rows.push(current.trim());
      current = line;
    } else {
      current = current ? `${current} ${line}` : line;
    }
  }
  if (current) rows.push(current.trim());
  return rows;
}

function parseRow(row: string) {
  const text = (row || "").trim();
  if (!text) return null;
  if (/^State\s+City/i.test(text)) return null;
  if (/^Part\s+[A-Z]/i.test(text)) return null;
  if (/^Exhibit\s+F/i.test(text)) return null;
  if (/^Franchise\s+Disclosure\s+Document/i.test(text)) return null;

  const stateMatch = text.match(/^([A-Z]\s*[A-Z])\s+(.*)$/);
  if (!stateMatch) return null;

  const state = stateMatch[1].replace(/\s+/g, "").trim();
  const rest = stateMatch[2];

  const phoneMatch = rest.match(PHONE_RE);
  if (!phoneMatch || phoneMatch.index == null) return null;

  const telephoneRaw = phoneMatch[0];
  const telephone = telephoneRaw.replace(/\s+/g, " ").trim();

  const beforePhone = rest.slice(0, phoneMatch.index).trim();
  const afterPhone = rest.slice(phoneMatch.index + telephoneRaw.length).trim();

  let city = "";
  let address = "";

  if (/To Be Determined/i.test(beforePhone)) {
    city = "To Be Determined";
    address = "To Be Determined";
  } else {
    const digitIdx = beforePhone.search(/\d/);
    if (digitIdx > 0) {
      city = beforePhone.slice(0, digitIdx).trim();
      address = beforePhone.slice(digitIdx).trim();
    } else {
      city = beforePhone.trim();
      address = "";
    }
  }

  return {
    state,
    city,
    address,
    telephone,
    franchisee_name: afterPhone.replace(/\s+/g, " ").trim()
  };
}

export function extractExhibitFLocations(args: {
  text: string;
  brand: string;
  year: number;
  category?: string;
  fdd_id?: string | null;
}): ExhibitLocationRow[] {
  const endIndex = args.text.search(PART_B_FORMER);
  if (endIndex < 0) return [];

  const lookback = args.text.slice(Math.max(0, endIndex - 900000), endIndex);
  const partAIdx = lastIndexOfRegex(lookback, PART_A);
  const headerIdx = lastIndexOfRegex(lookback, HEADER_PART_A);

  const startIndex =
    partAIdx >= 0
      ? endIndex - lookback.length + partAIdx
      : headerIdx >= 0
      ? endIndex - lookback.length + headerIdx
      : null;

  if (startIndex == null) return [];

  let partAText = args.text.slice(startIndex, endIndex).trim();
  const headerPos = partAText.search(HEADER_PART_A);
  if (headerPos >= 0) partAText = partAText.slice(headerPos);

  const rows = buildRows(partAText);

  const fdd_id = args.fdd_id ?? `${normalizeBrandForId(args.brand)}_${args.year}`;

  return rows
    .map(parseRow)
    .filter((x): x is NonNullable<typeof x> => !!x)
    .map((loc) => ({
      record_type: "location" as const,
      fdd_id,
      brand: args.brand,
      year: args.year,
      category: args.category ?? null,
      source: "EXHIBIT_F_PART_A" as const,
      ...loc,
      row_hash: deterministicRowHash([
        fdd_id,
        "EXHIBIT_F_PART_A",
        loc.state,
        loc.city,
        loc.address,
        loc.telephone,
        loc.franchisee_name
      ])
    }));
}