import type { Connection } from "../connection.js";
import { SQLBuilder } from "../sql-builder.js";

export class SealedQuery {
	private _conn: Connection;

	constructor(conn: Connection) {
		this._conn = conn;
	}

	private async _ensure(): Promise<void> {
		await this._conn.ensureViews("sets");
	}

	async list(options?: {
		setCode?: string;
		category?: string;
		limit?: number;
	}): Promise<Record<string, unknown>[]> {
		await this._ensure();
		try {
			const q = new SQLBuilder("sets");
			q.select("code", "name AS setName", "sealedProduct");

			if (options?.setCode) {
				q.whereEq("code", options.setCode.toUpperCase());
			}
			q.limit(options?.limit ?? 100);

			const [sql, params] = q.build();
			const rows = await this._conn.execute(sql, params);

			const products: Record<string, unknown>[] = [];
			for (const row of rows) {
				const sealed = row.sealedProduct;
				if (sealed && Array.isArray(sealed)) {
					for (const sp of sealed) {
						if (sp && typeof sp === "object") {
							const product = sp as Record<string, unknown>;
							if (options?.category && product.category !== options.category) {
								continue;
							}
							product.setCode = row.code;
							products.push(product);
						}
					}
				}
			}
			return products;
		} catch {
			return [];
		}
	}

	async get(uuid: string): Promise<Record<string, unknown> | null> {
		await this._ensure();
		try {
			const sql =
				"SELECT sub.code AS setCode, sub.sp " +
				"FROM (" +
				"  SELECT code, UNNEST(sealedProduct) AS sp " +
				"  FROM sets WHERE sealedProduct IS NOT NULL" +
				") sub " +
				"WHERE sub.sp.uuid = $1 " +
				"LIMIT 1";
			const rows = await this._conn.execute(sql, [uuid]);
			if (rows.length === 0) return null;
			const row = rows[0];
			const product = (row.sp ?? {}) as Record<string, unknown>;
			if (typeof product === "object") {
				product.setCode = row.setCode;
				return product;
			}
			return null;
		} catch {
			return null;
		}
	}
}
