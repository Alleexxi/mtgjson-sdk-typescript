import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Connection } from "../src/connection.js";
import { CardQuery } from "../src/queries/cards.js";
import { createTestConnection } from "./setup.js";

let conn: Connection;
let cards: CardQuery;

beforeAll(async () => {
	conn = await createTestConnection();
	cards = new CardQuery(conn);
});

afterAll(async () => {
	await conn.close();
});

describe("CardQuery", () => {
	it("get by uuid", async () => {
		const card = await cards.getByUuid("card-uuid-001");
		expect(card).not.toBeNull();
		expect(card!.name).toBe("Lightning Bolt");
	});

	it("get by uuid returns null for missing", async () => {
		const card = await cards.getByUuid("nonexistent");
		expect(card).toBeNull();
	});

	it("get by name", async () => {
		const results = await cards.getByName("Lightning Bolt");
		expect(results.length).toBeGreaterThan(0);
		expect(results[0].name).toBe("Lightning Bolt");
	});

	it("get by name with set code", async () => {
		const results = await cards.getByName("Lightning Bolt", {
			setCode: "A25",
		});
		expect(results).toHaveLength(1);
		expect(results[0].setCode).toBe("A25");
	});

	it("search by rarity", async () => {
		const results = await cards.search({ rarity: "uncommon" });
		expect(results.length).toBeGreaterThan(0);
		for (const card of results) {
			expect(card.rarity).toBe("uncommon");
		}
	});

	it("search by mana value", async () => {
		const results = await cards.search({ manaValue: 1.0 });
		expect(results.length).toBeGreaterThan(0);
		expect(results[0].name).toBe("Lightning Bolt");
	});

	it("search by mana value range", async () => {
		const results = await cards.search({
			manaValueGte: 1.0,
			manaValueLte: 2.0,
		});
		expect(results.length).toBeGreaterThanOrEqual(2);
	});

	it("search by colors", async () => {
		const results = await cards.search({ colors: ["R"] });
		expect(results.length).toBeGreaterThan(0);
		for (const card of results) {
			expect(card.colors).toContain("R");
		}
	});

	it("search by text", async () => {
		const results = await cards.search({ text: "damage" });
		expect(results.length).toBeGreaterThan(0);
		expect(results[0].name).toBe("Fire // Ice");
	});

	it("search by layout", async () => {
		const results = await cards.search({ layout: "split" });
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe("Fire // Ice");
	});

	it("search by name pattern", async () => {
		const results = await cards.search({ name: "Lightning%" });
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe("Lightning Bolt");
	});

	it("search by set code", async () => {
		const results = await cards.search({ setCode: "A25" });
		expect(results.length).toBeGreaterThanOrEqual(2);
		for (const card of results) {
			expect(card.setCode).toBe("A25");
		}
	});

	it("search with limit and offset", async () => {
		const page1 = await cards.search({ limit: 1, offset: 0 });
		const page2 = await cards.search({ limit: 1, offset: 1 });
		expect(page1).toHaveLength(1);
		expect(page2).toHaveLength(1);
		expect(page1[0].uuid).not.toBe(page2[0].uuid);
	});

	it("search by legal in format", async () => {
		const results = await cards.search({ legalIn: "modern" });
		expect(results.length).toBeGreaterThan(0);
	});

	it("search by artist", async () => {
		const results = await cards.search({ artist: "Moeller" });
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe("Lightning Bolt");
	});

	it("get by uuids", async () => {
		const results = await cards.getByUuids(["card-uuid-001", "card-uuid-002"]);
		expect(results).toHaveLength(2);
	});

	it("get by uuids empty list", async () => {
		const results = await cards.getByUuids([]);
		expect(results).toHaveLength(0);
	});

	it("get printings", async () => {
		const results = await cards.getPrintings("Lightning Bolt");
		expect(results.length).toBeGreaterThan(0);
	});

	it("get atomic", async () => {
		const results = await cards.getAtomic("Lightning Bolt");
		expect(results.length).toBeGreaterThan(0);
		expect(results[0].name).toBe("Lightning Bolt");
	});

	it("get atomic by face name", async () => {
		const results = await cards.getAtomic("Fire");
		expect(results.length).toBeGreaterThan(0);
	});

	it("count all", async () => {
		const total = await cards.count();
		expect(total).toBe(3);
	});

	it("count with filter", async () => {
		const count = await cards.count({ setCode: "A25" });
		expect(count).toBe(2);
	});

	it("search by localized name", async () => {
		const results = await cards.search({ localizedName: "Blitzschlag" });
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe("Lightning Bolt");
	});

	it("find by scryfall id", async () => {
		const results = await cards.findByScryfallId("scryfall-001");
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe("Lightning Bolt");
	});
});
