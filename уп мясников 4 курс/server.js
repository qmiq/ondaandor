// Запускает статический сайт и небольшой API бронирований на встроенных средствах Node.js.
// Внешние библиотеки и установка npm-пакетов не требуются.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, '.local-data');
const DATA_FILE = path.join(DATA_DIR, 'bookings.json');
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

// Возвращает записи бронирований либо пустой список при первом запуске.
function readBookings() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

// Отправляет клиенту JSON с единообразным кодом состояния.
function sendJSON(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

// Читает JSON-тело запроса и ограничивает его размер одним мегабайтом.
function readJSON(request) {
  return new Promise((resolve, reject) => {
    let raw = '';
    request.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) reject(new Error('BODY_TOO_LARGE'));
    });
    request.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('INVALID_JSON'));
      }
    });
    request.on('error', reject);
  });
}

// Проверяет, что дата существует в календаре и не прошла.
function isFutureCalendarDate(value) {
  const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!dateParts) return false;

  const calendarDate = new Date(Date.UTC(
    Number(dateParts[1]),
    Number(dateParts[2]) - 1,
    Number(dateParts[3]),
  ));
  if (calendarDate.toISOString().slice(0, 10) !== value) return false;
  return value >= new Date().toISOString().slice(0, 10);
}

// Проверяет формат контактных данных, дату календаря, время, число гостей и выбранную игру.
function isValidBookingData(data, games) {
  const people = Number(data.people);
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email || ''));
  const timeIsValid = ['12:00', '14:00', '16:00', '18:00', '20:00'].includes(String(data.time || ''));

  return String(data.name || '').trim().length >= 2
    && /^\+?[0-9\s\-()]{10,18}$/.test(String(data.phone || '').trim())
    && emailIsValid && isFutureCalendarDate(data.date) && timeIsValid
    && Number.isInteger(people) && people >= 1 && people <= 12
    && games.some((game) => game.id === data.gameId);
}

// Создаёт номер, идентификатор и поля новой брони для сохранения в JSON-хранилище.
function createBookingRecord(data, existingBookings) {
  let number;
  do {
    number = `B-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  } while (existingBookings.some((item) => item.number === number));

  return {
    id: crypto.randomUUID(),
    number,
    name: String(data.name).trim(),
    phone: String(data.phone).trim(),
    email: String(data.email).trim().toLowerCase(),
    date: data.date,
    time: data.time,
    people: Number(data.people),
    gameId: data.gameId,
    comment: String(data.comment || '').trim(),
    status: 'new',
    createdAt: new Date().toISOString(),
  };
}

// Обрабатывает REST-маршруты API клуба.
async function handleAPI(request, response, url) {
  if (request.method === 'GET' && url.pathname === '/api/health') {
    return sendJSON(response, 200, { status: 'ok', service: 'board-game-club-api' });
  }

  if (request.method === 'GET' && url.pathname === '/api/games') {
    const games = JSON.parse(fs.readFileSync(path.join(ROOT, 'games.json'), 'utf8'));
    return sendJSON(response, 200, games);
  }

  if (request.method === 'POST' && url.pathname === '/api/bookings') {
    let data;
    try {
      data = await readJSON(request);
    } catch (error) {
      return sendJSON(response, 400, { error: error.message === 'BODY_TOO_LARGE' ? 'Слишком большой запрос.' : 'Некорректный JSON.' });
    }

    const games = JSON.parse(fs.readFileSync(path.join(ROOT, 'games.json'), 'utf8'));
    if (!isValidBookingData(data, games)) {
      return sendJSON(response, 400, { error: 'Проверьте обязательные поля бронирования.' });
    }

    const bookings = readBookings();
    const booking = createBookingRecord(data, bookings);
    bookings.push(booking);
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, `${JSON.stringify(bookings, null, 2)}\n`, 'utf8');
    return sendJSON(response, 201, booking);
  }

  return sendJSON(response, 404, { error: 'Маршрут API не найден.' });
}

// Безопасно отдает статические файлы только из папки проекта.
function handleStatic(request, response, url) {
  const requested = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  if (requested.split('/').some((part) => part.startsWith('.'))) {
    response.writeHead(404).end('File not found');
    return;
  }
  const filePath = path.resolve(ROOT, `.${requested}`);
  if (!filePath.startsWith(`${ROOT}${path.sep}`)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500).end('File not found');
      return;
    }
    response.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(filePath)] || 'application/octet-stream' });
    response.end(content);
  });
}

// Записывает метод, путь и код ответа в журнал для отладки запросов.
const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  response.on('finish', () => console.info(`${request.method} ${url.pathname} → ${response.statusCode}`));
  if (url.pathname.startsWith('/api/')) {
    handleAPI(request, response, url).catch((error) => {
      console.error(`Ошибка API ${url.pathname}: ${error.message}`);
      if (!response.headersSent) sendJSON(response, 500, { error: 'Внутренняя ошибка сервера.' });
    });
    return;
  }
  handleStatic(request, response, url);
});

server.listen(PORT, HOST, () => console.info(`Клуб настольных игр: http://localhost:${PORT}`));
