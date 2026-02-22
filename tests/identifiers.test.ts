import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import type { Connection } from "../src/connection.js";
import { IdentifierQuery } from "../src/queries/identifiers.js";
import { createTestConnection } from "./setup.js";

let conn: Connection;
let identifiers: IdentifierQuery;

beforeAll(async () => {
	conn = await createTestConnection();
	identifiers = new IdentifierQuery(conn);
});

afterAll(async () => {
	await conn.close();
});

describe("IdentifierQuery", () => {
	it("find by scryfall id", async () => {
		const results = await identifiers.findByScryfallId("scryfall-001");
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe("Lightning Bolt");
	});

	it("find by scryfall oracle id", async () => {
		const results = await identifiers.findByScryfallOracleId("oracle-001");
		expect(results).toHaveLength(1);
	});

	it("find by scryfall illustration id", async () => {
		const results =
			await identifiers.findByScryfallIllustrationId("illust-001");
		expect(results).toHaveLength(1);
	});

	it("find by tcgplayer id", async () => {
		const results = await identifiers.findByTcgplayerId("12345");
		expect(results).toHaveLength(1);
	});

	it("find by mtgo id", async () => {
		const results = await identifiers.findByMtgoId("mtgo-001");
		expect(results).toHaveLength(1);
	});

	it("find by mtgo foil id", async () => {
		const results = await identifiers.findByMtgoFoilId("mtgo-foil-001");
		expect(results).toHaveLength(1);
	});

	it("find by mtg arena id", async () => {
		const results = await identifiers.findByMtgArenaId("arena-001");
		expect(results).toHaveLength(1);
	});

	it("find by multiverse id", async () => {
		const results = await identifiers.findByMultiverseId("442130");
		expect(results).toHaveLength(1);
	});

	it("find by mcm id", async () => {
		const results = await identifiers.findByMcmId("mcm-001");
		expect(results).toHaveLength(1);
	});

	it("find by card kingdom id", async () => {
		const results = await identifiers.findByCardKingdomId("ck-001");
		expect(results).toHaveLength(1);
	});

	it("find by card kingdom foil id", async () => {
		const results = await identifiers.findByCardKingdomFoilId("ck-foil-001");
		expect(results).toHaveLength(1);
	});

	it("find by cardsphere id", async () => {
		const results = await identifiers.findByCardsphereId("cs-001");
		expect(results).toHaveLength(1);
	});

	it("find by cardsphere foil id", async () => {
		const results = await identifiers.findByCardsphereFoilId("cs-foil-001");
		expect(results).toHaveLength(1);
	});

	it("generic find by", async () => {
		const results = await identifiers.findBy("scryfallId", "scryfall-002");
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe("Counterspell");
	});

	it("generic find by rejects unknown type", async () => {
		await expect(identifiers.findBy("unknownField", "value")).rejects.toThrow(
			"Unknown identifier type",
		);
	});

	it("get identifiers", async () => {
		const ids = await identifiers.getIdentifiers("card-uuid-001");
		expect(ids).not.toBeNull();
		expect(ids!.scryfallId).toBe("scryfall-001");
	});

	it("get identifiers returns null for missing", async () => {
		const ids = await identifiers.getIdentifiers("nonexistent");
		expect(ids).toBeNull();
	});
});
