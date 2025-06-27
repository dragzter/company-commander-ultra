import { DOM } from "../../constants/css-selectors.ts";
import { clrHash } from "../../utils/html-utils.ts";
import {
  companyActionsTemplate,
  companyHeaderPartial,
} from "./game-setup-template.ts";
import { Images } from "../../constants/images.ts";

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

export const troopsMarketTemplate = () => {
  return `
<div id="troops-market" class="flex h-100 column justify-between">
	${companyHeaderPartial("Available Troops")}
	
	<div class="troops-list">
	
	<div class="entity-card">
	  <div class="card-body">
	  		<img class="card-image" src="/images/green-portrait/${Images.portrait.p_2}" alt="">

	  		<div class="card-details">
	  			<h4 class="card-title">Ronald D. Wayland</h4>
	  			<div class="details-wrapper">
						<div class="details-left">
							<div class="detail-item">
								<div>Hitpoints:</div>
								<div>89</div>
							</div>
							<div class="detail-item">
								<div>Morale:</div>
								<div>70/100</div>
							</div>
							<div class="detail-item">
								<div>Accuracy:</div>
								<div>78/100</div>
							</div>
						</div>

						<div class="details-right">
							<div class="detail-item">
								<div>Toughness:</div>
								<div>50/100</div>
							</div>
							<div class="detail-item">
								<div>Awareness:</div>
								<div>44/100</div>
							</div>
							<div class="detail-item">
								<div>Dexterity:</div>
								<div>44/100</div>
							</div>
						</div>
					</div>
				</div>
		</div>
	  <div class="card-footer">
	  	<div class="detail-item">
	  		<div>Level:</div>
	  		<div>3/10</div>
			</div>
		</div>
	</div>
	
	<div class="entity-card">
	  <div class="card-body">
	  		<img class="card-image" src="/images/green-portrait/${Images.portrait.p_6}" alt="">
	  	
	  		<div class="card-details">
	  			<h4 class="card-title">Henry F. Powers</h4>
	  			<div class="details-wrapper">
						<div class="details-left">
							<div class="detail-item">
								<div>Hitpoints:</div>
								<div>85</div>
							</div>
							<div class="detail-item">
								<div>Morale:</div>
								<div>72/100</div>
							</div>
							<div class="detail-item">
								<div>Accuracy:</div>
								<div>75/100</div>
							</div>
						</div>
						
						<div class="details-right">
							<div class="detail-item">
								<div>Toughness:</div>
								<div>53/100</div>
							</div>
							<div class="detail-item">
								<div>Awareness:</div>
								<div>48/100</div>
							</div>
							<div class="detail-item">
								<div>Dexterity:</div>
								<div>38/100</div>
							</div>
						</div>
					</div>
				</div>
		</div>
	  <div class="card-footer">
	  	<div class="detail-item">
	  		<div>Level:</div>
	  		<div>3/10</div>
			</div>
		</div>
	</div>
	
	<div class="entity-card">
	  <div class="card-body">
	  		<img class="card-image" src="/images/green-portrait/${Images.portrait.p_46}" alt="">
	  	
	  		<div class="card-details">
	  			<h4 class="card-title">Wesley J. Stone</h4>
	  			<div class="details-wrapper">
						<div class="details-left">
							<div class="detail-item">
								<div>Hitpoints:</div>
								<div>85</div>
							</div>
							<div class="detail-item">
								<div>Morale:</div>
								<div>76/100</div>
							</div>
							<div class="detail-item">
								<div>Accuracy:</div>
								<div>78/100</div>
							</div>
						</div>
						
						<div class="details-right">
							<div class="detail-item">
								<div>Toughness:</div>
								<div>50/100</div>
							</div>
							<div class="detail-item">
								<div>Awareness:</div>
								<div>43/100</div>
							</div>
							<div class="detail-item">
								<div>Dexterity:</div>
								<div>48/100</div>
							</div>
						</div>
					</div>
				</div>
		</div>
	  <div class="card-footer">
	  	<div class="detail-item">
	  		<div>Level:</div>
	  		<div>3/10</div>
			</div>
		</div>
	</div>
	
	</div>
	
	${companyActionsTemplate()}
</div>
	`;
};
