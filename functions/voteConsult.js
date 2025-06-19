const { neon: neonVote } = require('@neondatabase/serverless');
const sqlVote = neonVote(process.env.NETLIFY_DATABASE_URL);

exports.handler = async (event) => {
  try {
const { id } = JSON.parse(event.body);
if (!id) throw new Error("Brak ID");

await sqlVote`UPDATE consultations SET votes = votes + 1 WHERE id = ${id}`;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
  console.error("Błąd zapisu:", err, "voteConsult.js"); // <-- dodaj to
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
