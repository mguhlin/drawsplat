/**
 * DrawSplatTM Family Access Portal (self-hosted MySQL backend).
 *
 * Talks to the same API surface the static /parents/index.html form uses,
 * but additionally pulls the verified student snapshot + request history.
 */

const BASE = window.DRAWSPLAT_API_BASE || '/api/drawsplat/mysql';

const $ = (id) => document.getElementById(id);
let portalToken = null;
let portalStudent = null;

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('loginStatus').textContent = 'Signing in…';
  try {
    const body = {
      parentName: 'Family Access',
      parentEmail: $('loginEmail').value.trim(),
      studentName: $('loginStudent').value.trim(),
      className: $('loginClass').value.trim(),
      requestType: 'view',
      details: 'Family Access Portal sign-in',
      verificationCode: $('loginCode').value.trim().toUpperCase()
    };
    const r = await fetch(BASE + '/parent/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'sign_in_failed');
    if (j.status !== 'verified') {
      $('loginStatus').textContent = 'Code not recognized or expired. Ask the teacher to issue a new one.';
      return;
    }
    portalToken = j.parentToken || null;
    portalStudent = { name: body.studentName, className: body.className, email: body.parentEmail };
    $('loginStatus').textContent = 'Signed in.';
    $('data-card').hidden = false;
    $('actions-card').hidden = false;
    renderSnapshot();
    refreshRequests();
  } catch (err) {
    $('loginStatus').textContent = 'Could not sign in: ' + err.message;
  }
});

function renderSnapshot() {
  $('studentSummary').innerHTML = `
    <div class="portal-row"><span>Student</span><strong>${escapeHtml(portalStudent.name)}</strong></div>
    <div class="portal-row"><span>Class / section</span><strong>${escapeHtml(portalStudent.className || '—')}</strong></div>
    <div class="portal-row"><span>Verified parent email</span><strong>${escapeHtml(portalStudent.email)}</strong></div>
  `;
}

async function refreshRequests() {
  try {
    const r = await fetch(BASE + '/parent/requests?email=' + encodeURIComponent(portalStudent.email));
    if (!r.ok) return;
    const j = await r.json();
    if (!j.ok || !Array.isArray(j.requests) || j.requests.length === 0) {
      $('requestList').textContent = 'No requests yet.';
      return;
    }
    $('requestList').innerHTML = j.requests.map(req => `
      <div class="portal-row">
        <span>${escapeHtml(req.request_type)} <span class="portal-tag">${escapeHtml(req.status)}</span></span>
        <span>${escapeHtml(String(req.created_at).slice(0, 16).replace('T', ' '))}</span>
      </div>
    `).join('');
  } catch (e) {}
}

$('requestForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!portalStudent) return;
  $('requestStatus').textContent = 'Submitting…';
  try {
    const r = await fetch(BASE + '/parent/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentName: 'Family Access',
        parentEmail: portalStudent.email,
        studentName: portalStudent.name,
        className: portalStudent.className,
        requestType: $('reqType').value,
        details: $('reqDetails').value
      })
    });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'submit_failed');
    $('requestStatus').textContent = 'Submitted. Ticket #' + (j.id || '').slice(0, 8);
    $('reqDetails').value = '';
    refreshRequests();
  } catch (err) {
    $('requestStatus').textContent = 'Could not submit: ' + err.message;
  }
});

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
