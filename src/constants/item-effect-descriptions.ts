/** Structured effect: primary + optional adjacent for area grenades. */
export interface StructuredEffect {
  primary: string;
  adjacent?: string;
}

/** Single-target or simple effect (no primary/adjacent split). */
export interface SimpleEffect {
  effect: string;
}

export type EffectDescription = string | StructuredEffect | SimpleEffect;

/** Human-readable effect descriptions for item popups. Use structured format for area grenades. */
export const ITEM_EFFECT_DESCRIPTIONS: Record<string, EffectDescription> = {
  /* Throwables – area effect (primary + adjacent) */
  m84_flashbang: {
    primary: "Stunned for 4 seconds.",
    adjacent: "Stunned for 2 seconds.",
  },
  mk18_smoke: {
    primary: "−40% accuracy, +5% evasion for 5 seconds.",
    adjacent: "−10% accuracy for 5 seconds.",
  },
  incendiary_grenade: {
    primary: "8 damage per tick, 1s interval, 4 seconds. Ignores armor.",
    adjacent: "Half duration, half damage per tick.",
  },
  nerve_gas_detonator: {
    primary: "20 poison damage per tick for 2 ticks.",
    adjacent: "Half duration and damage.",
  },
  rad_emitter: {
    primary: "5 radiation damage per tick for 4 ticks.",
    adjacent: "Half duration and damage.",
  },
  psychic_shredder: {
    primary: "Panic for 6 seconds.",
    adjacent: "Panic for 3 seconds.",
  },
  m3a_repressor: {
    primary: "10 damage, 80% toughness reduction for 8 seconds.",
    adjacent: "20% toughness reduction for 4 seconds. No damage.",
  },
  m3_frag_grenade: {
    primary: "Explosive damage (30 or 45).",
    adjacent: "50% splash damage.",
  },
  /* Throwables – single target */
  nbc_neutralizer: { effect: "Cleanses Nuclear, Biological, and Chemical debuffs from allies in the area." },
  m99_sticky_grenade: { effect: "80 explosive damage to a single enemy. No splash." },
  tk21_throwing_knife: { effect: "20 kinetic damage to a single enemy. No splash. Uses thrower's accuracy." },
  /* Medical */
  stim_pack: { effect: "+50% attack speed for 10 seconds." },
  standard_medkit: { effect: "Restores 20 HP immediately." },
  orange_stim_pack: { effect: "Restores 40 HP immediately." },
  adrenaline_injection: {
    effect: "Restores 12 HP per tick for 3 ticks. While active: increased initiative and evasion, reduced accuracy.",
  },
  substance_m: {
    effect:
      "Revives incapacitated ally and restores 30 HP per tick for 4 ticks. Massive damage resistance while active.",
  },
};

function isStructuredEffect(d: EffectDescription): d is StructuredEffect {
  return typeof d === "object" && d !== null && "primary" in d;
}

function isSimpleEffect(d: EffectDescription): d is SimpleEffect {
  return typeof d === "object" && d !== null && "effect" in d;
}

export function getItemEffectDescription(item: { id?: string }): EffectDescription | null {
  if (!item?.id) return null;
  return ITEM_EFFECT_DESCRIPTIONS[item.id] ?? null;
}

/** Render effect description as HTML string for popup. */
export function renderEffectDescriptionHtml(desc: EffectDescription, escapeHtml: (s: string) => string): string {
  if (typeof desc === "string") {
    return `<p class="item-popup-effect-text">${escapeHtml(desc)}</p>`;
  }
  if (isStructuredEffect(desc)) {
    let html = '<div class="item-effect-structured">';
    html += `<div class="item-effect-row item-effect-primary"><span class="item-effect-label">Primary</span><span class="item-effect-value">${escapeHtml(desc.primary)}</span></div>`;
    if (desc.adjacent) {
      html += `<div class="item-effect-row item-effect-adjacent"><span class="item-effect-label">Adjacent</span><span class="item-effect-value">${escapeHtml(desc.adjacent)}</span></div>`;
    }
    html += "</div>";
    return html;
  }
  if (isSimpleEffect(desc)) {
    return `<p class="item-popup-effect-text">${escapeHtml(desc.effect)}</p>`;
  }
  return "";
}
