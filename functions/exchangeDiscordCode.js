// functions/exchangeDiscordCode.js

const fetch = require('node-fetch');

exports.handler = async function(event) {
  console.log('[exchangeDiscordCode] Odebrano żądanie');

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { code } = JSON.parse(event.body);
    if (!code) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Brak kodu' }) };
    }

    // Dane aplikacji - podmień na swoje z Discord Developer Portal
    const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
    const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
    const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI; // musi zgadzać się z tym w panelu Discord i w frontendzie

    // Wymiana code na token
    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', REDIRECT_URI);
    params.append('scope', 'identify');

    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('[exchangeDiscordCode] Błąd wymiany tokena:', err);
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Błąd wymiany tokena' }) };
    }

    const tokenData = await tokenRes.json();
    console.log('[exchangeDiscordCode] Token data:', tokenData);

    // Pobierz dane użytkownika
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `${tokenData.token_type} ${tokenData.access_token}` }
    });

    if (!userRes.ok) {
      const err = await userRes.text();
      console.error('[exchangeDiscordCode] Błąd pobierania użytkownika:', err);
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Błąd pobierania użytkownika' }) };
    }

    const userData = await userRes.json();
    console.log('[exchangeDiscordCode] Dane użytkownika:', userData);

    // Tu możesz zrobić sprawdzenie, czy użytkownik jest adminem np. po ID lub tagu
    const allowedAdmins = ['TwójDiscordID1', 'TwójDiscordID2']; // podmień
    if (!allowedAdmins.includes(userData.id)) {
      return { statusCode: 403, body: JSON.stringify({ success: false, error: 'Brak dostępu' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, user: userData })
    };

  } catch (e) {
    console.error('[exchangeDiscordCode] Exception:', e);
    return { statusCode: 500, body: JSON.stringify({ success: false, error: 'Błąd serwera' }) };
  }
};
