
const API = {
  async fetchDashboardData() {
    const response = await fetch(CONFIG.API_URL);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  },

  async postAction(payload) {
    return await fetch(CONFIG.API_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
};
