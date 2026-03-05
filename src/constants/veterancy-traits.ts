import type {
  Soldier,
  SoldierTraitProfile,
  SoldierVeterancyStats,
} from "../game/entities/types.ts";

export type EarnedTraitKind = "positive" | "mixed" | "severe";

export type EarnedTraitRequirement = {
  missionsCompletedMin?: number;
  grenadeThrowsMin?: number;
  grenadeHitsMin?: number;
  turnsBelow20HpMin?: number;
  missionsWithBelow20HpMin?: number;
  incapacitationsMin?: number;
};

export type EarnedTraitDefinition = {
  id: string;
  name: string;
  kind: EarnedTraitKind;
  flavor: string;
  description: string;
  stats?: SoldierTraitProfile;
  grenadeHitBonusPct?: number;
  requirements?: EarnedTraitRequirement;
};

export type EarnedTraitAward = {
  id: string;
  name: string;
  kind: EarnedTraitKind;
  flavor: string;
  description: string;
  stats: SoldierTraitProfile;
  grenadeHitBonusPct: number;
};

type DefInit = Omit<EarnedTraitDefinition, "description">;
const mk = (d: DefInit): EarnedTraitDefinition => ({
  ...d,
  description: d.name,
});

export const POSITIVE_VETERANCY_TRAITS: EarnedTraitDefinition[] = [
  mk({
    id: "hard_to_kill",
    name: "Hard To Kill",
    kind: "positive",
    flavor: "Refuses to go down clean.",
    stats: { toughness: 4 },
    requirements: { missionsCompletedMin: 10, missionsWithBelow20HpMin: 3 },
  }),
  mk({
    id: "grenadier",
    name: "Grenadier",
    kind: "positive",
    flavor: "Knows exactly where to place the blast.",
    grenadeHitBonusPct: 0.02,
    requirements: { grenadeThrowsMin: 25 },
  }),
  mk({
    id: "thousand_yard_stare",
    name: "Thousand Yard Stare",
    kind: "positive",
    flavor: "Sees danger before it arrives.",
    stats: { awareness: 4, dexterity: 2 },
    requirements: { missionsCompletedMin: 35 },
  }),
  mk({
    id: "steady_hands",
    name: "Steady Hands",
    kind: "positive",
    flavor: "No shake, no hesitation.",
    stats: { dexterity: 3 },
    requirements: { missionsCompletedMin: 18 },
  }),
  mk({
    id: "combat_reader",
    name: "Combat Reader",
    kind: "positive",
    flavor: "Reads movement like open text.",
    stats: { awareness: 4 },
    requirements: { missionsCompletedMin: 20 },
  }),
  mk({
    id: "calm_under_fire",
    name: "Calm Under Fire",
    kind: "positive",
    flavor: "Chaos does not rattle them.",
    stats: { morale: 5 },
    requirements: { missionsCompletedMin: 15 },
  }),
  mk({
    id: "iron_nerves",
    name: "Iron Nerves",
    kind: "positive",
    flavor: "Pressure hardens, doesn't crack.",
    stats: { morale: 3, toughness: 2 },
    requirements: { missionsWithBelow20HpMin: 2 },
  }),
  mk({
    id: "field_survivor",
    name: "Field Survivor",
    kind: "positive",
    flavor: "Came back too many times to count.",
    stats: { hit_points: 20, toughness: 2 },
    requirements: { missionsWithBelow20HpMin: 4 },
  }),
  mk({
    id: "quick_recovery",
    name: "Quick Recovery",
    kind: "positive",
    flavor: "Resets fast after every hit.",
    stats: { dexterity: 2, awareness: 2 },
    requirements: { missionsCompletedMin: 20 },
  }),
  mk({
    id: "close_call_veteran",
    name: "Close Call Veteran",
    kind: "positive",
    flavor: "Near-death became routine.",
    stats: { toughness: 3, morale: 1 },
    requirements: { turnsBelow20HpMin: 20 },
  }),
  mk({
    id: "trench_fighter",
    name: "Trench Fighter",
    kind: "positive",
    flavor: "Dirty fights made a durable soldier.",
    stats: { dexterity: 2, toughness: 2 },
    requirements: { missionsCompletedMin: 22 },
  }),
  mk({
    id: "reliable_trigger",
    name: "Reliable Trigger",
    kind: "positive",
    flavor: "Delivers when timing matters.",
    stats: { awareness: 2, dexterity: 2 },
    requirements: { missionsCompletedMin: 18 },
  }),
  mk({
    id: "squad_anchor",
    name: "Squad Anchor",
    kind: "positive",
    flavor: "Others stand taller nearby.",
    stats: { morale: 4 },
    requirements: { missionsCompletedMin: 25 },
  }),
  mk({
    id: "battle_tempo",
    name: "Battle Tempo",
    kind: "positive",
    flavor: "Moves with the rhythm of firefight.",
    stats: { dexterity: 2, awareness: 1, morale: 1 },
    requirements: { missionsCompletedMin: 25 },
  }),
  mk({
    id: "shock_resistant",
    name: "Shock Resistant",
    kind: "positive",
    flavor: "Impact phases them less each time.",
    stats: { toughness: 3, awareness: 1 },
    requirements: { missionsCompletedMin: 16 },
  }),
  mk({
    id: "coolheaded",
    name: "Coolheaded",
    kind: "positive",
    flavor: "Thinks clearer under pressure.",
    stats: { awareness: 3, morale: 2 },
    requirements: { missionsCompletedMin: 24 },
  }),
  mk({
    id: "relentless_push",
    name: "Relentless",
    kind: "positive",
    flavor: "Never loses the will to push.",
    stats: { toughness: 2, morale: 2 },
    requirements: { missionsCompletedMin: 28 },
  }),
  mk({
    id: "watchful_eye",
    name: "Watchful Eye",
    kind: "positive",
    flavor: "Misses very little.",
    stats: { awareness: 5 },
    requirements: { missionsCompletedMin: 30 },
  }),
  mk({
    id: "hardened_frame",
    name: "Hardened Frame",
    kind: "positive",
    flavor: "Body adapted to punishment.",
    stats: { hit_points: 25 },
    requirements: { missionsCompletedMin: 26 },
  }),
  mk({
    id: "tactical_patience",
    name: "Tactical Patience",
    kind: "positive",
    flavor: "Waits for the right opening.",
    stats: { awareness: 2, toughness: 2 },
    requirements: { missionsCompletedMin: 24 },
  }),
  mk({
    id: "veteran_instincts",
    name: "Veteran Instincts",
    kind: "positive",
    flavor: "Acts before thought catches up.",
    stats: { dexterity: 2, awareness: 3 },
    requirements: { missionsCompletedMin: 40 },
  }),
  mk({
    id: "line_holder",
    name: "Line Holder",
    kind: "positive",
    flavor: "Held where others broke.",
    stats: { toughness: 3, morale: 2 },
    requirements: { missionsCompletedMin: 22 },
  }),
  mk({
    id: "utility_expert",
    name: "Utility Expert",
    kind: "positive",
    flavor: "Tools become extensions of intent.",
    grenadeHitBonusPct: 0.01,
    stats: { awareness: 1 },
    requirements: { grenadeThrowsMin: 18 },
  }),
  mk({
    id: "breachers_nerve",
    name: "Breacher's Nerve",
    kind: "positive",
    flavor: "Fast entry, no freeze.",
    stats: { dexterity: 2, morale: 2 },
    requirements: { missionsCompletedMin: 20 },
  }),
  mk({
    id: "fire_discipline",
    name: "Fire Discipline",
    kind: "positive",
    flavor: "Measured shots, better outcomes.",
    stats: { awareness: 2, dexterity: 1 },
    requirements: { missionsCompletedMin: 15 },
  }),
  mk({
    id: "combat_fit",
    name: "Combat Fit",
    kind: "positive",
    flavor: "Conditioned for long pushes.",
    stats: { hit_points: 15, dexterity: 2 },
    requirements: { missionsCompletedMin: 30 },
  }),
  mk({
    id: "focused_operator",
    name: "Focused Operator",
    kind: "positive",
    flavor: "Locks onto priority threats.",
    stats: { awareness: 3, morale: 1 },
    requirements: { missionsCompletedMin: 28 },
  }),
  mk({
    id: "forward_pressure",
    name: "Forward Pressure",
    kind: "positive",
    flavor: "Maintains momentum in bad ground.",
    stats: { dexterity: 2, morale: 2 },
    requirements: { missionsCompletedMin: 32 },
  }),
  mk({
    id: "last_one_standing",
    name: "Last One Standing",
    kind: "positive",
    flavor: "Learned to survive alone.",
    stats: { toughness: 3, awareness: 3 },
    requirements: { missionsCompletedMin: 45 },
  }),
  mk({
    id: "combat_lucky",
    name: "Combat Lucky",
    kind: "positive",
    flavor: "Escaped one too many fatal shots.",
    stats: { morale: 2, awareness: 2 },
    requirements: { missionsWithBelow20HpMin: 5 },
  }),
];

