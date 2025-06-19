let webhookUrlCache = null; // Możesz później przenieść do bazy

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Metoda nieobsługiwana' };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrlCache }),
  };
};
