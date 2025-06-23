const fetch = require('node-fetch'); // jeśli używasz Node <18

exports.handler = async (event) => {
  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Webhook URL not configured' }),
      };
    }

    const data = JSON.parse(event.body);
    const payload = {
      embeds: [
        {
          title: 'Nowy wniosek',
          color: 5814783,
          fields: [
            { name: 'ID', value: data.id },
            { name: 'Imię i nazwisko', value: data.name },
            { name: 'Discord', value: data.discord },
            { name: 'Data', value: data.date },
            { name: 'Pomysł', value: data.idea },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
