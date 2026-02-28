# Company Commander Ultra — Game Summary

## Summary

**Company Commander Ultra** is a tactical military management and combat game where you play as a company commander building and leading a mercenary infantry unit. You create your company with a custom name, commander name, and unit patch, then recruit soldiers from the market, gear them from the armory, and send them on procedurally generated missions (Defend, Ambush, Attack, Seek & Destroy, Manhunt) against enemy forces. Combat is turn-based and stat-driven: weapon speed and Dexterity determine attack cadence, while attributes (HP, DEX, Morale, Toughness, Awareness) drive chance-to-hit, avoidance, and mitigation. Soldiers gain experience and levels, carry traits that shape their stats, and use abilities like Take Cover and Suppress plus consumables (grenades, medical, stims). Fallen soldiers are honored on a Memorial Wall. The game blends strategic company management—formation assignment, roster management, equip picker, armory—with tactical combat featuring company-level barrages (HE, Rocket, Mortar), status effects (stun, panic, smoke, burn, blinded, suppressed), and incapacitation vs KIA mechanics. Progression is driven by company and soldier XP, credit economy, and rare/epic loot drops.

---

## Features

### Company Management
- **Custom company creation** — Name your company, commander (3–15 chars each), and choose from 8 unit patches at setup. Patches define your unit's visual identity across the UI.
- **Formation & roster** — Place soldiers in active (deployable on missions) vs reserve slots. Company capacity grows with level: 8–20 total soldiers, 4–10 active depending on level. Formation screen lets you reorder and swap with drag-and-drop.
- **Equip picker** — Per-soldier loadout: one weapon, one armor, multiple equipment slots (grenades, meds). Drag items between soldiers or from armory; swap source animates out, destination plops in. Unequip buttons appear on filled slots.
- **Armory** — Shared inventory with category caps that scale with company level (weapons, armor, supplies). Total slots grow from 20 at L1 to 80+ at higher levels.
- **Market** — Recruit soldiers (500 credits base + trait modifiers), buy weapons, armor, supplies. Troops market shows rerollable soldier cards with trait profiles; recruiting animates cards out (backOutDown).
- **Company abilities (Tactics)** — Unlock at company level 2: HE Artillery Barrage, 120mm Rocket Barrage, Mortar Barrage. Spend credits during missions for area damage (chance to hit, effect value per attack).

### Soldiers
- **Designations** — Rifleman, Support, Medic. Role determines loadout restrictions (e.g. weapon role) and abilities: Support gets Suppress (3 bursts, suppression).
- **Attributes** — HP, Dexterity, Morale, Toughness, Awareness. Drive derived combat stats: CTH (12 DEX or 18 AWR per 1%, cap 98%), AVD (16 AWR or 20 DEX per 1%, cap 30%), MIT (TGH-based, cap 60%, halved when stunned).
- **Traits** — 9 traits (stubborn, aggressive, relentless, flexible, disciplined, stealthy, impatient, fortified, cautious) modify base stats. Each has a codex entry with flavor text.
- **Energy** — 0–100; depleted by missions; rested soldiers recover.
- **Statuses** — Active, wounded, incapacitated, KIA, hobbled, maimed, retired, AWOL, discharged.
- **XP & levels** — Soldiers level 1–20 with exponential XP curves. Stat gains per level; every 4th level grants +1% CTH; L20 grants +2%.
- **Portraits** — Multiple faction sets: Desert Wolves (sand), Iron Corps, Liberties Vanguard, Scarlet Accord (red, blue, black palettes); 18 medic-specific portraits.

### Combat
- **Mission types** — Defend Objective, Ambush, Attack Objective, Seek and Destroy, Manhunt. Procedurally generated with locations (narrow pass, firebase, crossroads, etc.) and flavor text.
- **Difficulty** — Trivial, Easy, Medium, Hard, Extreme (1–5); affects enemy count and credit/XP rewards.
- **Turn-based** — Attack intervals from weapon speed_base + DEX (up to 20% faster at 500 DEX). Enemies and players auto-target; in-cover soldiers cannot be targeted.
- **Abilities** — Take Cover (evasion until next turn, 3s cooldown); Suppress (Support-only, 3 bursts, suppressing enemies).
- **Consumables** — Grenades (frag, incendiary/burn, smoke, M3A Repressor); medical (heal, stim +50% SPD 10s). Throwables resolve: hit roll → evade → damage; 50% splash to nearby.
- **Status effects** — Stun (can't act, mitigation halved), Panic (50% slower attack, morale shortens duration), Smoked (accuracy debuff), Burning (DoT), Blinded (50% CTH reduction), Suppressed (+10% AVD, can't attack).
- **Incapacitation** — Base 20% + 1% per level (Relentless 1.6×) to be incapacitated vs KIA when downed.
- **Memorial** — Fallen soldiers recorded: name, level, role, mission, enemies killed, killer.

### Progression
- **Company level 1–20** — XP from missions (~80–100+ missions to L10, ~200+ to L20). Unlocks armory slots, active/reserve capacity, company abilities.
- **Credits** — Start with 100k; earn from missions; spend on recruitment, market, barrages.
- **Loot** — Epic 0.5%, rare 1%, common supply 3% on mission success. Level-appropriate drops.