export const MIXED_VETERANCY_TRAITS: EarnedTraitDefinition[] = [
  mk({
    id: "shattered_kneecap",
    name: "Shattered Kneecap",
    kind: "mixed",
    flavor: "The knee healed wrong, the grit didn't.",
    stats: { dexterity: -4, toughness: 1 },
    requirements: { incapacitationsMin: 1 },
  }),
  mk({
    id: "determined",
    name: "Determined",
    kind: "mixed",
    flavor: "Pain sharpened attention.",
    stats: { awareness: 3, dexterity: -2 },
    requirements: { incapacitationsMin: 1 },
  }),
  mk({
    id: "nerve_damage",
    name: "Nerve Damage",
    kind: "mixed",
    flavor: "Fine control never fully returned.",
    stats: { dexterity: -3 },
    requirements: { incapacitationsMin: 1 },
  }),
  mk({
    id: "ringing_ears",
    name: "Ringing Ears",
    kind: "mixed",
    flavor: "The blast never truly faded.",
    stats: { awareness: -3 },
    requirements: { incapacitationsMin: 1 },
  }),
  mk({
    id: "tremors",
    name: "Tremors",
    kind: "mixed",
    flavor: "Micro-shakes at the worst moments.",
    stats: { dexterity: -2, awareness: -1 },
    requirements: { incapacitationsMin: 1 },
  }),
  mk({
    id: "bad_shoulder",
    name: "Bad Shoulder",
    kind: "mixed",
    flavor: "Weak aim, stronger tolerance.",
    stats: { dexterity: -2, toughness: 1 },
    requirements: { incapacitationsMin: 1 },
  }),
  mk({
    id: "chronic_pain",
    name: "Chronic Pain",
    kind: "mixed",
    flavor: "Hurts every day, fights anyway.",
    stats: { morale: -2, toughness: 1 },
    requirements: { incapacitationsMin: 1 },
  }),
  mk({
    id: "fractured_rib",
    name: "Fractured Rib",
    kind: "mixed",
    flavor: "Breathing shallow, resolve deeper.",
    stats: { hit_points: -10, toughness: 1 },
    requirements: { incapacitationsMin: 1 },
  }),
  mk({
    id: "lung_scarring",
    name: "Lung Scarring",
    kind: "mixed",
    flavor: "Endurance faded after the smoke.",
    stats: { hit_points: -15, morale: -1 },
    requirements: { incapacitationsMin: 1 },
  }),
  mk({
    id: "hesitant_step",
    name: "Hesitant Step",
    kind: "mixed",
    flavor: "Second-guesses movement under fire.",
    stats: { dexterity: -2, morale: -1 },
    requirements: { incapacitationsMin: 1 },
  }),
  mk({
    id: "grim_outlook",
    name: "Grim Outlook",
    kind: "mixed",
    flavor: "Expects the worst now.",
    stats: { morale: -4 },
    requirements: { incapacitationsMin: 1 },
  }),
  mk({
    id: "sleep_deprived",
    name: "Sleep Deprived",
    kind: "mixed",
    flavor: "Never fully rested again.",
    stats: { awareness: -2, morale: -1 },
    requirements: { incapacitationsMin: 1 },
  }),
  mk({
    id: "hypervigilant",
    name: "Hypervigilant",
    kind: "mixed",
    flavor: "Sees everything, trusts nothing.",
    stats: { awareness: 2, morale: -2 },
    requirements: { incapacitationsMin: 1 },
  }),
  mk({
    id: "scarred_resolve",
    name: "Scarred Resolve",
    kind: "mixed",
    flavor: "Hard shell, worn spirit.",
    stats: { toughness: 2, morale: -2 },
    requirements: { incapacitationsMin: 1 },
  }),
  mk({
    id: "mistrustful",
    name: "Mistrustful",
    kind: "mixed",
    flavor: "Watches allies as hard as enemies.",
    stats: { morale: -3, awareness: 1 },
    requirements: { incapacitationsMin: 1 },
  }),
  mk({
    id: "slow_healer",
    name: "Slow Healer",
    kind: "mixed",
    flavor: "Some wounds stay open longer.",
    stats: { hit_points: -10 },
    requirements: { incapacitationsMin: 1 },
  }),
  mk({
    id: "reactive_flinch",
    name: "Reactive Flinch",
    kind: "mixed",
    flavor: "Jolts first, adjusts fast.",
    stats: { dexterity: -2, awareness: 1 },
    requirements: { incapacitationsMin: 1 },
  }),
  mk({
    id: "cautious_fault",
    name: "Cautious to a Fault",
    kind: "mixed",
    flavor: "Safer choices, slower actions.",
    stats: { toughness: 2, dexterity: -2 },
    requirements: { incapacitationsMin: 1 },
  }),
  mk({
    id: "burn_scars",
    name: "Burn Scars",
    kind: "mixed",
    flavor: "Skin marked, will hardened.",
    stats: { hit_points: -15, morale: 1 },
    requirements: { incapacitationsMin: 1 },
  }),
  mk({
    id: "old_concussion",
    name: "Old Concussion",
    kind: "mixed",
    flavor: "Focus drifts at bad times.",
    stats: { awareness: -2, dexterity: -1 },
    requirements: { incapacitationsMin: 1 },
  }),
  mk({
    id: "survivors_guilt",
    name: "Survivor's Guilt",
    kind: "mixed",
    flavor: "Carries names into every fight.",
    stats: { morale: -3, toughness: 1 },
    requirements: { missionsCompletedMin: 20 },
  }),
  mk({
    id: "permanent_limp",
    name: "Permanent Limp",
    kind: "mixed",
    flavor: "Speed is gone for good.",
    stats: { dexterity: -3 },
    requirements: { incapacitationsMin: 1 },
  }),
  mk({
    id: "trigger_freeze",
    name: "Trigger Freeze",
    kind: "mixed",
    flavor: "Momentary lock under pressure.",
    stats: { dexterity: -2, morale: -2 },
    requirements: { incapacitationsMin: 1 },
  }),
  mk({
    id: "hardened_cynic",
    name: "Hardened Cynic",
    kind: "mixed",
    flavor: "Not inspired, but never naive.",
    stats: { morale: -2, awareness: 2 },
    requirements: { missionsCompletedMin: 25 },
  }),
  mk({
    id: "fragile_confidence",
    name: "Fragile Confidence",
    kind: "mixed",
    flavor: "Can still move, doesn't trust it.",
    stats: { morale: -3, dexterity: 1 },
    requirements: { incapacitationsMin: 1 },
  }),
  mk({
    id: "stiff_joints",
    name: "Stiff Joints",
    kind: "mixed",
    flavor: "Mobility traded for durability.",
    stats: { dexterity: -2, toughness: 1 },
    requirements: { missionsCompletedMin: 20 },
  }),
  mk({
    id: "blunt_trauma",
    name: "Blunt Trauma",
    kind: "mixed",
    flavor: "Body took a permanent hit.",
    stats: { hit_points: -20 },
    requirements: { incapacitationsMin: 1 },
  }),
  mk({
    id: "tunnel_vision",
    name: "Tunnel Vision",
    kind: "mixed",
    flavor: "Fast hands, narrow view.",
    stats: { dexterity: 2, awareness: -3 },
    requirements: { missionsCompletedMin: 18 },
  }),
  mk({
    id: "overcompensating",
    name: "Overcompensating",
    kind: "mixed",
    flavor: "Pushes confidence to hide doubt.",
    stats: { morale: 2, awareness: -2 },
    requirements: { missionsCompletedMin: 18 },
  }),
  mk({
    id: "one_bad_leg",
    name: "One Bad Leg",
    kind: "mixed",
    flavor: "Can't move well, won't move back.",
    stats: { dexterity: -4, toughness: 2 },
    requirements: { incapacitationsMin: 1 },
  }),
];

