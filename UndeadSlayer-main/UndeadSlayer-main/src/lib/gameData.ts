import { heroPortrait, monsterPortrait } from "./artAssets";
import type { SpriteKit } from "./sprites";

export type HeroClass =
  | "Warrior"
  | "Swordsman"
  | "Archer"
  | "Mage"
  | "Assassin"
  | "Guardian"
  | "Druid"
  | "Paladin"
  | "Sorcerer"
  | "Monk";

export interface HeroDef {
  id: string;
  name: string;
  title: string;
  classType: HeroClass;
  classIcon: string;
  weapon: string;
  role: string;
  avatar: string;
  image: string; // character portrait (painted PNG or vector data URI)
  sprite: SpriteKit; // in-battle sprite kit
  color: string;
  accentColor: string;
  unlockCost: number;
  stats: { hp: number; atk: number; def: number; spd: number; critRate: number };
  skill: {
    name: string;
    description: string;
    cooldown: number;
    damageMultiplier: number;
    icon: string;
    type:
      | "spin"
      | "arrow_rain"
      | "furious_combo"
      | "elemental_blast"
      | "shadow_dash"
      | "ground_slam"
      | "thorn_heal"
      | "dark_wave"
      | "chain_lightning"
      | "dragon_flame";
    color: string;
  };
  lore: string;
  attackStyle: "melee" | "ranged" | "magic";
  range: number;
}

const SKIN = "#f2c39a";
const DARK = "#221d2e";

