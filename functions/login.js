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
      'SELECT id, first_name, last_name, gang, discord, uid, password_hash FROM users WHERE uid = $1',
      [UID]
    );

    if (res.rows.length === 0) {
      await client.end();
      return { statusCode: 401, body: JSON.stringify({ message: 'Invalid UID or password' }) };
    }

    const user = res.rows[0];
    
    // Tu możesz użyć np. bcrypt do sprawdzenia hasła, ale dla uproszczenia:
    if (password !== user.password_hash) {
      await client.end();
      return { statusCode: 401, body: JSON.stringify({ message: 'Invalid UID or password' }) };
    }

    await client.end();

    // Po poprawnym logowaniu zwróć dane użytkownika (bez hasła) i np. token sesji (tu uproszczony)
    const responseUser = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
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
        // redirect: '/panel.html' // lub inny adres panelu po stronie frontend
      }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ message: 'Błąd serwera', error: error.message }) };
  }
};
