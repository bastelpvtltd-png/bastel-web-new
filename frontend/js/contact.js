/* contact.js — EmailJS form submission */
(function() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('.btn-primary');
    const alertEl = document.getElementById('formAlert');
    const orig = btn.textContent;
    btn.textContent = 'Sending...'; btn.disabled = true;

    const params = {
      from_name:  document.getElementById('from_name').value,
      from_email: document.getElementById('from_email').value,
      service:    document.getElementById('service')?.value || 'N/A',
      message:    document.getElementById('message_content').value,
    };

    BLog.info('Contact form submitted', { name: params.from_name, service: params.service });

    emailjs.send(BASTEL_CONFIG.EMAILJS_SERVICE, BASTEL_CONFIG.EMAILJS_OWNER_TPL, params)
      .then(() => emailjs.send(BASTEL_CONFIG.EMAILJS_SERVICE, BASTEL_CONFIG.EMAILJS_REPLY_TPL, {
        to_email: params.from_email, to_name: params.from_name,
        to_service: params.service, message: 'Thank you for contacting us. We have received your inquiry.'
      }))
      .then(() => {
        if (alertEl) { alertEl.innerHTML = '<div class="alert alert-success">✓ Message sent! We\'ll respond within 24 hours.</div>'; }
        btn.textContent = 'Message Sent ✓'; btn.style.background = '#1a7a4a';
        form.reset();
        BLog.info('Contact form success');
        setTimeout(() => { btn.textContent = orig; btn.style.background = ''; btn.disabled = false; if(alertEl) alertEl.innerHTML=''; }, 4000);
      })
      .catch((err) => {
        if (alertEl) { alertEl.innerHTML = '<div class="alert alert-error">⚠ Failed to send. Please email us directly.</div>'; }
        btn.textContent = 'Try Again'; btn.disabled = false;
        BLog.error('Contact form failed', err);
        setTimeout(() => { btn.textContent = orig; btn.style.background = ''; if(alertEl) alertEl.innerHTML=''; }, 4000);
      });
  });
})();
