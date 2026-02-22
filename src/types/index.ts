// MTGJSON TypeScript Definitions
// Consolidated from AllMTGJSONTypes.ts

// === Sub-Models ===

export type ForeignDataIdentifiers = {
	multiverseId?: string;
	scryfallId?: string;
};

export type ForeignData = {
	faceName?: string;
	flavorText?: string;
	identifiers?: ForeignDataIdentifiers;
	language: string;
	multiverseId?: number;
	name: string;
	text?: string;
	type?: string;
	uuid?: string;
};

export type Identifiers = {
	abuId?: string;
	cardKingdomEtchedId?: string;
	cardKingdomFoilId?: string;
	cardKingdomId?: string;
	cardsphereFoilId?: string;
	cardsphereId?: string;
	cardtraderId?: string;
	csiId?: string;
	deckboxId?: string;
	mcmId?: string;
	mcmMetaId?: string;
	miniaturemarketId?: string;
	mtgArenaId?: string;
	mtgjsonFoilVersionId?: string;
	mtgjsonNonFoilVersionId?: string;
	mtgjsonV4Id?: string;
	mtgoFoilId?: string;
	mtgoId?: string;
	multiverseId?: string;
	mvpId?: string;
	scgId?: string;
	scryfallCardBackId?: string;
	scryfallId?: string;
	scryfallIllustrationId?: string;
	scryfallOracleId?: string;
	tcgplayerEtchedProductId?: string;
	tcgplayerProductId?: string;
	tntId?: string;
};

export type LeadershipSkills = {
	brawl: boolean;
	commander: boolean;
	oathbreaker: boolean;
};

export type Legalities = {
	alchemy?: string;
	brawl?: string;
	commander?: string;
	duel?: string;
	explorer?: string;
	future?: string;
	gladiator?: string;
	historic?: string;
	historicbrawl?: string;
	legacy?: string;
	modern?: string;
	oathbreaker?: string;
	oldschool?: string;
	pauper?: string;
	paupercommander?: string;
	penny?: string;
	pioneer?: string;
	predh?: string;
	premodern?: string;
	standard?: string;
	standardbrawl?: string;
	timeless?: string;
	vintage?: string;
};

export type PurchaseUrls = {
	cardKingdom?: string;
	cardKingdomEtched?: string;
	cardKingdomFoil?: string;
	cardmarket?: string;
	tcgplayer?: string;
	tcgplayerEtched?: string;
};

export type RelatedCards = {
	reverseRelated?: string[];
	spellbook?: string[];
	tokens?: string[];
};

export type Rulings = {
	date: string;
	text: string;
};

export type SourceProducts = {
	etched?: string[];
	foil?: string[];
	nonfoil?: string[];
};

export type Meta = {
	date: string;
	version: string;
};

export type Translations = {
	"Ancient Greek"?: string;
	Arabic?: string;
	"Chinese Simplified"?: string;
	"Chinese Traditional"?: string;
	French?: string;
	German?: string;
	Hebrew?: string;
	Italian?: string;
	Japanese?: string;
	Korean?: string;
	Latin?: string;
	Phyrexian?: string;
	"Portuguese (Brazil)"?: string;
	Russian?: string;
	Sanskrit?: string;
	Spanish?: string;
};

export type TcgplayerSkus = {
	condition: string;
	finish?: string;
	language: string;
	printing: string;
	productId: number;
	skuId: number;
};

export type BoosterSheet = {
	allowDuplicates?: boolean;
	balanceColors?: boolean;
	cards: Record<string, number>;
	fixed?: boolean;
	foil: boolean;
	totalWeight: number;
};

export type BoosterPack = {
	contents: Record<string, number>;
	weight: number;
};

export type BoosterConfig = {
	boosters: BoosterPack[];
	boostersTotalWeight: number;
	name?: string;
	sheets: Record<string, BoosterSheet>;
	sourceSetCodes: string[];
};

export type PricePoints = {
	etched?: Record<string, number>;
	foil?: Record<string, number>;
	normal?: Record<string, number>;
};

export type PriceList = {
	buylist?: PricePoints;
	currency: string;
	retail?: PricePoints;
};

export type PriceFormats = {
	mtgo?: Record<string, PriceList>;
	paper?: Record<string, PriceList>;
};

export type SealedProductCard = {
	finishes?: string[];
	foil?: boolean;
	name: string;
	number: string;
	set: string;
	uuid: string;
};

