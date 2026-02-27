export const PAGE_SIZE = 24;

const VALID_COLORS = new Set(["W", "U", "B", "R", "G"]);
const VALID_RARITIES = new Set(["common", "uncommon", "rare", "mythic"]);

export interface SearchFilters {
  query: string;
  colors: string[];
  rarity: string;
  type: string;
  setCode: string;
  legalIn: string;
  page: number;
}

export function parseSearchParams(
  params: Record<string, string | string[] | undefined>,
): SearchFilters {
  const query = String(params.q ?? "").trim();
  const colors = String(params.colors ?? "")
    .split(",")
    .filter((c) => VALID_COLORS.has(c));
  const rawRarity = String(params.rarity ?? "");
  const rarity = VALID_RARITIES.has(rawRarity) ? rawRarity : "";
  const type = String(params.type ?? "").trim();
  const setCode = String(params.set ?? "").trim();
  const legalIn = String(params.legalIn ?? "").trim();
  const page = Math.max(1, parseInt(String(params.page ?? "1"), 10) || 1);

  return { query, colors, rarity, type, setCode, legalIn, page };
}

export function hasActiveFilters(f: SearchFilters): boolean {
  return !!(
    f.query ||
    f.colors.length > 0 ||
    f.rarity ||
    f.type ||
    f.setCode ||
    f.legalIn
  );
}

export function filtersToSearchOptions(f: SearchFilters) {
  return {
    ...(f.query ? { fuzzyName: f.query } : {}),
    ...(f.colors.length > 0 ? { colors: f.colors } : {}),
    ...(f.rarity ? { rarity: f.rarity } : {}),
    ...(f.type ? { types: f.type } : {}),
    ...(f.setCode ? { setCode: f.setCode } : {}),
    ...(f.legalIn ? { legalIn: f.legalIn } : {}),
    limit: PAGE_SIZE,
    offset: (f.page - 1) * PAGE_SIZE,
  };
}
