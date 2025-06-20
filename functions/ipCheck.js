const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.NETLIFY_DATABASE_URL);

exports.handler = async (event) => {
  const ip =
    event.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    event.headers["client-ip"] ||
    "unknown";

  try {
    const blocked = await sql`SELECT reason FROM blocked_ips WHERE ip = ${ip}`;
    if (blocked.length > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ blocked: true, reason: blocked[0].reason }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ blocked: false }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
