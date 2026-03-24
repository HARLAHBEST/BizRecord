import 'dotenv/config';

async function main() {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const baseUrl = process.env.MAILGUN_BASE_URL || 'https://api.mailgun.net';
  const fromEmail = process.env.MAILGUN_FROM_EMAIL || 'no-reply@bizrecord.tech';
  const fromName = process.env.MAILGUN_FROM_NAME || 'BizRecord';
  const to = process.argv[2] || process.env.TEST_EMAIL;

  if (!to) {
    console.error('No recipient provided. Usage: npm run test:mailgun -- recipient@example.com or set TEST_EMAIL in env');
    process.exit(2);
  }

  if (!apiKey || !domain) {
    console.error('Missing MAILGUN_API_KEY or MAILGUN_DOMAIN in environment');
    process.exit(2);
  }

  const url = `${baseUrl}/v3/${domain}/messages`;
  const auth = Buffer.from(`api:${apiKey}`).toString('base64');

  const params = new URLSearchParams();
  params.append('from', `${fromName} <${fromEmail}>`);
  params.append('to', to);
  params.append('subject', 'Test email from Booker backend (Mailgun)');
  params.append('text', 'This is a test email sent from the Booker backend using Mailgun.');

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const body = await res.text();
    if (!res.ok) {
      console.error(`Mailgun test send failed (${res.status}): ${body}`);
      process.exit(1);
    }

    console.log('Mailgun test send succeeded:', body);
    process.exit(0);
  } catch (err) {
    console.error('Mailgun test send error:', err);
    process.exit(1);
  }
}

main();
