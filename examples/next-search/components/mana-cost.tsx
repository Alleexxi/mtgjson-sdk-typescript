const SYMBOL_COLORS: Record<string, string> = {
  W: "bg-amber-100 text-amber-900",
  U: "bg-blue-600 text-white",
  B: "bg-gray-800 text-gray-100",
  R: "bg-red-600 text-white",
  G: "bg-green-700 text-white",
  C: "bg-gray-400 text-gray-900",
  X: "bg-gray-500 text-white",
};

function symbolClass(symbol: string): string {
  return SYMBOL_COLORS[symbol] ?? "bg-gray-500 text-white";
}

export default function ManaCost({ manaCost }: { manaCost?: string }) {
  if (!manaCost) return null;

  const symbols = manaCost.match(/\{([^}]+)\}/g);
  if (!symbols) return <span>{manaCost}</span>;

  return (
    <span className="inline-flex items-center gap-0.5">
      {symbols.map((raw, i) => {
        const symbol = raw.slice(1, -1);
        return (
          <span
            key={i}
            className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${symbolClass(symbol)}`}
          >
            {symbol}
          </span>
        );
      })}
    </span>
  );
}
