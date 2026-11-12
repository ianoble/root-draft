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
  /** What the faction does well. */
  goodAt: string[];
  /** Weaknesses and common ways it goes wrong. */
  watchOut: string[];
  /** Setup and a sensible opening, one step per entry. A suggestion, not the only line of play. */
  firstTurns: string[];
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
    "tip": "A good first faction. The whole table will chip away at you, so decide which clearings you truly need and let the rest go.",
    "goodAt": [
      "Board presence from the first turn: you start with a warrior in almost every clearing.",
      "Steady, predictable points, since every building you place scores.",
      "Staying power. With wood and cards to spare you can rebuild and bring fallen warriors back."
    ],
    "watchOut": [
      "Only three actions a turn (bird cards buy extras), so you cannot defend everywhere.",
      "Buildings cost more wood the further you go, and the wood has to be linked to the building site through clearings you rule.",
      "Every other faction grows by taking clearings from you."
    ],
    "firstTurns": [
      "Setup: put the Keep in a corner and place your starting sawmill, workshop and recruiter close to it, where they are easy to protect.",
      "Turn 1: spend your first wood on a second building (another sawmill keeps the wood coming), then recruit and march warriors toward the clearings you mean to keep.",
      "Turns 2 and 3: build every turn and start crafting with your workshops. Pull back from clearings you cannot hold instead of losing warriors one at a time."
    ]
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
    "tip": "Explosive but brittle. Plan two turns ahead and use bird cards to keep the Decree flexible.",
    "goodAt": [
      "Speed: a full Decree gives you more actions per turn than anyone else.",
      "Reliable points, since roosts score every evening and score more the more you have.",
      "Winning ties for rule, so matching an enemy's numbers is enough to hold a clearing."
    ],
    "watchOut": [
      "Turmoil. One order you cannot carry out costs points, wipes the Decree and replaces your leader.",
      "Opponents can cause turmoil on purpose by removing the roosts or targets your orders rely on.",
      "Crafted items are worth only one point each to you."
    ],
    "firstTurns": [
      "Setup: you start with a roost and six warriors in a corner. Choose a leader, who decides where your two starting vizier cards sit in the Decree and gives you a special ability.",
      "Turn 1: add one or two cards to the Decree (only one may be a bird card), then recruit and move out. Aim to have a second roost within your first two turns.",
      "Turns 2 and 3: grow the Decree slowly. Put a suited card in Recruit only while you hold a roost of that suit, and keep bird cards for the orders where flexibility matters most."
    ]
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
    "tip": "Stay quiet early. Opponents who ignore sympathy for two rounds usually regret it.",
    "goodAt": [
      "A strong late game: each sympathy token scores more than the one before.",
      "Making enemies pay. Moving into sympathy or removing it hands you cards.",
      "Defence: you use the higher die when attacked, and a revolt wipes a clearing clean."
    ],
    "watchOut": [
      "A slow, fragile start with no pieces on the map.",
      "Losing a base costs you matching supporters and half your officers at once.",
      "Without a base your supporter stack is capped, and you have only ten warriors."
    ],
    "firstTurns": [
      "Setup: you start with three supporter cards and nothing on the map.",
      "Turn 1: spend supporters to place your first sympathy tokens (the first can go anywhere, later ones must be next to existing sympathy), and move a card or two from your hand into the supporters.",
      "Turns 2 and 3: revolt in a sympathetic clearing where it hurts an opponent most. That founds a base and gives you warriors; then train officers so you can move, recruit and fight."
    ]
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
    "tip": "An adventure game inside a war game. The table has to keep an eye on you, or your item engine runs away with it.",
    "goodAt": [
      "Flexibility: you can help, trade with or attack anyone, and change sides as the game develops.",
      "Going anywhere. You slip through forests and are never locked out by who rules a clearing.",
      "Snowballing: every item you gain is another action each turn."
    ],
    "watchOut": [
      "You rule nothing, so you cannot hold ground or stop anyone building.",
      "Damaged items do nothing until repaired, and a few hits can cost you a whole turn.",
      "You depend on others crafting items for you to pick up. If the table stops crafting or turns on you early, you stall."
    ],
    "firstTurns": [
      "Setup: choose a character and start in any forest.",
      "Turn 1: move to a ruin and explore it for an item (this uses your torch).",
      "Turns 2 and 3: aid factions to pick up the items they craft and to improve your standing with them, and complete a quest when your items match one. Decide later whether anyone is worth attacking."
    ]
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
    "tip": "Best in 5 and 6 player games where the map can absorb another pawn.",
    "goodAt": [
      "Everything the first Vagabond is good at, with a different character's special ability.",
      "Adding a player without crowding the map with another army.",
      "Teaming up: two wanderers can lean on a runaway leader together."
    ],
    "watchOut": [
      "You share ruins, quests and crafted items with the other Vagabond, so both of you grow more slowly.",
      "Low reach: the rest of the lineup has to supply the board presence."
    ],
    "firstTurns": [
      "Setup: choose a different character from the first Vagabond and start in a forest well away from theirs.",
      "Turn 1: head for a ruin the other Vagabond is not going for and explore it.",
      "After that, play as the first Vagabond would, and agree early whether the two of you are cooperating or racing."
    ]
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
    "tip": "Best with four or more players who are willing to buy. If nobody trades, you starve.",
    "goodAt": [
      "An economy that feeds itself: being paid means more funds, and more funds mean more actions.",
      "Mobility. You treat rivers as paths, and you can sell that to others.",
      "Flexible scoring, from trade posts and from holding funds back for dividends."
    ],
    "watchOut": [
      "You rely on customers. A table that refuses to buy leaves you with little to do.",
      "Your hand is face up, so everyone sees what you could craft or play.",
      "A destroyed trade post is gone for good and costs you half your funds."
    ],
    "firstTurns": [
      "Setup: place four warriors in clearings along the river, put three more into your payments, and set your starting prices.",
      "Turn 1: use your funds to draw cards and establish a first trade post in a clearing ruled by a likely customer. Keep prices low so people start buying.",
      "Turns 2 and 3: add trade posts in other suits, raise the price of whatever sells, and decide each turn between spending funds on actions and keeping them for dividend points."
    ]
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
    "tip": "An odd, reactive faction. You grow stronger when attacked, so make yourself inconvenient to ignore.",
    "goodAt": [
      "Resilience: warriors lost while defending come back as acolytes, which power your strongest actions.",
      "Appearing anywhere. Recruiting only needs a matching card, not a neighbouring clearing.",
      "Holding ground: you rule any clearing where you have a garden."
    ],
    "watchOut": [
      "Moving and attacking are conspiracies. They cost acolytes and only work in clearings of the Outcast suit.",
      "Every garden you lose also costs you a card from your hand.",
      "Bird cards are weak for you, since they cannot be used for ordinary rituals."
    ],
    "firstTurns": [
      "Setup: four warriors and a garden in a corner, one warrior in each neighbouring clearing, and two acolytes on your board.",
      "Turn 1: reveal cards to recruit and to build a second garden in the same suit as your first. Revealed cards come back to your hand, so use all of them.",
      "Turns 2 and 3: score by spending a card that matches a suit where you have gardens, and watch the discard pile, since it sets the Outcast suit and so where your acolytes can act."
    ]
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
    "tip": "Steady and powerful once the ministers are in place. Protect your buildings above everything else.",
    "goodAt": [
      "A turn that keeps growing: each minister adds a permanent action.",
      "Striking where you choose. Tunnels let the army in the Burrow surface across the map.",
      "Safety: warriors waiting in the Burrow cannot be attacked."
    ],
    "watchOut": [
      "A slow first few turns while the first ministers are swayed.",
      "Losing a building also unseats one of your highest-ranked ministers.",
      "Swaying takes several cards matching clearings where you have pieces, so you are always short of cards."
    ],
    "firstTurns": [
      "Setup: two warriors and a tunnel in a corner, and two warriors in each neighbouring clearing.",
      "Turn 1: use your two actions to recruit and to build a market or citadel (you pay by revealing a matching card), then sway a low-ranked minister.",
      "Turns 2 and 3: sway a minister every turn if you can, dig a second tunnel toward a quiet part of the map, and keep enough warriors on the surface to protect each building."
    ]
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
    "tip": "A mind-game faction with a small footprint. Strongest when opponents cannot spare the cards to call your bluffs.",
    "goodAt": [
      "Presence everywhere for little cost: one card recruits a crow into every clearing of its suit.",
      "Points that speed up, since each plot you flip is worth more than the last.",
      "Deterrence. Nobody knows which token is a bomb or a snare."
    ],
    "watchOut": [
      "Very few warriors, and every plot costs warriors to place.",
      "Opponents with cards to spare can guess at your plots, and a correct guess removes the token.",
      "Little fighting strength, so a determined army can sweep your tokens away."
    ],
    "firstTurns": [
      "Setup: one warrior in a clearing of each suit.",
      "Turn 1: recruit by spending a card, then give up a warrior to place your first plot face down somewhere opponents are unlikely to bother it.",
      "Turns 2 and 3: flip that plot at the start of your turn for points, then place more. Mix real threats with decoys so guessing stays risky."
    ]
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
    "tip": "The most direct aggressor in the game. Great if you like hitting things, though the table will band together against you.",
    "goodAt": [
      "Aggression from the first turn: a strong Warlord and plenty of warriors.",
      "Clearing the board. Mobs destroy enemy buildings and tokens without a fight.",
      "Momentum: each item in your hoard raises how much you can recruit or do."
    ],
    "watchOut": [
      "Everything depends on the Warlord, and losing him sets you back badly.",
      "Oppressing only scores in clearings you rule that hold no enemy pieces at all, so a single warrior or token can deny you.",
      "The whole table tends to unite against you early."
    ],
    "firstTurns": [
      "Setup: the Warlord, four warriors and a stronghold in a corner clearing.",
      "Turn 1: choose a mood, recruit, and advance with the Warlord into a neighbouring clearing, fighting if someone is in the way. Incite a mob if you hold a matching card.",
      "Turns 2 and 3: collect items (by crafting, from ruins or from beaten opponents) to grow your hoard, add a second stronghold, and empty clearings of enemy pieces so they score."
    ]
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
    "tip": "A logistics puzzle with a strong army attached. Rewards planning your routes several turns ahead.",
    "goodAt": [
      "Tough armies: knights guarding a relic shrug off the first hit in a battle.",
      "Big scoring turns from recovering relics, with a bonus for completing sets.",
      "A plan you design yourself, since you choose which cards go in each retinue column."
    ],
    "watchOut": [
      "Slow to start scoring: relics have to be dug up, carried and recovered.",
      "Enemies score for taking relics from you.",
      "Large stacks shrink, because crowded clearings lose a warrior each evening, and the retinue needs regular topping up."
    ],
    "firstTurns": [
      "Setup: you start with warriors in two neighbouring clearings on the map edge, relics scattered through the forests, and a starting card in each retinue column.",
      "Turn 1: set up a waystation (it costs a warrior), move toward the nearest forest holding relics, and add cards to your retinue.",
      "Turns 2 and 3: delve for a first relic, carry it to a waystation of the matching type and recover it. Plan the route before you commit the cards."
    ]
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
    "tip": "The widest footprint in Homeland. Worth a rules read for the whole table, since the frog suit changes the deck.",
    "goodAt": [
      "Spreading wide and peacefully: enclaves score through cards, not through fighting.",
      "River travel. The frogs treat rivers as paths.",
      "Card draw that grows with the number of peaceful enclaves on the map."
    ],
    "watchOut": [
      "When an enemy attacks a peaceful enclave, every peaceful enclave where that enemy has pieces turns militant. Militant enclaves do not score, and you must battle at each one every evening.",
      "Provoking costs you a random card each time.",
      "You score once a turn, in the evening, with a single card, and never with a frog card."
    ],
    "firstTurns": [
      "Setup: five warriors and one peaceful enclave in a river clearing. The frog cards are shuffled into the shared deck.",
      "Turn 1: use Settle to move out along the river and place peaceful enclaves in clearings you rule. In the evening, spend one card to score for each peaceful enclave of that suit.",
      "Turns 2 and 3: keep settling, aiming for two or three enclaves of one suit so a single card scores well. Provoke only when you need warriors or want a fight."
    ]
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
    "plays": "You act by revealing cards in the morning (to move, recruit, battle or place an assembly) and take them back in the evening, when each one can power a second action. Assemblies are the heart of the faction: at a governing assembly other factions cannot place or remove pieces or craft, except through battle, which can shut down building, recruiting and sympathy. Each evening you score for governing assemblies that share a clearing with enemy buildings or tokens. A few loyalist warriors wait on your board to be deployed where they are needed, and your warriors help defend other factions attacked at your assemblies.",
    "tip": "A control faction that wins by shaping what others are allowed to do. Expect to negotiate constantly.",
    "goodAt": [
      "Shutting clearings down: at a governing assembly, enemies cannot place or remove pieces or craft, except through battle.",
      "Reusing cards. Cards revealed for actions in the morning return to your hand in the evening.",
      "Moving enemies without removing them: Banish pushes defenders out of an assembly clearing."
    ],
    "watchOut": [
      "Only six assemblies, and they score only when an enemy building or token shares the clearing.",
      "Any enemy can force an assembly closed by entreating, and a closed assembly does not govern.",
      "Each assembly an enemy removes costs you a loyalist."
    ],
    "firstTurns": [
      "Setup: four warriors in a corner clearing and two in another clearing.",
      "Turn 1: reveal cards to recruit and move, then assemble in a clearing you rule that also holds an enemy building or token. Assemblies you rule start governing in the evening.",
      "Turns 2 and 3: add assemblies where opponents have built, keep enough warriors there to rule, and build up loyalists to deploy later."
    ]
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
    "plays": "A small band led by three captains, one of whom acts each turn. You move through forests as well as clearings, and warriors your acting captain hits become prisoners held in the forests instead of being removed. Fights and item actions leave acclaim tokens in clearings, and each evening you score for every two prisoners and every two acclaim. A stash of items gives the captains special actions such as extra moves and surprise attacks. With only ten skunks you rely on mobility and nuisance value instead of holding ground. The Knaves cannot be played in the same game as the Vagabond.",
    "tip": "A raider that makes big armies think twice. Low reach, high irritation.",
    "goodAt": [
      "Mobility: captains and skunks move through forests as freely as clearings.",
      "Taking prisoners. Warriors your acting captain hits are carried off to the forests instead of removed, and they score for you every evening.",
      "A toolbox of item actions, from extra moves to surprise attacks."
    ],
    "watchOut": [
      "Only ten skunks and three captains. A fallen captain cannot be replaced, only brought back at the cost of an action and nearby prisoners.",
      "A captain can be hit as soon as no skunks stand with them.",
      "Points come in pairs (one for every two prisoners and every two acclaim), so small setbacks matter."
    ],
    "firstTurns": [
      "Setup: choose three captains and place each with one skunk in a different forest. Their six items form your stash.",
      "Turn 1: pick an acting captain, step out of the forest and attack a lightly held clearing. Hits become prisoners, and the fight leaves acclaim in the clearing.",
      "Turns 2 and 3: use a different captain each turn so all three refresh together, spend cards in the evening to add skunks where you have acclaim, and work toward pairs of prisoners and acclaim."
    ]
  }
];