export type SealedProductDeck = {
	name: string;
	set: string;
};

export type SealedProductOther = {
	name: string;
};

export type SealedProductPack = {
	code: string;
	set: string;
};

export type SealedProductSealed = {
	count: number;
	name: string;
	set: string;
	uuid?: string;
};

export type SealedProductVariableConfig = {
	chance?: number;
	weight?: number;
};

export type SealedProductVariableItem = {
	card?: SealedProductCard[];
	deck?: SealedProductDeck[];
	other?: SealedProductOther[];
	pack?: SealedProductPack[];
	sealed?: SealedProductSealed[];
	variable_config?: SealedProductVariableConfig[];
};

export type SealedProductVariableEntry = {
	configs?: SealedProductVariableItem[];
};

export type SealedProductContents = {
	card?: SealedProductCard[];
	deck?: SealedProductDeck[];
	other?: SealedProductOther[];
	pack?: SealedProductPack[];
	sealed?: SealedProductSealed[];
	variable?: SealedProductVariableEntry[];
};

export type Keywords = {
	abilityWords: string[];
	keywordAbilities: string[];
	keywordActions: string[];
};

export type CardType = {
	subTypes: string[];
	superTypes: string[];
};

export type CardTypes = {
	artifact: CardType;
	battle: CardType;
	conspiracy: CardType;
	creature: CardType;
	enchantment: CardType;
	instant: CardType;
	land: CardType;
	phenomenon: CardType;
	plane: CardType;
	planeswalker: CardType;
	scheme: CardType;
	sorcery: CardType;
	tribal: CardType;
	vanguard: CardType;
};

// === Card Models ===

export type CardSetDeck = {
	count: number;
	isFoil?: boolean;
	uuid: string;
};

export type CardToken = {
	artist?: string;
	artistIds?: string[];
	asciiName?: string;
	attractionLights?: number[];
	availability: string[];
	boosterTypes?: string[];
	borderColor: string;
	cardParts?: string[];
	colorIdentity: string[];
	colorIndicator?: string[];
	colors: string[];
	edhrecSaltiness?: number;
	faceFlavorName?: string;
	faceName?: string;
	facePrintedName?: string;
	finishes: string[];
	flavorName?: string;
	flavorText?: string;
	frameEffects?: string[];
	frameVersion: string;
	identifiers: Identifiers;
	isFullArt?: boolean;
	isFunny?: boolean;
	isOnlineOnly?: boolean;
	isOversized?: boolean;
	isPromo?: boolean;
	isReprint?: boolean;
	isTextless?: boolean;
	keywords?: string[];
	language: string;
	layout: string;
	loyalty?: string;
	manaCost?: string;
	name: string;
	number: string;
	orientation?: string;
	originalText?: string;
	originalType?: string;
	otherFaceIds?: string[];
	power?: string;
	printedName?: string;
	printedText?: string;
	printedType?: string;
	producedMana?: string[];
	promoTypes?: string[];
	relatedCards?: RelatedCards;
	reverseRelated?: string[];
	securityStamp?: string;
	setCode: string;
	side?: string;
	signature?: string;
	sourceProducts?: SourceProducts;
	subsets?: string[];
	subtypes: string[];
	supertypes: string[];
	text?: string;
	tokenProducts?: unknown[];
	toughness?: string;
	type: string;
	types: string[];
	uuid: string;
	watermark?: string;
};

export type CardAtomic = {
	asciiName?: string;
	colorIdentity: string[];
	colorIndicator?: string[];
	colors: string[];
	convertedManaCost: number;
	defense?: string;
	edhrecRank?: number;
	edhrecSaltiness?: number;
	faceConvertedManaCost?: number;
	faceManaValue?: number;
	faceName?: string;
	firstPrinting?: string;
	foreignData?: ForeignData[];
	hand?: string;
	hasAlternativeDeckLimit?: boolean;
	identifiers: Identifiers;
	isFunny?: boolean;
	isGameChanger?: boolean;
	isReserved?: boolean;
	keywords?: string[];
	layout: string;
	leadershipSkills?: LeadershipSkills;
	legalities: Legalities;
	life?: string;
	loyalty?: string;
	manaCost?: string;
	manaValue: number;
	name: string;
	power?: string;
	printings?: string[];
	producedMana?: string[];
	purchaseUrls: PurchaseUrls;
	relatedCards?: RelatedCards;
	rulings?: Rulings[];
	side?: string;
	subsets?: string[];
	subtypes: string[];
	supertypes: string[];
	text?: string;
	toughness?: string;
	type: string;
	types: string[];
};

