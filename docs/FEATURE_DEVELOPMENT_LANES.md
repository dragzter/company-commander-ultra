# Feature Development Lanes

This project now has centralized extension points for core gameplay content.

## Mission Types (Data-Driven)

Use [src/constants/missions.ts](/Users/vlad/Desktop/dev/company-commander-ultra/src/constants/missions.ts):

- Add a mission kind in `MISSION_KINDS`.
- Add its full definition in `MISSION_KIND_DEFINITIONS`:
  - display name/description
  - flavor templates
  - `displayOrder`
  - generation weights (`regularWeight`, `epicWeight`)

The following systems consume this registry automatically:

- Mission generation pool (regular + epic): [src/services/missions/mission-generator.ts](/Users/vlad/Desktop/dev/company-commander-ultra/src/services/missions/mission-generator.ts)
- Mission screen section ordering and labels: [src/game/html-templates/missions-template.ts](/Users/vlad/Desktop/dev/company-commander-ultra/src/game/html-templates/missions-template.ts)

## Weapon Proc Effects (Handler Registry)

Use [src/services/combat/weapon-proc-registry.ts](/Users/vlad/Desktop/dev/company-commander-ultra/src/services/combat/weapon-proc-registry.ts):

- Add/adjust proc configuration in `WEAPON_EFFECTS` (`proc` payload):
  [src/constants/items/weapon-effects.ts](/Users/vlad/Desktop/dev/company-commander-ultra/src/constants/items/weapon-effects.ts)
- Map `proc.type` to behavior in `WEAPON_PROC_HANDLERS`.

Combat loop dispatches through the registry (instead of effect-specific branches):

- [src/game/combat/combat-loop.ts](/Users/vlad/Desktop/dev/company-commander-ultra/src/game/combat/combat-loop.ts)

## Soldier Abilities (Config + Action ID)

Use [src/constants/soldier-abilities.ts](/Users/vlad/Desktop/dev/company-commander-ultra/src/constants/soldier-abilities.ts):

- Define ability UI + metadata in `SOLDIER_ABILITIES`
  - `id`, `actionId`, `slotClassName`, designation restrictions, icon, cooldown

Combat UI builds ability buttons from this data, and dispatches by `abilityId`:

- [src/game/ui/event-configs.ts](/Users/vlad/Desktop/dev/company-commander-ultra/src/game/ui/event-configs.ts)

Current action handlers are centralized in `executeAbilityAction` within `event-configs.ts`.
When adding a new `actionId`, add one handler there.