export const HEROES: Record<string, HeroDef> = {
  aiden: {
    id: "aiden",
    name: "Aiden",
    title: "Blade of the Dawn",
    classType: "Swordsman",
    classIcon: "🗡️",
    weapon: "Runed Longsword",
    role: "Balanced melee fighter",
    avatar: "🗡️",
    image: heroPortrait({
      bg1: "#16233f", bg2: "#0b1220", skin: SKIN, hair: "#3f3a52", armor: "#2f5fbf",
      accent: "#8ec5ff", cape: "#1d3f7a", weaponColor: "#dfe7ff", headgear: "helm", weaponArt: "sword",
    }),
    sprite: {
      shape: "humanoid", headgear: "helm", weapon: "sword", scale: 4,
      colors: { skin: SKIN, hair: "#3f3a52", armor: "#2f5fbf", accent: "#8ec5ff", cape: "#1d3f7a", weapon: "#dfe7ff", dark: DARK },
    },
    color: "#3b82f6",
    accentColor: "#60a5fa",
    unlockCost: 0,
    stats: { hp: 520, atk: 55, def: 28, spd: 4.8, critRate: 0.12 },
    skill: {
      name: "Whirlwind Blade",
      description: "Spinning sword hurricane that cuts every surrounding foe.",
      cooldown: 8, damageMultiplier: 2.8, icon: "🌀", type: "spin", color: "#60a5fa",
    },
    lore: "A veteran knight sworn to cleanse the kingdom of the undead blight.",
    attackStyle: "melee",
    range: 90,
  },
  luna: {
    id: "luna",
    name: "Luna",
    title: "Moonlit Sharpshooter",
    classType: "Archer",
    classIcon: "🏹",
    weapon: "Silver Crescent Bow",
    role: "Long-range damage dealer",
    avatar: "🏹",
    image: heroPortrait({
      bg1: "#2a1b45", bg2: "#120b20", skin: "#f6d2b6", hair: "#c9a7ff", armor: "#6d3fb5",
      accent: "#e0c3ff", cape: "#3b2170", weaponColor: "#f5f0ff", headgear: "hood", weaponArt: "bow",
    }),
    sprite: {
      shape: "humanoid", headgear: "hood", weapon: "bow", scale: 4,
      colors: { skin: "#f6d2b6", hair: "#c9a7ff", armor: "#6d3fb5", accent: "#e0c3ff", cape: "#3b2170", weapon: "#f5f0ff", dark: DARK },
    },
    color: "#a855f7",
    accentColor: "#c084fc",
    unlockCost: 0,
    stats: { hp: 420, atk: 68, def: 18, spd: 5.2, critRate: 0.22 },
    skill: {
      name: "Rain of Enchanted Arrows",
      description: "Calls a shower of starlight arrows across a wide zone.",
      cooldown: 9, damageMultiplier: 3.2, icon: "✨", type: "arrow_rain", color: "#c084fc",
    },
    lore: "Guardian of the celestial grove who fires silver arrows guided by moonlight.",
    attackStyle: "ranged",
    range: 280,
  },
  ronan: {
    id: "ronan",
    name: "Ronan",
    title: "Blood-Fury Warrior",
    classType: "Warrior",
    classIcon: "🪓",
    weapon: "Dual Blood Axes",
    role: "High physical damage",
    avatar: "🪓",
    image: heroPortrait({
      bg1: "#3d1212", bg2: "#1a0808", skin: "#e8b48c", hair: "#7f1d1d", armor: "#b91c1c",
      accent: "#fca5a5", cape: "#5c1010", weaponColor: "#e5e7eb", headgear: "headband", weaponArt: "axe",
    }),
    sprite: {
      shape: "humanoid", headgear: "headband", weapon: "axe", scale: 4,
      colors: { skin: "#e8b48c", hair: "#7f1d1d", armor: "#b91c1c", accent: "#fca5a5", cape: "#5c1010", weapon: "#e5e7eb", dark: DARK },
    },
    color: "#ef4444",
    accentColor: "#f87171",
    unlockCost: 800,
    stats: { hp: 600, atk: 75, def: 22, spd: 4.6, critRate: 0.2 },
    skill: {
      name: "Furious Multi-Hit Combo",
      description: "A rapid chain of devastating axe cleaves in front of you.",
      cooldown: 10, damageMultiplier: 3.8, icon: "🩸", type: "furious_combo", color: "#f87171",
    },
    lore: "Channels ancestral blood fury into axe slashes that shatter armor.",
    attackStyle: "melee",
    range: 95,
  },
  mira: {
    id: "mira",
    name: "Mira",
    title: "Elemental Scholar",
    classType: "Mage",
    classIcon: "🔮",
    weapon: "Prismatic Staff",
    role: "Ranged magic attacker",
    avatar: "🔮",
    image: heroPortrait({
      bg1: "#0d3b46", bg2: "#061c22", skin: "#f6d2b6", hair: "#22d3ee", armor: "#0e7490",
      accent: "#a5f3fc", cape: "#155e75", weaponColor: "#67e8f9", headgear: "hat", weaponArt: "staff",
    }),
    sprite: {
      shape: "humanoid", headgear: "hat", weapon: "staff", scale: 4,
      colors: { skin: "#f6d2b6", hair: "#22d3ee", armor: "#0e7490", accent: "#a5f3fc", cape: "#155e75", weapon: "#67e8f9", dark: DARK },
    },
    color: "#06b6d4",
    accentColor: "#22d3ee",
    unlockCost: 1200,
    stats: { hp: 400, atk: 80, def: 16, spd: 4.5, critRate: 0.15 },
    skill: {
      name: "Elemental Explosion",
      description: "A vortex of fire and frost bursts outward from the staff.",
      cooldown: 11, damageMultiplier: 3.6, icon: "💥", type: "elemental_blast", color: "#22d3ee",
    },
    lore: "Master of primordial fire and crystal ice, shaping cataclysmic spells.",
    attackStyle: "magic",
    range: 260,
  },
  kael: {
    id: "kael",
    name: "Kael",
    title: "Nightshade Assassin",
    classType: "Assassin",
    classIcon: "🥷",
    weapon: "Dual Shadow Daggers",
    role: "Fast attacks & critical damage",
    avatar: "🥷",
    image: heroPortrait({
      bg1: "#2e1065", bg2: "#12101d", skin: "#e8e0f0", hair: "#e2e8f0", armor: "#4c1d95",
      accent: "#a855f7", cape: "#221c33", weaponColor: "#e2e8f0", headgear: "hood", weaponArt: "dagger",
    }),
    sprite: {
      shape: "humanoid", headgear: "hood", weapon: "dagger", scale: 4,
      colors: { skin: "#e8e0f0", hair: "#e2e8f0", armor: "#4c1d95", accent: "#a855f7", cape: "#221c33", weapon: "#e2e8f0", dark: "#1e0a3c" },
    },
    color: "#7c3aed",
    accentColor: "#a855f7",
    unlockCost: 1600,
    stats: { hp: 440, atk: 72, def: 19, spd: 5.8, critRate: 0.35 },
    skill: {
      name: "Shadow Dash Strikes",
      description: "Blink behind the nearest foe and unleash a flurry of cuts.",
      cooldown: 7, damageMultiplier: 3.4, icon: "⚡", type: "shadow_dash", color: "#94a3b8",
    },
    lore: "Silent stalker of the shadow guild who strikes before foes can blink.",
    attackStyle: "melee",
    range: 85,
  },
  bruno: {
    id: "bruno",
    name: "Bruno",
    title: "Ironwall Guardian",
    classType: "Guardian",
    classIcon: "🛡️",
    weapon: "War Hammer & Aegis",
    role: "Tank with high defense",
    avatar: "🛡️",
    image: heroPortrait({
      bg1: "#3f3410", bg2: "#1c1706", skin: "#e8b48c", hair: "#a16207", armor: "#ca8a04",
      accent: "#fde68a", cape: "#78500a", weaponColor: "#9ca3af", headgear: "helm", weaponArt: "hammer",
    }),
    sprite: {
      shape: "humanoid", headgear: "helm", weapon: "hammer", scale: 4, shield: true,
      colors: { skin: "#e8b48c", hair: "#a16207", armor: "#ca8a04", accent: "#fde68a", cape: "#78500a", weapon: "#9ca3af", dark: DARK },
    },
    color: "#eab308",
    accentColor: "#facc15",
    unlockCost: 2000,
    stats: { hp: 750, atk: 50, def: 45, spd: 4.0, critRate: 0.08 },
    skill: {
      name: "Titan Ground Slam",
      description: "Hammer slam creates a shockwave that stuns nearby enemies.",
      cooldown: 10, damageMultiplier: 3.0, icon: "🔨", type: "ground_slam", color: "#facc15",
    },
    lore: "An ironclad sentinel whose barrier protects the realm from dark armies.",
    attackStyle: "melee",
    range: 90,
  },
  sylvie: {
    id: "sylvie",
    name: "Sylvie",
    title: "Grove Druid",
    classType: "Druid",
    classIcon: "🌿",
    weapon: "Bloomwood Staff",
    role: "Healing & nature magic",
    avatar: "🌿",
    image: heroPortrait({
      bg1: "#0f4c4c", bg2: "#041f1f", skin: "#f6d2b6", hair: "#2dd4bf", armor: "#0f766e",
      accent: "#5eead4", cape: "#134e4a", weaponColor: "#5eead4", headgear: "hat", weaponArt: "staff",
    }),
    sprite: {
      shape: "humanoid", headgear: "hat", weapon: "staff", scale: 4,
      colors: { skin: "#f6d2b6", hair: "#2dd4bf", armor: "#0f766e", accent: "#5eead4", cape: "#134e4a", weapon: "#5eead4", dark: "#134e4a" },
    },
    color: "#14b8a6",
    accentColor: "#5eead4",
    unlockCost: 2500,
    stats: { hp: 480, atk: 62, def: 24, spd: 4.9, critRate: 0.14 },
    skill: {
      name: "Healing Aura & Thorns",
      description: "Restores 40% HP and erupts briar vines under nearby enemies.",
      cooldown: 12, damageMultiplier: 2.7, icon: "🌱", type: "thorn_heal", color: "#4ade80",
    },
    lore: "Communes with grove spirits to mend wounds and entangle fiends.",
    attackStyle: "magic",
    range: 240,
  },
  darius: {
    id: "darius",
    name: "Darius",
    title: "Abyssal Paladin",
    classType: "Paladin",
    classIcon: "⚔️",
    weapon: "Cursed Greatsword",
    role: "Heavy melee damage",
    avatar: "⚔️",
    image: heroPortrait({
      bg1: "#2b1450", bg2: "#120722", skin: "#e0c3a0", hair: "#a78bfa", armor: "#5b21b6",
      accent: "#ddd6fe", cape: "#2e1065", weaponColor: "#c4b5fd", headgear: "crown", weaponArt: "greatsword",
    }),
    sprite: {
      shape: "humanoid", headgear: "crown", weapon: "greatsword", scale: 4,
      colors: { skin: "#e0c3a0", hair: "#a78bfa", armor: "#5b21b6", accent: "#ddd6fe", cape: "#2e1065", weapon: "#c4b5fd", dark: DARK },
    },
    color: "#7c3aed",
    accentColor: "#a78bfa",
    unlockCost: 3200,
    stats: { hp: 620, atk: 82, def: 32, spd: 4.4, critRate: 0.18 },
    skill: {
      name: "Dark Blade Wave",
      description: "A crescent of abyssal energy pierces through enemy ranks.",
      cooldown: 9, damageMultiplier: 3.5, icon: "🌑", type: "dark_wave", color: "#a78bfa",
    },
    lore: "A fallen paladin who fights corruption with corruption.",
    attackStyle: "melee",
    range: 110,
  },
  elian: {
    id: "elian",
    name: "Elian",
    title: "Tempest Sorcerer",
    classType: "Sorcerer",
    classIcon: "⚡",
    weapon: "Storm Arc Orb",
    role: "Area-of-effect magic damage",
    avatar: "⚡",
    image: heroPortrait({
      bg1: "#0f2f52", bg2: "#061526", skin: "#f6d2b6", hair: "#7dd3fc", armor: "#0369a1",
      accent: "#bae6fd", cape: "#075985", weaponColor: "#38bdf8", headgear: "hat", weaponArt: "orb",
    }),
    sprite: {
      shape: "humanoid", headgear: "hat", weapon: "orb", scale: 4,
      colors: { skin: "#f6d2b6", hair: "#7dd3fc", armor: "#0369a1", accent: "#bae6fd", cape: "#075985", weapon: "#38bdf8", dark: DARK },
    },
    color: "#38bdf8",
    accentColor: "#7dd3fc",
    unlockCost: 4000,
    stats: { hp: 430, atk: 86, def: 20, spd: 4.7, critRate: 0.25 },
    skill: {
      name: "Chain Lightning",
      description: "Thunder arcs between every enemy in rapid succession.",
      cooldown: 10, damageMultiplier: 4.0, icon: "🌩️", type: "chain_lightning", color: "#7dd3fc",
    },
    lore: "Channeler of roaring sky storms who strikes with thunderous fury.",
    attackStyle: "magic",
    range: 270,
  },
  riven: {
    id: "riven",
    name: "Riven",
    title: "Flame Monk",
    classType: "Monk",
    classIcon: "🐉",
    weapon: "Flaming Dragon Fists",
    role: "Flame-ki martial artist",
    avatar: "🐉",
    image: heroPortrait({
      bg1: "#7c2d12", bg2: "#2c0d05", skin: "#d9a06b", hair: "#d9a06b", armor: "#b45309",
      accent: "#fbbf24", cape: "#5b3a1a", weaponColor: "#f97316", headgear: "none", weaponArt: "fist", bald: true,
    }),
    sprite: {
      shape: "humanoid", headgear: "none", weapon: "claw", scale: 4,
      colors: { skin: "#d9a06b", hair: "#d9a06b", armor: "#b45309", accent: "#fbbf24", cape: "#5b3a1a", weapon: "#d9a06b", dark: "#3d2812" },
    },
    color: "#f97316",
    accentColor: "#fb923c",
    unlockCost: 5000,
    stats: { hp: 700, atk: 95, def: 36, spd: 5.0, critRate: 0.28 },
    skill: {
      name: "Dragon Flame Burst",
      description: "Unleashes a raging dragon-flame burst that scorch-smites the area.",
      cooldown: 12, damageMultiplier: 4.6, icon: "🔥", type: "dragon_flame", color: "#fb923c",
    },
    lore: "A dragon-blooded monk who strikes with fists wreathed in holy flame.",
    attackStyle: "melee",
    range: 120,
  },
};

