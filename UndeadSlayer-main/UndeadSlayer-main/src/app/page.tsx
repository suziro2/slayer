"use client";

import React, { useState, useEffect } from "react";
import AuthModal from "@/components/auth/AuthModal";
import CombatEngine from "@/components/game/CombatEngine";
import CharacterSelectModal from "@/components/game/CharacterSelectModal";
import ChapterMapModal from "@/components/game/ChapterMapModal";
import UpgradesModal from "@/components/game/UpgradesModal";
import InventoryModal from "@/components/game/InventoryModal";
import SettingsModal from "@/components/game/SettingsModal";
import LoadingScreen from "@/components/game/LoadingScreen";
import ArtImage from "@/components/game/ArtImage";
import { HEROES, HeroDef, CHAPTERS } from "@/lib/gameData";
import { sounds } from "@/lib/soundEffects";
import {
  Play,
  Swords,
  Users,
  Compass,
  Sparkles,
  Package,
  Settings,
  LogOut,
  Coins,
  Heart,
  Shield,
  Zap,
  ChevronRight,
  Trophy,
} from "lucide-react";

export default function GameRootPage() {
  const [authState, setAuthState] = useState<{
    loaded: boolean;
    authenticated: boolean;
    user: { id: number; username: string } | null;
  }>({
    loaded: false,
    authenticated: false,
    user: null,
  });

  // Keep the cinematic intro visible for at least 8 seconds.
  const [minimumLoadingComplete, setMinimumLoadingComplete] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMinimumLoadingComplete(true), 8000);
    return () => window.clearTimeout(timer);
  }, []);

  // Game Progress State
  const [progress, setProgress] = useState<any>(null);

  // Active Screen / Modals
  const [currentMode, setCurrentMode] = useState<"menu" | "combat">("menu");
  const [combatStage, setCombatStage] = useState<{ chapterId: number; levelNumber: number } | null>(null);

  // Modals
  const [showHeroesModal, setShowHeroesModal] = useState(false);
  const [showChaptersModal, setShowChaptersModal] = useState(false);
  const [showUpgradesModal, setShowUpgradesModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Load Session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.authenticated && data.user) {
          setAuthState({ loaded: true, authenticated: true, user: data.user });
          setProgress(data.progress);
        } else {
          setAuthState({ loaded: true, authenticated: false, user: null });
        }
      } catch (err) {
        setAuthState({ loaded: true, authenticated: false, user: null });
      }
    }
    checkSession();
  }, []);

  // Sync / Save progress to backend
  const saveProgressToDb = async (newProgress: any) => {
    setProgress(newProgress);
    try {
      await fetch("/api/game/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProgress),
      });
    } catch (err) {
      console.error("Failed to sync progress to server:", err);
    }
  };

  const handleAuthSuccess = (user: { id: number; username: string }, userProgress: any) => {
    setAuthState({ loaded: true, authenticated: true, user });
    setProgress(userProgress);
    setCurrentMode("menu");
  };

  const handleLogout = async () => {
    sounds.playClick();
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthState({ loaded: true, authenticated: false, user: null });
    setProgress(null);
    setCurrentMode("menu");
  };

  // Launch combat level
  const handleStartLevel = (chapterId: number, levelNumber: number) => {
    setShowChaptersModal(false);
    setCombatStage({ chapterId, levelNumber });
    setCurrentMode("combat");
  };

  // Quick continue
  const handleContinueAdventure = () => {
    sounds.playClick();
    const ch = progress?.highestChapterUnlocked || 1;
    const lvl = progress?.highestLevelUnlocked || 1;
    handleStartLevel(ch, lvl);
  };

  // After battle finishes
  const handleBattleEnd = async (result: {
    victory: boolean;
    rewardCoins: number;
    rewardXp: number;
    potionsUsed: number;
    bossDefeated?: boolean;
    dropItem?: any;
  }) => {
    if (!combatStage || !progress) {
      setCurrentMode("menu");
      return;
    }

    const stageKey = `${combatStage.chapterId}-${combatStage.levelNumber}`;
    const newCoins = progress.coins + result.rewardCoins;
    const newXp = progress.xp + result.rewardXp;
    const newPotions = Math.max(0, progress.healthPotions - result.potionsUsed);

    // Calculate player rank
    const newLevel = 1 + Math.floor(newXp / 500);

    const completed = new Set(progress.completedLevels || []);
    let newHighestChapter = progress.highestChapterUnlocked;
    let newHighestLevel = progress.highestLevelUnlocked;

    if (result.victory) {
      completed.add(stageKey);

      // Unlock next level or next chapter
      if (combatStage.levelNumber < 5) {
        if (combatStage.levelNumber + 1 > newHighestLevel) {
          newHighestLevel = combatStage.levelNumber + 1;
        }
      } else if (result.bossDefeated) {
        // Boss killed: unlock next chapter!
        if (combatStage.chapterId < 5) {
          newHighestChapter = Math.max(newHighestChapter, combatStage.chapterId + 1);
          newHighestLevel = 1;
        }
      }
    }

    // Handle Item Drops
    const updatedInventory = [...(progress.inventory || [])];
    if (result.dropItem) {
      const alreadyHas = updatedInventory.some((it: any) => it.itemId === result.dropItem.id);
      if (!alreadyHas) {
        updatedInventory.push({
          id: `item_${Date.now()}`,
          itemId: result.dropItem.id,
          name: result.dropItem.name,
          type: result.dropItem.type,
          rarity: result.dropItem.rarity,
          atkBonus: result.dropItem.atk,
          hpBonus: result.dropItem.hp,
          defBonus: result.dropItem.def,
          critBonus: result.dropItem.crit,
          equipped: false,
          description: `Trophy won from defeating Chapter ${combatStage.chapterId} Boss.`,
        });
      }
    }

    const updated = {
      ...progress,
      coins: newCoins,
      xp: newXp,
      level: newLevel,
      healthPotions: newPotions,
      completedLevels: Array.from(completed),
      highestChapterUnlocked: newHighestChapter,
      highestLevelUnlocked: newHighestLevel,
      inventory: updatedInventory,
    };

    await saveProgressToDb(updated);
    setCurrentMode("menu");
  };

  // Hero Selection & Unlock
  const handleSelectHero = async (heroId: string) => {
    const updated = { ...progress, selectedHeroId: heroId };
    await saveProgressToDb(updated);
  };

  const handleUnlockHero = async (heroId: string, cost: number) => {
    if (progress.coins >= cost) {
      const updatedUnlocked = [...progress.unlockedHeroes, heroId];
      const updated = {
        ...progress,
        coins: progress.coins - cost,
        unlockedHeroes: updatedUnlocked,
        selectedHeroId: heroId,
      };
      await saveProgressToDb(updated);
    }
  };

  // Stat Upgrades
  const handleUpgradeStat = async (
    statKey: "attackLevel" | "healthLevel" | "defenseLevel" | "skillLevel",
    cost: number
  ) => {
    if (progress.coins >= cost) {
      const updatedStats = {
        ...progress.statUpgrades,
        [statKey]: progress.statUpgrades[statKey] + 1,
      };
      const updated = {
        ...progress,
        coins: progress.coins - cost,
        statUpgrades: updatedStats,
      };
      await saveProgressToDb(updated);
    }
  };

  // Equip Item
  const handleEquipItem = async (itemId: string, type: string) => {
    const updatedInventory = (progress.inventory || []).map((item: any) => {
      if (item.type === type) {
        return { ...item, equipped: item.id === itemId ? !item.equipped : false };
      }
      return item;
    });

    const updated = { ...progress, inventory: updatedInventory };
    await saveProgressToDb(updated);
  };

  // Buy Potion
  const handleBuyPotion = async (cost: number) => {
    if (progress.coins >= cost) {
      const updated = {
        ...progress,
        coins: progress.coins - cost,
        healthPotions: progress.healthPotions + 1,
      };
      await saveProgressToDb(updated);
    }
  };

  // Settings update
  const handleUpdateSettings = async (newSettings: any) => {
    const updated = { ...progress, settings: newSettings };
    await saveProgressToDb(updated);
  };

  // Compute Equipped Item Bonus
  const getEquippedStats = () => {
    let atk = 0;
    let hp = 0;
    let def = 0;
    let crit = 0;
    (progress?.inventory || []).forEach((item: any) => {
      if (item.equipped) {
        atk += item.atkBonus || 0;
        hp += item.hpBonus || 0;
        def += item.defBonus || 0;
        crit += item.critBonus || 0;
      }
    });
    return { atk, hp, def, crit };
  };

  // Keep the cinematic loading screen up until both the session check and
  // the minimum 8-second intro have finished.
  if (!authState.loaded || !minimumLoadingComplete) {
    return <LoadingScreen />;
  }

  // Not authenticated: Show Login & Register Screen
  if (!authState.authenticated || !progress) {
    return <AuthModal onSuccess={handleAuthSuccess} />;
  }

  // In-game combat mode
  if (currentMode === "combat" && combatStage) {
    return (
      <CombatEngine
        heroId={progress.selectedHeroId || "aiden"}
        chapterId={combatStage.chapterId}
        levelNumber={combatStage.levelNumber}
        statUpgrades={progress.statUpgrades}
        equippedStats={getEquippedStats()}
        healthPotions={progress.healthPotions}
        settings={progress.settings}
        onBattleEnd={handleBattleEnd}
        onExit={() => setCurrentMode("menu")}
      />
    );
  }

  // Active Hero Definition
  const activeHero: HeroDef = HEROES[progress.selectedHeroId] || HEROES.aiden;
  const currentChapter = CHAPTERS.find((c) => c.id === progress.highestChapterUnlocked) || CHAPTERS[0];

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-white font-sans relative overflow-x-hidden flex flex-col">
      {/* Ambient fantasy background */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.10),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(124,58,237,0.12),transparent_55%)]" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main RPG Navigation Bar */}
      <header className="relative z-20 border-b border-white/10 bg-neutral-950/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 to-rose-600 flex items-center justify-center text-xl shadow-lg border border-amber-400/40">
            ⚔️
          </div>
          <div>
            <div className="text-base sm:text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-300 to-purple-400 uppercase">
              UNDEAD SLAYER
            </div>
            <div className="text-[10px] text-neutral-400 font-semibold tracking-wider uppercase">
              Action RPG Chronicles · 10 Classes · 5 Chapters
            </div>
          </div>
        </div>

        {/* Currency & Player Summary Bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-red-400 text-xs font-bold font-mono">
            <Heart className="w-4 h-4 fill-current" />
            <span>x{progress.healthPotions}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-amber-400 text-xs font-bold font-mono">
            <Coins className="w-4 h-4" />
            <span>{progress.coins.toLocaleString()}</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-semibold">
            <span className="text-neutral-300">{authState.user?.username}</span>
            <span className="bg-amber-950 text-amber-400 border border-amber-800 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">
              Lv.{progress.level}
            </span>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              setShowSettingsModal(true);
            }}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-neutral-300 hover:text-white transition"
            title="Settings & Profile"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Sanctuary Dashboard */}
      <main className="flex-1 relative z-10 max-w-7xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-between gap-8">
        {/* Top Hero & Campaign Status Spotlight */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Active Champion Spotlight Card */}
          <div
            className="lg:col-span-7 rounded-3xl border p-5 sm:p-7 relative overflow-hidden shadow-2xl flex flex-col sm:flex-row items-center gap-6"
            style={{
              borderColor: `${activeHero.accentColor}55`,
              background: `linear-gradient(135deg, ${activeHero.color}22 0%, rgba(10,10,15,0.95) 70%)`,
            }}
          >
            {/* Vanguard Avatar Display */}
            <div className="relative group shrink-0">
              <div
                className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden border-2 shadow-2xl transition-transform duration-300 group-hover:scale-105"
                style={{ borderColor: activeHero.accentColor, backgroundColor: activeHero.color, boxShadow: `0 24px 60px -24px ${activeHero.color}` }}
              >
                <ArtImage src={activeHero.image} alt={activeHero.name} fallbackText={activeHero.classIcon} className="w-full h-full object-cover object-top" />
              </div>
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-neutral-950 border border-amber-500/60 text-amber-400 text-[9px] font-bold uppercase whitespace-nowrap shadow">
                Vanguard
              </div>
            </div>

            {/* Vanguard Details */}
            <div className="flex-1 text-center sm:text-left w-full">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                <span className="text-2xl sm:text-3xl font-black text-white">{activeHero.name}</span>
                <span
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide"
                  style={{ backgroundColor: `${activeHero.color}25`, color: activeHero.accentColor, borderColor: activeHero.accentColor }}
                >
                  {activeHero.classIcon} {activeHero.classType}
                </span>
              </div>

              <div className="text-[11px] text-amber-300 font-semibold mb-1">{activeHero.title}</div>
              <div className="text-[11px] text-neutral-400 mb-3 leading-relaxed">{activeHero.lore}</div>

              {/* Combat Stats Badges */}
              <div className="grid grid-cols-3 gap-2.5 max-w-sm mb-4">
                {[
                  { label: "Health", value: Math.round(activeHero.stats.hp * (1 + (progress.statUpgrades.healthLevel - 1) * 0.18)), suffix: "HP", color: "text-emerald-400" },
                  { label: "Attack", value: Math.round(activeHero.stats.atk * (1 + (progress.statUpgrades.attackLevel - 1) * 0.15)), suffix: "ATK", color: "text-rose-400" },
                  { label: "Defense", value: Math.round(activeHero.stats.def * (1 + (progress.statUpgrades.defenseLevel - 1) * 0.12)), suffix: "DEF", color: "text-blue-400" },
                ].map((st) => (
                  <div key={st.label} className="bg-black/40 border border-white/10 rounded-xl p-2 text-center">
                    <div className="text-[10px] text-neutral-400 uppercase font-semibold">{st.label}</div>
                    <div className={`text-xs font-mono font-bold ${st.color}`}>{st.value} {st.suffix}</div>
                  </div>
                ))}
              </div>

              {/* Special Skill Banner */}
              <div className="flex items-center gap-2.5 bg-purple-950/30 border border-purple-700/40 px-3 py-2 rounded-xl text-xs">
                <span className="text-lg">{activeHero.skill.icon}</span>
                <span className="font-bold text-purple-200">{activeHero.skill.name}:</span>
                <span className="text-neutral-400 truncate max-w-xs">{activeHero.skill.description}</span>
              </div>
            </div>
          </div>

          {/* Current Campaign Progress Banner */}
          <div className="lg:col-span-5 bg-white/[0.04] border border-white/10 rounded-3xl p-5 sm:p-7 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Compass className="w-4 h-4" /> Current Expedition
                </span>
                <span className="text-xs font-mono text-neutral-400">
                  {progress.completedLevels?.length || 0} / 25 Stages Cleared
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">{currentChapter.title}: {currentChapter.subtitle}</h3>
              <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">{currentChapter.description}</p>

              {/* Chapter boss preview */}
              <div className="mt-3.5 flex items-center gap-3 rounded-2xl border border-red-800/50 bg-red-950/25 p-2.5">
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-red-700/60 bg-black/40 shrink-0 shadow-lg">
                  <ArtImage src={currentChapter.boss.image} alt={currentChapter.boss.name} fallbackText="☠" className="w-full h-full object-cover object-top" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-red-400 uppercase font-bold tracking-wide">Chapter Boss</div>
                  <div className="text-xs text-white font-bold truncate">{currentChapter.boss.name}</div>
                  <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                    HP {currentChapter.boss.hp.toLocaleString()} · ATK {currentChapter.boss.atk}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-5 space-y-2.5 relative">
              <button
                onClick={handleContinueAdventure}
                className="btn-3d w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" /> Continue Adventure
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  setShowChaptersModal(true);
                }}
                className="btn-3d w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-200 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition"
              >
                <Compass className="w-4 h-4" /> Explore World Map · 5 Chapters
              </button>
            </div>
          </div>
        </div>

        {/* Action RPG Command Menu Hub */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" /> Sanctuary Pavilions
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[
              {
                key: "heroes",
                icon: Users,
                tint: "text-blue-300",
                bg: "#101c33",
                border: "#2f5fbf",
                title: "Class Select",
                sub: `${progress.unlockedHeroes?.length || 1} / 10 Recruited`,
                onClick: () => setShowHeroesModal(true),
              },
              {
                key: "chapters",
                icon: Swords,
                tint: "text-red-300",
                bg: "#2a0f0f",
                border: "#b91c1c",
                title: "World Map",
                sub: "5 Chapters · 25 Stages · 5 Bosses",
                onClick: () => setShowChaptersModal(true),
              },
              {
                key: "upgrades",
                icon: Zap,
                tint: "text-amber-300",
                bg: "#2b2107",
                border: "#ca8a04",
                title: "Stat Training",
                sub: "ATK · HP · DEF · SKILL",
                onClick: () => setShowUpgradesModal(true),
              },
              {
                key: "inventory",
                icon: Package,
                tint: "text-cyan-300",
                bg: "#082430",
                border: "#0e7490",
                title: "Armory",
                sub: `${progress.inventory?.length || 0} Items · Potions`,
                onClick: () => setShowInventoryModal(true),
              },
            ].map((tile) => {
              const Icon = tile.icon;
              return (
                <button
                  key={tile.key}
                  onClick={() => {
                    sounds.playClick();
                    tile.onClick();
                  }}
                  className="btn-3d p-4 sm:p-5 rounded-2xl text-left flex flex-col gap-3 bg-white/[0.04] border border-white/10 hover:border-amber-500/70 hover:bg-white/[0.07] transition group"
                >
                  <div
                    className="w-12 h-12 rounded-xl border flex items-center justify-center shadow-inner transition-transform group-hover:scale-110"
                    style={{ backgroundColor: tile.bg, borderColor: tile.border }}
                  >
                    <Icon className={`w-6 h-6 ${tile.tint}`} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">{tile.title}</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">{tile.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Modals */}
      {showHeroesModal && (
        <CharacterSelectModal
          selectedHeroId={progress.selectedHeroId || "aiden"}
          unlockedHeroes={progress.unlockedHeroes || ["aiden"]}
          heroLevels={progress.heroLevels || {}}
          playerCoins={progress.coins || 0}
          onSelectHero={handleSelectHero}
          onUnlockHero={handleUnlockHero}
          onClose={() => setShowHeroesModal(false)}
        />
      )}

      {showChaptersModal && (
        <ChapterMapModal
          highestChapterUnlocked={progress.highestChapterUnlocked || 1}
          highestLevelUnlocked={progress.highestLevelUnlocked || 1}
          completedLevels={progress.completedLevels || []}
          onStartLevel={handleStartLevel}
          onClose={() => setShowChaptersModal(false)}
        />
      )}

      {showUpgradesModal && (
        <UpgradesModal
          coins={progress.coins || 0}
          statUpgrades={progress.statUpgrades}
          onUpgradeStat={handleUpgradeStat}
          onClose={() => setShowUpgradesModal(false)}
        />
      )}

      {showInventoryModal && (
        <InventoryModal
          inventory={progress.inventory || []}
          coins={progress.coins || 0}
          healthPotions={progress.healthPotions || 0}
          onEquipItem={handleEquipItem}
          onBuyPotion={handleBuyPotion}
          onClose={() => setShowInventoryModal(false)}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          settings={progress.settings}
          username={authState.user?.username || "Slayer"}
          level={progress.level}
          xp={progress.xp}
          coins={progress.coins}
          unlockedCount={progress.unlockedHeroes?.length || 1}
          completedCount={progress.completedLevels?.length || 0}
          onUpdateSettings={handleUpdateSettings}
          onLogout={handleLogout}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  );
}
