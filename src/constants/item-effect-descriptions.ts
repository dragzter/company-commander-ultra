/** Human-readable effect descriptions for item popups. Descriptions are for flavor; effects explain mechanics. */
export const ITEM_EFFECT_DESCRIPTIONS: Record<string, string> = {
  /* Throwables - only items with specific effects (burn, stun, etc.); frag/knife use description */
  m84_flashbang:
    "Primary target stunned for 4 seconds. Adjacent targets stunned for 2 seconds.",
  mk18_smoke:
    "Primary target: −40% accuracy, +5% evasion for 5 seconds. Adjacent targets: −10% accuracy for 5 seconds.",
  incendiary_grenade:
    "Primary target: 8 damage per tick, every 1 second, for 4 seconds. Burns ignore armor. Adjacent targets suffer half duration and half damage per tick.",
  nbc_neutralizer: "Cleanses Nuclear, Biological, and Chemical debuffs from allies in the area.",
  nerve_gas_detonator:
    "Primary target: 20 poison damage per tick for 2 ticks. Adjacent: half duration and damage.",
  rad_emitter:
    "Primary target: 5 radiation damage per tick for 4 ticks. Adjacent: half duration and damage.",
  psychic_shredder:
    "Primary target: Panic for 6 seconds. Adjacent targets: Panic for 3 seconds.",
  m99_sticky_grenade:
    "Sticks to target. 80 explosive damage to a single enemy. No splash.",
  /* Medical */
  stim_pack: "+50% attack speed for 10 seconds.",
  standard_medkit: "Restores 20 HP immediately.",
  orange_stim_pack: "Restores 40 HP immediately.",
  adrenaline_injection:
    "Restores 12 HP per tick for 3 ticks. While active: increased initiative and evasion, reduced accuracy.",
  substance_m:
    "Revives incapacitated ally and restores 30 HP per tick for 4 ticks. Massive damage resistance while active. High risk of death.",
};

export function getItemEffectDescription(item: { id?: string }): string | null {
  if (!item?.id) return null;
  return ITEM_EFFECT_DESCRIPTIONS[item.id] ?? null;
}
