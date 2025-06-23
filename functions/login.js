const { Client } = require('pg');

exports.handler = async (event) => {
  console.info('[login.js] Request received');

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method not allowed' }) };
  }

  try {
    console.info('[login.js] Parsing body');
    const { UID, password } = JSON.parse(event.body);
    console.info('[login.js] Received:', { UID, password: password ? '***' : null });

    if (!UID || !password) {
      return { statusCode: 400, body: JSON.stringify({ message: 'UID and password required' }) };
    }

    const client = new Client({
      connectionString: process.env.NETLIFY_DATABASE_URL_UNPOOLED,
      ssl: { rejectUnauthorized: false }
    });

    console.info('[login.js] Connecting to database...');
    await client.connect();
    console.info('[login.js] Connected to DB');

    const query = 'SELECT id, uid, password, name, discord, gang FROM users WHERE uid = $1';
    console.info('[login.js] Running query:', query, 'with UID:', UID);

    const res = await client.query(query, [UID]);

    if (res.rows.length === 0) {
      await client.end();
      console.info('[login.js] User not found');
      return { statusCode: 401, body: JSON.stringify({ message: 'Invalid UID or password' }) };
    }

    const user = res.rows[0];
    console.info('[login.js] User found:', { id: user.id, uid: user.uid, name: user.name });

    if (password !== user.password) {
      await client.end();
      console.info('[login.js] Password mismatch');
      return { statusCode: 401, body: JSON.stringify({ message: 'Invalid UID or password' }) };
    }

    await client.end();
    console.info('[login.js] DB connection closed, login success');

    const responseUser = {
      id: user.id,
      uid: user.uid,
      name: user.name,
      discord: user.discord,
      gang: user.gang
    };

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        message: 'Zalogowano pomyślnie',
        user: responseUser,
        redirect: '/panel.html'  // lub /admin.html w zależności od roli, możesz to rozbudować później
      }),
    };
  } catch (error) {
    console.error('[login.js] ERROR:', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Błąd serwera', error: error.message }) };
  }
};
