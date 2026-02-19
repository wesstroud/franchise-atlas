const ITEM_WORD_SRC = "I\\s*T\\s*E\\s*M";
const HOW_TO_USE_ANCHOR = /(?:^|\n)\s*HOW\s+TO\s+USE\s+THIS\s+FRANCHISE\s+DISCLOSURE\s+DOCUMENT\b/i;
const tocStart = /(?:^|\n)\s*TABLE\s+OF\s+CONTENTS\b/i;
const tocEnd = /(?:^|\n)\s*(?:ITEM\s*23\b|EXHIBIT\s+"?A"?\b|EXHIBIT\s+A\b)\s/i;

function makeItemStartRegex(itemNumber: number): RegExp {
  return new RegExp(
    String.raw`(?:^|\n)\s*(?:${ITEM_WORD_SRC})\s*${String(itemNumber).split("").join("\\s*")}\b`,
    "i"
  );
}

function extractUpTo(fullText: string, endRegex: RegExp): string {
  if (!fullText) return "";
  const m = fullText.match(endRegex);
  if (!m || m.index == null) return "";
  return fullText.slice(0, m.index).trim();
}

function stripTableOfContents(fullText: string): string {
  if (!fullText) return "";
  const startMatch = fullText.match(tocStart);
  if (!startMatch || startMatch.index == null) return fullText;
  if (startMatch.index > 200000) return fullText;

  const afterToc = fullText.slice(startMatch.index);
  const endMatch = afterToc.match(tocEnd);
  if (!endMatch || endMatch.index == null) return fullText;

  const cutIndex = startMatch.index + endMatch.index;
  return fullText.slice(cutIndex);
}

function extractBetween(fullText: string, startRegex: RegExp, endRegex: RegExp): string {
  const startMatch = fullText.match(startRegex);
  if (!startMatch || startMatch.index == null) return "";

  const remaining = fullText.slice(startMatch.index);
  const endMatch = remaining.match(endRegex);
  if (endMatch && endMatch.index != null) {
    return remaining.slice(0, endMatch.index).trim();
  }
  return remaining.trim();
}

function capText(text: string, maxChars: number): string {
  if (!text) return "";
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n\n[TRUNCATED at ${maxChars} chars]\n`;
}

export function segmentFddText(fullTextRaw: string) {
  const fullText = stripTableOfContents(fullTextRaw || "");

  const item6Start = makeItemStartRegex(6);
  const item7Start = makeItemStartRegex(7);
  const item8Start = makeItemStartRegex(8);
  const item9Start = makeItemStartRegex(9);
  const item19Start = makeItemStartRegex(19);
  const item20Start = makeItemStartRegex(20);
  const item21Start = makeItemStartRegex(21);

  const firstPageText = extractUpTo(fullTextRaw || "", HOW_TO_USE_ANCHOR);

  const item6Text = extractBetween(fullText, item6Start, item7Start);
  let item7Text = extractBetween(fullText, item7Start, item8Start);
  if (!item7Text) item7Text = extractBetween(fullText, item7Start, item9Start);

  const item19Text = extractBetween(fullText, item19Start, item20Start);
  const item20Text = extractBetween(fullText, item20Start, item21Start);

  return {
    firstPageText,
    firstPageForAi: capText(firstPageText, 60000),
    item6Text,
    item7Text,
    item19Text,
    item20Text,
    item6ForAi: capText(item6Text, 80000),
    item7ForAi: capText(item7Text, 120000),
    item19ForAi: capText(item19Text, 120000),
    item20ForAi: capText(item20Text, 200000),
    debug: {
      fullTextRawLen: (fullTextRaw || "").length,
      fullTextLenAfterTocStrip: fullText.length,
      firstPageLen: firstPageText.length,
      item6Len: item6Text.length,
      item7Len: item7Text.length,
      item19Len: item19Text.length,
      item20Len: item20Text.length,
      firstPageFound: !!firstPageText,
      item6Found: !!item6Text,
      item7Found: !!item7Text,
      item19Found: !!item19Text,
      item20Found: !!item20Text
    }
  };
}