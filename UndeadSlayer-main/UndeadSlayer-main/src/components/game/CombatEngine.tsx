"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { HEROES, HeroDef, CHAPTERS, LevelDef, ENEMY_TYPES, BossDef } from "@/lib/gameData";
import ArtImage from "@/components/game/ArtImage";
import type { SpriteKit } from "@/lib/sprites";
import { drawUnit, drawTerrainProp } from "@/lib/sprites";
import { getSpriteImage, preloadSprites, HERO_CROP, MONSTER_CROP } from "@/lib/spriteImages";
import { sounds } from "@/lib/soundEffects";
import {
  Heart, Zap, Sword, Pause, Play, ArrowLeft, Trophy, Skull, Map as MapIcon,
  Crown, Flame, Shield, Wind, Coins, DoorOpen, Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";

interface CombatEngineProps {
  heroId: string;
  chapterId: number;
  levelNumber: number;
  statUpgrades: { attackLevel: number; healthLevel: number; defenseLevel: number; skillLevel: number };
  equippedStats: { atk: number; hp: number; def: number; crit: number };
  healthPotions: number;
  settings: { musicVolume: number; sfxVolume: number; autoTarget: boolean; screenShake: boolean; damageNumbers: boolean };
  onBattleEnd: (result: {
    victory: boolean;
    rewardCoins: number;
    rewardXp: number;
    potionsUsed: number;
    bossDefeated?: boolean;
    dropItem?: any;
  }) => void;
  onExit: () => void;
}

interface Particle { x: number; y: number; vx: number; vy: number; color: string; radius: number; life: number; maxLife: number; }
interface DamageNumber { text: string; x: number; y: number; vy: number; opacity: number; color: string; isCrit: boolean; }
interface Bullet { x: number; y: number; vx: number; vy: number; damage: number; radius: number; color: string; isHero: boolean; type: string; duration: number; }
interface Obstacle { x: number; y: number; w: number; h: number; kind: string; }
interface DangerZone { x: number; y: number; radius: number; timer: number; windup: number; damage: number; color: string; label: string; }
interface Pickup { x: number; y: number; kind: "coin" | "heart" | "energy"; bob: number; life: number; }
interface AfterImage { x: number; y: number; t: number; facingLeft: boolean; }

interface EnemyEntity {
  id: number;
  typeKey: string;
  name: string;
  avatar: string;
  image: string;
  sprite: SpriteKit;
  x: number; y: number;
  hp: number; maxHp: number; atk: number; speed: number;
  color: string; radius: number; attackRange: number;
  isBoss: boolean; isElite: boolean; bossPhase: number;
  isRanged?: boolean;
  attackCooldown: number; specialTimer: number; chargeTimer: number;
  hitFlash: number; facingLeft: boolean; animTick: number;
  attackT: number; moving: boolean; casting: boolean;
  bossKey?: string;
  dying?: boolean;
  deathT?: number;
  deathDur?: number;
}

const ARENA = { minX: 52, maxX: 848, minY: 158, maxY: 522, w: 900, h: 560 };
const DOOR = { x: ARENA.maxX + 6, y: 300, w: 30, h: 104 };

interface Blessing { id: string; name: string; desc: string; icon: string; color: string; }

const BLESSINGS: Blessing[] = [
  { id: "atk", name: "Sharpened Edge", desc: "+18% damage for the rest of the run", icon: "⚔️", color: "#f87171" },
  { id: "hp", name: "Vital Core", desc: "+22% max HP and fully heal", icon: "❤️", color: "#4ade80" },
  { id: "armor", name: "Bulwark Plating", desc: "+30 max armor, refill armor", icon: "🛡️", color: "#60a5fa" },
  { id: "spd", name: "Swift Boots", desc: "+14% move speed, -25% dash cooldown", icon: "👟", color: "#facc15" },
  { id: "fire", name: "Rapid Trigger", desc: "+30% attack speed", icon: "🔥", color: "#fb923c" },
  { id: "energy", name: "Arcane Well", desc: "+40 max energy, +60% energy regen", icon: "🔋", color: "#38bdf8" },
  { id: "vamp", name: "Vampiric Edge", desc: "Heal for 4% of damage dealt", icon: "🩸", color: "#e879f9" },
  { id: "crit", name: "Critical Eye", desc: "+12% critical chance", icon: "🎯", color: "#fbbf24" },
];

function makeRng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function buildTerrain(chapterId: number, levelNumber: number, room: number, kind: string): Obstacle[] {
  const rng = makeRng(chapterId * 977 + levelNumber * 131 + room * 17 + 7);
  const list: Obstacle[] = [];
  const count = 4 + Math.floor(rng() * 4);
  for (let i = 0; i < count; i++) {
    const w = 42 + Math.floor(rng() * 46);
    const h = kind === "tree" ? 76 + Math.floor(rng() * 34) : 40 + Math.floor(rng() * 30);
    let x = 110 + rng() * (ARENA.maxX - ARENA.minX - 220);
    let y = ARENA.minY + 24 + rng() * (ARENA.maxY - ARENA.minY - 130);
    if (Math.abs(x - 150) < 130 && Math.abs(y - 340) < 100) x += 220;
    if (Math.abs(x - 760) < 130 && Math.abs(y - 350) < 110) x -= 240;
    x = Math.max(ARENA.minX + 14, Math.min(ARENA.maxX - w - 40, x));
    y = Math.max(ARENA.minY + 14, Math.min(ARENA.maxY - h - 14, y));
    list.push({ x, y, w, h, kind: rng() > 0.76 && kind !== "tree" ? "rock" : kind });
  }
  return list;
}

function resolveObstacleCollision(pos: { x: number; y: number }, radius: number, obstacles: Obstacle[]) {
  for (const o of obstacles) {
    const cx = Math.max(o.x, Math.min(pos.x, o.x + o.w));
    const cy = Math.max(o.y, Math.min(pos.y, o.y + o.h));
    const dx = pos.x - cx;
    const dy = pos.y - cy;
    const d = Math.hypot(dx, dy);
    if (d < radius && d > 0.001) {
      const push = radius - d + 0.6;
      pos.x += (dx / d) * push;
      pos.y += (dy / d) * push;
    } else if (d <= 0.001) {
      pos.y = o.y - radius;
    }
  }
}

/**
 * Gameplay randomness (crit rolls, spawn positions, particle jitter, AI picks).
 * Lives at module scope on purpose: it is only ever called from event handlers
 * and the requestAnimationFrame loop, never while React renders the component.
 */
const rand = (): number => Math.random();

export default function CombatEngine({
  heroId, chapterId, levelNumber, statUpgrades, equippedStats,
  healthPotions: initialPotions, settings, onBattleEnd, onExit,
}: CombatEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const heroDef: HeroDef = HEROES[heroId] || HEROES.aiden;
  const chapter = CHAPTERS.find((c) => c.id === chapterId) || CHAPTERS[0];
  const levelDef: LevelDef = chapter.levels.find((l) => l.levelNumber === levelNumber) || chapter.levels[0];
  const bossDef: BossDef = chapter.boss;

  const totalRooms = levelDef.waveCount;

  const attackMultiplier = 1 + (statUpgrades.attackLevel - 1) * 0.15;
  const healthMultiplier = 1 + (statUpgrades.healthLevel - 1) * 0.18;
  const defenseMultiplier = 1 + (statUpgrades.defenseLevel - 1) * 0.12;
  const skillMultiplier = 1 + (statUpgrades.skillLevel - 1) * 0.2;

  const baseMaxHp = Math.round((heroDef.stats.hp + equippedStats.hp) * healthMultiplier);
  const baseAtk = Math.round((heroDef.stats.atk + equippedStats.atk) * attackMultiplier);
  const baseArmor = Math.round(14 + (heroDef.stats.def + equippedStats.def) * 0.75 * defenseMultiplier);
  const baseEnergyMax = 100 + statUpgrades.skillLevel * 8;
  const heroCritRate = Math.min(0.85, heroDef.stats.critRate + equippedStats.crit);
  const SKILL_COST = 40;

  const terrainRef = useRef<Obstacle[]>(buildTerrain(chapterId, levelNumber, 1, chapter.terrainKind));

  // HUD state (throttled)
  const [hp, setHp] = useState(baseMaxHp);
  const [maxHpUi, setMaxHpUi] = useState(baseMaxHp);
  const [armor, setArmor] = useState(baseArmor);
  const [armorMaxUi, setArmorMaxUi] = useState(baseArmor);
  const [energy, setEnergy] = useState(baseEnergyMax);
  const [energyMaxUi, setEnergyMaxUi] = useState(baseEnergyMax);
  const [potionsCount, setPotionsCount] = useState(initialPotions);
  const [runCoins, setRunCoins] = useState(0);
  const [roomNo, setRoomNo] = useState(1);
  const [roomCleared, setRoomCleared] = useState(false);
  const [skillCd, setSkillCd] = useState(0);
  const [dashCdUi, setDashCdUi] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showBigMap, setShowBigMap] = useState(false);
  const [blessingOptions, setBlessingOptions] = useState<Blessing[] | null>(null);
  const [gameOver, setGameOver] = useState<"victory" | "defeat" | null>(null);
  const [bossHpData, setBossHpData] = useState<{ current: number; max: number; name: string; phase: number } | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [killCount, setKillCount] = useState(0);
  const [eliteCount, setEliteCount] = useState(0);

  const stateRef = useRef({
    hero: {
      x: 150, y: 340, hp: baseMaxHp, maxHp: baseMaxHp,
      armor: baseArmor, armorMax: baseArmor, noDamageTimer: 99,
      energy: baseEnergyMax, energyMax: baseEnergyMax,
      speed: heroDef.stats.spd * 0.95, facingLeft: false,
      attackTimer: 0, attackT: 0, comboStep: 0, animFrame: 0, moving: false, casting: false,
      dashTimer: 0, dashCd: 0, dashDirX: 1, dashDirY: 0, invuln: 0, hurtFlash: 0,
      afterImages: [] as AfterImage[],
    },
    enemies: [] as EnemyEntity[],
    bullets: [] as Bullet[],
    zones: [] as DangerZone[],
    pickups: [] as Pickup[],
    particles: [] as Particle[],
    damageNumbers: [] as DamageNumber[],
    keys: { up: false, down: false, left: false, right: false, attack: false },
    joystick: { active: false, angle: 0, power: 0 },
    shakeTime: 0,
    lastTime: 0,
    potionsUsed: 0,
    room: 1,
    roomCleared: false,
    doorOpen: false,
    kills: 0,
    elitesKilled: 0,
    coinsCollected: 0,
    skillCooldownLeft: 0,
    bossSpawned: false,
    bossPatternIdx: 0,
    battleResolved: false,
    hudTimer: 0,
    buffs: {
      atk: 1, hp: 1, armor: 0, spd: 1, fireRate: 1,
      energy: 0, energyRegen: 1, lifesteal: 0, crit: 0, dashCd: 1,
    },
  });

  const say = (text: string, ms = 2200) => {
    setBanner(text);
    setTimeout(() => setBanner(null), ms);
  };

  useEffect(() => {
    // Warm the artwork cache so battle sprites render from the real portraits
    preloadSprites([
      heroDef.image,
      bossDef.image,
      ...levelDef.enemyTypes.map((k) => ENEMY_TYPES[k]?.image),
      ...levelDef.eliteTypes.map((k) => ENEMY_TYPES[k]?.image),
    ]);
    sounds.setVolumes(settings.sfxVolume, settings.musicVolume);
    sounds.startBGM(chapterId);
    return () => { sounds.stopBGM(); };
  }, [chapterId, settings.sfxVolume, settings.musicVolume, heroDef.image, bossDef.image, levelDef]);

  /* ---------------- helpers ---------------- */

  const heroAtkNow = () => Math.round(baseAtk * stateRef.current.buffs.atk);
  const heroMaxHpNow = () => Math.round(baseMaxHp * stateRef.current.buffs.hp);
  const heroArmorMaxNow = () => baseArmor + stateRef.current.buffs.armor;
  const heroEnergyMaxNow = () => baseEnergyMax + stateRef.current.buffs.energy;

  const impact = (x: number, y: number, color: string, count: number): Particle[] => {
    const res: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2;
      const sp = rand() * 4 + 1.4;
      res.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1, color, radius: rand() * 3.4 + 1.8, life: 0.42 + rand() * 0.3, maxLife: 0.72 });
    }
    return res;
  };

  const dropPickups = (x: number, y: number, boss: boolean, elite: boolean) => {
    const s = stateRef.current;
    const coinCount = boss ? 14 : elite ? 6 : rand() < 0.72 ? 1 + Math.floor(rand() * 2) : 0;
    for (let i = 0; i < coinCount; i++) {
      s.pickups.push({ x: x + (rand() - 0.5) * 46, y: y + (rand() - 0.5) * 30, kind: "coin", bob: rand() * 6, life: 26 });
    }
    if (rand() < (boss ? 1 : elite ? 0.7 : 0.3)) {
      s.pickups.push({ x: x + (rand() - 0.5) * 30, y: y + (rand() - 0.5) * 24, kind: "energy", bob: rand() * 6, life: 26 });
    }
    if (rand() < (boss ? 0.9 : elite ? 0.35 : 0.1)) {
      s.pickups.push({ x: x + (rand() - 0.5) * 30, y: y + (rand() - 0.5) * 24, kind: "heart", bob: rand() * 6, life: 26 });
    }
  };

  const damageEnemy = (enemy: EnemyEntity, baseDamage: number, canCrit = true) => {
    if (enemy.dying) return; // corpses can't be hit
    const s = stateRef.current;
    const crit = Math.min(0.9, heroCritRate + s.buffs.crit);
    const isCrit = canCrit && rand() < crit;
    const dmg = Math.max(8, Math.round(baseDamage * (isCrit ? 1.85 : 1) * (1 - Math.min(0.4, enemy.isBoss ? 0.25 : 0.08))));
    enemy.hp -= dmg;
    enemy.hitFlash = 0.16;
    sounds.playHit();

    // vampiric blessing
    if (s.buffs.lifesteal > 0) {
      s.hero.hp = Math.min(heroMaxHpNow(), s.hero.hp + dmg * s.buffs.lifesteal);
    }

    if (settings.damageNumbers) {
      s.damageNumbers.push({
        text: `${dmg}${isCrit ? "!" : ""}`,
        x: enemy.x + (rand() - 0.5) * 20,
        y: enemy.y - enemy.radius - 18,
        vy: -2.1, opacity: 1, color: isCrit ? "#fbbf24" : "#ffffff", isCrit,
      });
    }
    s.particles.push(...impact(enemy.x, enemy.y - 18, enemy.color, isCrit ? 16 : 8));

    if (enemy.isBoss) {
      setBossHpData({ current: Math.max(0, enemy.hp), max: enemy.maxHp, name: enemy.name, phase: enemy.bossPhase });
      const phase3 = enemy.bossKey === "shadow_overlord" && enemy.hp < enemy.maxHp * 0.25 && enemy.bossPhase < 3;
      const phase2 = enemy.hp < enemy.maxHp * 0.5 && enemy.bossPhase < 2;
      if (phase3) {
        enemy.bossPhase = 3;
        enemy.speed *= 1.25;
        enemy.atk *= 1.2;
        enemy.specialTimer = 0.6;
        sounds.playBossRoar();
        s.shakeTime = 0.7;
        say("PHASE 3 — SHADOW CLONES UNLEASHED", 2400);
        summonMinions(enemy, 2, true);
      } else if (phase2) {
        enemy.bossPhase = 2;
        enemy.speed *= 1.3;
        enemy.atk *= 1.25;
        enemy.specialTimer = 0.8;
        sounds.playBossRoar();
        s.shakeTime = 0.6;
        say("BOSS ENRAGED — PHASE 2", 2200);
      }
    }
  };

  const summonMinions = (from: EnemyEntity, count: number, elite = false) => {
    const s = stateRef.current;
    const pool = levelDef.enemyTypes.length ? levelDef.enemyTypes : ["zombie"];
    for (let i = 0; i < count; i++) {
      const key = pool[Math.floor(rand() * pool.length)];
      const data = ENEMY_TYPES[key] || ENEMY_TYPES.zombie;
      const hp = Math.round(data.baseHp * (1 + chapterId * 0.3) * (elite ? 2.4 : 1));
      s.enemies.push({
        id: rand(), typeKey: key, name: elite ? "Shadow Clone" : data.name,
        avatar: data.avatar, image: data.image, sprite: { ...data.sprite, scale: elite ? data.sprite.scale + 1 : data.sprite.scale },
        x: from.x + (rand() - 0.5) * 180, y: from.y + (rand() - 0.5) * 100,
        hp, maxHp: hp, atk: Math.round(data.baseAtk * (1 + chapterId * 0.25) * (elite ? 1.4 : 1)),
        speed: data.speed * (elite ? 1.25 : 1), color: elite ? "#a855f7" : data.color,
        radius: data.sprite.scale * (elite ? 3.6 : 3.1), attackRange: data.attackRange,
        isBoss: false, isElite: elite, bossPhase: 0, isRanged: data.isRanged,
        attackCooldown: 1.1, specialTimer: elite ? 4 : 99, chargeTimer: 0,
        hitFlash: 0, facingLeft: true, animTick: rand() * 8, attackT: 0, moving: false, casting: false,
      });
    }
    setEliteCount(s.enemies.filter((e) => e.isElite).length);
  };

  const addZones = (count: number, radius: number, windup: number, damage: number, color: string, label: string, atHero: boolean) => {
    const s = stateRef.current;
    for (let i = 0; i < count; i++) {
      const tx = atHero ? s.hero.x + (i === 0 ? 0 : (rand() - 0.5) * 280) : ARENA.minX + 70 + rand() * (ARENA.maxX - ARENA.minX - 140);
      const ty = atHero ? s.hero.y + (i === 0 ? 0 : (rand() - 0.5) * 170) : ARENA.minY + 40 + rand() * (ARENA.maxY - ARENA.minY - 80);
      s.zones.push({
        x: Math.max(ARENA.minX, Math.min(ARENA.maxX, tx)),
        y: Math.max(ARENA.minY, Math.min(ARENA.maxY, ty)),
        radius, timer: windup, windup, damage, color, label,
      });
    }
  };

  const radialBurst = (from: EnemyEntity, count: number, speed: number, damage: number, color: string) => {
    const s = stateRef.current;
    const off = rand() * Math.PI;
    for (let i = 0; i < count; i++) {
      const a = off + (i * Math.PI * 2) / count;
      s.bullets.push({ x: from.x, y: from.y - 24, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, damage, radius: 8, color, isHero: false, type: "orb", duration: 3.4 });
    }
    from.casting = true;
    setTimeout(() => { from.casting = false; }, 320);
  };

  const spiralBurst = (from: EnemyEntity, shots: number, speed: number, damage: number, color: string) => {
    const s = stateRef.current;
    let a = rand() * Math.PI * 2;
    for (let i = 0; i < shots; i++) {
      setTimeout(() => {
        if (from.hp <= 0) return;
        a += 0.52;
        s.bullets.push({ x: from.x, y: from.y - 24, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, damage, radius: 7, color, isHero: false, type: "orb", duration: 3.4 });
        s.bullets.push({ x: from.x, y: from.y - 24, vx: Math.cos(a + Math.PI) * speed, vy: Math.sin(a + Math.PI) * speed, damage, radius: 7, color, isHero: false, type: "orb", duration: 3.4 });
      }, i * 70);
    }
  };

  const aimedFan = (from: EnemyEntity, count: number, speed: number, damage: number, color: string, spread = Math.PI / 3) => {
    const s = stateRef.current;
    const base = Math.atan2(s.hero.y - from.y, s.hero.x - from.x);
    for (let i = 0; i < count; i++) {
      const a = base + (i - (count - 1) / 2) * (spread / Math.max(1, count - 1));
      s.bullets.push({ x: from.x, y: from.y - 24, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, damage, radius: 8, color, isHero: false, type: "orb", duration: 3.2 });
    }
    from.casting = true;
    setTimeout(() => { from.casting = false; }, 300);
  };

  const heroTakeHit = (rawDamage: number) => {
    const s = stateRef.current;
    if (s.hero.invuln > 0 || s.battleResolved) {
      if (s.hero.invuln > 0) {
        s.damageNumbers.push({ text: "DODGE", x: s.hero.x, y: s.hero.y - 62, vy: -1.8, opacity: 1, color: "#7dd3fc", isCrit: false });
      }
      return;
    }
    let dmg = Math.max(5, Math.round(rawDamage * (1 - Math.min(0.45, heroDefVal() * 0.004))));
    s.hero.noDamageTimer = 0;
    s.hero.hurtFlash = 0.16; // 2-frame hurt: white flash then recoil
    s.shakeTime = Math.max(s.shakeTime, 0.2);

    if (s.hero.armor > 0) {
      const absorbed = Math.min(s.hero.armor, dmg);
      s.hero.armor -= absorbed;
      dmg -= absorbed;
      s.particles.push(...impact(s.hero.x, s.hero.y - 30, "#60a5fa", 10));
      s.damageNumbers.push({ text: `🛡${absorbed}`, x: s.hero.x + (rand() - 0.5) * 18, y: s.hero.y - 56, vy: -2, opacity: 1, color: "#60a5fa", isCrit: false });
      sounds.playHit();
    }
    if (dmg > 0) {
      s.hero.hp = Math.max(0, s.hero.hp - dmg);
      sounds.playHit();
      s.damageNumbers.push({ text: `-${dmg}`, x: s.hero.x + (rand() - 0.5) * 16, y: s.hero.y - 46, vy: -2, opacity: 1, color: "#ef4444", isCrit: false });
      s.particles.push(...impact(s.hero.x, s.hero.y - 26, "#ef4444", 10));
    }
  };

  const heroDefVal = () => Math.round((heroDef.stats.def + equippedStats.def) * defenseMultiplier);

  /* ---------------- boss / elite attacks ---------------- */

  const doBossSpecial = (en: EnemyEntity) => {
    const s = stateRef.current;
    const key = en.bossKey || "";
    const phaseMul = 1 + (en.bossPhase - 1) * 0.35;
    const dmg = Math.round(en.atk * 0.85 * phaseMul);
    sounds.playSkill();
    s.shakeTime = Math.max(s.shakeTime, 0.32);

    // shared bullet-hell pool (Soul Knight style)
    const pool: Array<() => void> = [
      () => radialBurst(en, 12 + en.bossPhase * 4, 3.1 + en.bossPhase * 0.35, dmg, en.color),
      () => spiralBurst(en, 9 + en.bossPhase * 3, 3.4, Math.round(dmg * 0.8), en.color),
      () => aimedFan(en, 5 + en.bossPhase, 5.4, dmg, en.color, Math.PI / 2.2),
      () => en.chargeTimer = 0.85,
    ];

    // chapter-flavoured extras
    if (key === "undead_warlord") {
      pool.push(() => {
        summonMinions(en, en.bossPhase >= 2 ? 3 : 2);
        say("WARLORD SUMMONS UNDEAD MINIONS", 1800);
      });
      pool.push(() => addZones(1, 140, 1.1, Math.round(en.atk * 2.1 * phaseMul), "#94a3b8", "CURSED CLEAVE", true));
    } else if (key === "forest_guardian") {
      pool.push(() => addZones(2, 100, 1.2, Math.round(en.atk * 1.6 * phaseMul), "#22c55e", "ROOT SLAM", true));
      pool.push(() => addZones(4, 66, 1.4, Math.round(en.atk * 1.2 * phaseMul), "#16a34a", "SPORE BURST", false));
    } else if (key === "frost_dragon") {
      pool.push(() => addZones(1, 150, 1.0, Math.round(en.atk * 2 * phaseMul), "#38bdf8", "FROST NOVA", true));
      pool.push(() => addZones(5, 62, 1.5, Math.round(en.atk * 1.1 * phaseMul), "#bae6fd", "ICE STORM", false));
    } else if (key === "demon_king") {
      pool.push(() => {
        s.particles.push(...impact(en.x, en.y - 28, "#f97316", 24));
        en.x = Math.max(ARENA.minX + 40, Math.min(ARENA.maxX - 40, s.hero.x + (rand() > 0.5 ? 160 : -160)));
        en.y = Math.max(ARENA.minY + 30, Math.min(ARENA.maxY - 30, s.hero.y + (rand() - 0.5) * 110));
        s.particles.push(...impact(en.x, en.y - 28, "#fbbf24", 24));
        radialBurst(en, 16, 3.6, dmg, "#fb923c");
      });
      pool.push(() => addZones(3, 90, 1.2, Math.round(en.atk * 1.7 * phaseMul), "#ef4444", "METEOR STRIKE", true));
    } else if (key === "shadow_overlord") {
      pool.push(() => {
        summonMinions(en, en.bossPhase >= 3 ? 3 : 2, true);
        say("SHADOW CLONES MATERIALIZE", 1800);
      });
      pool.push(() => {
        addZones(1, 185, 1.5, Math.round(en.atk * 2.4 * phaseMul), "#7c3aed", "DARK SINGULARITY", true);
        radialBurst(en, 18, 3.2, dmg, "#a855f7");
      });
    }

    const idx = s.bossPatternIdx++ % pool.length;
    pool[idx]();
  };

  const doEliteSpecial = (en: EnemyEntity) => {
    if (en.isRanged) aimedFan(en, 3, 5.2, Math.round(en.atk * 1.1), en.color, Math.PI / 5);
    else addZones(1, 84, 0.9, Math.round(en.atk * 1.5), "#fb923c", "ELITE SLAM", true);
    sounds.playSkill();
  };

  /* ---------------- hero actions ---------------- */

  const doDash = useCallback(() => {
    const s = stateRef.current;
    if (s.hero.dashCd > 0 || s.hero.hp <= 0 || gameOver || blessingOptions) return;
    let dx = 0, dy = 0;
    if (s.keys.up) dy -= 1;
    if (s.keys.down) dy += 1;
    if (s.keys.left) dx -= 1;
    if (s.keys.right) dx += 1;
    if (s.joystick.active && s.joystick.power > 0.15) {
      dx = Math.cos(s.joystick.angle);
      dy = Math.sin(s.joystick.angle);
    }
    if (dx === 0 && dy === 0) dx = s.hero.facingLeft ? -1 : 1;
    const len = Math.hypot(dx, dy) || 1;
    s.hero.dashDirX = dx / len;
    s.hero.dashDirY = dy / len;
    s.hero.dashTimer = 0.22;
    s.hero.invuln = 0.34;
    s.hero.dashCd = 1.5 * s.buffs.dashCd;
    if (Math.abs(s.hero.dashDirX) > 0.1) s.hero.facingLeft = s.hero.dashDirX < 0;
    sounds.playSlash();
    s.particles.push(...impact(s.hero.x, s.hero.y - 22, "#e2e8f0", 12));
  }, [gameOver, blessingOptions]);

  const triggerHeroSkill = useCallback(() => {
    const s = stateRef.current;
    if (s.skillCooldownLeft > 0 || s.hero.hp <= 0 || gameOver || blessingOptions) return;
    if (s.hero.energy < SKILL_COST) {
      say("NOT ENOUGH ENERGY", 1200);
      return;
    }
    s.hero.energy -= SKILL_COST;
    s.skillCooldownLeft = heroDef.skill.cooldown;
    s.hero.attackT = 0.01;
    s.hero.casting = true;
    setTimeout(() => { s.hero.casting = false; }, 600);
    sounds.playSkill();

    const hero = s.hero;
    const dmg = Math.round(heroAtkNow() * heroDef.skill.damageMultiplier * skillMultiplier);
    const t = heroDef.skill.type;

    if (t === "spin") {
      for (let i = 0; i < 30; i++) {
        const a = (i * Math.PI * 2) / 30;
        s.bullets.push({ x: hero.x, y: hero.y - 26, vx: Math.cos(a) * 7, vy: Math.sin(a) * 7, damage: dmg / 2, radius: 11, color: heroDef.accentColor, isHero: true, type: "spin", duration: 0.55 });
      }
      s.shakeTime = 0.3;
    } else if (t === "arrow_rain") {
      for (let i = 0; i < 20; i++) {
        setTimeout(() => {
          s.bullets.push({ x: hero.x + (rand() - 0.5) * 400, y: hero.y - 330, vx: 0, vy: 12.5, damage: Math.round(dmg / 4), radius: 9, color: heroDef.accentColor, isHero: true, type: "arrow", duration: 1.1 });
        }, i * 38);
      }
    } else if (t === "furious_combo") {
      s.shakeTime = 0.45;
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          sounds.playSlash();
          const hx = hero.facingLeft ? hero.x - 140 : hero.x + 140;
          s.particles.push(...impact(hx, hero.y - 28, "#ef4444", 16));
          s.enemies.forEach((en) => {
            const inFront = hero.facingLeft ? en.x < hero.x && en.x > hero.x - 185 : en.x > hero.x && en.x < hero.x + 185;
            if (Math.abs(en.y - hero.y) < 100 && inFront) damageEnemy(en, dmg / 3);
          });
        }, i * 115);
      }
    } else if (t === "elemental_blast") {
      sounds.playExplosion();
      s.shakeTime = 0.55;
      radialBurstHero(28, 7.4, dmg / 2, "#22d3ee");
      radialBurstHero(20, 5.2, dmg / 2.6, "#f97316");
    } else if (t === "shadow_dash") {
      sounds.playSlash();
      let nearest: EnemyEntity | null = null;
      let minD = 9999;
      s.enemies.forEach((en) => {
        const d = Math.hypot(en.x - hero.x, en.y - hero.y);
        if (d < minD) { minD = d; nearest = en; }
      });
      s.particles.push(...impact(hero.x, hero.y - 28, "#94a3b8", 20));
      if (nearest) {
        const e = nearest as EnemyEntity;
        hero.x = e.x + (hero.facingLeft ? 52 : -52);
        hero.y = e.y;
        hero.facingLeft = e.x < hero.x;
        damageEnemy(e, dmg * 1.3);
        s.particles.push(...impact(hero.x, hero.y - 28, "#e2e8f0", 26));
      }
      hero.invuln = Math.max(hero.invuln, 0.4);
    } else if (t === "ground_slam") {
      sounds.playExplosion();
      s.shakeTime = 0.75;
      s.enemies.forEach((en) => {
        if (Math.hypot(en.x - hero.x, en.y - hero.y) < 240) {
          damageEnemy(en, dmg);
          en.attackCooldown = 2.4;
          en.chargeTimer = 0;
        }
      });
      s.bullets.forEach((b) => { if (!b.isHero) b.duration = 0; }); // clears enemy bullets
      for (let i = 0; i < 36; i++) {
        const a = rand() * Math.PI * 2;
        const d = rand() * 220;
        s.particles.push({ x: hero.x + Math.cos(a) * d, y: hero.y + Math.sin(a) * d * 0.5, vx: (rand() - 0.5) * 3, vy: -rand() * 3.6, color: "#facc15", radius: 5, life: 0.7, maxLife: 0.7 });
      }
    } else if (t === "thorn_heal") {
      sounds.playPotion();
      const heal = Math.round(heroMaxHpNow() * 0.4);
      hero.hp = Math.min(heroMaxHpNow(), hero.hp + heal);
      hero.armor = heroArmorMaxNow();
      s.damageNumbers.push({ text: `+${heal}`, x: hero.x, y: hero.y - 64, vy: -1.5, opacity: 1, color: "#4ade80", isCrit: true });
      s.enemies.forEach((en) => {
        if (Math.hypot(en.x - hero.x, en.y - hero.y) < 200) {
          damageEnemy(en, dmg);
          en.attackCooldown = Math.max(en.attackCooldown, 1.3);
        }
      });
      s.particles.push(...impact(hero.x, hero.y - 28, "#4ade80", 30));
    } else if (t === "dark_wave") {
      sounds.playSlash();
      s.bullets.push({ x: hero.x + (hero.facingLeft ? -36 : 36), y: hero.y - 30, vx: hero.facingLeft ? -12 : 12, vy: 0, damage: dmg, radius: 34, color: "#7c3aed", isHero: true, type: "wave", duration: 1.1 });
      s.shakeTime = 0.25;
    } else if (t === "chain_lightning") {
      s.shakeTime = 0.4;
      s.enemies.slice(0, 9).forEach((en, i) => {
        setTimeout(() => {
          damageEnemy(en, dmg);
          s.particles.push(...impact(en.x, en.y - 26, "#38bdf8", 14));
        }, i * 75);
      });
    } else if (t === "dragon_flame") {
      sounds.playExplosion();
      s.shakeTime = 0.85;
      const dir = hero.facingLeft ? -1 : 1;
      for (let i = 0; i < 22; i++) {
        setTimeout(() => {
          s.bullets.push({ x: hero.x + dir * i * 22, y: hero.y - 30 + (rand() - 0.5) * 56, vx: dir * 7.4, vy: (rand() - 0.5) * 2.4, damage: dmg / 2.4, radius: 20, color: i % 3 === 0 ? "#fbbf24" : "#f97316", isHero: true, type: "fire", duration: 0.9 });
        }, i * 26);
      }
    }

    function radialBurstHero(count: number, speed: number, damage: number, color: string) {
      for (let i = 0; i < count; i++) {
        const a = (i * Math.PI * 2) / count;
        s.bullets.push({ x: hero.x, y: hero.y - 26, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, damage, radius: 12, color, isHero: true, type: "nova", duration: 0.65 });
      }
    }
  }, [heroDef, skillMultiplier, gameOver, blessingOptions]);

  const drinkHealthPotion = useCallback(() => {
    const s = stateRef.current;
    if (potionsCount <= 0 || s.hero.hp >= heroMaxHpNow() || gameOver || blessingOptions) return;
    sounds.playPotion();
    const heal = Math.round(heroMaxHpNow() * 0.5);
    s.hero.hp = Math.min(heroMaxHpNow(), s.hero.hp + heal);
    s.hero.armor = Math.min(heroArmorMaxNow(), s.hero.armor + Math.round(heroArmorMaxNow() * 0.5));
    setPotionsCount((p) => p - 1);
    s.potionsUsed += 1;
    s.damageNumbers.push({ text: `+${heal}`, x: s.hero.x, y: s.hero.y - 64, vy: -1.5, opacity: 1, color: "#22c55e", isCrit: true });
    s.particles.push(...impact(s.hero.x, s.hero.y - 28, "#22c55e", 18));
  }, [potionsCount, gameOver, blessingOptions]);

  /* ---------------- rooms ---------------- */

  const offerBlessing = useCallback(() => {
    const picks: Blessing[] = [];
    const pool = [...BLESSINGS];
    for (let i = 0; i < 3 && pool.length; i++) {
      picks.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
    }
    setBlessingOptions(picks);
  }, []);

  const applyBlessing = (b: Blessing) => {
    const s = stateRef.current;
    sounds.playCoin();
    switch (b.id) {
      case "atk": s.buffs.atk += 0.18; break;
      case "hp":
        s.buffs.hp += 0.22;
        s.hero.maxHp = heroMaxHpNow();
        s.hero.hp = s.hero.maxHp;
        break;
      case "armor":
        s.buffs.armor += 30;
        s.hero.armorMax = heroArmorMaxNow();
        s.hero.armor = s.hero.armorMax;
        break;
      case "spd": s.buffs.spd += 0.14; s.buffs.dashCd *= 0.75; break;
      case "fire": s.buffs.fireRate += 0.3; break;
      case "energy":
        s.buffs.energy += 40;
        s.buffs.energyRegen += 0.6;
        s.hero.energyMax = heroEnergyMaxNow();
        s.hero.energy = s.hero.energyMax;
        break;
      case "vamp": s.buffs.lifesteal += 0.04; break;
      case "crit": s.buffs.crit += 0.12; break;
      default: break;
    }
    setMaxHpUi(heroMaxHpNow());
    setArmorMaxUi(heroArmorMaxNow());
    setEnergyMaxUi(heroEnergyMaxNow());
    setHp(s.hero.hp);
    setArmor(s.hero.armor);
    setEnergy(s.hero.energy);
    setBlessingOptions(null);
    s.doorOpen = true;
    say("ROOM CLEARED — ENTER THE DOOR ➜", 2600);
  };

  const spawnRoom = useCallback((room: number) => {
    const s = stateRef.current;
    s.room = room;
    s.roomCleared = false;
    s.doorOpen = false;
    setRoomNo(room);
    setRoomCleared(false);
    terrainRef.current = buildTerrain(chapterId, levelNumber, room, chapter.terrainKind);
    s.hero.x = 130;
    s.hero.y = 340;
    s.bullets = s.bullets.filter((b) => b.isHero);
    s.zones = [];

    const isFinalRoom = room >= totalRooms;

    if (levelDef.isBossLevel && isFinalRoom && !s.bossSpawned) {
      s.bossSpawned = true;
      sounds.playBossRoar();
      say(`${bossDef.name.toUpperCase()} — ${bossDef.title.toUpperCase()}`, 3600);
      const boss: EnemyEntity = {
        id: rand(), typeKey: bossDef.key, name: bossDef.name, avatar: bossDef.avatar,
        image: bossDef.image,
        sprite: bossDef.sprite, x: 720, y: 340,
        hp: bossDef.hp, maxHp: bossDef.hp, atk: bossDef.atk, speed: bossDef.spd,
        color: bossDef.color, radius: bossDef.sprite.scale * 5.2, attackRange: 105,
        isBoss: true, isElite: false, bossPhase: 1, bossKey: bossDef.key,
        attackCooldown: 1.5, specialTimer: 3.0, chargeTimer: 0,
        hitFlash: 0, facingLeft: true, animTick: 0, attackT: 0, moving: false, casting: false,
      };
      s.enemies.push(boss);
      setBossHpData({ current: boss.hp, max: boss.maxHp, name: boss.name, phase: 1 });
      summonMinions(boss, 2);
      return;
    }

    const count = levelDef.enemiesPerWave + Math.floor(room * 1.15);
    for (let i = 0; i < count; i++) {
      const key = levelDef.enemyTypes[Math.floor(rand() * levelDef.enemyTypes.length)];
      const data = ENEMY_TYPES[key] || ENEMY_TYPES.zombie;
      const side = rand();
      const x = side > 0.5 ? ARENA.maxX - 20 - rand() * 120 : ARENA.minX + 160 + rand() * 220;
      const y = ARENA.minY + 24 + rand() * (ARENA.maxY - ARENA.minY - 48);
      const hp = Math.round(data.baseHp * (1 + chapterId * 0.3 + levelNumber * 0.1));
      s.enemies.push({
        id: rand(), typeKey: key, name: data.name, avatar: data.avatar, image: data.image, sprite: data.sprite,
        x, y, hp, maxHp: hp,
        atk: Math.round(data.baseAtk * (1 + chapterId * 0.26 + levelNumber * 0.08)),
        speed: data.speed, color: data.color, radius: data.sprite.scale * 3.1,
        attackRange: data.attackRange, isBoss: false, isElite: false, bossPhase: 0,
        isRanged: data.isRanged, attackCooldown: 1.1 + rand() * 0.6,
        specialTimer: 99, chargeTimer: 0, hitFlash: 0, facingLeft: x > 400,
        animTick: rand() * 8, attackT: 0, moving: false, casting: false,
      });
    }

    // elite champion guard in later rooms
    if (room >= 2) {
      const eKey = levelDef.eliteTypes.length ? levelDef.eliteTypes[Math.floor(rand() * levelDef.eliteTypes.length)] : levelDef.enemyTypes[0];
      const data = ENEMY_TYPES[eKey] || ENEMY_TYPES.zombie;
      const hp = Math.round(data.baseHp * (1 + chapterId * 0.3 + levelNumber * 0.1) * 4.2);
      s.enemies.push({
        id: rand(), typeKey: eKey, name: `Elite ${data.name}`, avatar: data.avatar,
        image: data.image,
        sprite: { ...data.sprite, scale: data.sprite.scale + 2 },
        x: ARENA.maxX - 90, y: ARENA.minY + 60 + rand() * (ARENA.maxY - ARENA.minY - 120),
        hp, maxHp: hp,
        atk: Math.round(data.baseAtk * (1 + chapterId * 0.26 + levelNumber * 0.08) * 1.5),
        speed: data.speed * 1.1, color: "#fb923c", radius: (data.sprite.scale + 2) * 3.2,
        attackRange: data.attackRange + 12, isBoss: false, isElite: true, bossPhase: 0,
        isRanged: data.isRanged, attackCooldown: 1.2, specialTimer: 5,
        chargeTimer: 0, hitFlash: 0, facingLeft: true, animTick: 0, attackT: 0, moving: false, casting: false,
      });
    }
    setEliteCount(s.enemies.filter((e) => e.isElite).length);
    if (room === 1) say(`ROOM 1 — CLEAR ALL ENEMIES TO OPEN THE DOOR`, 2600);
  }, [levelDef, chapterId, levelNumber, bossDef, chapter.terrainKind, totalRooms]);

  const nextRoom = useCallback(() => {
    const s = stateRef.current;
    sounds.playCoin();
    spawnRoom(s.room + 1);
  }, [spawnRoom]);

  /* ---------------- main loop ---------------- */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    const s0 = stateRef.current;
    s0.lastTime = performance.now();
    if (s0.enemies.length === 0 && !s0.battleResolved && s0.room === 1) spawnRoom(1);

    const down = (e: KeyboardEvent) => {
      const k = s0.keys;
      if (e.key === "w" || e.key === "ArrowUp") k.up = true;
      if (e.key === "s" || e.key === "ArrowDown") k.down = true;
      if (e.key === "a" || e.key === "ArrowLeft") k.left = true;
      if (e.key === "d" || e.key === "ArrowRight") k.right = true;
      if (e.key === "j" || e.key === " " || e.key === "x") { k.attack = true; e.preventDefault(); }
      if (e.key === "k" || e.key === "c") triggerHeroSkill();
      if (e.key === "l" || e.key === "Shift") doDash();
      if (e.key === "q" || e.key === "h") drinkHealthPotion();
      if (e.key === "m") setShowBigMap((v) => !v);
      if (e.key === "p" || e.key === "Escape") setIsPaused((v) => !v);
    };
    const up = (e: KeyboardEvent) => {
      const k = s0.keys;
      if (e.key === "w" || e.key === "ArrowUp") k.up = false;
      if (e.key === "s" || e.key === "ArrowDown") k.down = false;
      if (e.key === "a" || e.key === "ArrowLeft") k.left = false;
      if (e.key === "d" || e.key === "ArrowRight") k.right = false;
      if (e.key === "j" || e.key === " " || e.key === "x") k.attack = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    const loop = (now: number) => {
      const s = stateRef.current;
      const dt = Math.min((now - s.lastTime) / 1000, 0.05);
      s.lastTime = now;
      const hero = s.hero;
      const obstacles = terrainRef.current;
      const frozen = isPaused || !!gameOver || !!blessingOptions;

      if (!frozen) {
        if (s.skillCooldownLeft > 0) s.skillCooldownLeft = Math.max(0, s.skillCooldownLeft - dt);
        if (hero.dashCd > 0) hero.dashCd = Math.max(0, hero.dashCd - dt);
        if (hero.invuln > 0) hero.invuln -= dt;
        if (hero.hurtFlash > 0) hero.hurtFlash -= dt;
        if (s.shakeTime > 0) s.shakeTime -= dt;

        // energy + armor regen (Soul Knight signature)
        hero.energy = Math.min(hero.energyMax, hero.energy + 7.5 * s.buffs.energyRegen * dt);
        hero.noDamageTimer += dt;
        if (hero.noDamageTimer > 3.2 && hero.armor < hero.armorMax) {
          hero.armor = Math.min(hero.armorMax, hero.armor + hero.armorMax * 0.32 * dt);
        }

        // movement / dash
        let dx = 0, dy = 0;
        if (s.keys.up) dy -= 1;
        if (s.keys.down) dy += 1;
        if (s.keys.left) dx -= 1;
        if (s.keys.right) dx += 1;
        if (s.joystick.active && s.joystick.power > 0.15) {
          dx = Math.cos(s.joystick.angle) * s.joystick.power;
          dy = Math.sin(s.joystick.angle) * s.joystick.power;
        }
        const mag = Math.hypot(dx, dy);
        if (mag > 1) { dx /= mag; dy /= mag; }
        hero.moving = mag > 0.05;
        if (Math.abs(dx) > 0.05 && hero.dashTimer <= 0) hero.facingLeft = dx < 0;

        if (hero.dashTimer > 0) {
          hero.dashTimer -= dt;
          hero.x += hero.dashDirX * hero.speed * 3.5 * 60 * dt;
          hero.y += hero.dashDirY * hero.speed * 3.5 * 60 * dt;
          hero.afterImages.push({ x: hero.x, y: hero.y, t: 0.28, facingLeft: hero.facingLeft });
        } else {
          hero.x += dx * hero.speed * s.buffs.spd * 60 * dt;
          hero.y += dy * hero.speed * s.buffs.spd * 60 * dt;
        }
        hero.x = Math.max(ARENA.minX, Math.min(ARENA.maxX, hero.x));
        hero.y = Math.max(ARENA.minY, Math.min(ARENA.maxY, hero.y));
        resolveObstacleCollision(hero, 20, obstacles);
        hero.animFrame += dt * (hero.moving || hero.dashTimer > 0 ? 10 : 4);
        if (hero.attackT > 0) hero.attackT = Math.min(1, hero.attackT + dt * 6);
        if (hero.attackT >= 1) hero.attackT = 0;
        for (let i = hero.afterImages.length - 1; i >= 0; i--) {
          hero.afterImages[i].t -= dt;
          if (hero.afterImages[i].t <= 0) hero.afterImages.splice(i, 1);
        }

        // door transition
        if (s.doorOpen && hero.x > ARENA.maxX - 30 && Math.abs(hero.y - (DOOR.y + DOOR.h / 2)) < DOOR.h * 0.75) {
          nextRoom();
        }

        // ---- auto-fire weapon ----
        const target = nearestEnemy();
        const wantAttack = s.keys.attack || (settings.autoTarget && target !== null);
        if (wantAttack && hero.hp > 0) {
          const interval = (heroDef.attackStyle === "melee" ? 0.34 : 0.26) / s.buffs.fireRate;
          hero.attackTimer += dt;
          if (hero.attackTimer >= interval) {
            hero.attackTimer = 0;
            hero.comboStep = (hero.comboStep + 1) % 3;
            hero.attackT = 0.01;
            sounds.playSlash();

            if (heroDef.attackStyle === "melee") {
              // wide crescent arc hitbox
              const faceAngle = hero.facingLeft ? Math.PI : 0;
              let hits = 0;
              s.enemies.forEach((en) => {
                if (en.dying) return;
                const ddx = en.x - hero.x;
                const ddy = en.y - hero.y;
                const dist = Math.hypot(ddx, ddy);
                if (dist > heroDef.range + en.radius) return;
                const ang = Math.atan2(ddy, ddx);
                let diff = Math.abs(((ang - faceAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
                if (diff < 1.25) {
                  damageEnemy(en, heroAtkNow() * (1 + hero.comboStep * 0.18));
                  hits++;
                  // knockback
                  const kb = en.isBoss ? 2 : en.isElite ? 6 : 12;
                  en.x += (ddx / (dist || 1)) * kb;
                  en.y += (ddy / (dist || 1)) * kb * 0.6;
                }
              });
              if (hits === 0) s.particles.push(...impact(hero.x + (hero.facingLeft ? -40 : 40), hero.y - 26, heroDef.accentColor, 4));
            } else {
              // ranged auto-aim shot
              let ax = hero.facingLeft ? -1 : 1;
              let ay = 0;
              if (target && (settings.autoTarget || s.keys.attack)) {
                const a = Math.atan2(target.y - hero.y, target.x - hero.x);
                ax = Math.cos(a);
                ay = Math.sin(a);
                hero.facingLeft = target.x < hero.x;
              }
              const spread = (rand() - 0.5) * 0.05;
              const a2 = Math.atan2(ay, ax) + spread;
              s.bullets.push({
                x: hero.x + ax * 16, y: hero.y - 30,
                vx: Math.cos(a2) * 11, vy: Math.sin(a2) * 11,
                damage: heroAtkNow() * (1 + hero.comboStep * 0.1), radius: 8,
                color: heroDef.accentColor, isHero: true, type: "shot", duration: 0.75,
              });
            }
          }
        }

        function nearestEnemy(): EnemyEntity | null {
          let best: EnemyEntity | null = null;
          let bestD = heroDef.attackStyle === "melee" ? heroDef.range + 40 : 480;
          for (const en of s.enemies) {
            if (en.dying) continue;
            const d = Math.hypot(en.x - hero.x, en.y - hero.y);
            if (d < bestD) { bestD = d; best = en; }
          }
          return best;
        }

        // ---- bullets ----
        for (let i = s.bullets.length - 1; i >= 0; i--) {
          const b = s.bullets[i];
          b.x += b.vx * 60 * dt;
          b.y += b.vy * 60 * dt;
          b.duration -= dt;
          if (b.x < ARENA.minX - 60 || b.x > ARENA.maxX + 80 || b.y < ARENA.minY - 200 || b.y > ARENA.maxY + 60) b.duration = 0;

          if (b.isHero) {
            for (const en of s.enemies) {
              if (en.dying) continue;
              if (Math.hypot(en.x - b.x, en.y - 20 - b.y) < en.radius + b.radius) {
                damageEnemy(en, b.damage);
                s.particles.push(...impact(b.x, b.y, b.color, 6));
                if (b.type !== "wave" && b.type !== "fire" && b.type !== "nova") { b.duration = 0; break; }
              }
            }
          } else if (Math.hypot(hero.x - b.x, hero.y - 28 - b.y) < 21 + b.radius) {
            heroTakeHit(b.damage);
            b.duration = 0;
          }
          if (b.duration <= 0) s.bullets.splice(i, 1);
        }

        // ---- telegraph zones ----
        for (let i = s.zones.length - 1; i >= 0; i--) {
          const z = s.zones[i];
          z.timer -= dt;
          if (z.timer <= 0) {
            sounds.playExplosion();
            s.particles.push(...impact(z.x, z.y, z.color, 32));
            s.shakeTime = Math.max(s.shakeTime, 0.3);
            if (Math.hypot(hero.x - z.x, hero.y - z.y) < z.radius + 16) heroTakeHit(z.damage);
            s.zones.splice(i, 1);
          }
        }

        // ---- pickups ----
        for (let i = s.pickups.length - 1; i >= 0; i--) {
          const p = s.pickups[i];
          p.bob += dt * 5;
          p.life -= dt;
          const d = Math.hypot(hero.x - p.x, hero.y - p.y);
          if (d < 96) {
            const a = Math.atan2(hero.y - p.y, hero.x - p.x);
            const pull = (1 - d / 96) * 240 * dt;
            p.x += Math.cos(a) * pull;
            p.y += Math.sin(a) * pull;
          }
          if (d < 24) {
            if (p.kind === "coin") {
              s.coinsCollected += 2 + chapterId;
              sounds.playCoin();
              s.particles.push(...impact(p.x, p.y, "#fbbf24", 6));
            } else if (p.kind === "energy") {
              hero.energy = Math.min(hero.energyMax, hero.energy + 28);
              sounds.playPotion();
              s.damageNumbers.push({ text: "+ENERGY", x: hero.x, y: hero.y - 66, vy: -1.6, opacity: 1, color: "#38bdf8", isCrit: false });
            } else {
              const heal = Math.round(heroMaxHpNow() * 0.14);
              hero.hp = Math.min(heroMaxHpNow(), hero.hp + heal);
              sounds.playPotion();
              s.damageNumbers.push({ text: `+${heal}`, x: hero.x, y: hero.y - 66, vy: -1.6, opacity: 1, color: "#4ade80", isCrit: false });
            }
            s.pickups.splice(i, 1);
            continue;
          }
          if (p.life <= 0) s.pickups.splice(i, 1);
        }

        // ---- enemies ----
        for (let i = s.enemies.length - 1; i >= 0; i--) {
          const en = s.enemies[i];
          en.animTick += dt * (en.isBoss ? 4 : 6);
          if (en.hitFlash > 0) en.hitFlash -= dt;
          if (en.attackT > 0) {
            en.attackT = Math.min(1, en.attackT + dt * 4.5);
            if (en.attackT >= 1) en.attackT = 0;
          }

          if (en.hp <= 0) {
            // DIE animation: collapse for a beat, then remove
            if (!en.dying) {
              en.dying = true;
              en.deathT = 0;
              en.deathDur = en.isBoss ? 0.55 : 0.34;
              sounds.playCoin();
              s.particles.push(...impact(en.x, en.y - 22, en.color, en.isBoss ? 56 : en.isElite ? 34 : 22));
              dropPickups(en.x, en.y, en.isBoss, en.isElite);
              s.kills += 1;
              setKillCount(s.kills);
              if (en.isElite) s.elitesKilled += 1;
              if (en.isBoss) {
                s.shakeTime = 0.9;
                setBossHpData(null);
                say(`${en.name.toUpperCase()} DEFEATED`, 2600);
                sounds.playVictory();
              }
              continue;
            }
            en.deathT = (en.deathT ?? 0) + dt;
            if (en.deathT >= (en.deathDur ?? 0.34)) {
              s.enemies.splice(i, 1);
              setEliteCount(s.enemies.filter((e) => e.isElite).length);
            }
            continue; // no AI / movement while dying
          }

          const d = Math.hypot(hero.x - en.x, hero.y - en.y);
          en.facingLeft = hero.x < en.x;

          if (en.chargeTimer > 0) {
            en.chargeTimer -= dt;
            const a = Math.atan2(hero.y - en.y, hero.x - en.x);
            en.x += Math.cos(a) * en.speed * 200 * dt;
            en.y += Math.sin(a) * en.speed * 200 * dt;
            en.moving = true;
            if (d < en.radius + 24) heroTakeHit(en.atk * 1.5);
          } else if (d > en.attackRange) {
            const a = Math.atan2(hero.y - en.y, hero.x - en.x);
            en.x += Math.cos(a) * en.speed * 54 * dt;
            en.y += Math.sin(a) * en.speed * 54 * dt;
            en.moving = true;
          } else {
            en.moving = false;
            en.attackCooldown -= dt;
            if (en.attackCooldown <= 0) {
              en.attackCooldown = en.isBoss ? 1.4 : en.isElite ? 1.05 : 1.25;
              en.attackT = 0.01;
              if (en.isRanged) {
                aimedFan(en, en.isElite ? 3 : 1, 5.8, en.atk, en.color, en.isElite ? Math.PI / 7 : 0);
              } else {
                heroTakeHit(en.atk);
              }
            }
          }

          if (en.isBoss) {
            en.specialTimer -= dt;
            if (en.specialTimer <= 0) {
              en.specialTimer = en.bossPhase >= 3 ? 2.2 : en.bossPhase === 2 ? 3.0 : 4.0;
              doBossSpecial(en);
            }
          } else if (en.isElite) {
            en.specialTimer -= dt;
            if (en.specialTimer <= 0) {
              en.specialTimer = 5.2;
              doEliteSpecial(en);
            }
          }

          en.x = Math.max(ARENA.minX - 20, Math.min(ARENA.maxX + 20, en.x));
          en.y = Math.max(ARENA.minY, Math.min(ARENA.maxY, en.y));
          resolveObstacleCollision(en, en.radius * 0.72, obstacles);
        }

        // ---- room clear / victory ----
        if (s.enemies.length === 0 && !s.roomCleared && !s.battleResolved) {
          s.roomCleared = true;
          setRoomCleared(true);
          if (s.room >= totalRooms) {
            s.battleResolved = true;
            setGameOver("victory");
            sounds.playVictory();
            try { confetti({ particleCount: 90, spread: 78, origin: { y: 0.6 } }); } catch {}
            const isBossVictory = levelDef.isBossLevel;
            const eliteBonus = Math.round(s.elitesKilled * levelDef.rewardCoins * 0.2);
            const dropItem = isBossVictory ? chapter.completionReward.item : null;
            setTimeout(() => {
              onBattleEnd({
                victory: true,
                rewardCoins: levelDef.rewardCoins + s.coinsCollected + eliteBonus + (isBossVictory ? chapter.completionReward.coins : 0),
                rewardXp: levelDef.rewardXp + (isBossVictory ? chapter.completionReward.xp : 0),
                potionsUsed: s.potionsUsed,
                bossDefeated: isBossVictory,
                dropItem,
              });
            }, 2600);
          } else {
            sounds.playVictory();
            offerBlessing();
          }
        }

        if (hero.hp <= 0 && !s.battleResolved) {
          s.battleResolved = true;
          setGameOver("defeat");
          sounds.playDefeat();
          setTimeout(() => {
            onBattleEnd({
              victory: false,
              rewardCoins: Math.round(levelDef.rewardCoins * 0.2) + s.coinsCollected,
              rewardXp: Math.round(levelDef.rewardXp * 0.25),
              potionsUsed: s.potionsUsed,
            });
          }, 2400);
        }

        // particles / numbers
        for (let i = s.particles.length - 1; i >= 0; i--) {
          const p = s.particles[i];
          p.x += p.vx; p.y += p.vy; p.vy += 0.13; p.vx *= 0.99; p.life -= dt;
          if (p.life <= 0) s.particles.splice(i, 1);
        }
        for (let i = s.damageNumbers.length - 1; i >= 0; i--) {
          const dn = s.damageNumbers[i];
          dn.y += dn.vy; dn.vy += 0.045; dn.opacity -= dt * 1.4;
          if (dn.opacity <= 0) s.damageNumbers.splice(i, 1);
        }

        // throttled HUD sync (~12hz)
        s.hudTimer += dt;
        if (s.hudTimer > 0.08) {
          s.hudTimer = 0;
          setHp(Math.max(0, Math.round(hero.hp)));
          setArmor(Math.round(hero.armor));
          setEnergy(Math.round(hero.energy));
          setRunCoins(s.coinsCollected);
          setSkillCd(Math.ceil(s.skillCooldownLeft));
          setDashCdUi(hero.dashCd);
        }
      }

      /* ================= RENDER ================= */
      ctx.save();
      ctx.clearRect(0, 0, ARENA.w, ARENA.h);
      if (settings.screenShake && s.shakeTime > 0) {
        const m = s.shakeTime * 15;
        ctx.translate((rand() - 0.5) * m, (rand() - 0.5) * m);
      }

      drawRoom(ctx);

      // telegraph zones
      s.zones.forEach((z) => {
        const p = 1 - z.timer / z.windup;
        const g = ctx.createRadialGradient(z.x, z.y, z.radius * 0.15, z.x, z.y, z.radius);
        g.addColorStop(0, `${z.color}66`);
        g.addColorStop(0.7, `${z.color}33`);
        g.addColorStop(1, `${z.color}05`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(z.x, z.y, z.radius, z.radius * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.strokeStyle = z.color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.45 + Math.sin(z.timer * 14) * 0.35;
        ctx.beginPath();
        ctx.ellipse(z.x, z.y, z.radius, z.radius * 0.62, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 0.95;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(z.x, z.y, z.radius * 0.86, z.radius * 0.53, 0, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        ctx.font = "bold 11px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(0,0,0,0.65)";
        ctx.fillText(z.label, z.x + 1, z.y - z.radius * 0.62 - 7);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(z.label, z.x, z.y - z.radius * 0.62 - 8);
      });

      // pickups
      s.pickups.forEach((p) => {
        const bobY = Math.sin(p.bob) * 3;
        ctx.save();
        ctx.translate(p.x, p.y + bobY);
        if (p.kind === "coin") {
          const g = ctx.createRadialGradient(-2, -2, 1, 0, 0, 10);
          g.addColorStop(0, "#fff7cc");
          g.addColorStop(0.5, "#fbbf24");
          g.addColorStop(1, "#b45309");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(0, -6, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.6)";
          ctx.lineWidth = 1.2;
          ctx.stroke();
        } else if (p.kind === "heart") {
          ctx.fillStyle = "#ef4444";
          ctx.shadowColor = "#ef4444";
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(0, -2);
          ctx.bezierCurveTo(-10, -12, -6, -20, 0, -14);
          ctx.bezierCurveTo(6, -20, 10, -12, 0, -2);
          ctx.fill();
        } else {
          const g = ctx.createRadialGradient(0, -8, 1, 0, -8, 12);
          g.addColorStop(0, "#ffffff");
          g.addColorStop(0.4, "#38bdf8");
          g.addColorStop(1, "rgba(56,189,248,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(0, -8, 12, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // artwork-driven sprites: real portraits used as the characters' heads
      const heroPortrait = getSpriteImage(heroDef.image);

      // dash after-images
      hero.afterImages.forEach((ai) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, ai.t) * 0.5;
        drawUnit(ctx, heroDef.sprite, {
          x: ai.x, y: ai.y, facingLeft: ai.facingLeft, frame: hero.animFrame,
          moving: true, attackT: 0, hitFlash: 0,
          portrait: heroPortrait, portraitCrop: HERO_CROP,
        });
        ctx.restore();
      });

      // entities (y-sorted)
      const list: Array<{ kind: "hero" | "enemy"; y: number; data: any }> = [];
      list.push({ kind: "hero", y: hero.y, data: hero });
      s.enemies.forEach((en) => list.push({ kind: "enemy", y: en.y, data: en }));
      list.sort((a, b) => a.y - b.y);

      list.forEach((it) => {
        if (it.kind === "hero") {
          // dodge i-frame shimmer
          if (hero.invuln > 0) {
            ctx.save();
            ctx.globalAlpha = 0.35 + Math.sin(now / 40) * 0.2;
            drawUnit(ctx, heroDef.sprite, {
              x: hero.x, y: hero.y, facingLeft: hero.facingLeft, frame: hero.animFrame,
              moving: hero.moving, attackT: hero.attackT, hitFlash: hero.hurtFlash, casting: hero.casting,
              portrait: heroPortrait, portraitCrop: HERO_CROP,
              dashing: hero.dashTimer > 0,
            });
            ctx.restore();
          }
          drawUnit(ctx, heroDef.sprite, {
            x: hero.x, y: hero.y, facingLeft: hero.facingLeft, frame: hero.animFrame,
            moving: hero.moving || hero.dashTimer > 0, attackT: hero.attackT,
            hitFlash: hero.hurtFlash, casting: hero.casting,
            portrait: heroPortrait, portraitCrop: HERO_CROP,
            dashing: hero.dashTimer > 0,
          });
        } else {
          const en = it.data as EnemyEntity;
          drawUnit(ctx, en.sprite, {
            x: en.x, y: en.y, facingLeft: en.facingLeft, frame: en.animTick,
            moving: en.moving && !en.dying, attackT: en.dying ? 0 : en.attackT,
            hitFlash: en.hitFlash,
            elite: en.isElite, boss: en.isBoss, casting: en.casting,
            portrait: getSpriteImage(en.image), portraitCrop: MONSTER_CROP,
            deathProgress: en.dying ? Math.min(1, (en.deathT ?? 0) / (en.deathDur ?? 0.34)) : undefined,
          });
          const w = Math.max(36, en.radius * 2.2);
          const bx = en.x - w / 2;
          const barLift = en.sprite.pixel
            ? en.sprite.scale * 30
            : en.sprite.scale * (en.isBoss ? 22 : en.sprite.shape === "dragon" ? 23 : 19);
          const by = en.y - barLift - 16;
          const pct = Math.max(0, en.hp / en.maxHp);
          ctx.fillStyle = "rgba(8,8,14,0.85)";
          ctx.beginPath();
          ctx.roundRect(bx - 2, by - 2, w + 4, 9, 5);
          ctx.fill();
          const hg = ctx.createLinearGradient(bx, by, bx + w, by);
          if (en.isBoss) { hg.addColorStop(0, "#ef4444"); hg.addColorStop(1, "#f59e0b"); }
          else if (en.isElite) { hg.addColorStop(0, "#f97316"); hg.addColorStop(1, "#fbbf24"); }
          else { hg.addColorStop(0, "#22c55e"); hg.addColorStop(1, "#84cc16"); }
          ctx.fillStyle = hg;
          ctx.beginPath();
          ctx.roundRect(bx, by, w * pct, 5, 3);
          ctx.fill();
          if (en.isElite) {
            ctx.font = "bold 9px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.fillStyle = "#fb923c";
            ctx.fillText("ELITE", en.x, by - 5);
          }
        }
      });

      // bullets
      s.bullets.forEach((b) => {
        const g = ctx.createRadialGradient(b.x, b.y, 1, b.x, b.y, b.radius * 2);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.35, b.color);
        g.addColorStop(1, `${b.color}00`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `${b.color}55`;
        ctx.lineWidth = b.radius * 0.7;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(b.x - b.vx * 2.6, b.y - b.vy * 2.6);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });

      // particles
      s.particles.forEach((pt) => {
        const a = Math.max(0, pt.life / pt.maxLife);
        ctx.globalAlpha = a;
        const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pt.radius * 2.1);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.4, pt.color);
        g.addColorStop(1, `${pt.color}00`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius * 2.1, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // damage numbers
      s.damageNumbers.forEach((dn) => {
        ctx.globalAlpha = Math.max(0, dn.opacity);
        ctx.font = dn.isCrit ? "bold 20px Inter, sans-serif" : "bold 14px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = "rgba(0,0,0,0.85)";
        ctx.strokeText(dn.text, dn.x, dn.y);
        ctx.fillStyle = dn.color;
        ctx.fillText(dn.text, dn.x, dn.y);
      });
      ctx.globalAlpha = 1;
      ctx.textAlign = "left";

      drawMinimap(ctx, showBigMap);
      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    /* ---------- room rendering (walls, floor, door) ---------- */
    const drawRoom = (c: CanvasRenderingContext2D) => {
      const pal = chapter.arenaPalette;

      // floor
      const floor = c.createLinearGradient(0, ARENA.minY - 40, 0, ARENA.h);
      floor.addColorStop(0, pal[1]);
      floor.addColorStop(1, pal[0]);
      c.fillStyle = floor;
      c.fillRect(0, 0, ARENA.w, ARENA.h);

      // wall area (above play field)
      const wall = c.createLinearGradient(0, 0, 0, ARENA.minY);
      wall.addColorStop(0, pal[2]);
      wall.addColorStop(1, pal[0]);
      c.fillStyle = wall;
      c.fillRect(0, 0, ARENA.w, ARENA.minY - 6);

      // wall brick lines
      c.strokeStyle = "rgba(0,0,0,0.28)";
      c.lineWidth = 2;
      for (let y = 14; y < ARENA.minY - 10; y += 26) {
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(ARENA.w, y);
        c.stroke();
        const off = (y / 26) % 2 === 0 ? 0 : 34;
        for (let x = off; x < ARENA.w; x += 68) {
          c.beginPath();
          c.moveTo(x, y);
          c.lineTo(x, y + 26);
          c.stroke();
        }
      }
      // wall top highlight
      c.fillStyle = `${pal[4]}33`;
      c.fillRect(0, ARENA.minY - 12, ARENA.w, 6);

      // floor tiles
      c.save();
      c.globalAlpha = 0.14;
      c.strokeStyle = pal[5];
      c.lineWidth = 1.4;
      for (let y = ARENA.minY; y <= ARENA.maxY + 40; y += 44) {
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(ARENA.w, y);
        c.stroke();
      }
      for (let x = 0; x < ARENA.w; x += 64) {
        c.beginPath();
        c.moveTo(x, ARENA.minY);
        c.lineTo(x, ARENA.h);
        c.stroke();
      }
      c.restore();

      // centre light pool
      const pool = c.createRadialGradient(ARENA.w / 2, (ARENA.minY + ARENA.maxY) / 2, 40, ARENA.w / 2, (ARENA.minY + ARENA.maxY) / 2, 470);
      pool.addColorStop(0, "rgba(255,255,255,0.07)");
      pool.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = pool;
      c.fillRect(0, ARENA.minY - 40, ARENA.w, ARENA.h);

      // side walls
      c.fillStyle = pal[2];
      c.fillRect(0, ARENA.minY - 6, ARENA.minX - 14, ARENA.h);
      c.fillRect(ARENA.maxX + 14, ARENA.minY - 6, ARENA.w - ARENA.maxX, ARENA.h);
      c.fillStyle = "rgba(255,255,255,0.06)";
      c.fillRect(ARENA.minX - 18, ARENA.minY - 6, 4, ARENA.h);
      c.fillRect(ARENA.maxX + 14, ARENA.minY - 6, 4, ARENA.h);

      // bottom wall
      c.fillStyle = pal[2];
      c.fillRect(0, ARENA.maxY + 22, ARENA.w, ARENA.h - ARENA.maxY);

      // ---- DOOR ----
      const s = stateRef.current;
      const dx = ARENA.maxX + 14;
      const dy = DOOR.y;
      const dw = 34;
      const dh = DOOR.h;
      c.save();
      if (s.doorOpen) {
        const g = c.createLinearGradient(dx, dy, dx + dw, dy + dh);
        g.addColorStop(0, "#fde68a");
        g.addColorStop(0.5, "#f59e0b");
        g.addColorStop(1, "#b45309");
        c.fillStyle = g;
        c.shadowColor = "#fbbf24";
        c.shadowBlur = 26;
        c.beginPath();
        c.roundRect(dx - 6, dy, dw, dh, 8);
        c.fill();
        c.shadowBlur = 0;
        c.fillStyle = "rgba(255,255,255,0.55)";
        c.beginPath();
        c.roundRect(dx - 2, dy + 8, dw - 14, dh - 16, 6);
        c.fill();
        // arrow hint
        c.fillStyle = "#0b0a10";
        c.font = "bold 16px Inter, sans-serif";
        c.textAlign = "center";
        c.fillText("➜", dx + dw / 2 - 2, dy + dh / 2 + 6);
      } else {
        c.fillStyle = "#241d33";
        c.beginPath();
        c.roundRect(dx - 6, dy, dw, dh, 8);
        c.fill();
        c.strokeStyle = "rgba(255,255,255,0.14)";
        c.lineWidth = 2;
        c.stroke();
        c.strokeStyle = "rgba(255,255,255,0.18)";
        c.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
          c.beginPath();
          c.moveTo(dx - 4, dy + 16 + i * 28);
          c.lineTo(dx + dw - 8, dy + 16 + i * 28);
          c.stroke();
        }
      }
      c.restore();

      // terrain props
      const props = [pal[3], pal[4], pal[5]];
      terrainRef.current.forEach((o) => drawTerrainProp(c, o.x, o.y, o.w, o.h, o.kind, props));

      // vignette
      const vig = c.createRadialGradient(ARENA.w / 2, ARENA.h / 2, 220, ARENA.w / 2, ARENA.h / 2, 620);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(0,0,0,0.6)");
      c.fillStyle = vig;
      c.fillRect(0, 0, ARENA.w, ARENA.h);
    };

    /* ---------- minimap of the room ---------- */
    const drawMinimap = (c: CanvasRenderingContext2D, big: boolean) => {
      const s = stateRef.current;
      const mw = big ? 400 : 170;
      const mh = big ? 250 : 106;
      const mx = big ? (ARENA.w - mw) / 2 : 14;
      const my = big ? (ARENA.h - mh) / 2 : ARENA.h - mh - 14;
      const sx = mw / ARENA.w;
      const sy = mh / ARENA.h;

      if (big) {
        c.fillStyle = "rgba(5,5,10,0.82)";
        c.fillRect(0, 0, ARENA.w, ARENA.h);
      }
      c.save();
      c.shadowColor = "rgba(0,0,0,0.7)";
      c.shadowBlur = 18;
      c.fillStyle = "rgba(12,11,20,0.92)";
      c.beginPath();
      c.roundRect(mx - 4, my - 4, mw + 8, mh + 8, 12);
      c.fill();
      c.restore();

      const g = c.createLinearGradient(mx, my, mx, my + mh);
      g.addColorStop(0, chapter.arenaPalette[0]);
      g.addColorStop(1, chapter.arenaPalette[2]);
      c.fillStyle = g;
      c.beginPath();
      c.roundRect(mx, my, mw, mh, 9);
      c.fill();
      c.strokeStyle = big ? "rgba(245,197,66,0.75)" : "rgba(148,130,200,0.4)";
      c.lineWidth = 2;
      c.stroke();

      c.fillStyle = "rgba(226,222,255,0.3)";
      terrainRef.current.forEach((o) => {
        c.beginPath();
        c.roundRect(mx + o.x * sx, my + o.y * sy, Math.max(3, o.w * sx), Math.max(3, o.h * sy), 2);
        c.fill();
      });

      // door marker
      c.fillStyle = s.doorOpen ? "#fbbf24" : "rgba(255,255,255,0.25)";
      c.beginPath();
      c.roundRect(mx + (ARENA.maxX + 10) * sx, my + DOOR.y * sy, 6, DOOR.h * sy, 2);
      c.fill();

      s.zones.forEach((z) => {
        c.fillStyle = `${z.color}88`;
        c.beginPath();
        c.arc(mx + z.x * sx, my + z.y * sy, Math.max(3, z.radius * sx * 0.5), 0, Math.PI * 2);
        c.fill();
      });
      s.pickups.forEach((p) => {
        c.fillStyle = p.kind === "coin" ? "#fbbf24" : p.kind === "heart" ? "#ef4444" : "#38bdf8";
        c.beginPath();
        c.arc(mx + p.x * sx, my + p.y * sy, 2, 0, Math.PI * 2);
        c.fill();
      });
      s.enemies.forEach((en) => {
        const ex = mx + en.x * sx;
        const ey = my + en.y * sy;
        c.fillStyle = en.isBoss ? "#f43f5e" : en.isElite ? "#fb923c" : "#ef4444";
        c.beginPath();
        c.arc(ex, ey, en.isBoss ? 6 : en.isElite ? 4.4 : 2.8, 0, Math.PI * 2);
        c.fill();
      });

      const hx = mx + s.hero.x * sx;
      const hy = my + s.hero.y * sy;
      c.fillStyle = "rgba(74,222,128,0.35)";
      c.beginPath();
      c.arc(hx, hy, 7, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#4ade80";
      c.beginPath();
      c.arc(hx, hy, 3.6, 0, Math.PI * 2);
      c.fill();

      c.font = "bold 10px Inter, sans-serif";
      c.fillStyle = big ? "#f5c542" : "rgba(245,197,66,0.9)";
      c.fillText(big ? "ROOM MAP" : "MAP", mx + 8, my + 15);
      if (big) {
        c.font = "bold 12px Inter, sans-serif";
        c.fillStyle = "#e5e7eb";
        c.fillText(`${chapter.subtitle} — Stage ${levelNumber} · Room ${s.room}/${totalRooms}`, mx + 8, my + 34);
        const legend: Array<[string, string]> = [["#4ade80", "YOU"], ["#ef4444", "ENEMY"], ["#fb923c", "ELITE"], ["#f43f5e", "BOSS"], ["#fbbf24", "DOOR/PICKUPS"]];
        legend.forEach(([col, label], i) => {
          const lx = mx + 8 + i * 78;
          c.fillStyle = col;
          c.beginPath();
          c.arc(lx + 4, my + mh - 40, 4, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = "#cbd5e1";
          c.font = "bold 10px Inter, sans-serif";
          c.fillText(label, lx + 13, my + mh - 36);
        });
        c.fillStyle = "#9ca3af";
        c.fillText("Press M or the MAP button to close", mx + 8, my + mh - 14);
      }
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [isPaused, gameOver, blessingOptions, showBigMap, settings, heroDef, chapter, chapterId, levelDef, levelNumber, bossDef, totalRooms, spawnRoom, nextRoom, triggerHeroSkill, drinkHealthPotion, doDash, offerBlessing, onBattleEnd]);

  /* ---------------- touch controls ---------------- */

  const handleJoystickTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = t.clientX - cx;
    const dy = t.clientY - cy;
    stateRef.current.joystick = { active: true, angle: Math.atan2(dy, dx), power: Math.min(50, Math.hypot(dx, dy)) / 50 };
  };
  const handleJoystickEnd = () => {
    stateRef.current.joystick = { active: false, angle: 0, power: 0 };
  };

  const hpPct = Math.max(0, (hp / Math.max(1, maxHpUi)) * 100);
  const armorPct = Math.max(0, (armor / Math.max(1, armorMaxUi)) * 100);
  const energyPct = Math.max(0, (energy / Math.max(1, energyMaxUi)) * 100);

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center justify-start sm:justify-center select-none bg-[#0a0a0f] overflow-hidden p-2 sm:p-4">
      {/* ===== TOP HUD ===== */}
      <div className="w-full max-w-5xl flex items-start justify-between gap-2 mb-2">
        {/* hero plate: portrait + HP + armor + energy */}
        <div className="panel rounded-2xl flex items-center gap-2.5 px-2.5 py-2">
          <div
            className="w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 shadow-lg"
            style={{ borderColor: heroDef.accentColor, backgroundColor: heroDef.color }}
          >
            <ArtImage src={heroDef.image} alt={heroDef.name} fallbackText={heroDef.classIcon} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-[160px] sm:min-w-[248px]">
            <div className="flex items-center justify-between text-[10px] mb-1 gap-2">
              <span className="font-bold" style={{ color: heroDef.accentColor }}>{heroDef.name}</span>
              <span className="text-neutral-400 uppercase tracking-wide hidden sm:inline">{heroDef.classType}</span>
              <span className="text-emerald-400 font-mono">{hp}/{maxHpUi}</span>
            </div>
            {/* HP */}
            <div className="hp-bar h-3 w-full border border-black/60">
              <div className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-emerald-400 transition-all duration-150" style={{ width: `${hpPct}%` }} />
            </div>
            {/* Armor (regenerating) */}
            <div className="hp-bar h-2 w-full border border-black/60 mt-1">
              <div className="h-full bg-gradient-to-r from-sky-500 to-cyan-300 transition-all duration-150" style={{ width: `${armorPct}%` }} />
            </div>
            {/* Energy */}
            <div className="hp-bar h-1.5 w-full border border-black/60 mt-1">
              <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-150" style={{ width: `${energyPct}%` }} />
            </div>
            <div className="flex items-center justify-between text-[9px] mt-1 text-neutral-400">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-sky-400" />{armor}/{armorMaxUi}</span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" />{energy}/{energyMaxUi}</span>
            </div>
          </div>
        </div>

        {/* room plate */}
        <div className="panel rounded-2xl px-3.5 py-2 text-center hidden sm:block">
          <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
            {chapter.title} · Stage {levelNumber}
          </div>
          <div className="text-[11px] text-white font-semibold mt-0.5 flex items-center justify-center gap-1.5">
            <DoorOpen className="w-3.5 h-3.5 text-amber-400" />
            Room {roomNo}/{totalRooms}{levelDef.isBossLevel && roomNo >= totalRooms ? " ★ BOSS" : ""}
          </div>
          <div className="text-[9px] text-neutral-400 mt-0.5">
            Kills {killCount}{eliteCount > 0 ? ` · Elites x${eliteCount}` : ""}
          </div>
        </div>

        {/* coins + buttons */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="panel rounded-xl px-2.5 py-1.5 text-[10px] text-amber-300 font-mono font-bold flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5" /> {runCoins}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { sounds.playClick(); setShowBigMap((v) => !v); }}
              className={`btn-3d p-2 rounded-xl border ${showBigMap ? "bg-amber-500 border-amber-300 text-black" : "panel border-white/10 text-amber-300"}`}
              title="Room map (M)"
            >
              <MapIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => { sounds.playClick(); setIsPaused((v) => !v); }}
              className="btn-3d panel p-2 rounded-xl border border-white/10 text-neutral-300 hover:text-white"
              title="Pause (P)"
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
            </button>
            <button
              onClick={onExit}
              className="btn-3d p-2 rounded-xl bg-red-950/70 border border-red-800/60 text-red-300 hover:bg-red-900/70"
              title="Abandon run"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ===== BOSS BAR ===== */}
      {bossHpData && (
        <div className="w-full max-w-2xl mb-2 animate-in fade-in duration-300">
          <div className="panel rounded-2xl px-3 py-2.5 flex items-center gap-3 border-red-500/40" style={{ boxShadow: "0 10px 34px -14px rgba(239,68,68,0.7)" }}>
            <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-red-600/70 shrink-0 bg-[#1a0808] shadow-lg">
              <ArtImage src={bossDef.image} alt={bossHpData.name} fallbackText="☠" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[10px] text-red-300 font-bold uppercase tracking-wide mb-1 gap-2">
                <span className="flex items-center gap-1.5 truncate">
                  <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" /> {bossHpData.name}
                </span>
                <span className="text-neutral-300 font-mono shrink-0">
                  PHASE {bossHpData.phase} · {bossHpData.current}/{bossHpData.max}
                </span>
              </div>
              <div className="hp-bar h-4 w-full border border-red-900/60">
                <div className="h-full bg-gradient-to-r from-red-700 via-rose-600 to-amber-500 transition-all duration-150" style={{ width: `${Math.max(0, (bossHpData.current / bossHpData.max) * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== CANVAS ===== */}
      <div className="relative w-full max-w-5xl">
        <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.95)] bg-black">
          <canvas ref={canvasRef} width={900} height={560} className="block w-full h-auto" />

          {banner && (
            <div className="absolute top-[18%] left-0 right-0 flex items-center justify-center pointer-events-none">
              <div className="pulse-glow bg-gradient-to-r from-red-950/95 via-red-900/95 to-red-950/95 text-red-100 border-y-2 border-red-500/80 px-6 py-2.5 text-[11px] sm:text-sm font-black tracking-[0.18em] uppercase shadow-2xl backdrop-blur-sm">
                <span className="inline-flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" /> {banner}
                </span>
              </div>
            </div>
          )}

          {roomCleared && !gameOver && !blessingOptions && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="panel rounded-full px-4 py-1.5 text-[11px] text-amber-300 font-bold flex items-center gap-2 animate-pulse">
                <DoorOpen className="w-4 h-4" /> Room cleared — walk into the glowing door ➜
              </div>
            </div>
          )}

          <div className="sm:hidden absolute top-2 right-2 panel rounded-lg px-2 py-1 text-[9px] text-amber-300 font-semibold">
            R{roomNo}/{totalRooms}
          </div>

          {/* Blessing choice (roguelike) */}
          {blessingOptions && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-5 gap-4">
              <div className="text-center">
                <div className="text-[11px] uppercase tracking-[0.2em] text-amber-300 font-bold flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" /> Room Cleared — Choose a Blessing
                </div>
                <div className="text-[10px] text-neutral-400 mt-1">Lasts for the rest of this run</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-3xl">
                {blessingOptions.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => applyBlessing(b)}
                    className="btn-3d panel rounded-2xl p-4 text-left hover:scale-[1.02] transition"
                    style={{ borderColor: `${b.color}66` }}
                  >
                    <div className="text-2xl mb-2">{b.icon}</div>
                    <div className="text-xs font-bold uppercase" style={{ color: b.color }}>{b.name}</div>
                    <div className="text-[10px] text-neutral-300 mt-1 leading-relaxed">{b.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* victory / defeat */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
              {gameOver === "victory" ? (
                <>
                  <div className="w-20 h-20 rounded-full bg-amber-500/15 border-2 border-amber-400 flex items-center justify-center text-amber-300 mb-4 float-soft">
                    <Trophy className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-amber-300 uppercase tracking-wide">Stage Cleared!</h2>
                  <p className="text-xs text-neutral-400 mt-2 mb-4 max-w-sm">
                    All {totalRooms} rooms purged{levelDef.isBossLevel ? ` and ${bossDef.name} has fallen` : ""}. Collecting rewards...
                  </p>
                  <div className="panel rounded-2xl px-5 py-3.5 flex gap-6 text-center">
                    <div>
                      <div className="text-[10px] text-neutral-400 uppercase">Coins</div>
                      <div className="text-lg text-amber-300 font-mono font-bold">+{levelDef.rewardCoins + runCoins}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-400 uppercase">XP</div>
                      <div className="text-lg text-cyan-300 font-mono font-bold">+{levelDef.rewardXp}</div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-red-500/15 border-2 border-red-500 flex items-center justify-center text-red-400 mb-4">
                    <Skull className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-red-400 uppercase tracking-wide">Hero Fallen</h2>
                  <p className="text-xs text-neutral-400 mt-2 max-w-sm">
                    Room {roomNo} was your limit. Train stats, upgrade gear and try again.
                  </p>
                </>
              )}
            </div>
          )}

          {isPaused && !gameOver && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-6">
              <h2 className="text-xl font-bold text-white uppercase tracking-widest">Paused</h2>
              <div className="flex gap-3">
                <button onClick={() => setIsPaused(false)} className="btn-3d px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase">
                  Resume
                </button>
                <button onClick={onExit} className="btn-3d px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold uppercase">
                  Exit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== CONTROLS ===== */}
      <div className="w-full max-w-5xl flex items-center justify-between gap-3 mt-3">
        {/* joystick */}
        <div
          className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-neutral-900/80 border-2 border-white/10 touch-none flex items-center justify-center shrink-0 shadow-inner"
          onTouchMove={handleJoystickTouch}
          onTouchEnd={handleJoystickEnd}
          onMouseDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const move = (ev: MouseEvent) => {
              const dx = ev.clientX - (rect.left + rect.width / 2);
              const dy = ev.clientY - (rect.top + rect.height / 2);
              stateRef.current.joystick = { active: true, angle: Math.atan2(dy, dx), power: Math.min(50, Math.hypot(dx, dy)) / 50 };
            };
            const stop = () => {
              stateRef.current.joystick = { active: false, angle: 0, power: 0 };
              window.removeEventListener("mousemove", move);
              window.removeEventListener("mouseup", stop);
            };
            window.addEventListener("mousemove", move);
            window.addEventListener("mouseup", stop);
          }}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-b from-neutral-600 to-neutral-800 border border-black/50 shadow-lg pointer-events-none" />
          <span className="absolute bottom-1.5 text-[9px] text-neutral-500 uppercase tracking-wider">Move</span>
        </div>

        {/* hints */}
        <div className="hidden md:block text-[10px] text-neutral-400 leading-relaxed panel rounded-xl px-4 py-2.5">
          <div><span className="text-neutral-200 font-semibold">WASD / Arrows</span> — Move · <span className="text-neutral-200 font-semibold">J / Space</span> — Auto-fire</div>
          <div><span className="text-neutral-200 font-semibold">L / Shift</span> — Dash (i-frames) · <span className="text-neutral-200 font-semibold">K</span> — Skill ({SKILL_COST} energy)</div>
          <div><span className="text-neutral-200 font-semibold">Q</span> — Potion · <span className="text-neutral-200 font-semibold">M</span> — Map · <span className="text-neutral-200 font-semibold">P</span> — Pause</div>
          <div className="text-sky-300/80 mt-0.5">Armor regenerates a few seconds after you stop taking hits.</div>
        </div>

        {/* action buttons */}
        <div className="flex items-end gap-2.5 shrink-0">
          <button
            onClick={drinkHealthPotion}
            disabled={potionsCount <= 0 || hp >= maxHpUi}
            className="btn-3d relative w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-b from-red-800 to-red-950 border-2 border-red-600/60 text-red-200 flex flex-col items-center justify-center px-3 py-3"
          >
            <Heart className="w-5 h-5 fill-current" />
            <span className="text-[10px] font-mono mt-0.5">x{potionsCount}</span>
          </button>

          <button
            onClick={doDash}
            disabled={dashCdUi > 0}
            className={`btn-3d relative w-13 h-13 sm:w-14 sm:h-14 rounded-2xl border-2 flex flex-col items-center justify-center px-3 py-3 ${
              dashCdUi <= 0 ? "bg-gradient-to-b from-sky-600 to-sky-900 border-sky-400/70 text-sky-100" : "bg-neutral-900 border-white/10 text-neutral-500"
            }`}
          >
            <Wind className="w-5 h-5" />
            <span className="text-[9px] mt-0.5 font-mono">{dashCdUi > 0 ? dashCdUi.toFixed(1) : "DASH"}</span>
          </button>

          <button
            onClick={triggerHeroSkill}
            disabled={skillCd > 0 || energy < SKILL_COST}
            className={`btn-3d relative w-16 h-16 sm:w-[70px] sm:h-[70px] rounded-2xl border-2 flex flex-col items-center justify-center ${
              skillCd === 0 && energy >= SKILL_COST
                ? "bg-gradient-to-b from-purple-700 to-purple-950 border-purple-400/70 text-purple-100 ring-2 ring-purple-500/30"
                : "bg-neutral-900 border-white/10 text-neutral-500"
            }`}
          >
            <Zap className="w-6 h-6" />
            <span className="text-[8px] mt-0.5 px-1 text-center leading-tight uppercase font-semibold">
              {skillCd > 0 ? `${skillCd}s` : heroDef.skill.name.split(" ")[0]}
            </span>
          </button>

          <button
            onPointerDown={() => (stateRef.current.keys.attack = true)}
            onPointerUp={() => (stateRef.current.keys.attack = false)}
            onPointerLeave={() => (stateRef.current.keys.attack = false)}
            className="btn-3d relative w-[70px] h-[70px] sm:w-20 sm:h-20 rounded-full bg-gradient-to-b from-amber-500 to-amber-700 border-2 border-amber-300/70 text-white flex flex-col items-center justify-center shadow-[0_0_28px_-6px_rgba(245,158,11,0.65)]"
          >
            <Sword className="w-6 h-6" />
            <span className="text-[8px] mt-0.5 uppercase font-semibold">Fire</span>
          </button>
        </div>
      </div>
    </div>
  );
}
