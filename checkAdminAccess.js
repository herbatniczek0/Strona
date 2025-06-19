const bcrypt = require('bcrypt');
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.NETLIFY_DATABASE_URL);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    const { username, password } = JSON.parse(event.body);
    const result = await sql`SELECT password_hash FROM admin_users WHERE username = ${username}`;
    if (result.rowCount === 0) {
      return { statusCode: 200, body: JSON.stringify({ success: false }) };
    }
    const hash = result.rows[0].password_hash;
    const match = await bcrypt.compare(password, hash);
    if (match) {
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    } else {
      return { statusCode: 200, body: JSON.stringify({ success: false }) };
    }
  } catch (error) {
    console.error('checkAdminAccess error:', error);
    return { statusCode: 500, body: JSON.stringify({ success: false, error: error.message }) };
  }
};
