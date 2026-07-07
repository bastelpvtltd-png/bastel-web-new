/* contact.js — sends the contact/quote form to the backend (saves to DB + emails) */
(function() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.btn-primary');
    const alertEl = document.getElementById('formAlert');
    const orig = btn.textContent;
    btn.textContent = 'Sending...'; btn.disabled = true;

    const payload = {
      from_name:  document.getElementById('from_name').value.trim(),
      from_email: document.getElementById('from_email').value.trim(),
      service:    document.getElementById('service')?.value || 'N/A',
      message:    document.getElementById('message_content').value.trim(),
    };

    BLog.info('Contact form submitted', { name: payload.from_name, service: payload.service });

    try {
      const res = await fetch(`${BASTEL_CONFIG.API_BASE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        if (alertEl) alertEl.innerHTML = '<div class="alert alert-success">✓ Message sent! We\'ll respond within 24 hours.</div>';
        btn.textContent = 'Message Sent ✓'; btn.style.background = '#1a7a4a';
        form.reset();
        BLog.info('Contact form success', { id: data.id });
        setTimeout(() => { btn.textContent = orig; btn.style.background = ''; btn.disabled = false; if (alertEl) alertEl.innerHTML = ''; }, 4000);
      } else {
        throw new Error(data.message || 'Server error');
      }
    } catch (err) {
      if (alertEl) alertEl.innerHTML = `<div class="alert alert-error">⚠ Failed to send: ${err.message}. Please email us directly at bastel.pvt.ltd@gmail.com</div>`;
      btn.textContent = 'Try Again'; btn.disabled = false;
      BLog.error('Contact form failed', { error: err.message });
      setTimeout(() => { btn.textContent = orig; btn.style.background = ''; if (alertEl) alertEl.innerHTML = ''; }, 5000);
    }
  });
})();
