import type { Connection } from "../connection.js";
import { SQLBuilder } from "../sql-builder.js";

export class SealedQuery {
	private _conn: Connection;

	constructor(conn: Connection) {
		this._conn = conn;
	}

	private async _ensure(): Promise<void> {
		await this._conn.ensureViews("sealed_products");
	}

	async list(options?: {
		setCode?: string;
		category?: string;
		limit?: number;
		uuid?: string;
	}): Promise<Record<string, unknown>[]> {
		await this._ensure();
		try {
			const q = new SQLBuilder("sealed_products");
			q.select("*");

			if (options?.setCode) {
				q.whereEq("setCode", options.setCode.toUpperCase());
			}

			if (options?.uuid) {
				q.whereEq("uuid", options.uuid);
			}

			q.limit(options?.limit ?? 100);

			const [sql, params] = q.build();
			const rows = await this._conn.execute(sql, params);

			const products: Record<string, unknown>[] = [];
			for (const row of rows) {
				if (options?.category && row.category !== options.category) {
					continue;
				}

				const product = row as Record<string, unknown>;
				let sealed: unknown = undefined;

				if (!row.contents) {
					sealed = undefined;
				} else if (Array.isArray(row.contents)) {
					const joined = row.contents.join("");
					sealed = typeof joined === "string" ? JSON.parse(joined) : row.contents;
				} else {
					sealed = row.contents;
				}

				product.contents = sealed

				if (typeof product.identifiers === "string") {
					try {
						product.identifiers = JSON.parse(product.identifiers);
					} catch {
					}
				}

				if (typeof product.purchaseUrls === "string") {
					try {
						product.purchaseUrls = JSON.parse(product.purchaseUrls);
					} catch {
					}
				}

				products.push(product);
			}

			return products;
		} catch (error) {
			return [];
		}
	}

	async get(uuid: string): Promise<Record<string, unknown> | null> {
		await this._ensure();
		try {
			const products = await this.list({uuid: uuid})
			if (products.length === 0) return null;

			const product = products[0]
			if (typeof product === "object") {
				return product;
			}
			return null;
		} catch {
			return null;
		}
	}
}
