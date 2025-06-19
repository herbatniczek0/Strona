const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.NETLIFY_DATABASE_URL);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Metoda nieobsługiwana' };
  }
  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Nieprawidłowe dane' };
  }
  const { title, description } = body;
  if (!title) {
    return { statusCode: 400, body: JSON.stringify({ success:false, error:'Brak tytułu' }) };
  }
  try {
    const res = await sql`
      INSERT INTO consultations (title, description)
      VALUES (${title}, ${description || null})
      RETURNING *;
    `;
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, consultation: res[0] })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ success:false, error: err.message }) };
  }
};
