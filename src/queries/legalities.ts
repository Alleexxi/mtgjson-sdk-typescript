import type { Connection } from "../connection.js";
import type { CardSet } from "../types/index.js";

export class LegalityQuery {
	private _conn: Connection;

	constructor(conn: Connection) {
		this._conn = conn;
	}

	private async _ensure(): Promise<void> {
		await this._conn.ensureViews("card_legalities");
	}

	private async _cardsByStatus(
		formatName: string,
		status: string,
		options?: { limit?: number; offset?: number },
	): Promise<Record<string, unknown>[]> {
		await this._ensure();
		await this._conn.ensureViews("cards");
		const limit = options?.limit ?? 100;
		const offset = options?.offset ?? 0;
		return this._conn.execute(
			`SELECT c.name, c.uuid FROM cards c JOIN card_legalities cl ON c.uuid = cl.uuid WHERE cl.format = $1 AND cl.status = $2 ORDER BY c.name ASC LIMIT ${limit} OFFSET ${offset}`,
			[formatName, status],
		);
	}

	async formatsForCard(uuid: string): Promise<Record<string, string>> {
		await this._ensure();
		const rows = await this._conn.execute(
			"SELECT format, status FROM card_legalities WHERE uuid = $1",
			[uuid],
		);
		const result: Record<string, string> = {};
		for (const r of rows) {
			result[r.format as string] = r.status as string;
		}
		return result;
	}

	async legalIn(
		formatName: string,
		options?: { limit?: number; offset?: number },
	): Promise<CardSet[]> {
		await this._conn.ensureViews("cards", "card_legalities");
		const limit = options?.limit ?? 100;
		const offset = options?.offset ?? 0;
		const sql = `SELECT DISTINCT c.* FROM cards c JOIN card_legalities cl ON c.uuid = cl.uuid WHERE cl.format = $1 AND cl.status = 'Legal' ORDER BY c.name ASC LIMIT ${limit} OFFSET ${offset}`;
		return (await this._conn.execute(sql, [formatName])) as CardSet[];
	}

	async isLegal(uuid: string, formatName: string): Promise<boolean> {
		await this._ensure();
		const result = await this._conn.executeScalar(
			"SELECT COUNT(*) FROM card_legalities " +
				"WHERE uuid = $1 AND format = $2 AND status = 'Legal'",
			[uuid, formatName],
		);
		return ((result as number) ?? 0) > 0;
	}

	async bannedIn(
		formatName: string,
		options?: { limit?: number; offset?: number },
	): Promise<Record<string, unknown>[]> {
		return this._cardsByStatus(formatName, "Banned", options);
	}

	async restrictedIn(
		formatName: string,
		options?: { limit?: number; offset?: number },
	): Promise<Record<string, unknown>[]> {
		return this._cardsByStatus(formatName, "Restricted", options);
	}

	async suspendedIn(
		formatName: string,
		options?: { limit?: number; offset?: number },
	): Promise<Record<string, unknown>[]> {
		return this._cardsByStatus(formatName, "Suspended", options);
	}

	async notLegalIn(
		formatName: string,
		options?: { limit?: number; offset?: number },
	): Promise<Record<string, unknown>[]> {
		return this._cardsByStatus(formatName, "Not Legal", options);
	}
}
