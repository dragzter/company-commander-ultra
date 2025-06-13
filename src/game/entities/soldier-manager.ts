function SoldierManager() {
  /**
   * Generate a soldier
   */
  function gs() {
    console.log("soldier generated!");
  }

  return { gs };
}

const singleton = SoldierManager();

export { singleton as SoldierManager };
