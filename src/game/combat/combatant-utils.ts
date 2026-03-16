import { computeAttackIntervalMs, ENEMY_DAMAGE_MULTIPLIER, ENEMY_HP_MULTIPLIER } from "../../constants/combat";
import type { WeaponEffectId } from "../../constants/items/types.ts";
import { WEAPON_EFFECTS } from "../../constants/items/weapon-effects.ts";
import { WEAPON_BASES } from "../../constants/items/weapon-bases.ts";
import { RARE_WEAPON_BASES } from "../../constants/items/rare-weapon-bases.ts";
import { EPIC_WEAPON_BASES } from "../../constants/items/epic-weapon-bases.ts";
import { RARE_ARMOR_BASES } from "../../constants/items/rare-armor-bases.ts";
import { EPIC_ARMOR_BASES } from "../../constants/items/epic-armor-bases.ts";
import type { ArmorImmunity } from "../../constants/items/epic-armor-bases.ts";
import { getItemSpecialEffect } from "../../constants/item-special-effects.ts";
import { Images } from "../../constants/images.ts";
import type { MissionFactionId, MissionKind } from "../../constants/missions.ts";
import { getItemIconUrl } from "../../utils/item-utils.ts";
import type { Soldier } from "../entities/types.ts";
import { SoldierManager } from "../entities/soldier/soldier-manager.ts";
import type { Combatant } from "./types.ts";
import { toughnessToMitigation } from "./combat-damage.ts";

const RED_PORTRAIT_KEYS = Object.keys(Images.red_portrait);
const BLUE_PORTRAIT_KEYS = Object.keys(Images.blue_portrait);
const BLACK_PORTRAIT_KEYS = Object.keys(Images.black_portrait);
const SAND_PORTRAIT_KEYS = Object.keys(Images.sand_portrait);
const round1 = (n: number) => Math.round(n * 10) / 10;
const roundMitigationUp = (n: number) => Math.ceil(n * 1000) / 1000;

function getWeaponBaseIdFromItemId(id: string | undefined): string | undefined {
  if (!id) return undefined;
  return id.replace(/_\d+$/, "");
}

function resolveWeaponSfx(
  weapon: { id?: string; weaponSfx?: string } | undefined,
): string | undefined {
  if (!weapon) return undefined;
  if (weapon.weaponSfx) return weapon.weaponSfx;
  const baseId = getWeaponBaseIdFromItemId(weapon.id);
  if (!baseId) return undefined;
  const common = WEAPON_BASES.find((b) => b.baseId === baseId);
  if (common?.weaponSfx) return common.weaponSfx;
  const rare = RARE_WEAPON_BASES.find((b) => b.baseId === baseId);
  if (rare?.weaponSfx) return rare.weaponSfx;
  const epic = EPIC_WEAPON_BASES.find((b) => b.baseId === baseId);
  if (epic?.weaponSfx) return epic.weaponSfx;
  return undefined;
}

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
    id?: string;
    damage?: number;
    damage_min?: number;
    damage_max?: number;
    speed_base?: number;
    weaponEffect?: WeaponEffectId;
    weaponSfx?: string;
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
  const baseMitFromToughness = toughnessToMitigation(
    soldier.attributes?.toughness ?? 0,
  );
  const mitigationBonusPct = Math.max(
    0,
    (cp.mitigateDamage ?? 0) - baseMitFromToughness,
  );
  const mitigateDamage = roundMitigationUp(
    Math.min(0.6, baseMitFromToughness + mitigationBonusPct),
  );

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
    grenadeHitBonusPct: soldier.grenadeHitBonusPct ?? 0,
    chanceToEvade: cp.chanceToEvade ?? 0.05,
    mitigationBonusPct,
    mitigateDamage,
    damageMin: Math.max(1, round1(dmgMin)),
    damageMax: Math.max(1, round1(dmgMax)),
    attackIntervalMs,
    toughness: soldier.attributes?.toughness ?? 0,
    level: soldier.level ?? 1,
    side: "player",
    soldierRef: soldier,
    designation: soldier.designation,
    weaponIconUrl: weapon ? getItemIconUrl(weapon as import("../../constants/items/types.ts").Item) : undefined,
    weaponId: weapon?.id,
    weaponSfx: resolveWeaponSfx(weapon),
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
  _enemyCount: number,
  companyLevel: number,
  isEpicMission = false,
  missionKind?: MissionKind,
  manhuntTargetIndex?: number,
  _roleSlots?: { supportIndex?: number; medicIndex?: number },
  options?: {
    designation?: "rifleman" | "support" | "medic";
    isManhuntTarget?: boolean;
    factionId?: MissionFactionId;
  },
): Combatant {
  const level = Math.max(1, Math.min(999, companyLevel));
  const designation = options?.designation ?? "rifleman";
  const soldier = designation === "support"
    ? SoldierManager.getNewSupportMan(level)
    : designation === "medic"
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
    c.enemyMedkitLevel = Math.max(1, Math.min(999, (medkit?.level ?? level)));
  } else {
    c.enemyMedkitUses = 0;
    c.enemyMedkitLevel = undefined;
  }
  c.soldierRef = undefined;
  const isManhuntTarget =
    !!options?.isManhuntTarget ||
    (missionKind === "manhunt" &&
      manhuntTargetIndex != null &&
      index === manhuntTargetIndex);
  if (isManhuntTarget) {
    c.isManhuntTarget = true;
  }
  if (isEpicMission) {
    // Elite missions keep full base HP for all enemy units.
    c.hp = Math.max(1, Math.floor(c.hp));
  } else {
    c.hp = Math.max(1, Math.floor(c.hp * ENEMY_HP_MULTIPLIER));
  }
  c.maxHp = c.hp;
  if (isEpicMission) {
    // Elite missions: no enemy damage handicap.
    c.damageMin = Math.max(1, round1(c.damageMin ?? 4));
    c.damageMax = Math.max(1, round1(c.damageMax ?? 6));
  } else {
    c.damageMin = Math.max(1, round1((c.damageMin ?? 4) * ENEMY_DAMAGE_MULTIPLIER));
    c.damageMax = Math.max(1, round1((c.damageMax ?? 6) * ENEMY_DAMAGE_MULTIPLIER));
  }
  const factionId = options?.factionId;
  let portraitDir = "red-portrait";
  let portraitPool = RED_PORTRAIT_KEYS;
  let portraitMap = Images.red_portrait;
  if (factionId === "liberties_vanguard") {
    portraitDir = "blue-portrait";
    portraitPool = BLUE_PORTRAIT_KEYS;
    portraitMap = Images.blue_portrait;
  } else if (factionId === "iron_corps") {
    portraitDir = "black-portrait";
    portraitPool = BLACK_PORTRAIT_KEYS;
    portraitMap = Images.black_portrait;
  } else if (factionId === "desert_wolves") {
    portraitDir = "sand-portraits";
    portraitPool = SAND_PORTRAIT_KEYS;
    portraitMap = Images.sand_portrait;
  }
  const portraitKey = portraitPool[index % Math.max(1, portraitPool.length)] as keyof typeof portraitMap;
  c.avatar = portraitMap[portraitKey];
  c.enemyPortraitDir = portraitDir;
  if ((c.designation ?? "").toLowerCase() === "support") {
    c.enemySuppressUses = 1;
  } else {
    c.enemySuppressUses = 0;
  }
  c.enemyGrenadeThrowsRemaining = 0;
  return c;
}