export const HERO_CLASS_LIST: Array<{ classType: HeroClass; icon: string; blurb: string }> = [
  { classType: "Swordsman", icon: "🗡️", blurb: "Balanced blade & spin attack" },
  { classType: "Archer", icon: "🏹", blurb: "Long-range arrow rain" },
  { classType: "Warrior", icon: "🪓", blurb: "Brutal multi-hit axes" },
  { classType: "Mage", icon: "🔮", blurb: "Elemental nova burst" },
  { classType: "Assassin", icon: "🥷", blurb: "Blink & crit flurry" },
  { classType: "Guardian", icon: "🛡️", blurb: "Tanky ground slam" },
  { classType: "Druid", icon: "🌿", blurb: "Self-heal + thorns" },
  { classType: "Paladin", icon: "⚔️", blurb: "Piercing dark wave" },
  { classType: "Sorcerer", icon: "⚡", blurb: "Chain lightning AoE" },
  { classType: "Monk", icon: "🐉", blurb: "Flame fists & dragon burst" },
];

export interface LevelDef {
  levelNumber: number;
  title: string;
  waveCount: number;
  enemiesPerWave: number;
  enemyTypes: string[];
  eliteTypes: string[];
  rewardCoins: number;
  rewardXp: number;
  isBossLevel: boolean;
}

export interface BossDef {
  key: string;
  name: string;
  title: string;
  avatar: string;
  image: string;
  sprite: SpriteKit;
  hp: number;
  atk: number;
  def: number;
  spd: number;
  color: string;
  abilities: string[];
  description: string;
  specialSkillName: string;
}

export interface ChapterDef {
  id: number;
  title: string;
  subtitle: string;
  environmentName: string;
  themeColor: string;
  bgGradient: string;
  description: string;
  /** arena palette: [floor, floorAlt, wall, propA, propB, propC] */
  arenaPalette: string[];
  terrainKind: string;
  levels: LevelDef[];
  boss: BossDef;
  completionReward: {
    coins: number;
    xp: number;
    item: {
      id: string;
      name: string;
      type: "weapon" | "armor" | "accessory";
      rarity: "rare" | "epic" | "legendary";
      atk: number;
      hp: number;
      def: number;
      crit: number;
    };
  };
}

