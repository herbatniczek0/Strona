const { Client } = require('pg');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method not allowed' }) };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const res = await client.query(
      'SELECT name, discord, gang, uid FROM users ORDER BY name'
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ users: res.rows }),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    if (client) {
      await client.end().catch(() => {});
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Błąd serwera', error: error.message })
    };
  }
};
