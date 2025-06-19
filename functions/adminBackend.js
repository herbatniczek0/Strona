const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.NETLIFY_DATABASE_URL);

exports.handler = async (event) => {
  console.info('[adminBackend] Odebrano żądanie:', event.httpMethod, event.queryStringParameters?.route);

  const route = event.queryStringParameters?.route;
  const method = event.httpMethod;

  try {
    if (method === 'GET') {
      switch (route) {
        case 'submissions':
          console.info('[adminBackend] Pobieranie wniosków...');
          const submissions = await sql`SELECT * FROM submissions ORDER BY date DESC LIMIT 50`;
          console.info(`[adminBackend] Znaleziono ${submissions.length} wniosków`);
          return { statusCode: 200, body: JSON.stringify(submissions) };

        case 'consultations':
          console.info('[adminBackend] Pobieranie konsultacji...');
          const consults = await sql`SELECT * FROM consultations ORDER BY id DESC`;
          console.info(`[adminBackend] Znaleziono ${consults.length} konsultacji`);
          return { statusCode: 200, body: JSON.stringify(consults) };

        case 'admins':
          console.info('[adminBackend] Pobieranie administratorów...');
          const admins = await sql`SELECT id, username, discord_id, created_at FROM administratorzy ORDER BY created_at DESC`;
          console.info(`[adminBackend] Znaleziono ${admins.length} administratorów`);
          return { statusCode: 200, body: JSON.stringify(admins) };

        case 'logs':
          console.info('[adminBackend] Pobieranie logów...');
          const logs = await sql`SELECT * FROM logs ORDER BY timestamp DESC LIMIT 100`;
          console.info(`[adminBackend] Znaleziono ${logs.length} logów`);
          return { statusCode: 200, body: JSON.stringify(logs) };

        default:
          console.warn('[adminBackend] Nieznany endpoint GET:', route);
          return { statusCode: 400, body: JSON.stringify({ error: 'Nieznana trasa zapytania GET.' }) };
      }
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      console.info('[adminBackend] Odczytano dane POST:', body);

      switch (route) {
        case 'updateSubmission': {
          console.info(`[adminBackend] Aktualizacja statusu ID=${body.id} -> ${body.status}`);
          await sql`UPDATE submissions SET status = ${body.status} WHERE id = ${body.id}`;
          console.info('[adminBackend] Status zaktualizowany.');
          return { statusCode: 200, body: JSON.stringify({ success: true }) };
        }

        case 'addAdmin': {
          console.info(`[adminBackend] Dodawanie administratora: ${body.username} (${body.discord_id})`);
          await sql`INSERT INTO administratorzy (username, discord_id) VALUES (${body.username}, ${body.discord_id})`;
          console.info('[adminBackend] Administrator dodany.');
          return { statusCode: 200, body: JSON.stringify({ success: true }) };
        }

        case 'deleteAdmin': {
          console.info(`[adminBackend] Usuwanie administratora ID=${body.id}`);
          await sql`DELETE FROM administratorzy WHERE id = ${body.id}`;
          console.info('[adminBackend] Administrator usunięty.');
          return { statusCode: 200, body: JSON.stringify({ success: true }) };
        }

        case 'saveWebhook': {
          console.info(`[adminBackend] Zapisywanie webhooka: ${body.url}`);
          await sql`INSERT INTO settings (key, value) VALUES ('webhook', ${body.url}) ON CONFLICT (key) DO UPDATE SET value = ${body.url}`;
          console.info('[adminBackend] Webhook zapisany.');
          return { statusCode: 200, body: JSON.stringify({ success: true }) };
        }

        default:
          console.warn('[adminBackend] Nieznany endpoint POST:', route);
          return { statusCode: 400, body: JSON.stringify({ error: 'Nieznana trasa zapytania POST.' }) };
      }
    }

    console.warn('[adminBackend] Nieobsługiwana metoda HTTP:', method);
    return { statusCode: 405, body: JSON.stringify({ error: 'Nieobsługiwana metoda HTTP.' }) };
  } catch (err) {
    console.error('[adminBackend] Wystąpił błąd:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Błąd serwera' }) };
  }
};
