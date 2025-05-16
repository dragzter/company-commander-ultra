function UiAnimationManager() {
  function animate(el: HTMLElement, animation: string) {
    el.classList.add(
      "infinite",
      "animate__animated",
      animation,
      "animate__infinite",
    );
  }

  function noAnimate(el: HTMLElement) {
    if (!el)
      throw new Error("An element is required to remove animations classes.");

    const classes = el.classList;

    classes.forEach((c) => {
      if (c.includes("animate") || c === "infinite") {
        el.classList.remove(c);
      }
    });
  }

  return {
    animate,
    noAnimate,
  };
}

const singleton = UiAnimationManager();

export { singleton as UiAnimationManager };
