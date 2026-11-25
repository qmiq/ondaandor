import { addBooking, getBookings, getCurrentUser, getGames } from './db.js';
import { createId, escapeHTML, getTodayISO, toast } from './ui.js';

const form = document.querySelector('#booking-form');
const user = getCurrentUser();
const gameSelect = form.elements.game;
const requiredFields = ['name', 'phone', 'email', 'date', 'time', 'people', 'game'];

// Заполняет список игр и выбирает игру из параметра адреса.
function populateGames() {
  getGames().forEach((game) => {
    gameSelect.add(new Option(`${game.title} — ${game.price} ₽`, game.id));
  });

  const requestedGame = new URLSearchParams(location.search).get('game');
  if (getGames().some((game) => game.id === requestedGame)) gameSelect.value = requestedGame;
}

// Подставляет имя и email из учётной записи активного пользователя.
function autofillUser() {
  if (!user) return;

  form.elements.name.value = user.name || '';
  form.elements.email.value = user.email || '';
  form.elements.phone.value = user.phone || '';
}

// Показывает ошибку рядом с полем и отмечает его как неверно заполненное.
function showFieldError(fieldName, message) {
  const field = form.elements[fieldName];
  const error = document.querySelector(`#${fieldName}-error`);
  field.setAttribute('aria-invalid', 'true');
  error.textContent = message;
}

// Убирает визуальную ошибку после исправления значения поля.
function clearFieldError(fieldName) {
  const field = form.elements[fieldName];
  const error = document.querySelector(`#${fieldName}-error`);
  field.removeAttribute('aria-invalid');
  error.textContent = '';
}

// Проверяет обязательные поля и форматы данных бронирования.
function validateBooking(data) {
  let isValid = true;
  requiredFields.forEach(clearFieldError);

  if (data.name.trim().length < 2) {
    showFieldError('name', 'Введите имя длиной не менее двух символов.');
    isValid = false;
  }

  if (!/^\+?[0-9\s\-()]{10,18}$/.test(data.phone.trim())) {
    showFieldError('phone', 'Проверьте формат телефона.');
    isValid = false;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    showFieldError('email', 'Введите корректный email.');
    isValid = false;
  }

  if (!data.date || data.date < getTodayISO()) {
    showFieldError('date', 'Выберите сегодняшнюю дату или более позднюю.');
    isValid = false;
  }

  if (!data.time) {
    showFieldError('time', 'Выберите время бронирования.');
    isValid = false;
  }

  const guestCount = Number(data.people);
  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 12) {
    showFieldError('people', 'Количество гостей должно быть от 1 до 12.');
    isValid = false;
  }

  if (!data.game || !getGames().some((game) => game.id === data.game)) {
    showFieldError('game', 'Выберите игру из списка.');
    isValid = false;
  }

  return isValid;
}

// Создаёт свободный номер брони и добавляет запись в LocalStorage.
async function saveBooking(data) {
  // При запуске через server.js отправляет бронь серверу; Live Server сохраняет её локально.
  if (location.port === '3000') {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        gameId: data.game,
        people: Number(data.people),
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Не удалось создать бронирование.');
    return result.number;
  }

  const bookings = getBookings();
  let number;

  do {
    number = `B-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  } while (bookings.some((booking) => booking.number === number));

  addBooking({
    id: createId('booking'),
    number,
    userId: user?.id || null,
    name: data.name.trim(),
    phone: data.phone.trim(),
    email: data.email.trim().toLowerCase(),
    date: data.date,
    time: data.time,
    people: Number(data.people),
    gameId: data.game,
    comment: data.comment.trim(),
    status: 'new',
    createdAt: new Date().toISOString(),
  });

  return number;
}

// Показывает подтверждение брони и ссылку на список личных броней.
function showSuccess(number) {
  document.querySelector('#booking-result').innerHTML = `
    <div class="panel" role="status">
      <h2>Спасибо! Бронь №${escapeHTML(number)} создана.</h2>
      <a class="button button-accent" href="profile.html">Мои брони →</a>
    </div>
  `;
}

document.querySelector('#date').min = getTodayISO();
populateGames();
autofillUser();

requiredFields.forEach((fieldName) => {
  form.elements[fieldName].addEventListener('input', () => clearFieldError(fieldName));
  form.elements[fieldName].addEventListener('change', () => clearFieldError(fieldName));
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));

  if (!validateBooking(data)) {
    toast('Проверьте поля, отмеченные красным.', 'error');
    return;
  }

  try {
    const bookingNumber = await saveBooking(data);
    form.reset();
    document.querySelector('#date').min = getTodayISO();
    autofillUser();
    toast(`Бронь ${bookingNumber} успешно создана.`);
    showSuccess(bookingNumber);
  } catch (error) {
    toast(error.message, 'error');
  }
});
