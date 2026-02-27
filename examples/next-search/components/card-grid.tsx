import type { CardSet } from "mtgjson-sdk";
import CardItem from "./card-item";

export default function CardGrid({
  cards,
  imageMap,
}: {
  cards: CardSet[];
  imageMap: Record<string, string>;
}) {
  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {cards.map((card) => (
        <CardItem key={card.uuid} card={card} scryfallId={imageMap[card.uuid]} />
      ))}
    </div>
  );
}
