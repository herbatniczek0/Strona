const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.NETLIFY_DATABASE_URL);

// Prosty wykrywacz botów na podstawie User-Agent
function isBot(userAgent = '') {
  const botKeywords = [
    'bot', 'crawl', 'spider', 'curl', 'wget', 'python', 'fetch', 'node', 'axios',
    'libwww', 'httpclient', 'go-http-client', 'perl', 'java', 'php', 'scrapy', 'urllib',
    'powershell', 'httpx', 'ruby', 'jakarta', 'http-request', 'httpget', 'urlgrabber', 'okhttp',
    'aiohttp', 'restsharp', 'faraday', 'mechanize', 'winhttp', 'lwp', 'dart', 'guzzle', 'reqwest',
    'http-client', 'urlfetch', 'masscan', 'crawler', 'python-requests', 'netsparker', 'nikto', 'curl/',
    'nmap', 'masscan', 'screaming frog', 'headless', 'phantomjs', 'slimerjs', 'wget/', 'libcurl',
    'go-http-client', 'java/', 'perl/', 'python/', 'scan', 'badbot', 'attack', 'user-agent', 'checker'
  ];
  const ua = userAgent.toLowerCase();
  const matchedKeyword = botKeywords.find(keyword => ua.includes(keyword));
  if (matchedKeyword) {
    console.warn(`[Botblocker] ⚠️ Wykryto słowo kluczowe bota: '${matchedKeyword}'`);
  }
  return matchedKeyword;
}

exports.handler = async (event) => {
  const ip = event.headers['x-forwarded-for']?.split(',')[0]?.trim();
  const userAgent = event.headers['user-agent'] || '';

  console.log('[Botblocker] 🔍 Odebrano żądanie');
  console.log('[Botblocker] 🌐 IP:', ip);
  console.log('[Botblocker] 🧭 User-Agent:', userAgent);

  try {
    // Sprawdź, czy IP już jest zablokowane
    console.log('[Botblocker] 🔍 Sprawdzanie, czy IP jest zablokowane...');
    const existing = await sql`SELECT reason FROM blocked_ips WHERE ip = ${ip}`;

    if (existing.length > 0) {
      console.warn('[Botblocker] 🚫 IP już zablokowane:', ip);
      const reason = existing[0].reason || 'Dostęp zablokowany';
      return {
        statusCode: 403,
        body: JSON.stringify({ error: reason }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Jeśli to bot — blokuj
    const keyword = isBot(userAgent);
    if (keyword) {
      console.warn('[Botblocker] 🤖 Wykryto bota! Blokowanie IP:', ip);
      await sql`
        INSERT INTO blocked_ips (ip, reason, blocked_at)
        VALUES (${ip}, ${'Wykryto bota: ' + keyword}, CURRENT_TIMESTAMP)
      `;
      console.log('[Botblocker] ✅ Bot zablokowany i zapisany w bazie danych');
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Wykryto bota: ' + keyword }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    console.log('[Botblocker] ✅ IP nie jest zablokowane, dostęp przyznany');
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (err) {
    console.error('[Botblocker] 🔥 Błąd serwera:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Błąd serwera' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
