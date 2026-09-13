(() => {
  let activeDialog;

  function closeDialog() {
    if (!activeDialog) return;
    activeDialog.remove();
    activeDialog = null;
  }

  window.alert = message => {
    closeDialog();
    const backdrop = document.createElement('div');
    backdrop.className = 'product-dialog-backdrop';
    backdrop.innerHTML = `
      <section class="product-dialog" role="alertdialog" aria-modal="true" aria-labelledby="product-dialog-title">
        <div class="dialog-kicker">Openline could not complete that step</div>
        <h2 id="product-dialog-title">Review what happened</h2>
        <p>${String(message || 'Something went wrong.').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</p>
        <button type="button" class="dialog-close">Close</button>
      </section>`;
    document.body.appendChild(backdrop);
    activeDialog = backdrop;
    const close = backdrop.querySelector('.dialog-close');
    close.focus();
    close.addEventListener('click', closeDialog);
    backdrop.addEventListener('click', event => {
      if (event.target === backdrop) closeDialog();
    });
    backdrop.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeDialog();
    });
  };

})();
