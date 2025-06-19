const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.NETLIFY_DATABASE_URL);

exports.handler = async (event) => {
  console.info('[getSubmissions] Odebrano żądanie');

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Metoda nieobsługiwana' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    // Pobierz wszystkie wnioski z tabeli submissions
    const rows = await sql`SELECT id, name, discord, date, idea, status FROM submissions ORDER BY date DESC`;

    return {
      statusCode: 200,
      body: JSON.stringify(rows),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    console.error('[getSubmissions] Błąd podczas zapytania:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Błąd serwera podczas pobierania wniosków' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
