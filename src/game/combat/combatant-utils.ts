import { computeAttackIntervalMs, ENEMY_DAMAGE_MULTIPLIER, ENEMY_HP_MULTIPLIER } from "../../constants/combat";
import type { WeaponEffectId } from "../../constants/items/types.ts";
import { WEAPON_EFFECTS } from "../../constants/items/weapon-effects.ts";
import { RARE_ARMOR_BASES } from "../../constants/items/rare-armor-bases.ts";
import { EPIC_ARMOR_BASES } from "../../constants/items/epic-armor-bases.ts";
import type { ArmorImmunity } from "../../constants/items/epic-armor-bases.ts";
import { getItemSpecialEffect } from "../../constants/item-special-effects.ts";
import { Images } from "../../constants/images.ts";
import type { MissionKind } from "../../constants/missions.ts";
import { getItemIconUrl } from "../../utils/item-utils.ts";
import type { Soldier } from "../entities/types.ts";
import { SoldierManager } from "../entities/soldier/soldier-manager.ts";
import type { Combatant } from "./types.ts";

const RED_PORTRAIT_KEYS = Object.keys(Images.red_portrait);
const round1 = (n: number) => Math.round(n * 10) / 10;

function getArmorImmunitiesFromBase(baseId: string | undefined): ArmorImmunity[] {
  if (!baseId) return [];
  const rare = RARE_ARMOR_BASES.find((b) => b.baseId === baseId);
  if (rare?.specialEffect) {
    const eff = getItemSpecialEffect(rare.specialEffect);
    return eff.immunities ?? [];
  }
  if (rare?.immunities) return rare.immunities;
  const epic = EPIC_ARMOR_BASES.find((b) => b.baseId === baseId);
  if (epic?.specialEffect) {
    const eff = getItemSpecialEffect(epic.specialEffect);
    return eff.immunities ?? [];
  }
  return [];
}

function getArmorIncapMultiplier(baseId: string | undefined): number {
  if (!baseId) return 1;
  const rare = RARE_ARMOR_BASES.find((b) => b.baseId === baseId);
  if (rare?.specialEffect) {
    const eff = getItemSpecialEffect(rare.specialEffect);
    return eff.incapChanceMultiplier ?? 1;
  }
  const epic = EPIC_ARMOR_BASES.find((b) => b.baseId === baseId);
  if (epic?.specialEffect) {
    const eff = getItemSpecialEffect(epic.specialEffect);
    return eff.incapChanceMultiplier ?? 1;
  }
  return 1;
}

/** Convert player Soldier to Combatant. */
export function soldierToCombatant(soldier: Soldier): Combatant {
  const hp = Math.floor(soldier.attributes?.hit_points ?? 100);
  const weapon = soldier.weapon as {
    damage?: number;
    damage_min?: number;
    damage_max?: number;
    speed_base?: number;
    weaponEffect?: WeaponEffectId;
  } | undefined;
  const dmg = weapon?.damage ?? weapon?.damage_min ?? 4;
  let dmgMin = weapon?.damage_min ?? dmg;
  let dmgMax = weapon?.damage_max ?? dmg;
  const effect = weapon?.weaponEffect ? WEAPON_EFFECTS[weapon.weaponEffect] : undefined;
  const damageMult = effect?.modifiers?.damagePercent != null ? 1 + effect.modifiers.damagePercent : 1;
  dmgMin = round1(dmgMin * damageMult);
  dmgMax = round1(dmgMax * damageMult);
  let attackIntervalMs = computeAttackIntervalMs(weapon, soldier.attributes?.dexterity ?? 0);
  const intervalMult = effect?.modifiers?.attackIntervalMultiplier ?? 1;
  attackIntervalMs = intervalMult < 1 ? Math.floor(attackIntervalMs * intervalMult) : Math.round(attackIntervalMs * intervalMult);
  const cp = soldier.combatProfile ?? { chanceToHit: 0.6, chanceToEvade: 0.05, mitigateDamage: 0, suppression: 0 };
  const weaponEffect = (weapon as { weaponEffect?: string })?.weaponEffect;

  const armor = soldier.armor as { baseId?: string } | undefined;
  const armorImmunities = getArmorImmunitiesFromBase(armor?.baseId);
  const allImmunities = new Set<ArmorImmunity>(armorImmunities);
  const incapMult = getArmorIncapMultiplier(armor?.baseId);

  return {
    id: soldier.id,
    name: soldier.name,
    avatar: soldier.avatar,
    hp,
    maxHp: hp,
    chanceToHit: cp.chanceToHit ?? 0.6,
    chanceToEvade: cp.chanceToEvade ?? 0.05,
    mitigateDamage: cp.mitigateDamage ?? 0,
    damageMin: Math.max(1, round1(dmgMin)),
    damageMax: Math.max(1, round1(dmgMax)),
    attackIntervalMs,
    toughness: soldier.attributes?.toughness ?? 0,
    level: soldier.level ?? 1,
    side: "player",
    soldierRef: soldier,
    designation: soldier.designation,
    weaponIconUrl: weapon ? getItemIconUrl(weapon as import("../../constants/items/types.ts").Item) : undefined,
    weaponEffect,
    immuneToStun: allImmunities.has("stun"),
    immuneToPanic: allImmunities.has("panic"),
    immuneToSuppression: allImmunities.has("suppression"),
    immuneToBurning: allImmunities.has("burning"),
    incapChanceMultiplier: incapMult,
  };
}

