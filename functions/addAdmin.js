const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');
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
  const { username, password } = body;
  if (!username || !password) {
    return { statusCode: 400, body: JSON.stringify({ success:false, error:'Brak username lub password' }) };
  }
  const password_hash = crypto.createHash('sha256').update(password).digest('hex');
  try {
    await sql`
      INSERT INTO admins (username, password_hash)
      VALUES (${username}, ${password_hash})
    `;
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ success:false, error: err.message }) };
  }
};
