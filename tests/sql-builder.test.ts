import { describe, expect, it } from "bun:test";
import { DuckDBInstance } from "@duckdb/node-api";
import { SQLBuilder } from "../src/sql-builder.js";

describe("SQLBuilder", () => {
	it("basic select", () => {
		const [sql, params] = new SQLBuilder("cards").build();
		expect(sql).toBe("SELECT *\nFROM cards");
		expect(params).toEqual([]);
	});

	it("where eq", () => {
		const [sql, params] = new SQLBuilder("cards")
			.whereEq("name", "Bolt")
			.build();
		expect(sql).toContain("WHERE name = $1");
		expect(params).toEqual(["Bolt"]);
	});

	it("where gte/lte", () => {
		const [sql, params] = new SQLBuilder("cards")
			.whereGte("manaValue", 2.0)
			.whereLte("manaValue", 5.0)
			.build();
		expect(sql).toContain("manaValue >= $1");
		expect(sql).toContain("manaValue <= $2");
		expect(params).toEqual([2.0, 5.0]);
	});

	it("where or", () => {
		const [sql, params] = new SQLBuilder("cards")
			.whereOr(["name = $1", "Lightning Bolt"], ["name = $1", "Counterspell"])
			.build();
		expect(sql).toContain("(name = $1 OR name = $2)");
		expect(params).toEqual(["Lightning Bolt", "Counterspell"]);
	});

	it("where or combined with and", () => {
		const [sql, params] = new SQLBuilder("cards")
			.whereEq("setCode", "A25")
			.whereOr(["rarity = $1", "rare"], ["rarity = $1", "mythic"])
			.build();
		expect(sql).toContain("setCode = $1");
		expect(sql).toContain("(rarity = $2 OR rarity = $3)");
		expect(params).toEqual(["A25", "rare", "mythic"]);
	});

	it("group by", () => {
		const [sql] = new SQLBuilder("cards")
			.select("setCode", "COUNT(*)")
			.groupBy("setCode")
			.build();
		expect(sql).toContain("GROUP BY setCode");
	});

	it("having", () => {
		const [sql, params] = new SQLBuilder("cards")
			.select("setCode", "COUNT(*) AS cnt")
			.groupBy("setCode")
			.having("COUNT(*) > $1", 10)
			.build();
		expect(sql).toContain("HAVING COUNT(*) > $1");
		expect(params).toEqual([10]);
	});

	it("distinct", () => {
		const [sql] = new SQLBuilder("cards").select("name").distinct().build();
		expect(sql).toMatch(/^SELECT DISTINCT name/);
	});

	it("where regex", () => {
		const [sql, params] = new SQLBuilder("cards")
			.whereRegex("text", "deals \\d+ damage")
			.build();
		expect(sql).toContain("regexp_matches(text, $1)");
		expect(params).toEqual(["deals \\d+ damage"]);
	});

	it("where regex with other conditions", () => {
		const [sql, params] = new SQLBuilder("cards")
			.whereEq("setCode", "A25")
			.whereRegex("text", "^Draw")
			.build();
		expect(sql).toContain("setCode = $1");
		expect(sql).toContain("regexp_matches(text, $2)");
		expect(params).toEqual(["A25", "^Draw"]);
	});

	it("where fuzzy", () => {
		const [sql, params] = new SQLBuilder("cards")
			.whereFuzzy("name", "Ligtning Bolt")
			.build();
		expect(sql).toContain("jaro_winkler_similarity(name, $1) > 0.8");
		expect(params).toEqual(["Ligtning Bolt"]);
	});

	it("where fuzzy custom threshold", () => {
		const [sql, params] = new SQLBuilder("cards")
			.whereFuzzy("name", "Bolt", 0.9)
			.build();
		expect(sql).toContain("jaro_winkler_similarity(name, $1) > 0.9");
		expect(params).toEqual(["Bolt"]);
	});

	it("where fuzzy with other conditions", () => {
		const [sql, params] = new SQLBuilder("cards")
			.whereEq("setCode", "A25")
			.whereFuzzy("name", "Ligtning Bolt")
			.build();
		expect(sql).toContain("setCode = $1");
		expect(sql).toContain("jaro_winkler_similarity(name, $2) > 0.8");
		expect(params).toEqual(["A25", "Ligtning Bolt"]);
	});

	it("full query", () => {
		const [sql, params] = new SQLBuilder("prices_today")
			.select("provider", "AVG(price) AS avg_price")
			.whereEq("uuid", "abc-123")
			.whereGte("date", "2024-01-01")
			.groupBy("provider")
			.having("AVG(price) > $1", 1.0)
			.orderBy("avg_price DESC")
			.limit(10)
			.build();
		expect(sql).toContain("SELECT provider, AVG(price) AS avg_price");
		expect(sql).toContain("WHERE uuid = $1 AND date >= $2");
		expect(sql).toContain("GROUP BY provider");
		expect(sql).toContain("HAVING AVG(price) > $3");
		expect(sql).toContain("ORDER BY avg_price DESC");
		expect(sql).toContain("LIMIT 10");
		expect(params).toEqual(["abc-123", "2024-01-01", 1.0]);
	});

	it("limit rejects negative", () => {
		expect(() => new SQLBuilder("t").limit(-1)).toThrow("non-negative integer");
	});

	it("limit accepts zero", () => {
		const [sql] = new SQLBuilder("t").limit(0).build();
		expect(sql).toContain("LIMIT 0");
	});

	it("offset rejects negative", () => {
		expect(() => new SQLBuilder("t").offset(-5)).toThrow(
			"non-negative integer",
		);
	});

	it("fuzzy threshold rejects out of range", () => {
		expect(() => new SQLBuilder("t").whereFuzzy("name", "Bolt", 2.0)).toThrow(
			"between 0 and 1",
		);
	});
});

