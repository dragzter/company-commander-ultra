import { DOM } from "../../constants/css-selectors.ts";
import { RECRUIT_COST_PER_SOLDIER } from "../../constants/economy.ts";
import { clrHash } from "../../utils/html-utils.ts";
import {
  companyActionsTemplate,
  companyHeaderPartial,
} from "./game-setup-template.ts";
import type { Soldier } from "../entities/types.ts";
import { usePlayerCompanyStore } from "../../store/ui-store.ts";
import { Partial } from "./partials/partial.ts";

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
  rerolls = usePlayerCompanyStore.getState().rerollCounter,
) => {
  const store = usePlayerCompanyStore.getState();
  const recruitStaging = store.recruitStaging ?? [];
  const { creditBalance } = store;
  const totalCost = recruitStaging.length * RECRUIT_COST_PER_SOLDIER;
  const canAfford = creditBalance >= totalCost;
  const hasStaged = recruitStaging.length > 0;
  return `
<div id="troops-market" class="flex h-100 column justify-between">
	${companyHeaderPartial("Available Troops")}
	<div class="recruit-balance p-2">Credits: $${creditBalance} | Selected: ${recruitStaging.length} × $${RECRUIT_COST_PER_SOLDIER} = $${totalCost}</div>
	<div class="troops-list">
	<div class="reroll-counter">Rerolls: ${rerolls}</div>
	${troops.map((trooper) => Partial.create.trooper(trooper)).join("")}
	</div>
	<div id="recruit-staging-area" class="recruit-staging-area">
		<p class="recruit-staging-label">Selected for recruitment</p>
		<div id="recruit-staging">
		${recruitStaging.map((s) => Partial.create.stagedTrooperCard(s)).join("")}
		</div>
		<button id="confirm-recruitment" type="button" class="mbtn green ${!hasStaged || !canAfford ? "disabled" : ""}" ${!hasStaged || !canAfford ? "disabled" : ""}>Confirm recruitment ($${totalCost})</button>
	</div>
	${companyActionsTemplate()}
</div>
	`;
};
