"use client";

import React, { useState, useRef, useEffect } from "react";
import { HEROES, HERO_CLASS_LIST } from "@/lib/gameData";
import ArtImage from "@/components/game/ArtImage";
import type { SpriteKit } from "@/lib/sprites";
import { drawUnit } from "@/lib/sprites";
import { getSpriteImage, HERO_CROP } from "@/lib/spriteImages";
import { sounds } from "@/lib/soundEffects";
import { Lock, CheckCircle2, Coins, Users, Sparkles } from "lucide-react";

const BUILD_LABEL: Record<string, string> = {
  robe: "Robed caster (flowing robes, wide sleeves)",
  slim: "Lean ranger (slim frame, long tied hair)",
  heavy: "Bulky bruiser (broad torso, heavy pauldrons)",
  standard: "Balanced fighter (knight proportions)",
};

const GEAR_LABEL: Record<string, string> = {
  quiver: "quiver of arrows",
  spellbook: "floating spellbook",
  dualWield: "dual-wielding",
  shield: "tower shield",
  furPauldrons: "fur pauldrons",
  flameAura: "flame aura",
  vines: "living vines",
  emblemCape: "emblem tabard",
  wings: "wings",
  ribs: "exposed ribs",
  torn: "torn rags",
};

/** Live animated preview of the actual in-battle character model */
function SpritePreview({ kit, accent, image }: { kit: SpriteKit; accent: string; image: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    let raf = 0;
    let t = 0;
    const draw = () => {
      const cv = ref.current;
      if (!cv) return;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      t += 0.028;
      ctx.clearRect(0, 0, cv.width, cv.height);
      const g = ctx.createRadialGradient(cv.width / 2, cv.height - 24, 4, cv.width / 2, cv.height - 24, 62);
      g.addColorStop(0, `${accent}44`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, cv.width, cv.height);
      const atkCycle = Math.sin(t * 0.9);
      drawUnit(ctx, kit, {
        x: cv.width / 2,
        y: cv.height - 14,
        facingLeft: false,
        frame: t * 3.4,
        moving: false,
        attackT: atkCycle > 0.86 ? (atkCycle - 0.86) / 0.14 : 0,
        hitFlash: 0,
        casting: atkCycle < -0.9,
        portrait: getSpriteImage(image),
        portraitCrop: HERO_CROP,
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [kit, accent, image]);
  return <canvas ref={ref} width={150} height={170} className="w-[150px] h-[170px]" />;
}

interface CharacterSelectModalProps {
  selectedHeroId: string;
  unlockedHeroes: string[];
  heroLevels: Record<string, number>;
  playerCoins: number;
  onSelectHero: (heroId: string) => void;
  onUnlockHero: (heroId: string, cost: number) => void;
  onClose: () => void;
}

export default function CharacterSelectModal({
  selectedHeroId, unlockedHeroes, heroLevels, playerCoins, onSelectHero, onUnlockHero, onClose,
}: CharacterSelectModalProps) {
  const [activeKey, setActiveKey] = useState<string>(selectedHeroId);
  const heroList = Object.values(HEROES);
  const hero = HEROES[activeKey] || heroList[0];
  const isUnlocked = unlockedHeroes.includes(hero.id);
  const isSelected = selectedHeroId === hero.id;

  const handleSelect = () => {
    sounds.playClick();
    if (isUnlocked) {
      onSelectHero(hero.id);
      onClose();
    }
  };

  const handleUnlock = () => {
    if (!isUnlocked && playerCoins >= hero.unlockCost) {
      sounds.playCoin();
      onUnlockHero(hero.id, hero.unlockCost);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="panel rounded-3xl w-full max-w-6xl max-h-[93vh] flex flex-col overflow-hidden border-white/10">
        {/* header */}
        <div className="px-5 py-4 border-b border-white/10 bg-black/30 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wide flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" /> Class Selection — 10 Hero Classes
            </h2>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Warrior · Swordsman · Archer · Mage · Assassin · Guardian · Druid · Paladin · Sorcerer · Dragon Knight
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-black/40 border border-amber-600/40 px-3 py-1.5 rounded-xl text-amber-300 text-xs font-bold font-mono">
              <Coins className="w-4 h-4" /> {playerCoins.toLocaleString()}
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold transition"
            >
              ✕ Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* roster */}
          <div className="lg:col-span-7 p-4 overflow-y-auto max-h-[46vh] lg:max-h-[70vh]">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {heroList.map((h) => {
                const unlocked = unlockedHeroes.includes(h.id);
                const active = activeKey === h.id;
                const chosen = selectedHeroId === h.id;
                return (
                  <button
                    key={h.id}
                    onClick={() => { sounds.playClick(); setActiveKey(h.id); }}
                    className={`relative text-left rounded-2xl overflow-hidden border-2 transition-all ${
                      active
                        ? "border-amber-400 shadow-[0_0_0_3px_rgba(245,197,66,0.18)] scale-[1.02]"
                        : "border-white/10 hover:border-white/25"
                    } bg-black/40`}
                  >
                    <div className="relative w-full aspect-square overflow-hidden" style={{ backgroundColor: `${h.color}22` }}>
                      <ArtImage src={h.image} alt={h.name} fallbackText={h.classIcon} className="w-full h-full object-cover object-top" />
                      {!unlocked && (
                        <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-1">
                          <Lock className="w-6 h-6 text-amber-400" />
                          <span className="text-[9px] text-amber-300 font-mono">{h.unlockCost} coins</span>
                        </div>
                      )}
                      {chosen && (
                        <div className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold shadow">
                          ACTIVE
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-1.5 pt-4 pb-1 text-center">
                        <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: h.accentColor }}>
                          {h.classIcon} {h.classType}
                        </span>
                      </div>
                    </div>
                    <div className="px-2 py-1.5">
                      <div className="text-[11px] font-bold text-white truncate">{h.name}</div>
                      <div className="text-[9px] text-neutral-400 truncate">{h.title}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* class legend */}
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-3">
              <div className="text-[10px] text-amber-300 uppercase font-bold mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> All 10 Classes
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {HERO_CLASS_LIST.map((c) => (
                  <div key={c.classType} className="flex items-center gap-2 text-[10px] bg-white/5 border border-white/10 rounded-xl px-2 py-1.5">
                    <span className="text-sm">{c.icon}</span>
                    <span className="text-white font-bold">{c.classType}</span>
                    <span className="text-neutral-500 truncate">— {c.blurb}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* detail */}
          <div className="lg:col-span-5 p-5 bg-black/25 border-t lg:border-t-0 lg:border-l border-white/10 overflow-y-auto max-h-[70vh]">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="flex items-center gap-4 flex-wrap justify-center">
                <div
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden border-2 shadow-2xl"
                  style={{ borderColor: hero.accentColor, backgroundColor: `${hero.color}22`, boxShadow: `0 20px 50px -20px ${hero.color}` }}
                >
                  <ArtImage src={hero.image} alt={hero.name} fallbackText={hero.classIcon} className="w-full h-full object-cover object-top" />
                </div>
                <div className="rounded-3xl border border-white/10 bg-black/40 px-2 py-1">
                  <div className="text-[9px] uppercase tracking-wider text-neutral-400 text-center mb-0.5">
                    Battle Model
                  </div>
                  <SpritePreview kit={hero.sprite} accent={hero.accentColor} image={hero.image} />
                </div>
              </div>
              <div className="mt-3 text-xl font-black text-white">{hero.name}</div>
              <div
                className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mt-1.5 border"
                style={{ backgroundColor: `${hero.color}25`, color: hero.accentColor, borderColor: hero.accentColor }}
              >
                {hero.classIcon} {hero.classType}
              </div>
              <div className="text-[11px] text-amber-300 mt-2 font-semibold">{hero.title}</div>
              <div className="text-[11px] text-neutral-400 mt-1.5 max-w-xs leading-relaxed">{hero.lore}</div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-2.5">
                <div className="text-[9px] text-neutral-400 uppercase font-semibold">Weapon</div>
                <div className="text-[11px] text-white mt-0.5 font-semibold">🗡️ {hero.weapon}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-2.5">
                <div className="text-[9px] text-neutral-400 uppercase font-semibold">Combat Role</div>
                <div className="text-[11px] text-white mt-0.5 font-semibold">🛡️ {hero.role}</div>
              </div>
            </div>

            {/* Unique battle silhouette for this class */}
            <div className="rounded-2xl border border-white/10 bg-black/30 p-3 mb-3">
              <div className="text-[9px] text-neutral-400 uppercase font-semibold mb-1">Unique Appearance</div>
              <div className="text-[11px] text-white leading-relaxed">
                {BUILD_LABEL[hero.sprite.build || "standard"]}
                {(hero.sprite.gear || []).length > 0 && (
                  <span className="text-neutral-300">
                    {" "}— {(hero.sprite.gear || []).map((g) => GEAR_LABEL[g] || g).join(", ")}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-neutral-400 mt-1">
                Attack style: <span className="text-amber-300 capitalize">{hero.attackStyle}</span> · Range {hero.range}px
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-3.5 mb-3 space-y-2.5">
              {[
                { label: "Health (HP)", value: hero.stats.hp, max: 800, bar: "bg-emerald-500", text: "text-emerald-400" },
                { label: "Attack (ATK)", value: hero.stats.atk, max: 100, bar: "bg-rose-500", text: "text-rose-400" },
                { label: "Defense (DEF)", value: hero.stats.def, max: 50, bar: "bg-blue-500", text: "text-blue-400" },
                { label: "Speed (SPD)", value: hero.stats.spd, max: 6, bar: "bg-cyan-400", text: "text-cyan-300" },
              ].map((st) => (
                <div key={st.label}>
                  <div className="flex justify-between text-[10px] text-neutral-300 mb-1">
                    <span>{st.label}</span>
                    <span className={`font-mono font-bold ${st.text}`}>{st.value}</span>
                  </div>
                  <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden">
                    <div className={`h-full ${st.bar} rounded-full`} style={{ width: `${Math.min(100, (st.value / st.max) * 100)}%` }} />
                  </div>
                </div>
              ))}
              <div className="flex justify-between text-[10px] text-neutral-300 pt-1">
                <span>Critical Rate</span>
                <span className="font-mono font-bold text-amber-300">{Math.round(hero.stats.critRate * 100)}%</span>
              </div>
            </div>

            <div className="rounded-2xl border border-purple-700/50 bg-purple-950/30 p-3.5 mb-4 flex items-start gap-3">
              <div className="text-2xl">{hero.skill.icon}</div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-purple-200">{hero.skill.name}</span>
                  <span className="text-[9px] bg-purple-900/70 border border-purple-600/60 text-purple-200 px-1.5 py-0.5 rounded-full font-mono">
                    CD {hero.skill.cooldown}s
                  </span>
                </div>
                <p className="text-[10px] text-purple-200/80 mt-1 leading-relaxed">{hero.skill.description}</p>
              </div>
            </div>

            {isUnlocked ? (
              <button
                onClick={handleSelect}
                disabled={isSelected}
                className={`btn-3d w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 ${
                  isSelected
                    ? "bg-emerald-950/60 border border-emerald-700/60 text-emerald-400"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                }`}
              >
                {isSelected ? (<><CheckCircle2 className="w-4 h-4" /> Currently Selected</>) : "Select This Class"}
              </button>
            ) : (
              <button
                onClick={handleUnlock}
                disabled={playerCoins < hero.unlockCost}
                className={`btn-3d w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 ${
                  playerCoins >= hero.unlockCost
                    ? "bg-amber-600 hover:bg-amber-500 text-white"
                    : "bg-neutral-800 text-neutral-500 border border-white/10"
                }`}
              >
                <Coins className="w-4 h-4" /> Unlock — {hero.unlockCost.toLocaleString()} Coins
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
