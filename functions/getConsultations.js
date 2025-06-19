require('dotenv').config();
const { neon } = require('@netlify/neon');
const sql = neon(process.env.DATABASE_URL);
exports.handler = async () => {
  const result = await sql`SELECT * FROM consultations`;
  return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(result) };
};