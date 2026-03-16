import { companyActionsTemplate, companyHeaderPartial } from "./game-setup-template.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";
import {
  COMPANY_ABILITY_DEFS,
  COMPANY_ABILITY_PROGRESSION,
  type CompanyAbilityId,
} from "../../constants/company-abilities.ts";

type RowKind = "single" | "choice";

function esc(v: string): string {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function talentIconNode(
  abilityId: CompanyAbilityId,
  opts: {
    level: number;
    owned: boolean;
    selected: boolean;
    selectable: boolean;
    levelUnlocked: boolean;
    choiceLocked?: boolean;
    side?: "left" | "right" | "center";
  },
): string {
  const def = COMPANY_ABILITY_DEFS[abilityId];
  const sideClass = opts.side ? ` ${opts.side}` : " center";
  const stateClass = opts.owned
    ? "owned"
    : opts.selectable
      ? "selectable"
      : opts.levelUnlocked
        ? "available"
        : "locked";

  const choiceLockedClass = opts.choiceLocked
    ? " company-talent-node-choice-locked"
    : "";

  return `<button
    type="button"
    class="company-talent-node ${stateClass}${sideClass}${choiceLockedClass}"
    data-ability-id="${abilityId}"
    data-level="${opts.level}"
    data-level-label="Lv ${opts.level}"
    data-owned="${opts.owned ? "1" : "0"}"
    data-selected="${opts.selected ? "1" : "0"}"
    data-selectable="${opts.selectable ? "1" : "0"}"
    data-name="${esc(def.name)}"
    data-kind="${esc(def.kind)}"
    data-short="${esc(def.short)}"
    data-description="${esc(def.description)}"
    data-icon="${esc(def.icon)}"
    data-cooldown-seconds="${def.cooldownSeconds ? String(def.cooldownSeconds) : ""}"
    title="${esc(def.name)}"
  >
    <img src="${def.icon}" alt="${esc(def.name)}" width="56" height="56">
  </button>`;
}

function placeholderNode(level: number): string {
  return `<div class="company-talent-node placeholder center" data-level="${level}" data-level-label="Lv ${level}" aria-hidden="true">
    <span class="company-talent-placeholder">?</span>
  </div>`;
}

function connectorHtml(
  fromNode: (typeof COMPANY_ABILITY_PROGRESSION)[number],
  toNode: (typeof COMPANY_ABILITY_PROGRESSION)[number],
  choices: Record<number, CompanyAbilityId | undefined>,
  ownedSet: ReadonlySet<CompanyAbilityId>,
): string {
  const fromKind: RowKind = fromNode.choice?.length ? "choice" : "single";
  const toKind: RowKind = toNode.choice?.length ? "choice" : "single";

  if (fromKind === "single" && toKind === "choice") {
    const picked = choices[toNode.level];
    const leftId = toNode.choice?.[0];
    const rightId = toNode.choice?.[1];
    const leftActive = !!picked && picked === leftId;
    const rightActive = !!picked && picked === rightId;
    return `<div class="company-talent-connector split" aria-hidden="true">
      <svg viewBox="0 0 250 60" preserveAspectRatio="none">
        <defs>
          <marker id="talent-arrow-gray" markerUnits="userSpaceOnUse" markerWidth="4" markerHeight="4" refX="3.6" refY="2" orient="auto">
            <path d="M0,0 L4,2 L0,4 Z" fill="rgba(152,166,187,0.9)" />
          </marker>
          <marker id="talent-arrow-active" markerUnits="userSpaceOnUse" markerWidth="4" markerHeight="4" refX="3.6" refY="2" orient="auto">
            <path d="M0,0 L4,2 L0,4 Z" fill="rgba(116,245,171,0.95)" />
          </marker>
        </defs>
        <line x1="125" y1="0" x2="46" y2="60" class="talent-line${leftActive ? " active" : ""}" marker-end="url(#${leftActive ? "talent-arrow-active" : "talent-arrow-gray"})" />
        <line x1="125" y1="0" x2="204" y2="60" class="talent-line${rightActive ? " active" : ""}" marker-end="url(#${rightActive ? "talent-arrow-active" : "talent-arrow-gray"})" />
      </svg>
    </div>`;
  }

  if (fromKind === "choice" && toKind === "single") {
    const picked = choices[fromNode.level];
    const leftId = fromNode.choice?.[0];
    const rightId = fromNode.choice?.[1];
    const toOwned = !!toNode.autoGrant && ownedSet.has(toNode.autoGrant);
    const leftActive = toOwned || (!!picked && picked === leftId);
    const rightActive = toOwned || (!!picked && picked === rightId);
    return `<div class="company-talent-connector merge" aria-hidden="true">
      <svg viewBox="0 0 250 60" preserveAspectRatio="none">
        <defs>
          <marker id="talent-arrow-gray-merge" markerUnits="userSpaceOnUse" markerWidth="4" markerHeight="4" refX="3.6" refY="2" orient="auto">
            <path d="M0,0 L4,2 L0,4 Z" fill="rgba(152,166,187,0.9)" />
          </marker>
          <marker id="talent-arrow-active-merge" markerUnits="userSpaceOnUse" markerWidth="4" markerHeight="4" refX="3.6" refY="2" orient="auto">
            <path d="M0,0 L4,2 L0,4 Z" fill="rgba(116,245,171,0.95)" />
          </marker>
        </defs>
        <line x1="46" y1="0" x2="125" y2="60" class="talent-line${leftActive ? " active" : ""}" marker-end="url(#${leftActive ? "talent-arrow-active-merge" : "talent-arrow-gray-merge"})" />
        <line x1="204" y1="0" x2="125" y2="60" class="talent-line${rightActive ? " active" : ""}" marker-end="url(#${rightActive ? "talent-arrow-active-merge" : "talent-arrow-gray-merge"})" />
      </svg>
    </div>`;
  }

  return `<div class="company-talent-connector straight" aria-hidden="true">
    <svg viewBox="0 0 250 60" preserveAspectRatio="none">
      <defs>
        <marker id="talent-arrow-gray-straight" markerUnits="userSpaceOnUse" markerWidth="4" markerHeight="4" refX="3.6" refY="2" orient="auto">
          <path d="M0,0 L4,2 L0,4 Z" fill="rgba(152,166,187,0.9)" />
        </marker>
      </defs>
      <line x1="125" y1="0" x2="125" y2="60" class="talent-line" marker-end="url(#talent-arrow-gray-straight)" />
    </svg>
  </div>`;
}

export function abilitiesTemplate(): string {
  const {
    companyLevel,
    companyAbilityChoices,
    companyAbilityUnlockedIds,
    companyAbilityNotificationText,
  } = usePlayerCompanyStore.getState();

  const ownedSet = new Set(companyAbilityUnlockedIds ?? []);
  const choices = (companyAbilityChoices ?? {}) as Record<
    number,
    CompanyAbilityId | undefined
  >;
  const level = Math.max(1, Math.floor(companyLevel ?? 1));

  const rowsAndConnectors: string[] = [];

  for (let idx = 0; idx < COMPANY_ABILITY_PROGRESSION.length; idx++) {
    const node = COMPANY_ABILITY_PROGRESSION[idx];
    const levelUnlocked = node.level <= level;
    const rowClass = `${node.choice?.length ? " choice-row" : " single-row"} ${idx % 2 === 0 ? "tier-band-a" : "tier-band-b"}`;

    let nodesHtml = "";
    if (node.autoGrant) {
      nodesHtml = talentIconNode(node.autoGrant, {
        level: node.level,
        owned: ownedSet.has(node.autoGrant),
        selected: ownedSet.has(node.autoGrant),
        selectable: false,
        levelUnlocked,
        side: "center",
      });
    } else if (node.choice && node.choice.length >= 2) {
      const selected = choices[node.level];
      const canChooseHere = levelUnlocked && !selected;
      nodesHtml = `${talentIconNode(node.choice[0], {
        level: node.level,
        owned: ownedSet.has(node.choice[0]),
        selected: selected === node.choice[0],
        selectable: canChooseHere,
        levelUnlocked,
        choiceLocked: !!selected && selected !== node.choice[0],
        side: "left",
      })}
      ${talentIconNode(node.choice[1], {
        level: node.level,
        owned: ownedSet.has(node.choice[1]),
        selected: selected === node.choice[1],
        selectable: canChooseHere,
        levelUnlocked,
        choiceLocked: !!selected && selected !== node.choice[1],
        side: "right",
      })}`;
    } else {
      nodesHtml = placeholderNode(node.level);
    }

    rowsAndConnectors.push(`<section class="company-talent-row${rowClass}" data-level-row="${node.level}">
      <div class="company-talent-row-level">LV ${node.level}</div>
      <div class="company-talent-row-nodes">${nodesHtml}</div>
    </section>`);

    const nextNode = COMPANY_ABILITY_PROGRESSION[idx + 1];
    if (nextNode) {
      rowsAndConnectors.push(connectorHtml(node, nextNode, choices, ownedSet));
    }
  }

  const notifyPopup = companyAbilityNotificationText
    ? `<div id="company-abilities-notify-popup" class="home-onboarding-popup helper-onboarding-popup" role="dialog" aria-modal="true">
      <div class="home-onboarding-dialog helper-onboarding-dialog">
        <div class="home-onboarding-copy helper-onboarding-copy">
          <h4 class="home-onboarding-title helper-onboarding-title">New Company Capability</h4>
          <p class="home-onboarding-text helper-onboarding-text helper-onboarding-typed-text" id="company-abilities-notify-text" data-full-text="${esc(companyAbilityNotificationText)}"></p>
          <button id="company-abilities-notify-continue" type="button" class="game-btn game-btn-md game-btn-green home-onboarding-continue helper-onboarding-continue">Continue</button>
        </div>
        <div class="home-onboarding-image-wrap helper-onboarding-image-wrap">
          <img src="/images/green-portrait/portrait_0.png" alt="Squad soldier" class="home-onboarding-image helper-onboarding-image">
        </div>
      </div>
    </div>`
    : "";
  const tacticsIntroPopup = usePlayerCompanyStore.getState()
    .onboardingTacticsIntroPending
    ? `<div id="tactics-onboarding-popup" class="home-onboarding-popup helper-onboarding-popup" role="dialog" aria-modal="true">
      <div class="home-onboarding-dialog helper-onboarding-dialog">
        <div class="home-onboarding-copy helper-onboarding-copy">
          <h4 class="home-onboarding-title helper-onboarding-title">Tactics</h4>
          <p class="home-onboarding-text helper-onboarding-text helper-onboarding-typed-text" id="tactics-onboarding-typed-text" data-full-text="These are your company abilities. As your company levels up, you gain passive bonuses and active abilities. Active abilities appear in the battle action bar during missions."></p>
          <button id="tactics-onboarding-continue" type="button" class="game-btn game-btn-md game-btn-green home-onboarding-continue helper-onboarding-continue">Continue</button>
        </div>
        <div class="home-onboarding-image-wrap helper-onboarding-image-wrap">
          <img src="/images/green-portrait/portrait_0.png" alt="Squad soldier" class="home-onboarding-image helper-onboarding-image">
        </div>
      </div>
    </div>`
    : "";

  return `
<div id="abilities-screen" class="abilities-root troops-market-root">
  ${companyHeaderPartial("Company Tactics")}
  <div class="abilities-main company-abilities-main">
    <div class="company-talent-tree" id="company-talent-tree">${rowsAndConnectors.join("")}</div>
  </div>
  <div class="abilities-footer troops-market-footer">
    <div id="company-ability-tooltip" class="company-ability-tooltip" hidden>
      <div class="company-ability-tooltip-inner">
        <div class="company-ability-tooltip-kicker-row">
          <div class="company-ability-tooltip-kicker">Tactical Brief</div>
          <span id="company-ability-detail-cooldown" class="company-ability-cooldown-pill" hidden>CD 0s</span>
        </div>
        <div class="company-ability-tooltip-main">
          <div class="company-ability-tooltip-copy">
            <div class="company-ability-tooltip-title-row">
              <h4 id="company-ability-detail-title" class="company-ability-tooltip-title">Ability Details</h4>
              <span id="company-ability-detail-kind" class="company-ability-kind-pill company-ability-kind-passive">Passive</span>
              <span id="company-ability-detail-status" class="company-ability-status-pill company-ability-status-known" hidden>Known</span>
            </div>
            <p id="company-ability-detail-description" class="company-talent-popup-desc company-ability-tooltip-desc">Tap an ability node to inspect details.</p>
          </div>
          <div class="company-ability-tooltip-icon-col">
            <img id="company-ability-detail-icon" class="company-ability-tooltip-icon" src="/images/scan.png" alt="Ability icon" width="90" height="90">
          </div>
        </div>
        <div id="company-ability-tooltip-actions" class="company-talent-popup-actions company-ability-tooltip-actions">
          <button id="company-ability-detail-learn" type="button" class="game-btn game-btn-sm game-btn-green" hidden>Learn</button>
        </div>
      </div>
    </div>
    ${companyActionsTemplate()}
  </div>

  ${tacticsIntroPopup}
  ${notifyPopup}
</div>`;
}
