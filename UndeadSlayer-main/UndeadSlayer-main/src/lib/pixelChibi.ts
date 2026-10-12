/**
 * Authentic pixel-art chibi renderer — Soul Knight sprite-sheet style (v2).
 *
 * Big-head proportions on a 30-row grid: oversized head (12px face, big 3x3
 * eyes with highlights), detailed per-class hair & hats, distinct outfits,
 * short stubby legs, and LARGE prominent weapons. Class signature effects
 * are redrawn at the bigger scale. All drawing is integer fillRect pixels —
 * crisp, no smoothing, never stretched.
 *
 * Grid: 32 wide (x0..31) x 30 tall (y0 top .. y29 feet). Origin = bottom
 * center of the feet. The chibi faces RIGHT by default; the caller mirrors.
 */

export interface PixelPalette {
  hair: string;
  skin: string;
  eye: string;
  top: string;
  topDark: string;
  bottom: string;
  bottomDark: string;
  accent: string;
  weapon: string;
  weaponDark: string;
  cape?: string;
  scarf?: string;
  shield?: string;
  hat?: string;
  hatDark?: string;
  /** gold/colored trim along the hood/pointy-hat edge (archer/mage style) */
  hatTrim?: string;
}

export type PixelHat =
  | "none" | "bald" | "messy" | "spiky" | "long" | "ponytail" | "pointy" | "hood"
  | "helmet" | "goggles" | "crown" | "horns";

export type PixelWeapon =
  | "sword" | "greatsword" | "bow" | "staff" | "spear"
  | "axe" | "hammer" | "dagger" | "dual" | "dualBlade" | "rifle" | "claw" | "fist";

export type PixelEffect =
  | "slash" | "arrows" | "orb" | "burst" | "spear" | "rocks" | "cross"
  | "laser" | "flame" | "dash" | "spirit" | "shadecut" | "none";

export interface PixelChibiDef {
  palette: PixelPalette;
  hat: PixelHat;
  weapon: PixelWeapon;
  effect: PixelEffect;
  shield?: boolean;
  big?: boolean;
  effectTint?: string;
}

export interface ChibiDrawOpts {
  u: number; // pixel size in canvas px
  frame: number;
  moving: boolean;
  attackT: number; // 0..1, 0 = not attacking
  hitFlash: number; // > 0 = taking the hurt frames
  dashing?: boolean;
  dead?: boolean;
  boss?: boolean;
  elite?: boolean;
}

