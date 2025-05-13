import { FACTIONS } from "../../constants/factions.ts";
import type { Unit } from "../../constants/types.ts";

export function StatProfiler() {
  /**
   * Factor in unit traits with faction attributes to calculate overall combat stats
   *
   * Unit combat strength is determined by the starting values of
   * their factions attributes. Traits can impact those values
   * positively or negatively.  Each unit brings a unique mix of
   * traits to make some interesting profiles.
   * @param unit
   * @param factionId
   */
  function gcp(unit: Unit, factionId: string) {
    const attributes = FACTIONS[factionId].attributes;
    const unitTraits = unit.traits;
    const profile = {
      morale: 0,
      offense: 0,
      defense: 0,
      logistics: 0,
      initiative: 0,
      combat_rating: 0,
    };

    for (let i = 0; i < unitTraits.length; i++) {
      profile.morale =
        unitTraits[i].morale.positive -
        unitTraits[i].morale.negative +
        attributes.morale;

      profile.initiative =
        unitTraits[i].initiative.positive -
        unitTraits[i].initiative.negative +
        attributes.initiative;

      profile.offense =
        unitTraits[i].offense.positive -
        unitTraits[i].offense.negative +
        attributes.offense;

      profile.defense =
        unitTraits[i].defense.positive -
        unitTraits[i].defense.negative +
        attributes.defense;

      profile.logistics =
        unitTraits[i].logistics.positive -
        unitTraits[i].logistics.negative +
        attributes.logistics;

      profile.combat_rating =
        (profile.morale +
          profile.initiative +
          profile.defense +
          profile.offense +
          profile.logistics) /
        10;
    }
    console.log({ profile }, unit.name);
    return profile;
  }

  return {
    getCombatProfile: (unit: Unit, factionId: string) => gcp(unit, factionId),
  };
}
