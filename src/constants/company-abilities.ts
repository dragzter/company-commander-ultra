import type { Attributes } from "../game/entities/types.ts";
import { COMPANY_LEVEL_PROGRESSION } from "./company-progression.ts";

export type CompanyAbilityId =
  | "focused_fire"
  | "improved_focused_fire"
  | "emergency_medevac"
  | "trauma_response"
  | "infantry_armor"
  | "advanced_field_medicine"
  | "advanced_tactical_training"
  | "targeting_optics"
  | "gunnery"
  | "entrenchment_techniques"
  | "fire_and_maneuver"
  | "grenadier_training"
  | "artillery_barrage"
  | "dig_in"
  | "napalm_barrage"
  | "battle_fervor";

export type CompanyAbilityKind = "active" | "passive";

export interface CompanyAbilityDef {
  id: CompanyAbilityId;
  kind: CompanyAbilityKind;
  name: string;
  short: string;
  description: string;
  icon: string;
  cooldownSeconds?: number;
}

export interface CompanyAbilityNode {
  level: number;
  autoGrant?: CompanyAbilityId;
  choice?: readonly CompanyAbilityId[];
}

export const COMPANY_ABILITY_DEFS: Record<CompanyAbilityId, CompanyAbilityDef> =
  {
    focused_fire: {
      id: "focused_fire",
      kind: "active",
      name: "Focused Fire",
      short: "All allies focus one enemy for 8s.",
      description:
        "Select one enemy. All player soldiers retarget that unit for 8s (even if it enters cover).",
      icon: "/images/scan.png",
      cooldownSeconds: 75,
    },
    improved_focused_fire: {
      id: "improved_focused_fire",
      kind: "passive",
      name: "Improved Focused Fire",
      short: "Focused Fire increases damage by 20% while active.",
      description: "Focused Fire increases damage by 20% for its duration.",
      icon: "/images/imp_focus.png",
    },
    emergency_medevac: {
      id: "emergency_medevac",
      kind: "active",
      name: "Emergency Medevac",
      short: "Immediate extraction. Ends mission with no quit penalty.",
      description:
        "Immediately extract your squad from combat and end the mission. " +
        "Soldiers keep combat-earned XP only. Mission completion XP, credits, reward items, and loot are forfeited. " +
        "No quit-mission penalties or negative extraction effects are applied.",
      icon: "/images/med_evac.png",
      cooldownSeconds: 3_600,
    },
    trauma_response: {
      id: "trauma_response",
      kind: "active",
      name: "Trauma Response",
      short: "Heal all allies over 4 ticks (12-24% max HP each).",
      description:
        "Applies a squad-wide heal-over-time: 4 ticks, each tick heals 12-24% max HP and causes a brief recovery pulse.",
      icon: "/images/trauma.png",
      cooldownSeconds: 1_800,
    },
    infantry_armor: {
      id: "infantry_armor",
      kind: "active",
      name: "Infantry Armor",
      short: "All allies gain +50% mitigation for 15s (can overcap).",
      description:
        "For 15 seconds, all living soldiers in the squad gain +50% mitigation. This bonus can exceed normal mitigation cap.",
      icon: "/images/inf_armor.png",
      cooldownSeconds: 1_800,
    },
    advanced_tactical_training: {
      id: "advanced_tactical_training",
      kind: "passive",
      name: "Advanced Tactical Training",
      short: "+4 DEX/MOR/AWR/TGH for all current and future soldiers.",
      description:
        "+4 DEX, +4 MOR, +4 AWR, +4 TGH for all current and future soldiers.",
      icon: "/images/advanced_t_t.png",
    },
    targeting_optics: {
      id: "targeting_optics",
      kind: "passive",
      name: "Targeting Optics",
      short: "+1% hit chance for all current and future soldiers.",
      description:
        "+1% chance to hit for all current and future soldiers.",
      icon: "/images/optics.png",
    },
    gunnery: {
      id: "gunnery",
      kind: "passive",
      name: "Gunnery",
      short: "Support suppression cooldown reduced by 10s.",
      description:
        "Support soldiers suppress more often. Suppression cooldown is reduced by 10s (now 50s).",
      icon: "/images/gunnery.png",
    },
    entrenchment_techniques: {
      id: "entrenchment_techniques",
      kind: "passive",
      name: "Cover Discipline",
      short: "After Take Cover, gain +10% toughness for 6s.",
      description: "Gain 10% toughness after using Take Cover.",
      icon: "/images/dig_in.png",
    },
    fire_and_maneuver: {
      id: "fire_and_maneuver",
      kind: "passive",
      name: "Fire and Maneuver",
      short: "Take Cover cooldown -15s. After cover ends: +30% toughness for 5s.",
      description:
        "Take Cover cooldown reduced by 15s (60s -> 45s). After Take Cover expires, gain +30% toughness for 5s.",
      icon: "/images/fire_m.png",
    },
    grenadier_training: {
      id: "grenadier_training",
      kind: "passive",
      name: "Grenadier Training",
      short: "+15% frag/incendiary damage from player throws.",
      description:
        "Frag and incendiary grenade damage increased by 15%.",
      icon: "/images/grenadiers.png",
    },
    artillery_barrage: {
      id: "artillery_barrage",
      kind: "active",
      name: "Artillery Barrage",
      short: "Once per battle: all enemies, 90% hit, deals 36-60% max HP.",
      description:
        "Activate once per battle. Affects all enemies with a flat 90% hit roll (no evade). On hit, deals 36-60% of max HP as raw damage (then mitigation applies).",
      icon: "/images/arty.png",
    },
    napalm_barrage: {
      id: "napalm_barrage",
      kind: "active",
      name: "Napalm Barrage",
      short: "Once per battle: all enemies, 4 ticks, 8-13% max HP each.",
      description:
        "Once per battle. Affects all enemies with a flat 90% hit roll (no evade). On hit, applies 4 burn ticks (1s each), each tick for 8-13% of max HP, ignoring mitigation.",
      icon: "/images/napalm.png",
    },
    advanced_field_medicine: {
      id: "advanced_field_medicine",
      kind: "passive",
      name: "Advanced Field Medicine",
      short: "Effectiveness of Med kits increased by 15%",
      description:
        "Effectiveness of all Med kits increased b 15%, this applies to non-Medic use.",
      icon: "/images/advanced_medical.png",
    },
    dig_in: {
      id: "dig_in",
      kind: "active",
      name: "Dig In",
      short: "Order your men to dig in and hang on!",
      description:
        "Your entire squad is ordered to dig in for a period of 10 seconds receiving a 10% flat" +
        " mitigation benefit.",
      icon: "/images/dig_in.png",
    },
    battle_fervor: {
      id: "battle_fervor",
      kind: "active",
      name: "Battle Fervor",
      short: "All allies gain +70% attack speed, +30% crit chance, +15% hit chance, +100% damage for 15s.",
      description:
        "For 15 seconds, all living soldiers in the squad gain +70% attack speed, +30% critical hit chance, +15% chance to hit, and +100% damage.",
      icon: "/images/battle_fervor.png",
      cooldownSeconds: 1_800,
    },
  };

