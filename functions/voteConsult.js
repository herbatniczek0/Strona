const { neon: neonVote } = require('@neondatabase/serverless');
const sqlVote = neonVote(process.env.NETLIFY_DATABASE_URL);

exports.handler = async (event) => {
  console.log("🚀 Start voteConsult handler");
  try {
    const { id } = JSON.parse(event.body);
    console.log("📥 Otrzymane ID konsultacji do głosowania:", id);
    if (!id) throw new Error("Brak ID konsultacji");

    // Pobierz IP klienta
    const ip = event.headers['x-forwarded-for']?.split(',')[0].trim() 
            || event.headers['client-ip'] 
            || 'unknown';
    console.log("🌐 IP klienta:", ip);

    // Sprawdzenie czy IP już głosowało
    const existingVotes = await sqlVote`
      SELECT * FROM votes WHERE consultation_id = ${id} AND ip_address = ${ip}
    `;
    console.log(`🔍 Liczba znalezionych głosów z tego IP dla konsultacji ${id}:`, existingVotes.length);

    if (existingVotes.length > 0) {
      console.warn("⚠️ Głos z tego IP już oddany, odrzucam");
      return {
        statusCode: 403,
  body: JSON.stringify({ error: "Głosowanie na tę konsultację możliwe jest tylko raz." })
      };
    }

    // Dodanie nowego głosu
    console.log("📝 Dodaję głos do tabeli votes");
    await sqlVote`
      INSERT INTO votes (consultation_id, ip_address) VALUES (${id}, ${ip})
    `;

    // Aktualizacja liczby głosów w konsultacjach
    console.log("⬆️ Aktualizuję liczbę głosów w tabeli consultations");
    await sqlVote`
      UPDATE consultations SET votes = votes + 1 WHERE id = ${id}
    `;

    console.log("✅ Głos oddany pomyślnie");
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    console.error("🔥 Błąd w voteConsult.js:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
