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

    // Przygotuj parametry do wymiany kodu na token
    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', REDIRECT_URI);
    params.append('scope', 'identify');

    console.info('[exchangeDiscordCode] Wysyłanie żądania do Discorda o token...');
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[exchangeDiscordCode] Błąd wymiany tokena, status:', tokenResponse.status);
      console.error('[exchangeDiscordCode] Szczegóły błędu:', errorText);
      return {
        statusCode: tokenResponse.status,
        body: JSON.stringify({ error: 'Błąd wymiany tokena z Discordem.', details: errorText }),
      };
    }

    const tokenData = await tokenResponse.json();
    console.info('[exchangeDiscordCode] Token OAuth otrzymany pomyślnie:', tokenData);

    // Pobierz dane użytkownika z Discorda
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `${tokenData.token_type} ${tokenData.access_token}` }
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('[exchangeDiscordCode] Błąd pobierania danych użytkownika:', errorText);
      return {
        statusCode: userResponse.status,
        body: JSON.stringify({ error: 'Błąd pobierania danych użytkownika z Discorda.', details: errorText }),
      };
    }

    const user = await userResponse.json();
    console.info('[exchangeDiscordCode] Dane użytkownika pobrane:', user);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        user,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        scope: tokenData.scope,
        token_type: tokenData.token_type,
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
