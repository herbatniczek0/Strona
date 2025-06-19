const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.NETLIFY_DATABASE_URL);

exports.handler = async () => {
  try {
    const rows = await sql`
      SELECT id, name, idea, date
      FROM submissions
      ORDER BY date DESC
      LIMIT 100
    `;
    return {
      statusCode: 200,
      body: JSON.stringify(rows),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (err) {
    console.error('Błąd zapytania do submissions:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
