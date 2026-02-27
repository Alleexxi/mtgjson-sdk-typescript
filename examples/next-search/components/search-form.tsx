"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, type FormEvent } from "react";
import type { SearchFilters } from "@/lib/search-params";

const COLORS = [
  { code: "W", label: "W", bg: "bg-amber-100 text-amber-900" },
  { code: "U", label: "U", bg: "bg-blue-600 text-white" },
  { code: "B", label: "B", bg: "bg-gray-800 text-gray-100 ring-1 ring-gray-600" },
  { code: "R", label: "R", bg: "bg-red-600 text-white" },
  { code: "G", label: "G", bg: "bg-green-700 text-white" },
];

const RARITIES = ["", "common", "uncommon", "rare", "mythic"];

const FORMATS = [
  "",
  "standard",
  "pioneer",
  "modern",
  "legacy",
  "vintage",
  "pauper",
  "commander",
];

export default function SearchForm({
  defaults,
  sets,
}: {
  defaults: SearchFilters;
  sets: { code: string; name: string }[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState(defaults.query);
  const [colors, setColors] = useState<string[]>(defaults.colors);
  const [rarity, setRarity] = useState(defaults.rarity);
  const [type, setType] = useState(defaults.type);
  const [setCode, setSetCode] = useState(defaults.setCode);
  const [setInput, setSetInput] = useState(() => {
    if (!defaults.setCode) return "";
    const match = sets.find((s) => s.code === defaults.setCode);
    return match ? `${match.name} (${match.code.toUpperCase()})` : defaults.setCode.toUpperCase();
  });
  const [legalIn, setLegalIn] = useState(defaults.legalIn);

  // Autocomplete state
  const [showSets, setShowSets] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const setRef = useRef<HTMLDivElement>(null);

  const filteredSets = setInput.length > 0
    ? sets.filter(
        (s) =>
          s.name.toLowerCase().includes(setInput.toLowerCase()) ||
          s.code.toLowerCase().includes(setInput.toLowerCase()),
      ).slice(0, 12)
    : [];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (setRef.current && !setRef.current.contains(e.target as Node)) {
        setShowSets(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectSet(code: string, name: string) {
    setSetCode(code);
    setSetInput(`${name} (${code.toUpperCase()})`);
    setShowSets(false);
    setHighlightIdx(-1);
  }

  function clearSet() {
    setSetCode("");
    setSetInput("");
    setShowSets(false);
  }

  function handleSetKeyDown(e: React.KeyboardEvent) {
    if (!showSets || filteredSets.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, filteredSets.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && highlightIdx >= 0) {
      e.preventDefault();
      const s = filteredSets[highlightIdx];
      selectSet(s.code, s.name);
    } else if (e.key === "Escape") {
      setShowSets(false);
    }
  }

  function toggleColor(code: string) {
    setColors((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (colors.length) params.set("colors", colors.join(","));
    if (rarity) params.set("rarity", rarity);
    if (type) params.set("type", type);
    if (setCode) params.set("set", setCode);
    if (legalIn) params.set("legalIn", legalIn);
    params.set("page", "1");
    router.push(`/?${params.toString()}`);
  }

  const inputClass =
    "rounded bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Search input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cards..."
          className={`${inputClass} flex-1`}
        />
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Search
        </button>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Color toggles */}
        <div className="flex gap-1">
          {COLORS.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => toggleColor(c.code)}
              className={`h-8 w-8 rounded-full text-xs font-bold transition-opacity ${c.bg} ${
                colors.includes(c.code) ? "opacity-100 ring-2 ring-white" : "opacity-40"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <select
          value={rarity}
          onChange={(e) => setRarity(e.target.value)}
          className={inputClass}
        >
          <option value="">Any rarity</option>
          {RARITIES.filter(Boolean).map((r) => (
            <option key={r} value={r}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="Type..."
          className={`${inputClass} w-28`}
        />

        {/* Set autocomplete */}
        <div ref={setRef} className="relative">
          <input
            type="text"
            value={setInput}
            onChange={(e) => {
              setSetInput(e.target.value);
              setSetCode("");
              setShowSets(true);
              setHighlightIdx(-1);
            }}
            onFocus={() => { if (setInput && !setCode) setShowSets(true); }}
            onKeyDown={handleSetKeyDown}
            placeholder="Set..."
            className={`${inputClass} w-48`}
          />
          {setCode && (
            <button
              type="button"
              onClick={clearSet}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              &times;
            </button>
          )}
          {showSets && filteredSets.length > 0 && (
            <ul className="absolute z-50 mt-1 max-h-60 w-72 overflow-y-auto rounded bg-gray-800 py-1 shadow-lg">
              {filteredSets.map((s, i) => (
                <li key={s.code}>
                  <button
                    type="button"
                    onClick={() => selectSet(s.code, s.name)}
                    className={`w-full px-3 py-1.5 text-left text-sm ${
                      i === highlightIdx ? "bg-blue-600 text-white" : "text-gray-200 hover:bg-gray-700"
                    }`}
                  >
                    {s.name}{" "}
                    <span className="text-gray-500">{s.code.toUpperCase()}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <select
          value={legalIn}
          onChange={(e) => setLegalIn(e.target.value)}
          className={inputClass}
        >
          <option value="">Any format</option>
          {FORMATS.filter(Boolean).map((f) => (
            <option key={f} value={f}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </option>
          ))}
        </select>
      </div>
    </form>
  );
}