export const CHAPTERS: ChapterDef[] = [
  {
    id: 1,
    title: "Chapter 1",
    subtitle: "The Cursed Village",
    environmentName: "Abandoned Village & Ruined Cottages",
    themeColor: "#64748b",
    bgGradient: "from-stone-900 via-neutral-900 to-zinc-950",
    description: "Ruined cottages overrun by shambling undead and feral cursed wolves.",
    arenaPalette: ["#2a2622", "#3a342c", "#191512", "#6b5b45", "#4b4033", "#8a7a5f"],
    terrainKind: "rock",
    levels: [
      { levelNumber: 1, title: "Outskirts Infiltration", waveCount: 3, enemiesPerWave: 4, enemyTypes: ["zombie", "cursed_wolf"], eliteTypes: ["zombie"], rewardCoins: 60, rewardXp: 80, isBossLevel: false },
      { levelNumber: 2, title: "Graveyard Ambush", waveCount: 3, enemiesPerWave: 5, enemyTypes: ["zombie", "skeleton"], eliteTypes: ["skeleton"], rewardCoins: 80, rewardXp: 110, isBossLevel: false },
      { levelNumber: 3, title: "Ruined Town Hall", waveCount: 4, enemiesPerWave: 5, enemyTypes: ["undead_warrior", "cursed_wolf", "skeleton"], eliteTypes: ["undead_warrior"], rewardCoins: 110, rewardXp: 140, isBossLevel: false },
      { levelNumber: 4, title: "The Belfry Gates", waveCount: 4, enemiesPerWave: 6, enemyTypes: ["undead_warrior", "cursed_wolf", "zombie"], eliteTypes: ["undead_warrior", "skeleton"], rewardCoins: 140, rewardXp: 180, isBossLevel: false },
      { levelNumber: 5, title: "Warlord's Keep", waveCount: 2, enemiesPerWave: 3, enemyTypes: ["undead_warrior", "skeleton"], eliteTypes: ["undead_warrior"], rewardCoins: 350, rewardXp: 400, isBossLevel: true },
    ],
    boss: {
      key: "undead_warlord",
      name: "The Undead Warlord",
      title: "Scourge of the Village",
      avatar: "💀",
      image: monsterPortrait({
        bg1: "#2b2f38", bg2: "#12141a", body: "#7c8698", dark: "#39414f", eye: "#7dd3fc",
        feature: "helm", aura: "#38bdf8",
      }),
      sprite: {
        shape: "knight", headgear: "horns", weapon: "greatsword", scale: 6,
        colors: { skin: "#cbd5e1", hair: "#94a3b8", armor: "#64748b", accent: "#cbd5e1", cape: "#334155", weapon: "#e2e8f0", dark: "#1f2937" },
      },
      hp: 3200, atk: 48, def: 25, spd: 2.2, color: "#94a3b8",
      abilities: ["Heavy Sword Cleave", "Minion Summoning", "Corrupting Roar"],
      description: "A colossal reanimated warlord commanding endless hordes.",
      specialSkillName: "Cursed Greatsword Cleave",
    },
    completionReward: {
      coins: 400, xp: 500,
      item: { id: "ch1_reward", name: "Bonecleaver Sword", type: "weapon", rarity: "rare", atk: 25, hp: 60, def: 10, crit: 0.05 },
    },
  },
  {
    id: 2,
    title: "Chapter 2",
    subtitle: "The Dark Forest",
    environmentName: "Poisonous Swamps & Ancient Woods",
    themeColor: "#15803d",
    bgGradient: "from-emerald-950 via-teal-950 to-slate-950",
    description: "Mist-shrouded swamp filled with corrupted beasts and venomous vines.",
    arenaPalette: ["#15301f", "#1d4028", "#0b1a11", "#2f6b3d", "#3f8a4a", "#58a860"],
    terrainKind: "tree",
    levels: [
      { levelNumber: 1, title: "Poison Path Entrance", waveCount: 3, enemiesPerWave: 5, enemyTypes: ["goblin", "corrupted_wolf"], eliteTypes: ["goblin"], rewardCoins: 160, rewardXp: 210, isBossLevel: false },
      { levelNumber: 2, title: "Murky Bog", waveCount: 4, enemiesPerWave: 5, enemyTypes: ["poisonous_creature", "forest_spirit"], eliteTypes: ["poisonous_creature"], rewardCoins: 190, rewardXp: 250, isBossLevel: false },
      { levelNumber: 3, title: "Ancient Canopy", waveCount: 4, enemiesPerWave: 6, enemyTypes: ["goblin", "poisonous_creature", "forest_spirit"], eliteTypes: ["forest_spirit"], rewardCoins: 230, rewardXp: 300, isBossLevel: false },
      { levelNumber: 4, title: "Deep Briar Thicket", waveCount: 4, enemiesPerWave: 7, enemyTypes: ["corrupted_wolf", "forest_spirit", "goblin"], eliteTypes: ["corrupted_wolf"], rewardCoins: 280, rewardXp: 360, isBossLevel: false },
      { levelNumber: 5, title: "Heart of the Elder Grove", waveCount: 2, enemiesPerWave: 4, enemyTypes: ["forest_spirit", "corrupted_wolf"], eliteTypes: ["forest_spirit"], rewardCoins: 600, rewardXp: 750, isBossLevel: true },
    ],
    boss: {
      key: "forest_guardian",
      name: "The Ancient Forest Guardian",
      title: "Corrupted Treant Colossus",
      avatar: "🌳",
      image: monsterPortrait({
        bg1: "#123a22", bg2: "#06170e", body: "#2f6b3d", dark: "#14331f", eye: "#facc15",
        feature: "antlers", aura: "#4ade80",
      }),
      sprite: {
        shape: "treant", headgear: "antlers", weapon: "claw", scale: 6,
        colors: { skin: "#5b4a2f", hair: "#2f6b3d", armor: "#3f6b3a", accent: "#58a860", cape: "#14532d", weapon: "#86efac", dark: "#14331f" },
      },
      hp: 5800, atk: 65, def: 35, spd: 2.0, color: "#22c55e",
      abilities: ["Root Slam Entangle", "Poison Spore Burst", "Thorny Shockwave"],
      description: "A corrupted timber behemoth spewing deadly poisonous spores.",
      specialSkillName: "Gargantuan Root Quake",
    },
    completionReward: {
      coins: 700, xp: 850,
      item: { id: "ch2_reward", name: "Barkweave Cuirass", type: "armor", rarity: "rare", atk: 15, hp: 180, def: 24, crit: 0.03 },
    },
  },
  {
    id: 3,
    title: "Chapter 3",
    subtitle: "The Frozen Kingdom",
    environmentName: "Snow Castles & Glacial Precipices",
    themeColor: "#0284c7",
    bgGradient: "from-sky-950 via-slate-900 to-indigo-950",
    description: "Perpetual blizzards over shattered crystal fortresses and frozen dead.",
    arenaPalette: ["#1d3b57", "#28506f", "#101f30", "#7dd3fc", "#bae6fd", "#e0f2fe"],
    terrainKind: "crystal",
    levels: [
      { levelNumber: 1, title: "Glacial Approach", waveCount: 3, enemiesPerWave: 5, enemyTypes: ["ice_warrior", "frost_skeleton"], eliteTypes: ["ice_warrior"], rewardCoins: 300, rewardXp: 400, isBossLevel: false },
      { levelNumber: 2, title: "Frozen Moat", waveCount: 4, enemiesPerWave: 6, enemyTypes: ["ice_beast", "frost_skeleton"], eliteTypes: ["ice_beast"], rewardCoins: 360, rewardXp: 460, isBossLevel: false },
      { levelNumber: 3, title: "Crystal Cavern", waveCount: 4, enemiesPerWave: 6, enemyTypes: ["frozen_mage", "ice_warrior", "ice_beast"], eliteTypes: ["frozen_mage"], rewardCoins: 420, rewardXp: 530, isBossLevel: false },
      { levelNumber: 4, title: "Throne of White Frost", waveCount: 5, enemiesPerWave: 6, enemyTypes: ["frozen_mage", "ice_warrior", "frost_skeleton"], eliteTypes: ["ice_warrior"], rewardCoins: 480, rewardXp: 600, isBossLevel: false },
      { levelNumber: 5, title: "The Wyrm's Eyrie", waveCount: 2, enemiesPerWave: 4, enemyTypes: ["ice_beast", "frozen_mage"], eliteTypes: ["frozen_mage"], rewardCoins: 1100, rewardXp: 1300, isBossLevel: true },
    ],
    boss: {
      key: "frost_dragon",
      name: "The Frost Dragon",
      title: "Glacial Devourer",
      avatar: "🐲",
      image: monsterPortrait({
        bg1: "#0f2f52", bg2: "#061526", body: "#3f8fc4", dark: "#123a5c", eye: "#67e8f9",
        feature: "wings", aura: "#38bdf8",
      }),
      sprite: {
        shape: "dragon", headgear: "horns", weapon: "claw", scale: 5,
        colors: { skin: "#bae6fd", hair: "#7dd3fc", armor: "#3f8fc4", accent: "#bae6fd", cape: "#1d4e73", weapon: "#e0f2fe", dark: "#123a5c" },
      },
      hp: 9200, atk: 84, def: 42, spd: 2.5, color: "#38bdf8",
      abilities: ["Glacial Breath", "Frost Nova Burst", "Tail Sweep Avalanche"],
      description: "An ancient winged terror whose breath flash-freezes warriors.",
      specialSkillName: "Absolute Zero Blizzard",
    },
    completionReward: {
      coins: 1200, xp: 1400,
      item: { id: "ch3_reward", name: "Glacial Frost Amulet", type: "accessory", rarity: "epic", atk: 35, hp: 220, def: 20, crit: 0.1 },
    },
  },
  {
    id: 4,
    title: "Chapter 4",
    subtitle: "The Demon Fortress",
    environmentName: "Molten Lava Chambers & Iron Bastions",
    themeColor: "#b91c1c",
    bgGradient: "from-red-950 via-zinc-950 to-orange-950",
    description: "Rivers of magma flowing through hellish spires and demonic citadels.",
    arenaPalette: ["#3a1414", "#4d1b16", "#1c0a0a", "#f97316", "#fb923c", "#fbbf24"],
    terrainKind: "lava",
    levels: [
      { levelNumber: 1, title: "The Magma Gates", waveCount: 4, enemiesPerWave: 5, enemyTypes: ["demon_grunt", "dark_knight"], eliteTypes: ["demon_grunt"], rewardCoins: 520, rewardXp: 650, isBossLevel: false },
      { levelNumber: 2, title: "Sulfur Crucible", waveCount: 4, enemiesPerWave: 6, enemyTypes: ["cursed_archer", "demon_grunt"], eliteTypes: ["cursed_archer"], rewardCoins: 600, rewardXp: 740, isBossLevel: false },
      { levelNumber: 3, title: "Chamber of Torment", waveCount: 4, enemiesPerWave: 7, enemyTypes: ["dark_knight", "elite_shadow_creature"], eliteTypes: ["dark_knight"], rewardCoins: 700, rewardXp: 850, isBossLevel: false },
      { levelNumber: 4, title: "Infernal Ramparts", waveCount: 5, enemiesPerWave: 7, enemyTypes: ["cursed_archer", "dark_knight", "elite_shadow_creature"], eliteTypes: ["elite_shadow_creature"], rewardCoins: 820, rewardXp: 980, isBossLevel: false },
      { levelNumber: 5, title: "Throne of the Abyss", waveCount: 2, enemiesPerWave: 5, enemyTypes: ["elite_shadow_creature", "dark_knight"], eliteTypes: ["dark_knight"], rewardCoins: 1800, rewardXp: 2200, isBossLevel: true },
    ],
    boss: {
      key: "demon_king",
      name: "The Demon King",
      title: "Lord of the Brimstone Throne",
      avatar: "👹",
      image: monsterPortrait({
        bg1: "#450a0a", bg2: "#1c0404", body: "#a3231c", dark: "#4a0d0a", eye: "#fbbf24",
        feature: "horns", aura: "#f97316",
      }),
      sprite: {
        shape: "knight", headgear: "horns", weapon: "greatsword", scale: 7,
        colors: { skin: "#e07a5f", hair: "#7f1d1d", armor: "#a3231c", accent: "#fbbf24", cape: "#4a0d0a", weapon: "#fb923c", dark: "#2b0a08" },
      },
      hp: 14000, atk: 105, def: 50, spd: 2.8, color: "#ef4444",
      abilities: ["Hellfire Teleport", "Infernal Meteor Strike", "Bloodrage Slashes"],
      description: "An infernal sovereign with brimstone blades and fire teleports.",
      specialSkillName: "Cataclysmic Hellfire Storm",
    },
    completionReward: {
      coins: 2000, xp: 2500,
      item: { id: "ch4_reward", name: "Hellflame Greatblade", type: "weapon", rarity: "epic", atk: 65, hp: 150, def: 25, crit: 0.12 },
    },
  },
  {
    id: 5,
    title: "Chapter 5",
    subtitle: "The Shadow Realm",
    environmentName: "Void Dimensions & Floating Citadels",
    themeColor: "#6b21a8",
    bgGradient: "from-purple-950 via-neutral-950 to-violet-950",
    description: "A tear in reality where void energy swirls around eternal shadow ruins.",
    arenaPalette: ["#241436", "#31194a", "#120a1c", "#a855f7", "#c084fc", "#e9d5ff"],
    terrainKind: "pillar",
    levels: [
      { levelNumber: 1, title: "Void Threshold", waveCount: 4, enemiesPerWave: 6, enemyTypes: ["shadow_assassin", "elite_undead"], eliteTypes: ["shadow_assassin"], rewardCoins: 900, rewardXp: 1100, isBossLevel: false },
      { levelNumber: 2, title: "Floating Necropolis", waveCount: 4, enemiesPerWave: 7, enemyTypes: ["dark_mage", "shadow_assassin"], eliteTypes: ["dark_mage"], rewardCoins: 1050, rewardXp: 1300, isBossLevel: false },
      { levelNumber: 3, title: "Corrupted Cathedral", waveCount: 5, enemiesPerWave: 7, enemyTypes: ["corrupted_warrior", "elite_undead", "dark_mage"], eliteTypes: ["elite_undead"], rewardCoins: 1250, rewardXp: 1550, isBossLevel: false },
      { levelNumber: 4, title: "Sanctum of the Eclipse", waveCount: 5, enemiesPerWave: 8, enemyTypes: ["shadow_assassin", "corrupted_warrior", "dark_mage"], eliteTypes: ["corrupted_warrior"], rewardCoins: 1500, rewardXp: 1850, isBossLevel: false },
      { levelNumber: 5, title: "The Ultimate Void Throne", waveCount: 3, enemiesPerWave: 5, enemyTypes: ["corrupted_warrior", "shadow_assassin"], eliteTypes: ["dark_mage"], rewardCoins: 3500, rewardXp: 5000, isBossLevel: true },
    ],
    boss: {
      key: "shadow_overlord",
      name: "The Shadow Overlord",
      title: "Harbinger of the End Times",
      avatar: "👑",
      image: monsterPortrait({
        bg1: "#2b1450", bg2: "#100620", body: "#5b21b6", dark: "#241040", eye: "#e879f9",
        feature: "crown", aura: "#a855f7",
      }),
      sprite: {
        shape: "knight", headgear: "crown", weapon: "greatsword", scale: 8,
        colors: { skin: "#c4b5fd", hair: "#4c1d95", armor: "#5b21b6", accent: "#e879f9", cape: "#1e1038", weapon: "#c084fc", dark: "#160a28" },
      },
      hp: 22000, atk: 135, def: 62, spd: 3.2, color: "#a855f7",
      abilities: ["Shadow Clone Projection", "Dimensional Warp", "Void Collapse Wave", "Dark Singularity"],
      description: "The ultimate terror: splits into clones, warps across the arena and collapses reality.",
      specialSkillName: "Singularity of Eternal Eclipse",
    },
    completionReward: {
      coins: 5000, xp: 8000,
      item: { id: "ch5_reward", name: "Regalia of the Void Conqueror", type: "armor", rarity: "legendary", atk: 90, hp: 450, def: 55, crit: 0.18 },
    },
  },
];

