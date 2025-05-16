export const gameSetupTemplate = `<div class="setup-game-wrapper">
                    <div class="step flex column justify-between h-100">
                        <div class="step-content">
                            <h3 class="font-h2">Create Your Company</h3>

                            <div class="input-wrapper">
                                <label for="user-name">Your Name</label>
                                <input id="user-name" type="text" placeholder="Your Name">
                            </div>

                            <div class="input-wrapper">
                                <label for="company-name">Company Name</label>
                                <input id="company-name" type="text" placeholder="e.g. The Tiger Hawks">
                            </div>
                        </div>

                        <div class="step-body">
                            <h3>Choose Your Unit Patch</h3>
                            <div class="grid grid-8-col grid-align-center grid-justify-center">
                                <img class="grid-img-fit" src="/images/ui/patch_1.png" data-img="patch_1.png" alt="Unit Patch">
                                <img class="grid-img-fit" src="/images/ui/patch_2.png" data-img="patch_2.png" alt="Unit Patch">
                                <img class="grid-img-fit" src="/images/ui/patch_3.png" data-img="patch_3.png" alt="Unit Patch">
                                <img class="grid-img-fit" src="/images/ui/patch_4.png" data-img="patch_4.png" alt="Unit Patch">
                                <img class="grid-img-fit" src="/images/ui/patch_5.png" data-img="patch_5.png" alt="Unit Patch">
                                <img class="grid-img-fit" src="/images/ui/patch_6.png" data-img="patch_6.png" alt="Unit Patch">
                                <img class="grid-img-fit" src="/images/ui/patch_7.png" data-img="patch_7.png" alt="Unit Patch">
                                <img class="grid-img-fit" src="/images/ui/patch_8.png" data-img="patch_8.png" alt="Unit Patch">
                            </div>
                        </div>

                        <div class="setup-footer flex justify-between">
                            <button id="cancel-game-setup" class="mbtn red">Cancel</button>
                            <button id="finish-game-setup" class="mbtn green disabled" disabled>Next</button>
                        </div>
                    </div>
                </div>`;
