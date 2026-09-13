(async () => {
  try {
    const response = await fetch('/api/health');
    const health = await response.json();
    const pill = document.querySelector('.mode-pill');
    if (!pill) return;

    const live = health.mode === 'live';
    pill.innerHTML = `<span class="status-dot ${live ? 'live-dot' : ''}"></span> ${live ? 'Live calls enabled' : 'Simulation mode · no live calls'}`;
  } catch {
    // Keep the server-rendered mode label if health is unavailable.
  }
})();
