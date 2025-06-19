const { neon } = require('@neondatabase/serverless');
const sqlGet = neon(process.env.NETLIFY_DATABASE_URL);

exports.handler = async (event) => {
  console.log("🔍 queryStringParameters:", event.queryStringParameters);

  if (!event.queryStringParameters || !event.queryStringParameters.id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Brak parametru id' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  const { id } = event.queryStringParameters;
  console.log("🔢 Otrzymane ID (raw):", JSON.stringify(id));

  const trimmedId = (id || '').trim();
  console.log("🧼 Oczyszczone ID:", JSON.stringify(trimmedId));

  const cleanId = parseInt(trimmedId, 10);
  console.log("📦 Parsed ID jako liczba:", cleanId, "| Typ:", typeof cleanId);

  if (isNaN(cleanId)) {
    console.log("❌ Błąd: cleanId nie jest liczbą");
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Nieprawidłowe ID' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    console.log("📡 Wykonuję zapytanie SQL...");
    const rows = await sqlGet`SELECT * FROM submissions WHERE id = ${cleanId}`;
    console.log("📥 Wynik zapytania:", rows);
    console.log("📊 Ilość wierszy:", rows.length);

    if (rows.length === 0) {
      console.log("⚠️ Wniosek nie znaleziony w bazie.");
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Nie znaleziono wniosku' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    console.log("✅ Wniosek znaleziony:", rows[0]);
    return {
      statusCode: 200,
      body: JSON.stringify(rows[0]),
      headers: { 'Content-Type': 'application/json' },
    };

  } catch (err) {
    console.error("🔥 Błąd zapytania:", err, "getSubmission.js");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
