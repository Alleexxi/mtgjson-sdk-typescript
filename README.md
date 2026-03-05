# mtgjson-sdk

A high-performance, DuckDB-backed TypeScript query client for [MTGJSON](https://mtgjson.com).

Unlike traditional SDKs that rely on rate-limited REST APIs, `mtgjson-sdk` implements a local data warehouse architecture. It synchronizes optimized Parquet data from the MTGJSON CDN to your local machine, utilizing DuckDB to execute complex analytics, fuzzy searches, and booster simulations with sub-millisecond latency.

## Key Features

*   **Vectorized Execution**: Powered by DuckDB for high-speed OLAP queries on the full MTG dataset.
*   **Offline-First**: Data is cached locally, allowing for full functionality without an active internet connection.
*   **Fuzzy Search**: Built-in Jaro-Winkler similarity matching to handle typos and approximate name lookups.
*   **Fully Async**: Native async/await API with `Symbol.asyncDispose` for automatic resource cleanup.
*   **Fully Typed**: Complete TypeScript type definitions for all query results and parameters.
*   **Booster Simulation**: Accurate pack opening logic using official MTGJSON weights and sheet configurations.

## Install

TODO: NPM STUFF

## Quick Start

```typescript
import { MtgjsonSDK } from "mtgjson-sdk";

const sdk = await MtgjsonSDK.create();

// Search for cards
const bolts = await sdk.cards.getByName("Lightning Bolt");
console.log(`Found ${bolts.length} printings of Lightning Bolt`);

// Get a specific set
const mh3 = await sdk.sets.get("MH3");
if (mh3) {
  console.log(`${mh3.name} -- ${mh3.totalSetSize} cards`);
}

// Check format legality
const isLegal = await sdk.legalities.isLegal(bolts[0].uuid, "modern");
console.log(`Modern legal: ${isLegal}`);

// Find the cheapest printing
const cheapest = await sdk.prices.cheapestPrinting("Lightning Bolt");
if (cheapest) {
  console.log(`Cheapest: $${cheapest.price} (${cheapest.setCode})`);
}

// Raw SQL for anything else
const rows = await sdk.sql("SELECT name, manaValue FROM cards WHERE manaValue = $1 LIMIT 5", [0]);

await sdk.close();
```

## Architecture

By using DuckDB, the SDK leverages columnar storage and vectorized execution, making it significantly faster than SQLite or standard JSON parsing for MTG's relational dataset.

1.  **Synchronization**: On first use, the SDK lazily downloads Parquet and JSON files from the MTGJSON CDN to a platform-specific cache directory (`~/.cache/mtgjson-sdk` on Linux, `~/Library/Caches/mtgjson-sdk` on macOS, `AppData/Local/mtgjson-sdk` on Windows).
2.  **Virtual Schema**: DuckDB views are registered on-demand. Accessing `sdk.cards` registers the card view; accessing `sdk.prices` registers price data. You only pay the memory cost for the data you query.
3.  **Dynamic Adaptation**: The SDK introspects Parquet metadata to automatically handle schema changes, plural-column array conversion, and format legality unpivoting.
4.  **Materialization**: Queries return fully-typed TypeScript interfaces for individual record ergonomics, or raw `Record<string, unknown>` objects for flexible consumption.

## Use Cases

### Price Analytics

```typescript
const sdk = await MtgjsonSDK.create();

// Find the cheapest printing of any card
const cheapest = await sdk.prices.cheapestPrinting("Ragavan, Nimble Pilferer");

// Price trend over time
if (cheapest) {
  const trend = await sdk.prices.priceTrend(cheapest.uuid, {
    provider: "tcgplayer",
    finish: "normal",
  });
  console.log(`Range: $${trend.min_price} - $${trend.max_price}`);
  console.log(`Average: $${trend.avg_price} over ${trend.data_points} data points`);

  // Full price history with date range
  const history = await sdk.prices.history(cheapest.uuid, {
    provider: "tcgplayer",
    dateFrom: "2024-01-01",
    dateTo: "2024-12-31",
  });

  // Most expensive printings across the entire dataset
  const priciest = await sdk.prices.mostExpensivePrintings({ limit: 10 });
}

await sdk.close();
```

### Advanced Card Search

The `search()` method supports ~20 composable filters that can be combined freely:

```typescript
const sdk = await MtgjsonSDK.create();

// Complex filters: Modern-legal red creatures with CMC <= 2
const aggroCreatures = await sdk.cards.search({
  colors: ["R"],
  types: "Creature",
  manaValueLte: 2.0,
  legalIn: "modern",
  limit: 50,
});

// Typo-tolerant fuzzy search (Jaro-Winkler similarity)
const results = await sdk.cards.search({
  fuzzyName: "Ligtning Bolt", // still finds it!
});

// Rules text search using regular expressions
const burn = await sdk.cards.search({
  textRegex: "deals? \\d+ damage to any target",
});

// Search by keyword ability across formats
const flyers = await sdk.cards.search({
  keyword: "Flying",
  colors: ["W", "U"],
  legalIn: "standard",
});

// Find cards by foreign-language name
const blitz = await sdk.cards.search({
  localizedName: "Blitzschlag", // German for Lightning Bolt
});

await sdk.close();
```

<details>
<summary>All <code>search()</code> parameters</summary>

| Parameter | Type | Description |
|---|---|---|
| `name` | `string` | Name pattern (`%` = wildcard) |
| `fuzzyName` | `string` | Typo-tolerant Jaro-Winkler match |
| `localizedName` | `string` | Foreign-language name search |
| `colors` | `string[]` | Cards containing these colors |
| `colorIdentity` | `string[]` | Color identity filter |
| `legalIn` | `string` | Format legality |
| `rarity` | `string` | Rarity filter |
| `manaValue` | `number` | Exact mana value |
| `manaValueLte` | `number` | Mana value upper bound |
| `manaValueGte` | `number` | Mana value lower bound |
| `text` | `string` | Rules text substring |
| `textRegex` | `string` | Rules text regex |
| `types` | `string` | Type line search |
| `artist` | `string` | Artist name |
| `keyword` | `string` | Keyword ability |
| `isPromo` | `boolean` | Promo status |
| `availability` | `string` | `"paper"` or `"mtgo"` |
| `language` | `string` | Language filter |
| `layout` | `string` | Card layout |
| `setCode` | `string` | Set code |
| `setType` | `string` | Set type (joins sets table) |
| `power` | `string` | Power filter |
| `toughness` | `string` | Toughness filter |
| `limit` / `offset` | `number` | Pagination |

</details>

### Collection & Cross-Reference

```typescript
const sdk = await MtgjsonSDK.create();

// Cross-reference by any external ID system
const cards = await sdk.identifiers.findByScryfallId("f7a21fe4-...");
const tcgCards = await sdk.identifiers.findByTcgplayerId("12345");
const mtgoCards = await sdk.identifiers.findByMtgoId("67890");

// Get all external identifiers for a card
const allIds = await sdk.identifiers.getIdentifiers("card-uuid-here");
// -> Scryfall, TCGPlayer, MTGO, Arena, Cardmarket, Card Kingdom, Cardsphere, ...

// TCGPlayer SKU variants (foil, etched, etc.)
const skus = await sdk.skus.get("card-uuid-here");

// Export to a standalone DuckDB file for offline analysis
await sdk.exportDb("my_collection.duckdb");
// Now query with: duckdb my_collection.duckdb "SELECT * FROM cards LIMIT 5"

await sdk.close();
```

### Booster Simulation

```typescript
const sdk = await MtgjsonSDK.create();

// See available booster types for a set
const types = await sdk.booster.availableTypes("MH3"); // ["draft", "collector", ...]

// Open a single draft pack
const pack = await sdk.booster.openPack("MH3", "draft");
for (const card of pack) {
  console.log(`  ${card.name} (${card.rarity})`);
}

// Open an entire box
const box = await sdk.booster.openBox("MH3", "draft", 36);
const totalCards = box.reduce((sum, p) => sum + p.length, 0);
console.log(`Opened ${box.length} packs, ${totalCards} total cards`);

await sdk.close();
```

## API Reference

### Core Data

```typescript
// Cards
await sdk.cards.getByUuid("uuid")                     // single card lookup
await sdk.cards.getByUuids(["uuid1", "uuid2"])        // batch lookup
await sdk.cards.getByName("Lightning Bolt")           // all printings of a name
await sdk.cards.search({...})                         // composable filters (see above)
await sdk.cards.getPrintings("Lightning Bolt")         // all printings across sets
await sdk.cards.getAtomic("Lightning Bolt")            // oracle data (no printing info)
await sdk.cards.findByScryfallId("...")                // cross-reference shortcut
await sdk.cards.random(5)                              // random cards
await sdk.cards.count()                                // total (or filtered with kwargs)

// Tokens
await sdk.tokens.getByUuid("uuid")
await sdk.tokens.getByName("Soldier")
await sdk.tokens.search({ name: "%Token", setCode: "MH3", colors: ["W"] })
await sdk.tokens.forSet("MH3")
await sdk.tokens.count()

// Sets
await sdk.sets.get("MH3")
await sdk.sets.list({ setType: "expansion" })
await sdk.sets.search({ name: "Horizons", releaseYear: 2024 })
await sdk.sets.getFinancialSummary("MH3", { provider: "tcgplayer" })
await sdk.sets.count()
```

### Playability

```typescript
// Legalities
await sdk.legalities.formatsForCard("uuid")            // -> { modern: "Legal", ... }
await sdk.legalities.legalIn("modern")                 // all modern-legal cards
await sdk.legalities.isLegal("uuid", "modern")         // -> boolean
await sdk.legalities.bannedIn("modern")                // also: restrictedIn, suspendedIn

// Decks & Sealed Products
await sdk.decks.list({ setCode: "MH3" })
await sdk.decks.search({ name: "Eldrazi" })
await sdk.decks.count()
await sdk.sealed.list({ setCode: "MH3" })
await sdk.sealed.get("uuid")
```

### Market & Identifiers

```typescript
// Prices
await sdk.prices.get("uuid")                           // full nested price data
await sdk.prices.today("uuid", { provider: "tcgplayer", finish: "foil" })
await sdk.prices.history("uuid", { provider: "tcgplayer", dateFrom: "2024-01-01" })
await sdk.prices.priceTrend("uuid")                    // min/max/avg statistics
await sdk.prices.cheapestPrinting("Lightning Bolt")
await sdk.prices.mostExpensivePrintings({ limit: 10 })

// Identifiers (supports all major external ID systems)
await sdk.identifiers.findByScryfallId("...")
await sdk.identifiers.findByTcgplayerId("...")
await sdk.identifiers.findByMtgoId("...")
await sdk.identifiers.findByMtgArenaId("...")
await sdk.identifiers.findByMultiverseId("...")
await sdk.identifiers.findByMcmId("...")
await sdk.identifiers.findByCardKingdomId("...")
await sdk.identifiers.findBy("scryfallId", "...")      // generic lookup
await sdk.identifiers.getIdentifiers("uuid")           // all IDs for a card

// SKUs
await sdk.skus.get("uuid")
await sdk.skus.findBySkuId(123456)
await sdk.skus.findByProductId(789)
```

### Booster & Enums

```typescript
await sdk.booster.availableTypes("MH3")
await sdk.booster.openPack("MH3", "draft")
await sdk.booster.openBox("MH3", "draft", 36)
await sdk.booster.sheetContents("MH3", "draft", "common")

await sdk.enums.keywords()
await sdk.enums.cardTypes()
await sdk.enums.enumValues()
```

### System

```typescript
await sdk.meta                                         // version and build date
sdk.views                                              // registered view names
await sdk.refresh()                                    // check CDN for new data -> boolean
await sdk.exportDb("output.duckdb")                    // export to persistent DuckDB file
await sdk.sql(query, params)                           // raw parameterized SQL
await sdk.close()                                      // release resources
```

## Performance and Memory

When querying large datasets (thousands of cards), use raw SQL to avoid materializing large arrays of typed objects in memory.

```typescript
// Use raw SQL for bulk analysis
const stats = await sdk.sql(`
  SELECT setCode, COUNT(*) as card_count, AVG(manaValue) as avg_cmc
  FROM cards
  GROUP BY setCode
  ORDER BY card_count DESC
  LIMIT 10
`);
```

## Advanced Usage

### Async Factory Pattern

The SDK uses an async factory since DuckDB initialization is asynchronous:

```typescript
import { MtgjsonSDK } from "mtgjson-sdk";

const sdk = await MtgjsonSDK.create({
  cacheDir: "/data/mtgjson-cache",
  offline: false,
  timeout: 300_000,
  onProgress: (filename, downloaded, total) => {
    const pct = total ? ((downloaded / total) * 100).toFixed(1) : "?";
    process.stdout.write(`\r${filename}: ${pct}%`);
  },
});
```

### Automatic Resource Cleanup

The SDK supports `Symbol.asyncDispose` for automatic cleanup with `await using`:

```typescript
{
  await using sdk = await MtgjsonSDK.create();

  const cards = await sdk.cards.search({ name: "Lightning%" });
  console.log(cards.length);

  // sdk.close() is called automatically when the block exits
}
```

### Auto-Refresh for Long-Running Services

```typescript
// In a scheduled task or health check:
const refreshed = await sdk.refresh();
if (refreshed) {
  console.log("New MTGJSON data detected -- cache refreshed");
}
```

### Raw SQL

All user input goes through DuckDB parameter binding (`$1`, `$2`, ...):

```typescript
const sdk = await MtgjsonSDK.create();

// Ensure views are registered before querying
await sdk.cards.count();

// Parameterized queries
const rows = await sdk.sql(
  "SELECT name, setCode, rarity FROM cards WHERE manaValue <= $1 AND rarity = $2",
  [2, "mythic"]
);
```

### Web API Example

```typescript
import { MtgjsonSDK } from "mtgjson-sdk";
import express from "express";

const app = express();
const sdk = await MtgjsonSDK.create();

app.get("/card/:name", async (req, res) => {
  const cards = await sdk.cards.getByName(req.params.name);
  res.json(cards);
});

app.get("/health", async (_req, res) => {
  const refreshed = await sdk.refresh();
  res.json({ refreshed, views: sdk.views });
});

process.on("SIGTERM", async () => {
  await sdk.close();
  process.exit(0);
});

app.listen(3000, () => console.log("Listening on :3000"));
```

## Examples

### Next.js Card Search (`examples/next-search`)

A full-stack web application built with Next.js 15 and Tailwind CSS that demonstrates the SDK in a server-side rendered context. Features a card search interface with fuzzy matching, filters (color, rarity, type, set, format legality), card detail pages, and responsive image grids powered by Scryfall.

**SDK features demonstrated:**

| Feature | SDK Method |
|---------|-----------|
| Fuzzy card search with filters | `sdk.cards.search({ fuzzyName, colors, rarity, types, setCode, legalIn })` |
| Total result count with pagination | `sdk.cards.count()` |
| Random cards on the home page | `sdk.cards.random()` |
| Card detail lookup | `sdk.cards.getByUuid()` |
| All printings across sets | `sdk.cards.getPrintings()` |
| Cross-system identifier lookup | `sdk.identifiers.getIdentifiers()` |
| Format legality table | `sdk.legalities.formatsForCard()` |
| Retail price data by provider | `sdk.prices.today()` |
| Set list for autocomplete filter | `sdk.sets.list()` |
| Data version attribution | `sdk.meta` |

```bash
cd examples/next-search
bun install
bun run dev
# Open http://localhost:3000
```

> **Note:** The SDK must be built first (`bun run build` in the repo root). First page load downloads parquet data from the MTGJSON CDN (~30s cold start), subsequent loads use the local cache.

## Development

```bash
git clone https://github.com/the-muppet2/mtgjson-sdk-typescript.git
cd mtgjson-sdk-typescript
bun install
bun run build
bun run typecheck
bun test
bun run lint
bun run format
```

## License

MIT
