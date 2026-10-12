/**
 * Smooth, high-quality vector portrait generator (anime-fantasy style).
 * Portraits use gradients, soft shading and glow filters — deliberately NOT
 * pixelated — and scale cleanly to any size without stretching.
 */

const wrap = (inner: string, defs: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 64 64">${defs}${inner}</svg>`
  )}`;

export type Headgear =
  | "helm"
  | "hood"
  | "hat"
  | "crown"
  | "horns"
  | "antlers"
  | "headband"
  | "none";

export type WeaponArt =
  | "sword"
  | "greatsword"
  | "bow"
  | "staff"
  | "axe"
  | "hammer"
  | "dagger"
  | "orb"
  | "fist";

export interface HeroArtOpts {
  bg1: string;
  bg2: string;
  skin: string;
  hair: string;
  armor: string;
  accent: string;
  cape: string;
  weaponColor: string;
  headgear: Headgear;
  weaponArt: WeaponArt;
  /** monk-style shaved head with shine + small scars (skips hair) */
  bald?: boolean;
}

let uid = 0;
const gid = () => `g${++uid}`;

/** Painterly hero portrait: cape, layered armor, anime face, glowing weapon */
export function heroPortrait(o: HeroArtOpts): string {
  const bg = gid();
  const armor = gid();
  const cape = gid();
  const skin = gid();
  const glow = gid();
  const blade = gid();

  const defs = `<defs>
    <radialGradient id="${bg}" cx="50%" cy="34%" r="78%">
      <stop offset="0%" stop-color="${o.bg1}"/>
      <stop offset="100%" stop-color="${o.bg2}"/>
    </radialGradient>
    <linearGradient id="${armor}" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0%" stop-color="${o.accent}"/>
      <stop offset="45%" stop-color="${o.armor}"/>
      <stop offset="100%" stop-color="${o.bg2}"/>
    </linearGradient>
    <linearGradient id="${cape}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${o.cape}"/>
      <stop offset="100%" stop-color="${o.bg2}"/>
    </linearGradient>
    <linearGradient id="${skin}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff2e2"/>
      <stop offset="60%" stop-color="${o.skin}"/>
      <stop offset="100%" stop-color="#c98f68"/>
    </linearGradient>
    <linearGradient id="${blade}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="45%" stop-color="${o.weaponColor}"/>
      <stop offset="100%" stop-color="${o.armor}"/>
    </linearGradient>
    <filter id="${glow}" x="-70%" y="-70%" width="240%" height="240%">
      <feGaussianBlur stdDeviation="2.4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`;

  let s = "";
  s += `<rect width="64" height="64" fill="url(#${bg})"/>`;
  // soft rim light + aura
  s += `<ellipse cx="32" cy="30" rx="24" ry="26" fill="${o.accent}" opacity="0.13" filter="url(#${glow})"/>`;
  s += `<path d="M0 0 L64 0 L64 8 Q32 16 0 8 Z" fill="#ffffff" opacity="0.05"/>`;

  // Cape flowing behind
  s += `<path d="M12 34 Q6 46 10 62 L54 62 Q58 46 52 34 Q44 44 32 44 Q20 44 12 34 Z" fill="url(#${cape})"/>`;
  s += `<path d="M14 36 Q10 48 13 60" stroke="#000" stroke-opacity="0.28" stroke-width="1.4" fill="none"/>`;
  s += `<path d="M50 36 Q54 48 51 60" stroke="#000" stroke-opacity="0.28" stroke-width="1.4" fill="none"/>`;

  // Shoulders / torso armor
  s += `<path d="M17 42 Q32 36 47 42 L52 64 L12 64 Z" fill="url(#${armor})"/>`;
  s += `<path d="M17 42 Q32 36 47 42 L48 46 Q32 41 16 46 Z" fill="${o.accent}" opacity="0.9"/>`;
  s += `<path d="M28 46 L36 46 L34 60 L30 60 Z" fill="${o.accent}" opacity="0.55"/>`;
  // pauldrons
  s += `<ellipse cx="16" cy="45" rx="6" ry="5" fill="${o.armor}" stroke="${o.accent}" stroke-width="0.9"/>`;
  s += `<ellipse cx="48" cy="45" rx="6" ry="5" fill="${o.armor}" stroke="${o.accent}" stroke-width="0.9"/>`;

  // Neck + head
  s += `<rect x="28" y="34" width="8" height="7" rx="3" fill="${o.skin}"/>`;
  s += `<ellipse cx="32" cy="25" rx="12.5" ry="14" fill="url(#${skin})"/>`;
  s += `<path d="M20 27 Q22 39 32 40 Q42 39 44 27" fill="none" stroke="#000" stroke-opacity="0.12" stroke-width="1"/>`;

  // Hair (or shaved monk head)
  if (o.bald) {
    s += `<path d="M22 14 Q32 9 42 14" stroke="#fff" stroke-opacity="0.4" stroke-width="2" fill="none"/>`;
    s += `<circle cx="27" cy="15" r="1" fill="#000" opacity="0.18"/>`;
    s += `<circle cx="36" cy="13" r="0.8" fill="#000" opacity="0.15"/>`;
    s += `<circle cx="33" cy="17" r="0.7" fill="#000" opacity="0.15"/>`;
  } else {
    s += `<path d="M18 22 Q19 8 32 8 Q45 8 46 22 Q44 15 38 14 Q34 20 26 16 Q21 16 18 22 Z" fill="${o.hair}"/>`;
    s += `<path d="M19 22 Q17 30 20 34 L22 26 Z" fill="${o.hair}"/>`;
    s += `<path d="M45 22 Q47 30 44 34 L42 26 Z" fill="${o.hair}"/>`;
    s += `<path d="M24 12 Q32 8 40 12" stroke="#fff" stroke-opacity="0.35" stroke-width="1.2" fill="none"/>`;
  }

  // Anime eyes
  s += `<ellipse cx="26.5" cy="26" rx="2.6" ry="3.4" fill="#ffffff"/>`;
  s += `<ellipse cx="37.5" cy="26" rx="2.6" ry="3.4" fill="#ffffff"/>`;
  s += `<ellipse cx="26.8" cy="26.4" rx="1.7" ry="2.5" fill="${o.bg2}"/>`;
  s += `<ellipse cx="37.2" cy="26.4" rx="1.7" ry="2.5" fill="${o.bg2}"/>`;
  s += `<circle cx="26.2" cy="25.2" r="0.8" fill="#fff"/>`;
  s += `<circle cx="36.6" cy="25.2" r="0.8" fill="#fff"/>`;
  s += `<circle cx="27.6" cy="27.6" r="0.5" fill="${o.accent}" opacity="0.9"/>`;
  s += `<circle cx="38" cy="27.6" r="0.5" fill="${o.accent}" opacity="0.9"/>`;
  s += `<path d="M23.6 21.6 Q26.5 20.4 29.4 21.6" stroke="${o.hair}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M34.6 21.6 Q37.5 20.4 40.4 21.6" stroke="${o.hair}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
  // blush + mouth
  s += `<ellipse cx="23" cy="30" rx="2.4" ry="1.1" fill="#f87171" opacity="0.22"/>`;
  s += `<ellipse cx="41" cy="30" rx="2.4" ry="1.1" fill="#f87171" opacity="0.22"/>`;
  s += `<path d="M30 33 Q32 34.6 34 33" stroke="#8b4a3a" stroke-width="0.9" fill="none" stroke-linecap="round"/>`;

  // Headgear
  switch (o.headgear) {
    case "helm":
      s += `<path d="M18 20 Q18 6 32 6 Q46 6 46 20 L46 24 Q32 20 18 24 Z" fill="url(#${armor})" stroke="${o.accent}" stroke-width="0.8"/>`;
      s += `<path d="M18 24 Q32 20 46 24 L46 26.5 Q32 22.5 18 26.5 Z" fill="${o.accent}"/>`;
      s += `<path d="M30 3 Q32 -1 34 3 L35 9 L29 9 Z" fill="${o.accent}" filter="url(#${glow})"/>`;
      break;
    case "hood":
      s += `<path d="M16 26 Q14 6 32 5 Q50 6 48 26 Q46 16 42 13 Q32 9 22 13 Q18 16 16 26 Z" fill="url(#${cape})"/>`;
      s += `<path d="M17 24 Q16 34 20 40 L23 26 Z" fill="${o.cape}"/>`;
      s += `<path d="M47 24 Q48 34 44 40 L41 26 Z" fill="${o.cape}"/>`;
      s += `<path d="M20 14 Q32 9 44 14" stroke="${o.accent}" stroke-opacity="0.5" stroke-width="1" fill="none"/>`;
      break;
    case "hat":
      s += `<path d="M14 18 Q32 12 50 18 Q32 22 14 18 Z" fill="${o.armor}"/>`;
      s += `<path d="M22 16 Q24 2 32 1 Q40 2 42 16 Z" fill="url(#${armor})"/>`;
      s += `<circle cx="32" cy="2" r="2" fill="${o.accent}" filter="url(#${glow})"/>`;
      s += `<path d="M22 15 Q32 12 42 15" stroke="${o.accent}" stroke-width="1" fill="none"/>`;
      break;
    case "crown":
      s += `<path d="M20 12 L22 4 L27 10 L32 2 L37 10 L42 4 L44 12 Z" fill="#f5c542" stroke="#b8860b" stroke-width="0.7"/>`;
      s += `<rect x="20" y="12" width="24" height="3.4" rx="1.4" fill="#f5c542" stroke="#b8860b" stroke-width="0.6"/>`;
      s += `<circle cx="32" cy="13.6" r="1.3" fill="#f43f5e" filter="url(#${glow})"/>`;
      break;
    case "horns":
      s += `<path d="M20 14 Q13 8 14 0 Q19 6 23 11 Z" fill="${o.accent}"/>`;
      s += `<path d="M44 14 Q51 8 50 0 Q45 6 41 11 Z" fill="${o.accent}"/>`;
      s += `<path d="M19 16 Q32 10 45 16 L45 19 Q32 14 19 19 Z" fill="${o.armor}"/>`;
      break;
    case "antlers":
      s += `<path d="M21 14 Q16 8 17 1 M18 8 Q13 6 12 2" stroke="#8b6b3d" stroke-width="1.7" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M43 14 Q48 8 47 1 M46 8 Q51 6 52 2" stroke="#8b6b3d" stroke-width="1.7" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M20 16 Q32 12 44 16" stroke="${o.accent}" stroke-width="1.6" fill="none"/>`;
      break;
    case "headband":
      s += `<path d="M19 19 Q32 15 45 19 L45 22.5 Q32 18.5 19 22.5 Z" fill="${o.accent}"/>`;
      s += `<path d="M45 20 Q52 24 50 32" stroke="${o.accent}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
      break;
    default:
      break;
  }

  // Weapon (glowing, right side)
  switch (o.weaponArt) {
    case "sword":
      s += `<path d="M54 10 L57 12 L50 46 L46 45 Z" fill="url(#${blade})" filter="url(#${glow})"/>`;
      s += `<rect x="44" y="45" width="12" height="2.6" rx="1.2" fill="${o.accent}"/>`;
      s += `<rect x="48.4" y="47.6" width="3" height="8" rx="1.4" fill="#7c5a2b"/>`;
      break;
    case "greatsword":
      s += `<path d="M52 4 L58 7 L50 50 L44 48 Z" fill="url(#${blade})" filter="url(#${glow})"/>`;
      s += `<path d="M53 8 L56 9.5 L49 45" stroke="#fff" stroke-opacity="0.55" stroke-width="1" fill="none"/>`;
      s += `<rect x="41" y="48" width="16" height="3" rx="1.4" fill="${o.accent}"/>`;
      s += `<rect x="47" y="51" width="3.4" height="9" rx="1.6" fill="#7c5a2b"/>`;
      break;
    case "bow":
      s += `<path d="M54 8 Q64 32 54 56" stroke="url(#${blade})" stroke-width="2.6" fill="none" stroke-linecap="round" filter="url(#${glow})"/>`;
      s += `<path d="M54 9 L54 55" stroke="#e5e7eb" stroke-width="0.8" opacity="0.85"/>`;
      s += `<path d="M46 32 L58 32" stroke="${o.accent}" stroke-width="1.4"/>`;
      s += `<path d="M58 32 L52 30 L52 34 Z" fill="#fff"/>`;
      break;
    case "staff":
      s += `<rect x="52" y="16" width="2.6" height="42" rx="1.2" fill="#7c5a2b"/>`;
      s += `<circle cx="53.3" cy="12" r="6" fill="${o.weaponColor}" opacity="0.35" filter="url(#${glow})"/>`;
      s += `<circle cx="53.3" cy="12" r="3.6" fill="${o.weaponColor}"/>`;
      s += `<circle cx="52" cy="10.6" r="1.2" fill="#fff" opacity="0.9"/>`;
      break;
    case "orb":
      s += `<rect x="52" y="20" width="2.6" height="38" rx="1.2" fill="#7c5a2b"/>`;
      s += `<circle cx="53.3" cy="15" r="7.5" fill="${o.weaponColor}" opacity="0.28" filter="url(#${glow})"/>`;
      s += `<circle cx="53.3" cy="15" r="4.6" fill="${o.weaponColor}"/>`;
      s += `<path d="M49 12 Q53 8 57 13" stroke="#fff" stroke-opacity="0.8" stroke-width="1" fill="none"/>`;
      break;
    case "axe":
      s += `<rect x="52" y="12" width="2.6" height="44" rx="1.2" fill="#7c5a2b"/>`;
      s += `<path d="M52 14 Q42 16 44 26 Q48 22 52 24 Z" fill="url(#${blade})" filter="url(#${glow})"/>`;
      s += `<path d="M55 14 Q64 16 62 26 Q58 22 55 24 Z" fill="url(#${blade})"/>`;
      break;
    case "hammer":
      s += `<rect x="52" y="18" width="3" height="40" rx="1.4" fill="#7c5a2b"/>`;
      s += `<rect x="44" y="6" width="18" height="12" rx="2.4" fill="url(#${blade})" filter="url(#${glow})"/>`;
      s += `<rect x="44" y="6" width="18" height="3.4" rx="1.6" fill="${o.accent}" opacity="0.8"/>`;
      break;
    case "dagger":
      s += `<path d="M53 26 L56 28 L52 46 L49 45 Z" fill="url(#${blade})" filter="url(#${glow})"/>`;
      s += `<rect x="47" y="45" width="10" height="2.2" rx="1" fill="${o.accent}"/>`;
      s += `<rect x="50.6" y="47" width="2.4" height="6" rx="1.1" fill="#7c5a2b"/>`;
      break;
    case "fist":
      // raised flame/ki fist (monk)
      s += `<circle cx="47" cy="34" r="9" fill="${o.weaponColor}" opacity="0.3" filter="url(#${glow})"/>`;
      s += `<circle cx="47" cy="34" r="6" fill="${o.skin}"/>`;
      s += `<rect x="42" y="30" width="10" height="2" rx="1" fill="#fff" opacity="0.35"/>`;
      s += `<path d="M40 40 Q47 44 54 40" stroke="${o.weaponColor}" stroke-opacity="0.8" stroke-width="1.4" fill="none"/>`;
      break;
    default:
      break;
  }

  // vignette
  s += `<rect width="64" height="64" fill="none" stroke="#000" stroke-opacity="0.35" stroke-width="2"/>`;

  return wrap(s, defs);
}

export type MonsterFeature =
  | "horns"
  | "ears"
  | "spikes"
  | "ribs"
  | "legs8"
  | "wings"
  | "hood"
  | "helm"
  | "antlers"
  | "crown"
  | "mane"
  | "tentacles"
  | "none";

export interface MonsterArtOpts {
  bg1: string;
  bg2: string;
  body: string;
  dark: string;
  eye: string;
  feature: MonsterFeature;
  fang?: boolean;
  aura?: string;
}

/** Painterly monster / boss portrait with glowing eyes and menacing silhouette */
export function monsterPortrait(o: MonsterArtOpts): string {
  const bg = gid();
  const body = gid();
  const glow = gid();

  const defs = `<defs>
    <radialGradient id="${bg}" cx="50%" cy="32%" r="80%">
      <stop offset="0%" stop-color="${o.bg1}"/>
      <stop offset="100%" stop-color="${o.bg2}"/>
    </radialGradient>
    <radialGradient id="${body}" cx="42%" cy="28%" r="82%">
      <stop offset="0%" stop-color="${o.body}"/>
      <stop offset="70%" stop-color="${o.body}"/>
      <stop offset="100%" stop-color="${o.dark}"/>
    </radialGradient>
    <filter id="${glow}" x="-70%" y="-70%" width="240%" height="240%">
      <feGaussianBlur stdDeviation="2.2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`;

  let s = "";
  s += `<rect width="64" height="64" fill="url(#${bg})"/>`;
  if (o.aura) s += `<ellipse cx="32" cy="32" rx="25" ry="26" fill="${o.aura}" opacity="0.16" filter="url(#${glow})"/>`;

  // behind-body features
  if (o.feature === "wings") {
    s += `<path d="M18 22 Q2 12 1 34 Q6 30 10 34 Q8 44 20 44 Z" fill="${o.dark}" opacity="0.95"/>`;
    s += `<path d="M46 22 Q62 12 63 34 Q58 30 54 34 Q56 44 44 44 Z" fill="${o.dark}" opacity="0.95"/>`;
    s += `<path d="M18 24 Q8 20 5 32" stroke="${o.body}" stroke-opacity="0.5" stroke-width="1" fill="none"/>`;
    s += `<path d="M46 24 Q56 20 59 32" stroke="${o.body}" stroke-opacity="0.5" stroke-width="1" fill="none"/>`;
  }
  if (o.feature === "legs8") {
    for (let i = 0; i < 4; i++) {
      const y = 30 + i * 5;
      s += `<path d="M22 ${y} Q8 ${y - 5} 3 ${y + 5}" stroke="${o.dark}" stroke-width="2.1" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M42 ${y} Q56 ${y - 5} 61 ${y + 5}" stroke="${o.dark}" stroke-width="2.1" fill="none" stroke-linecap="round"/>`;
    }
  }
  if (o.feature === "antlers") {
    s += `<path d="M22 18 Q14 10 15 1 M17 10 Q10 8 8 2" stroke="#8b6b3d" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M42 18 Q50 10 49 1 M47 10 Q54 8 56 2" stroke="#8b6b3d" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  }
  if (o.feature === "tentacles") {
    s += `<path d="M20 48 Q14 58 18 63 M32 50 Q30 60 34 63 M44 48 Q50 58 46 63" stroke="${o.dark}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  }
  if (o.feature === "mane") {
    s += `<path d="M14 20 Q6 30 12 46 Q18 40 20 44 Z" fill="${o.dark}"/>`;
    s += `<path d="M50 20 Q58 30 52 46 Q46 40 44 44 Z" fill="${o.dark}"/>`;
  }

  // body
  s += `<path d="M32 8 Q54 10 55 34 Q55 56 32 58 Q9 56 9 34 Q10 10 32 8 Z" fill="url(#${body})"/>`;
  s += `<path d="M32 10 Q50 12 51 30 Q40 22 32 24 Q22 22 13 30 Q14 12 32 10 Z" fill="#ffffff" opacity="0.08"/>`;
  s += `<path d="M14 44 Q32 58 50 44 Q48 55 32 57 Q16 55 14 44 Z" fill="#000" opacity="0.22"/>`;

  // on-body features
  switch (o.feature) {
    case "horns":
      s += `<path d="M20 16 Q11 10 12 0 Q18 7 24 13 Z" fill="${o.dark}"/>`;
      s += `<path d="M44 16 Q53 10 52 0 Q46 7 40 13 Z" fill="${o.dark}"/>`;
      break;
    case "ears":
      s += `<path d="M19 16 L14 3 L26 11 Z" fill="${o.body}" stroke="${o.dark}" stroke-width="0.8"/>`;
      s += `<path d="M45 16 L50 3 L38 11 Z" fill="${o.body}" stroke="${o.dark}" stroke-width="0.8"/>`;
      break;
    case "spikes":
      s += `<path d="M20 12 L23 2 L26 12 Z M30 10 L33 -1 L36 10 Z M40 12 L43 2 L46 12 Z" fill="${o.dark}"/>`;
      break;
    case "ribs":
      for (let i = 0; i < 4; i++) {
        s += `<path d="M20 ${38 + i * 4} Q32 ${42 + i * 4} 44 ${38 + i * 4}" stroke="${o.dark}" stroke-width="1.6" fill="none" opacity="0.85"/>`;
      }
      break;
    case "hood":
      s += `<path d="M32 4 Q54 8 54 30 Q44 18 32 18 Q20 18 10 30 Q10 8 32 4 Z" fill="${o.dark}"/>`;
      s += `<path d="M12 28 Q10 42 16 50 L20 30 Z" fill="${o.dark}"/>`;
      s += `<path d="M52 28 Q54 42 48 50 L44 30 Z" fill="${o.dark}"/>`;
      break;
    case "helm":
      s += `<path d="M32 4 Q53 7 53 26 L11 26 Q11 7 32 4 Z" fill="${o.dark}"/>`;
      s += `<rect x="11" y="26" width="42" height="4" rx="1.6" fill="#6b7280"/>`;
      s += `<rect x="20" y="30" width="24" height="2" fill="#0b1020" opacity="0.75"/>`;
      break;
    case "crown":
      s += `<path d="M16 12 L19 1 L25 8 L32 -1 L39 8 L45 1 L48 12 Z" fill="#f5c542" stroke="#b8860b" stroke-width="0.7"/>`;
      s += `<rect x="16" y="12" width="32" height="4" rx="1.6" fill="#f5c542" stroke="#b8860b" stroke-width="0.6"/>`;
      s += `<circle cx="32" cy="14" r="1.6" fill="#f43f5e" filter="url(#${glow})"/>`;
      break;
    default:
      break;
  }

  // eyes
  s += `<ellipse cx="23" cy="30" rx="5" ry="5.6" fill="${o.eye}" filter="url(#${glow})"/>`;
  s += `<ellipse cx="41" cy="30" rx="5" ry="5.6" fill="${o.eye}" filter="url(#${glow})"/>`;
  s += `<ellipse cx="23.4" cy="30.6" rx="1.9" ry="3.4" fill="#0b1020"/>`;
  s += `<ellipse cx="40.6" cy="30.6" rx="1.9" ry="3.4" fill="#0b1020"/>`;
  s += `<circle cx="21.4" cy="28" r="1.1" fill="#fff" opacity="0.9"/>`;
  s += `<circle cx="38.8" cy="28" r="1.1" fill="#fff" opacity="0.9"/>`;

  // mouth + fangs
  s += `<path d="M22 44 Q32 52 42 44 Q38 48 32 48 Q26 48 22 44 Z" fill="${o.dark}"/>`;
  if (o.fang !== false) {
    s += `<path d="M25 44 L27.5 50 L30 44 Z" fill="#f8fafc"/>`;
    s += `<path d="M34 44 L36.5 50 L39 44 Z" fill="#f8fafc"/>`;
  }

  s += `<rect width="64" height="64" fill="none" stroke="#000" stroke-opacity="0.4" stroke-width="2"/>`;
  return wrap(s, defs);
}