export const SEVERE_INCAP_TRAITS: EarnedTraitDefinition[] = [
  mk({
    id: "crushed_hip",
    name: "Crushed Hip",
    kind: "severe",
    flavor: "Every step reminds them of that day.",
    stats: { dexterity: -10, hit_points: -20 },
    requirements: { incapacitationsMin: 2 },
  }),
  mk({
    id: "shattered_spine",
    name: "Shattered Spine",
    kind: "severe",
    flavor: "Movement is pain; reaction is delayed.",
    stats: { dexterity: -8, awareness: -6, hit_points: -25 },
    requirements: { incapacitationsMin: 2 },
  }),
  mk({
    id: "nerve_burnout",
    name: "Nerve Burnout",
    kind: "severe",
    flavor: "Signals don't travel like they used to.",
    stats: { awareness: -7, dexterity: -5 },
    requirements: { incapacitationsMin: 2 },
  }),
  mk({
    id: "collapsed_lung",
    name: "Collapsed Lung",
    kind: "severe",
    flavor: "Breath comes short, confidence shorter.",
    stats: { hit_points: -40, morale: -3 },
    requirements: { incapacitationsMin: 2 },
  }),
  mk({
    id: "traumatic_brain_injury",
    name: "Traumatic Brain Injury",
    kind: "severe",
    flavor: "Names blur, threats blur, moments blur.",
    stats: { awareness: -8, morale: -4 },
    requirements: { incapacitationsMin: 2 },
  }),
  mk({
    id: "permanent_tremor",
    name: "Permanent Tremor",
    kind: "severe",
    flavor: "The hand won't hold steady under pressure.",
    stats: { dexterity: -9, awareness: -2 },
    requirements: { incapacitationsMin: 2 },
  }),
  mk({
    id: "broken_confidence",
    name: "Broken Confidence",
    kind: "severe",
    flavor: "They still show up, just not with the same fire.",
    stats: { morale: -10, dexterity: -2 },
    requirements: { incapacitationsMin: 2 },
  }),
  mk({
    id: "ravaged_joints",
    name: "Ravaged Joints",
    kind: "severe",
    flavor: "Armor weighs more when your body fights back.",
    stats: { dexterity: -6, toughness: -4, hit_points: -15 },
    requirements: { incapacitationsMin: 2 },
  }),
  mk({
    id: "fragment_retention",
    name: "Fragment Retention",
    kind: "severe",
    flavor: "Shrapnel stayed. So did the lesson.",
    stats: { hit_points: -20, awareness: -4, toughness: 1 },
    requirements: { incapacitationsMin: 2 },
  }),
  mk({
    id: "war_worn_ruin",
    name: "War-Worn Ruin",
    kind: "severe",
    flavor: "A veteran body carrying too many unfinished battles.",
    stats: { dexterity: -6, awareness: -6, morale: -6, hit_points: -20 },
    requirements: { incapacitationsMin: 3 },
  }),
];

