import {
  getBookings,
  getCurrentUser,
  getGames,
  getUsers,
  saveBookings,
  saveCurrentUser,
  saveUsers,
} from './db.js';
import { requireAuth } from './auth.js';
import { escapeHTML, logout, toast } from './ui.js';

const user = requireAuth();

if (user) {
  const authNotice = sessionStorage.getItem('authNotice');
  if (authNotice === 'admin') {
    sessionStorage.removeItem('authNotice');
    toast('Для этого раздела нужны права администратора.', 'error');
  }

  const nameInput = document.querySelector('#profile-name');
  const phoneInput = document.querySelector('#profile-phone');
  document.querySelector('#welcome').textContent =
    `Добро пожаловать в ONDA ANDOR SLEEP MODE, ${user.name}!`;
  nameInput.value = user.name || '';
  phoneInput.value = user.phone || '';

  // Показывает бронирования текущего пользователя по идентификатору и email.
  function renderBookings() {
    const bookings = getBookings()
      .filter((booking) => {
        const sameUser = booking.userId && booking.userId === user.id;
        const sameEmail = booking.email?.toLowerCase() === user.email.toLowerCase();
        return sameUser || sameEmail;
      })
      .sort((first, second) => `${second.date}${second.time}`.localeCompare(`${first.date}${first.time}`));
    const mount = document.querySelector('#my-bookings');

    if (bookings.length === 0) {
      mount.innerHTML = `
        <div class="empty-state">
          У вас пока нет бронирований.
          <a href="booking.html">Забронировать стол →</a>
        </div>
      `;
      return;
    }

    mount.innerHTML = bookings
      .map((booking) => {
        const game = getGames().find((item) => item.id === booking.gameId);
        const statusLabels = {
          new: 'Новая',
          confirmed: 'Подтверждена',
          cancelled: 'Отменена',
        };

        return `
          <article class="booking-item">
            <div>
              <strong>${escapeHTML(booking.number || 'Бронь')}</strong>
              <div class="muted">
                ${escapeHTML(booking.date)} · ${escapeHTML(booking.time)} ·
                ${booking.people} гостей · ${escapeHTML(game?.title || 'Игра удалена')}
              </div>
            </div>
            <div>
              <span class="badge badge-${escapeHTML(booking.status)}">
                ${statusLabels[booking.status] || escapeHTML(booking.status)}
              </span>
              ${
                booking.status !== 'cancelled'
                  ? `<button class="button button-ghost button-small" type="button" data-cancel="${escapeHTML(booking.id)}">Отменить бронь</button>`
                  : ''
              }
            </div>
          </article>
        `;
      })
      .join('');

    mount.querySelectorAll('[data-cancel]').forEach((button) => {
      button.addEventListener('click', () => cancelBooking(button.dataset.cancel));
    });
  }

  // Меняет статус выбранного бронирования на отменённый.
  function cancelBooking(bookingId) {
    const booking = getBookings().find((item) => item.id === bookingId);
    if (!booking || booking.status === 'cancelled') return;

    saveBookings(
      getBookings().map((item) =>
        item.id === bookingId ? { ...item, status: 'cancelled' } : item,
      ),
    );
    toast('Бронирование отменено.');
    renderBookings();
  }

  // Сохраняет изменения имени и телефона профиля.
  document.querySelector('#profile-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();

    if (name.length < 2) {
      toast('Имя должно содержать не менее двух символов.', 'error');
      nameInput.focus();
      return;
    }

    const phone = phoneInput.value.trim();
    const users = getUsers().map((item) =>
      item.id === user.id ? { ...item, name, phone } : item,
    );
    const updatedUser = { ...user, name, phone };

    saveUsers(users);
    saveCurrentUser(updatedUser);
    document.querySelector('#welcome').textContent =
      `Добро пожаловать в ONDA ANDOR SLEEP MODE, ${name}!`;
    toast('Данные профиля сохранены.');
  });

  document.querySelector('[data-profile-logout]').addEventListener('click', logout);
  renderBookings();
}