export interface EnemyTypeData {
  key: string;
  name: string;
  avatar: string;
  image: string;
  sprite: SpriteKit;
  baseHp: number;
  baseAtk: number;
  speed: number;
  color: string;
  attackRange: number;
  isRanged?: boolean;
}

const mk = (
  key: string,
  name: string,
  avatar: string,
  shape: SpriteKit["shape"],
  headgear: SpriteKit["headgear"],
  weapon: SpriteKit["weapon"],
  colors: SpriteKit["colors"],
  baseHp: number,
  baseAtk: number,
  speed: number,
  color: string,
  attackRange: number,
  portrait: { bg1: string; bg2: string; body: string; dark: string; eye: string; feature: any; aura?: string },
  isRanged?: boolean,
  scale = 4
): EnemyTypeData => ({
  key,
  name,
  avatar,
  image: monsterPortrait(portrait),
  sprite: { shape, headgear, weapon, colors, scale },
  baseHp,
  baseAtk,
  speed,
  color,
  attackRange,
  isRanged,
});

export const ENEMY_TYPES: Record<string, EnemyTypeData> = {
  zombie: mk("zombie", "Shambling Zombie", "🧟", "humanoid", "none", "claw",
    { skin: "#9db86a", hair: "#4d5f2c", armor: "#5f7a35", accent: "#a3c465", cape: "#3c4a22", weapon: "#d8e6b0", dark: "#2b3318" },
    160, 18, 2.1, "#84cc16", 50,
    { bg1: "#22301a", bg2: "#0d1409", body: "#5f7a35", dark: "#2b3318", eye: "#facc15", feature: "none" }),
  cursed_wolf: mk("cursed_wolf", "Cursed Wolf", "🐺", "beast", "none", "claw",
    { skin: "#94a3b8", hair: "#475569", armor: "#52607a", accent: "#94a3b8", cape: "#334155", weapon: "#e2e8f0", dark: "#1f2937" },
    130, 22, 3.4, "#64748b", 55,
    { bg1: "#242b36", bg2: "#0e1116", body: "#52607a", dark: "#1f2937", eye: "#f87171", feature: "ears" }),
  skeleton: mk("skeleton", "Skeleton Fighter", "💀", "humanoid", "none", "sword",
    { skin: "#e8edf5", hair: "#cbd5e1", armor: "#d7dee9", accent: "#f8fafc", cape: "#94a3b8", weapon: "#cbd5e1", dark: "#64748b" },
    180, 24, 2.4, "#cbd5e1", 60,
    { bg1: "#2c3340", bg2: "#111419", body: "#d7dee9", dark: "#64748b", eye: "#38bdf8", feature: "ribs" }),
  undead_warrior: mk("undead_warrior", "Undead Knight", "⚔️", "knight", "helm", "sword",
    { skin: "#b9c4d4", hair: "#64748b", armor: "#5b6879", accent: "#94a3b8", cape: "#334155", weapon: "#e2e8f0", dark: "#1f2937" },
    280, 32, 2.2, "#94a3b8", 65,
    { bg1: "#252c38", bg2: "#0e1116", body: "#5b6879", dark: "#1f2937", eye: "#f87171", feature: "helm" }),
  goblin: mk("goblin", "Corrupted Goblin", "👺", "humanoid", "hood", "dagger",
    { skin: "#8fd18f", hair: "#2f6b3d", armor: "#3f8a4a", accent: "#bbf7d0", cape: "#14532d", weapon: "#e5e7eb", dark: "#14331f" },
    190, 26, 3.2, "#22c55e", 55,
    { bg1: "#153320", bg2: "#07140c", body: "#3f8a4a", dark: "#14331f", eye: "#facc15", feature: "ears" }),
  poisonous_creature: mk("poisonous_creature", "Spore Beast", "🕷️", "spider", "none", "claw",
    { skin: "#6ee7b7", hair: "#065f46", armor: "#0f766e", accent: "#34d399", cape: "#064e3b", weapon: "#a7f3d0", dark: "#022c22" },
    240, 34, 2.6, "#10b981", 60,
    { bg1: "#0d3327", bg2: "#04140f", body: "#0f766e", dark: "#022c22", eye: "#a7f3d0", feature: "legs8" }),
  forest_spirit: mk("forest_spirit", "Corrupted Wisp", "✨", "wisp", "none", "none",
    { skin: "#bbf7d0", hair: "#4ade80", armor: "#22c55e", accent: "#86efac", cape: "#14532d", weapon: "#dcfce7", dark: "#052e16" },
    210, 38, 2.8, "#34d399", 180,
    { bg1: "#0f3a22", bg2: "#05160c", body: "#22c55e", dark: "#052e16", eye: "#fef08a", feature: "none", aura: "#4ade80" }, true),
  ice_warrior: mk("ice_warrior", "Frost Vanguard", "🛡️", "knight", "helm", "sword",
    { skin: "#bae6fd", hair: "#38bdf8", armor: "#2f6f9c", accent: "#7dd3fc", cape: "#164e63", weapon: "#e0f2fe", dark: "#0c2f45" },
    380, 42, 2.3, "#38bdf8", 65,
    { bg1: "#123a55", bg2: "#061521", body: "#2f6f9c", dark: "#0c2f45", eye: "#bae6fd", feature: "helm" }),
  frost_skeleton: mk("frost_skeleton", "Frost Archer", "🏹", "humanoid", "hood", "bow",
    { skin: "#e0f2fe", hair: "#7dd3fc", armor: "#bae6fd", accent: "#f0f9ff", cape: "#38bdf8", weapon: "#e0f2fe", dark: "#0369a1" },
    260, 45, 2.7, "#7dd3fc", 210,
    { bg1: "#123f5c", bg2: "#061722", body: "#bae6fd", dark: "#0369a1", eye: "#38bdf8", feature: "hood" }, true),
  ice_beast: mk("ice_beast", "Glacial Fang", "❄️", "beast", "none", "claw",
    { skin: "#e0f2fe", hair: "#7dd3fc", armor: "#5fa8d3", accent: "#bae6fd", cape: "#2f6f9c", weapon: "#f0f9ff", dark: "#0c2f45" },
    340, 48, 3.5, "#bae6fd", 60,
    { bg1: "#143f5c", bg2: "#061722", body: "#5fa8d3", dark: "#0c2f45", eye: "#67e8f9", feature: "spikes" }),
  frozen_mage: mk("frozen_mage", "Blizzard Sorcerer", "🧙", "humanoid", "hat", "staff",
    { skin: "#dbeafe", hair: "#60a5fa", armor: "#2456a6", accent: "#93c5fd", cape: "#1e3a8a", weapon: "#bfdbfe", dark: "#172554" },
    290, 52, 2.2, "#60a5fa", 220,
    { bg1: "#16305c", bg2: "#070f22", body: "#2456a6", dark: "#172554", eye: "#bfdbfe", feature: "hood" }, true),
  demon_grunt: mk("demon_grunt", "Fiend Ravager", "😈", "humanoid", "horns", "axe",
    { skin: "#f0a08c", hair: "#7f1d1d", armor: "#b32d22", accent: "#fca5a5", cape: "#5c1010", weapon: "#fbbf24", dark: "#2b0a08" },
    440, 56, 2.9, "#f87171", 65,
    { bg1: "#40120f", bg2: "#1a0605", body: "#b32d22", dark: "#2b0a08", eye: "#facc15", feature: "horns" }),
  dark_knight: mk("dark_knight", "Hellforged Crusader", "🗡️", "knight", "horns", "greatsword",
    { skin: "#e07a5f", hair: "#450a0a", armor: "#7f1d1d", accent: "#ef4444", cape: "#2b0a08", weapon: "#fb923c", dark: "#170303" },
    550, 64, 2.4, "#ef4444", 70,
    { bg1: "#3d0d0d", bg2: "#170404", body: "#7f1d1d", dark: "#170303", eye: "#ef4444", feature: "horns" }),
  cursed_archer: mk("cursed_archer", "Brimstone Sharpshooter", "🔥", "humanoid", "hood", "bow",
    { skin: "#fdba74", hair: "#c2410c", armor: "#9a3412", accent: "#fb923c", cape: "#7c2d12", weapon: "#fbbf24", dark: "#431407" },
    330, 60, 2.8, "#fb923c", 230,
    { bg1: "#3d1a0b", bg2: "#180803", body: "#9a3412", dark: "#431407", eye: "#facc15", feature: "hood" }, true),
  elite_shadow_creature: mk("elite_shadow_creature", "Shadow Fiend", "👹", "knight", "horns", "claw",
    { skin: "#fca5a5", hair: "#7f1d1d", armor: "#991b1b", accent: "#f87171", cape: "#450a0a", weapon: "#fbbf24", dark: "#1c0404" },
    620, 72, 3.3, "#dc2626", 75,
    { bg1: "#41100f", bg2: "#1a0505", body: "#991b1b", dark: "#1c0404", eye: "#fbbf24", feature: "spikes" }),
  shadow_assassin: mk("shadow_assassin", "Void Stalker", "🥷", "humanoid", "hood", "dagger",
    { skin: "#ddd6fe", hair: "#6d28d9", armor: "#4c1d95", accent: "#c084fc", cape: "#2e1065", weapon: "#e9d5ff", dark: "#1b0b34" },
    520, 80, 3.9, "#c084fc", 65,
    { bg1: "#2c1550", bg2: "#120722", body: "#4c1d95", dark: "#1b0b34", eye: "#f43f5e", feature: "hood" }),
  elite_undead: mk("elite_undead", "Nether Executioner", "☠️", "knight", "helm", "greatsword",
    { skin: "#e9d5ff", hair: "#7e22ce", armor: "#581c87", accent: "#a855f7", cape: "#3b0764", weapon: "#d8b4fe", dark: "#1e0a33" },
    750, 88, 2.6, "#a855f7", 75,
    { bg1: "#341453", bg2: "#150722", body: "#581c87", dark: "#1e0a33", eye: "#e879f9", feature: "helm" }),
  dark_mage: mk("dark_mage", "Eldritch Archmage", "🔮", "humanoid", "hat", "orb",
    { skin: "#ddd6fe", hair: "#8b5cf6", armor: "#4c1d95", accent: "#a78bfa", cape: "#2e1065", weapon: "#c4b5fd", dark: "#1b0b34" },
    460, 92, 2.5, "#8b5cf6", 240,
    { bg1: "#2d1550", bg2: "#120722", body: "#4c1d95", dark: "#1b0b34", eye: "#c084fc", feature: "hood" }, true),
  corrupted_warrior: mk("corrupted_warrior", "Void Berserker", "⚔️", "knight", "horns", "axe",
    { skin: "#f0abfc", hair: "#701a75", armor: "#701a75", accent: "#e879f9", cape: "#3b0764", weapon: "#f5d0fe", dark: "#250a33" },
    850, 98, 3.1, "#7e22ce", 70,
    { bg1: "#3a1250", bg2: "#170622", body: "#701a75", dark: "#250a33", eye: "#f43f5e", feature: "horns" }),
};

