const { neon: neonConsult } = require('@neondatabase/serverless');
const sqlConsult = neonConsult(process.env.NETLIFY_DATABASE_URL);

exports.handler = async () => {
  console.log("🚀 Start getConsultations handler");
  try {
    const result = await sqlConsult`SELECT * FROM consultations`;
    console.log("📋 Result z bazy:", result);

    // Jeśli result jest tablicą, to zwracamy ją od razu
    // Jeśli to obiekt z rows, to result.rows

    const data = Array.isArray(result) ? result : result.rows;

    console.log("✅ Liczba rekordów:", data ? data.length : 0);
    console.log("📋 Dane:", JSON.stringify(data, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (err) {
    console.error("🔥 Błąd w getConsultations.js:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
