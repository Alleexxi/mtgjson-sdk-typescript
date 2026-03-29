import type { Connection } from "../connection.js";
import { SQLBuilder } from "../sql-builder.js";
import type { SealedProduct } from "../types/index.js";

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
	}): Promise<SealedProduct[]> {
		await this._ensure();
		try {
			const q = new SQLBuilder("sealed_products");
			q.select("*");

			if (options?.setCode) {
				q.whereEq("setCode", options.setCode.toUpperCase());
			}

			if (options?.category) {
				q.whereEq("category", options.category);
			}

			if (options?.uuid) {
				q.whereEq("uuid", options.uuid);
			}

			q.limit(options?.limit ?? 100);

			const [sql, params] = q.build();
			const rows = await this._conn.execute(sql, params);

			const products = rows.map((row) => row as SealedProduct);
			return products;
		} catch {
			return [];
		}
	}

	async get(uuid: string): Promise<SealedProduct | null> {
		await this._ensure();
		try {
			const products = await this.list({ uuid: uuid });
			if (products.length === 0) return null;

			const product = products[0];
			if (typeof product === "object") {
				return product;
			}
			return null;
		} catch {
			return null;
		}
	}
}
