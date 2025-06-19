const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.NETLIFY_DATABASE_URL);

exports.handler = async () => {
  try {
    const admins = await sql`SELECT id, username FROM admins`;
    return {
      statusCode: 200,
      body: JSON.stringify(admins)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
