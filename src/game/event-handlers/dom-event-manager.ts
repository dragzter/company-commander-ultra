function DomEventManager() {
  const handlerMap: Map<
    string,
    {
      selector: string;
      callback: EventListener;
      elements: HTMLElement[];
      eventType: keyof HTMLElementEventMap;
    }
  > = new Map();
  let idCounter = 0;

  function _getId() {
    return `handler-${idCounter++}`;
  }

  /**
   * Initiate an event handler
   * @param selector
   * @param callback
   * @param eventType
   */
  function initHandler(
    eventType: keyof HTMLElementEventMap,
    selector: string,
    callback: EventListener,
  ) {
    if (!selector) return;
    const element = document.querySelector(selector) as HTMLElement;

    if (!element) throw new Error(`No element found for selector: ${selector}`);

    element.addEventListener(eventType, callback);
    const id = _getId();
    handlerMap.set(id, { callback, selector, elements: [element], eventType });

    return id;
  }

  /**
   * Assign 1 handler for multiple elements
   * @param selector
   * @param callback
   * @param eventType
   */
  function initHandlers(
    eventType: keyof HTMLElementEventMap,
    selector: string,
    callback: EventListener,
  ) {
    if (!selector) {
      throw new Error("No selector provided.");
    }

    const elements = document.querySelectorAll(selector);

    if (!elements?.length) {
      console.warn(`No elements found for selector: ${selector}`);
      return;
    }

    const id = _getId();
    const htmlElements = Array.from(elements) as HTMLElement[];

    htmlElements.forEach((el) => el.addEventListener(eventType, callback));
    handlerMap.set(id, {
      callback,
      selector,
      elements: htmlElements,
      eventType,
    });

    return id;
  }

  /**
   * Remove specific handlers
   * @param id
   */
  function removeHandlers(id: string) {
    const item = handlerMap.get(id);
    if (!item) return;
    item.elements.forEach((el) =>
      el.removeEventListener(item.eventType, item.callback),
    );
    handlerMap.delete(id);
  }

  /**
   * Destroy all handlers
   */
  function destroy() {
    handlerMap.forEach((_, id) => removeHandlers(id));
    handlerMap.clear();
  }

  return {
    destroy,
    initHandler,
    initHandlers,
    removeHandlers,
    getMap: () => new Map(handlerMap),
  };
}

const singleton = DomEventManager();
export { singleton as DomEventManager };