export type CardSet = {
	artist?: string;
	artistIds?: string[];
	asciiName?: string;
	attractionLights?: number[];
	availability: string[];
	boosterTypes?: string[];
	borderColor: string;
	cardParts?: string[];
	colorIdentity: string[];
	colorIndicator?: string[];
	colors: string[];
	convertedManaCost: number;
	defense?: string;
	duelDeck?: string;
	edhrecRank?: number;
	edhrecSaltiness?: number;
	faceConvertedManaCost?: number;
	faceFlavorName?: string;
	faceManaValue?: number;
	faceName?: string;
	facePrintedName?: string;
	finishes: string[];
	flavorName?: string;
	flavorText?: string;
	foreignData?: ForeignData[];
	frameEffects?: string[];
	frameVersion: string;
	hand?: string;
	hasAlternativeDeckLimit?: boolean;
	hasContentWarning?: boolean;
	identifiers: Identifiers;
	isAlternative?: boolean;
	isFullArt?: boolean;
	isFunny?: boolean;
	isGameChanger?: boolean;
	isOnlineOnly?: boolean;
	isOversized?: boolean;
	isPromo?: boolean;
	isRebalanced?: boolean;
	isReprint?: boolean;
	isReserved?: boolean;
	isStorySpotlight?: boolean;
	isTextless?: boolean;
	isTimeshifted?: boolean;
	keywords?: string[];
	language: string;
	layout: string;
	leadershipSkills?: LeadershipSkills;
	legalities: Legalities;
	life?: string;
	loyalty?: string;
	manaCost?: string;
	manaValue: number;
	name: string;
	number: string;
	originalPrintings?: string[];
	originalReleaseDate?: string;
	originalText?: string;
	originalType?: string;
	otherFaceIds?: string[];
	power?: string;
	printedName?: string;
	printedText?: string;
	printedType?: string;
	printings?: string[];
	producedMana?: string[];
	promoTypes?: string[];
	purchaseUrls: PurchaseUrls;
	rarity: string;
	rebalancedPrintings?: string[];
	relatedCards?: RelatedCards;
	rulings?: Rulings[];
	securityStamp?: string;
	setCode: string;
	side?: string;
	signature?: string;
	sourceProducts?: SourceProducts;
	subsets?: string[];
	subtypes: string[];
	supertypes: string[];
	text?: string;
	toughness?: string;
	type: string;
	types: string[];
	uuid: string;
	variations?: string[];
	watermark?: string;
};

export type CardDeck = {
	artist?: string;
	artistIds?: string[];
	asciiName?: string;
	attractionLights?: number[];
	availability: string[];
	boosterTypes?: string[];
	borderColor: string;
	cardParts?: string[];
	colorIdentity: string[];
	colorIndicator?: string[];
	colors: string[];
	convertedManaCost: number;
	count: number;
	defense?: string;
	duelDeck?: string;
	edhrecRank?: number;
	edhrecSaltiness?: number;
	faceConvertedManaCost?: number;
	faceFlavorName?: string;
	faceManaValue?: number;
	faceName?: string;
	facePrintedName?: string;
	finishes: string[];
	flavorName?: string;
	flavorText?: string;
	foreignData?: ForeignData[];
	frameEffects?: string[];
	frameVersion: string;
	hand?: string;
	hasAlternativeDeckLimit?: boolean;
	hasContentWarning?: boolean;
	identifiers: Identifiers;
	isAlternative?: boolean;
	isEtched?: boolean;
	isFoil: boolean;
	isFullArt?: boolean;
	isFunny?: boolean;
	isGameChanger?: boolean;
	isOnlineOnly?: boolean;
	isOversized?: boolean;
	isPromo?: boolean;
	isRebalanced?: boolean;
	isReprint?: boolean;
	isReserved?: boolean;
	isStorySpotlight?: boolean;
	isTextless?: boolean;
	isTimeshifted?: boolean;
	keywords?: string[];
	language: string;
	layout: string;
	leadershipSkills?: LeadershipSkills;
	legalities: Legalities;
	life?: string;
	loyalty?: string;
	manaCost?: string;
	manaValue: number;
	name: string;
	number: string;
	originalPrintings?: string[];
	originalReleaseDate?: string;
	originalText?: string;
	originalType?: string;
	otherFaceIds?: string[];
	power?: string;
	printedName?: string;
	printedText?: string;
	printedType?: string;
	printings?: string[];
	producedMana?: string[];
	promoTypes?: string[];
	purchaseUrls: PurchaseUrls;
	rarity: string;
	rebalancedPrintings?: string[];
	relatedCards?: RelatedCards;
	rulings?: Rulings[];
	securityStamp?: string;
	setCode: string;
	side?: string;
	signature?: string;
	sourceProducts?: SourceProducts;
	subsets?: string[];
	subtypes: string[];
	supertypes: string[];
	text?: string;
	toughness?: string;
	type: string;
	types: string[];
	uuid: string;
	variations?: string[];
	watermark?: string;
};

