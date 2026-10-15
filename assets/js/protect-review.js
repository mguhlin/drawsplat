(function () {
  const names = ['Parental rights and access','Retention and deletion','Opt-out options','Transparency','Encryption and security','Consent and age restrictions','Third-party management'];
  const rows = document.getElementById('score-rows'), total = document.getElementById('score-total');
  names.forEach((name, i) => {
    const field = document.createElement('fieldset'); field.innerHTML = '<legend>' + name + '</legend><label>Score <select name="score' + i + '" required><option value="">Pending evidence</option><option value="0">0 — Does not meet</option><option value="1">1 — Partially meets</option><option value="2">2 — Fully meets</option></select></label><label>Verified evidence and remaining gaps <textarea name="evidence' + i + '" required maxlength="5000" rows="3"></textarea></label>';
    rows.appendChild(field);
  });
  function result() {
    const data = new FormData(document.getElementById('protect-review'));
    const categories = names.map((name, i) => ({ name, score: data.get('score' + i) === '' ? null : Number(data.get('score' + i)), evidence: data.get('evidence' + i) }));
    return { rubric: 'PROTECT v2.0', deployment: data.get('deployment'), reviewedAt: new Date().toISOString(), categories, total: categories.some(c => c.score === null) ? null : categories.reduce((n, c) => n + c.score, 0), scope: 'Reviewer-supplied deployment evidence; not independent certification' };
  }
  document.getElementById('protect-review').onchange = () => { const r = result(); total.textContent = r.total === null ? 'Pending evidence: no complete score yet.' : r.total + '/14'; };
  document.getElementById('protect-review').onsubmit = e => {
    e.preventDefault(); const r = result(); if (r.categories.some(c => !c.evidence.trim())) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'splatworks-protect-review.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
})();
