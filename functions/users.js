const { Client } = require('pg');

exports.handler = async (event) => {
  console.info(`[users.js] Request received, method: ${event.httpMethod}`);

  if (event.httpMethod !== 'GET') {
    console.warn(`[users.js] Method not allowed: ${event.httpMethod}`);
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.info('[users.js] Connecting to database...');
    await client.connect();
    console.info('[users.js] Connected to DB');

    // Użyj swojej właściwej nazwy kolumn i tabeli
    const queryText = `
      SELECT id, uid, name, discord, gang
      FROM users
      ORDER BY name
    `;
    console.info(`[users.js] Running query: ${queryText.trim()}`);

    const res = await client.query(queryText);

    console.info(`[users.js] Query returned ${res.rows.length} rows`);

    await client.end();
    console.info('[users.js] Database connection closed');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users: res.rows }),
    };
  } catch (error) {
    console.error('[users.js] ERROR:', error);
    try {
      await client.end();
      console.info('[users.js] Database connection closed after error');
    } catch (closeError) {
      console.error('[users.js] ERROR closing DB connection:', closeError);
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Błąd serwera', error: error.message }),
    };
  }
};