### Reference & Meta
- **Game Codex** — Stats (HP, MIT, AVD, CTH, MOR, TGH, AWR, DEX, SPD), traits with badge modifiers, status effects, level benefits. Tabs: Stats, Traits, Effects, Levels.
- **Memorial Wall** — Total casualties; list of fallen with mission and kill details.

---

## Gameplay

### Core Loop
1. **Setup** — Enter commander name, company name (with validation), choose unit patch. Optional: skip to company home.
2. **Recruit** — Market → Troops. Reroll soldiers for new trait profiles; add to staging; confirm to recruit. Credits deducted.
3. **Equip** — Roster or Armory. Open equip picker per soldier; click filled slots for tooltip + unequip; click empty or filled to open armory popup; drag between slots or from supplies grid.
4. **Form** — Formation screen. Drag soldiers between active/reserve. Drop zones pulse when valid. Swapped cards animate in.
5. **Missions** — Missions screen. 10 regular + 4 epic missions per batch. Pick mission → Ready Room.
6. **Ready Room** — Assign squad from formation. Deploy to combat.
7. **Combat** — Turn-based. Attacks fire on intervals; abilities and consumables on cooldown. Company barrages cost credits. Victory/defeat → rewards.
8. **Loot & XP** — Soldiers gain XP; company gains XP; credits awarded; possible item drops.
9. **Manage** — Replace losses, upgrade gear, recruit more. Memorial and Codex for reference.

### Combat Flow
- Target assignment: enemies target players; players target enemies. In-cover and downed excluded. Equal distribution across valid targets.
- Take Cover: soldier gets shield overlay, 3s duration; untargetable. Shield pulses.
- Suppress: 3 bursts; affected enemies get Suppressed (yellow overlay, arrow bounce, cannot attack).
- Grenades: primary + splash; smoke reduces CTH; incendiary applies burn (flame icon pulses).
- Medics heal; stim flashes on card.
- Damage popups animate up and fade; evade/miss popups float and disappear. Weapon hit flash, grenade hit flash, explosion on impacts.

### Screens
| Screen | Purpose |
|--------|---------|
| Home | Company stats (men, kills, missions, credits, armory), level bar, Memorial/Codex buttons |
| Market | Troops, Weapons, Armor, Supplies tabs; recruit & buy |
| Roster | Soldier list with equip picker; formation link |
| Missions | Generated mission board (10 regular, 4 epic); difficulty, credits, enemy count |
| Ready Room | Squad picker from formation; active/reserve; deploy |
| Armory | Shared inventory; same equip picker as roster |
| Tactics | Company abilities (barrages); cost and effect descriptions |
| Formation | Active/reserve slot assignment; drag-and-drop |

---

## Graphics, Look & Feel

