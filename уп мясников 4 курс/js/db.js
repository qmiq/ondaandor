// Хранилище ONDA ANDOR SLEEP MODE на базе LocalStorage.
const STORAGE_KEYS = {
  users: 'users',
  games: 'games',
  bookings: 'bookings',
  currentUser: 'currentUser',
  seeded: 'seeded',
};

const INITIAL_GAMES = [
  {
    id: 'game-1',
    title: 'Каркассон',
    genre: 'стратегия',
    playersMin: 2,
    playersMax: 5,
    age: 7,
    price: 350,
    emoji: '🏰',
    gradient: 'linear-gradient(135deg, #7B3F00, #D4A017)',
    description: 'Классическая игра о выкладывании тайлов, городах и дорогах.',
  },
  {
    id: 'game-2',
    title: 'Колонизаторы',
    genre: 'стратегия',
    playersMin: 3,
    playersMax: 4,
    age: 10,
    price: 500,
    emoji: '🏝️',
    gradient: 'linear-gradient(135deg, #28615a, #D4A017)',
    description: 'Осваивайте остров, собирайте ресурсы и развивайте поселения.',
  },
  {
    id: 'game-3',
    title: 'Ticket to Ride',
    genre: 'стратегия',
    playersMin: 2,
    playersMax: 5,
    age: 8,
    price: 550,
    emoji: '🚂',
    gradient: 'linear-gradient(135deg, #244c70, #D4A017)',
    description: 'Прокладывайте железные дороги и соединяйте города.',
  },
  {
    id: 'game-4',
    title: 'Шахматы',
    genre: 'классика',
    playersMin: 2,
    playersMax: 2,
    age: 6,
    price: 200,
    emoji: '♟️',
    gradient: 'linear-gradient(135deg, #34312c, #88806d)',
    description: 'Классическая дуэль, где каждый ход меняет ход партии.',
  },
  {
    id: 'game-5',
    title: 'Монополия',
    genre: 'семейная',
    playersMin: 2,
    playersMax: 6,
    age: 8,
    price: 450,
    emoji: '🎩',
    gradient: 'linear-gradient(135deg, #6d2b25, #D4A017)',
    description: 'Покупайте улицы, стройте отели и управляйте империей.',
  },
  {
    id: 'game-6',
    title: 'Азул',
    genre: 'семейная',
    playersMin: 2,
    playersMax: 4,
    age: 8,
    price: 420,
    emoji: '🔷',
    gradient: 'linear-gradient(135deg, #15517a, #60a8b5)',
    description: 'Составляйте красочные узоры из плиток и планируйте каждый ход.',
  },
  {
    id: 'game-7',
    title: 'Диксит',
    genre: 'кооперативная',
    playersMin: 3,
    playersMax: 8,
    age: 8,
    price: 400,
    emoji: '🎨',
    gradient: 'linear-gradient(135deg, #714c74, #D4A017)',
    description: 'Рассказывайте загадочные истории с помощью иллюстраций.',
  },
  {
    id: 'game-8',
    title: 'Манчкин',
    genre: 'карточная',
    playersMin: 3,
    playersMax: 6,
    age: 10,
    price: 300,
    emoji: '🗡️',
    gradient: 'linear-gradient(135deg, #702a27, #a66a32)',
    description: 'Побеждайте монстров, собирайте сокровища и прокачивайте героя.',
  },
  {
    id: 'game-9',
    title: 'Uno',
    genre: 'карточная',
    playersMin: 2,
    playersMax: 10,
    age: 6,
    price: 150,
    emoji: '🎴',
    gradient: 'linear-gradient(135deg, #a33a31, #3768a0)',
    description: 'Быстрая карточная игра для большой компании.',
  },
  {
    id: 'game-10',
    title: 'Бэнг!',
    genre: 'карточная',
    playersMin: 4,
    playersMax: 7,
    age: 10,
    price: 280,
    emoji: '🤠',
    gradient: 'linear-gradient(135deg, #7b3f00, #86402e)',
    description: 'Станьте шерифом или скрытым бандитом в карточном вестерне.',
  },
  {
    id: 'game-11',
    title: 'Эволюция',
    genre: 'карточная',
    playersMin: 2,
    playersMax: 4,
    age: 12,
    price: 320,
    emoji: '🦎',
    gradient: 'linear-gradient(135deg, #2e5633, #8a8d42)',
    description: 'Создавайте виды и помогайте им выживать в меняющейся среде.',
  },
  {
    id: 'game-12',
    title: 'Codenames',
    genre: 'кооперативная',
    playersMin: 2,
    playersMax: 8,
    age: 12,
    price: 380,
    emoji: '🕵️',
    gradient: 'linear-gradient(135deg, #343f5c, #9d3d35)',
    description: 'Давайте однословные подсказки и ищите секретных агентов.',
  },
  {
    id: 'game-13',
    title: 'Бункер',
    genre: 'социальная',
    playersMin: 4,
    playersMax: 16,
    age: 18,
    price: 600,
    emoji: '☢️',
    gradient: 'linear-gradient(135deg, #3b4030, #8b6139)',
    description: 'Докажите, что именно вы нужны для выживания после катастрофы.',
  },
  {
    id: 'game-14',
    title: 'Мафия',
    genre: 'социальная',
    playersMin: 6,
    playersMax: 20,
    age: 16,
    price: 250,
    emoji: '🕶️',
    gradient: 'linear-gradient(135deg, #29252c, #803f3b)',
    description: 'Раскройте тайны города в психологической командной игре.',
  },
  {
    id: 'game-15',
    title: 'Активити',
    genre: 'пати-гейм',
    playersMin: 4,
    playersMax: 16,
    age: 12,
    price: 350,
    emoji: '🎭',
    gradient: 'linear-gradient(135deg, #76502a, #ac4a39)',
    description: 'Объясняйте слова рисунком, пантомимой и другими способами.',
  },
  {
    id: 'game-16',
    title: 'Крокодил',
    genre: 'пати-гейм',
    playersMin: 4,
    playersMax: 12,
    age: 6,
    price: 200,
    emoji: '🐊',
    gradient: 'linear-gradient(135deg, #31583c, #8b8d39)',
    description: 'Показывайте слова жестами и угадывайте идеи команды.',
  },
  {
    id: 'game-17',
    title: 'Alias (Скажи иначе)',
    genre: 'пати-гейм',
    playersMin: 4,
    playersMax: 12,
    age: 12,
    price: 300,
    emoji: '💬',
    gradient: 'linear-gradient(135deg, #65508a, #bf7738)',
    description: 'Объясняйте слова своей команде на время.',
  },
  {
    id: 'game-18',
    title: 'Имаджинариум',
    genre: 'ассоциативная',
    playersMin: 4,
    playersMax: 7,
    age: 12,
    price: 450,
    emoji: '🖼️',
    gradient: 'linear-gradient(135deg, #514077, #bd754b)',
    description: 'Находите неожиданные ассоциации к необычным иллюстрациям.',
  },
];

