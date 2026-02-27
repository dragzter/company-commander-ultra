import type { Soldier, SoldierTraitProfile } from "../../entities/types.ts";
import { getRecruitCost } from "../../../constants/economy.ts";
import { soldierXpBar } from "../components/soldier-xp-bar.ts";
import { formatPctOneDecimal, getSoldierAttackIntervalMs, getBaseAndGearStats, formatStatBaseAndGear } from "../../../utils/soldier-stats-utils.ts";
import { UiServiceManager } from "../../../services/ui/ui-service.ts";
import { formatDesignation, formatDisplayName, getSoldierPortraitUrl } from "../../../utils/name-utils.ts";

/**
 * Creates HTML partials
 */
function Partial() {
  const { parseHTML } = UiServiceManager;

  /**
   * Create HTML for a trooper entity-card for the troops market page.
   * Layout: avatar | name (row 1), stats (row 2), buttons (row 3)
   * Stat labels: HP, MIT, AVD, CTH, MOR, TGH, AWR, DEX
   * @param trooper: Soldier
   * @param canRecruit: whether the player can add one more to staging (afford + cap)
   * @param canReroll: whether reroll is available (counter > 0)
   */
  function _t(trooper: Soldier, canRecruit = true, canReroll = true) {
    const disabledClass = canRecruit ? "" : " recruit-disabled";
    const recruitDisabledAttr = canRecruit ? "" : ' aria-disabled="true"';
    const rerollDisabledAttr = canReroll ? "" : ' disabled aria-disabled="true"';
    const rerollDisabledClass = canReroll ? "" : " reroll-disabled";
    const bg = getBaseAndGearStats(trooper);
    const hp = formatStatBaseAndGear(bg.hp.base, bg.hp.gear);
    const mit = formatPctOneDecimal(trooper.combatProfile.mitigateDamage);
    const avd = formatPctOneDecimal(trooper.combatProfile.chanceToEvade);
    const cth = formatPctOneDecimal(trooper.combatProfile.chanceToHit);
    const mor = formatStatBaseAndGear(bg.mor.base, bg.mor.gear);
    const tgh = formatStatBaseAndGear(bg.tgh.base, bg.tgh.gear);
    const awr = formatStatBaseAndGear(bg.awr.base, bg.awr.gear);
    const dex = formatStatBaseAndGear(bg.dex.base, bg.dex.gear);
    const spdMs = getSoldierAttackIntervalMs(trooper);
    const spdRow = spdMs != null ? `<div class="detail-item"><span class="stat-label">Spd</span><span class="stat-value">${(spdMs / 1000).toFixed(1)}s</span></div>` : "";
    return `
			<div data-troopercard="${trooper.id}" class="entity-card designation-${trooper.designation}${disabledClass}" >
				<div class="card-body">
					<div class="card-row card-row-1">
						<img class="card-image" src="${getSoldierPortraitUrl(trooper.avatar, trooper.designation)}" alt="Trooper Image">
						<div class="card-title-block">
							<span class="card-name">${formatDisplayName(trooper.name)}</span>
							<span class="equip-picker-role equip-picker-role-${(trooper.designation ?? "rifleman").toLowerCase()}" data-role="${trooper.designation ?? "rifleman"}">${formatDesignation(trooper.designation)}</span>
						</div>
					</div>
					<div class="card-row card-row-2">
						<div class="card-stats-grid">
							<div class="detail-item stat-hp"><span class="stat-label">HP</span><span class="stat-value">${hp}</span></div>
							<div class="detail-item"><span class="stat-label">MIT</span><span class="stat-value">${mit}%</span></div>
							<div class="detail-item"><span class="stat-label">AVD</span><span class="stat-value">${avd}%</span></div>
							<div class="detail-item"><span class="stat-label">CTH</span><span class="stat-value">${cth}%</span></div>
							${spdRow}
							<div class="detail-item"><span class="stat-label">TGH</span><span class="stat-value">${tgh}</span></div>
							<div class="detail-item"><span class="stat-label">MOR</span><span class="stat-value">${mor}</span></div>
							<div class="detail-item"><span class="stat-label">AWR</span><span class="stat-value">${awr}</span></div>
							<div class="detail-item"><span class="stat-label">DEX</span><span class="stat-value">${dex}</span></div>
						</div>
					</div>
					<div class="card-row card-row-3">
						<div class="card-actions card-actions-recruit">
							<button data-trooperid="${trooper.id}" class="troop-recruit-btn troop-recruit-reroll reroll-soldier${rerollDisabledClass}" title="Reroll"${rerollDisabledAttr}>Reroll</button>
							<button data-trooper-id="${trooper.id}" data-can-recruit="${canRecruit}" title="Recruit" class="troop-recruit-btn troop-recruit-buy recruit-soldier"${recruitDisabledAttr}><span class="recruit-btn-label">Recruit</span> <span class="recruit-btn-price">$${getRecruitCost(trooper.trait_profile?.stats)}</span></button>
						</div>
					</div>
				</div>
				<div class="card-footer">
					<span class="trooper-level-badge">Lv ${trooper.level}</span>
					${_traitWithTooltip(trooper.trait_profile)}
					${soldierXpBar(trooper)}
				</div>
			</div>`;
  }

  /**
   * Pass the HTML string through the HTML parser
   * @param trooper: Soldier
   * @param canRecruit: whether the player can add one more to staging
   * @param canReroll: whether reroll is available (counter > 0)
   */
  function _pt(trooper: Soldier, canRecruit = true, canReroll = true): HTMLElement {
    return parseHTML(_t(trooper, canRecruit, canReroll)) as HTMLElement;
  }

  /**
   * Roster soldier card - same layout as troops market entity card but with Inventory and Release buttons.
   */
  function _rsc(soldier: Soldier, index: number, isActive: boolean) {
    const slotClass = isActive ? "roster-active" : "roster-reserve";
    const combat = soldier.combatProfile ?? {};
    const bg = getBaseAndGearStats(soldier);
    const hp = formatStatBaseAndGear(bg.hp.base, bg.hp.gear);
    const mit = formatPctOneDecimal(combat.mitigateDamage ?? 0);
    const avd = formatPctOneDecimal(combat.chanceToEvade ?? 0);
    const cth = formatPctOneDecimal(combat.chanceToHit ?? 0);
    const mor = formatStatBaseAndGear(bg.mor.base, bg.mor.gear);
    const tgh = formatStatBaseAndGear(bg.tgh.base, bg.tgh.gear);
    const awr = formatStatBaseAndGear(bg.awr.base, bg.awr.gear);
    const dex = formatStatBaseAndGear(bg.dex.base, bg.dex.gear);
    const avatar = soldier.avatar ?? "default.png";
    const portraitUrl = getSoldierPortraitUrl(avatar, soldier.designation);
    const spdMs = getSoldierAttackIntervalMs(soldier);
    const spdRow = spdMs != null ? `<div class="detail-item"><span class="stat-label">Spd</span><span class="stat-value">${(spdMs / 1000).toFixed(1)}s</span></div>` : "";
    return `
<div data-soldier-id="${soldier.id}" data-soldier-index="${index}" class="entity-card roster-card designation-${soldier.designation ?? "rifleman"} ${slotClass}">
  <div class="card-body">
    <div class="card-row card-row-1">
      <div class="roster-left">
        <img class="card-image" src="${portraitUrl}" alt="">
        <div class="roster-hp-wrap">
          <div class="roster-hp-bar" style="width: 100%"></div>
          <span class="roster-hp-value">HP ${bg.hp.base}${bg.hp.gear > 0 ? `+<span class="stat-gear">${bg.hp.gear}</span>` : ""}</span>
        </div>
      </div>
      <div class="card-title-block">
        <span class="card-name">${formatDisplayName(soldier.name)}</span>
        <span class="equip-picker-role equip-picker-role-${(soldier.designation ?? "rifleman").toLowerCase()}" data-role="${soldier.designation ?? "rifleman"}">${formatDesignation(soldier.designation)}</span>
      </div>
    </div>
    <div class="card-row card-row-2">
      <div class="card-stats-grid card-stats-grid-base-second">
        <div class="detail-item"><span class="stat-label">MIT</span><span class="stat-value">${mit}%</span></div>
        <div class="detail-item"><span class="stat-label">AVD</span><span class="stat-value">${avd}%</span></div>
        <div class="detail-item"><span class="stat-label">CTH</span><span class="stat-value">${cth}%</span></div>
        ${spdRow}
        <div class="detail-item"><span class="stat-label">TGH</span><span class="stat-value">${tgh}</span></div>
        <div class="detail-item"><span class="stat-label">MOR</span><span class="stat-value">${mor}</span></div>
        <div class="detail-item"><span class="stat-label">AWR</span><span class="stat-value">${awr}</span></div>
        <div class="detail-item"><span class="stat-label">DEX</span><span class="stat-value">${dex}</span></div>
      </div>
    </div>
    <div class="card-row card-row-3">
      <div class="card-actions card-actions-50">
        <button type="button" data-soldier-id="${soldier.id}" class="game-btn game-btn-md game-btn-green roster-inventory-btn" title="Equipment">Inventory</button>
        <button type="button" data-soldier-id="${soldier.id}" class="game-btn game-btn-md game-btn-red roster-release-btn" title="Release">Release</button>
      </div>
    </div>
  </div>
  <div class="card-footer">
    <span class="trooper-level-badge">Lv ${soldier.level}</span>
    ${_traitWithTooltip(soldier.trait_profile)}
    ${soldierXpBar(soldier)}
  </div>
</div>`;
  }

  /**
   * Displayed when a user selects a soldier for recruitment on the market trooper screen.
   * Avatar full width edge-to-edge, metadata with camo background, X button top-right of avatar.
   * @param soldier
   */
  function _stc(soldier: Soldier) {
    const des = (soldier.designation ?? "rifleman").toLowerCase();
    return `
    <div data-staged-soldier-id="${soldier.id}" class="staged-trooper-card designation-${des}">
        <button type="button" data-soldier-id="${soldier.id}" class="staged-trooper-remove remove-from-staging" title="Remove from selection" aria-label="Remove from selection">&times;</button>
        <div class="staged-trooper-avatar-wrap">
            <img src="${getSoldierPortraitUrl(soldier.avatar, soldier.designation)}" alt="Staged Trooper" class="staged-trooper-avatar">
            <span class="staged-trooper-role">${formatDesignation(soldier.designation)}</span>
        </div>
        <span class="staged-trooper-level">${soldier.level}</span>
        ${soldierXpBar(soldier)}
        <div class="staged-trooper-metadata">
            <p class="staged-trooper-name">${formatDisplayName(soldier.name)}</p>
        </div>
    </div>`;
  }

  /**
   * Parsed staged trooper card (for appending dynamically).
   */
  function _pstc(soldier: Soldier): HTMLElement {
    return parseHTML(_stc(soldier)) as HTMLElement;
  }

  /**
   * Reroll counter div
   */
  function _rc(counter: number) {
    const emptyClass = counter <= 0 ? " reroll-empty" : "";
    return parseHTML(`<div class="recruit-staging-reroll reroll-counter${emptyClass}">Rerolls: ${counter}</div>`);
  }

  const STAT_KEYS: Record<string, string> = {
    hit_points: "HP",
    morale: "MOR",
    toughness: "TGH",
    awareness: "AWR",
    dexterity: "DEX",
  };

  function _traitProfileHTML(traitProfile: SoldierTraitProfile) {
    return `
    <div class="trait-profile-grid">
        ${Object.entries(traitProfile)
          .map(
            ([k, v]) =>
              `<span class="trait-profile-row"><span class="trait-profile-key">${(STAT_KEYS[k] ?? k).replaceAll("_", " ")}</span><span class="trait-profile-num">${v > 0 ? "+" : ""}${v}</span></span>`,
          )
          .join("")}
    </div>
    `;
  }

  function _parsedTraitProfileHTML(traitProfile: SoldierTraitProfile) {
    return parseHTML(_traitProfileHTML(traitProfile));
  }

  /**
   * Reusable trait display with hover tooltip (same as market).
   * Use in both troops market cards and roster cards.
   */
  function _traitWithTooltip(profile: { name: string; stats?: Record<string, number> } | null | undefined): string {
    if (!profile?.name) return "";
    const name = profile.name.toUpperCase().replaceAll("_", " ");
    const stats = profile.stats ?? {};
    return `
<div class="tooltip-wrapper trait-tooltip-wrap">
  <span class="trait-profile">${name}</span>
  <div class="tooltip-body trait-profile-tooltip">
    ${_traitProfileHTML(stats)}
  </div>
</div>`;
  }

  return {
    render: {
      parsedTrooper: _pt,
      parsedStagedTrooperCard: _pstc,
      parsedRerollCounter: _rc,
      parsedTraitProfile: _parsedTraitProfileHTML,
    },
    create: {
      stagedTrooperCard: _stc,
      trooper: _t,
      rosterCard: _rsc,
      soldierXpBar,
      traitProfile: _traitProfileHTML,
      traitWithTooltip: _traitWithTooltip,
    },
  };
}

const singleton = Partial();

export { singleton as Partial };
