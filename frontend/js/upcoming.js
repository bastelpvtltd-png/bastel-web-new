/* upcoming.js */
(function () {
  // ── COUNTDOWN ── target: 1 Jan 2026
  const TARGET = new Date('2026-01-01T00:00:00').getTime();
  function updateCountdown() {
    const now = Date.now();
    const diff = TARGET - now;
    if (diff <= 0) {
      document.getElementById('cd-days').textContent  = '00';
      document.getElementById('cd-hours').textContent = '00';
      document.getElementById('cd-mins').textContent  = '00';
      document.getElementById('cd-secs').textContent  = '00';
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    document.getElementById('cd-days').textContent  = String(d).padStart(2,'0');
    document.getElementById('cd-hours').textContent = String(h).padStart(2,'0');
    document.getElementById('cd-mins').textContent  = String(m).padStart(2,'0');
    document.getElementById('cd-secs').textContent  = String(s).padStart(2,'0');
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // ── NOTIFY FORM ──────────────────────────────────────────
  const form = document.getElementById('notifyForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.btn-primary');
    const alertEl = document.getElementById('notifyAlert');
    const orig = btn.textContent;
    btn.textContent = 'Submitting...'; btn.disabled = true;

    const payload = {
      name:  document.getElementById('notify_name').value.trim(),
      email: document.getElementById('notify_email').value.trim(),
      type:  document.getElementById('notify_type').value,
    };

    BLog.info('Notify form submitted', payload);

    try {
      const res = await fetch(`${BASTEL_CONFIG.API_BASE}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        alertEl.innerHTML = `<div class="alert alert-success">✓ You're on the list! We'll notify <strong>${payload.email}</strong> at launch.</div>`;
        btn.textContent = 'You\'re on the list ✓';
        btn.style.background = '#1a7a4a';
        form.reset();
        BLog.info('Notify form success');
      } else {
        throw new Error(data.message || 'Server error');
      }
    } catch (err) {
      // fallback: save to localStorage so user doesn't lose their intent
      const pending = JSON.parse(localStorage.getItem('bastel_notify_pending') || '[]');
      pending.push({ ...payload, ts: new Date().toISOString() });
      localStorage.setItem('bastel_notify_pending', JSON.stringify(pending));

      alertEl.innerHTML = `<div class="alert alert-error">⚠ Could not connect to server. We've saved your request locally and will sync it soon.</div>`;
      btn.textContent = orig; btn.disabled = false;
      BLog.error('Notify form failed', { error: err.message });
    }
  });
})();
