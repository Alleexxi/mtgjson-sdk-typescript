import type { Connection } from "../connection.js";
import type { CardSet } from "../types/index.js";

const KNOWN_ID_COLUMNS = new Set([
	"cardKingdomEtchedId",
	"cardKingdomFoilId",
	"cardKingdomId",
	"cardsphereId",
	"cardsphereFoilId",
	"mcmId",
	"mcmMetaId",
	"mtgArenaId",
	"mtgoFoilId",
	"mtgoId",
	"multiverseId",
	"scryfallId",
	"scryfallIllustrationId",
	"scryfallOracleId",
	"tcgplayerEtchedProductId",
	"tcgplayerProductId",
]);

export class IdentifierQuery {
	private _conn: Connection;

	constructor(conn: Connection) {
		this._conn = conn;
	}

	private async _ensure(): Promise<void> {
		await this._conn.ensureViews("cards", "card_identifiers");
	}

	private async _findBy(idColumn: string, value: string): Promise<CardSet[]> {
		await this._ensure();
		const sql = `SELECT c.* FROM cards c JOIN card_identifiers ci ON c.uuid = ci.uuid WHERE ci.${idColumn} = $1`;
		return (await this._conn.execute(sql, [value])) as CardSet[];
	}

	async findBy(idType: string, value: string): Promise<CardSet[]> {
		if (!KNOWN_ID_COLUMNS.has(idType)) {
			throw new Error(
				`Unknown identifier type '${idType}'. Known types: ${[...KNOWN_ID_COLUMNS].sort().join(", ")}`,
			);
		}
		return this._findBy(idType, value);
	}

	async findByScryfallId(scryfallId: string): Promise<CardSet[]> {
		return this._findBy("scryfallId", scryfallId);
	}

	async findByScryfallOracleId(oracleId: string): Promise<CardSet[]> {
		return this._findBy("scryfallOracleId", oracleId);
	}

	async findByScryfallIllustrationId(
		illustrationId: string,
	): Promise<CardSet[]> {
		return this._findBy("scryfallIllustrationId", illustrationId);
	}

	async findByTcgplayerId(tcgplayerId: string): Promise<CardSet[]> {
		return this._findBy("tcgplayerProductId", tcgplayerId);
	}

	async findByTcgplayerEtchedId(tcgplayerEtchedId: string): Promise<CardSet[]> {
		return this._findBy("tcgplayerEtchedProductId", tcgplayerEtchedId);
	}

	async findByMtgoId(mtgoId: string): Promise<CardSet[]> {
		return this._findBy("mtgoId", mtgoId);
	}

	async findByMtgoFoilId(mtgoFoilId: string): Promise<CardSet[]> {
		return this._findBy("mtgoFoilId", mtgoFoilId);
	}

	async findByMtgArenaId(arenaId: string): Promise<CardSet[]> {
		return this._findBy("mtgArenaId", arenaId);
	}

	async findByMultiverseId(multiverseId: string): Promise<CardSet[]> {
		return this._findBy("multiverseId", multiverseId);
	}

	async findByMcmId(mcmId: string): Promise<CardSet[]> {
		return this._findBy("mcmId", mcmId);
	}

	async findByMcmMetaId(mcmMetaId: string): Promise<CardSet[]> {
		return this._findBy("mcmMetaId", mcmMetaId);
	}

	async findByCardKingdomId(ckId: string): Promise<CardSet[]> {
		return this._findBy("cardKingdomId", ckId);
	}

	async findByCardKingdomFoilId(ckFoilId: string): Promise<CardSet[]> {
		return this._findBy("cardKingdomFoilId", ckFoilId);
	}

	async findByCardKingdomEtchedId(ckEtchedId: string): Promise<CardSet[]> {
		return this._findBy("cardKingdomEtchedId", ckEtchedId);
	}

	async findByCardsphereId(csId: string): Promise<CardSet[]> {
		return this._findBy("cardsphereId", csId);
	}

	async findByCardsphereFoilId(csFoilId: string): Promise<CardSet[]> {
		return this._findBy("cardsphereFoilId", csFoilId);
	}

	async getIdentifiers(uuid: string): Promise<Record<string, unknown> | null> {
		await this._conn.ensureViews("card_identifiers");
		const rows = await this._conn.execute(
			"SELECT * FROM card_identifiers WHERE uuid = $1",
			[uuid],
		);
		return rows[0] ?? null;
	}
}
