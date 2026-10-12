"use client";

import React, { useState } from "react";
import { CHAPTERS, ENEMY_TYPES } from "@/lib/gameData";
import ArtImage from "@/components/game/ArtImage";
import { sounds } from "@/lib/soundEffects";
import { Lock, Skull, CheckCircle2, Play, Swords, Crown, Ghost, MapPin } from "lucide-react";

interface ChapterMapModalProps {
  highestChapterUnlocked: number;
  highestLevelUnlocked: number;
  completedLevels: string[];
  onStartLevel: (chapterId: number, levelNumber: number) => void;
  onClose: () => void;
}

export default function ChapterMapModal({
  highestChapterUnlocked, highestLevelUnlocked, completedLevels, onStartLevel, onClose,
}: ChapterMapModalProps) {
  const [activeChapterId, setActiveChapterId] = useState<number>(Math.min(highestChapterUnlocked, 5));
  const chapter = CHAPTERS.find((c) => c.id === activeChapterId) || CHAPTERS[0];
  const uniqueEnemies = Array.from(new Set(chapter.levels.flatMap((l) => l.enemyTypes)));

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="panel rounded-3xl w-full max-w-6xl max-h-[93vh] flex flex-col overflow-hidden border-white/10">
        {/* header */}
        <div className="px-5 py-4 border-b border-white/10 bg-black/30 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wide flex items-center gap-2">
              <Swords className="w-5 h-5 text-red-400" /> World Map — 5 Chapters · 25 Stages
            </h2>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Clear 4 monster waves, defeat Elite champions, then challenge the Chapter Boss.
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold transition shrink-0"
          >
            ✕ Close
          </button>
        </div>

        {/* chapter tabs */}
        <div className="flex gap-2 overflow-x-auto p-2.5 bg-black/20 border-b border-white/10">
          {CHAPTERS.map((ch) => {
            const unlocked = ch.id <= highestChapterUnlocked;
            const active = ch.id === activeChapterId;
            return (
              <button
                key={ch.id}
                disabled={!unlocked}
                onClick={() => { sounds.playClick(); setActiveChapterId(ch.id); }}
                className={`shrink-0 px-3.5 py-2 rounded-xl text-[11px] font-bold transition border ${
                  active
                    ? "bg-amber-600/90 border-amber-400 text-white shadow-lg"
                    : unlocked
                    ? "bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10"
                    : "bg-black/40 border-white/5 text-neutral-600 cursor-not-allowed"
                }`}
              >
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  {!unlocked && <Lock className="w-3 h-3" />}
                  {ch.title} · {ch.subtitle}
                </span>
              </button>
            );
          })}
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
            {/* region card */}
            <div
              className={`lg:col-span-7 rounded-3xl p-5 border border-white/10 bg-gradient-to-br ${chapter.bgGradient} relative overflow-hidden`}
            >
              <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full blur-3xl opacity-25" style={{ backgroundColor: chapter.themeColor }} />
              <div className="relative">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Region {chapter.id} — {chapter.environmentName}
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-1">{chapter.subtitle}</h3>
                <p className="text-[11px] text-neutral-300 mt-1.5 leading-relaxed max-w-xl">{chapter.description}</p>

                <div className="mt-4">
                  <div className="text-[10px] text-amber-200 uppercase font-bold mb-2">Enemy Bestiary</div>
                  <div className="flex flex-wrap gap-2">
                    {uniqueEnemies.map((key) => {
                      const e = ENEMY_TYPES[key];
                      if (!e) return null;
                      return (
                        <div key={key} className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-xl px-2 py-1.5 backdrop-blur-sm">
                          <ArtImage src={e.image} alt={e.name} fallbackText="☠" className="w-9 h-9 rounded-lg border border-white/10 object-cover" />
                          <div>
                            <div className="text-[10px] text-white font-semibold leading-none">{e.name}</div>
                            <div className="text-[9px] text-neutral-400 font-mono leading-none mt-1">
                              HP {e.baseHp} · ATK {e.baseAtk}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* boss card */}
            <div className="lg:col-span-5 rounded-3xl border border-red-700/50 bg-gradient-to-br from-red-950/60 to-black/60 p-5 flex flex-col">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-red-300">
                <Crown className="w-4 h-4 text-amber-400" /> Chapter Boss
              </div>
              <div className="flex items-center gap-3.5 mt-3">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-red-600/60 bg-black/50 shrink-0 shadow-[0_16px_40px_-16px_rgba(239,68,68,0.8)]">
                  <ArtImage src={chapter.boss.image} alt={chapter.boss.name} fallbackText="☠" className="w-full h-full object-cover object-top" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-black text-white uppercase leading-tight">{chapter.boss.name}</div>
                  <div className="text-[11px] text-red-300 mt-0.5">{chapter.boss.title}</div>
                  <div className="text-[10px] text-neutral-400 font-mono mt-1.5">
                    HP {chapter.boss.hp.toLocaleString()} · ATK {chapter.boss.atk} · DEF {chapter.boss.def}
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-neutral-300 mt-3 leading-relaxed">{chapter.boss.description}</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {chapter.boss.abilities.map((a) => (
                  <span key={a} className="text-[9px] bg-red-950/70 border border-red-700/60 text-red-200 px-2 py-0.5 rounded-full">
                    {a}
                  </span>
                ))}
              </div>
              <div className="mt-auto pt-3.5 text-[10px] text-amber-300 border-t border-red-900/50">
                First-clear bounty: <span className="font-bold">{chapter.completionReward.item.name}</span>{" "}
                ({chapter.completionReward.item.rarity.toUpperCase()}) + {chapter.completionReward.coins.toLocaleString()} coins
              </div>
            </div>
          </div>

          {/* stages */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2.5 flex items-center gap-1.5">
              <Ghost className="w-4 h-4" /> Stages — 5 per chapter
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {chapter.levels.map((lvl) => {
                const key = `${chapter.id}-${lvl.levelNumber}`;
                const cleared = completedLevels.includes(key);
                const prevKey = `${chapter.id}-${lvl.levelNumber - 1}`;
                const unlocked =
                  lvl.levelNumber === 1
                    ? chapter.id <= highestChapterUnlocked
                    : completedLevels.includes(prevKey) || (chapter.id <= highestChapterUnlocked && lvl.levelNumber <= highestLevelUnlocked);

                return (
                  <div
                    key={lvl.levelNumber}
                    className={`rounded-2xl border p-3.5 flex flex-col justify-between transition ${
                      lvl.isBossLevel
                        ? "bg-red-950/25 border-red-800/60 hover:border-red-500"
                        : "bg-white/[0.04] border-white/10 hover:border-white/25"
                    } ${!unlocked ? "opacity-60" : ""}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase">
                          {lvl.isBossLevel ? "Boss Stage" : `Stage ${lvl.levelNumber}`}
                        </span>
                        {cleared ? (
                          <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Clear
                          </span>
                        ) : !unlocked ? (
                          <Lock className="w-3 h-3 text-neutral-500" />
                        ) : (
                          <span className="text-[9px] text-amber-400 font-bold">Open</span>
                        )}
                      </div>
                      <div className="text-[12px] font-bold text-white leading-tight">{lvl.title}</div>
                      <div className="text-[10px] text-neutral-400 mt-1">
                        {lvl.waveCount} waves · {lvl.isBossLevel ? "Boss duel" : "Packs + Elite"}
                      </div>
                      <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] font-mono">
                        <span className="text-amber-300">+{lvl.rewardCoins}c</span>
                        <span className="text-cyan-300">+{lvl.rewardXp}xp</span>
                      </div>
                    </div>
                    <button
                      disabled={!unlocked}
                      onClick={() => { sounds.playClick(); onStartLevel(chapter.id, lvl.levelNumber); }}
                      className={`btn-3d mt-3 w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                        !unlocked
                          ? "bg-neutral-800 text-neutral-500"
                          : lvl.isBossLevel
                          ? "bg-red-600 hover:bg-red-500 text-white"
                          : "bg-amber-600 hover:bg-amber-500 text-white"
                      }`}
                    >
                      <Play className="w-3 h-3 fill-current" /> {cleared ? "Replay" : "Deploy"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* legend */}
          <div className="rounded-2xl border border-white/10 bg-black/30 p-3.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] text-neutral-400">
            <span className="flex items-center gap-1.5"><Skull className="w-3.5 h-3.5 text-red-400" /> Boss stage holds the chapter sovereign</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" /> Elite champions appear from wave 2</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Terrain blocks movement — use the map (M)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