### Visual Style
- **Military / tactical** — Gunmetal (#424756), drab greens (#555d50), camo browns (#675645, #3d3328), camo greens (#6ea171, #4d784e, #334f33), camo tan (#e1d798, #8a8249). Cyan accents (#74adb0, #b0ffff) for highlights and selected states.
- **Dark mode default** — Dark backgrounds (#242424, #222, #111); light text (rgba 0.87). Color-scheme supports light/dark.
- **Typography** — Roboto Mono primary; system-ui, Avenir, Helvetica fallbacks. Font synthesis none; antialiased.
- **Color palette** — Primary greens (#b7bc80, #a5a96c), orange (#f8b158, #de9943) for accents, magenta (#f5567a), sienna (#ee9971), red (#e52929) for danger/close. HUD lite (#cfcfcf).

### UI Elements
- **Entity cards** — Soldier cards: gradient backgrounds by designation (rifleman green, support tan, medic red); avatar, level badge, role badge; equipment slots with rarity styling.
- **Rarity tiers** — Common (white/red), Rare (blue), Epic (gold); borders, badges, glow on hover.
- **Progress bars** — Company XP (fill + shine), soldier XP, HP bars with gradient and transition.
- **Icon buttons** — Square nav with tooltips; hover scale and shadow.
- **Tooltips** — Compact item popups; equip slot tooltips on filled slots; click outside to dismiss.

### Art Assets
- **Backgrounds** — Multiple environment images (bg_76–90, store_85/88). Styler sets per screen.
- **Unit patches** — 8 player patches; 20+ enemy patches. Camo textures (camo_1–4, 84×84 and 800×800).
- **Portraits** — Faction-specific: 75 sand, 48 red, 61 blue, 76 black; 18 medic. Used in roster, formation, ready room, combat.
- **Item icons** — 20 armor, 61 ballistic weapons, 11 throwables. Level and rarity badges overlay.
- **UI** — Square icon buttons (home, market, list, mission, inventory, tactics); logo variants; info panels.

### Layout
- **App max-width** ~450px — Mobile-first; centered content.
- **Responsive** — Min 380px width, 100dvh height. Flex/grid for cards, formations, combat rows.
- **Spacing** — Page padding tokens; border-radius (md 6px, std 8px, lg 10px, xl 12px).

### Polish
- **No tap highlight** on buttons (mobile-friendly).
- **Antialiased** text; optimizeLegibility.
- **Rarity gradients** — Distinct gradients per tier; epic elite gold border and glow in combat.
- **Hover/active** — transform, box-shadow, filter, border-color transitions (~0.15–0.2s).

---

## Animations

### Animation Library (animate.css)
The game uses **animate.css** for entry/exit and attention animations. The `Animations` constant exposes 90+ presets: bounce, flash, pulse, rubberBand, shake, fadeIn/Out, slideIn/Out, zoomIn/Out, bounceIn/Out, backIn/Out, flip, rotateIn/Out, lightSpeed, rollIn/Out, jackInTheBox, etc. Each combines `animate__animated` with the named class. Options: `animate__faster` (0.5s), `animate__fast` (0.8s), `animate__slow` (2s), `animate__delay-1s`–`5s`, `animate__infinite`, `animate__repeat-1`–`3`.

**Used in:**
- **HTML replace/remove** — `animateHTMLReplace` and `animateHTMLRemove` use `backOutDown` on the outgoing element (800ms), then `backInDown` on the replacement. Used for troop card reroll and recruit removal in the Market.
- **Game enter** — `UiAnimationManager` applies `pulse` (infinite) to the game-enter element on load.
- **UiStepper** — Steps through element arrays (visibility toggle, no animation classes) for multi-step flows.

### Custom Keyframe Animations

#### Formation & Ready Room
- **formation-drop-pulse** — 1.2s ease-in-out infinite; drop zones pulse box-shadow (blue glow) when dragging a soldier.
- **formation-equip-pulse** — 1s ease-in-out infinite; similar pulse for equip drop zones.
- **ready-room-equip-pulse** — 1s ease-in-out infinite; armory drop zones in Ready Room.
- **soldier-move-in** — 0.45s cubic-bezier(0.34, 1.56, 0.64, 1); cards scale 0.9→1.06→1 and fade in when swapped or moved. Used on formation cards and ready room cards.

#### Equip Picker
- **equip-slot-swap-out** — 0.25s ease-out; source slot scales down (1→0.85→0.9) and fades when swapping items.
- **equip-slot-swap-in** — 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); destination slot scales up (1.15→1.08→1) and fades in.
- **equip-slot-plop** — 0.4s cubic-bezier; new item in slot scales 0.4→1.18→0.94→1 with slight overshoot when equipping from supplies.

#### Combat
- **combat-begin-pulse** — 1.5s ease-in-out infinite; "Begin Combat" button pulses scale and green glow.
- **combat-shield-pulse** — 1.2s ease-in-out infinite; Take Cover shield icon scales and fades.
- **combat-combat-text-pop** — 2.2s ease-out; evade/miss/hit popups scale up, float upward (~70px), and fade out.
- **combat-damage-popup-anim** — 1.5s ease-out; damage numbers and suppress label fade out.
- **combat-card-low-health-pulse** — 1s ease-in-out infinite; red glow on player cards under 20% HP.
- **combat-card-suppressed-flash** — 1.5s ease-in-out infinite; yellow box-shadow pulse on suppressed cards.
- **combat-card-suppress-arrow-bounce** — 0.45s ease-in-out infinite; suppress arrow above card bounces (translateY 0→7px).
- **combat-burn-flame-pulse** — 1.2s ease-in-out infinite; burning DoT flame icon pulses.
- **combat-stim-flash** — 1.5s ease-in-out infinite; stim-buffed cards flash.
- **combat-spd-buff-pulse** — 1.2s ease-in-out infinite; speed-buff indicator pulses.
- **combat-explosion-anim** — 0.35s ease-out; explosion overlay on grenade/barrage hits.
- **combat-knife-hit-flash** / **combat-knife-hit-flash-overlay** — 0.5s ease-out; throwing knife hit feedback.
- **combat-weapon-hit-flash** — 0.2s ease-out; ballistic weapon hit flash.
- **combat-frag-flash** — 0.15s ease-out; frag grenade impact.
- **combat-grenade-hit-flash** / **combat-grenade-hit-flash-overlay** — 0.45s ease-out; grenade hit feedback.

### CSS Transitions
- **Buttons** — transform 0.15s, box-shadow 0.2s, filter 0.2s, border-color 0.2s on hover/active.
- **Progress bars** — width 0.2s for HP/XP fills.
- **Cards** — transform 0.2s, box-shadow 0.2s on combat cards; border-color, box-shadow on formation/ready room cards.
- **Popups/tooltips** — opacity 0.15–0.25s, visibility 0.15–0.25s for show/hide.
- **Equip slots** — border-color, box-shadow transitions for selected/highlight states.

### Timing
- Most custom animations use **ease-in-out** or **ease-out**; bounce/overshoot effects use **cubic-bezier(0.34, 1.56, 0.64, 1)**. Durations: 0.15–0.5s for quick feedback; 1–2.2s for combat popups and status pulses.
