"use client";

import React, { useState } from "react";
import { sounds } from "@/lib/soundEffects";
import { Eye, EyeOff, ShieldAlert, Sparkles, LogIn, UserPlus } from "lucide-react";

interface AuthModalProps {
  onSuccess: (user: { id: number; username: string }, progress: any) => void;
}

export default function AuthModal({ onSuccess }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    sounds.playClick();

    if (!username.trim()) {
      setError("Please enter a username.");
      return;
    }
    if (password.length < 5) {
      setError("Password must be at least 5 characters long.");
      return;
    }
    if (isRegister && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error("Server returned an invalid response.");
      }

      if (!res.ok) {
        setError(data.error || "Authentication failed. Please check credentials.");
        setLoading(false);
        return;
      }

      try {
        sounds.playVictory();
      } catch (e) {
        // audio context resume error or user gesture constraint
      }
      onSuccess(data.user, data.progress);
    } catch (err: any) {
      setError("Network error connecting to game server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-neutral-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Visual Effects */}
      <div className="absolute inset-0 bg-radial-gradient from-amber-950/20 via-neutral-950 to-neutral-950 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Auth Card */}
      <div className="w-full max-w-md bg-neutral-900/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 backdrop-blur-xl">
        {/* Game Title & Lore Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl mb-3 shadow-inner">
            <span className="text-4xl">⚔️</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-400 to-purple-400 uppercase tracking-wider">
            UNDEAD SLAYER: CHRONICLES
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            2D Action RPG • 10 Hero Classes • 5 Chapters • 25 Stages
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-black/40 p-1 rounded-2xl border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setIsRegister(false);
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-1.5 ${
              !isRegister ? "bg-amber-600 text-white shadow" : "text-neutral-400 hover:text-white"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setIsRegister(true);
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-1.5 ${
              isRegister ? "bg-amber-600 text-white shadow" : "text-neutral-400 hover:text-white"
            }`}

          >
            <UserPlus className="w-3.5 h-3.5" /> Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Slayer Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. shadowblade"
              className="w-full px-4 py-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Secret Passphrase
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 5 characters"
                className="w-full px-4 py-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Confirm Passphrase
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-4 py-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-black text-sm uppercase tracking-wider shadow-xl transition-all duration-150 active:scale-[0.98] mt-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Connecting to Realm...
              </span>
            ) : isRegister ? (
              "Forge Account & Enter Realm"
            ) : (
              "Sign In & Resume Quest"
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-neutral-800/80 text-center">
          <p className="text-[11px] text-neutral-400">
            Account requires only a <span className="text-amber-400 font-semibold">Username</span>, <span className="text-amber-400 font-semibold">Password</span>, and <span className="text-amber-400 font-semibold">Confirm Password</span>. No email or Gmail needed.
          </p>
        </div>
      </div>
    </div>
  );
}
