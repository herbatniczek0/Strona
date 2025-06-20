// createSubmission.js
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.NETLIFY_DATABASE_URL);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Metoda nieobsługiwana' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Nieprawidłowe dane JSON' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  const { name, discord, date, idea } = body;
  const ip = event.headers['x-forwarded-for']?.split(',')[0] || event.headers['client-ip'] || 'unknown';

  if (!name || !discord || !date || !idea) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Brakuje pól formularza' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    // Sprawdź liczbę zgłoszeń z danego IP
    const countResult = await sql`SELECT COUNT(*) FROM submissions WHERE ip = ${ip}`;
    const submissionCount = parseInt(countResult[0].count, 10);

    if (submissionCount >= 2) {
      return {
        statusCode: 429,
        body: JSON.stringify({ error: 'Limit 2 wniosków na IP został osiągnięty.' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    // Generuj losowe ID (np. 9 cyfr)
    const id = Math.floor(100000000 + Math.random() * 900000000);
    await sql`
      INSERT INTO submissions (id, name, discord, date, idea, ip)
      VALUES (${id}, ${name}, ${discord}, ${date}, ${idea}, ${ip})
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, id }),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Błąd serwera: ' + err.message }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
