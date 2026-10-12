"use client";

import React, { useState } from "react";
import { sounds } from "@/lib/soundEffects";
import { Shield, Sword, Heart, Sparkles, Coins, Package, Check, Plus } from "lucide-react";

interface InventoryItem {
  id: string;
  itemId: string;
  name: string;
  type: "weapon" | "armor" | "accessory" | "material";
  rarity: "common" | "rare" | "epic" | "legendary";
  atkBonus: number;
  hpBonus: number;
  defBonus: number;
  critBonus: number;
  equipped: boolean;
  description: string;
}

interface InventoryModalProps {
  inventory: InventoryItem[];
  coins: number;
  healthPotions: number;
  onEquipItem: (itemId: string, type: string) => void;
  onBuyPotion: (cost: number) => void;
  onClose: () => void;
}

export default function InventoryModal({
  inventory,
  coins,
  healthPotions,
  onEquipItem,
  onBuyPotion,
  onClose,
}: InventoryModalProps) {
  const [activeTab, setActiveTab] = useState<"all" | "weapon" | "armor" | "accessory">("all");

  const filteredItems = inventory.filter((item) => {
    if (activeTab === "all") return true;
    return item.type === activeTab;
  });

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "bg-amber-950/80 text-amber-300 border-amber-600";
      case "epic":
        return "bg-purple-950/80 text-purple-300 border-purple-600";
      case "rare":
        return "bg-cyan-950/80 text-cyan-300 border-cyan-600";
      default:
        return "bg-neutral-800 text-neutral-300 border-neutral-700";
    }
  };

  const handleBuyPotion = () => {
    const cost = 60;
    if (coins >= cost) {
      sounds.playPotion();
      onBuyPotion(cost);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase flex items-center gap-2">
              <Package className="w-6 h-6 text-cyan-400" /> Armory & Inventory
            </h2>
            <p className="text-xs text-neutral-400">
              Equip rare blades, defensive armor, and talisman accessories forged from boss drops.
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

        {/* Potion Supply Banner & Categories */}
        <div className="p-4 sm:p-6 bg-neutral-950/40 border-b border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Health Potion Stock */}
          <div className="flex items-center gap-3 bg-red-950/40 border border-red-800/60 p-3 rounded-2xl w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-red-900/60 border border-red-700 flex items-center justify-center text-red-400">
              <Heart className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="text-xs text-red-300 font-bold">Elixirs of Life (Potions)</div>
              <div className="text-sm font-mono font-extrabold text-white">
                {healthPotions} In Satchel <span className="text-xs text-neutral-400">(Restores 55% HP)</span>
              </div>
            </div>
            <button
              onClick={handleBuyPotion}
              disabled={coins < 60}
              className={`ml-auto px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition flex items-center gap-1 shadow ${
                coins >= 60
                  ? "bg-red-600 hover:bg-red-500 text-white"
                  : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
              }`}
            >
              <Plus className="w-3.5 h-3.5" /> Buy (60 C)
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-neutral-900 p-1 rounded-2xl border border-neutral-800">
            {(["all", "weapon", "armor", "accessory"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  sounds.playClick();
                  setActiveTab(tab);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition ${
                  activeTab === tab
                    ? "bg-neutral-700 text-white shadow"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Item Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredItems.length === 0 ? (
            <div className="col-span-full py-12 text-center text-neutral-500">
              No items in this category yet. Clear chapters and defeat bosses to uncover equipment drops!
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                  item.equipped
                    ? "bg-neutral-800/80 border-amber-500/80 ring-1 ring-amber-500/50 shadow-md"
                    : "bg-neutral-900/60 border-neutral-800 hover:bg-neutral-800/40"
                }`}
              >
                <div>
                  {/* Top rarity & type */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getRarityBadge(
                        item.rarity
                      )}`}
                    >
                      {item.rarity}
                    </span>
                    <span className="text-[11px] text-neutral-400 capitalize">{item.type}</span>
                  </div>

                  <h4 className="font-bold text-white text-sm">{item.name}</h4>
                  <p className="text-xs text-neutral-400 mt-1">{item.description}</p>

                  {/* Stat modifiers */}
                  <div className="mt-3 space-y-1 bg-black/40 p-2.5 rounded-xl border border-neutral-800 text-xs font-mono">
                    {item.atkBonus > 0 && (
                      <div className="text-rose-400 flex items-center gap-1">
                        <Sword className="w-3.5 h-3.5" /> +{item.atkBonus} Attack Power
                      </div>
                    )}
                    {item.hpBonus > 0 && (
                      <div className="text-emerald-400 flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5" /> +{item.hpBonus} Max HP
                      </div>
                    )}
                    {item.defBonus > 0 && (
                      <div className="text-blue-400 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" /> +{item.defBonus} Armor DEF
                      </div>
                    )}
                    {item.critBonus > 0 && (
                      <div className="text-amber-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> +{Math.round(item.critBonus * 100)}% Crit Rate
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => {
                      sounds.playClick();
                      onEquipItem(item.id, item.type);
                    }}
                    className={`w-full py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
                      item.equipped
                        ? "bg-emerald-950/80 border border-emerald-600 text-emerald-400"
                        : "bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700"
                    }`}
                  >
                    {item.equipped ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Equipped
                      </>
                    ) : (
                      "Equip Item"
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
