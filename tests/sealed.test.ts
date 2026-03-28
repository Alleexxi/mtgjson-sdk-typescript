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

describe("sealed_products table (Connection layer)", () => {
	it("table is registered", async () => {
		const rows = await conn.execute("SELECT COUNT(*) AS cnt FROM sealed_products");
		expect(Number(rows[0].cnt)).toBe(3);
	});

	it("contents is parsed as object", async () => {
		const rows = await conn.execute(
			"SELECT contents FROM sealed_products WHERE uuid = $1",
			["sealed-uuid-001"],
		);
		expect(rows).toHaveLength(1);
		expect(typeof rows[0].contents).toBe("object");
		expect(rows[0].contents).toHaveProperty("pack");
	});

	it("identifiers is parsed as object", async () => {
		const rows = await conn.execute(
			"SELECT identifiers FROM sealed_products WHERE uuid = $1",
			["sealed-uuid-001"],
		);
		expect(rows).toHaveLength(1);
		expect(typeof rows[0].identifiers).toBe("object");
		expect((rows[0].identifiers as Record<string, unknown>).tcgplayerProductId).toBe("162583");
	});

	it("purchaseUrls is parsed as object", async () => {
		const rows = await conn.execute(
			"SELECT purchaseUrls FROM sealed_products WHERE uuid = $1",
			["sealed-uuid-001"],
		);
		expect(rows).toHaveLength(1);
		expect(typeof rows[0].purchaseUrls).toBe("object");
		expect(rows[0].purchaseUrls).toHaveProperty("tcgplayer");
	});

	it("filters by setCode", async () => {
		const rows = await conn.execute(
			"SELECT * FROM sealed_products WHERE setCode = $1",
			["A25"],
		);
		expect(rows).toHaveLength(2);
	});

	it("filters by category", async () => {
		const rows = await conn.execute(
			"SELECT * FROM sealed_products WHERE category = $1",
			["booster_box"],
		);
		expect(rows).toHaveLength(2);
	});
});
