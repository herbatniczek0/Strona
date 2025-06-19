const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.NETLIFY_DATABASE_URL);

exports.handler = async (event) => {
  console.info('[checkAdminAccess] Odebrano żądanie');

  if (event.httpMethod !== 'POST') {
    console.warn('[checkAdminAccess] Niedozwolona metoda HTTP:', event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Metoda HTTP niedozwolona. Użyj POST.' }),
    };
  }

  try {
    const { discord_id } = JSON.parse(event.body || '{}');
    console.info('[checkAdminAccess] Odczytano ciało żądania:', { discord_id });

    if (!discord_id) {
      console.error('[checkAdminAccess] Brak discord_id w żądaniu');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Brak discord_id w żądaniu.' }),
      };
    }

    // Sprawdź czy discord_id jest w tabeli administratorzy
    const admins = await sql`
      SELECT * FROM administratorzy WHERE discord_id = ${discord_id}
    `;

    console.info('[checkAdminAccess] Wynik zapytania do bazy:', admins);

    if (admins.length > 0) {
      console.info('[checkAdminAccess] Użytkownik ma uprawnienia administratora:', discord_id);
      return {
        statusCode: 200,
        body: JSON.stringify({ authorized: true }),
      };
    } else {
      console.info('[checkAdminAccess] Użytkownik NIE ma uprawnień administratora:', discord_id);
      return {
        statusCode: 403,
        body: JSON.stringify({ authorized: false, error: 'Brak uprawnień do panelu admina.' }),
      };
    }
  } catch (err) {
    console.error('[checkAdminAccess] Wystąpił błąd:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Błąd wewnętrzny serwera.' }),
    };
  }
};
