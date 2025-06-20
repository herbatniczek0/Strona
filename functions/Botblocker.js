const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.NETLIFY_DATABASE_URL);

const whitelistedAgents = [
  'discordbot', 'facebookexternalhit', 'telegrambot', 'slackbot', 'linkedinbot',
  'embedly', 'quora link preview', 'whatsapp', 'pinterest', 'vkshare', 'twitterbot'
];

const suspiciousAgents = [
  'uptime', 'pingdom', 'statuscake', 'newrelic', 'gtmetrix', 'pagespeed',
  'monitoring', 'cfnetwork', 'unknown', 'anonymouse',
  'mozilla/5.0 (compatible;)', 'undefined'
];

const blacklistedAgents = [
  'bot', 'crawl', 'crawler', 'spider', 'curl', 'wget', 'python', 'node', 'axios',
  'libwww', 'httpclient', 'go-http-client', 'perl', 'java', 'php', 'scrapy', 'urllib',
  'powershell', 'httpx', 'ruby', 'jakarta', 'http-request', 'httpget', 'urlgrabber',
  'okhttp', 'aiohttp', 'restsharp', 'faraday', 'mechanize', 'winhttp', 'lwp', 'dart',
  'guzzle', 'reqwest', 'http-client', 'urlfetch', 'masscan', 'netsparker', 'nikto',
  'nmap', 'acunetix', 'sqlmap', 'wpscan', 'xss', 'scanner', 'fuzzer', 'dirbuster',
  'dirb', 'attack', 'payload', 'shodan', 'whatweb', 'jaeles', 'headless',
  'headlesschrome', 'puppeteer', 'selenium', 'phantomjs', 'slimerjs', 'playwright',
  'scraper', 'grabber', 'insomnia', 'postman', 'fetch', 'python-requests', 'zapier',
  'rssbot', 'mailchimp', 'extractor', 'screaming frog', 'content grabber',
  'tor', 'proxy', 'botlibre'
];

function classifyUserAgent(userAgent = '') {
  const ua = userAgent.toLowerCase();

  if (whitelistedAgents.some(kw => ua.includes(kw))) return 'whitelisted';
  if (blacklistedAgents.some(kw => ua.includes(kw))) return 'blacklisted';
  if (suspiciousAgents.some(kw => ua.includes(kw))) return 'suspicious';

  return 'unknown';
}

exports.handler = async (event) => {
  const ip = event.headers['x-forwarded-for']?.split(',')[0]?.trim();
  const userAgent = event.headers['user-agent'] || '';

  console.log('[Botblocker] 🔍 Odebrano żądanie');
  console.log('[Botblocker] 🌐 IP:', ip);
  console.log('[Botblocker] 🧭 User-Agent:', userAgent);

  try {
    const classification = classifyUserAgent(userAgent);
    console.log('[Botblocker] 🔍 Klasyfikacja UA:', classification);

    if (classification === 'blacklisted') {
      console.warn('[Botblocker] 🤖 Wykryto bota! Blokowanie IP:', ip);
      await sql`INSERT INTO blocked_ips (ip, reason, blocked_at) VALUES (${ip}, ${'Wykryto bota: ' + userAgent}, CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING`;
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Wykryto bota: ' + userAgent }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    if (classification === 'suspicious') {
      console.warn('[Botblocker] ⚠️ Podejrzany UA:', userAgent);
    }

    // Sprawdź, czy IP już jest zablokowane
    console.log('[Botblocker] 🔍 Sprawdzanie, czy IP jest zablokowane...');
    const res = await sql`SELECT reason FROM blocked_ips WHERE ip = ${ip}`;

    if (res.length > 0) {
      console.warn('[Botblocker] 🚫 IP już zablokowane:', ip);
      const reason = res[0].reason || 'Dostęp zablokowany';
      return {
        statusCode: 403,
        body: JSON.stringify({ error: reason }),
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
