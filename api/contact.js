// Vercel serverless function — receives contact-form submissions and sends a
// branded notification email through Resend. The Resend API key lives only in
// the RESEND_API_KEY environment variable (set in the Vercel dashboard) and is
// never exposed to the browser.

const TO_EMAIL = 'nnabrianeze@gmail.com';
// Until a custom domain is verified in Resend, mail must come from this address.
const FROM_EMAIL = 'nnamdi.dev <onboarding@resend.dev>';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'Method not allowed.' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const message = String(body.message || '').trim();

  // Honeypot: real users never tick this hidden box. Pretend success so bots
  // don't retry.
  if (body.botcheck) return res.status(200).json({ success: true });

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Please fill in your name, email, and message.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set.');
    return res.status(500).json({ success: false, message: 'Email service is not configured yet.' });
  }

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        reply_to: email,
        subject: `New message from ${name} — nnamdi.dev`,
        html: renderEmail({ name, email, message }),
        text: `New message from your portfolio site\n\nFrom: ${name}\nEmail: ${email}\n\n${message}`,
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      console.error('Resend error:', resp.status, detail);
      return res.status(502).json({ success: false, message: 'Could not send right now. Please try again shortly.' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Send failed:', err);
    return res.status(500).json({ success: false, message: 'Network error. Please try again.' });
  }
};

function safeParse(s) {
  try { return JSON.parse(s); } catch { return {}; }
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// Branded HTML email matching the portfolio's design language: near-black
// background, mint-green accent, monospace labels. Table-based + inline styles
// for email-client compatibility.
function renderEmail({ name, email, message }) {
  const safeName = esc(name);
  const safeEmail = esc(email);
  const safeMessage = esc(message).replace(/\r?\n/g, '<br>');
  const replySubject = encodeURIComponent(`Re: your message on nnamdi.dev`);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <title>New contact message</title>
</head>
<body style="margin:0; padding:0; background:#0a0a0a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background:#131313; border:1px solid #222; border-radius:10px; overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#0d0d0d; padding:24px 32px; border-bottom:1px solid #222;">
              <span style="font-family:'Courier New',monospace; font-size:16px; font-weight:700; color:#4fffb0; letter-spacing:1px;">nnamdi<span style="color:#666;">.dev</span></span>
              <div style="font-family:'Courier New',monospace; font-size:11px; color:#666; letter-spacing:2px; text-transform:uppercase; margin-top:6px;">// new contact message</div>
            </td>
          </tr>

          <!-- Accent strip -->
          <tr><td style="height:3px; background:#4fffb0; line-height:3px; font-size:0;">&nbsp;</td></tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 28px; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:1.6; color:#f0f0f0;">You've got a new message from your portfolio site.</p>

              <div style="font-family:'Courier New',monospace; font-size:11px; color:#4fffb0; letter-spacing:1px; text-transform:uppercase; margin-bottom:6px;">From</div>
              <div style="font-family:Arial,Helvetica,sans-serif; font-size:16px; color:#f0f0f0; font-weight:600; margin-bottom:22px;">${safeName}</div>

              <div style="font-family:'Courier New',monospace; font-size:11px; color:#4fffb0; letter-spacing:1px; text-transform:uppercase; margin-bottom:6px;">Email</div>
              <div style="margin-bottom:22px;"><a href="mailto:${safeEmail}" style="font-family:Arial,Helvetica,sans-serif; font-size:15px; color:#00e5ff; text-decoration:none;">${safeEmail}</a></div>

              <div style="font-family:'Courier New',monospace; font-size:11px; color:#4fffb0; letter-spacing:1px; text-transform:uppercase; margin-bottom:6px;">Message</div>
              <div style="font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:1.7; color:#cfcfcf; background:#0d0d0d; border:1px solid #222; border-radius:6px; padding:18px 20px;">${safeMessage}</div>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                <tr>
                  <td style="border-radius:5px; background:#4fffb0;">
                    <a href="mailto:${safeEmail}?subject=${replySubject}" style="display:inline-block; padding:12px 26px; font-family:'Courier New',monospace; font-size:13px; font-weight:700; color:#000; text-decoration:none; letter-spacing:0.5px;">Reply to ${safeName} &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0d0d0d; padding:18px 32px; border-top:1px solid #222;">
              <span style="font-family:'Courier New',monospace; font-size:11px; color:#555;">Sent from your nnamdi.dev contact form</span>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
