import { DOM } from "../../constants/css-selectors.ts";
import { clrHash } from "../../utils/html-utils.ts";
import {
  companyActionsTemplate,
  companyHeaderPartial,
} from "./game-setup-template.ts";
import type { Soldier } from "../entities/types.ts";
import { Images } from "../../constants/images.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";

export const marketTemplate = () => {
  const { market } = DOM;
  const c = (d: string) => clrHash(d);

  return `
	<div id="cc-market" class="flex h-100 column justify-between">
    ${companyHeaderPartial()}
	
		<div class="text-center">
			<h1>Market</h1>
			<div class="flex column align-center justify-between">
				<button id="${c(market.marketTroopsLink)}" class="green mbtn mb-3">Troops</button>
				<button id="${c(market.marketArmorLink)}" class="blue mbtn mb-3">Body Armor</button>
				<button id="${c(market.marketWeaponsLink)}" class="blue mbtn mb-3">Weapons</button>
				<button id="${c(market.marketSuppliesLink)}" class="blue mbtn">Supplies</button>
			</div>
		</div>
		
		${companyActionsTemplate()}
	</div>
	`;
};

export const troopsMarketTemplate = (
  troops: Soldier[],
  rerolls = usePlayerCompanyStore.getState().recruitReroll,
) => {
  return `
<div id="troops-market" class="flex h-100 column justify-between">
	${companyHeaderPartial("Available Troops")}
	
	<div class="troops-list">
	<div class="reroll-counter">Rerolls: ${rerolls}</div>
	${troops
    .map((trooper) => {
      return `
			<div class="entity-card designation-${trooper.designation}" >
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
								<button data-reroll="${trooper.id}" class="mbtn icon-btn reroll-recruit pe-0" title="Reroll">
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
									<div>Morale:</div>
									<div>${trooper.attributes.morale} / 100</div>
								</div>
								<div class="detail-item">
									<div>Accuracy:</div>
									<div>${trooper.combatProfile.chanceToHit * 100}% / 100%</div>
								</div>
							</div>
	
							<div class="details-right">
								<div class="detail-item">
									<div>Toughness:</div>
									<div>${trooper.attributes.toughness} / 100</div>
								</div>
								<div class="detail-item">
									<div>Awareness:</div>
									<div>${trooper.attributes.awareness} / 100</div>
								</div>
								<div class="detail-item">
									<div>Dexterity:</div>
									<div>${trooper.attributes.dexterity} / 100</div>
								</div>
							</div>
						</div>
					</div>
			</div>
				<div class="card-footer">
					<div class="detail-item">
						<div>Level:</div>
						<div>${trooper.level}/10</div>
						<div>${trooper.trait_profile.name.toUpperCase()}</div>
					</div>
				</div>
			</div>`;
    })
    .join("")}
	</div>
	<div id="recruit-staging"></div>
	${companyActionsTemplate()}
</div>
	`;
};
