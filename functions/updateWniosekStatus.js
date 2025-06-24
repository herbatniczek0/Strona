const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.NETLIFY_DB_URL);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { id, status } = JSON.parse(event.body);
    console.log("[updateWniosekStatus] Dane otrzymane:", { id, status });

    if (!id || !status) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Brak wymaganych danych' })
      };
    }

    await sql`UPDATE wnioski SET status = ${status} WHERE id = ${id}`;
    console.log(`[updateWniosekStatus] Zaktualizowano status wniosku ${id} na ${status}`);

    // Jesli zaakceptowany, dodajemy uzytkownika
    if (status === 'zaakceptowano') {
      const { rows } = await sql`SELECT * FROM wnioski WHERE id = ${id}`;
      const wniosek = rows[0];
      await sql`
        INSERT INTO users (name, discord, gang, uid)
        VALUES (${wniosek.name}, ${wniosek.discord}, ${wniosek.gang}, ${wniosek.uid})
        ON CONFLICT (uid) DO NOTHING;
      `;
      console.log(`[updateWniosekStatus] Użytkownik dodany do users: ${wniosek.uid}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error("[updateWniosekStatus] Błąd:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Błąd aktualizacji statusu' })
    };
  }
};
