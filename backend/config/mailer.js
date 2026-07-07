// config/mailer.js — sends registration and contact/quote emails
const nodemailer = require('nodemailer');
const logger = require('../middleware/logger');

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  pool: true,
  maxConnections: 3,
});

function wrapper(headline, bodyHtml) {
  return `
  <div style="background:#060c0a;padding:32px 0;font-family:'DM Sans',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#0a120e;border:1px solid rgba(34,212,240,0.18);border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#1a7a4a,#22d4f0);padding:28px 32px;">
              <span style="font-family:'Bebas Neue',Arial,sans-serif;font-size:28px;letter-spacing:2px;color:#060c0a;">BASTEL <span style="font-weight:400;font-size:14px;">PVT LTD</span></span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:#e4f0ea;">
              <h1 style="margin:0 0 12px;font-size:20px;color:#5ee2f5;">${headline}</h1>
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;border-top:1px solid rgba(34,212,240,0.12);font-size:12px;color:#7aa88a;">
              Bastel Pvt Ltd · 145/3 Swarnachithya Road, Grandpass, Colombo 14 · <a href="mailto:bastel.pvt.ltd@gmail.com" style="color:#5ee2f5;">bastel.pvt.ltd@gmail.com</a>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </div>`;
}

function registrationEmailHtml({ full_name, trade_type, company_name, commodity, trade_category }) {
  const typeLabel = { exporter: 'Exporter', importer: 'Importer', both: 'Exporter & Importer' }[trade_type] || trade_type;

  return wrapper('Registration Successful ✓', `
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#e4f0ea;">
      Hi <strong>${esc(full_name)}</strong>,<br/>
      Your registration with Bastel Pvt Ltd as an <strong>${esc(typeLabel)}</strong> has been received and confirmed. Our team will review your details and get back to you within 2 business days.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f1c16;border:1px solid rgba(26,122,74,0.3);border-radius:8px;margin-bottom:20px;">
      <tr><td style="padding:16px 20px;font-size:14px;color:#7aa88a;">Company</td><td style="padding:16px 20px;font-size:14px;color:#e4f0ea;text-align:right;">${esc(company_name) || '—'}</td></tr>
      <tr><td style="padding:0 20px 16px;font-size:14px;color:#7aa88a;">Trade Category</td><td style="padding:0 20px 16px;font-size:14px;color:#e4f0ea;text-align:right;">${esc(trade_category)}</td></tr>
      <tr><td style="padding:0 20px 16px;font-size:14px;color:#7aa88a;">Commodity</td><td style="padding:0 20px 16px;font-size:14px;color:#e4f0ea;text-align:right;">${esc(commodity) || '—'}</td></tr>
    </table>
    <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#7aa88a;">
      If any of the above needs correcting, just reply to this email and let us know.
    </p>
    <a href="https://bastel-web-new.vercel.app" style="display:inline-block;background:#22d4f0;color:#060c0a;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:6px;">Visit Bastel Pvt Ltd →</a>
  `);
}

function contactClientEmailHtml({ name, service, message }) {
  return wrapper('Message Received ✓', `
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#e4f0ea;">
      Hi <strong>${esc(name)}</strong>,<br/>
      Thanks for reaching out to Bastel Pvt Ltd${service && service !== 'Not specified' ? ` about <strong>${esc(service)}</strong>` : ''}. We've received your request and will respond within 24 hours.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f1c16;border:1px solid rgba(26,122,74,0.3);border-radius:8px;margin-bottom:20px;">
      <tr><td style="padding:16px 20px;font-size:13px;line-height:1.7;color:#e4f0ea;">${esc(message)}</td></tr>
    </table>
    <a href="https://bastel-web-new.vercel.app" style="display:inline-block;background:#22d4f0;color:#060c0a;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:6px;">Visit Bastel Pvt Ltd →</a>
  `);
}

function contactAdminEmailHtml({ name, email, service, message }) {
  return wrapper('New Request Received', `
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#e4f0ea;">
      A new contact/quote request has come in through the website.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f1c16;border:1px solid rgba(26,122,74,0.3);border-radius:8px;margin-bottom:20px;">
      <tr><td style="padding:16px 20px;font-size:14px;color:#7aa88a;">Name</td><td style="padding:16px 20px;font-size:14px;color:#e4f0ea;text-align:right;">${esc(name)}</td></tr>
      <tr><td style="padding:0 20px 16px;font-size:14px;color:#7aa88a;">Email</td><td style="padding:0 20px 16px;font-size:14px;color:#e4f0ea;text-align:right;">${esc(email)}</td></tr>
      <tr><td style="padding:0 20px 16px;font-size:14px;color:#7aa88a;">Service</td><td style="padding:0 20px 16px;font-size:14px;color:#e4f0ea;text-align:right;">${esc(service) || 'Not specified'}</td></tr>
      <tr><td colspan="2" style="padding:0 20px 16px;font-size:13px;line-height:1.7;color:#e4f0ea;">${esc(message)}</td></tr>
    </table>
  `);
}

async function sendRegistrationEmail(registration) {
  try {
    await transporter.sendMail({
      from: `"Bastel Pvt Ltd" <${process.env.SMTP_USER}>`,
      to: registration.email,
      subject: 'Bastel Pvt Ltd — Registration Successful',
      html: registrationEmailHtml(registration),
    });
    logger.info('Registration email sent', { email: registration.email });
  } catch (err) {
    logger.error('Registration email failed', { email: registration.email, error: err.message });
  }
}

async function sendContactEmails(contact) {
  const { name, email, service, message } = contact;

  const clientSend = transporter.sendMail({
    from: `"Bastel Pvt Ltd" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Bastel Pvt Ltd — We Received Your Message',
    html: contactClientEmailHtml({ name, service, message }),
  }).then(() => logger.info('Contact confirmation email sent', { email }))
    .catch(err => logger.error('Contact confirmation email failed', { email, error: err.message }));

  const adminSend = transporter.sendMail({
    from: `"Bastel Website" <${process.env.SMTP_USER}>`,
    to: process.env.NOTIFY_EMAIL || 'bastel.pvt.ltd@gmail.com',
    subject: `New Quote/Contact Request — ${name}`,
    html: contactAdminEmailHtml({ name, email, service, message }),
  }).then(() => logger.info('Contact admin alert sent', { email }))
    .catch(err => logger.error('Contact admin alert failed', { error: err.message }));

  await Promise.all([clientSend, adminSend]);
}

module.exports = { sendRegistrationEmail, sendContactEmails };
