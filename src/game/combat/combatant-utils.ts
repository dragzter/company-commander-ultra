import { computeAttackIntervalMs, ENEMY_DAMAGE_MULTIPLIER, ENEMY_HP_MULTIPLIER, WEAPON_DAMAGE_MULTIPLIER } from "../../constants/combat";
import type { WeaponEffectId } from "../../constants/items/types.ts";
import { WEAPON_EFFECTS } from "../../constants/items/weapon-effects.ts";
import { RARE_ARMOR_BASES } from "../../constants/items/rare-armor-bases.ts";
import { EPIC_ARMOR_BASES } from "../../constants/items/epic-armor-bases.ts";
import type { ArmorImmunity } from "../../constants/items/epic-armor-bases.ts";
import { getItemSpecialEffect } from "../../constants/item-special-effects.ts";
import { Images } from "../../constants/images.ts";
import { getItemIconUrl } from "../../utils/item-utils.ts";
import type { Soldier } from "../entities/types.ts";
import { SoldierManager } from "../entities/soldier/soldier-manager.ts";
import type { Combatant } from "./types.ts";

const RED_PORTRAIT_KEYS = Object.keys(Images.red_portrait);

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
  dmgMin = Math.round(dmgMin * damageMult * WEAPON_DAMAGE_MULTIPLIER);
  dmgMax = Math.round(dmgMax * damageMult * WEAPON_DAMAGE_MULTIPLIER);
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
    damageMin: Math.max(1, dmgMin),
    damageMax: Math.max(1, dmgMax),
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
): Combatant {
  const level = Math.max(1, Math.min(20, companyLevel));
  const soldier =
    index === 0 && enemyCount >= 1
      ? SoldierManager.getNewSupportMan(level)
      : index === 1 && enemyCount >= 2
        ? SoldierManager.getNewMedic(level)
        : SoldierManager.getNewRifleman(level);
  const c = soldierToCombatant(soldier);
  c.id = `enemy-${index}-${Date.now()}`;
  c.side = "enemy";
  c.soldierRef = undefined;
  const isEpicElite = isEpicMission && index === 0;
  if (isEpicElite) {
    c.isEpicElite = true;
  } else {
    c.hp = Math.max(1, Math.floor(c.hp * ENEMY_HP_MULTIPLIER));
  }
  c.maxHp = c.hp;
  c.damageMin = Math.max(1, Math.floor((c.damageMin ?? 4) * ENEMY_DAMAGE_MULTIPLIER));
  c.damageMax = Math.max(1, Math.floor((c.damageMax ?? 6) * ENEMY_DAMAGE_MULTIPLIER));
  c.avatar = Images.red_portrait[RED_PORTRAIT_KEYS[index % RED_PORTRAIT_KEYS.length] as keyof typeof Images.red_portrait];
  return c;
}
