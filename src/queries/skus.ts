import type { Connection } from "../connection.js";
import type { TcgplayerSkus } from "../types/index.js";

export class SkuQuery {
	private _conn: Connection;

	constructor(conn: Connection) {
		this._conn = conn;
	}

	private async _ensure(): Promise<void> {
		await this._conn.ensureViews("tcgplayer_skus");
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
