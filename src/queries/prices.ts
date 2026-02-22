import { writeFileSync } from "node:fs";
import { readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createGunzip } from "node:zlib";
import type { CacheManager } from "../cache.js";
import type { Connection } from "../connection.js";

export class PriceQuery {
	private _conn: Connection;
	private _cache: CacheManager;
	private _loaded = false;

	constructor(conn: Connection, cache: CacheManager) {
		this._conn = conn;
		this._cache = cache;
	}

	private async _ensure(): Promise<void> {
		if (this._loaded) return;
		if (this._conn._registeredViews.has("prices_today")) {
			this._loaded = true;
			return;
		}
		try {
			const path = await this._cache.ensureJson("all_prices_today");
			await loadPricesToDuckdb(path, this._conn);
		} catch {
			// Price data not available
		}
		this._loaded = true;
	}

	async get(uuid: string): Promise<Record<string, unknown> | null> {
		await this._ensure();
		if (!this._conn._registeredViews.has("prices_today")) return null;
		const rows = await this._conn.execute(
			"SELECT * FROM prices_today WHERE uuid = $1 ORDER BY source, provider, category, finish, date",
			[uuid],
		);
		if (rows.length === 0) return null;
		const result: Record<string, unknown> = {};
		for (const r of rows) {
			const srcKey = r.source as string;
			if (!result[srcKey]) result[srcKey] = {};
			const src = result[srcKey] as Record<string, unknown>;

			const provKey = r.provider as string;
			if (!src[provKey]) src[provKey] = { currency: r.currency ?? "USD" };
			const prov = src[provKey] as Record<string, unknown>;

			const catKey = r.category as string;
			if (!prov[catKey]) prov[catKey] = {};
			const cat = prov[catKey] as Record<string, unknown>;

			const finKey = r.finish as string;
			if (!cat[finKey]) cat[finKey] = {};
			const fin = cat[finKey] as Record<string, unknown>;

			fin[r.date as string] = r.price;
		}
		return result;
	}

	async today(
		uuid: string,
		options?: {
			provider?: string;
			finish?: string;
			category?: string;
		},
	): Promise<Record<string, unknown>[]> {
		await this._ensure();
		if (!this._conn._registeredViews.has("prices_today")) return [];
		const parts = [
			"SELECT * FROM prices_today",
			"WHERE uuid = $1",
			"AND date = (SELECT MAX(p2.date) FROM prices_today p2 WHERE p2.uuid = $1)",
		];
		const params: unknown[] = [uuid];
		let idx = 2;
		if (options?.provider) {
			parts.push(`AND provider = $${idx}`);
			params.push(options.provider);
			idx++;
		}
		if (options?.finish) {
			parts.push(`AND finish = $${idx}`);
			params.push(options.finish);
			idx++;
		}
		if (options?.category) {
			parts.push(`AND category = $${idx}`);
			params.push(options.category);
			idx++;
		}
		return this._conn.execute(parts.join(" "), params);
	}

	async history(
		uuid: string,
		options?: {
			provider?: string;
			finish?: string;
			category?: string;
			dateFrom?: string;
			dateTo?: string;
		},
	): Promise<Record<string, unknown>[]> {
		await this._ensure();
		if (!this._conn._registeredViews.has("prices_today")) return [];
		const parts = ["SELECT * FROM prices_today WHERE uuid = $1"];
		const params: unknown[] = [uuid];
		let idx = 2;
		if (options?.provider) {
			parts.push(`AND provider = $${idx}`);
			params.push(options.provider);
			idx++;
		}
		if (options?.finish) {
			parts.push(`AND finish = $${idx}`);
			params.push(options.finish);
			idx++;
		}
		if (options?.category) {
			parts.push(`AND category = $${idx}`);
			params.push(options.category);
			idx++;
		}
		if (options?.dateFrom) {
			parts.push(`AND date >= $${idx}`);
			params.push(options.dateFrom);
			idx++;
		}
		if (options?.dateTo) {
			parts.push(`AND date <= $${idx}`);
			params.push(options.dateTo);
			idx++;
		}
		parts.push("ORDER BY date ASC");
		return this._conn.execute(parts.join(" "), params);
	}

	async priceTrend(
		uuid: string,
		options?: {
			provider?: string;
			finish?: string;
			category?: string;
		},
	): Promise<Record<string, unknown> | null> {
		await this._ensure();
		if (!this._conn._registeredViews.has("prices_today")) return null;
		const category = options?.category ?? "retail";
		const parts = [
			"SELECT",
			"  MIN(price) AS min_price,",
			"  MAX(price) AS max_price,",
			"  ROUND(AVG(price), 2) AS avg_price,",
			"  MIN(date) AS first_date,",
			"  MAX(date) AS last_date,",
			"  COUNT(*) AS data_points",
			"FROM prices_today",
			"WHERE uuid = $1 AND category = $2",
		];
		const params: unknown[] = [uuid, category];
		let idx = 3;
		if (options?.provider) {
			parts.push(`AND provider = $${idx}`);
			params.push(options.provider);
			idx++;
		}
		if (options?.finish) {
			parts.push(`AND finish = $${idx}`);
			params.push(options.finish);
			idx++;
		}
		const rows = await this._conn.execute(parts.join(" "), params);
		if (!rows.length || (rows[0].data_points as number) === 0) return null;
		return rows[0];
	}

