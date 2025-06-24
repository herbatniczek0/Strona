const { Client } = require('pg');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method not allowed' }) };
  }

  const client = new Client({
    connectionString: process.env.NETLIFY_DATABASE_URL_UNPOOLED,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const { id, action } = JSON.parse(event.body);
    if (!id || !action) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Brak wymaganych danych' }) };
    }
    if (!['accept', 'reject', 'revoke'].includes(action)) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Niepoprawna akcja' }) };
    }

    await client.connect();

    // Pobierz wniosek
    const res = await client.query('SELECT * FROM wnioski WHERE id = $1', [id]);
    if (res.rows.length === 0) {
      await client.end();
      return { statusCode: 404, body: JSON.stringify({ message: 'Wniosek nie znaleziony' }) };
    }

    const app = res.rows[0];

    if (action === 'accept') {
      // Dodaj użytkownika do users jeśli nie ma
      const userCheck = await client.query('SELECT * FROM users WHERE uid = $1', [app.uid]);
      if (userCheck.rows.length === 0) {
        await client.query(
          `INSERT INTO users (uid, password, name, discord, gang)
           VALUES ($1, $2, $3, $4, $5)`,
          [app.uid, 'default_password', app.nickname, app.discord, app.faction]
        );
      }
      await client.query(`UPDATE wnioski SET status = 'zaakceptowany' WHERE id = $1`, [id]);
    } else if (action === 'reject') {
      // Aktualizuj status na odrzucony
      await client.query(`UPDATE wnioski SET status = 'odrzucony' WHERE id = $1`, [id]);
    } else if (action === 'revoke') {
      // Cofnij dostęp: usuń usera, zmień status wniosku na cofnięty
      await client.query(`DELETE FROM users WHERE uid = $1`, [app.uid]);
      await client.query(`UPDATE wnioski SET status = 'cofnięty' WHERE id = $1`, [id]);
    }

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Akcja '${action}' wykonana pomyślnie` }),
    };
  } catch (error) {
    console.error('[updateApplication.js] ERROR:', error);
    try { await client.end(); } catch {}
    return { statusCode: 500, body: JSON.stringify({ message: 'Błąd serwera' }) };
  }
};