export function drawChibi(ctx: CanvasRenderingContext2D, def: PixelChibiDef, o: ChibiDrawOpts) {
  const u = o.u;
  const flash = o.hitFlash > 0;
  const p = def.palette;
  const hatC = p.hat || p.hair;
  const hatD = p.hatDark || p.topDark;

  // flash-aware pixel (white on hurt frame 1)
  const PF = (lx: number, ly: number, w: number, h: number, c: string) => {
    if (ly >= 30) return;
    const hh = Math.min(h, 30 - ly);
    ctx.fillStyle = flash ? "#ffffff" : c;
    ctx.fillRect(
      Math.round((lx - 13) * u),
      Math.round((ly - 30) * u),
      Math.max(1, Math.round(w * u)),
      Math.max(1, Math.round(hh * u))
    );
  };

  const frame = Math.floor(o.frame);
  const walking = o.moving && !o.dead;
  const walkF = frame % 4;
  const hurt = o.hitFlash > 0 && !o.dead;
  const hurtFrame = hurt ? (o.hitFlash > 0.08 ? 0 : 1) : -1; // 0 = white flash, 1 = recoil
  const atk = o.attackT > 0 && o.attackT < 1 && !o.dead && !hurt;
  // 4-frame attack: 0 wind-up, 1 high swing, 2 low swing, 3 recover
  const pose = atk ? (o.attackT < 0.3 ? 0 : o.attackT < 0.55 ? 1 : o.attackT < 0.8 ? 2 : 3) : -1;
  const swing = atk ? (pose === 1 ? 1 : pose === 2 ? 2 : 0) : 0;

  /* IDLE (4f breathing) / WALK (4f leg swap) */
  const bob = o.dead ? 2 : walking ? [0, 1, 0, 1][walkF] : [0, 0, 1, 1][frame % 4];
  const oy = bob;
  const hy = bob + (hurtFrame === 1 ? 1 : 0);
  const legL = walking ? (walkF === 1 ? 1 : 0) : 0;
  const legR = walking ? (walkF === 3 ? 1 : 0) : 0;

  /* ---------- dash speed streaks (behind) ---------- */
  if (o.dashing && !o.dead) {
    PF(3, 16, 5, 1, "#e5e7eb");
    PF(2, 19, 6, 1, "#cbd5e1");
    PF(3, 22, 5, 1, "#e5e7eb");
    PF(1, 18, 2, 1, "#f8fafc");
    PF(1, 21, 2, 1, "#f8fafc");
  }

  /* ---------- cape (behind) ---------- */
  if (p.cape && def.hat !== "hood") {
    const sway = walking ? walkF % 2 : frame % 2;
    PF(8, 16 + oy, 2, 10, p.cape);
    PF(7 + sway, 21 + oy, 1, 6, p.cape);
  }
  /* ---------- scarf ---------- */
  if (p.scarf) {
    PF(11, 15 + oy, 9, 1, p.scarf);
    PF(20, 16 + oy, 2, 6, p.scarf);
    PF(20, 22 + oy, 3, 1, p.scarf);
    PF(20, 23 + oy, 2, 1, p.scarf);
  }

  /* ---------- shield (off-hand) ---------- */
  if (def.shield) {
    PF(5, 17 + oy, 4, 9, p.shield || p.topDark);
    PF(5, 17 + oy, 4, 1, p.accent);
    PF(6, 19 + oy, 2, 5, p.accent);
  }

  /* ---------- legs & boots (walk cycle) ---------- */
  PF(11, 23 - legL, 3, 5, p.bottom);
  PF(16, 23 - legR, 3, 5, p.bottom);
  PF(10, 28 - legL, 4, 2, p.bottomDark);
  PF(15, 28 - legR, 5, 2, p.bottomDark);

  /* ---------- torso & arms ---------- */
  PF(10, 16 + oy, 10, 7, p.top);
  PF(18, 16 + oy, 2, 7, p.topDark);
  PF(10, 22 + oy, 10, 1, p.accent); // belt
  PF(14, 22 + oy, 2, 1, "#f8fafc"); // buckle
  PF(9, 17 + oy, 1, 4, p.top); // left arm
  PF(20, 17 + oy, 1, 4, p.top); // right arm
  PF(9, 21 + oy, 1, 1, p.skin); // left hand
  PF(20, 21 + oy, 1, 1, p.skin); // right hand (weapon)

  /* ---------- BIG head (Soul Knight proportions) ---------- */
  PF(9, 7 + hy, 12, 8, p.skin); // face y7-14

  if (def.hat !== "goggles") {
    if (hurtFrame === 1) {
      PF(11, 10 + hy, 3, 1, p.topDark); // closed eyes (recoil)
      PF(16, 10 + hy, 3, 1, p.topDark);
    } else if (!o.dead && !walking && frame % 4 === 3) {
      PF(11, 10 + hy, 3, 1, p.topDark); // idle blink
      PF(16, 10 + hy, 3, 1, p.topDark);
    } else {
      // big 3x3 anime eyes with highlights
      PF(11, 9 + hy, 3, 3, p.eye);
      PF(16, 9 + hy, 3, 3, p.eye);
      PF(11, 9 + hy, 1, 1, "#ffffff");
      PF(16, 9 + hy, 1, 1, "#ffffff");
      PF(13, 11 + hy, 1, 1, "#ffffff");
      PF(18, 11 + hy, 1, 1, "#ffffff");
    }
  }
  PF(14, 13 + hy, 2, 1, "#7c3f33"); // mouth

  /* ---------- hats / hair ---------- */
  switch (def.hat) {
    case "none":
      PF(10, 5 + hy, 12, 2, p.hair);
      PF(9, 6 + hy, 14, 1, p.hair);
      PF(8, 7 + hy, 1, 7, p.hair);
      PF(21, 7 + hy, 1, 7, p.hair);
      PF(9, 7 + hy, 5, 1, p.hair); // bangs
      PF(17, 7 + hy, 4, 1, p.hair);
      break;
    case "messy":
      PF(10, 4 + hy, 12, 2, p.hair);
      PF(9, 5 + hy, 14, 1, p.hair);
      PF(10, 3 + hy, 2, 1, p.hair);
      PF(13, 2 + hy, 2, 2, p.hair);
      PF(16, 3 + hy, 2, 1, p.hair);
      PF(19, 3 + hy, 1, 2, p.hair);
      PF(8, 6 + hy, 1, 8, p.hair);
      PF(21, 6 + hy, 1, 8, p.hair);
      PF(9, 7 + hy, 4, 1, p.hair);
      PF(18, 7 + hy, 3, 1, p.hair);
      break;
    case "bald":
      PF(9, 6 + hy, 12, 1, p.skin);
      PF(10, 6 + hy, 3, 1, "#ffffff"); // scalp shine
      PF(14, 6 + hy, 1, 1, p.topDark); // scars
      PF(18, 6 + hy, 1, 1, p.topDark);
      PF(16, 7 + hy, 1, 1, p.topDark);
      PF(8, 7 + hy, 1, 3, p.skin);
      PF(21, 7 + hy, 1, 3, p.skin);
      break;
    case "spiky":
      PF(10, 3 + hy, 2, 2, p.hair);
      PF(12, 2 + hy, 2, 3, p.hair);
      PF(14, 3 + hy, 2, 2, p.hair);
      PF(16, 2 + hy, 2, 3, p.hair);
      PF(18, 3 + hy, 1, 2, p.hair);
      PF(10, 5 + hy, 10, 2, p.hair);
      PF(9, 6 + hy, 14, 1, p.hair);
      PF(8, 7 + hy, 1, 4, p.hair);
      PF(21, 7 + hy, 1, 4, p.hair);
      break;
    case "ponytail":
      // spiky front
      PF(10, 3 + hy, 2, 2, p.hair);
      PF(12, 2 + hy, 3, 3, p.hair);
      PF(15, 3 + hy, 2, 2, p.hair);
      PF(17, 2 + hy, 1, 2, p.hair);
      PF(10, 5 + hy, 10, 2, p.hair);
      PF(9, 6 + hy, 14, 1, p.hair);
      PF(8, 7 + hy, 1, 4, p.hair);
      PF(21, 7 + hy, 1, 4, p.hair);
      // big fluffy tail
      PF(6, 9 + hy, 3, 3, p.hair);
      PF(4, 12 + hy, 4, 3, p.hair);
      PF(5, 15 + hy, 3, 3, p.hair);
      PF(6, 18 + hy, 2, 3, p.hair);
      PF(5, 21 + hy, 2, 1, p.hair);
      PF(6, 10 + hy, 1, 1, "#ffffff"); // sheen
      break;
    case "long":
      PF(10, 4 + hy, 12, 2, p.hair);
      PF(9, 5 + hy, 14, 1, p.hair);
      PF(8, 6 + hy, 1, 9, p.hair);
      PF(21, 6 + hy, 1, 9, p.hair);
      PF(7, 8 + hy, 1, 7, p.hair);
      PF(22, 8 + hy, 1, 7, p.hair);
      PF(8, 14 + hy, 1, 3, p.hair);
      PF(21, 14 + hy, 1, 3, p.hair);
      PF(7, 15 + hy, 1, 2, p.hair);
      PF(22, 15 + hy, 1, 2, p.hair);
      break;
    case "pointy": {
      PF(12, 0 + hy, 3, 1, hatC);
      PF(11, 1 + hy, 5, 1, hatC);
      PF(10, 2 + hy, 7, 1, hatC);
      PF(9, 3 + hy, 9, 1, hatC);
      PF(8, 4 + hy, 11, 1, hatC);
      PF(7, 5 + hy, 13, 2, hatD);
      if (p.hatTrim) {
        PF(7, 6 + hy, 13, 1, p.hatTrim);
        PF(14, 2 + hy, 2, 2, p.hatTrim);
        PF(14, 2 + hy, 1, 1, "#ffffff");
      }
      // long hair under the hat
      PF(8, 7 + hy, 1, 7, p.hair);
      PF(21, 7 + hy, 1, 7, p.hair);
      PF(10, 7 + hy, 3, 1, p.hair);
      PF(17, 7 + hy, 3, 1, p.hair);
      PF(8, 14 + hy, 1, 2, p.hair);
      PF(21, 14 + hy, 1, 2, p.hair);
      break;
    }
    case "hood": {
      PF(9, 2 + hy, 12, 4, hatC);
      PF(8, 6 + hy, 14, 1, hatC);
      PF(8, 7 + hy, 1, 7, hatC);
      PF(21, 7 + hy, 1, 7, hatC);
      PF(10, 6 + hy, 10, 1, hatD);
      if (p.hatTrim) {
        PF(8, 6 + hy, 14, 1, p.hatTrim);
        PF(8, 13 + hy, 1, 1, p.hatTrim);
        PF(21, 13 + hy, 1, 1, p.hatTrim);
        PF(10, 2 + hy, 1, 1, p.hatTrim);
        PF(19, 2 + hy, 1, 1, p.hatTrim);
      }
      // hair tufts under the hood
      PF(10, 7 + hy, 2, 1, p.hair);
      PF(18, 7 + hy, 2, 1, p.hair);
      PF(9, 8 + hy, 1, 2, p.hair);
      PF(21, 8 + hy, 1, 2, p.hair);
      break;
    }
    case "helmet":
      PF(9, 3 + hy, 12, 4, p.topDark);
      PF(9, 3 + hy, 12, 1, p.accent);
      PF(9, 7 + hy, 12, 1, p.accent);
      PF(12, 8 + hy, 6, 1, "#0b1020"); // visor slit
      PF(14, 1 + hy, 2, 2, p.scarf || p.accent); // plume
      PF(16, 2 + hy, 1, 1, p.scarf || p.accent);
      break;
    case "goggles":
      // spiky hair
      PF(10, 3 + hy, 2, 2, p.hair);
      PF(12, 2 + hy, 2, 3, p.hair);
      PF(14, 3 + hy, 2, 2, p.hair);
      PF(16, 2 + hy, 2, 3, p.hair);
      PF(10, 5 + hy, 10, 2, p.hair);
      PF(9, 6 + hy, 14, 1, p.hair);
      PF(8, 7 + hy, 1, 4, p.hair);
      PF(21, 7 + hy, 1, 4, p.hair);
      // goggle strap + round aviator lenses (cover the eyes)
      PF(10, 8 + hy, 10, 1, p.topDark);
      PF(11, 9 + hy, 3, 3, p.accent);
      PF(16, 9 + hy, 3, 3, p.accent);
      PF(14, 9 + hy, 2, 1, p.topDark); // bridge
      PF(11, 9 + hy, 1, 1, "#ffffff");
      PF(16, 9 + hy, 1, 1, "#ffffff");
      break;
    case "crown":
      PF(10, 3 + hy, 10, 2, p.accent);
      PF(10, 1 + hy, 2, 2, p.accent);
      PF(14, 0 + hy, 2, 3, p.accent);
      PF(18, 1 + hy, 2, 2, p.accent);
      PF(14, 3 + hy, 2, 1, "#f43f5e");
      PF(9, 5 + hy, 1, 2, p.hair);
      PF(21, 5 + hy, 1, 2, p.hair);
      PF(8, 7 + hy, 1, 3, p.hair);
      PF(21, 7 + hy, 1, 3, p.hair);
      break;
    case "horns":
      PF(7, 3 + hy, 3, 5, p.accent);
      PF(22, 3 + hy, 3, 5, p.accent);
      PF(6, 1 + hy, 1, 2, p.accent);
      PF(25, 1 + hy, 1, 2, p.accent);
      PF(10, 4 + hy, 12, 2, p.hair);
      PF(9, 6 + hy, 14, 1, p.hair);
      PF(8, 7 + hy, 1, 3, p.hair);
      PF(21, 7 + hy, 1, 3, p.hair);
      break;
    default:
      break;
  }

  /* ---------- weapon (rest / high swing / low swing) ---------- */
  const W = p.weapon;
  const WD = p.weaponDark;
  const ACC = p.accent;
  switch (def.weapon) {
    case "sword":
      if (swing === 1) {
        PF(24, 14, 7, 1, W);
        PF(31, 14, 1, 1, "#ffffff");
        PF(23, 13, 1, 3, ACC);
      } else if (swing === 2) {
        PF(24, 20, 6, 1, W);
        PF(30, 20, 1, 1, "#ffffff");
        PF(23, 19, 1, 3, ACC);
      } else {
        PF(22, 7, 1, 13, W);
        PF(22, 6, 1, 1, "#ffffff");
        PF(21, 19, 3, 1, ACC);
        PF(22, 20, 1, 2, WD);
      }
      break;
    case "greatsword":
      if (swing === 1) {
        PF(24, 12, 8, 2, W);
        PF(32, 12, 1, 2, "#ffffff");
        PF(23, 11, 1, 4, ACC);
      } else if (swing === 2) {
        PF(24, 20, 7, 2, W);
        PF(31, 20, 1, 2, "#ffffff");
        PF(23, 19, 1, 4, ACC);
      } else {
        PF(21, 5, 2, 15, W);
        PF(21, 5, 1, 15, "#ffffff");
        PF(21, 4, 2, 1, W);
        PF(20, 19, 4, 1, ACC);
        PF(21, 20, 2, 2, WD);
      }
      break;
    case "dagger":
      if (swing === 1) {
        PF(23, 15, 5, 1, W);
        PF(28, 15, 1, 1, "#ffffff");
      } else if (swing === 2) {
        PF(23, 21, 5, 1, W);
        PF(28, 21, 1, 1, "#ffffff");
      } else {
        PF(21, 17, 1, 5, W);
        PF(21, 16, 1, 1, "#ffffff");
        PF(20, 22, 3, 1, ACC);
      }
      break;
    case "dual":
      if (swing === 1) {
        PF(23, 14, 6, 1, W);
        PF(29, 14, 1, 1, "#ffffff");
        PF(4, 16, 6, 1, W);
        PF(3, 16, 1, 1, "#ffffff");
      } else if (swing === 2) {
        PF(23, 20, 6, 1, W);
        PF(29, 20, 1, 1, "#ffffff");
        PF(4, 18, 6, 1, W);
        PF(3, 18, 1, 1, "#ffffff");
      } else {
        PF(21, 17, 1, 5, W);
        PF(21, 16, 1, 1, "#ffffff");
        PF(7, 18, 1, 5, W);
        PF(7, 17, 1, 1, "#ffffff");
      }
      break;
    case "dualBlade":
      if (swing === 1) {
        PF(23, 12, 8, 1, W);
        PF(31, 12, 1, 1, "#ffffff");
        PF(3, 15, 8, 1, W);
        PF(2, 15, 1, 1, "#ffffff");
      } else if (swing === 2) {
        PF(23, 21, 8, 1, W);
        PF(31, 21, 1, 1, "#ffffff");
        PF(3, 18, 8, 1, W);
        PF(2, 18, 1, 1, "#ffffff");
      } else {
        PF(21, 11, 1, 11, W);
        PF(21, 10, 1, 1, "#ffffff");
        PF(20, 21, 3, 1, ACC);
        PF(7, 12, 1, 11, W);
        PF(7, 11, 1, 1, "#ffffff");
        PF(6, 22, 3, 1, ACC);
      }
      break;
    case "bow":
      PF(26, 7, 1, 17, WD);
      PF(26, 7, 1, 2, ACC);
      PF(26, 22, 1, 2, ACC);
      PF(25, 9, 1, 13, "#e5e7eb");
      if (swing === 1) {
        PF(25, 17, 7, 1, "#d9f99d");
        PF(32, 16, 1, 3, ACC);
        PF(33, 17, 1, 1, "#ffffff");
      } else if (swing === 2) {
        PF(25, 19, 7, 1, "#d9f99d");
        PF(32, 18, 1, 3, ACC);
        PF(33, 19, 1, 1, "#ffffff");
      }
      break;
    case "staff": {
      if (swing === 2) {
        PF(24, 18, 7, 1, WD);
        PF(31, 17, 3, 3, W);
        PF(32, 18, 1, 1, "#ffffff");
      } else if (swing === 1) {
        PF(23, 8, 1, 15, WD);
        PF(22, 3, 3, 3, W);
        PF(23, 4, 1, 1, "#ffffff");
      } else {
        PF(23, 10, 1, 17, WD);
        PF(22, 5, 3, 3, W);
        PF(23, 6, 1, 1, "#ffffff");
      }
      const sa = frame * 0.55;
      PF(Math.round(23.5 + Math.cos(sa) * 4.5), Math.round(6.5 + Math.sin(sa * 1.4) * 2.5), 1, 1, ACC);
      PF(Math.round(23.5 - Math.cos(sa) * 3.5), Math.round(6.5 - Math.sin(sa * 1.4) * 2), 1, 1, "#ffffff");
      break;
    }
    case "spear":
      if (swing === 1) {
        PF(24, 13, 8, 1, WD);
        PF(32, 12, 1, 1, W);
        PF(33, 12, 1, 3, W);
        PF(32, 11, 1, 1, "#fff7cc");
      } else if (swing === 2) {
        PF(24, 20, 8, 1, WD);
        PF(32, 19, 1, 1, W);
        PF(33, 19, 1, 3, W);
        PF(32, 18, 1, 1, "#fff7cc");
      } else {
        PF(23, 4, 1, 23, WD);
        PF(22, 3, 3, 1, W);
        PF(23, 1, 1, 2, W);
        PF(23, 1, 1, 1, "#fff7cc");
      }
      break;
    case "axe":
      if (swing === 1) {
        PF(24, 12, 5, 1, WD);
        PF(29, 9, 4, 6, W);
        PF(32, 10, 1, 4, "#ffffff");
      } else if (swing === 2) {
        PF(24, 18, 5, 1, WD);
        PF(29, 15, 4, 6, W);
        PF(32, 16, 1, 4, "#ffffff");
      } else {
        PF(23, 8, 1, 18, WD);
        PF(19, 9, 4, 6, W);
        PF(19, 9, 1, 6, "#ffffff");
      }
      break;
    case "hammer":
      if (swing === 1) {
        PF(24, 12, 6, 1, WD);
        PF(30, 8, 4, 7, W);
        PF(30, 8, 4, 2, ACC);
      } else if (swing === 2) {
        PF(24, 18, 6, 1, WD);
        PF(30, 14, 4, 7, W);
        PF(30, 14, 4, 2, ACC);
      } else {
        PF(23, 12, 1, 14, WD);
        PF(19, 7, 8, 5, W);
        PF(19, 7, 8, 2, ACC);
      }
      break;
    case "rifle":
      PF(19, 20, 2, 2, WD);
      PF(20, 18, 8, 3, WD);
      PF(22, 16, 3, 2, p.topDark);
      PF(28, 18, 4, 2, W);
      PF(32, 18, 1, 2, "#7dd3fc");
      if (swing === 1 || swing === 2) {
        PF(33, 17, 2, 4, "#ffffff");
        PF(33, 16, 1, 6, "#7dd3fc");
        PF(34, 18, 1, 2, ACC);
      }
      break;
    case "fist":
      if (swing === 1) {
        PF(23, 15, 3, 3, p.skin);
        PF(26, 16, 1, 1, "#ffffff");
        PF(21, 17, 2, 1, p.skin);
      } else if (swing === 2) {
        PF(23, 21, 3, 3, p.skin);
        PF(26, 22, 1, 1, "#ffffff");
        PF(21, 23, 2, 1, p.skin);
      } else {
        PF(21, 19, 3, 3, p.skin);
        PF(24, 20, 1, 1, "#ffffff");
        PF(8, 19, 3, 3, p.skin);
        PF(11, 20, 1, 1, "#ffffff");
      }
      break;
    case "claw":
      PF(19, 18, 2, 2, p.skin);
      if (swing === 1) {
        PF(22, 14, 1, 1, "#f8fafc");
        PF(23, 15, 1, 1, "#f8fafc");
        PF(22, 17, 1, 1, "#f8fafc");
      } else if (swing === 2) {
        PF(22, 18, 1, 1, "#f8fafc");
        PF(23, 19, 1, 1, "#f8fafc");
        PF(22, 21, 1, 1, "#f8fafc");
      } else {
        PF(22, 16, 1, 1, "#f8fafc");
        PF(23, 17, 1, 1, "#f8fafc");
        PF(22, 19, 1, 1, "#f8fafc");
      }
      break;
    default:
      break;
  }

  /* ---------- signature effect on both swing sub-frames ---------- */
  if (atk && (pose === 1 || pose === 2)) drawEffect(ctx, def.effect, u, p, pose === 2 ? 4 : 0, def.effectTint);
}

