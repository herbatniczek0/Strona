const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event) => {
  console.log(`[users.js] Request received, method: ${event.httpMethod}`);

  if (event.httpMethod !== 'GET') {
    console.warn('[users.js] Method not allowed');
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  }

  try {
    console.log('[users.js] Connecting to database...');
    await client.connect();
    console.log('[users.js] Connected to database');

    const queryText = 'SELECT id, uid, password, name, discord, gang FROM users ORDER BY name ASC';
    console.log(`[users.js] Running query: ${queryText}`);

    const res = await client.query(queryText);
    console.log(`[users.js] Query successful, rows fetched: ${res.rows.length}`);

    await client.end();
    console.log('[users.js] Database connection closed');

    return {
      statusCode: 200,
      body: JSON.stringify({ users: res.rows }),
      headers: { 'Content-Type': 'application/json' },
    };

  } catch (error) {
    console.error('[users.js] ERROR:', error);

    // Upewnij się, że connection zamknięty
    try {
      await client.end();
      console.log('[users.js] Database connection closed after error');
    } catch (closeErr) {
      console.error('[users.js] ERROR closing connection:', closeErr);
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Błąd serwera', error: error.message, stack: error.stack }),
    };
  }
};
