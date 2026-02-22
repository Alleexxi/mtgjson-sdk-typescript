import type { Connection } from "../connection.js";
import { SQLBuilder } from "../sql-builder.js";
import type { SetList } from "../types/index.js";

export class SetQuery {
	private _conn: Connection;

	constructor(conn: Connection) {
		this._conn = conn;
	}

	private async _ensure(): Promise<void> {
		await this._conn.ensureViews("sets");
	}

	async get(code: string): Promise<SetList | null> {
		await this._ensure();
		const rows = await this._conn.execute(
			"SELECT * FROM sets WHERE code = $1",
			[code.toUpperCase()],
		);
		return (rows[0] as SetList) ?? null;
	}

	async list(options?: {
		setType?: string;
		name?: string;
		limit?: number;
		offset?: number;
	}): Promise<SetList[]> {
		await this._ensure();
		const q = new SQLBuilder("sets");

		if (options?.setType) q.whereEq("type", options.setType);
		if (options?.name) {
			if (options.name.includes("%")) {
				q.whereLike("name", options.name);
			} else {
				q.whereEq("name", options.name);
			}
		}

		q.orderBy("releaseDate DESC");
		q.limit(options?.limit ?? 1000).offset(options?.offset ?? 0);

		const [sql, params] = q.build();
		return (await this._conn.execute(sql, params)) as SetList[];
	}

	async search(options?: {
		name?: string;
		setType?: string;
		block?: string;
		releaseYear?: number;
		limit?: number;
	}): Promise<SetList[]> {
		await this._ensure();
		const q = new SQLBuilder("sets");

		if (options?.name) q.whereLike("name", `%${options.name}%`);
		if (options?.setType) q.whereEq("type", options.setType);
		if (options?.block) q.whereLike("block", `%${options.block}%`);
		if (options?.releaseYear) {
			const idx = q._params.length + 1;
			q._where.push(`EXTRACT(YEAR FROM CAST(releaseDate AS DATE)) = $${idx}`);
			q._params.push(options.releaseYear);
		}

		q.orderBy("releaseDate DESC");
		q.limit(options?.limit ?? 100);

		const [sql, params] = q.build();
		return (await this._conn.execute(sql, params)) as SetList[];
	}

	async getFinancialSummary(
		setCode: string,
		options?: {
			provider?: string;
			currency?: string;
			finish?: string;
			category?: string;
		},
	): Promise<Record<string, unknown> | null> {
		await this._conn.ensureViews("cards");
		if (!this._conn._registeredViews.has("prices_today")) return null;

		const provider = options?.provider ?? "tcgplayer";
		const currency = options?.currency ?? "USD";
		const finish = options?.finish ?? "normal";
		const category = options?.category ?? "retail";

		const sql = `
			SELECT
				COUNT(DISTINCT c.uuid) AS card_count,
				ROUND(SUM(p.price), 2) AS total_value,
				ROUND(AVG(p.price), 2) AS avg_value,
				MIN(p.price) AS min_value,
				MAX(p.price) AS max_price,
				MAX(p.date) AS date
			FROM cards c
			JOIN prices_today p ON c.uuid = p.uuid
			WHERE c.setCode = $1
			  AND p.provider = $2
			  AND p.currency = $3
			  AND p.finish = $4
			  AND p.category = $5
			  AND p.date = (SELECT MAX(p2.date) FROM prices_today p2)
		`;
		const rows = await this._conn.execute(sql, [
			setCode.toUpperCase(),
			provider,
			currency,
			finish,
			category,
		]);
		if (!rows.length || (rows[0].card_count as number) === 0) return null;
		return rows[0];
	}

	async count(): Promise<number> {
		await this._ensure();
		return (
			((await this._conn.executeScalar(
				"SELECT COUNT(*) FROM sets",
			)) as number) ?? 0
		);
	}
}
