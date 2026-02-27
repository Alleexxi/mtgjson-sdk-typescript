import Image from "next/image";
import Link from "next/link";
import type { CardSet } from "mtgjson-sdk";
import { scryfallImageUrl } from "@/lib/scryfall";
import ManaCost from "./mana-cost";

const STATUS_COLORS: Record<string, string> = {
  Legal: "text-green-400",
  Banned: "text-red-400",
  Restricted: "text-yellow-400",
  Suspended: "text-orange-400",
};

function groupPricesByProvider(prices: Record<string, unknown>[]) {
  const map = new Map<string, { normal?: number; foil?: number }>();
  for (const p of prices) {
    const provider = String(p.provider ?? "");
    const finish = String(p.finish ?? "normal");
    const price = Number(p.price ?? 0);
    if (!map.has(provider)) map.set(provider, {});
    const entry = map.get(provider)!;
    if (finish === "foil") entry.foil = price;
    else entry.normal = price;
  }
  return [...map.entries()]
    .map(([provider, { normal, foil }]) => ({ provider, normal, foil }))
    .sort((a, b) => a.provider.localeCompare(b.provider));
}

export default function CardDetail({
  card,
  scryfallId,
  legalities,
  prices,
  otherPrintings,
  printingImages,
}: {
  card: CardSet;
  scryfallId?: string;
  legalities: Record<string, string>;
  prices: Record<string, unknown>[];
  otherPrintings: CardSet[];
  printingImages: Record<string, string>;
}) {
  const imageUrl = scryfallId ? scryfallImageUrl(scryfallId, "large") : null;

  return (
    <div className="space-y-6">
      <Link href="/" className="inline-block text-sm text-gray-400 hover:text-gray-200">
        &larr; Back to search
      </Link>

      <div className="flex flex-col gap-8 md:flex-row">
        {/* Card image */}
        <div className="shrink-0">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={card.name}
              width={336}
              height={468}
              className="rounded-lg"
              unoptimized
            />
          ) : (
            <div className="flex h-[468px] w-[336px] items-center justify-center rounded-lg bg-gray-800">
              <span className="text-gray-500">{card.name}</span>
            </div>
          )}
        </div>

        {/* Card details */}
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{card.name}</h1>
              <ManaCost manaCost={card.manaCost} />
            </div>
            <p className="mt-1 text-gray-400">{card.type}</p>
          </div>

          {card.text && (
            <div className="rounded bg-gray-900 p-4 text-sm whitespace-pre-line">
              {card.text}
            </div>
          )}

          {(card.power || card.toughness) && (
            <p className="text-sm">
              <span className="text-gray-400">P/T:</span>{" "}
              {card.power}/{card.toughness}
            </p>
          )}

          {card.loyalty && (
            <p className="text-sm">
              <span className="text-gray-400">Loyalty:</span> {card.loyalty}
            </p>
          )}

          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded bg-gray-800 px-2 py-1">
              {card.setCode.toUpperCase()} #{card.number}
            </span>
            <span className="rounded bg-gray-800 px-2 py-1 capitalize">
              {card.rarity}
            </span>
            {card.artist && (
              <span className="rounded bg-gray-800 px-2 py-1">
                Artist: {card.artist}
              </span>
            )}
          </div>

          {card.colors && card.colors.length > 0 && (
            <p className="text-sm">
              <span className="text-gray-400">Colors:</span>{" "}
              {card.colors.join(", ")}
            </p>
          )}

          {card.keywords && card.keywords.length > 0 && (
            <p className="text-sm">
              <span className="text-gray-400">Keywords:</span>{" "}
              {card.keywords.join(", ")}
            </p>
          )}

          {card.flavorText && (
            <p className="text-sm italic text-gray-500">{card.flavorText}</p>
          )}

          {/* Price */}
          {prices.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-gray-300">Retail Prices</h2>
              <table className="text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="pr-6 pb-1">Provider</th>
                    <th className="pr-6 pb-1">Normal</th>
                    <th className="pb-1">Foil</th>
                  </tr>
                </thead>
                <tbody>
                  {groupPricesByProvider(prices).map(({ provider, normal, foil }) => (
                    <tr key={provider}>
                      <td className="pr-6 py-0.5 text-gray-400">{provider}</td>
                      <td className="pr-6 py-0.5">{normal ? `$${normal}` : "—"}</td>
                      <td className="py-0.5">{foil ? `$${foil}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Legalities */}
          {Object.keys(legalities).length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-gray-300">Format Legality</h2>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
                {Object.entries(legalities)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([format, status]) => (
                    <div key={format} className="flex justify-between gap-2">
                      <span className="capitalize text-gray-400">{format}</span>
                      <span className={STATUS_COLORS[status] ?? "text-gray-500"}>
                        {status}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Other Printings */}
      {otherPrintings.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-300">
            Other Printings ({otherPrintings.length})
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {otherPrintings.slice(0, 12).map((p) => {
              const sid = printingImages[p.uuid];
              return (
                <Link
                  key={p.uuid}
                  href={`/card/${p.uuid}`}
                  className="shrink-0 transition-transform hover:scale-105"
                >
                  {sid ? (
                    <Image
                      src={scryfallImageUrl(sid, "small")}
                      alt={`${p.name} (${p.setCode.toUpperCase()})`}
                      width={146}
                      height={204}
                      className="rounded"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-[204px] w-[146px] items-center justify-center rounded bg-gray-800">
                      <span className="text-center text-xs text-gray-500">
                        {p.setCode.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <p className="mt-1 text-center text-xs text-gray-400">
                    {p.setCode.toUpperCase()} · {p.rarity}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
