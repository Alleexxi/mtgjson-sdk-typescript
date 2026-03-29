import { tmpdir } from "node:os";
import { join } from "node:path";
import { CacheManager } from "../src/cache.js";
import { MtgjsonSDK } from "../src/client.js";
import { Connection } from "../src/connection.js";
import {
	SAMPLE_CARDS,
	SAMPLE_FOREIGN_DATA,
	SAMPLE_IDENTIFIERS,
	SAMPLE_LEGALITIES,
	SAMPLE_SEALED_PRODUCTS,
	SAMPLE_SET_DECKS,
	SAMPLE_SETS,
	SAMPLE_TOKENS,
} from "./fixtures.js";

/** Create a Connection with sample data loaded (no network). */
export async function createTestConnection(): Promise<Connection> {
	const cacheDir = join(
		tmpdir(),
		`mtgjson-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
	);
	const cache = new CacheManager({ cacheDir, offline: true });
	await cache.init();
	const conn = await Connection.create(cache);

	await conn.registerTableFromData("cards", SAMPLE_CARDS);
	await conn.registerTableFromData("sets", SAMPLE_SETS);
	await conn.registerTableFromData("tokens", SAMPLE_TOKENS);
	await conn.registerTableFromData("card_identifiers", SAMPLE_IDENTIFIERS);
	await conn.registerTableFromData("card_legalities", SAMPLE_LEGALITIES);
	await conn.registerTableFromData("card_foreign_data", SAMPLE_FOREIGN_DATA);
	await conn.registerTableFromData("sealed_products", SAMPLE_SEALED_PRODUCTS);
	await conn.registerTableFromData("set_decks", SAMPLE_SET_DECKS);

	return conn;
}

/** Create an MtgjsonSDK instance with sample data loaded (no network). */
export async function createTestSdk(): Promise<MtgjsonSDK> {
	const cacheDir = join(
		tmpdir(),
		`mtgjson-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
	);
	const sdk = await MtgjsonSDK.create({ cacheDir, offline: true });

	// Access internal connection to load sample data
	const conn = (sdk as unknown as { _conn: Connection })._conn;
	await conn.registerTableFromData("cards", SAMPLE_CARDS);
	await conn.registerTableFromData("sets", SAMPLE_SETS);
	await conn.registerTableFromData("tokens", SAMPLE_TOKENS);
	await conn.registerTableFromData("card_identifiers", SAMPLE_IDENTIFIERS);
	await conn.registerTableFromData("card_legalities", SAMPLE_LEGALITIES);
	await conn.registerTableFromData("card_foreign_data", SAMPLE_FOREIGN_DATA);
	await conn.registerTableFromData("sealed_products", SAMPLE_SEALED_PRODUCTS);
	await conn.registerTableFromData("set_decks", SAMPLE_SET_DECKS);

	return sdk;
}
