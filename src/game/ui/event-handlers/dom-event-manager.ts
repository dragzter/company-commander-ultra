import type { HandlerInitConfig } from "../../../constants/types.ts";

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
    delegatedIds.clear();
  }

  function initEventArray(eventConfig: HandlerInitConfig[]) {
    eventConfig.forEach((config) => {
      initHandlers(config.eventType, config.selector, config.callback);
    });
  }

  const delegatedIds = new Set<string>();

  /**
   * Event delegation: attach to a persistent parent; handlers work for dynamically added content.
   * Use for nav buttons (Home, Market, Roster, etc.) that get recreated on each screen.
   * Only attaches once per (parent, eventType) - safe to call multiple times.
   */
  function initDelegatedEventArray(
    parent: Document | HTMLElement,
    eventConfig: HandlerInitConfig[],
    key = "default",
  ) {
    const eventType = eventConfig[0]?.eventType ?? "click";
    const cacheKey = `${key}-${eventType}`;
    if (delegatedIds.has(cacheKey)) return;

    const delegatedListener = (e: Event) => {
      const target = e.target as HTMLElement;
      for (const config of eventConfig) {
        let match = target.closest(config.selector);
        // Clicks on label (span) miss the button - also match wrapper via data-nav-target
        if (!match && config.selector.startsWith("#")) {
          const id = config.selector.slice(1);
          match = target.closest(`[data-nav-target="${id}"]`);
        }
        if (match) {
          config.callback.call(match, e);
          return;
        }
      }
    };
    parent.addEventListener(eventType, delegatedListener);
    const id = _getId();
    delegatedIds.add(cacheKey);
    handlerMap.set(id, {
      callback: delegatedListener as EventListener,
      selector: "(delegated)",
      elements: [parent as HTMLElement],
      eventType,
    });
  }

  return {
    destroy,
    initHandler,
    initHandlers,
    initEventArray,
    initDelegatedEventArray,
    removeHandlers,
    getMap: () => new Map(handlerMap),
  };
}

const singleton = DomEventManager();
export { singleton as DomEventManager };
