const { neon: neonGet } = require('@neondatabase/serverless');
const sqlGet = neonGet(process.env.NETLIFY_DATABASE_URL);

exports.handler = async (event) => {
  const { id } = event.queryStringParameters;
  try {
   const result = await sqlGet`SELECT * FROM submissions WHERE id = ${id}`;
const rows = result.rows;

if (rows.length === 0) {
  return {
    statusCode: 404,
    body: JSON.stringify({ error: 'Nie znaleziono wniosku' })
  };
}

return {
  statusCode: 200,
  body: JSON.stringify(rows[0]) // <-- poprawnie
};

  } catch (err) {
  console.error("Błąd zapisu:", err, "getSubmission.js"); // <-- dodaj to
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