// === Set Models ===

export type DeckSet = {
	code: string;
	commander?: CardSetDeck[];
	displayCommander?: CardSetDeck[];
	mainBoard: CardSetDeck[];
	name: string;
	planes?: CardSetDeck[];
	releaseDate: string;
	schemes?: CardSetDeck[];
	sealedProductUuids: string[] | null;
	sideBoard: CardSetDeck[];
	sourceSetCodes?: string[];
	tokens?: CardSetDeck[];
	type: string;
};

export type SetList = {
	baseSetSize: number;
	block?: string;
	cardsphereSetId?: number;
	code: string;
	decks?: DeckSet[];
	isFoilOnly: boolean;
	isForeignOnly?: boolean;
	isNonFoilOnly?: boolean;
	isOnlineOnly: boolean;
	isPaperOnly?: boolean;
	isPartialPreview?: boolean;
	keyruneCode: string;
	languages?: string[];
	mcmId?: number;
	mcmIdExtras?: number;
	mcmName?: string;
	mtgoCode?: string;
	name: string;
	parentCode?: string;
	releaseDate: string;
	sealedProduct?: SealedProduct[];
	tcgplayerGroupId?: number;
	tokenSetCode?: string;
	totalSetSize: number;
	translations: Translations;
	type: string;
};

export type MtgSet = {
	baseSetSize: number;
	block?: string;
	booster?: Record<string, BoosterConfig>;
	cards: CardSet[];
	cardsphereSetId?: number;
	code: string;
	decks?: DeckSet[];
	isFoilOnly: boolean;
	isForeignOnly?: boolean;
	isNonFoilOnly?: boolean;
	isOnlineOnly: boolean;
	isPaperOnly?: boolean;
	isPartialPreview?: boolean;
	keyruneCode: string;
	languages?: string[];
	mcmId?: number;
	mcmIdExtras?: number;
	mcmName?: string;
	mtgoCode?: string;
	name: string;
	parentCode?: string;
	releaseDate: string;
	sealedProduct?: SealedProduct[];
	tcgplayerGroupId?: number;
	tokenSetCode?: string;
	tokens: CardToken[];
	totalSetSize: number;
	translations: Translations;
	type: string;
};

export type SealedProduct = {
	cardCount?: number;
	category?: string;
	contents?: SealedProductContents;
	identifiers: Identifiers;
	language?: string;
	name: string;
	productSize?: number;
	purchaseUrls: PurchaseUrls;
	releaseDate?: string;
	setCode?: string;
	subtype?: string;
	uuid: string;
};

export type DeckList = {
	code: string;
	fileName: string;
	name: string;
	releaseDate: string;
	type: string;
};

export type Deck = {
	code: string;
	commander?: CardDeck[];
	displayCommander?: CardDeck[];
	mainBoard: CardDeck[];
	name: string;
	planes?: CardDeck[];
	releaseDate: string;
	schemes?: CardDeck[];
	sealedProductUuids: string[] | null;
	sideBoard: CardDeck[];
	sourceSetCodes?: string[];
	tokens?: CardToken[];
	type: string;
};

// === File Models ===

export type AllPricesFile = {
	meta: Meta;
	data: Record<string, PriceFormats>;
};
export type AllPrintingsFile = {
	meta: Meta;
	data: Record<string, MtgSet>;
};
export type CardTypesFile = { meta: Meta; data: CardTypes };
export type DeckListFile = { meta: Meta; data: DeckList[] };
export type KeywordsFile = { meta: Meta; data: Keywords };
export type SetListFile = { meta: Meta; data: SetList[] };
export type TcgplayerSkusFile = {
	meta: Meta;
	data: Record<string, TcgplayerSkus[]>;
};
