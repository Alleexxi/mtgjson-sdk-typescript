import type { Connection } from "../connection.js";
import { SQLBuilder } from "../sql-builder.js";

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
		name?: string;
		namePartialSearch?: boolean;
	}): Promise<Record<string, unknown>[]> {
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
				if (options?.namePartialSearch) {
					q.whereLike("name", `%${options.name}%`);
				} else {
					q.whereEq("name", options.name);
				}
			}

			const [sql, params] = q.build();
			const rows = await this._conn.execute(sql, params);

			const decks: Record<string, unknown>[] = [];
			for (const row of rows) {
				const deck = row as Record<string, unknown>;

				const jsonFields = ["sealedProductUuids", "sourceSetCodes", "mainBoard", "sideBoard", "commander", "displayCommander", "tokens", "planes", "schemes", "identifiers", "purchaseUrls"];
				for (const field of jsonFields) {
					if (typeof deck[field] === "string") {
						try {
							deck[field] = JSON.parse(deck[field] as string);
						} catch {
						}
					} else if (Array.isArray(deck[field])) {
						try {
							const joined = (deck[field] as string[]).join("");
							deck[field] = JSON.parse(joined);
						} catch {
						}
					}
				}

				decks.push(deck);
			}

			return decks;
		} catch (error) {
			return [];
		}
	}

	async search(options?: {
		name?: string;
		setCode?: string;
	}): Promise<Record<string, unknown>[]> {
		await this._ensure();
		return await this.list({ ...options, namePartialSearch: true });
	}

	async count(): Promise<number> {
		await this._ensure();
		const allDecks = await this.list();
		return allDecks.length;
	}
}
