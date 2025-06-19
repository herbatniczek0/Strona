const { neon } = require('@neondatabase/serverless');
const sqlGet = neon(process.env.NETLIFY_DATABASE_URL);

exports.handler = async (event) => {
  console.log("[getSubmissions] Odebrano żądanie");

  try {
    const rows = await sqlGet`
      SELECT id, name, idea, date
      FROM submissions
      ORDER BY date DESC
      LIMIT 100
    `;

    console.log("[getSubmissions] Wynik zapytania:", rows);

    return {
      statusCode: 200,
      body: JSON.stringify(rows),
      headers: { 'Content-Type': 'application/json' },
    };

  } catch (err) {
    console.error("[getSubmissions] Błąd podczas zapytania:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