export const COMPANY_ABILITY_PROGRESSION: readonly CompanyAbilityNode[] =
  COMPANY_LEVEL_PROGRESSION.map((row) => {
    if (row.abilityNode.type === "auto") {
      const abilityId = row.abilityNode.abilityId as CompanyAbilityId;
      return { level: row.level, autoGrant: abilityId };
    }
    if (row.abilityNode.type === "choice") {
      const [a, b] = row.abilityNode.abilityIds;
      return {
        level: row.level,
        choice: [a as CompanyAbilityId, b as CompanyAbilityId] as const,
      };
    }
    return { level: row.level };
  });

export type CompanyAbilityChoiceMap = Record<
  number,
  CompanyAbilityId | undefined
>;

export type CompanyPassiveEffects = {
  flatStats: Partial<
    Pick<Attributes, "dexterity" | "morale" | "awareness" | "toughness">
  >;
  chanceToHitBonusPct: number;
  supportSuppressCooldownReductionMs: number;
  takeCoverCooldownReductionMs: number;
  postCoverToughnessPct: number;
  postCoverDurationMs: number;
  playerGrenadeDamageMultiplier: number;
};

export function resolveCompanyAbilityState(
  companyLevel: number,
  choices: CompanyAbilityChoiceMap,
): {
  unlocked: CompanyAbilityId[];
  pendingChoiceLevels: number[];
} {
  const level = Math.max(1, Math.floor(companyLevel || 1));
  const unlocked = new Set<CompanyAbilityId>();
  const pendingChoiceLevels: number[] = [];

  for (const node of COMPANY_ABILITY_PROGRESSION) {
    if (node.level > level) continue;
    if (node.autoGrant) unlocked.add(node.autoGrant);
    if (node.choice && node.choice.length > 0) {
      const picked = choices[node.level];
      if (picked && node.choice.includes(picked)) unlocked.add(picked);
      else pendingChoiceLevels.push(node.level);
    }
  }

  return {
    unlocked: Array.from(unlocked),
    pendingChoiceLevels,
  };
}

