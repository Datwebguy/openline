const state = { request: null };
const $ = selector => document.querySelector(selector);

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || body.message || 'Openline could not complete that request.');
  return body;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function readableError(message) {
  const text = String(message || 'The call could not be completed.');
  const payloadText = text.replace(/^CALL-E\s+\d+:\s*/i, '');
  try {
    const payload = JSON.parse(payloadText);
    return payload.message || payload.error?.message || 'The call provider could not accept this request.';
  } catch {
    return text.replace(/^CALL-E\s+\d+:\s*/i, '');
  }
}

function setBusy(button, busy, busyLabel, idleLabel) {
  if (!button) return;
  button.disabled = busy;
  button.innerHTML = busy ? busyLabel : idleLabel;
}

function resetWorkflow() {
  const emptyState = $('#empty-state');
  const planPanel = $('#plan-panel');
  const resultsPanel = $('#results-panel');
  if (!emptyState || !planPanel || !resultsPanel) return;
  emptyState.hidden = false;
  planPanel.hidden = true;
  resultsPanel.hidden = true;
  $('#plan-list').innerHTML = '';
  $('#results-list').innerHTML = '';
  $('#request-summary').innerHTML = '';
}

function renderPlans(request) {
  state.request = request;
  $('#empty-state').hidden = true;
  $('#results-panel').hidden = true;
  $('#plan-panel').hidden = false;

  $('#plan-list').innerHTML = request.plans.length ? request.plans.map(plan => `
    <article class="plan-card">
      <div class="plan-card-head"><h4>${escapeHtml(plan.providerName)}</h4><span class="plan-status">PREVIEW</span></div>
      <p>${escapeHtml(plan.purpose)}</p>
      ${plan.contactHint ? `<p class="contact-hint">${escapeHtml(plan.contactHint)}</p>` : ''}
      <ul>${plan.questions.map(question => `<li>${escapeHtml(question)}</li>`).join('')}</ul>
      <p class="disclosure"><strong>Disclosure:</strong> ${escapeHtml(plan.disclosure)}</p>
     </article>`).join('') : '<div class="plan-empty">No eligible call targets are configured for this mode.</div>';
  if (approveButton) approveButton.disabled = request.plans.length === 0;
}

function outcomeTone(outcome) {
  if (outcome === 'confirmed') return 'confirmed';
  if (outcome === 'unavailable' || outcome === 'failed') return 'negative';
  return 'uncertain';
}

function renderResults(request) {
  state.request = request;
  $('#plan-panel').hidden = true;
  $('#empty-state').hidden = true;
  $('#results-panel').hidden = false;

  const decision = request.decision || {};
  $('#request-summary').innerHTML = `
    <div class="summary-label">Openline decision</div>
    <strong>${escapeHtml(decision.status === 'human_review_required' ? 'Ready for human review' : 'Needs follow-up')}</strong>
    <p>${escapeHtml(decision.reason || 'Review the call evidence before deciding what happens next.')}</p>`;

  $('#results-list').innerHTML = (request.runs || []).map(run => {
    // Simulation returns the structured result under `result`; live CALL-E
    // normalization returns the same fields at the top level. Support both
    // shapes so the UI stays truthful in either execution mode.
    const result = run.result || run;
    const outcome = result.callOutcome || 'unknown';
    const evidence = Array.isArray(result.evidence) ? result.evidence : [];
    const requirements = Array.isArray(result.requirements) ? result.requirements : [];
    const transcript = Array.isArray(run.transcript)
      ? run.transcript.map(turn => `${turn.speaker || 'Speaker'}: ${turn.text || ''}`).join('\\n')
      : run.transcript;

    return `
    <article class="result-card ${outcomeTone(outcome)}">
      <div class="result-card-head"><h4>${escapeHtml(run.providerName)}</h4><span class="result-badge ${outcome === 'failed' ? 'is-failed' : ''}">${escapeHtml(outcome)}</span></div>
      <div class="result-grid"><div><span>Availability</span><strong>${escapeHtml(result.availabilityWindow || 'Unknown')}</strong></div><div><span>Confidence</span><strong>${escapeHtml(result.confidence || 'low')}</strong></div></div>
      ${evidence.length ? `<div class="evidence"><span>Evidence</span><ul>${evidence.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>` : ''}
      ${requirements.length ? `<div class="evidence"><span>Requirements</span><ul>${requirements.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>` : ''}
      ${transcript ? `<details><summary>View transcript</summary><pre>${escapeHtml(transcript)}</pre></details>` : ''}
    </article>`;
  }).join('');
}

function renderRunFailure(request, message) {
  state.request = request;
  $('#empty-state').hidden = true;
  $('#plan-panel').hidden = true;
  $('#results-panel').hidden = false;
  $('#request-summary').innerHTML = `
    <div class="summary-label">Openline could not complete that step</div>
    <strong>Review what happened</strong>
    <p>${escapeHtml(readableError(message || request.error))}</p>`;
  $('#results-list').innerHTML = `
    <article class="result-card negative">
      <div class="result-card-head"><h4>No verified answer yet</h4><span class="result-badge is-failed">${request.status === 'blocked' ? 'BLOCKED' : 'FAILED'}</span></div>
      <p>The request is saved. Fix the call configuration or choose a supported live target, then start another request.</p>
      ${request.errorCode ? `<div class="evidence"><span>Provider code</span><p>${escapeHtml(request.errorCode)}</p></div>` : ''}
      ${request.errorDetails ? `<details><summary>View provider details</summary><pre>${escapeHtml(JSON.stringify(request.errorDetails, null, 2))}</pre></details>` : ''}
    </article>`;
}

const form = $('#request-form');
const submitButton = form?.querySelector('[type="submit"]');
const approveButton = $('#approve-button');

form?.addEventListener('submit', async event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  data.accessibility = data.accessibility ? [data.accessibility] : [];
  setBusy(submitButton, true, 'Preparing call plan…', 'Find available options →');

  try {
    const created = await api('/api/requests', { method: 'POST', body: JSON.stringify(data) });
    const preview = await api(`/api/requests/${created.request.id}/preview`, { method: 'POST' });
    renderPlans(preview.request);
    $('#workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    window.alert(error.message);
  } finally {
    setBusy(submitButton, false, 'Preparing call plan…', 'Find available options →');
  }
});

approveButton?.addEventListener('click', async () => {
  if (!state.request) return;
  setBusy(approveButton, true, 'Calling…', 'Approve these calls →');

  try {
    await api(`/api/requests/${state.request.id}/approve`, { method: 'POST' });
    const result = await api(`/api/requests/${state.request.id}/run`, { method: 'POST' });
    renderResults(result.request);
    $('#results-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    try {
      const current = await api(`/api/requests/${state.request.id}`);
      if (current.request?.error || current.request?.status === 'blocked' || current.request?.status === 'failed') {
        renderRunFailure(current.request, error.message);
        $('#results-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
        setBusy(approveButton, false, 'Calling…', 'Approve these calls →');
        return;
      }
    } catch {}
    window.alert(error.message);
    setBusy(approveButton, false, 'Calling…', 'Approve these calls →');
  }
});

document.querySelectorAll('[data-reset]').forEach(button => button.addEventListener('click', () => {
  state.request = null;
  form?.reset();
  if (approveButton) approveButton.disabled = false;
  resetWorkflow();
  form?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}));

resetWorkflow();
