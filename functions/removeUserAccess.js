const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.NETLIFY_DB_URL);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { uid } = JSON.parse(event.body);
    console.log("[removeUserAccess] Usuwanie dostępu UID:", uid);

    await sql`DELETE FROM users WHERE uid = ${uid}`;
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error("[removeUserAccess] Błąd:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Błąd usuwania dostępu' })
    };
  }
};
