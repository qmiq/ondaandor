import {
  addGame,
  deleteBooking,
  deleteGame,
  deleteUser,
  getBookings,
  getGames,
  getUsers,
  saveBookings,
  saveGames,
  saveUsers,
  updateBooking,
} from './db.js';
import { requireAdmin } from './auth.js';
import { createId, escapeHTML, toast } from './ui.js';

const admin = requireAdmin();

if (admin) {
  const gameForm = document.querySelector('#game-form');
  const gameRows = document.querySelector('#games-table');
  const bookingRows = document.querySelector('#bookings-table');
  const userRows = document.querySelector('#users-table');

  // Формирует безопасную строку таблицы для каждой игры.
  function renderGames() {
    const games = getGames();
    document.querySelector('#stat-games').textContent = games.length;

    gameRows.innerHTML = games.length
      ? games.map((game) => `
          <tr>
            <td>${escapeHTML(game.emoji)} ${escapeHTML(game.title)}</td>
            <td>${escapeHTML(game.genre)}</td>
            <td>${game.playersMin}–${game.playersMax}</td>
            <td>${game.age}+</td>
            <td>${game.price} ₽</td>
            <td>
              <div class="table-actions">
                <button class="button button-ghost button-small" type="button" data-edit-game="${escapeHTML(game.id)}">Изменить</button>
                <button class="button button-small" type="button" data-delete-game="${escapeHTML(game.id)}">Удалить</button>
              </div>
            </td>
          </tr>
        `).join('')
      : '<tr><td colspan="6">Игр пока нет.</td></tr>';

    gameRows.querySelectorAll('[data-edit-game]').forEach((button) => {
      button.addEventListener('click', () => fillGameForm(button.dataset.editGame));
    });
    gameRows.querySelectorAll('[data-delete-game]').forEach((button) => {
      button.addEventListener('click', () => removeGame(button.dataset.deleteGame));
    });
  }

  // Загружает выбранную игру в форму редактирования.
  function fillGameForm(gameId) {
    const game = getGames().find((item) => item.id === gameId);
    if (!game) return;

    for (const fieldName of [
      'id', 'title', 'genre', 'playersMin', 'playersMax', 'age', 'price', 'emoji', 'gradient', 'description',
    ]) {
      gameForm.elements[fieldName].value = game[fieldName] ?? '';
    }

    document.querySelector('#game-form-title').textContent = 'Редактировать игру';
    document.querySelector('#game-cancel').classList.remove('is-hidden');
    gameForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Удаляет игру после подтверждения.
  function removeGame(gameId) {
    if (!window.confirm('Удалить эту игру из каталога?')) return;

    deleteGame(gameId);
    renderAll();
    toast('Игра удалена.');
  }

  // Показывает все бронирования и позволяет обновлять их статус.
  function renderBookings() {
    const bookings = getBookings();
    const games = getGames();
    document.querySelector('#stat-bookings').textContent = bookings.length;

    bookingRows.innerHTML = bookings.length
      ? bookings.map((booking) => {
          const game = games.find((item) => item.id === booking.gameId);

          return `
            <tr>
              <td>${escapeHTML(booking.number)}</td>
              <td>${escapeHTML(booking.name)}<br><span class="muted">${escapeHTML(booking.email)}</span></td>
              <td>${escapeHTML(booking.date)} · ${escapeHTML(booking.time)}</td>
              <td>${booking.people}</td>
              <td>${escapeHTML(game?.title || '—')}</td>
              <td>
                <div class="admin-inline">
                  <select aria-label="Статус брони ${escapeHTML(booking.number)}" data-booking-status="${escapeHTML(booking.id)}">
                    <option value="new" ${booking.status === 'new' ? 'selected' : ''}>Новая</option>
                    <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>Подтверждена</option>
                    <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>Отменена</option>
                  </select>
                </div>
              </td>
              <td>
                <button class="button button-small" type="button" data-delete-booking="${escapeHTML(booking.id)}">Удалить</button>
              </td>
            </tr>
          `;
        }).join('')
      : '<tr><td colspan="7">Бронирований пока нет.</td></tr>';

    bookingRows.querySelectorAll('[data-booking-status]').forEach((select) => {
      select.addEventListener('change', () => {
        const booking = bookings.find((item) => item.id === select.dataset.bookingStatus);
        if (!booking) return;

        updateBooking({ ...booking, status: select.value });
        toast('Статус бронирования обновлён.');
      });
    });
    bookingRows.querySelectorAll('[data-delete-booking]').forEach((button) => {
      button.addEventListener('click', () => removeBooking(button.dataset.deleteBooking));
    });
  }

  // Удаляет бронирование после подтверждения.
  function removeBooking(bookingId) {
    if (!window.confirm('Удалить бронирование?')) return;

    deleteBooking(bookingId);
    renderAll();
    toast('Бронирование удалено.');
  }

  // Показывает список пользователей и управление ролями.
  function renderUsers() {
    const users = getUsers();
    document.querySelector('#stat-users').textContent = users.length;

    userRows.innerHTML = users.length
      ? users.map((user) => `
          <tr>
            <td>${escapeHTML(user.name)}</td>
            <td>${escapeHTML(user.email)}</td>
            <td>${escapeHTML(user.phone || '—')}</td>
            <td>
              <div class="admin-inline">
                <select aria-label="Роль ${escapeHTML(user.name)}" data-user-role="${escapeHTML(user.id)}" ${user.id === admin.id ? 'disabled' : ''}>
                  <option value="user" ${user.role === 'user' ? 'selected' : ''}>user</option>
                  <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>admin</option>
                </select>
              </div>
            </td>
            <td>
              ${user.id === admin.id
                ? '<span class="muted">Текущий аккаунт</span>'
                : `<button class="button button-small" type="button" data-delete-user="${escapeHTML(user.id)}">Удалить</button>`}
            </td>
          </tr>
        `).join('')
      : '<tr><td colspan="5">Пользователей пока нет.</td></tr>';

    userRows.querySelectorAll('[data-user-role]').forEach((select) => {
      select.addEventListener('change', () => changeUserRole(select.dataset.userRole, select.value));
    });
    userRows.querySelectorAll('[data-delete-user]').forEach((button) => {
      button.addEventListener('click', () => removeUser(button.dataset.deleteUser));
    });
  }

  // Обновляет роль пользователя и перерисовывает таблицу.
  function changeUserRole(userId, role) {
    const users = getUsers().map((user) =>
      user.id === userId ? { ...user, role } : user,
    );
    saveUsers(users);
    renderUsers();
    toast('Роль пользователя изменена.');
  }

  // Не позволяет удалить собственную учётную запись администратора.
  function removeUser(userId) {
    if (userId === admin.id) {
      toast('Нельзя удалить собственную учётную запись.', 'error');
      return;
    }

    if (!window.confirm('Удалить пользователя и его бронирования?')) return;

    deleteUser(userId);
    saveBookings(getBookings().filter((booking) => booking.userId !== userId));
    renderAll();
    toast('Пользователь удалён.');
  }

  // Перерисовывает статистику и таблицы админ-панели.
  function renderAll() {
    renderGames();
    renderBookings();
    renderUsers();
  }

  // Проверяет форму игры и сохраняет новую запись либо изменения.
  gameForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(gameForm));
    const playersMin = Number(data.playersMin);
    const playersMax = Number(data.playersMax);
    const price = Number(data.price);
    const age = Number(data.age);

    if (playersMin < 1 || playersMax < playersMin || playersMax > 20) {
      toast('Проверьте диапазон количества игроков.', 'error');
      return;
    }

    if (price < 0 || age < 0 || !isSafeGradient(data.gradient)) {
      toast('Проверьте цену, возраст и формат градиента.', 'error');
      return;
    }

    const game = {
      id: data.id || createId('game'),
      title: data.title.trim(),
      genre: data.genre.trim(),
      playersMin,
      playersMax,
      age,
      price,
      emoji: data.emoji.trim() || '🎲',
      gradient: data.gradient.trim(),
      description: data.description.trim(),
    };

    if (data.id) {
      saveGames(getGames().map((item) => (item.id === data.id ? game : item)));
    } else {
      addGame(game);
    }

    resetGameForm();
    renderAll();
    toast('Игра сохранена.');
  });

  // Разрешает только безопасный CSS-градиент для изображения-заглушки.
  function isSafeGradient(value) {
    return /^linear-gradient\([\w\s#%,.()-]+\)$/i.test(value.trim());
  }

  // Очищает поля и возвращает форму к добавлению новой игры.
  function resetGameForm() {
    gameForm.reset();
    gameForm.elements.id.value = '';
    document.querySelector('#game-form-title').textContent = 'Добавить игру';
    document.querySelector('#game-cancel').classList.add('is-hidden');
  }

  document.querySelector('#game-cancel').addEventListener('click', resetGameForm);

  // Переключает вкладку и синхронизирует ARIA-состояния.
  document.querySelectorAll('.admin-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach((item) => {
        const isActive = item === tab;
        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-selected', String(isActive));
      });

      document.querySelectorAll('.admin-panel').forEach((panel) => {
        panel.classList.toggle('is-active', panel.id === `panel-${tab.dataset.tab}`);
      });
    });
  });

  renderAll();
}
