import { Images } from "../../constants/images.ts";
import { getItemIconUrl } from "../../utils/item-utils.ts";
import type { Soldier } from "../entities/types.ts";
import { SoldierManager } from "../entities/soldier/soldier-manager.ts";
import type { Combatant } from "./types.ts";

const RED_PORTRAIT_KEYS = Object.keys(Images.red_portrait);

/** Convert player Soldier to Combatant. */
export function soldierToCombatant(soldier: Soldier): Combatant {
  const hp = Math.floor(soldier.attributes?.hit_points ?? 100);
  const weapon = soldier.weapon as { damage?: number; damage_min?: number; damage_max?: number } | undefined;
  const dmg = weapon?.damage ?? weapon?.damage_min ?? 4;
  const dmgMin = weapon?.damage_min ?? dmg;
  const dmgMax = weapon?.damage_max ?? dmg;
  const cp = soldier.combatProfile ?? { chanceToHit: 0.6, chanceToEvade: 0.05, mitigateDamage: 0, suppression: 0 };

  return {
    id: soldier.id,
    name: soldier.name,
    avatar: soldier.avatar,
    hp,
    maxHp: hp,
    chanceToHit: cp.chanceToHit ?? 0.6,
    chanceToEvade: cp.chanceToEvade ?? 0.05,
    mitigateDamage: cp.mitigateDamage ?? 0,
    damageMin: dmgMin,
    damageMax: dmgMax,
    attackIntervalMs: 1500,
    toughness: soldier.attributes?.toughness ?? 0,
    side: "player",
    soldierRef: soldier,
    designation: soldier.designation,
    weaponIconUrl: weapon ? getItemIconUrl(weapon as import("../../constants/items/types.ts").Item) : undefined,
  };
}

/** Create enemy combatant. */
export function createEnemyCombatant(
  index: number,
  enemyCount: number,
  companyLevel: number,
): Combatant {
  const level = Math.max(1, Math.min(10, companyLevel));
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
  c.hp = Math.max(1, Math.floor(c.hp * 0.6));
  c.maxHp = c.hp;
  c.avatar = Images.red_portrait[RED_PORTRAIT_KEYS[index % RED_PORTRAIT_KEYS.length] as keyof typeof Images.red_portrait];
  return c;
}
