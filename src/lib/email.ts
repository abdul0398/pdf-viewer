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
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Welcome</title></head>
<body style="margin:0;padding:0;background-color:#030712;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#030712;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;">

          <tr>
            <td style="background-color:#111827;border:1px solid #1f2937;border-radius:16px;padding:40px 36px;">

              <p style="margin:0 0 24px 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">Welcome to the Portal</p>

              <p style="margin:0 0 20px 0;font-size:15px;color:#d1d5db;line-height:1.7;">Hi ${name},</p>
              <p style="margin:0 0 20px 0;font-size:15px;color:#d1d5db;line-height:1.7;">Your account has been created. Here are your login credentials:</p>

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

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXTAUTH_URL ?? 'https://freenotes.092.realtorspotlighthub.homes'}/dashboard"
                       style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:13px 32px;border-radius:8px;letter-spacing:0.01em;">
                      Log In to Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <div style="border-top:1px solid #1f2937;margin-bottom:24px;"></div>

              <p style="margin:0 0 4px 0;font-size:15px;color:#d1d5db;line-height:1.7;">See you soon and good luck!</p>

              <p style="margin:0;font-size:15px;color:#9ca3af;line-height:1.7;margin-top:24px;">Warm regards,<br><span style="color:#ffffff;font-weight:600;">Marketing Team</span></p>
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
    subject: 'Welcome — your account is ready',
    html,
  })
}
