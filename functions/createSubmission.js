require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
exports.handler = async (event) => {
  const { name, discord, date, idea } = JSON.parse(event.body);
  const id = require('crypto').randomBytes(8).toString('hex');
  await sql`INSERT INTO submissions (id, name, discord, date, idea, status) VALUES (${id}, ${name}, ${discord}, ${date}, ${idea}, 'W trakcie rozpatrywania')`;
  return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ id }) };
};
