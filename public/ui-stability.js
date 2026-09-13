(() => {
  let liveRunInProgress = false;
  let liveMode = false;

  const banner = document.createElement('div');
  banner.setAttribute('role', 'status');
  banner.style.cssText = [
    'position:fixed', 'left:50%', 'bottom:24px', 'transform:translateX(-50%)',
    'z-index:9999', 'display:none', 'width:min(520px,calc(100vw - 32px))',
    'padding:14px 18px', 'border-radius:999px', 'background:#143c35',
    'color:#fff', 'font:600 12px/1.4 system-ui,sans-serif',
    'box-shadow:0 12px 30px rgba(20,60,53,.22)'
  ].join(';');
  document.body.appendChild(banner);

  function setBanner(message, visible = true) {
    banner.textContent = message;
    banner.style.display = visible ? 'block' : 'none';
  }

  function approveButton() {
    return [...document.querySelectorAll('button')]
      .find(button => /approve these calls/i.test(button.textContent || ''));
  }

  function resetApproveButton() {
    const button = approveButton();
    if (!button) return;
    button.disabled = false;
    button.textContent = 'Approve these calls →';
  }

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const url = String(args[0]?.url || args[0] || '');
    if (!liveMode || !/\/api\/requests\/[^/]+\/run$/.test(url)) return response;

    liveRunInProgress = false;
    if (response.ok) {
      setBanner('Live call complete. Evidence is ready.', true);
      setTimeout(() => setBanner('', false), 4500);
      return response;
    }

    setBanner('Live call could not be completed. Review the result above for details.', true);
    resetApproveButton();
    return response;
  };

  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!liveMode || !button || !/approve these calls/i.test(button.textContent || '')) return;
    if (liveRunInProgress) {
      event.preventDefault();
      return;
    }
    liveRunInProgress = true;
    button.disabled = true;
    button.textContent = 'Calling…';
    setBanner('CALL-E is placing the live call. Keep this tab open.', true);
  });

  fetch('/api/health').then(response => response.json()).then(health => {
    liveMode = health.mode === 'live' && health.liveCallsEnabled === true;
  }).catch(() => {});
})();
