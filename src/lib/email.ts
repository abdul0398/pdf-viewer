import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendWelcomeEmail({
  to,
  name,
  password,
}: {
  to: string
  name: string
  password: string
}) {
  const portalUrl = process.env.NEXTAUTH_URL ?? 'https://freenotes.092.realtorspotlighthub.homes'
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Res Community Group</title></head>
<body style="margin:0;padding:0;background-color:#030712;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#030712;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;">
          <tr>
            <td style="background-color:#111827;border:1px solid #1f2937;border-radius:16px;padding:40px 36px;">

              <p style="margin:0 0 20px 0;font-size:15px;color:#d1d5db;line-height:1.7;">Hi ${name},</p>

              <p style="margin:0 0 20px 0;font-size:15px;color:#d1d5db;line-height:1.7;">Thank you for your patience. The latest mock exam papers are now available. Here&rsquo;s your login credentials.</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background-color:#1f2937;border:1px solid #374151;border-radius:10px;padding:16px 20px;">
                    <p style="margin:0 0 8px 0;font-size:14px;color:#9ca3af;">Email</p>
                    <p style="margin:0 0 16px 0;font-size:15px;color:#ffffff;font-weight:600;">${to}</p>
                    <p style="margin:0 0 8px 0;font-size:14px;color:#9ca3af;">Password</p>
                    <p style="margin:0;font-size:15px;color:#ffffff;font-weight:600;">${password}</p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}/dashboard"
                       style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:13px 32px;border-radius:8px;letter-spacing:0.01em;">
                      Log In to Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <div style="border-top:1px solid #1f2937;margin-bottom:24px;"></div>

              <p style="margin:0 0 20px 0;font-size:15px;color:#d1d5db;line-height:1.7;">Do stay connected with our leaders as they will be sharing useful tips, as well as updates on the latest exam booster classes (RES revision) that are relevant to our program.</p>

              <p style="margin:0 0 24px 0;font-size:15px;color:#d1d5db;line-height:1.7;">See you soon &amp; good luck!</p>

              <p style="margin:0;font-size:15px;color:#9ca3af;line-height:1.7;">Warm regards,<br><span style="color:#ffffff;font-weight:600;">Marketing Team</span></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? 'rescommunity@realtorspotlighthub.homes',
    to,
    subject: 'Res Community Group',
    html,
  })
}

export async function sendNotesUploadedEmail({
  to,
  name,
  email,
  mobile,
}: {
  to: string
  name: string
  email: string
  mobile: string | null
}) {
  const portalUrl = process.env.NEXTAUTH_URL ?? 'https://freenotes.092.realtorspotlighthub.homes'

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Res Community Group</title></head>
<body style="margin:0;padding:0;background-color:#030712;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#030712;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;">
          <tr>
            <td style="background-color:#111827;border:1px solid #1f2937;border-radius:16px;padding:40px 36px;">

              <p style="margin:0 0 20px 0;font-size:15px;color:#d1d5db;line-height:1.7;">Hi ${name},</p>

              <p style="margin:0 0 20px 0;font-size:15px;color:#d1d5db;line-height:1.7;">Thank you for joining the sharing session. The latest RES notes (100+ pages) have now been updated in the portal for your review.</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background-color:#1f2937;border:1px solid #374151;border-radius:10px;padding:16px 20px;">
                    <p style="margin:0 0 8px 0;font-size:14px;color:#9ca3af;">Email</p>
                    <p style="margin:0 0 16px 0;font-size:15px;color:#ffffff;font-weight:600;">${email}</p>
                    <p style="margin:0 0 8px 0;font-size:14px;color:#9ca3af;">Password</p>
                    <p style="margin:0;font-size:15px;color:#ffffff;font-weight:600;">${mobile ?? '(your mobile number)'}</p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}/dashboard"
                       style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:13px 32px;border-radius:8px;letter-spacing:0.01em;">
                      Log In to Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <div style="border-top:1px solid #1f2937;margin-bottom:24px;"></div>

              <p style="margin:0 0 20px 0;font-size:15px;color:#d1d5db;line-height:1.7;">We hope these materials will support your exam preparation. Wishing you all the best for your upcoming RES exams.</p>

              <p style="margin:0;font-size:15px;color:#9ca3af;line-height:1.7;">Warm regards,<br><span style="color:#ffffff;font-weight:600;">Marketing Team</span></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? 'rescommunity@realtorspotlighthub.homes',
    to,
    subject: 'Res Community Group',
    html,
  })
}
