const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

const sql = neon(process.env.NETLIFY_DATABASE_URL);

exports.handler = async (event) => {
  console.info('[checkAdminAccess] Odebrano żądanie');

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Metoda nieobsługiwana' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
    console.info('[checkAdminAccess] Odczytano dane z body:', body);
  } catch (err) {
    console.error('[checkAdminAccess] Błąd parsowania body:', err);
    return { statusCode: 400, body: JSON.stringify({ error: 'Nieprawidłowe dane wejściowe' }) };
  }

  const { username, password } = body;
  if (!username || !password) {
    console.warn('[checkAdminAccess] Brak username lub password w żądaniu');
    return { statusCode: 400, body: JSON.stringify({ error: 'Brak username lub password' }) };
  }

  console.info(`[checkAdminAccess] Próba logowania użytkownika: ${username}`);

  try {
    // Pobierz użytkownika z bazy
    const users = await sql`SELECT id, username, password_hash FROM admins WHERE username = ${username}`;

    console.info('[checkAdminAccess] Wynik zapytania do bazy:', users);

    if (users.length === 0) {
      console.warn(`[checkAdminAccess] Nie znaleziono użytkownika: ${username}`);
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: 'Brak dostępu lub błędne dane.' }),
      };
    }

    const user = users[0];
    console.info(`[checkAdminAccess] Znaleziono użytkownika: ${user.username}`);

    // Hashowanie podanego hasła SHA-256
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    console.info(`[checkAdminAccess] Hash podanego hasła: ${hash}`);

    if (hash === user.password_hash) {
      console.info('[checkAdminAccess] Hasło poprawne');
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    } else {
      console.warn(`[checkAdminAccess] Nieprawidłowe hasło dla użytkownika: ${username}`);
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: 'Brak dostępu lub błędne dane.' }),
      };
    }
  } catch (err) {
    console.error('[checkAdminAccess] Błąd podczas zapytania do bazy:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Wystąpił błąd serwera' }),
    };
  }
};
