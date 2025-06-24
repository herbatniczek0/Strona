const { Client } = require('pg');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method not allowed' }) };
  }

  const client = new Client({
    connectionString: process.env.NETLIFY_DATABASE_URL_UNPOOLED,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    const res = await client.query(`
      SELECT id, nickname, uid, discord, faction, reason, status, attempts, created_at
      FROM wnioski
      ORDER BY created_at DESC
    `);

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ applications: res.rows }),
    };
  } catch (error) {
    console.error('[getApplications.js] ERROR:', error);
    try { await client.end(); } catch {}
    return { statusCode: 500, body: JSON.stringify({ message: 'Błąd serwera' }) };
  }
};
