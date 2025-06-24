const { Client } = require('pg');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method not allowed' }) };
  }

  try {
    const { UID, password } = JSON.parse(event.body);

    if (!UID || !password) {
      return { statusCode: 400, body: JSON.stringify({ message: 'UID and password required' }) };
    }

    const client = new Client({
      connectionString: process.env.NETLIFY_DATABASE_URL_UNPOOLED,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    const query = `
      SELECT id, uid, password, name, discord, gang, admin
      FROM users
      WHERE uid = $1 AND admin = 1
      LIMIT 1
    `;
    const res = await client.query(query, [UID]);

    if (res.rows.length === 0) {
      await client.end();
      return { statusCode: 401, body: JSON.stringify({ message: 'Invalid admin UID or password' }) };
    }

    const user = res.rows[0];

    if (password !== user.password) {
      await client.end();
      return { statusCode: 401, body: JSON.stringify({ message: 'Invalid admin UID or password' }) };
    }

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        message: 'Admin login successful',
        user: {
          id: user.id,
          uid: user.uid,
          name: user.name,
          discord: user.discord,
          gang: user.gang
        },
        redirect: '/admin.html'
      })
    };
  } catch (error) {
    console.error('[admin-login.js] ERROR:', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Server error', error: error.message }) };
  }
};
