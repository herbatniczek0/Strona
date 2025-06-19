const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.NETLIFY_DATABASE_URL);

exports.handler = async (event) => {
  if (event.httpMethod !== 'DELETE') {
    return { statusCode: 405, body: 'Metoda nieobsługiwana' };
  }
  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Nieprawidłowe dane' };
  }
  const { id } = body;
  if (!id) {
    return { statusCode: 400, body: JSON.stringify({ success:false, error:'Brak ID' }) };
  }
  try {
    await sql`DELETE FROM admins WHERE id = ${id}`;
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ success:false, error: err.message }) };
  }
};
