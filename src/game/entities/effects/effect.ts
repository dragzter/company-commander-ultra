export const EFFECT_TYPES = {
  heal: "heal",
  damage: "damage",
  buff: "buff",
  debuff: "debuff",
} as const;

export const EFFECT_RESULTS = {
  panic: "panic",
  stun: "stun",
  smoked: "smoked",
  burning: "burning",
  blinded: "blinded",
  suppressed: "suppressed",
  suppression: "suppression",
  confusion: "confusion",
  adrenaline_boost: "adrenaline_boost",
  healing: "healing",
  attack_speed: "attack_speed",
  recovery: "recovery",
  focus: "focus",
  fatigue: "fatigue",
  bleed: "bleed",
  burn: "burn",
  poison: "poison",
  cleansing: "cleansing",
  concealment: "concealment",
} as const;

export type EffectType = keyof typeof EFFECT_TYPES;

export type EffectResult = keyof typeof EFFECT_RESULTS;
