import type { Connection } from "../connection.js";
import { SQLBuilder } from "../sql-builder.js";
import type { CardToken } from "../types/index.js";

export class TokenQuery {
	private _conn: Connection;

	constructor(conn: Connection) {
		this._conn = conn;
	}

	private async _ensure(): Promise<void> {
		await this._conn.ensureViews("tokens");
	}

	async getByUuid(uuid: string): Promise<CardToken | null> {
		await this._ensure();
		const rows = await this._conn.execute(
			"SELECT * FROM tokens WHERE uuid = $1",
			[uuid],
		);
		return (rows[0] as CardToken) ?? null;
	}

	async getByUuids(uuids: string[]): Promise<CardToken[]> {
		if (uuids.length === 0) return [];
		await this._ensure();
		const q = new SQLBuilder("tokens").whereIn("uuid", uuids);
		const [sql, params] = q.build();
		return (await this._conn.execute(sql, params)) as CardToken[];
	}

	async getByName(
		name: string,
		options?: { setCode?: string },
	): Promise<CardToken[]> {
		await this._ensure();
		const q = new SQLBuilder("tokens").whereEq("name", name);
		if (options?.setCode) q.whereEq("setCode", options.setCode);
		q.orderBy("setCode DESC", "number ASC");
		const [sql, params] = q.build();
		return (await this._conn.execute(sql, params)) as CardToken[];
	}

	async search(options?: {
		name?: string;
		setCode?: string;
		colors?: string[];
		types?: string;
		artist?: string;
		limit?: number;
		offset?: number;
	}): Promise<CardToken[]> {
		await this._ensure();
		const q = new SQLBuilder("tokens");

		if (options?.name) {
			if (options.name.includes("%")) {
				q.whereLike("name", options.name);
			} else {
				q.whereEq("name", options.name);
			}
		}
		if (options?.setCode) q.whereEq("setCode", options.setCode);
		if (options?.types) q.whereLike("type", `%${options.types}%`);
		if (options?.artist) q.whereLike("artist", `%${options.artist}%`);

		if (options?.colors) {
			for (const color of options.colors) {
				const idx = q._params.length + 1;
				q._where.push(`list_contains(colors, $${idx})`);
				q._params.push(color);
			}
		}

		q.orderBy("name ASC", "number ASC");
		q.limit(options?.limit ?? 100).offset(options?.offset ?? 0);

		const [sql, params] = q.build();
		return (await this._conn.execute(sql, params)) as CardToken[];
	}

	async forSet(setCode: string): Promise<CardToken[]> {
		return this.search({ setCode, limit: 1000 });
	}

	async count(filters?: Record<string, unknown>): Promise<number> {
		await this._ensure();
		if (!filters || Object.keys(filters).length === 0) {
			return (
				((await this._conn.executeScalar(
					"SELECT COUNT(*) FROM tokens",
				)) as number) ?? 0
			);
		}
		const q = new SQLBuilder("tokens").select("COUNT(*)");
		for (const [col, val] of Object.entries(filters)) {
			q.whereEq(col, val);
		}
		const [sql, params] = q.build();
		return ((await this._conn.executeScalar(sql, params)) as number) ?? 0;
	}
}