	async cheapestPrinting(
		name: string,
		options?: {
			provider?: string;
			finish?: string;
			category?: string;
		},
	): Promise<Record<string, unknown> | null> {
		await this._ensure();
		await this._conn.ensureViews("cards");
		const provider = options?.provider ?? "tcgplayer";
		const finish = options?.finish ?? "normal";
		const category = options?.category ?? "retail";
		const sql =
			"SELECT c.uuid, c.setCode, c.number, p.price, p.date " +
			"FROM cards c " +
			"JOIN prices_today p ON c.uuid = p.uuid " +
			"WHERE c.name = $1 AND p.provider = $2 " +
			"AND p.finish = $3 AND p.category = $4 " +
			"AND p.date = (SELECT MAX(p2.date) FROM prices_today p2 " +
			"WHERE p2.uuid = c.uuid AND p2.provider = $2 " +
			"AND p2.finish = $3 AND p2.category = $4) " +
			"ORDER BY p.price ASC " +
			"LIMIT 1";
		const rows = await this._conn.execute(sql, [
			name,
			provider,
			finish,
			category,
		]);
		return rows[0] ?? null;
	}

	async cheapestPrintings(options?: {
		provider?: string;
		finish?: string;
		category?: string;
		limit?: number;
		offset?: number;
	}): Promise<Record<string, unknown>[]> {
		await this._ensure();
		await this._conn.ensureViews("cards");
		if (!this._conn._registeredViews.has("prices_today")) return [];
		const provider = options?.provider ?? "tcgplayer";
		const finish = options?.finish ?? "normal";
		const category = options?.category ?? "retail";
		const limit = options?.limit ?? 100;
		const offset = options?.offset ?? 0;
		const sql = `SELECT c.name,   arg_min(c.setCode, p.price) AS cheapest_set,   arg_min(c.number, p.price) AS cheapest_number,   arg_min(c.uuid, p.price) AS cheapest_uuid,   MIN(p.price) AS min_price FROM cards c JOIN prices_today p ON c.uuid = p.uuid WHERE p.provider = $1 AND p.finish = $2 AND p.category = $3 AND p.date = (SELECT MAX(date) FROM prices_today) GROUP BY c.name ORDER BY min_price ASC LIMIT ${limit} OFFSET ${offset}`;
		return this._conn.execute(sql, [provider, finish, category]);
	}

	async mostExpensivePrintings(options?: {
		provider?: string;
		finish?: string;
		category?: string;
		limit?: number;
		offset?: number;
	}): Promise<Record<string, unknown>[]> {
		await this._ensure();
		await this._conn.ensureViews("cards");
		if (!this._conn._registeredViews.has("prices_today")) return [];
		const provider = options?.provider ?? "tcgplayer";
		const finish = options?.finish ?? "normal";
		const category = options?.category ?? "retail";
		const limit = options?.limit ?? 100;
		const offset = options?.offset ?? 0;
		const sql = `SELECT c.name,   arg_max(c.setCode, p.price) AS priciest_set,   arg_max(c.number, p.price) AS priciest_number,   arg_max(c.uuid, p.price) AS priciest_uuid,   MAX(p.price) AS max_price FROM cards c JOIN prices_today p ON c.uuid = p.uuid WHERE p.provider = $1 AND p.finish = $2 AND p.category = $3 AND p.date = (SELECT MAX(date) FROM prices_today) GROUP BY c.name ORDER BY max_price DESC LIMIT ${limit} OFFSET ${offset}`;
		return this._conn.execute(sql, [provider, finish, category]);
	}
}

async function loadPricesToDuckdb(
	path: string,
	conn: Connection,
): Promise<void> {
	let text: string;
	if (path.endsWith(".gz")) {
		const compressed = await readFile(path);
		const decompressed = await new Promise<Buffer>((resolve, reject) => {
			const gunzip = createGunzip();
			const chunks: Buffer[] = [];
			gunzip.on("data", (chunk: Buffer) => chunks.push(chunk));
			gunzip.on("end", () => resolve(Buffer.concat(chunks)));
			gunzip.on("error", reject);
			gunzip.end(compressed);
		});
		text = decompressed.toString("utf-8");
	} else {
		text = await readFile(path, "utf-8");
	}

	const raw = JSON.parse(text);
	const data = raw.data ?? {};

	const tmpPath = join(tmpdir(), `mtgjson_prices_${Date.now()}.ndjson`);
	try {
		const count = streamFlattenPrices(data, tmpPath);
		if (count > 0) {
			await conn.registerTableFromNdjson("prices_today", tmpPath);
		}
	} finally {
		try {
			await unlink(tmpPath);
		} catch {
			// ignore
		}
	}
}

function streamFlattenPrices(
	data: Record<string, unknown>,
	outPath: string,
): number {
	const lines: string[] = [];
	let count = 0;

	for (const [uuid, formats] of Object.entries(data)) {
		if (!formats || typeof formats !== "object") continue;
		for (const [source, providers] of Object.entries(
			formats as Record<string, unknown>,
		)) {
			if (!providers || typeof providers !== "object") continue;
			for (const [provider, priceData] of Object.entries(
				providers as Record<string, unknown>,
			)) {
				if (!priceData || typeof priceData !== "object") continue;
				const pd = priceData as Record<string, unknown>;
				const currency = (pd.currency as string) ?? "USD";
				for (const categoryName of ["buylist", "retail"]) {
					const categoryData = pd[categoryName];
					if (!categoryData || typeof categoryData !== "object") continue;
					for (const [finish, datePrices] of Object.entries(
						categoryData as Record<string, unknown>,
					)) {
						if (!datePrices || typeof datePrices !== "object") continue;
						for (const [date, price] of Object.entries(
							datePrices as Record<string, unknown>,
						)) {
							if (price != null) {
								lines.push(
									JSON.stringify({
										uuid,
										source,
										provider,
										currency,
										category: categoryName,
										finish,
										date,
										price: Number(price),
									}),
								);
								count++;
							}
						}
					}
				}
			}
		}
	}

	writeFileSync(outPath, lines.join("\n"), "utf-8");
	return count;
}
