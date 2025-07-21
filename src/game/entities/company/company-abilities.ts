import type { CompanyAbility, CompanyDamageAbilityEffect } from "./company.ts";
import { EFFECT_TYPES } from "../effects/effect.ts";
import { TARGET_TYPES } from "../../../constants/items/types.ts";

const HeBarrage: CompanyAbility = {
  name: "HE Artillery Barrage",
  id: "he_barrage",
  company_level: 2,
  icon: "",
  cost: 200,
  effect: {
    type: EFFECT_TYPES.damage,
    attacks: 3,
    attack_frequency: 3400,
    chance_to_hit: 0.5,
    effect_value: 40,
    target: TARGET_TYPES.enemy_area,
  } as CompanyDamageAbilityEffect,
};

const RocketBarrage: CompanyAbility = {
  company_level: 2,
  cost: 300,
  icon: "",
  effect: {
    type: EFFECT_TYPES.damage,
    attacks: 4,
    attack_frequency: 3000, // ms
    chance_to_hit: 0.4,
    effect_value: 60,
    target: TARGET_TYPES.enemy_area,
  } as CompanyDamageAbilityEffect,
  id: "120_rocket_barrage",
  name: "120mm Rocket Barrage",
};

const MortarBarrage: CompanyAbility = {
  company_level: 2,
  cost: 300,
  icon: "",
  effect: {
    type: EFFECT_TYPES.damage,
    attacks: 7,
    attack_frequency: 2400, // every 2.4 seconds
    chance_to_hit: 0.3,
    effect_value: 15,
    target: TARGET_TYPES.enemy_area,
  } as CompanyDamageAbilityEffect,
  id: "mortar_barrage",
  name: "Mortar Barrage",
};

export { HeBarrage, RocketBarrage, MortarBarrage };
