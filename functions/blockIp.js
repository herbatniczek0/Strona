const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.NETLIFY_DATABASE_URL);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Metoda nieobsługiwana' };
  }

  try {
    const { ip, reason } = JSON.parse(event.body);
    if (!ip) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Brak IP do zablokowania' }) };
    }

    await sql`
      INSERT INTO blocked_ips (ip, reason) VALUES (${ip}, ${reason || 'brak'})
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error('Błąd blokowania IP:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
