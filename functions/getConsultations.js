const { neon: neonConsult } = require('@neondatabase/serverless');
const sqlConsult = neonConsult(process.env.NETLIFY_DATABASE_URL);

exports.handler = async () => {
  console.log("🚀 Start getConsultations handler");
  try {
    const result = await sqlConsult`SELECT * FROM consultations`;
    console.log("✅ Zapytanie wykonane pomyślnie");
    console.log("📊 Liczba rekordów:", result.rows.length);
    console.log("📋 Dane:", JSON.stringify(result.rows, null, 2));
    return {
      statusCode: 200,
      body: JSON.stringify(result.rows)
    };
  } catch (err) {
    console.error("🔥 Błąd w getConsultations.js:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