export const ALL_EARNED_TRAITS: Record<string, EarnedTraitDefinition> =
  Object.fromEntries(
    [
      ...POSITIVE_VETERANCY_TRAITS,
      ...MIXED_VETERANCY_TRAITS,
      ...SEVERE_INCAP_TRAITS,
    ].map((d) => [d.id, d]),
  );

export function getEarnedTraitById(
  id: string | undefined,
): EarnedTraitDefinition | undefined {
  if (!id) return undefined;
  return ALL_EARNED_TRAITS[id];
}

export function getSoldierVeterancyDefaults(): SoldierVeterancyStats {
  return {
    veterancyXp: 0,
    checkpointCursor: 0,
    failedTraitRolls: 0,
    grenadeThrows: 0,
    grenadeHits: 0,
    turnsBelow20Hp: 0,
    missionsWithBelow20Hp: 0,
    incapacitations: 0,
  };
}

export function getOwnedEarnedTraitSet(soldier: Soldier): Set<string> {
  return new Set(
    (soldier.earnedTraitIds ?? []).filter(
      (id) => typeof id === "string" && id.length > 0,
    ),
  );
}

export function toEarnedTraitAward(
  def: EarnedTraitDefinition,
): EarnedTraitAward {
  return {
    id: def.id,
    name: def.name,
    kind: def.kind,
    flavor: def.flavor,
    description: def.description,
    stats: { ...(def.stats ?? {}) },
    grenadeHitBonusPct: def.grenadeHitBonusPct ?? 0,
  };
}
