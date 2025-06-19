const { neon: neonVote } = require('@neondatabase/serverless');
const sqlVote = neonVote(process.env.NETLIFY_DATABASE_URL);

exports.handler = async (event) => {
  try {
    const { id } = JSON.parse(event.body);
    await sqlVote`UPDATE consultations SET votes = votes + 1 WHERE id = ${id}`;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
