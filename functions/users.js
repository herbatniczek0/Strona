const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method not allowed' }) };
  }

  try {
    await client.connect();

    const res = await client.query(
      'SELECT first_name, last_name, gang, discord, uid FROM users ORDER BY last_name, first_name'
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ users: res.rows }),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ message: 'Błąd serwera', error: error.message }) };
  }
};