export const DEFAULT_INVENTORY_ITEMS = [
  {
    id: "init_weapon", itemId: "iron_sword", name: "Slayer's Iron Blade",
    type: "weapon" as const, rarity: "common" as const,
    atkBonus: 12, hpBonus: 30, defBonus: 5, critBonus: 0.02, equipped: true,
    description: "Standard issued steel blade for young slayers.",
  },
  {
    id: "init_armor", itemId: "leather_armor", name: "Hardened Leather Guard",
    type: "armor" as const, rarity: "common" as const,
    atkBonus: 0, hpBonus: 80, defBonus: 12, critBonus: 0, equipped: true,
    description: "Reliable lightweight chest armor against fangs.",
  },
  {
    id: "init_acc", itemId: "courage_ring", name: "Ring of Valor",
    type: "accessory" as const, rarity: "common" as const,
    atkBonus: 8, hpBonus: 40, defBonus: 4, critBonus: 0.04, equipped: true,
    description: "A brass ring etched with runes of courage.",
  },
];

/**
 * Hand-painted anime illustrations take priority. Heroes / bosses without a
 * painted file fall back to the smooth vector portraits built in artAssets.
 */
const HERO_PORTRAIT_FILES: Record<string, string> = {
  aiden: "/heroes/aiden.png",
  luna: "/heroes/luna.png",
  ronan: "/heroes/ronan.png",
  mira: "/heroes/mira.png",
  kael: "/heroes/kael.png",
  bruno: "/heroes/bruno.png",
};

const BOSS_PORTRAIT_FILES: Record<string, string> = {
  undead_warlord: "/enemies/undead_warlord.png",
  demon_king: "/enemies/demon_king.png",
  shadow_overlord: "/enemies/shadow_overlord.png",
};

Object.values(HEROES).forEach((h) => {
  const file = HERO_PORTRAIT_FILES[h.id];
  if (file) h.image = file;
});

CHAPTERS.forEach((ch) => {
  const file = BOSS_PORTRAIT_FILES[ch.boss.key];
  if (file) ch.boss.image = file;
});

/**
 * Per-class battle silhouettes.
 * `build` changes the whole body shape (robed caster, lean ranger, bulky bruiser)
 * and `gear` adds class-defining props (quiver, spellbook, shield, dual blades,
 * fur pauldrons, dragon wings + flame aura, vines, ribcage, torn rags...).
 */
/**
 * Per-class BATTLE SPRITES — genuine pixel-art chibis in the style of
 * classic 2D action RPG sprite sheets (idle / walk / attack / hurt frames
 * plus each class' signature effect sprite).
 */
