const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.NETLIFY_DB_URL);

exports.handler = async () => {
  try {
    const { rows } = await sql`SELECT * FROM wnioski ORDER BY created_at DESC`;
    console.log("[getWnioski] Pobieranie wniosków z bazy:", rows);
    return {
      statusCode: 200,
      body: JSON.stringify({ wnioski: rows })
    };
  } catch (error) {
    console.error("[getWnioski] Błąd:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Błąd pobierania wniosków' })
    };
  }
};
