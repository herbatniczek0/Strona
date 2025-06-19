const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.NETLIFY_DATABASE_URL);

exports.handler = async (event) => {
  const id = event.queryStringParameters?.id;
  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Brak parametru id' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
  const cleanId = parseInt(id, 10);
  if (isNaN(cleanId)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Nieprawidłowe ID' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    const rows = await sql`SELECT * FROM submissions WHERE id = ${cleanId}`;
    if (rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Nie znaleziono wniosku' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify(rows[0]),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
