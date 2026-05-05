/* register.js — Registration form handler */
(function() {
  // ── TYPE CARD SELECTION ──────────────────────────────────
  const cards = document.querySelectorAll('.reg-card');
  const typeInput = document.getElementById('reg_type');

  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      typeInput.value = card.dataset.type;
      BLog.info('Registration type selected', { type: card.dataset.type });
    });
  });

  // ── FORM SUBMISSION ──────────────────────────────────────
  const form = document.getElementById('registrationForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.reg-submit');
    const alertEl = document.getElementById('regAlert');
    const orig = btn.textContent;
    btn.textContent = 'Submitting...'; btn.disabled = true;

    const payload = {
      trade_type:    document.getElementById('reg_type').value,
      full_name:     document.getElementById('reg_name').value,
      company_name:  document.getElementById('reg_company').value,
      email:         document.getElementById('reg_email').value,
      phone:         document.getElementById('reg_phone').value,
      country:       document.getElementById('reg_country').value,
      trade_category:document.getElementById('reg_category').value,
      volume:        form.querySelector('[name=volume]')?.value || '',
      freight_mode:  form.querySelector('[name=freight_mode]')?.value || '',
      trade_countries:form.querySelector('[name=trade_countries]')?.value || '',
      requirements:  form.querySelector('[name=requirements]')?.value || '',
    };

    BLog.info('Registration form submitted', { name: payload.full_name, type: payload.trade_type });

    try {
      const res = await fetch(`${BASTEL_CONFIG.API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        alertEl.innerHTML = `<div class="alert alert-success">✓ Registration submitted successfully! We'll contact you at <strong>${payload.email}</strong> within 2 business days.</div>`;
        btn.textContent = 'Registration Submitted ✓';
        btn.style.background = '#1a7a4a';
        form.reset();
        // Reset type cards
        cards.forEach((c,i) => c.classList.toggle('active', i===0));
        typeInput.value = 'exporter';
        BLog.info('Registration success', { id: data.id });
      } else {
        throw new Error(data.message || 'Server error');
      }
    } catch (err) {
      alertEl.innerHTML = `<div class="alert alert-error">⚠ Registration failed: ${err.message}. Please email us directly at bastel.pvt.ltd@gmail.com</div>`;
      btn.textContent = orig; btn.disabled = false;
      BLog.error('Registration failed', { error: err.message });
    }
  });
})();
