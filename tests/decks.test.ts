import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Connection } from "../src/connection.js";
import { createTestConnection } from "./setup.js";

let conn: Connection;

beforeAll(async () => {
	conn = await createTestConnection();
});

afterAll(async () => {
	await conn.close();
});

describe("set_decks table (Connection layer)", () => {
	it("table is registered", async () => {
		const rows = await conn.execute("SELECT COUNT(*) AS cnt FROM set_decks");
		expect(Number(rows[0].cnt)).toBe(2);
	});

	it("mainBoard is parsed as array", async () => {
		const rows = await conn.execute(
			"SELECT mainBoard FROM set_decks WHERE code = $1",
			["A25_DECK1"],
		);
		expect(rows).toHaveLength(1);
		const board = rows[0].mainBoard;
		expect(Array.isArray(board)).toBe(true);
		expect((board as unknown[])[0]).toHaveProperty("uuid");
		expect((board as unknown[])[0]).toHaveProperty("count");
	});

	it("sideBoard is parsed as array", async () => {
		const rows = await conn.execute(
			"SELECT sideBoard FROM set_decks WHERE code = $1",
			["A25_DECK1"],
		);
		expect(rows).toHaveLength(1);
		const board = rows[0].sideBoard;
		expect(Array.isArray(board)).toBe(true);
		expect((board as unknown[]).length).toBe(1);
	});

	it("commander is parsed as empty array", async () => {
		const rows = await conn.execute(
			"SELECT commander FROM set_decks WHERE code = $1",
			["A25_DECK1"],
		);
		expect(rows).toHaveLength(1);
		expect(Array.isArray(rows[0].commander)).toBe(true);
		expect((rows[0].commander as unknown[]).length).toBe(0);
	});

	it("tokens is parsed as array", async () => {
		const rows = await conn.execute(
			"SELECT tokens FROM set_decks WHERE code = $1",
			["A25_DECK1"],
		);
		expect(rows).toHaveLength(1);
		const tokens = rows[0].tokens;
		expect(Array.isArray(tokens)).toBe(true);
		expect((tokens as unknown[])[0]).toHaveProperty("uuid");
		expect((tokens as unknown[])[0]).toHaveProperty("count");
	});

	it("sealedProductUuids is parsed as array", async () => {
		const rows = await conn.execute(
			"SELECT sealedProductUuids FROM set_decks WHERE code = $1",
			["A25_DECK1"],
		);
		expect(rows).toHaveLength(1);
		const uuids = rows[0].sealedProductUuids;
		expect(Array.isArray(uuids)).toBe(true);
		expect(uuids).toContain("sealed-uuid-001");
	});

	it("sourceSetCodes is parsed as array", async () => {
		const rows = await conn.execute(
			"SELECT sourceSetCodes FROM set_decks WHERE code = $1",
			["A25_DECK1"],
		);
		expect(rows).toHaveLength(1);
		const codes = rows[0].sourceSetCodes;
		expect(Array.isArray(codes)).toBe(true);
		expect(codes).toContain("A25");
	});

	it("filters by setCode", async () => {
		const rows = await conn.execute(
			"SELECT * FROM set_decks WHERE setCode = $1",
			["MH2"],
		);
		expect(rows).toHaveLength(1);
		expect(rows[0].name).toBe("Modern Horizons 2 Theme Deck");
	});
});
