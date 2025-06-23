const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method not allowed' }) };
  }

  try {
    const { UID, password } = JSON.parse(event.body);

    if (!UID || !password) {
      return { statusCode: 400, body: JSON.stringify({ message: 'UID and password required' }) };
    }

    await client.connect();

    const res = await client.query(
      'SELECT id, name, gang, discord, uid, password FROM users WHERE uid = $1',
      [UID]
    );

    if (res.rows.length === 0) {
      await client.end();
      return { statusCode: 401, body: JSON.stringify({ message: 'Invalid UID or password' }) };
    }

    const user = res.rows[0];
    
    // Proste porównanie hasła w plaintext (niezalecane w realnym systemie)
    if (password !== user.password) {
      await client.end();
      return { statusCode: 401, body: JSON.stringify({ message: 'Invalid UID or password' }) };
    }

    await client.end();

    // Zwracamy dane użytkownika bez hasła
    const responseUser = {
      id: user.id,
      name: user.name,
      gang: user.gang,
      discord: user.discord,
      uid: user.uid,
    };

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        message: 'Zalogowano pomyślnie',
        user: responseUser,
        // redirect: '/panel.html' // Możesz dodać redirect po stronie frontu
      }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ message: 'Błąd serwera', error: error.message }) };
  }
};
