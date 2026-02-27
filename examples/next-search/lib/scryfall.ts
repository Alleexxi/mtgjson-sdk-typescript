type ImageSize = "small" | "normal" | "large" | "png";

export function scryfallImageUrl(
  scryfallId: string,
  size: ImageSize = "normal",
): string {
  return `https://cards.scryfall.io/${size}/front/${scryfallId[0]}/${scryfallId[1]}/${scryfallId}.jpg`;
}
