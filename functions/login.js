const { Client } = require('pg');

exports.handler = async (event) => {
  console.log('[login.js] Request received');

  if (event.httpMethod !== 'POST') {
    console.log('[login.js] Method not allowed:', event.httpMethod);
    return { statusCode: 405, body: JSON.stringify({ message: 'Method not allowed' }) };
  }

  let client;
  try {
    console.log('[login.js] Parsing body');
    const { UID, password } = JSON.parse(event.body);

    console.log('[login.js] Received:', { UID, password: password ? '***' : null });

    if (!UID || !password) {
      console.log('[login.js] Missing UID or password');
      return { statusCode: 400, body: JSON.stringify({ message: 'UID and password required' }) };
    }

    client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    console.log('[login.js] Connecting to database...');
    await client.connect();
    console.log('[login.js] Connected to DB');

    const queryText = 'SELECT id, first_name, last_name, gang, discord, uid, password_hash, role FROM users WHERE uid = $1';
    console.log('[login.js] Running query:', queryText, 'with UID:', UID);
    const res = await client.query(queryText, [UID]);

    if (res.rows.length === 0) {
      console.log('[login.js] No user found with UID:', UID);
      await client.end();
      return { statusCode: 401, body: JSON.stringify({ message: 'Invalid UID or password' }) };
    }

    const user = res.rows[0];
    console.log('[login.js] User found:', { id: user.id, uid: user.uid, role: user.role });

    if (password !== user.password_hash) {
      console.log('[login.js] Password mismatch');
      await client.end();
      return { statusCode: 401, body: JSON.stringify({ message: 'Invalid UID or password' }) };
    }

    await client.end();
    console.log('[login.js] Login successful, disconnecting DB');

    const responseUser = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      gang: user.gang,
      discord: user.discord,
      uid: user.uid,
      role: user.role || 'user'
    };

    console.log('[login.js] Sending success response');

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        message: 'Zalogowano pomyślnie',
        user: responseUser,
      }),
    };

  } catch (error) {
    if (client) {
      try {
        await client.end();
        console.log('[login.js] DB connection closed after error');
      } catch (closeError) {
        console.error('[login.js] Error closing DB connection:', closeError);
      }
    }
    console.error('[login.js] ERROR:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Błąd serwera',
        error: error.message,
      }),
    };
  }
};
