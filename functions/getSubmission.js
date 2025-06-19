require('dotenv').config();
const { neon } = require('@netlify/neon');
const sql = neon(process.env.DATABASE_URL);
exports.handler = async (event) => {
  const id = event.queryStringParameters.id;
  const result = await sql`SELECT * FROM submissions WHERE id = ${id}`;
  return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(result[0] || {}) };
};