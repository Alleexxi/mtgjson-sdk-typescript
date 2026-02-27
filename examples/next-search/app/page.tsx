import type { CardSet } from "mtgjson-sdk";
import { getSDK } from "@/lib/sdk";
import {
  parseSearchParams,
  hasActiveFilters,
  filtersToSearchOptions,
  PAGE_SIZE,
} from "@/lib/search-params";
import SearchForm from "@/components/search-form";
import CardGrid from "@/components/card-grid";
import Pagination from "@/components/pagination";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseSearchParams(params);
  const active = hasActiveFilters(filters);

  const sdk = await getSDK();

  const setList = (await sdk.sets.list({ limit: 10000 })).map((s) => ({
    code: s.code,
    name: s.name,
  }));

  let cards: CardSet[] = [];
  let imageMap: Record<string, string> = {};
  let totalCount: number | null = null;

  if (active) {
    const searchOpts = filtersToSearchOptions(filters);
    const [results, count] = await Promise.all([
      sdk.cards.search(searchOpts),
      sdk.cards.count(searchOpts),
    ]);
    cards = results;
    totalCount = count;
  } else {
    cards = await sdk.cards.random(12);
  }

  if (cards.length > 0) {
    const entries = await Promise.all(
      cards.map(async (c) => {
        const ids = await sdk.identifiers.getIdentifiers(c.uuid);
        return [c.uuid, ids?.scryfallId as string | undefined] as const;
      }),
    );
    for (const [uuid, scryfallId] of entries) {
      if (scryfallId) imageMap[uuid] = scryfallId;
    }
  }

  return (
    <div className="space-y-8">
      <SearchForm defaults={filters} sets={setList} />

      {active ? (
        cards.length > 0 ? (
          <>
            <p className="text-sm text-gray-500">
              {totalCount !== null
                ? `${totalCount.toLocaleString()} result${totalCount !== 1 ? "s" : ""}`
                : `${cards.length} result${cards.length !== 1 ? "s" : ""}`}
              {totalCount !== null && totalCount > PAGE_SIZE
                ? ` · page ${filters.page} of ${Math.ceil(totalCount / PAGE_SIZE)}`
                : ""}
            </p>
            <CardGrid cards={cards} imageMap={imageMap} />
            <Pagination
              currentPage={filters.page}
              hasMore={cards.length === PAGE_SIZE}
            />
          </>
        ) : (
          <p className="py-12 text-center text-gray-500">
            No cards found. Try adjusting your search or filters.
          </p>
        )
      ) : (
        <>
          <p className="text-sm text-gray-500">Random cards</p>
          <CardGrid cards={cards} imageMap={imageMap} />
        </>
      )}
    </div>
  );
}
