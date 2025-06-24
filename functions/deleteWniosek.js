const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.NETLIFY_DB_URL);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { id } = JSON.parse(event.body);
    console.log("[deleteWniosek] Usuwanie wniosku ID:", id);

    await sql`DELETE FROM wnioski WHERE id = ${id}`;
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error("[deleteWniosek] Błąd:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Błąd podczas usuwania wniosku' })
    };
  }
};