/* pixel arc (crescent) helper */
function drawArc(
  PX: (lx: number, ly: number, w: number, h: number, c: string) => void,
  cx: number, cy: number, r: number, a0: number, a1: number,
  outer: string, inner: string
) {
  const n = Math.max(6, Math.floor((a1 - a0) / 0.26));
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    PX(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1, outer);
  }
  const r2 = r - 2;
  for (let i = 0; i <= n; i++) {
    const a = a0 + 0.3 + ((a1 - a0 - 0.6) * i) / n;
    PX(Math.round(cx + Math.cos(a) * r2), Math.round(cy + Math.sin(a) * r2), 1, 1, inner);
  }
}

function drawEffect(
  ctx: CanvasRenderingContext2D,
  effect: PixelEffect,
  u: number,
  p: PixelPalette,
  dy: number, // shift down on the low-swing sub-frame
  tint?: string
) {
  const PX = (lx: number, ly: number, w: number, h: number, c: string) => {
    if (ly >= 30) return;
    const hh = Math.min(h, 30 - ly);
    ctx.fillStyle = c;
    ctx.fillRect(Math.round((lx - 13) * u), Math.round((ly - 30) * u), Math.max(1, Math.round(w * u)), Math.max(1, Math.round(hh * u)));
  };

  switch (effect) {
    case "slash":
      if (dy === 0) {
        drawArc(PX, 25, 15, 10, -2.3, 0.6, "#f87171", "#ffffff");
      } else {
        drawArc(PX, 26, 20, 10, -0.5, 2.5, "#f87171", "#ffffff");
      }
      PX(31, 8 + dy, 1, 1, "#ffffff");
      PX(32, 8 + dy, 1, 1, "#fca5a5");
      PX(31, 7 + dy, 1, 3, "#fecaca");
      break;
    case "arrows": {
      const main = tint || "#4ade80";
      const mid = 18 + dy;
      PX(22, mid - 1, 10, 3, main);
      PX(23, mid, 8, 1, "#ffffff");
      PX(32, mid - 2, 1, 5, main);
      PX(33, mid, 1, 1, "#ffffff");
      PX(24, mid - 4, 1, 1, "#ffffff");
      PX(24, mid + 4, 1, 1, "#ffffff");
      PX(20, mid, 1, 1, "#ffffff");
      PX(26, mid - 1, 1, 3, main);
      PX(25, mid - 4, 4, 1, main);
      PX(29, mid - 4, 1, 1, main);
      PX(25, mid + 4, 4, 1, main);
      PX(29, mid + 4, 1, 1, main);
      break;
    }
    case "orb": {
      const main = tint || p.accent;
      const mid = 18 + dy;
      PX(19, mid, 9, 1, main);
      PX(21, mid, 6, 1, "#ffffff");
      PX(28, mid - 2, 5, 5, main);
      PX(29, mid - 1, 3, 3, p.weapon);
      PX(30, mid, 1, 1, "#ffffff");
      PX(33, mid - 3, 1, 7, "#ffffff");
      PX(33, mid, 1, 1, main);
      PX(35, mid - 1, 1, 3, main);
      PX(32, mid - 4, 1, 1, main);
      PX(32, mid + 4, 1, 1, main);
      PX(26, mid - 4, 1, 1, main);
      PX(25, mid + 4, 1, 1, main);
      break;
    }
    case "burst":
      PX(28, 11 + dy, 1, 7, "#fbbf24");
      PX(28, 19 + dy, 1, 5, "#fbbf24");
      PX(22, 18 + dy, 6, 1, "#fbbf24");
      PX(29, 18 + dy, 6, 1, "#fbbf24");
      PX(24, 14 + dy, 1, 1, "#fde68a");
      PX(32, 14 + dy, 1, 1, "#fde68a");
      PX(24, 22 + dy, 1, 1, "#fde68a");
      PX(32, 22 + dy, 1, 1, "#fde68a");
      PX(28, 17 + dy, 1, 1, "#ffffff");
      break;
    case "spear": {
      const gold = tint || "#fbbf24";
      const mid = 18 + dy;
      drawArc(PX, 25, mid, 10, -2.3, 0.6, gold, "#fde68a");
      drawArc(PX, 26, mid, 4, 0, 6.4, gold, "#fff7cc");
      PX(31, mid - 7, 1, 6, gold);
      PX(33, mid - 5, 1, 4, gold);
      PX(31, mid - 8, 1, 1, "#ffffff");
      PX(33, mid - 6, 1, 1, "#ffffff");
      PX(28, mid - 8, 1, 1, "#ffffff");
      PX(30, mid - 9, 1, 1, gold);
      PX(35, mid, 1, 1, "#ffffff");
      break;
    }
    case "rocks": {
      const red = tint || "#f87171";
      if (dy === 0) {
        drawArc(PX, 25, 15, 10, -2.3, 0.6, red, "#ffffff");
      } else {
        drawArc(PX, 26, 19, 10, -0.5, 2.6, red, "#ffffff");
      }
      PX(29, 12 + dy, 2, 2, "#9ca3af");
      PX(29, 12 + dy, 1, 1, "#d1d5db");
      PX(32, 17 + dy, 2, 2, "#6b7280");
      PX(27, 23 + dy, 2, 2, "#9ca3af");
      PX(23, 20 + dy, 2, 2, "#6b7280");
      PX(31, 12 + dy, 1, 1, red);
      PX(28, 25 + dy, 1, 1, red);
      PX(34, 17 + dy, 1, 1, red);
      PX(25, 20 + dy, 1, 1, red);
      PX(30, 10 + dy, 1, 1, "#fca5a5");
      PX(35, 20 + dy, 1, 1, "#fca5a5");
      PX(30, 26 + dy, 1, 1, "#fca5a5");
      break;
    }
    case "cross": {
      const pink = tint || "#f472b6";
      const mid = 18 + dy;
      for (let i = -6; i <= 6; i++) {
        PX(28 + i, mid + i, 1, 1, pink);
        PX(28 + i, mid - i, 1, 1, pink);
      }
      PX(28, mid - 1, 1, 3, "#ffffff");
      PX(27, mid, 3, 1, "#ffffff");
      PX(28, mid, 1, 1, "#fff7cc");
      drawArc(PX, 21, mid, 5, 1.1, 4.6, pink, "#fbcfe8");
      drawArc(PX, 35, mid, 4, -1.9, 1.6, pink, "#fbcfe8");
      PX(17, mid - 5, 1, 1, "#fbcfe8");
      PX(38, mid + 5, 1, 1, "#fbcfe8");
      break;
    }
    case "laser": {
      const blue = tint || "#38bdf8";
      const mid = 18 + dy;
      PX(22, mid, 12, 1, blue);
      PX(23, mid, 10, 1, "#ffffff");
      PX(34, mid - 3, 1, 7, blue);
      PX(31, mid, 7, 1, blue);
      PX(34, mid, 1, 1, "#ffffff");
      PX(36, mid - 2, 1, 1, "#ffffff");
      PX(36, mid + 2, 1, 1, "#ffffff");
      PX(32, mid - 2, 1, 1, "#7dd3fc");
      PX(32, mid + 2, 1, 1, "#7dd3fc");
      PX(20, mid + 3, 2, 1, "#fbbf24");
      PX(19, mid + 4, 1, 1, "#f59e0b");
      break;
    }
    case "flame": {
      const fire = tint || "#f97316";
      const mid = 18 + dy;
      drawArc(PX, 26, mid, 9, -2.2, 0.8, fire, "#fbbf24");
      PX(28, mid - 2, 2, 2, "#fbbf24");
      PX(29, mid, 1, 2, "#ffffff");
      PX(30, mid - 5, 1, 2, fire);
      PX(31, mid - 3, 1, 2, fire);
      PX(27, mid + 3, 1, 2, fire);
      PX(25, mid + 1, 1, 2, fire);
      PX(33, mid - 1, 1, 1, "#fde68a");
      PX(32, mid + 3, 1, 1, "#fde68a");
      break;
    }
    case "dash":
      PX(23, 14 + dy, 6, 1, "#a855f7");
      PX(22, 18 + dy, 9, 1, "#c084fc");
      PX(24, 22 + dy, 5, 1, "#a855f7");
      PX(31, 14 + dy, 1, 1, "#e9d5ff");
      PX(32, 18 + dy, 1, 1, "#e9d5ff");
      PX(30, 22 + dy, 1, 1, "#e9d5ff");
      break;
    case "spirit": {
      const teal = tint || "#5eead4";
      const mid = 17 + dy;
      // main spirit skull (with face)
      PX(27, mid - 2, 5, 4, teal);
      PX(28, mid - 1, 1, 1, "#042f2e");
      PX(30, mid - 1, 1, 1, "#042f2e");
      PX(29, mid + 1, 1, 1, "#042f2e");
      // glowing halo
      PX(27, mid - 4, 5, 1, "#ccfbf1");
      // summoning ring
      drawArc(PX, 29, mid + 6, 4, 0.3, 5.9, teal, "#ccfbf1");
      // small trailing spirits
      PX(23, mid, 2, 2, teal);
      PX(33, mid + 2, 2, 2, teal);
      PX(24, mid - 3, 1, 1, "#ccfbf1");
      PX(34, mid - 1, 1, 1, "#ccfbf1");
      break;
    }
    case "shadecut": {
      const purple = tint || "#a855f7";
      const mid = 18 + dy;
      drawArc(PX, 26, mid, 10, -2.2, 0.7, purple, "#e9d5ff");
      PX(19, mid, 6, 1, "#7c3aed");
      PX(17, mid, 2, 1, purple);
      PX(33, mid - 3, 1, 7, purple);
      PX(30, mid, 7, 1, purple);
      PX(33, mid, 1, 1, "#ffffff");
      PX(32, mid - 2, 1, 1, "#e9d5ff");
      PX(32, mid + 2, 1, 1, "#e9d5ff");
      PX(21, mid + 4, 2, 1, "#4c1d95");
      PX(24, mid + 5, 2, 1, "#3b0764");
      PX(22, mid + 5, 1, 1, "#5b21b6");
      break;
    }
    default:
      break;
  }
}
