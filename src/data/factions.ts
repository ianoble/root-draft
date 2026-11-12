// Root faction data for the draft app. Lore/plays/tip are original summaries, not official text.
// Reach values: Law of Root 5.2. Law links: https://www.therootdatabase.com/law/<lawSlug>/en/

export type FactionType = "Militant" | "Insurgent";
export type Expansion =
  | "Base game"
  | "Riverfolk Expansion"
  | "Underworld Expansion"
  | "Marauder Expansion"
  | "Homeland Expansion";
export type LearningCurve = "Gentle" | "Moderate" | "Steep";

export interface Faction {
  /** Single letter, stable, used in share codes. */
  id: string;
  name: string;
  /** Monogram for the colored disc. */
  mono: string;
  expansion: Expansion;
  animal: string;
  type: FactionType;
  reach: number;
  color: string;
  /** Text color on top of color. */
  ink: string;
  /** This tool's own estimate, not an official rating. */
  learningCurve: LearningCurve;
  lawSlug: string;
  secondVagabond?: boolean;
  homeland?: boolean;
  lore: string;
  plays: string;
  tip: string;
}

/** Minimum total reach by player count (Law of Root 5.2). Any mix with 17+ is allowed for adventurous tables. */
export const REACH_TARGETS: Record<number, number> = { 2: 17, 3: 18, 4: 21, 5: 25, 6: 28 };

export const EXPANSIONS: Expansion[] = [
  "Base game",
  "Riverfolk Expansion",
  "Underworld Expansion",
  "Marauder Expansion",
  "Homeland Expansion",
];

