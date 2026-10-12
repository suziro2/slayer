"use client";

import React from "react";
import { HEROES } from "@/lib/gameData";
import ArtImage from "@/components/game/ArtImage";

const featuredHeroes = [HEROES.aiden, HEROES.luna, HEROES.riven];

export default function LoadingScreen() {
  return (
    <main className="realm-loader" role="status" aria-live="polite" aria-label="Loading Undead Slayer">
      <div className="realm-loader__stars" aria-hidden="true">
        {Array.from({ length: 26 }, (_, i) => (
          <span key={i} style={{
            left: `${(i * 37 + 7) % 100}%`,
            top: `${(i * 23 + 11) % 76}%`,
            animationDelay: `${(i % 7) * -0.43}s`,
            animationDuration: `${2.4 + (i % 5) * 0.55}s`,
          }} />
        ))}
      </div>
      <div className="realm-loader__moon" aria-hidden="true" />
      <div className="realm-loader__mountains realm-loader__mountains--far" aria-hidden="true" />
      <div className="realm-loader__mountains realm-loader__mountains--near" aria-hidden="true" />
      <div className="realm-loader__castle" aria-hidden="true">
        <span className="realm-loader__tower realm-loader__tower--left" />
        <span className="realm-loader__tower realm-loader__tower--center" />
        <span className="realm-loader__tower realm-loader__tower--right" />
        <span className="realm-loader__gate" />
      </div>
      <div className="realm-loader__ground" aria-hidden="true" />

      <section className="realm-loader__content">
        <div className="realm-loader__crest" aria-hidden="true">
          <span>⚔</span>
          <i />
        </div>
        <p className="realm-loader__eyebrow">A realm swallowed by darkness</p>
        <h1>UNDEAD <span>SLAYER</span></h1>
        <p className="realm-loader__subtitle">CHRONICLES</p>
        <div className="realm-loader__rule"><span>✦</span></div>
        <div className="realm-loader__heroes" aria-label="Preparing your heroes">
          {featuredHeroes.map((hero, index) => (
            <div
              key={hero.id}
              className={`realm-loader__hero realm-loader__hero--${index + 1}`}
              style={{ borderColor: `${hero.accentColor}88`, boxShadow: `0 0 30px ${hero.color}22` }}
            >
              <ArtImage src={hero.image} alt={hero.name} fallbackText={hero.classIcon} />
            </div>
          ))}
        </div>
        <p className="realm-loader__status"><span className="realm-loader__pulse" /> Restoring your adventure</p>
        <div className="realm-loader__progress" aria-hidden="true"><span /></div>
        <div className="realm-loader__footer">
          <span>10 HEROES</span><i>◆</i><span>50 STAGES</span><i>◆</i><span>10 CHAPTERS</span>
        </div>
      </section>
      <span className="realm-loader__version">PREPARE FOR THE HUNT</span>
    </main>
  );
}
