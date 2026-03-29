import { unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DuckDBInstance } from "@duckdb/node-api";
import type { CacheManager } from "./cache.js";

type DuckDBConnection = Awaited<ReturnType<DuckDBInstance["connect"]>>;

/** Known list columns that don't follow the plural naming convention. */
const STATIC_LIST_COLUMNS: Record<string, ReadonlySet<string>> = {
	cards: new Set([
		"artistIds",
		"attractionLights",
		"availability",
		"boosterTypes",
		"cardParts",
		"colorIdentity",
		"colorIndicator",
		"colors",
		"finishes",
		"frameEffects",
		"keywords",
		"originalPrintings",
		"otherFaceIds",
		"printings",
		"producedMana",
		"promoTypes",
		"rebalancedPrintings",
		"subsets",
		"subtypes",
		"supertypes",
		"types",
		"variations",
	]),
	tokens: new Set([
		"artistIds",
		"availability",
		"boosterTypes",
		"colorIdentity",
		"colorIndicator",
		"colors",
		"finishes",
		"frameEffects",
		"keywords",
		"otherFaceIds",
		"producedMana",
		"promoTypes",
		"reverseRelated",
		"subtypes",
		"supertypes",
		"types",
	]),
};

/** VARCHAR columns that are NOT lists, even if they match the plural-name heuristic. */
const IGNORED_COLUMNS = new Set([
	"text",
	"originalText",
	"flavorText",
	"printedText",
	"identifiers",
	"legalities",
	"leadershipSkills",
	"purchaseUrls",
	"relatedCards",
	"rulings",
	"sourceProducts",
	"foreignData",
	"translations",
	"toughness",
	"status",
	"format",
	"uris",
	"scryfallUri",
	// sealed_products / set_decks: JSON strings, not CSV lists
	"contents",
	"tokens",
	"planes",
	"schemes",
	"sealedProductUuids",
	"sourceSetCodes",
]);

/** VARCHAR columns containing JSON strings to cast to DuckDB JSON type. */
const JSON_CAST_COLUMNS = new Set([
	"identifiers",
	"legalities",
	"leadershipSkills",
	"purchaseUrls",
	"relatedCards",
	"rulings",
	"sourceProducts",
	"foreignData",
	"translations",
	// sealed_products / set_decks
	"contents",
	"tokens",
	"planes",
	"schemes",
	"sealedProductUuids",
	"sourceSetCodes",
	"mainBoard",
	"sideBoard",
	"commander",
	"displayCommander",
]);

export class Connection {
	private _conn!: DuckDBConnection;
	private _instance!: DuckDBInstance;
	_registeredViews = new Set<string>();
	cache: CacheManager;

	private constructor(cache: CacheManager) {
		this.cache = cache;
	}

	static async create(cache: CacheManager): Promise<Connection> {
		const conn = new Connection(cache);
		conn._instance = await DuckDBInstance.create(":memory:");
		conn._conn = await conn._instance.connect();
		return conn;
	}

	async close(): Promise<void> {
		if (this._conn) {
			this._conn.closeSync();
		}
	}

	private async _ensureView(viewName: string): Promise<void> {
		if (this._registeredViews.has(viewName)) return;
		const path = await this.cache.ensureParquet(viewName);
		const pathStr = path.replace(/\\/g, "/");

		if (viewName === "card_legalities") {
			await this._registerLegalitiesView(pathStr);
			return;
		}

		const replaceClause = await this._buildCsvReplace(pathStr, viewName);
		await this._run(
			`CREATE OR REPLACE VIEW ${viewName} AS SELECT *${replaceClause} FROM read_parquet('${pathStr}')`,
		);
		this._registeredViews.add(viewName);
	}

