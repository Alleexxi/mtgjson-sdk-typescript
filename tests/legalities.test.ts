import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import type { Connection } from "../src/connection.js";
import { LegalityQuery } from "../src/queries/legalities.js";
import { createTestConnection } from "./setup.js";

let conn: Connection;
let legalities: LegalityQuery;

beforeAll(async () => {
	conn = await createTestConnection();
	legalities = new LegalityQuery(conn);
});

afterAll(async () => {
	await conn.close();
});

describe("LegalityQuery", () => {
	it("formats for card", async () => {
		const formats = await legalities.formatsForCard("card-uuid-001");
		expect(formats.modern).toBe("Legal");
		expect(formats.legacy).toBe("Legal");
		expect(formats.vintage).toBe("Restricted");
		expect(formats.standard).toBe("Not Legal");
	});

	it("is legal", async () => {
		const legal = await legalities.isLegal("card-uuid-001", "modern");
		expect(legal).toBe(true);
	});

	it("is not legal", async () => {
		const legal = await legalities.isLegal("card-uuid-001", "standard");
		expect(legal).toBe(false);
	});

	it("legal in format", async () => {
		const results = await legalities.legalIn("modern");
		expect(results.length).toBeGreaterThan(0);
	});

	it("banned in format", async () => {
		const results = await legalities.bannedIn("modern");
		expect(results).toHaveLength(0);
	});

	it("restricted in format", async () => {
		const results = await legalities.restrictedIn("vintage");
		expect(results).toHaveLength(1);
	});

	it("suspended in format", async () => {
		const results = await legalities.suspendedIn("historic");
		expect(results).toHaveLength(1);
	});
});
