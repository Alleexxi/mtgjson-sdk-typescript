import type { Connection } from "../connection.js";
import { SQLBuilder } from "../sql-builder.js";
import type { CardAtomic, CardSet } from "../types/index.js";

export class CardQuery {
	private _conn: Connection;

	constructor(conn: Connection) {
		this._conn = conn;
	}

	private async _ensure(): Promise<void> {
		await this._conn.ensureViews("cards");
	}

	async getByUuid(uuid: string): Promise<CardSet | null> {
		await this._ensure();
		const rows = await this._conn.execute(
			"SELECT * FROM cards WHERE uuid = $1",
			[uuid],
		);
		return (rows[0] as CardSet) ?? null;
	}

	async getByUuids(uuids: string[]): Promise<CardSet[]> {
		if (uuids.length === 0) return [];
		await this._ensure();
		const q = new SQLBuilder("cards").whereIn("uuid", uuids);
		const [sql, params] = q.build();
		return (await this._conn.execute(sql, params)) as CardSet[];
	}

	async getByName(
		name: string,
		options?: { setCode?: string },
	): Promise<CardSet[]> {
		await this._ensure();
		const q = new SQLBuilder("cards").whereEq("name", name);
		if (options?.setCode) q.whereEq("setCode", options.setCode);
		q.orderBy("setCode DESC", "number ASC");
		const [sql, params] = q.build();
		return (await this._conn.execute(sql, params)) as CardSet[];
	}

	async search(options?: {
		name?: string;
		fuzzyName?: string;
		localizedName?: string;
		setCode?: string;
		colors?: string[];
		colorIdentity?: string[];
		types?: string;
		rarity?: string;
		legalIn?: string;
		manaValue?: number;
		manaValueLte?: number;
		manaValueGte?: number;
		text?: string;
		textRegex?: string;
		power?: string;
		toughness?: string;
		artist?: string;
		keyword?: string;
		isPromo?: boolean;
		availability?: string;
		language?: string;
		layout?: string;
		setType?: string;
		limit?: number;
		offset?: number;
	}): Promise<CardSet[]> {
		await this._ensure();
		const q = new SQLBuilder("cards");
		const opts = options ?? {};
		const limit = opts.limit ?? 100;
		const offset = opts.offset ?? 0;

		if (opts.name) {
			if (opts.name.includes("%")) {
				q.whereLike("name", opts.name);
			} else {
				q.whereEq("name", opts.name);
			}
		}
		if (opts.fuzzyName) {
			q.whereFuzzy("cards.name", opts.fuzzyName, 0.8);
		}
		if (opts.setCode) q.whereEq("setCode", opts.setCode);
		if (opts.rarity) q.whereEq("rarity", opts.rarity);
		if (opts.manaValue !== undefined) q.whereEq("manaValue", opts.manaValue);
		if (opts.manaValueLte !== undefined)
			q.whereLte("manaValue", opts.manaValueLte);
		if (opts.manaValueGte !== undefined)
			q.whereGte("manaValue", opts.manaValueGte);
		if (opts.text) q.whereLike("text", `%${opts.text}%`);
		if (opts.textRegex) q.whereRegex("text", opts.textRegex);
		if (opts.types) q.whereLike("type", `%${opts.types}%`);
		if (opts.power) q.whereEq("power", opts.power);
		if (opts.toughness) q.whereEq("toughness", opts.toughness);
		if (opts.artist) q.whereLike("artist", `%${opts.artist}%`);
		if (opts.language) q.whereEq("language", opts.language);
		if (opts.layout) q.whereEq("layout", opts.layout);
		if (opts.isPromo !== undefined) {
			if (opts.isPromo) {
				q.whereEq("isPromo", true);
			} else {
				q._where.push("(isPromo IS NULL OR isPromo = false)");
			}
		}

		if (opts.colors) {
			for (const color of opts.colors) {
				const idx = q._params.length + 1;
				q._where.push(`list_contains(colors, $${idx})`);
				q._params.push(color);
			}
		}
		if (opts.colorIdentity) {
			for (const color of opts.colorIdentity) {
				const idx = q._params.length + 1;
				q._where.push(`list_contains(colorIdentity, $${idx})`);
				q._params.push(color);
			}
		}
		if (opts.keyword) {
			const idx = q._params.length + 1;
			q._where.push(`list_contains(keywords, $${idx})`);
			q._params.push(opts.keyword);
		}
		if (opts.availability) {
			const idx = q._params.length + 1;
			q._where.push(`list_contains(availability, $${idx})`);
			q._params.push(opts.availability);
		}

		if (opts.localizedName) {
			await this._conn.ensureViews("card_foreign_data");
			q.select("cards.*");
			q.join("JOIN card_foreign_data cfd ON cards.uuid = cfd.uuid");
			if (opts.localizedName.includes("%")) {
				q.whereLike("cfd.name", opts.localizedName);
			} else {
				q.whereEq("cfd.name", opts.localizedName);
			}
		}

		if (opts.legalIn) {
			await this._conn.ensureViews("card_legalities");
			q.join("JOIN card_legalities cl ON cards.uuid = cl.uuid");
			q.whereEq("cl.format", opts.legalIn);
			q.whereEq("cl.status", "Legal");
		}

		if (opts.setType) {
			await this._conn.ensureViews("sets");
			q.select("cards.*");
			q.join("JOIN sets s ON cards.setCode = s.code");
			q.whereEq("s.type", opts.setType);
		}

		if (opts.fuzzyName) {
			const simIdx = q._params.length + 1;
			q._params.push(opts.fuzzyName);
			q.orderBy(
				`jaro_winkler_similarity(cards.name, $${simIdx}) DESC`,
				"cards.number ASC",
			);
		} else {
			q.orderBy("cards.name ASC", "cards.number ASC");
		}

		q.limit(limit).offset(offset);
		const [sql, params] = q.build();
		return (await this._conn.execute(sql, params)) as CardSet[];
	}

