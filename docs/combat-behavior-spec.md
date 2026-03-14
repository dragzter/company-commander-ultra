# Combat Behavior Spec (Code-Derived)

This document reflects current behavior implemented in code as of this commit.

## Verification Summary

1. Stunned targets cannot attack: **YES**
- Auto-attacks skip stunned combatants in the main loop.
- Ability usage also blocks when user is stunned.

2. Morale reduces stun time: **NO (not implemented globally)**
- Morale reduction is applied to grenade-based `panic` and `suppression` durations.
- Grenade-based `stun` duration is **not** morale-reduced.
- Support ability `Suppress` duration is a fixed 8s and is **not** morale-reduced.

3. Morale reduces suppression and panic time: **PARTIAL**
- Yes for grenade-applied panic/suppression effects.
- No for support ability suppress (fixed 8s).

4. Grenades have 90% chance to hit: **YES for non-knife throwables**
- Non-knife throwables use base hit chance `0.9` (+ grenade hit bonus if present, capped 0.98).
- Throwing knives use attacker `chanceToHit` instead.

---

## Core Attack Order

### Regular auto-attack order
1. Attacker eligibility
- Must be alive, not downed, not in cover, not stunned.
- In event loop, attackers that fail these checks are skipped.

2. Target validity
- Target must be alive and not downed.
- In-cover targets are untargetable, except focused-fire lock behavior allows continued targeting.

3. Hit roll
- Roll against attacker effective chance-to-hit.
- Accuracy debuffs and blinded status lower effective hit chance.

4. Evade roll
- Roll against target evade chance.
- If target is panicked, evade is forced to 0.
- Some weapon effects reduce target evade (ignore-avoidance modifiers).

5. Damage roll
- Roll random weapon damage between min/max.
- Apply ability multipliers (e.g., Focused Fire improved buff, Battle Fervor damage multiplier).
- If crit succeeds, raw damage is multiplied by crit multiplier.

6. Mitigation
- Final damage computed through a unified mitigation pipeline (`computeFinalDamage`):
  - toughness -> mitigation
  - additive mitigation bonuses
  - quantization to 0.1%
  - cap (or overcap window if applicable)
  - stunned targets have mitigation halved while stunned

7. Proc handling
- Weapon procs (fire/blind/stun/etc.) roll after base damage.

8. Down-state resolution
- If HP <= 0:
  - player targets can become `incapacitated` vs `kia` by chance
  - enemies become `kia`

9. Next attack scheduling
- Next attack time is computed from attack interval and speed modifiers.
- Panic applies a 2x interval penalty (slower attacks).

### What cannot be evaded
- Artillery Barrage and Napalm Barrage do not run target evade checks.
- They use a flat 90% hit roll per target.

---

## Throwable Resolution

## Shared flow (non-company barrage throwables)
1. Identify throwable family
- Throwing knife, incendiary, smoke, repressor, or standard throwable effect.

2. Hit chance
- Non-knife throwables: base 90% + thrower grenade hit bonus (cap 98%).
- Knife: uses thrower `chanceToHit`.

3. Primary evade
- Non-knife throwables use fixed 5% evade chance.
- Knife uses target evade (or 0 if target is panicked).

4. Apply primary result
- On hit and not evaded: damage/effects applied.

5. Splash processing
- Adjacent enemies (up to max total targets = 3 including primary).
- Splash can evade independently (5% for non-knife).
- Splash damage generally 50% of base path.

### Throwing knife
- Single-target only.
- Mitigated damage.
- Uses attacker CTH and target evade rules.

### Incendiary grenade
- DoT-centered behavior.
- Primary: burn stack 4 ticks, unmitigated.
- Adjacent: reduced burn stacks.

### Smoke
- No direct damage.
- Applies smoked debuffs/evasion changes to primary and adjacent targets.

### M3A Repressor
- Tuned as debuff-first grenade path.
- Lower direct damage scaling than pure damage grenades.
- Applies toughness reduction effects in area path.

---

## Ability Behaviors

### Take Cover
- User cannot be dead/downed/stunned.
- Applies cover for duration.
- Removes/invalidates targeting as needed and forces reassignment.
- Cover blocks being targeted by normal attacks.

### Suppress (support soldier ability)
- User cannot be dead/downed/stunned.
- Executes 3 bursts (500ms spacing).
- Each burst resolves as a normal attack (hit -> evade -> damage).
- If any burst lands and target is valid/non-immune, target gets suppressed for fixed 8s.
- Suppressed units cannot attack while suppression is active.
- Current fixed suppress duration is not morale-reduced.

### Focused Fire (company active)
- Targeted enemy selection mode.
- For 8s, player soldiers retarget and stay focused on chosen target.
- If target dies/invalidates, normal targeting resumes.

### Artillery Barrage (company active)
- Once per battle (use count).
- Per target: flat 90% hit, no evade.
- On hit: max-HP-based damage, then mitigation applies.

### Napalm Barrage (company active)
- Once per battle (use count).
- Per target: flat 90% hit, no evade.
- On hit: applies burn stacks as configured, ignoring mitigation.

### Battle Fervor (company active)
- Applies timed squad buffs (damage/speed/crit/hit bonuses).
- Uses persisted wall-clock cooldown (absolute timestamp).

### Emergency Medevac (company active)
- Stops combat actions and extracts squad.
- Mission ends as extracted with no completion rewards.
- Uses persisted wall-clock cooldown (absolute timestamp).

---

## Status Effects and Their Combat Impact

- `stun`: prevents attacking; mitigation is halved while stunned.
- `suppression`: prevents attacking while active.
- `panic`: sets evade to 0 and slows attack cadence.
- `cover`: prevents being targeted by normal attacks.
- `burn`: DoT stack system (supports independent stacks).

---

## Notes for Future Consistency

If design intent is that morale should reduce all crowd-control durations, current code should be extended to include:
- support ability `Suppress` duration scaling by target morale,
- grenade `stun` duration morale reduction (currently only panic/suppression are reduced).
