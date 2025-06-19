const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.NETLIFY_DATABASE_URL);

function generateRandomId() {
  return Math.floor(100000000 + Math.random() * 900000000); // 9 cyfr
}

exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body);
    const id = generateRandomId();

    await sql`
      INSERT INTO submissions (id, name, discord, date, idea, status)
      VALUES (${id}, ${data.name}, ${data.discord}, ${data.date}, ${data.idea}, 'Nowy')
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ id })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
