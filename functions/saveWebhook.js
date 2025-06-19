let webhookUrlCache = null; // To samo miejsce na cache (uwaga: stan nie utrzyma się między wywołaniami w serverless!)

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

  webhookUrlCache = body.url;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true }),
  };
};
