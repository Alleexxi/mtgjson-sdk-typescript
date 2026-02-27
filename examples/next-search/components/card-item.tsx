import Link from "next/link";
import Image from "next/image";
import type { CardSet } from "mtgjson-sdk";
import { scryfallImageUrl } from "@/lib/scryfall";

const RARITY_COLORS: Record<string, string> = {
  common: "text-gray-400",
  uncommon: "text-gray-300",
  rare: "text-amber-400",
  mythic: "text-orange-500",
};

export default function CardItem({
  card,
  scryfallId,
}: {
  card: CardSet;
  scryfallId?: string;
}) {
  const imageUrl = scryfallId ? scryfallImageUrl(scryfallId, "normal") : null;

  return (
    <Link
      href={`/card/${card.uuid}`}
      className="group block rounded-lg transition-transform hover:scale-[1.02]"
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={card.name}
          width={244}
          height={340}
          className="rounded-lg"
          unoptimized
        />
      ) : (
        <div className="flex h-[340px] w-[244px] items-center justify-center rounded-lg bg-gray-800">
          <span className="px-4 text-center text-sm text-gray-500">{card.name}</span>
        </div>
      )}
      <div className="mt-2 w-[244px] px-1">
        <p className="truncate text-sm font-medium">{card.name}</p>
        <p className="truncate text-xs text-gray-400">
          {card.setCode.toUpperCase()}
          {" · "}
          <span className={RARITY_COLORS[card.rarity] ?? "text-gray-400"}>
            {card.rarity}
          </span>
        </p>
      </div>
    </Link>
  );
}
