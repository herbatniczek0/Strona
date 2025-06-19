const fetch = require('node-fetch'); // Jeśli jest problem, możesz spróbować użyć global.fetch lub innego fetcha

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Metoda nieobsługiwana' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Nieprawidłowe dane' };
  }

  if (!body.url) {
    return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Brak URL webhooka' }) };
  }

  try {
    const res = await fetch(body.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Test webhooka z panelu admina' }),
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, error: 'Webhook zwrócił błąd: ' + text }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Błąd wysyłki webhooka' }),
    };
  }
};
