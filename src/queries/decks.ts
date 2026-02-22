import type { CacheManager } from "../cache.js";
import type { DeckList } from "../types/index.js";

export class DeckQuery {
	private _cache: CacheManager;
	private _data: Record<string, unknown>[] | null = null;

	constructor(cache: CacheManager) {
		this._cache = cache;
	}

	private async _ensure(): Promise<void> {
		if (this._data !== null) return;
		try {
			const raw = await this._cache.loadJson("deck_list");
			this._data = (raw.data as Record<string, unknown>[]) ?? [];
		} catch {
			this._data = [];
		}
	}

	async list(options?: {
		setCode?: string;
		deckType?: string;
	}): Promise<DeckList[]> {
		await this._ensure();
		let results = this._data!;

		if (options?.setCode) {
			const codeUpper = options.setCode.toUpperCase();
			results = results.filter(
				(d) => ((d.code as string) ?? "").toUpperCase() === codeUpper,
			);
		}
		if (options?.deckType) {
			results = results.filter((d) => d.type === options.deckType);
		}
		return results as DeckList[];
	}

	async search(options?: {
		name?: string;
		setCode?: string;
	}): Promise<DeckList[]> {
		await this._ensure();
		let results = this._data!;

		if (options?.name) {
			const nameLower = options.name.toLowerCase();
			results = results.filter((d) =>
				((d.name as string) ?? "").toLowerCase().includes(nameLower),
			);
		}
		if (options?.setCode) {
			const codeUpper = options.setCode.toUpperCase();
			results = results.filter(
				(d) => ((d.code as string) ?? "").toUpperCase() === codeUpper,
			);
		}
		return results as DeckList[];
	}

	async count(): Promise<number> {
		await this._ensure();
		return this._data!.length;
	}
}