	private async _buildCsvReplace(
		pathStr: string,
		viewName: string,
	): Promise<string> {
		const reader = await this._conn.runAndReadAll(
			`SELECT column_name, column_type FROM (DESCRIBE SELECT * FROM read_parquet('${pathStr}'))`,
		);
		const rows = reader.getRowObjects() as Array<{
			column_name: string;
			column_type: string;
		}>;
		const schema = new Map<string, string>();
		for (const row of rows) {
			schema.set(row.column_name, row.column_type);
		}

		const candidates = new Set<string>();

		// Layer 1: Static baseline
		if (STATIC_LIST_COLUMNS[viewName]) {
			for (const col of STATIC_LIST_COLUMNS[viewName]) {
				candidates.add(col);
			}
		}

		// Layer 2: Dynamic heuristic
		for (const [col, dtype] of schema) {
			if (dtype !== "VARCHAR") continue;
			if (IGNORED_COLUMNS.has(col)) continue;
			if (col.endsWith("s")) candidates.add(col);
		}

		// Filter to columns that actually exist as VARCHAR
		const finalCols = [...candidates]
			.filter((col) => schema.get(col) === "VARCHAR")
			.sort();

		const exprs: string[] = [];
		for (const col of finalCols) {
			exprs.push(
				`CASE WHEN "${col}" IS NULL OR TRIM("${col}") = '' THEN []::VARCHAR[] ELSE string_split("${col}", ', ') END AS "${col}"`,
			);
		}

		// Layer 4: JSON casting
		const jsonCols = [...JSON_CAST_COLUMNS].sort();
		for (const col of jsonCols) {
			if (schema.get(col) === "VARCHAR") {
				exprs.push(`TRY_CAST("${col}" AS JSON) AS "${col}"`);
			}
		}

		if (exprs.length === 0) return "";
		return ` REPLACE (${exprs.join(", ")})`;
	}

	private async _registerLegalitiesView(pathStr: string): Promise<void> {
		const reader = await this._conn.runAndReadAll(
			`SELECT column_name FROM (DESCRIBE SELECT * FROM read_parquet('${pathStr}'))`,
		);
		const allCols = (
			reader.getRowObjects() as Array<{ column_name: string }>
		).map((r) => r.column_name);

		const staticCols = new Set(["uuid"]);
		const formatCols = allCols.filter((c) => !staticCols.has(c));

		if (formatCols.length === 0) {
			await this._run(
				`CREATE OR REPLACE VIEW card_legalities AS SELECT * FROM read_parquet('${pathStr}')`,
			);
		} else {
			const colsSql = formatCols.map((c) => `"${c}"`).join(", ");
			await this._run(
				`CREATE OR REPLACE VIEW card_legalities AS SELECT uuid, format, status FROM (  UNPIVOT (SELECT * FROM read_parquet('${pathStr}'))  ON ${colsSql}  INTO NAME format VALUE status) WHERE status IS NOT NULL`,
			);
		}
		this._registeredViews.add("card_legalities");
	}

	async registerTableFromData(
		tableName: string,
		data: Record<string, unknown>[],
	): Promise<void> {
		if (data.length === 0) return;
		await this._run(`DROP TABLE IF EXISTS ${tableName}`);
		const tmpPath = join(tmpdir(), `mtgjson_${tableName}_${Date.now()}.json`);
		try {
			writeFileSync(tmpPath, JSON.stringify(data), "utf-8");
			const fwd = tmpPath.replace(/\\/g, "/");
			await this._run(
				`CREATE TABLE ${tableName} AS SELECT * FROM read_json_auto('${fwd}')`,
			);
		} finally {
			try {
				unlinkSync(tmpPath);
			} catch {
				// ignore
			}
		}
		this._registeredViews.add(tableName);
	}

	async registerTableFromNdjson(
		tableName: string,
		ndjsonPath: string,
	): Promise<void> {
		await this._run(`DROP TABLE IF EXISTS ${tableName}`);
		const fwd = ndjsonPath.replace(/\\/g, "/");
		await this._run(
			`CREATE TABLE ${tableName} AS SELECT * FROM read_json_auto('${fwd}', format='newline_delimited')`,
		);
		this._registeredViews.add(tableName);
	}

