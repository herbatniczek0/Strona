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
    const { nickname, uid, discord, faction, reason } = JSON.parse(event.body);

    // Walidacja pól
    if (!nickname || !uid || !discord || !reason) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Wypełnij wszystkie wymagane pola' }) };
    }
    if (!/^\d{6}$/.test(uid)) {
      return { statusCode: 400, body: JSON.stringify({ message: 'UID musi mieć dokładnie 6 cyfr' }) };
    }

    await client.connect();

    // Sprawdź, czy użytkownik już ma dostęp
    const userRes = await client.query('SELECT id FROM users WHERE uid=$1', [uid]);
    if (userRes.rows.length > 0) {
      await client.end();
      return { statusCode: 400, body: JSON.stringify({ message: 'Masz już dostęp do strony' }) };
    }

    // Sprawdź czy istnieje oczekujący wniosek dla tego UID
    const pendingRes = await client.query(
      `SELECT COUNT(*) FROM wnioski WHERE uid = $1 AND status = 'oczekujący'`,
      [uid]
    );
    if (parseInt(pendingRes.rows[0].count) > 0) {
      await client.end();
      return { statusCode: 400, body: JSON.stringify({ message: 'Masz już oczekujący wniosek' }) };
    }

    // Sprawdź liczbę złożonych wniosków, max 3
    const attemptsRes = await client.query(
      `SELECT COUNT(*) FROM wnioski WHERE uid = $1`,
      [uid]
    );
    if (parseInt(attemptsRes.rows[0].count) >= 3) {
      await client.end();
      return { statusCode: 400, body: JSON.stringify({ message: 'Przekroczono limit prób składania wniosku' }) };
    }

    // Dodaj nowy wniosek
    await client.query(
      `INSERT INTO wnioski (nickname, uid, discord, faction, reason, status, attempts, created_at)
       VALUES ($1, $2, $3, $4, $5, 'oczekujący', 1, CURRENT_TIMESTAMP)`,
      [nickname, uid, discord, faction || '', reason]
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Wniosek został złożony, czekaj na decyzję administracji' }),
    };
  } catch (error) {
    console.error('[submitApplication.js] ERROR:', error);
    try { await client.end(); } catch {}
    return { statusCode: 500, body: JSON.stringify({ message: 'Błąd serwera' }) };
  }
};
