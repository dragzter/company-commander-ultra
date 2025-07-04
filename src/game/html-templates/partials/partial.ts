import type { Soldier, SoldierTraitProfile } from "../../entities/types.ts";
import { Images } from "../../../constants/images.ts";
import { UiServiceManager } from "../../../services/ui/ui-service.ts";

/**
 * Creates HTML partials
 */
function Partial() {
  const { parseHTML } = UiServiceManager;

  /**
   * Create HTML for a trooper entity-card for the troops market page.
   * @param trooper: Soldier
   */
  function _t(trooper: Soldier) {
    return `
			<div data-troopercard="${trooper.id}" class="entity-card designation-${trooper.designation}" >
				<div class="card-body">
					<img class="card-image" src="/images/green-portrait/${trooper.avatar}" alt="Troopert Image">
					<div class="card-details">
						<h4 class="card-title flex justify-between align-center">
							<span>
								${trooper.name}
								<span class="designation">
									${trooper.designation.toUpperCase()}
								</span>
							</span>
							<span>
								<button data-trooperid="${trooper.id}" class="mbtn icon-btn reroll-soldier pe-0" title="Reroll">
									<img width="30" src="images/ui/square/${Images.btn.sq_btn_redo}" alt="Reroll">
								</button>
								<button data-trooperjson="${JSON.stringify(trooper)}" title="Recruit" class="mbtn icon-btn recruit-soldier pe-0">
									<img width="30" src="images/ui/square/${Images.btn.sq_add}" alt="Add soldier to company">
								</button>
							</span>
						</h4>
						<div class="details-wrapper">
							<div class="details-left">
								<div class="detail-item">
									<div>Hitpoints:</div>
									<div>${trooper.attributes.hit_points}</div>
								</div>
								<div class="detail-item">
									<div>Mitigation:</div>
									<div>${Math.floor(trooper.combatProfile.mitigateDamage * 100)}% / 100%</div>
								</div>
								<div class="detail-item">
									<div>Evade Chance:</div>
									<div>${Math.floor(trooper.combatProfile.chanceToEvade * 100)}% / 100%</div>
								</div>
								<div class="detail-item">
									<div>Hit Chance:</div>
									<div>${Math.floor(trooper.combatProfile.chanceToHit * 100)}% / 100%</div>
								</div>
							</div>
	
							<div class="details-right">
							  <div class="detail-item">
									<div>Morale:</div>
									<div>${trooper.attributes.morale}</div>
								</div>
								<div class="detail-item">
									<div>Toughness:</div>
									<div>${trooper.attributes.toughness}</div>
								</div>
								<div class="detail-item">
									<div>Awareness:</div>
									<div>${trooper.attributes.awareness}</div>
								</div>
								<div class="detail-item">
									<div>Dexterity:</div>
									<div>${trooper.attributes.dexterity}</div>
								</div>
							</div>
						</div>
					</div>
			</div>
				<div class="card-footer">
					<div class="detail-item">
						<div>Level:</div>
						<div>${trooper.level}/10</div>
						<div class="tooltip-wrapper">
                <span class="trait-profile">${trooper.trait_profile.name.toUpperCase().replaceAll("_", " ")}</span>
                <div class="tooltip-body">
                    ${_traitProfileHTML(trooper.trait_profile.stats)}
                </div>
						</div>
					</div>
				</div>
			</div>`;
  }

  /**
   * Pass the HTML string through the HTML parser
   * @param trooper: Soldier
   */
  function _pt(trooper: Soldier): HTMLElement {
    return parseHTML(_t(trooper)) as HTMLElement;
  }

  /**
   * Reroll counter div
   */
  function _rc(counter: number) {
    return parseHTML(`<div class="reroll-counter">Rerolls: ${counter}</div>`);
  }

  function _traitProfileHTML(traitProfile: SoldierTraitProfile) {
    return `
    <div>
        ${Object.entries(traitProfile)
          .map((tp) => {
            return `<div class="trait-profile-value">${tp[0].replaceAll("_", " ").toUpperCase()}: <span>${tp[1]}</span></div>`;
          })
          .join("")}
    </div>
    `;
  }

  function _parsedTraitProfileHTML(traitProfile: SoldierTraitProfile) {
    return parseHTML(_traitProfileHTML(traitProfile));
  }

  return {
    render: {
      parsedTrooper: _pt,
      parsedRerollCounter: _rc,
      parsedTraitProfile: _parsedTraitProfileHTML,
    },
    create: { trooper: _t, traitProfile: _traitProfileHTML },
  };
}

const singleton = Partial();

export { singleton as Partial };
