import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Connection } from "../src/connection.js";
import { TokenQuery } from "../src/queries/tokens.js";
import { createTestConnection } from "./setup.js";

let conn: Connection;
let tokens: TokenQuery;

beforeAll(async () => {
	conn = await createTestConnection();
	tokens = new TokenQuery(conn);
});

afterAll(async () => {
	await conn.close();
});

describe("TokenQuery", () => {
	it("get by uuid", async () => {
		const token = await tokens.getByUuid("token-uuid-001");
		expect(token).not.toBeNull();
		expect(token!.name).toBe("Soldier Token");
	});

	it("get by uuid returns null for missing", async () => {
		const token = await tokens.getByUuid("nonexistent");
		expect(token).toBeNull();
	});

	it("get by name", async () => {
		const results = await tokens.getByName("Soldier Token");
		expect(results).toHaveLength(1);
	});

	it("search by set code", async () => {
		const results = await tokens.search({ setCode: "A25" });
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe("Soldier Token");
	});

	it("search by colors", async () => {
		const results = await tokens.search({ colors: ["W"] });
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe("Soldier Token");
	});

	it("for set", async () => {
		const results = await tokens.forSet("MH2");
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe("Beast Token");
	});

	it("count all", async () => {
		const total = await tokens.count();
		expect(total).toBe(2);
	});

	it("get by uuids", async () => {
		const results = await tokens.getByUuids([
			"token-uuid-001",
			"token-uuid-002",
		]);
		expect(results).toHaveLength(2);
	});

	it("get by uuids empty", async () => {
		const results = await tokens.getByUuids([]);
		expect(results).toHaveLength(0);
	});
});
