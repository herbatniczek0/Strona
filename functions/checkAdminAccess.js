const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcrypt');

const sql = neon(process.env.NETLIFY_DATABASE_URL);

exports.handler = async (event) => {
  console.log('[checkAdminAccess] Odebrano żądanie');
  try {
    if (event.httpMethod !== 'POST') {
      console.log('[checkAdminAccess] Nieobsługiwana metoda HTTP:', event.httpMethod);
      return { statusCode: 405, body: 'Metoda niedozwolona' };
    }

    let body;
    try {
      body = JSON.parse(event.body);
      console.log('[checkAdminAccess] Odczytano dane z body:', body);
    } catch (err) {
      console.error('[checkAdminAccess] Błąd parsowania JSON:', err);
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Niepoprawne dane JSON' }),
      };
    }

    const { username, password } = body;

    if (!username || !password) {
      console.log('[checkAdminAccess] Brak loginu lub hasła');
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Brak nazwy użytkownika lub hasła' }),
      };
    }
    console.log(`[checkAdminAccess] Próba logowania użytkownika: ${username}`);

    const users = await sql`
      SELECT * FROM admins WHERE username = ${username}
    `;
    console.log('[checkAdminAccess] Wynik zapytania do bazy:', users);

    if (!users || users.length === 0) {
      console.log(`[checkAdminAccess] Użytkownik nie znaleziony: ${username}`);
      return {
        statusCode: 200,
        body: JSON.stringify({ success: false, error: 'Nie ma takiego użytkownika' }),
      };
    }

    const user = users[0];
    console.log('[checkAdminAccess] Znaleziono użytkownika:', user.username);

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    console.log('[checkAdminAccess] Sprawdzenie hasła:', passwordMatch);

    if (!passwordMatch) {
      console.log('[checkAdminAccess] Nieprawidłowe hasło dla użytkownika:', username);
      return {
        statusCode: 200,
        body: JSON.stringify({ success: false, error: 'Nieprawidłowe hasło' }),
      };
    }

    console.log('[checkAdminAccess] Logowanie powiodło się dla użytkownika:', username);
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };

  } catch (error) {
    console.error('[checkAdminAccess] Nieoczekiwany błąd:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Błąd serwera' }),
    };
  }
};
