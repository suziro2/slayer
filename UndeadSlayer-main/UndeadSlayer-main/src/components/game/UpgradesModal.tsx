"use client";

import React from "react";
import { sounds } from "@/lib/soundEffects";
import { Sword, Shield, Heart, Zap, Coins, Sparkles, ChevronUp } from "lucide-react";

interface UpgradesModalProps {
  coins: number;
  statUpgrades: { attackLevel: number; healthLevel: number; defenseLevel: number; skillLevel: number };
  onUpgradeStat: (statKey: "attackLevel" | "healthLevel" | "defenseLevel" | "skillLevel", cost: number) => void;
  onClose: () => void;
}

export default function UpgradesModal({
  coins,
  statUpgrades,
  onUpgradeStat,
  onClose,
}: UpgradesModalProps) {
  const getCost = (level: number) => Math.round(150 * Math.pow(1.35, level - 1));

  const statsList = [
    {
      key: "attackLevel" as const,
      name: "Attack Power (ATK)",
      level: statUpgrades.attackLevel,
      bonus: `+${(statUpgrades.attackLevel - 1) * 15}% Base Strike Damage`,
      nextBonus: `+${statUpgrades.attackLevel * 15}% Base Strike Damage`,
      icon: Sword,
      color: "text-rose-400",
      bgColor: "bg-rose-950/40",
      borderColor: "border-rose-800/60",
      cost: getCost(statUpgrades.attackLevel),
    },
    {
      key: "healthLevel" as const,
      name: "Vitality Reserve (HP)",
      level: statUpgrades.healthLevel,
      bonus: `+${(statUpgrades.healthLevel - 1) * 18}% Max Health Points`,
      nextBonus: `+${statUpgrades.healthLevel * 18}% Max Health Points`,
      icon: Heart,
      color: "text-emerald-400",
      bgColor: "bg-emerald-950/40",
      borderColor: "border-emerald-800/60",
      cost: getCost(statUpgrades.healthLevel),
    },
    {
      key: "defenseLevel" as const,
      name: "Iron Resistance (DEF)",
      level: statUpgrades.defenseLevel,
      bonus: `+${(statUpgrades.defenseLevel - 1) * 12}% Incoming Damage Mitigation`,
      nextBonus: `+${statUpgrades.defenseLevel * 12}% Incoming Damage Mitigation`,
      icon: Shield,
      color: "text-blue-400",
      bgColor: "bg-blue-950/40",
      borderColor: "border-blue-800/60",
      cost: getCost(statUpgrades.defenseLevel),
    },
    {
      key: "skillLevel" as const,
      name: "Skill Cataclysm (AMP)",
      level: statUpgrades.skillLevel,
      bonus: `+${(statUpgrades.skillLevel - 1) * 20}% Special Ability Multiplier`,
      nextBonus: `+${statUpgrades.skillLevel * 20}% Special Ability Multiplier`,
      icon: Zap,
      color: "text-purple-400",
      bgColor: "bg-purple-950/40",
      borderColor: "border-purple-800/60",
      cost: getCost(statUpgrades.skillLevel),
    },
  ];

  const handleUpgrade = (statKey: "attackLevel" | "healthLevel" | "defenseLevel" | "skillLevel", cost: number) => {
    if (coins >= cost) {
      sounds.playCoin();
      onUpgradeStat(statKey, cost);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-400" /> Mastery Training Sanctuary
            </h2>
            <p className="text-xs text-neutral-400">
              Permanently strengthen all 10 heroes across every campaign expedition.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-neutral-800/80 px-3 py-1.5 rounded-xl border border-neutral-700 text-amber-400 font-bold text-sm font-mono">
              <Coins className="w-4 h-4" /> {coins.toLocaleString()}
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 text-sm font-semibold transition"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Upgrades List */}
        <div className="p-6 space-y-3.5 overflow-y-auto max-h-[75vh]">
          {statsList.map((stat) => {
            const Icon = stat.icon;
            const canAfford = coins >= stat.cost;

            return (
              <div
                key={stat.key}
                className={`p-4 rounded-2xl border ${stat.borderColor} ${stat.bgColor} flex items-center justify-between gap-4 transition`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`p-3 rounded-2xl bg-black/40 border border-neutral-700 ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">{stat.name}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-amber-400">
                        Rank {stat.level}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-300 mt-0.5">{stat.bonus}</div>
                    <div className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
                      Next Rank: <span className="text-neutral-400">{stat.nextBonus}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => handleUpgrade(stat.key, stat.cost)}
                    disabled={!canAfford}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition shadow-lg ${
                      canAfford
                        ? "bg-amber-600 hover:bg-amber-500 text-white active:scale-95"
                        : "bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed"
                    }`}
                  >
                    <ChevronUp className="w-4 h-4" />
                    <span>{stat.cost.toLocaleString()} Coins</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
