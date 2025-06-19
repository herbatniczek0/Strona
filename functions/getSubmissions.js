const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.NETLIFY_DATABASE_URL);

exports.handler = async (event) => {
  console.info('[getSubmissions] Odebrano żądanie');

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Metoda nieobsługiwana' }) };
  }

  try {
    // Przykładowa kolumny: id, username, content, date (dostosuj do swojej tabeli!)
    const submissions = await sql`
      SELECT id, username, content, date
      FROM submissions
      ORDER BY date DESC
      LIMIT 50
    `;

    console.info('[getSubmissions] Pobierzono rekordy:', submissions.length);

    return {
      statusCode: 200,
      body: JSON.stringify(submissions),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // jeśli CORS jest potrzebny
      },
    };
  } catch (error) {
    console.error('[getSubmissions] Błąd podczas zapytania:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Błąd serwera podczas pobierania wniosków' }),
    };
  }
};
