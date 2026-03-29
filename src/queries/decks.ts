import type { Connection } from "../connection.js";
import { SQLBuilder } from "../sql-builder.js";
import type { DeckSet } from "../types/index.js";

export class DeckQuery {
	private _conn: Connection;

	constructor(conn: Connection) {
		this._conn = conn;
	}

	private async _ensure(): Promise<void> {
		await this._conn.ensureViews("set_decks");
	}

	async list(options?: {
		setCode?: string;
		deckType?: string;
		limit?: number;
		name?: string;
	}): Promise<DeckSet[]> {
		await this._ensure();

		try {
			const q = new SQLBuilder("set_decks");
			q.select("*");

			if (options?.setCode) {
				q.whereEq("setCode", options.setCode.toUpperCase());
			}

			if (options?.deckType) {
				q.whereEq("type", options.deckType);
			}

			if (options?.name) {
				q.whereEq("name", options.name);
			}

			q.limit(options?.limit ?? 100);

			const [sql, params] = q.build();
			const rows = await this._conn.execute(sql, params);

			const decks = rows.map((row) => row as DeckSet);
			return decks;
		} catch {
			return [];
		}
	}

	async search(options?: {
		name?: string;
		setCode?: string;
	}): Promise<DeckSet[]> {
		await this._ensure();

		try {
			const q = new SQLBuilder("set_decks");
			q.select("*");

			if (options?.setCode) {
				q.whereEq("setCode", options.setCode.toUpperCase());
			}

			if (options?.name) {
				q.whereLike("name", `%${options.name}%`);
			}

			const [sql, params] = q.build();
			const rows = await this._conn.execute(sql, params);

			const decks = rows.map((row) => row as DeckSet);
			return decks;
		} catch {
			return [];
		}
	}

	async count(): Promise<number> {
		await this._ensure();
		const result = await this._conn.executeScalar(
			"SELECT COUNT(*) FROM set_decks",
		);
		return (result as number) ?? 0;
	}
}
