const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.NETLIFY_DATABASE_URL);

function generateRandomId() {
  return Math.floor(100000000 + Math.random() * 900000000); // 9 cyfr
}

exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body);
    const id = generateRandomId();

    // Pobierz IP z nagłówków (działa w Netlify Functions)
    const ip =
      event.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      event.headers["client-ip"] ||
      "unknown";

    // Sprawdź ile wniosków już złożyło to IP
    const existing = await sql`
      SELECT COUNT(*) FROM submissions WHERE ip = ${ip}
    `;
    const count = parseInt(existing[0].count, 10);

    if (count >= 2) {
      return {
        statusCode: 429,
        body: JSON.stringify({ error: 'Limit 2 wniosków na IP został osiągnięty.' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    await sql`
      INSERT INTO submissions (id, name, discord, date, idea, status, ip)
      VALUES (${id}, ${data.name}, ${data.discord}, ${data.date}, ${data.idea}, 'Nowy', ${ip})
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ id }),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (err) {
    console.error("Błąd zapisu:", err, "createSubmission.js");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