	async getPrintings(name: string): Promise<CardSet[]> {
		return this.getByName(name);
	}

	async getAtomic(name: string): Promise<CardAtomic[]> {
		await this._ensure();
		const atomicCols = [
			"name",
			"asciiName",
			"faceName",
			"type",
			"types",
			"subtypes",
			"supertypes",
			"colors",
			"colorIdentity",
			"colorIndicator",
			"producedMana",
			"manaCost",
			"text",
			"layout",
			"side",
			"power",
			"toughness",
			"loyalty",
			"keywords",
			"isFunny",
			"edhrecSaltiness",
			"subsets",
			"manaValue",
			"faceConvertedManaCost",
			"faceManaValue",
			"defense",
			"hand",
			"life",
			"edhrecRank",
			"hasAlternativeDeckLimit",
			"isReserved",
			"isGameChanger",
			"printings",
			"leadershipSkills",
			"relatedCards",
		];

		const q = new SQLBuilder("cards");
		q.select(...atomicCols);
		q.whereEq("name", name);
		q.orderBy(
			"isFunny ASC NULLS FIRST",
			"isOnlineOnly ASC NULLS FIRST",
			"side ASC NULLS FIRST",
		);
		const [sql, params] = q.build();
		let rows = await this._conn.execute(sql, params);

		// Fallback: search by faceName for split/adventure/MDFC cards
		if (rows.length === 0) {
			const q2 = new SQLBuilder("cards");
			q2.select(...atomicCols);
			q2.where("CAST(faceName AS VARCHAR) = $1", name);
			q2.orderBy(
				"isFunny ASC NULLS FIRST",
				"isOnlineOnly ASC NULLS FIRST",
				"side ASC NULLS FIRST",
			);
			const [sql2, params2] = q2.build();
			rows = await this._conn.execute(sql2, params2);
		}

		if (rows.length === 0) return [];

		// De-duplicate by name+faceName
		const seen = new Set<string>();
		const unique: Record<string, unknown>[] = [];
		for (const r of rows) {
			const key = `${r.name ?? ""}|${r.faceName ?? ""}`;
			if (!seen.has(key)) {
				seen.add(key);
				unique.push(r);
			}
		}
		return unique as CardAtomic[];
	}

	async findByScryfallId(scryfallId: string): Promise<CardSet[]> {
		await this._conn.ensureViews("cards", "card_identifiers");
		const sql =
			"SELECT c.* FROM cards c " +
			"JOIN card_identifiers ci ON c.uuid = ci.uuid " +
			"WHERE ci.scryfallId = $1";
		return (await this._conn.execute(sql, [scryfallId])) as CardSet[];
	}

	async random(count = 1): Promise<CardSet[]> {
		await this._ensure();
		const sql = `SELECT * FROM cards USING SAMPLE ${count}`;
		return (await this._conn.execute(sql)) as CardSet[];
	}

	async count(filters?: Record<string, unknown>): Promise<number> {
		await this._ensure();
		if (!filters || Object.keys(filters).length === 0) {
			return (
				((await this._conn.executeScalar(
					"SELECT COUNT(*) FROM cards",
				)) as number) ?? 0
			);
		}
		const q = new SQLBuilder("cards").select("COUNT(*)");
		for (const [col, val] of Object.entries(filters)) {
			q.whereEq(col, val);
		}
		const [sql, params] = q.build();
		return ((await this._conn.executeScalar(sql, params)) as number) ?? 0;
	}
}
