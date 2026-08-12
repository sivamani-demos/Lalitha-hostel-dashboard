
const State = {
  store: { residents: [], payments: [] },
  roomFloorFilter: '1',

  loadCache() {
    const cached = localStorage.getItem(CONFIG.CACHE_KEY);
    if (cached) {
      try {
        this.store = JSON.parse(cached);
        return true;
      } catch (e) {
        console.error("Cache read error:", e);
      }
    }
    return false;
  },

  setStore(data) {
    this.store = data;
    localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(data));
  }
};