/** Create enemy combatant. */
export function createEnemyCombatant(
  index: number,
  enemyCount: number,
  companyLevel: number,
  isEpicMission = false,
  missionKind?: MissionKind,
  manhuntTargetIndex?: number,
  roleSlots?: { supportIndex?: number; medicIndex?: number },
): Combatant {
  const eliteBonus = isEpicMission ? (Math.random() < 0.5 ? 1 : 2) : 0;
  const level = Math.max(1, Math.min(20, companyLevel + eliteBonus));
  const supportIndex = roleSlots?.supportIndex ?? 0;
  const medicIndex = roleSlots?.medicIndex ?? (enemyCount >= 2 ? (supportIndex === 1 ? 0 : 1) : -1);
  const soldier =
    index === supportIndex && enemyCount >= 1
      ? SoldierManager.getNewSupportMan(level)
      : index === medicIndex && enemyCount >= 2
        ? SoldierManager.getNewMedic(level)
        : SoldierManager.getNewRifleman(level);
  const c = soldierToCombatant(soldier);
  c.id = `enemy-${index}-${Date.now()}`;
  c.side = "enemy";
  c.enemySlotIndex = index;
  const isEnemyMedic = (c.designation ?? "").toLowerCase() === "medic";
  if (isEnemyMedic) {
    const medkit = (soldier.inventory ?? []).find((item) => item.id === "standard_medkit");
    c.enemyMedkitUses = Math.random() < 0.5 ? 1 : 2;
    c.enemyMedkitLevel = Math.max(1, Math.min(20, (medkit?.level ?? level)));
  } else {
    c.enemyMedkitUses = 0;
    c.enemyMedkitLevel = undefined;
  }
  c.soldierRef = undefined;
  const isEpicElite = isEpicMission && index === 0;
  const resolvedManhuntTargetIndex = manhuntTargetIndex ?? 0;
  const isManhuntTarget = missionKind === "manhunt" && index === resolvedManhuntTargetIndex;
  if (isEpicElite) {
    c.isEpicElite = true;
  }
  if (isManhuntTarget) {
    c.isManhuntTarget = true;
  }
  if (isEpicMission || isManhuntTarget) {
    // Elite missions and manhunt target units keep full base HP.
    c.hp = Math.max(1, Math.floor(c.hp));
  } else {
    c.hp = Math.max(1, Math.floor(c.hp * ENEMY_HP_MULTIPLIER));
  }
  if (isManhuntTarget) {
    // Manhunt target gets a 10% HP buff from level-derived base HP (round up).
    c.hp = Math.max(1, Math.ceil(c.hp * 1.1));
  }
  c.maxHp = c.hp;
  if (isEpicMission || isManhuntTarget) {
    // Elite missions and manhunt target: no enemy damage handicap.
    c.damageMin = Math.max(1, round1(c.damageMin ?? 4));
    c.damageMax = Math.max(1, round1(c.damageMax ?? 6));
  } else {
    c.damageMin = Math.max(1, round1((c.damageMin ?? 4) * ENEMY_DAMAGE_MULTIPLIER));
    c.damageMax = Math.max(1, round1((c.damageMax ?? 6) * ENEMY_DAMAGE_MULTIPLIER));
  }
  c.avatar = Images.red_portrait[RED_PORTRAIT_KEYS[index % RED_PORTRAIT_KEYS.length] as keyof typeof Images.red_portrait];
  return c;
}
