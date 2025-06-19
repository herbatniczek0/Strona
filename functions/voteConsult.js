require('dotenv').config();
const { neon } = require('@netlify/neon');
const sql = neon(process.env.DATABASE_URL);
exports.handler = async (event) => {
  const { id } = JSON.parse(event.body);
  await sql`UPDATE consultations SET votes = votes + 1 WHERE id = ${id}`;
  const result = await sql`SELECT * FROM consultations WHERE id = ${id}`;
  return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(result[0]) };
};