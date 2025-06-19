const { neon: neonConsult } = require('@neondatabase/serverless');
const sqlConsult = neonConsult(process.env.NETLIFY_DATABASE_URL);

exports.handler = async () => {
  try {
const result = await sqlConsult`SELECT * FROM consultations`;
return {
  statusCode: 200,
  body: JSON.stringify(result.rows) // <-- to!
};

  } catch (err) {
  console.error("Błąd zapisu:", err, "getConsultations.js"); // <-- dodaj to
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