export const FACTIONS: Faction[] = [
  {
    "id": "m",
    "name": "Marquise de Cat",
    "mono": "MC",
    "expansion": "Base game",
    "animal": "Cats",
    "type": "Militant",
    "reach": 10,
    "color": "#d9622b",
    "ink": "#fff",
    "learningCurve": "Gentle",
    "lawSlug": "marquise-de-cat",
    "lore": "An industrious feline aristocrat has seized the Woodland and means to turn it into a timber empire. When the game opens she already holds nearly every clearing, and everyone else wants a piece of it.",
    "plays": "An engine builder with an army to protect it. You start spread thin across the whole map, turn wood from sawmills into workshops, recruiters and more sawmills, and score more for each building of a type you add. Your Keep anchors one corner, and fallen warriors can be brought back by spending a matching card. You get only a few actions per turn, so every march and battle competes with building.",
    "tip": "A good first faction. The whole table will chip away at you, so decide which clearings you truly need and let the rest go."
  },
  {
    "id": "e",
    "name": "Eyrie Dynasties",
    "mono": "ED",
    "expansion": "Base game",
    "animal": "Birds",
    "type": "Militant",
    "reach": 7,
    "color": "#2f5fa8",
    "ink": "#fff",
    "learningCurve": "Moderate",
    "lawSlug": "eyrie-dynasties",
    "lore": "The proud bird houses once ruled the forest and have returned to reclaim it, led by a succession of quarrelsome leaders who are bound by tradition and by their own promises.",
    "plays": "Every turn you must add cards to the Decree, a growing program of recruit, move, battle and build orders tied to clearing suits, and then carry out all of it. Roosts score every evening, so the engine snowballs quickly. If you cannot complete an order you fall into turmoil: you lose points, the Decree is wiped and a new leader takes over. Birds win ties for rule, but they earn little from crafting.",
    "tip": "Explosive but brittle. Plan two turns ahead and use bird cards to keep the Decree flexible."
  },
  {
    "id": "a",
    "name": "Woodland Alliance",
    "mono": "WA",
    "expansion": "Base game",
    "animal": "Mixed creatures",
    "type": "Insurgent",
    "reach": 3,
    "color": "#4e9a4a",
    "ink": "#fff",
    "learningCurve": "Moderate",
    "lawSlug": "woodland-alliance",
    "lore": "Ordinary creatures who are tired of being fought over. They organise in secret, spread sympathy from clearing to clearing, and wait for the right moment to rise.",
    "plays": "You begin with nothing on the board. Spend supporter cards to place sympathy tokens, which score as they spread and force enemies who move in or remove them to hand you cards. A revolt clears out a clearing and founds a base; bases train officers, and officers supply the military actions you otherwise lack. Slow start, frightening finish.",
    "tip": "Stay quiet early. Opponents who ignore sympathy for two rounds usually regret it."
  },
  {
    "id": "v",
    "name": "Vagabond",
    "mono": "V",
    "expansion": "Base game",
    "animal": "Lone wanderer",
    "type": "Insurgent",
    "reach": 5,
    "color": "#6b6b6b",
    "ink": "#fff",
    "learningCurve": "Moderate",
    "lawSlug": "vagabond",
    "lore": "A lone wanderer with a pack of gear and no loyalty to any banner, drifting between the factions as helper, mercenary or menace, whichever suits the day.",
    "plays": "You control a single pawn instead of an army, and you act by exhausting items: boots to move, swords to fight, and so on. Score by completing quests, by aiding factions to improve your standing with them, or by turning hostile and hunting their warriors. You explore ruins for more gear and slip through forests where armies cannot follow. Several characters offer different starting kits and a special ability.",
    "tip": "An adventure game inside a war game. The table has to keep an eye on you, or your item engine runs away with it."
  },
  {
    "id": "w",
    "name": "Vagabond (second)",
    "mono": "V2",
    "expansion": "Riverfolk Expansion",
    "animal": "Lone wanderer",
    "type": "Insurgent",
    "reach": 2,
    "color": "#3e3e3e",
    "ink": "#fff",
    "learningCurve": "Moderate",
    "lawSlug": "vagabonds",
    "secondVagabond": true,
    "lore": "A second wanderer on the same roads. Two Vagabonds can cooperate, compete for the same quests, or simply get in each other's way.",
    "plays": "Plays exactly like the first Vagabond with a different character. Because two wanderers add less board presence than two armies, the second one counts for only 2 reach. It can only be drafted once the first Vagabond has been taken, and neither can share a game with the Knaves of the Deepwood.",
    "tip": "Best in 5 and 6 player games where the map can absorb another pawn."
  },
  {
    "id": "r",
    "name": "Riverfolk Company",
    "mono": "RC",
    "expansion": "Riverfolk Expansion",
    "animal": "Otters",
    "type": "Insurgent",
    "reach": 5,
    "color": "#3fa7a3",
    "ink": "#fff",
    "learningCurve": "Steep",
    "lawSlug": "riverfolk-company",
    "lore": "Otter merchants who paddled upriver the moment they smelled opportunity. They do not much care who wins the war, as long as everyone keeps buying.",
    "plays": "You sell services to the other players: cards from your face-up hand, travel along the rivers, and your warriors as mercenaries. Buyers pay by placing their own warriors on your board, and those become the funds you spend on actions or commit for dividends. Trade posts on the map score points and widen your market. You set your prices every turn, so reading the table matters as much as tactics.",
    "tip": "Best with four or more players who are willing to buy. If nobody trades, you starve."
  },
  {
    "id": "l",
    "name": "Lizard Cult",
    "mono": "LC",
    "expansion": "Riverfolk Expansion",
    "animal": "Lizards",
    "type": "Insurgent",
    "reach": 2,
    "color": "#d6b82c",
    "ink": "#2a2620",
    "learningCurve": "Steep",
    "lawSlug": "the-lizard-cult",
    "lore": "A reptilian cult that preaches to the downtrodden and gathers the forgotten of the war into its gardens. Where others see casualties, the Cult sees converts.",
    "plays": "You reveal cards instead of spending them, placing warriors and gardens in matching clearings, and you score by discarding cards that match the gardens you have built. The most common suit in the discard pile becomes the Outcast, which decides where your strongest conspiracies can happen. Warriors lost in defence become acolytes, and acolytes pay for those conspiracies, including converting enemy warriors and buildings to your side. Ordinary moving and attacking is hard for you.",
    "tip": "An odd, reactive faction. You grow stronger when attacked, so make yourself inconvenient to ignore."
  },
  {
    "id": "d",
    "name": "Underground Duchy",
    "mono": "UD",
    "expansion": "Underworld Expansion",
    "animal": "Moles",
    "type": "Militant",
    "reach": 8,
    "color": "#c98f6b",
    "ink": "#2a2620",
    "learningCurve": "Moderate",
    "lawSlug": "underground-duchy",
    "lore": "A subterranean mole kingdom with a parliament of nobles, tunnelling up into the Woodland to extend civilisation, by its own definition, to the surface.",
    "plays": "Your warriors muster in the Burrow, an off-map space joined to the Woodland by tunnels. Reveal cards to sway ministers; each minister grants a permanent extra action and scores points, so your turn keeps getting bigger. Citadels and markets on the surface improve recruiting and card draw. Losing a building also costs you a minister, so setbacks hurt twice.",
    "tip": "Steady and powerful once the ministers are in place. Protect your buildings above everything else."
  },
  {
    "id": "c",
    "name": "Corvid Conspiracy",
    "mono": "CC",
    "expansion": "Underworld Expansion",
    "animal": "Crows",
    "type": "Insurgent",
    "reach": 3,
    "color": "#4b4a9e",
    "ink": "#fff",
    "learningCurve": "Moderate",
    "lawSlug": "corvid-conspiracy",
    "lore": "A crow syndicate that works through blackmail, sabotage and rumour. Nobody is sure where its agents are until something explodes.",
    "plays": "You place face-down plot tokens (bomb, snare, extortion, raid) and flip them on later turns for points and effects; the more plots already face up, the more each flip is worth. Opponents can try to expose a plot by guessing its type and showing a matching card, so bluffing is central. You have few warriors, but you can recruit into every clearing of a suit at once, and crows defending alongside a hidden plot hit harder.",
    "tip": "A mind-game faction with a small footprint. Strongest when opponents cannot spare the cards to call your bluffs."
  },
  {
    "id": "h",
    "name": "Lord of the Hundreds",
    "mono": "LH",
    "expansion": "Marauder Expansion",
    "animal": "Rats",
    "type": "Militant",
    "reach": 9,
    "color": "#b3262b",
    "ink": "#fff",
    "learningCurve": "Moderate",
    "lawSlug": "lord-of-the-hundreds",
    "lore": "A rat warlord and his horde, sweeping in to burn, loot and rule. The horde follows strength, and the Warlord intends to be the strongest thing in the forest.",
    "plays": "Everything turns on your Warlord piece and the items you hoard: a bigger hoard means more actions and stronger recruiting and fighting. Mob tokens spread by themselves and raze what they touch, while strongholds turn out warriors. You score by oppressing, which means ruling clearings that hold no enemy pieces at all. Each turn you pick a mood that grants one special ability.",
    "tip": "The most direct aggressor in the game. Great if you like hitting things, though the table will band together against you."
  },
  {
    "id": "k",
    "name": "Keepers in Iron",
    "mono": "KI",
    "expansion": "Marauder Expansion",
    "animal": "Badgers",
    "type": "Militant",
    "reach": 8,
    "color": "#7a7f87",
    "ink": "#fff",
    "learningCurve": "Steep",
    "lawSlug": "keepers-in-iron",
    "lore": "An order of badger knights on an expedition to recover the ancient relics of their people, long lost in the forests of the Woodland. To them the war is a distraction.",
    "plays": "Your actions come from a retinue: cards slotted into three columns that let you move, fight and delve, or move and recover. Dig relics out of the forests, then carry them to a waystation of the matching kind to recover them for points, with bonuses for complete sets. The retinue wears down as you use it and needs topping up. Your knights are hard to kill, but enemies are rewarded for taking relics away from you.",
    "tip": "A logistics puzzle with a strong army attached. Rewards planning your routes several turns ahead."
  },
  {
    "id": "f",
    "name": "Lilypad Diaspora",
    "mono": "LD",
    "expansion": "Homeland Expansion",
    "animal": "Frogs",
    "type": "Militant",
    "reach": 7,
    "color": "#7fae3c",
    "ink": "#fff",
    "learningCurve": "Steep",
    "lawSlug": "lilypad-diaspora",
    "homeland": true,
    "lore": "Frogs scattered from the Woodland long ago are coming home. They hope to settle peacefully among their neighbours, but old grievances and nervous sentries make that peace fragile.",
    "plays": "You settle enclave tokens across the map and bring a fourth suit, frogs, into the game with its own cards. Peaceful enclaves are where your points come from; when enemies attack you, enclaves can harden into militancy, which makes you more dangerous but pulls you away from that peaceful scoring. Managing the balance, and tempting or deterring attacks, is the heart of the faction. The new suit touches every player and adds a little setup.",
    "tip": "The widest footprint in Homeland. Worth a rules read for the whole table, since the frog suit changes the deck."
  },
  {
    "id": "t",
    "name": "Twilight Council",
    "mono": "TC",
    "expansion": "Homeland Expansion",
    "animal": "Bats",
    "type": "Insurgent",
    "reach": 4,
    "color": "#8e5ba8",
    "ink": "#fff",
    "learningCurve": "Steep",
    "lawSlug": "twilight-council",
    "homeland": true,
    "lore": "Bats weary of the endless war, who convene great assemblies where every creature of the Woodland, grand or humble, is asked to argue instead of fight.",
    "plays": "You place assembly tokens that bring clearings under your governance. Other factions are limited in placing pieces there outside of battle, which can shut down building, recruiting and sympathy. You step in to defend factions attacked at your assemblies, keep a few loyalist warriors on your board for flexible deployment, and score from the assemblies you govern. As you progress you declare edicts that change how assemblies work and shift what your opponents want to do.",
    "tip": "A control faction that wins by shaping what others are allowed to do. Expect to negotiate constantly."
  },
  {
    "id": "n",
    "name": "Knaves of the Deepwood",
    "mono": "KD",
    "expansion": "Homeland Expansion",
    "animal": "Skunks",
    "type": "Insurgent",
    "reach": 4,
    "color": "#2b2b2b",
    "ink": "#fff",
    "learningCurve": "Moderate",
    "lawSlug": "knaves-of-the-deepwood",
    "homeland": true,
    "lore": "A band of skunk outlaws whose origins are mostly tall tales. They strike from the treeline, vanish back into the deep woods, and leave with prisoners in tow.",
    "plays": "A small force led by captains. You move through forests as well as clearings, raid enemy positions and carry warriors off as hostages to be ransomed. Winning fights earns acclaim tokens that mark your growing legend. With only a handful of warriors you rely on mobility and nuisance value instead of holding ground. The Knaves cannot be played in the same game as the Vagabond.",
    "tip": "A raider that makes big armies think twice. Low reach, high irritation."
  }
];