// Читает и разбирает значение из LocalStorage с резервным значением.
function readStorage(key, fallback = []) {
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue === null ? fallback : JSON.parse(storedValue);
  } catch {
    return fallback;
  }
}

// Сохраняет сериализованные данные под выбранным ключом.
function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

// Создаёт исходные игры и администратора при первом открытии приложения.
export function initDB() {
  if (!localStorage.getItem(STORAGE_KEYS.seeded)) {
    writeStorage(STORAGE_KEYS.games, INITIAL_GAMES);
    writeStorage(STORAGE_KEYS.users, [
      {
        id: 'user-admin',
        name: 'Администратор',
        email: 'admin@club.ru',
        passwordHash: hashPassword('admin123'),
        role: 'admin',
        phone: '',
        createdAt: new Date().toISOString(),
      },
    ]);
    writeStorage(STORAGE_KEYS.bookings, []);
    localStorage.setItem(STORAGE_KEYS.seeded, 'true');
  }

  for (const key of [STORAGE_KEYS.users, STORAGE_KEYS.games, STORAGE_KEYS.bookings]) {
    if (localStorage.getItem(key) === null) writeStorage(key, []);
  }
}

// Хэширует пароль алгоритмом DJB2, чтобы не хранить его открытым текстом.
export function hashPassword(password) {
  let hash = 5381;

  for (const character of password) {
    hash = (Math.imul(hash, 33) ^ character.charCodeAt(0)) >>> 0;
  }

  return hash.toString(16);
}

export const getUsers = () => readStorage(STORAGE_KEYS.users);
export const getGames = () => readStorage(STORAGE_KEYS.games);
export const getBookings = () => readStorage(STORAGE_KEYS.bookings);
export const getCurrentUser = () => readStorage(STORAGE_KEYS.currentUser, null);

export const saveUsers = (users) => writeStorage(STORAGE_KEYS.users, users);
export const saveGames = (games) => writeStorage(STORAGE_KEYS.games, games);
export const saveBookings = (bookings) => writeStorage(STORAGE_KEYS.bookings, bookings);
export const saveCurrentUser = (user) => {
  if (user) writeStorage(STORAGE_KEYS.currentUser, user);
  else localStorage.removeItem(STORAGE_KEYS.currentUser);
};

export const addGame = (game) => saveGames([...getGames(), game]);
export const updateGame = (game) =>
  saveGames(getGames().map((item) => (item.id === game.id ? game : item)));
export const deleteGame = (id) => saveGames(getGames().filter((item) => item.id !== id));

export const addBooking = (booking) => saveBookings([...getBookings(), booking]);
export const updateBooking = (booking) =>
  saveBookings(getBookings().map((item) => (item.id === booking.id ? booking : item)));
export const deleteBooking = (id) => saveBookings(getBookings().filter((item) => item.id !== id));
export const deleteUser = (id) => saveUsers(getUsers().filter((item) => item.id !== id));

initDB();
