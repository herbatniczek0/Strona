const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.NETLIFY_DATABASE_URL);

function isBot(userAgent) {
  const botKeywords = [
    'bot', 'crawl', 'spider', 'slurp', 'curl', 'wget', 'python', 'node', 'axios', 'scrapy'
  ];
  const ua = userAgent?.toLowerCase() || '';
  return botKeywords.some(keyword => ua.includes(keyword));
}

exports.handler = async (event) => {
  const ip =
    event.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    event.headers["client-ip"] ||
    "unknown";

  const userAgent = event.headers['user-agent'] || '';
  const now = new Date();

  try {
    // 🔁 Usuń stare logi starsze niż 3 godziny
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
    await sql`DELETE FROM ip_logs WHERE date < ${threeHoursAgo}`;

    // 🧠 Wykrycie bota na podstawie user-agenta
    if (isBot(userAgent)) {
      await sql`INSERT INTO blocked_ips (ip, reason) VALUES (${ip}, 'Bot wykryty przez user-agent') ON CONFLICT DO NOTHING`;
      return {
        statusCode: 200,
        body: JSON.stringify({ blocked: true, reason: 'Wykryto bota (user-agent)' }),
      };
    }

    // 🔒 Sprawdź, czy IP jest zablokowane
    const blocked = await sql`SELECT reason FROM blocked_ips WHERE ip = ${ip}`;
    if (blocked.length > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ blocked: true, reason: blocked[0].reason }),
      };
    }

    // 📝 Zapisz log
    await sql`
      INSERT INTO ip_logs (ip, date)
      VALUES (${ip}, ${now.toISOString()})
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ blocked: false }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
