const allowedAdmins = ['123456789012345678', '987654321098765432']; // Discord IDs adminów (zmień!)

let requests = [
  { id: 1, user: 'User1', message: 'Chcę dostęp do panelu', status: 'new' },
  { id: 2, user: 'User2', message: 'Problem z logowaniem', status: 'new' },
];

// Prostą autoryzację robimy na podstawie headera Authorization: Bearer <discordId>
exports.handler = async (event) => {
  const authHeader = event.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token || !allowedAdmins.includes(token)) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Brak dostępu - nie jesteś adminem!' }),
    };
  }

  if (event.httpMethod === 'GET') {
    // Pobierz wszystkie wnioski
    return {
      statusCode: 200,
      body: JSON.stringify({ requests }),
    };
  }

  if (event.httpMethod === 'POST') {
    try {
      const { id, status } = JSON.parse(event.body);
      const request = requests.find(r => r.id === id);
      if (!request) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Nie znaleziono wniosku' }),
        };
      }
      if (!['new', 'in_progress', 'done'].includes(status)) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Niepoprawny status' }),
        };
      }
      request.status = status;
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, request }),
      };
    } catch (e) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Błędne dane' }),
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Metoda niedozwolona' }),
  };
};
