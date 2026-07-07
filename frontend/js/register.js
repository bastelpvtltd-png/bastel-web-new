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

  // ── VALIDATION ────────────────────────────────────────────
  const NAME_RX    = /^[A-Za-zÀ-ſ\s.'-]{2,60}$/;
  const PHONE_RX   = /^\+?[\d\s-]{7,17}$/;
  const TIN_VAT_RX = /^\d{8,9}-\d{3,4}$/;
  const BR_RX      = /^[A-Za-z]{2,4}\s?\d{5,10}$/;

  function validateFields(fields) {
    if (!NAME_RX.test(fields.full_name.trim())) return 'Please enter a valid full name (letters only).';
    if (!PHONE_RX.test(fields.phone.trim())) return 'Please enter a valid phone number, e.g. +94 77 000 0000.';
    if (fields.tin_vat && !TIN_VAT_RX.test(fields.tin_vat.trim())) return 'Invalid TIN/VAT number — expected format e.g. 242788508-2525.';
    if (fields.br_number && !BR_RX.test(fields.br_number.trim())) return 'Invalid BR number — expected format e.g. PV 12345678.';
    return null;
  }

  // ── FORM SUBMISSION ──────────────────────────────────────
  const form = document.getElementById('registrationForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.reg-submit');
    const alertEl = document.getElementById('regAlert');
    const orig = btn.textContent;

    const fields = {
      trade_type:    document.getElementById('reg_type').value,
      full_name:     document.getElementById('reg_name').value,
      company_name:  document.getElementById('reg_company').value,
      email:         document.getElementById('reg_email').value,
      phone:         document.getElementById('reg_phone').value,
      country:       document.getElementById('reg_country').value,
      tin_vat:       document.getElementById('reg_tin_vat').value,
      br_number:     document.getElementById('reg_br_number').value,
      trade_category:document.getElementById('reg_category').value,
      commodity:     document.getElementById('reg_commodity').value,
      volume:        form.querySelector('[name=volume]')?.value || '',
      freight_mode:  form.querySelector('[name=freight_mode]')?.value || '',
      trade_countries:form.querySelector('[name=trade_countries]')?.value || '',
      requirements:  form.querySelector('[name=requirements]')?.value || '',
    };

    const validationError = validateFields(fields);
    if (validationError) {
      alertEl.innerHTML = `<div class="alert alert-error">⚠ ${validationError}</div>`;
      BLog.warn('Registration validation failed', { error: validationError });
      return;
    }

    btn.textContent = 'Submitting...'; btn.disabled = true;

    const payload = new FormData();
    Object.entries(fields).forEach(([key, value]) => payload.append(key, value));
    const image1 = document.getElementById('reg_image1').files[0];
    const image2 = document.getElementById('reg_image2').files[0];
    if (image1) payload.append('image1', image1);
    if (image2) payload.append('image2', image2);

    BLog.info('Registration form submitted', { name: fields.full_name, type: fields.trade_type });

    try {
      const res = await fetch(`${BASTEL_CONFIG.API_BASE}/register`, {
        method: 'POST',
        body: payload,
      });
      const data = await res.json();

      if (res.ok) {
        alertEl.innerHTML = `<div class="alert alert-success">✓ Registration submitted successfully! We'll contact you at <strong>${fields.email}</strong> within 2 business days.</div>`;
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
