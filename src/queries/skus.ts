import { writeFileSync } from "node:fs";
import { readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createGunzip } from "node:zlib";
import type { CacheManager } from "../cache.js";
import type { Connection } from "../connection.js";
import type { TcgplayerSkus } from "../types/index.js";

export class SkuQuery {
	private _conn: Connection;
	private _cache: CacheManager;
	private _loaded = false;

	constructor(conn: Connection, cache: CacheManager) {
		this._conn = conn;
		this._cache = cache;
	}

	private async _ensure(): Promise<void> {
		if (this._loaded) return;
		if (this._conn._registeredViews.has("tcgplayer_skus")) {
			this._loaded = true;
			return;
		}
		try {
			const path = await this._cache.ensureJson("tcgplayer_skus");
			await loadSkusToDuckdb(path, this._conn);
		} catch {
			// SKU data not available
		}
		this._loaded = true;
	}

	async get(uuid: string): Promise<TcgplayerSkus[]> {
		await this._ensure();
		const rows = await this._conn.execute(
			"SELECT * FROM tcgplayer_skus WHERE uuid = $1",
			[uuid],
		);
		return rows as unknown as TcgplayerSkus[];
	}

	async findBySkuId(skuId: number): Promise<Record<string, unknown> | null> {
		await this._ensure();
		const rows = await this._conn.execute(
			"SELECT * FROM tcgplayer_skus WHERE skuId = $1",
			[skuId],
		);
		return rows[0] ?? null;
	}

	async findByProductId(productId: number): Promise<Record<string, unknown>[]> {
		await this._ensure();
		return this._conn.execute(
			"SELECT * FROM tcgplayer_skus WHERE productId = $1",
			[productId],
		);
	}
}

async function loadSkusToDuckdb(path: string, conn: Connection): Promise<void> {
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

	const tmpPath = join(tmpdir(), `mtgjson_skus_${Date.now()}.ndjson`);
	try {
		const lines: string[] = [];
		let count = 0;
		for (const [uuid, skus] of Object.entries(data)) {
			if (!Array.isArray(skus)) continue;
			for (const sku of skus) {
				if (sku && typeof sku === "object") {
					const row = { ...(sku as Record<string, unknown>), uuid };
					lines.push(JSON.stringify(row));
					count++;
				}
			}
		}
		if (count > 0) {
			writeFileSync(tmpPath, lines.join("\n"), "utf-8");
			await conn.registerTableFromNdjson("tcgplayer_skus", tmpPath);
		}
	} finally {
		try {
			await unlink(tmpPath);
		} catch {
			// ignore
		}
	}
}
