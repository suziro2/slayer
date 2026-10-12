"use client";

import React from "react";
import { sounds } from "@/lib/soundEffects";
import { Volume2, Sliders, Shield, Award, User, LogOut } from "lucide-react";

interface SettingsModalProps {
  settings: {
    musicVolume: number;
    sfxVolume: number;
    autoTarget: boolean;
    screenShake: boolean;
    damageNumbers: boolean;
  };
  username: string;
  level: number;
  xp: number;
  coins: number;
  unlockedCount: number;
  completedCount: number;
  onUpdateSettings: (newSettings: any) => void;
  onLogout: () => void;
  onClose: () => void;
}

export default function SettingsModal({
  settings,
  username,
  level,
  xp,
  coins,
  unlockedCount,
  completedCount,
  onUpdateSettings,
  onLogout,
  onClose,
}: SettingsModalProps) {
  const handleToggle = (key: string) => {
    sounds.playClick();
    const updated = { ...settings, [key]: !(settings as any)[key] };
    onUpdateSettings(updated);
  };

  const handleVolume = (key: "sfxVolume" | "musicVolume", val: number) => {
    const updated = { ...settings, [key]: val };
    sounds.setVolumes(updated.sfxVolume, updated.musicVolume);
    onUpdateSettings(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div>
            <h2 className="text-xl font-black text-white tracking-wide uppercase flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-400" /> Settings & Slayer Profile
            </h2>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 text-sm font-semibold transition"
          >
            ✕ Close
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Profile Card */}
          <div className="p-4 rounded-2xl bg-neutral-950/50 border border-neutral-800 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-2xl font-bold">
              <User className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-white uppercase">{username}</span>
                <span className="text-xs bg-amber-950/60 text-amber-400 border border-amber-800 px-2 py-0.5 rounded-lg font-bold font-mono">
                  Rank Lv.{level}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-neutral-400">
                <div>XP Earned: <span className="text-cyan-400 font-mono font-bold">{xp.toLocaleString()}</span></div>
                <div>Coins: <span className="text-amber-400 font-mono font-bold">{coins.toLocaleString()}</span></div>
                <div>Heroes Unlocked: <span className="text-white font-bold">{unlockedCount} / 10</span></div>
                <div>Stages Conquered: <span className="text-white font-bold">{completedCount}</span></div>
              </div>
            </div>
          </div>

          {/* Sound & Music Adjustments */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Audio & Sound FX</h3>
            <div>
              <div className="flex justify-between text-xs text-neutral-300 font-semibold mb-1">
                <span>Sound FX Volume</span>
                <span className="font-mono text-amber-400">{settings.sfxVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.sfxVolume}
                onChange={(e) => handleVolume("sfxVolume", Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-neutral-300 font-semibold mb-1">
                <span>BGM Theme Volume</span>
                <span className="font-mono text-amber-400">{settings.musicVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.musicVolume}
                onChange={(e) => handleVolume("musicVolume", Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Combat Settings */}
          <div className="space-y-3 pt-2 border-t border-neutral-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Combat Engine Options</h3>

            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/40 border border-neutral-800">
              <div>
                <div className="text-sm font-semibold text-white">Smart Auto-Targeting</div>
                <div className="text-xs text-neutral-400">Auto lock-on nearby enemies when attacking</div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoTarget}
                onChange={() => handleToggle("autoTarget")}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/40 border border-neutral-800">
              <div>
                <div className="text-sm font-semibold text-white">Dynamic Screen Shake</div>
                <div className="text-xs text-neutral-400">Impact shake on heavy hits and critical strikes</div>
              </div>
              <input
                type="checkbox"
                checked={settings.screenShake}
                onChange={() => handleToggle("screenShake")}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/40 border border-neutral-800">
              <div>
                <div className="text-sm font-semibold text-white">Damage Indicators</div>
                <div className="text-xs text-neutral-400">Show floating damage numbers and critical popups</div>
              </div>
              <input
                type="checkbox"
                checked={settings.damageNumbers}
                onChange={() => handleToggle("damageNumbers")}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Logout Action */}
          <div className="pt-2">
            <button
              onClick={() => {
                sounds.playClick();
                onLogout();
              }}
              className="w-full py-3 rounded-2xl bg-red-950/40 border border-red-800/80 text-red-400 hover:bg-red-900/40 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition"
            >
              <LogOut className="w-4 h-4" /> Save Progress & Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