export function getCompanyPassiveEffects(
  owned: ReadonlySet<CompanyAbilityId>,
): CompanyPassiveEffects {
  const flatStats: CompanyPassiveEffects["flatStats"] = {};
  let chanceToHitBonusPct = 0;
  let supportSuppressCooldownReductionMs = 0;
  let takeCoverCooldownReductionMs = 0;
  let postCoverToughnessPct = 0;
  let postCoverDurationMs = 0;
  let playerGrenadeDamageMultiplier = 1;

  if (owned.has("advanced_tactical_training")) {
    flatStats.dexterity = (flatStats.dexterity ?? 0) + 4;
    flatStats.morale = (flatStats.morale ?? 0) + 4;
    flatStats.awareness = (flatStats.awareness ?? 0) + 4;
    flatStats.toughness = (flatStats.toughness ?? 0) + 4;
  }
  if (owned.has("targeting_optics")) chanceToHitBonusPct += 0.01;
  if (owned.has("gunnery")) supportSuppressCooldownReductionMs += 10_000;
  if (owned.has("fire_and_maneuver")) takeCoverCooldownReductionMs += 15_000;
  if (owned.has("entrenchment_techniques")) {
    postCoverToughnessPct = 0.1;
    postCoverDurationMs = 6_000;
  }
  if (owned.has("fire_and_maneuver")) {
    postCoverToughnessPct = 0.3;
    postCoverDurationMs = 5_000;
  }
  if (owned.has("grenadier_training")) playerGrenadeDamageMultiplier *= 1.15;

  return {
    flatStats,
    chanceToHitBonusPct,
    supportSuppressCooldownReductionMs,
    takeCoverCooldownReductionMs,
    postCoverToughnessPct,
    postCoverDurationMs,
    playerGrenadeDamageMultiplier,
  };
}

export function getCompanyActiveAbilities(
  owned: ReadonlySet<CompanyAbilityId>,
): CompanyAbilityDef[] {
  return Array.from(owned)
    .map((id) => COMPANY_ABILITY_DEFS[id])
    .filter((def) => def.kind === "active");
}

export function getCompanyPassiveTraitEntries(
  owned: ReadonlySet<CompanyAbilityId>,
): Array<{
  title: string;
  type: string;
  desc: string;
  stats?: Record<string, number>;
  grenadeHitBonusPct?: number;
}> {
  const out: Array<{
    title: string;
    type: string;
    desc: string;
    stats?: Record<string, number>;
    grenadeHitBonusPct?: number;
  }> = [];

  if (owned.has("advanced_tactical_training")) {
    out.push({
      title: "Advanced Tactical Training",
      type: "Company",
      desc: "Company-wide baseline stat package.",
      stats: {
        dexterity: 4,
        morale: 4,
        awareness: 4,
        toughness: 4,
      },
    });
  }
  if (owned.has("targeting_optics")) {
    out.push({
      title: "Targeting Optics",
      type: "Company",
      desc: "Improved optics and aim discipline.",
      stats: {},
      grenadeHitBonusPct: 0,
    });
  }
  if (owned.has("gunnery")) {
    out.push({
      title: "Gunnery",
      type: "Company",
      desc: "Support suppression cooldown reduced by 10s.",
    });
  }
  if (owned.has("improved_focused_fire")) {
    out.push({
      title: "Improved Focused Fire",
      type: "Company",
      desc: "Focused Fire grants +20% damage while active.",
    });
  }
  if (owned.has("fire_and_maneuver")) {
    out.push({
      title: "Fire and Maneuver",
      type: "Company",
      desc: "Take Cover cooldown reduced by 15s. After cover ends: +30% toughness for 5s.",
    });
  }
  if (owned.has("entrenchment_techniques")) {
    out.push({
      title: "Cover Discipline",
      type: "Company",
      desc: "After Take Cover: +10% toughness for 6s.",
    });
  }
  if (owned.has("grenadier_training")) {
    out.push({
      title: "Grenadier Training",
      type: "Company",
      desc: "Frag and incendiary throws deal +15% damage.",
    });
  }

  return out;
}

export function defaultCompanyAbilityChoices(): CompanyAbilityChoiceMap {
  return {};
}
