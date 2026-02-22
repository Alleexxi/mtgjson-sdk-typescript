import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import type { MtgjsonSDK } from "../src/client.js";
import { Connection } from "../src/connection.js";
import { createTestSdk } from "./setup.js";

let sdk: MtgjsonSDK;

beforeAll(async () => {
	sdk = await createTestSdk();
});

afterAll(async () => {
	await sdk.close();
});

describe("MtgjsonSDK", () => {
	it("sql query", async () => {
		const rows = await sdk.sql("SELECT name FROM cards ORDER BY name");
		expect(rows.length).toBe(3);
	});

	it("sql query with params", async () => {
		const rows = await sdk.sql("SELECT name FROM cards WHERE uuid = $1", [
			"card-uuid-001",
		]);
		expect(rows).toHaveLength(1);
		expect(rows[0].name).toBe("Lightning Bolt");
	});

	it("views list", () => {
		const views = sdk.views;
		expect(views).toContain("cards");
		expect(views).toContain("sets");
	});

	it("lazy card query", async () => {
		const card = await sdk.cards.getByUuid("card-uuid-001");
		expect(card).not.toBeNull();
		expect(card!.name).toBe("Lightning Bolt");
	});

	it("lazy set query", async () => {
		const set = await sdk.sets.get("A25");
		expect(set).not.toBeNull();
		expect(set!.name).toBe("Masters 25");
	});

	it("lazy token query", async () => {
		const token = await sdk.tokens.getByUuid("token-uuid-001");
		expect(token).not.toBeNull();
		expect(token!.name).toBe("Soldier Token");
	});

	it("lazy legality query", async () => {
		const legal = await sdk.legalities.isLegal("card-uuid-001", "modern");
		expect(legal).toBe(true);
	});

	it("lazy identifier query", async () => {
		const results = await sdk.identifiers.findByScryfallId("scryfall-001");
		expect(results).toHaveLength(1);
	});

	it("refresh returns false when not stale", async () => {
		const refreshed = await sdk.refresh();
		expect(refreshed).toBe(false);
	});
});

describe("MtgjsonSDK create/close lifecycle", () => {
	it("create and close", async () => {
		const sdk2 = await createTestSdk();
		const card = await sdk2.cards.getByUuid("card-uuid-001");
		expect(card).not.toBeNull();
		await sdk2.close();
	});
});
