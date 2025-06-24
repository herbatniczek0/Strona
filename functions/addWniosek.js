const { Client } = require('@neondatabase/serverless');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { uid, name, discord, gang, ip } = JSON.parse(event.body);

  if (!uid || !/^[0-9]{6}$/.test(uid)) {
    return { statusCode: 400, body: 'UID musi mieć dokładnie 6 cyfr' };
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    // Sprawdź czy UID ma już zaakceptowany dostęp
    const { rows: existingUsers } = await client.query(
      'SELECT * FROM uzytkownicy WHERE uid = $1',
      [uid]
    );
    if (existingUsers.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Masz już dostęp do systemu.' })
      };
    }

    // Sprawdź czy już złożono wniosek oczekujący lub zaakceptowany
    const { rows: existingRequest } = await client.query(
      "SELECT * FROM wnioski WHERE uid = $1 AND status IN ('oczekujący', 'zaakceptowany')",
      [uid]
    );
    if (existingRequest.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Masz już aktywny wniosek.' })
      };
    }

    // Dodaj nowy wniosek
    await client.query(
      'INSERT INTO wnioski (uid, name, discord, gang, ip_address) VALUES ($1, $2, $3, $4, $5)',
      [uid, name, discord, gang, ip]
    );

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Błąd serwera' };
  } finally {
    await client.end();
  }
};
