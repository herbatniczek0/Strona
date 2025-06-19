const { neon } = require('@neondatabase/serverless');
const sqlGet = neon(process.env.NETLIFY_DATABASE_URL);

console.log("Czy sqlGet istnieje?", typeof sqlGet);


exports.handler = async (event) => {
  const { id } = event.queryStringParameters;

  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Nieprawidłowe ID' })
    };
  }

  try {
    console.log("Szukam wniosku ID:", numericId);

    const result = await sqlGet`SELECT * FROM submissions WHERE id = ${numericId}`;
    const rows = result.rows;

    if (rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Nie znaleziono wniosku' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(rows[0])
    };

  } catch (err) {
    console.error("Błąd zapisu:", err, "getSubmission.js");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