describe("SQLBuilder execution against DuckDB", () => {
	it("where eq executes", async () => {
		const instance = await DuckDBInstance.create(":memory:");
		const conn = await instance.connect();
		await conn.run(
			"CREATE TABLE items (name VARCHAR, category VARCHAR, price DOUBLE)",
		);
		await conn.run("INSERT INTO items VALUES ('Alpha', 'A', 1.0)");
		await conn.run("INSERT INTO items VALUES ('Beta', 'A', 2.0)");
		await conn.run("INSERT INTO items VALUES ('Gamma', 'B', 3.0)");

		const [sql, params] = new SQLBuilder("items")
			.whereEq("name", "Gamma")
			.build();
		const stmt = await conn.prepare(sql);
		stmt.bindVarchar(1, params[0] as string);
		const reader = await stmt.runAndReadAll();
		const rows = reader.getRows();
		expect(rows).toHaveLength(1);
		expect(rows[0][0]).toBe("Gamma");

		conn.closeSync();
	});

	it("group by having executes", async () => {
		const instance = await DuckDBInstance.create(":memory:");
		const conn = await instance.connect();
		await conn.run(
			"CREATE TABLE items (name VARCHAR, category VARCHAR, price DOUBLE)",
		);
		await conn.run("INSERT INTO items VALUES ('Alpha', 'A', 1.0)");
		await conn.run("INSERT INTO items VALUES ('Beta', 'A', 2.0)");
		await conn.run("INSERT INTO items VALUES ('Gamma', 'B', 3.0)");
		await conn.run("INSERT INTO items VALUES ('Delta', 'B', 4.0)");
		await conn.run("INSERT INTO items VALUES ('Epsilon', 'A', 5.0)");

		const [sql, params] = new SQLBuilder("items")
			.select("category", "COUNT(*) AS cnt")
			.groupBy("category")
			.having("COUNT(*) >= $1", 3)
			.build();
		const stmt = await conn.prepare(sql);
		stmt.bindInteger(1, params[0] as number);
		const reader = await stmt.runAndReadAll();
		const rows = reader.getRows();
		expect(rows).toHaveLength(1);
		expect(rows[0][0]).toBe("A");
		expect(Number(rows[0][1])).toBe(3);

		conn.closeSync();
	});

	it("where or executes", async () => {
		const instance = await DuckDBInstance.create(":memory:");
		const conn = await instance.connect();
		await conn.run(
			"CREATE TABLE items (name VARCHAR, category VARCHAR, price DOUBLE)",
		);
		await conn.run("INSERT INTO items VALUES ('Alpha', 'A', 1.0)");
		await conn.run("INSERT INTO items VALUES ('Beta', 'A', 2.0)");
		await conn.run("INSERT INTO items VALUES ('Delta', 'B', 4.0)");

		const [sql, params] = new SQLBuilder("items")
			.whereOr(["name = $1", "Alpha"], ["name = $1", "Delta"])
			.orderBy("name")
			.build();
		const stmt = await conn.prepare(sql);
		stmt.bindVarchar(1, params[0] as string);
		stmt.bindVarchar(2, params[1] as string);
		const reader = await stmt.runAndReadAll();
		const rows = reader.getRows();
		expect(rows).toHaveLength(2);
		expect(rows[0][0]).toBe("Alpha");
		expect(rows[1][0]).toBe("Delta");

		conn.closeSync();
	});

	it("distinct executes", async () => {
		const instance = await DuckDBInstance.create(":memory:");
		const conn = await instance.connect();
		await conn.run(
			"CREATE TABLE items (name VARCHAR, category VARCHAR, price DOUBLE)",
		);
		await conn.run("INSERT INTO items VALUES ('Alpha', 'A', 1.0)");
		await conn.run("INSERT INTO items VALUES ('Beta', 'A', 2.0)");
		await conn.run("INSERT INTO items VALUES ('Gamma', 'B', 3.0)");

		const [sql] = new SQLBuilder("items")
			.select("category")
			.distinct()
			.orderBy("category")
			.build();
		const reader = await conn.runAndReadAll(sql);
		const rows = reader.getRows();
		expect(rows).toHaveLength(2);
		expect(rows[0][0]).toBe("A");
		expect(rows[1][0]).toBe("B");

		conn.closeSync();
	});
});
