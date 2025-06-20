const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.NETLIFY_DATABASE_URL);

// Wykrywanie botów na podstawie User-Agent
function isBot(userAgent = '') {
  const botKeywords = [
    'bot', 'crawl', 'spider', 'curl', 'wget', 'python',
    'fetch', 'node', 'axios', 'libwww', 'httpclient', 'Go-http-client'
  ];
  const ua = userAgent.toLowerCase();
  return botKeywords.some(keyword => ua.includes(keyword));
}

exports.handler = async (event) => {
  const ip = event.headers['x-forwarded-for']?.split(',')[0]?.trim();
  const userAgent = event.headers['user-agent'] || '';

  try {
    // Jeśli User-Agent to bot, zablokuj i zapisz do blocked_ips
    if (isBot(userAgent)) {
      await sql`
        INSERT INTO blocked_ips (ip, reason, blocked_at)
        VALUES (${ip}, 'Wykryto bota', CURRENT_TIMESTAMP)
        ON CONFLICT (ip) DO NOTHING
      `;
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Dostęp zablokowany: wykryto bota' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Jeśli IP już zablokowane
    const res = await sql`SELECT 1 FROM blocked_ips WHERE ip = ${ip}`;
    if (res.length > 0) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Dostęp zablokowany' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // IP czyste
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (err) {
    console.error('[ipCheck] Błąd serwera:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Błąd serwera' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