const HERO_KITS: Record<string, Partial<SpriteKit>> = {
  // Swordman: messy black hair, red scarf, charcoal armor, steel blade, big red slash crescent
  aiden: {
    build: "standard", gear: ["emblemCape"], scale: 5,
    pixel: {
      hat: "messy", weapon: "sword", effect: "slash",
      palette: {
        hair: "#2b2f3a", skin: "#f2c39a", eye: "#111827",
        top: "#3b4150", topDark: "#2c3140", bottom: "#262b38", bottomDark: "#1a1e29",
        accent: "#9ca3af", weapon: "#dfe7f2", weaponDark: "#6b7280",
        scarf: "#dc2626",
      },
    },
  },
  // Archer: green hood w/ gold trim, brown hair tufts, tan bow, green glowing arrow volley
  luna: {
    build: "slim", gear: ["quiver"], scale: 5,
    pixel: {
      hat: "hood", weapon: "bow", effect: "arrows", effectTint: "#4ade80",
      palette: {
        hair: "#8b5a2b", skin: "#f6d2b6", eye: "#14532d",
        top: "#4d7c0f", topDark: "#3a5f0c", bottom: "#3f2d1a", bottomDark: "#2a1e10",
        accent: "#a3e635", weapon: "#d4a940", weaponDark: "#8a6d1f",
        hat: "#65a30d", hatDark: "#4d7c0f", hatTrim: "#eab308",
      },
    },
  },
  // Axeman: big white ponytail, crimson armor, glowing red war axe, red crescent + rock debris
  ronan: {
    build: "heavy", gear: ["dualWield", "furPauldrons"], scale: 5,
    pixel: {
      hat: "ponytail", weapon: "axe", effect: "rocks",
      palette: {
        hair: "#f1f5f9", skin: "#e8b48c", eye: "#7f1d1d",
        top: "#b91c1c", topDark: "#8f1616", bottom: "#3f1d1d", bottomDark: "#2a1212",
        accent: "#fca5a5", weapon: "#dc2626", weaponDark: "#7c5a2b",
        cape: "#7f1d1d",
      },
    },
  },
  // Mage: purple pointy hat w/ gold trim + buckle, long lavender hair, purple orb staff, magic orb
  mira: {
    build: "robe", gear: ["spellbook"], scale: 5,
    pixel: {
      hat: "pointy", weapon: "staff", effect: "orb",
      palette: {
        hair: "#e9e0f7", skin: "#f6d2b6", eye: "#312e81",
        top: "#6d28d9", topDark: "#4c1d95", bottom: "#3b2a72", bottomDark: "#291d52",
        accent: "#a855f7", weapon: "#c084fc", weaponDark: "#7c5a2b",
        hat: "#7c3aed", hatDark: "#4c1d95", hatTrim: "#eab308",
      },
    },
  },
  // Assassin: dark purple-black hood, white/silver hair, glowing red-pink eyes, violet outfit, twin daggers, purple crescent + cross + streak
  kael: {
    build: "slim", gear: ["dualWield"], scale: 5,
    pixel: {
      hat: "hood", weapon: "dual", effect: "shadecut",
      palette: {
        hair: "#e2e8f0", skin: "#e8e0f0", eye: "#fb7185",
        top: "#4c1d95", topDark: "#3b0764", bottom: "#2e1065", bottomDark: "#1e0a3c",
        accent: "#a855f7", weapon: "#e2e8f0", weaponDark: "#4c1d95",
        hat: "#221c33", hatDark: "#16121f",
      },
    },
  },
  // Spearman/Guardian: brown spiky hair, golden armor, two-handed gold spear, golden crescent + ring + pillars
  bruno: {
    build: "heavy", gear: [], scale: 5,
    pixel: {
      hat: "spiky", weapon: "spear", effect: "spear",
      palette: {
        hair: "#6b4423", skin: "#e8b48c", eye: "#451a03",
        top: "#e0a911", topDark: "#b0840a", bottom: "#4a3208", bottomDark: "#33230a",
        accent: "#fde68a", weapon: "#fbbf24", weaponDark: "#a16207",
      },
    },
  },
  // Summoner: teal witch hat, teal hair, teal staff, spirit skull + summoning ring
  sylvie: {
    build: "robe", gear: ["spellbook"], scale: 5,
    pixel: {
      hat: "pointy", weapon: "staff", effect: "spirit",
      palette: {
        hair: "#2dd4bf", skin: "#f6d2b6", eye: "#134e4a",
        top: "#0f766e", topDark: "#115e59", bottom: "#134e4a", bottomDark: "#0f3d3a",
        accent: "#5eead4", weapon: "#5eead4", weaponDark: "#7c5a2b",
        hat: "#0d9488", hatDark: "#115e59",
      },
    },
  },
  // Dual Blade: long flowing dark hair, magenta outfit + red scarf, long silver twin blades, pink X-cross burst
  darius: {
    build: "heavy", gear: ["emblemCape"], scale: 5,
    pixel: {
      hat: "long", weapon: "dualBlade", effect: "cross",
      palette: {
        hair: "#1e1e2e", skin: "#e0c3a0", eye: "#a21caf",
        top: "#be185d", topDark: "#9d174d", bottom: "#4a0a26", bottomDark: "#33081c",
        accent: "#f472b6", weapon: "#e2e8f0", weaponDark: "#4a044e",
        scarf: "#e11d48", cape: "#831843",
      },
    },
  },
  // Gunner: spiky dark-blue hair, round aviator goggles, blue armor, big blaster, blue bolt + star burst + shell
  elian: {
    build: "robe", gear: ["spellbook"], scale: 5,
    pixel: {
      hat: "goggles", weapon: "rifle", effect: "laser",
      palette: {
        hair: "#1e3a5f", skin: "#f2c39a", eye: "#0ea5e9",
        top: "#1d4ed8", topDark: "#173ea8", bottom: "#12234f", bottomDark: "#0c1838",
        accent: "#38bdf8", weapon: "#4f9cf9", weaponDark: "#334155",
      },
    },
  },
  // Monk: bald with scalp scars, brown flame-ki gi, flame fists, fire crescent + rising embers
  riven: {
    build: "heavy", gear: [], scale: 5,
    pixel: {
      hat: "bald", weapon: "fist", effect: "flame",
      palette: {
        hair: "#d9a06b", skin: "#d9a06b", eye: "#451a03",
        top: "#b45309", topDark: "#7c3a0a", bottom: "#5b3a1a", bottomDark: "#3d2812",
        accent: "#fbbf24", weapon: "#d9a06b", weaponDark: "#7c3a0a",
      },
    },
  },
};

