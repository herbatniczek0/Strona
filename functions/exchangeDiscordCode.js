const fetch = require('node-fetch');

exports.handler = async (event) => {
  console.info('[exchangeDiscordCode] Odebrano żądanie');

  if (event.httpMethod !== 'POST') {
    console.warn('[exchangeDiscordCode] Błędna metoda HTTP:', event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Metoda HTTP niedozwolona. Użyj POST.' }),
    };
  }

  try {
    const { code } = JSON.parse(event.body || '{}');
    console.info('[exchangeDiscordCode] Odczytano ciało żądania:', { code });

    if (!code) {
      console.error('[exchangeDiscordCode] Brak kodu autoryzacyjnego w żądaniu');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Brak kodu autoryzacyjnego (code).' }),
      };
    }

    const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
    const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
    const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;

    console.info('[exchangeDiscordCode] Sprawdzanie zmiennych środowiskowych...');
    console.info(`[exchangeDiscordCode] CLIENT_ID: ${CLIENT_ID ? 'OK' : 'BRAK'}`);
    console.info(`[exchangeDiscordCode] CLIENT_SECRET: ${CLIENT_SECRET ? 'OK' : 'BRAK'}`);
    console.info(`[exchangeDiscordCode] REDIRECT_URI: ${REDIRECT_URI ? 'OK' : 'BRAK'}`);

    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
      console.error('[exchangeDiscordCode] Brak wymaganych zmiennych środowiskowych!');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Brak wymaganych zmiennych środowiskowych na serwerze.' }),
      };
    }

    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', REDIRECT_URI);
    params.append('scope', 'identify');

    console.info('[exchangeDiscordCode] Wysyłanie żądania do Discorda o token...');
    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[exchangeDiscordCode] Błąd wymiany tokena, status:', response.status);
      console.error('[exchangeDiscordCode] Szczegóły błędu:', errorText);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Błąd wymiany tokena z Discordem.', details: errorText }),
      };
    }

    const data = await response.json();
    console.info('[exchangeDiscordCode] Token OAuth otrzymany pomyślnie:', data);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        scope: data.scope,
        token_type: data.token_type,
      }),
    };
  } catch (err) {
    console.error('[exchangeDiscordCode] Wystąpił nieoczekiwany błąd:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Błąd wewnętrzny serwera podczas wymiany tokena.' }),
    };
  }
};
