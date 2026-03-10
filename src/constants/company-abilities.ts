import type { Attributes } from "../game/entities/types.ts";

export type CompanyAbilityId =
  | "focused_fire"
  | "advanced_field_medicine"
  | "advanced_tactical_training"
  | "targeting_optics"
  | "gunnery"
  | "entrenchment_techniques"
  | "fire_and_maneuver"
  | "grenadier_training"
  | "artillery_barrage"
  | "dig_in"
  | "napalm_barrage";

export type CompanyAbilityKind = "active" | "passive";

export interface CompanyAbilityDef {
  id: CompanyAbilityId;
  kind: CompanyAbilityKind;
  name: string;
  short: string;
  description: string;
  icon: string;
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
        "Select one enemy. All player soldiers retarget that unit for 8s (even if it enters cover). Cooldown: 75s.",
      icon: "/images/scan.png",
    },
    advanced_tactical_training: {
      id: "advanced_tactical_training",
      kind: "passive",
      name: "Advanced Tactical Training",
      short: "+3 DEX/MOR/AWR/TGH for all current and future soldiers.",
      description:
        "Passive (company-wide): +3 DEX, +3 MOR, +3 AWR, +3 TGH for all current and future soldiers.",
      icon: "/images/scan.png",
    },
    targeting_optics: {
      id: "targeting_optics",
      kind: "passive",
      name: "Targeting Optics",
      short: "+1% hit chance for all current and future soldiers.",
      description:
        "Passive (company-wide): +1% chance to hit for all current and future soldiers.",
      icon: "/images/scan.png",
    },
    gunnery: {
      id: "gunnery",
      kind: "passive",
      name: "Gunnery",
      short: "Support suppression cooldown reduced by 10s.",
      description:
        "Passive (support only): suppression cooldown reduced by 10s (60s -> 50s) for current and future support soldiers.",
      icon: "/images/scan.png",
    },
    entrenchment_techniques: {
      id: "entrenchment_techniques",
      kind: "passive",
      name: "Entrenchment Techniques",
      short: "After Take Cover, gain +10% toughness for 6s.",
      description:
        "Passive: after using Take Cover, gain +10% of current toughness for 6s.",
      icon: "/images/dig_in.png",
    },
    fire_and_maneuver: {
      id: "fire_and_maneuver",
      kind: "passive",
      name: "Fire and Maneuver",
      short: "Take Cover cooldown reduced by 10s.",
      description: "Passive: Take Cover cooldown reduced by 10s (60s -> 50s).",
      icon: "/images/scan.png",
    },
    grenadier_training: {
      id: "grenadier_training",
      kind: "passive",
      name: "Grenadier Training",
      short: "+15% frag/incendiary damage from player throws.",
      description:
        "Passive (player throws only): frag and incendiary grenade damage +15%.",
      icon: "/images/grenadiers.png",
    },
    artillery_barrage: {
      id: "artillery_barrage",
      kind: "active",
      name: "Artillery Barrage",
      short: "Once per battle: 90% chance to hit, deals 30-50% max HP.",
      description:
        "Activate once per battle: 90% hit chance. On hit, deals 30-50% of target max HP as raw" +
        " damage (then mitigation applies).",
      icon: "/images/arty.png",
    },
    napalm_barrage: {
      id: "napalm_barrage",
      kind: "active",
      name: "Napalm Barrage",
      short: "Once per battle: 3 ticks, 8-13% max HP each, ignores mitigation.",
      description:
        "Active, once per battle: 90% hit chance. On hit, applies 3 burn ticks (1s each), each tick for 8-13% of target max HP, ignoring mitigation.",
      icon: "/images/scan.png",
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
  };

export const COMPANY_ABILITY_PROGRESSION: readonly CompanyAbilityNode[] = [
  { level: 1, autoGrant: "focused_fire" },
  {
    level: 2,
    choice: ["advanced_tactical_training", "targeting_optics"],
  },
  { level: 3, autoGrant: "gunnery" },
  {
    level: 4,
    choice: ["entrenchment_techniques", "fire_and_maneuver"],
  },
  { level: 5, autoGrant: "grenadier_training" },
  { level: 6, choice: ["artillery_barrage", "napalm_barrage"] },
  { level: 7 },
  { level: 8 },
  { level: 9 },
  { level: 10 },
];

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
  const postCoverDurationMs = 6_000;
  let playerGrenadeDamageMultiplier = 1;

  if (owned.has("advanced_tactical_training")) {
    flatStats.dexterity = (flatStats.dexterity ?? 0) + 3;
    flatStats.morale = (flatStats.morale ?? 0) + 3;
    flatStats.awareness = (flatStats.awareness ?? 0) + 3;
    flatStats.toughness = (flatStats.toughness ?? 0) + 3;
  }
  if (owned.has("targeting_optics")) chanceToHitBonusPct += 0.01;
  if (owned.has("gunnery")) supportSuppressCooldownReductionMs += 10_000;
  if (owned.has("fire_and_maneuver")) takeCoverCooldownReductionMs += 10_000;
  if (owned.has("entrenchment_techniques")) postCoverToughnessPct += 0.1;
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
    .filter((def) => def.kind === "active")
    .sort((a, b) => a.name.localeCompare(b.name));
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
        dexterity: 3,
        morale: 3,
        awareness: 3,
        toughness: 3,
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
  if (owned.has("fire_and_maneuver")) {
    out.push({
      title: "Fire and Maneuver",
      type: "Company",
      desc: "Take Cover cooldown reduced by 10s.",
    });
  }
  if (owned.has("entrenchment_techniques")) {
    out.push({
      title: "Entrenchment Techniques",
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
