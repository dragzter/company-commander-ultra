function UiStepper(
  totalSteps: number,
  parentContainer: HTMLElement,
  elementArray: HTMLElement[],
) {
  if (elementArray.length < totalSteps || totalSteps < 1) {
    throw new Error("Invalid totalSteps or insufficient elements");
  }

  let step = 0;
  let currentElement = elementArray[step];
  console.log("stepping through");

  function _stepUp() {
    if (step < totalSteps - 1) {
      step += 1;
      currentElement = elementArray[step];
      update();
    }
  }

  function _stepDown() {
    if (step > 1) {
      step -= 1;
      currentElement = elementArray[step];
      update();
    }
  }

  function goToStep(s: number) {
    if (s >= 0 && s < totalSteps) {
      step = s;
      currentElement = elementArray[s];
      update();
    }
  }

  function update() {
    elementArray.forEach((el, index) => {
      if (index === step) {
        el.style.visibility = "visible";
        el.setAttribute("aria-hidden", "false");
      } else {
        el.style.visibility = "hidden";
        el.setAttribute("aria-hidden", "true");
      }
    });
  }

  function init() {
    parentContainer.style.position = "relative";
    elementArray.forEach((el) => {
      el.style.position = "absolute";
      el.style.top = "0";
      el.style.left = "0";
    });
    parentContainer.append(...elementArray);
    update();
  }

  function destroy() {
    parentContainer.innerHTML = "";
  }

  return {
    up: () => _stepUp(),
    down: () => _stepDown(),
    getCurrentElement: () => currentElement,
    getElementAtStep: (s: number) => elementArray[s],
    init,
    goToStep,
    destroy,
  };
}

export { UiStepper };