	async ensureViews(...viewNames: string[]): Promise<void> {
		for (const name of viewNames) {
			await this._ensureView(name);
		}
	}

	async execute(
		sql: string,
		params?: unknown[],
	): Promise<Record<string, unknown>[]> {
		const reader = await this._runWithParams(sql, params);
		const rows = reader.getRowObjects() as Record<string, unknown>[];
		return rows.map((row) => coerceValues(row) as Record<string, unknown>);
	}

	async executeJson(sql: string, params?: unknown[]): Promise<string> {
		const wrapped = `SELECT to_json(list(sub)) FROM (${sql}) sub`;
		const reader = await this._runWithParams(wrapped, params);
		const rows = reader.getRows();
		if (!rows || rows.length === 0 || rows[0][0] == null) return "[]";
		return String(rows[0][0]);
	}

	async executeScalar(sql: string, params?: unknown[]): Promise<unknown> {
		const reader = await this._runWithParams(sql, params);
		const rows = reader.getRows();
		if (!rows || rows.length === 0) return null;
		const val = rows[0][0] ?? null;
		// DuckDB COUNT(*) returns BIGINT → JS BigInt; coerce to Number
		if (typeof val === "bigint") return Number(val);
		return val;
	}

	get raw(): DuckDBConnection {
		return this._conn;
	}

	private async _run(sql: string): Promise<void> {
		await this._conn.run(sql);
	}

	private async _runWithParams(sql: string, params?: unknown[]) {
		if (params && params.length > 0) {
			const stmt = await this._conn.prepare(sql);
			for (let i = 0; i < params.length; i++) {
				const val = params[i];
				if (typeof val === "string") {
					stmt.bindVarchar(i + 1, val);
				} else if (typeof val === "number") {
					if (Number.isInteger(val)) {
						stmt.bindInteger(i + 1, val);
					} else {
						stmt.bindDouble(i + 1, val);
					}
				} else if (typeof val === "boolean") {
					stmt.bindBoolean(i + 1, val);
				} else if (val === null || val === undefined) {
					stmt.bindNull(i + 1);
				} else {
					stmt.bindVarchar(i + 1, String(val));
				}
			}
			return await stmt.runAndReadAll();
		}
		return await this._conn.runAndReadAll(sql);
	}
}

function coerceValues(val: unknown): unknown {
	if (val instanceof Date) {
		return val.toISOString();
	}
	if (typeof val === "bigint") {
		return Number(val);
	}
	if (Array.isArray(val)) {
		return val.map(coerceValues);
	}
	if (val !== null && typeof val === "object") {
		const obj = val as Record<string, unknown>;
		// DuckDB LIST types come back as { items: [...] } with null prototype
		if ("items" in obj && Array.isArray(obj.items)) {
			return (obj.items as unknown[]).map(coerceValues);
		}
		// DuckDB DATE type comes back as { days: number } (days since Unix epoch)
		if (
			"days" in obj &&
			typeof obj.days === "number" &&
			Object.keys(obj).length === 1
		) {
			const ms = (obj.days as number) * 86400000;
			return new Date(ms).toISOString().slice(0, 10);
		}
		// DuckDB TIMESTAMP type comes back as { micros: bigint }
		if (
			"micros" in obj &&
			typeof obj.micros === "bigint" &&
			Object.keys(obj).length === 1
		) {
			const ms = Number(obj.micros / 1000n);
			return new Date(ms).toISOString();
		}
		const out: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(obj)) {
			out[k] = coerceValues(v);
		}
		return out;
	}
	if (typeof val === "string") {
		const ch = val.charAt(0);
		if (ch === "{" || ch === "[") {
			try {
				return JSON.parse(val);
			} catch {
				// not valid JSON, return as-is
			}
		}
	}
	return val;
}