/** Pixel chibi definitions for humanoid enemies & human bosses (same engine as heroes). */
const ENEMY_KITS: Record<string, Partial<SpriteKit>> = {
  zombie: {
    build: "standard", gear: ["torn"], scale: 4,
    pixel: {
      hat: "bald", weapon: "claw", effect: "none",
      palette: {
        hair: "#4d5f2c", skin: "#84a552", eye: "#facc15",
        top: "#556b2f", topDark: "#3f4f22", bottom: "#3a4522", bottomDark: "#2a3119",
        accent: "#6b8235", weapon: "#9ca3af", weaponDark: "#4d5f2c",
      },
    },
  },
  skeleton: {
    build: "slim", gear: ["ribs"], scale: 4,
    pixel: {
      hat: "none", weapon: "sword", effect: "none",
      palette: {
        hair: "#e2e8f0", skin: "#e2e8f0", eye: "#38bdf8",
        top: "#cbd5e1", topDark: "#94a3b8", bottom: "#94a3b8", bottomDark: "#64748b",
        accent: "#f8fafc", weapon: "#e2e8f0", weaponDark: "#64748b",
      },
    },
  },
  undead_warrior: {
    build: "heavy", gear: ["shield"], scale: 4,
    pixel: {
      hat: "helmet", weapon: "sword", effect: "none",
      palette: {
        hair: "#64748b", skin: "#b9c4d4", eye: "#ef4444",
        top: "#5b6879", topDark: "#414b5a", bottom: "#333d4a", bottomDark: "#242c36",
        accent: "#94a3b8", weapon: "#dfe7f2", weaponDark: "#4b5563",
      },
    },
  },
  goblin: {
    build: "slim", gear: ["torn"], scale: 4,
    pixel: {
      hat: "hood", weapon: "dagger", effect: "none",
      palette: {
        hair: "#166534", skin: "#4ade80", eye: "#facc15",
        top: "#3f6212", topDark: "#2f4a0d", bottom: "#27320c", bottomDark: "#1a2008",
        accent: "#a3e635", weapon: "#d6d3d1", weaponDark: "#3f6212",
        hat: "#365314", hatDark: "#1a2e05",
      },
    },
  },
  ice_warrior: {
    build: "heavy", gear: ["shield"], scale: 4,
    pixel: {
      hat: "helmet", weapon: "spear", effect: "none", shield: true,
      palette: {
        hair: "#1e3a5f", skin: "#bfdbfe", eye: "#0369a1",
        top: "#3b82f6", topDark: "#2563eb", bottom: "#1e3a5f", bottomDark: "#16294a",
        accent: "#93c5fd", weapon: "#e0f2fe", weaponDark: "#334155",
        shield: "#60a5fa",
      },
    },
  },
  frost_skeleton: {
    build: "slim", gear: ["quiver", "ribs"], scale: 4,
    pixel: {
      hat: "hood", weapon: "bow", effect: "arrows", effectTint: "#bae6fd",
      palette: {
        hair: "#e0f2fe", skin: "#e0f2fe", eye: "#38bdf8",
        top: "#bae6fd", topDark: "#7dd3fc", bottom: "#38bdf8", bottomDark: "#0284c7",
        accent: "#f0f9ff", weapon: "#e0f2fe", weaponDark: "#0369a1",
        hat: "#7dd3fc", hatDark: "#0284c7",
      },
    },
  },
  frozen_mage: {
    build: "robe", gear: ["spellbook"], scale: 4,
    pixel: {
      hat: "pointy", weapon: "staff", effect: "orb",
      palette: {
        hair: "#dbeafe", skin: "#dbeafe", eye: "#1e40af",
        top: "#2563eb", topDark: "#1d4ed8", bottom: "#1e3a8a", bottomDark: "#172e6e",
        accent: "#93c5fd", weapon: "#bfdbfe", weaponDark: "#7c5a2b",
        hat: "#3b82f6", hatDark: "#1e40af",
      },
    },
  },
  demon_grunt: {
    build: "heavy", gear: ["wings", "furPauldrons"], scale: 4,
    pixel: {
      hat: "horns", weapon: "axe", effect: "flame",
      palette: {
        hair: "#450a0a", skin: "#ef7c5c", eye: "#fbbf24",
        top: "#b32d22", topDark: "#8a2018", bottom: "#3d1410", bottomDark: "#2a0e0b",
        accent: "#fca5a5", weapon: "#e5e7eb", weaponDark: "#7c5a2b",
        cape: "#7f1d1d",
      },
    },
  },
  dark_knight: {
    build: "heavy", gear: ["shield", "emblemCape"], scale: 4,
    pixel: {
      hat: "helmet", weapon: "sword", effect: "none", shield: true,
      palette: {
        hair: "#111827", skin: "#6b7280", eye: "#ef4444",
        top: "#1f2430", topDark: "#151a23", bottom: "#10141c", bottomDark: "#0a0d13",
        accent: "#ef4444", weapon: "#9ca3af", weaponDark: "#374151",
        shield: "#111827",
      },
    },
  },
  cursed_archer: {
    build: "slim", gear: ["quiver"], scale: 4,
    pixel: {
      hat: "hood", weapon: "bow", effect: "arrows", effectTint: "#fdba74",
      palette: {
        hair: "#7c2d12", skin: "#fdba74", eye: "#facc15",
        top: "#9a3412", topDark: "#7c2d12", bottom: "#431407", bottomDark: "#2c0d05",
        accent: "#fb923c", weapon: "#fbbf24", weaponDark: "#7c5a2b",
        hat: "#7c2d12", hatDark: "#431407",
      },
    },
  },
  elite_shadow_creature: {
    build: "heavy", gear: ["wings"], scale: 4,
    pixel: {
      hat: "horns", weapon: "dual", effect: "dash",
      palette: {
        hair: "#27272a", skin: "#f43f5e", eye: "#fbbf24",
        top: "#7f1d1d", topDark: "#5f1414", bottom: "#2a0a0a", bottomDark: "#1c0606",
        accent: "#f87171", weapon: "#e2e8f0", weaponDark: "#4b5563",
        cape: "#450a0a",
      },
    },
  },
  shadow_assassin: {
    build: "slim", gear: ["dualWield"], scale: 4,
    pixel: {
      hat: "hood", weapon: "dual", effect: "dash",
      palette: {
        hair: "#ddd6fe", skin: "#c7c2d9", eye: "#f43f5e",
        top: "#312e5c", topDark: "#25234a", bottom: "#1c1a38", bottomDark: "#131228",
        accent: "#a855f7", weapon: "#e9d5ff", weaponDark: "#4c1d95",
        hat: "#1e1b3a", hatDark: "#12102a",
      },
    },
  },
  elite_undead: {
    build: "heavy", gear: ["emblemCape", "ribs"], scale: 4,
    pixel: {
      hat: "helmet", weapon: "greatsword", effect: "slash",
      palette: {
        hair: "#4c1d95", skin: "#ddd6fe", eye: "#e879f9",
        top: "#581c87", topDark: "#451570", bottom: "#2e1055", bottomDark: "#200a3c",
        accent: "#c084fc", weapon: "#e9d5ff", weaponDark: "#4c1d95",
      },
    },
  },
  dark_mage: {
    build: "robe", gear: ["spellbook"], scale: 4,
    pixel: {
      hat: "pointy", weapon: "staff", effect: "orb",
      palette: {
        hair: "#c4b5fd", skin: "#ddd6fe", eye: "#7c3aed",
        top: "#4c1d95", topDark: "#3b1577", bottom: "#2e1065", bottomDark: "#220b4a",
        accent: "#a78bfa", weapon: "#c4b5fd", weaponDark: "#7c5a2b",
        hat: "#6d28d9", hatDark: "#4c1d95",
      },
    },
  },
  corrupted_warrior: {
    build: "heavy", gear: ["dualWield", "furPauldrons"], scale: 4,
    pixel: {
      hat: "horns", weapon: "axe", effect: "rocks", effectTint: "#e879f9",
      palette: {
        hair: "#2e1065", skin: "#f0abfc", eye: "#f43f5e",
        top: "#701a75", topDark: "#551259", bottom: "#33093c", bottomDark: "#24072b",
        accent: "#e879f9", weapon: "#f5d0fe", weaponDark: "#7c5a2b",
        cape: "#3b0764",
      },
    },
  },
  // non-humanoids keep their smooth creature bodies
  forest_spirit: { gear: ["vines"] },
};

const BOSS_KITS: Record<string, Partial<SpriteKit>> = {
  undead_warlord: {
    build: "heavy", gear: ["emblemCape", "ribs"], scale: 9,
    pixel: {
      hat: "helmet", weapon: "greatsword", effect: "slash", big: true,
      palette: {
        hair: "#334155", skin: "#cbd5e1", eye: "#38bdf8",
        top: "#64748b", topDark: "#475569", bottom: "#334155", bottomDark: "#1e293b",
        accent: "#7dd3fc", weapon: "#e2e8f0", weaponDark: "#475569",
        cape: "#1e293b", scarf: "#7dd3fc",
      },
    },
  },
  forest_guardian: { gear: ["vines"] },
  frost_dragon: { gear: ["wings"] },
  demon_king: {
    build: "heavy", gear: ["wings", "flameAura"], scale: 9,
    pixel: {
      hat: "horns", weapon: "greatsword", effect: "flame", big: true,
      palette: {
        hair: "#450a0a", skin: "#ef7c5c", eye: "#fbbf24",
        top: "#991b1b", topDark: "#7f1d1d", bottom: "#450a0a", bottomDark: "#2b0707",
        accent: "#fb923c", weapon: "#fbbf24", weaponDark: "#7c2d12",
        cape: "#450a0a",
      },
    },
  },
  shadow_overlord: {
    build: "heavy", gear: ["wings", "emblemCape"], scale: 10,
    pixel: {
      hat: "crown", weapon: "greatsword", effect: "dash", big: true,
      palette: {
        hair: "#4c1d95", skin: "#c4b5fd", eye: "#e879f9",
        top: "#5b21b6", topDark: "#4c1d95", bottom: "#2e1065", bottomDark: "#200a3c",
        accent: "#e879f9", weapon: "#d8b4fe", weaponDark: "#4c1d95",
        cape: "#1e1038",
      },
    },
  },
};

Object.entries(HERO_KITS).forEach(([id, patch]) => {
  if (HEROES[id]) Object.assign(HEROES[id].sprite, patch);
});
Object.entries(ENEMY_KITS).forEach(([key, patch]) => {
  if (ENEMY_TYPES[key]) Object.assign(ENEMY_TYPES[key].sprite, patch);
});
CHAPTERS.forEach((ch) => {
  const patch = BOSS_KITS[ch.boss.key];
  if (patch) Object.assign(ch.boss.sprite, patch);
});
