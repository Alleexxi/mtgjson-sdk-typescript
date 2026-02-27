import { notFound } from "next/navigation";
import { getSDK } from "@/lib/sdk";
import CardDetail from "@/components/card-detail";

export default async function CardPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const sdk = await getSDK();

  const card = await sdk.cards.getByUuid(uuid);
  if (!card) notFound();

  const [identifiers, legalities, prices, allPrintings] = await Promise.all([
    sdk.identifiers.getIdentifiers(uuid),
    sdk.legalities.formatsForCard(uuid),
    sdk.prices.today(uuid, { priceType: "retail" }).catch(() => []),
    sdk.cards.getPrintings(card.name),
  ]);

  const scryfallId = (identifiers?.scryfallId as string) ?? undefined;

  // Get scryfall IDs for other printings
  const otherPrintings = allPrintings.filter((p) => p.uuid !== uuid);
  const printingImages: Record<string, string> = {};
  if (otherPrintings.length > 0) {
    const entries = await Promise.all(
      otherPrintings.slice(0, 12).map(async (p) => {
        const ids = await sdk.identifiers.getIdentifiers(p.uuid);
        return [p.uuid, ids?.scryfallId as string | undefined] as const;
      }),
    );
    for (const [puuid, sid] of entries) {
      if (sid) printingImages[puuid] = sid;
    }
  }

  return (
    <CardDetail
      card={card}
      scryfallId={scryfallId}
      legalities={legalities}
      prices={prices}
      otherPrintings={otherPrintings}
      printingImages={printingImages}
    />
  );
}
