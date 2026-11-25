import { getCurrentUser } from './db.js';

const FOOTER_COPY = '© 2025 ONDA ANDOR SLEEP MODE — Играй. Думай. Побеждай.';

// Собирает ссылки в зависимости от статуса пользователя и текущей страницы.
function getNavigationLinks(user, page) {
  const links = [
    { href: 'index.html', label: 'Главная' },
    { href: 'catalog.html', label: 'Каталог' },
    { href: 'booking.html', label: 'Бронирование' },
  ];

  if (user) {
    links.push({ href: 'profile.html', label: 'Личный кабинет' });
    if (user.role === 'admin') links.push({ href: 'admin.html', label: 'Админ-панель' });
  } else {
    links.push(
      { href: 'login.html', label: 'Войти' },
      { href: 'register.html', label: 'Регистрация' },
    );
  }

  return links
    .map(({ href, label }) => {
      const activeClass = page === href ? ' active' : '';
      return `<a class="nav-link${activeClass}" href="${href}">${label}</a>`;
    })
    .join('');
}

// Отрисовывает одинаковую шапку сайта и настраивает мобильное меню.
export function renderHeader() {
  const mount = document.querySelector('[data-header]');
  if (!mount) return;

  const user = getCurrentUser();
  const page = location.pathname.split('/').pop() || 'index.html';
  const accountAction = user
    ? '<button class="nav-logout" type="button" data-logout>Выйти</button>'
    : '';

  mount.innerHTML = `
    <header class="site-header">
      <div class="header-inner">
        <a class="brand" href="index.html" aria-label="ONDA ANDOR SLEEP MODE — главная">
          <span class="brand-moon" aria-hidden="true">🌙</span>
          <span class="brand-name">
            <strong>ONDA ANDOR</strong>
            <small>SLEEP MODE</small>
          </span>
        </a>
        <button class="menu-toggle" type="button" aria-label="Открыть меню" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
        <div class="nav-overlay" data-close-menu></div>
        <nav class="main-nav" aria-label="Основная навигация">
          <div class="nav-links">${getNavigationLinks(user, page)}</div>
          ${accountAction}
        </nav>
      </div>
    </header>
  `;

  const menuButton = mount.querySelector('.menu-toggle');
  const navigation = mount.querySelector('.main-nav');
  const overlay = mount.querySelector('.nav-overlay');

  // Закрывает мобильную навигацию и возвращает кнопку в исходное состояние.
  function closeMenu() {
    navigation.classList.remove('is-open');
    overlay.classList.remove('is-visible');
    menuButton.setAttribute('aria-expanded', 'false');
  }

  menuButton.addEventListener('click', () => {
    const isOpen = navigation.classList.toggle('is-open');
    overlay.classList.toggle('is-visible', isOpen);
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });

  overlay.addEventListener('click', closeMenu);
  navigation.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  mount.querySelector('[data-logout]')?.addEventListener('click', logout);
}

// Отрисовывает подвал с переходами на разделы и декоративными соцсетями.
export function renderFooter() {
  const mount = document.querySelector('[data-footer]');
  if (!mount) return;

  const user = getCurrentUser();
  const links = [
    ['index.html', 'Главная'],
    ['catalog.html', 'Каталог'],
    ['booking.html', 'Бронирование'],
    ['profile.html', 'Личный кабинет'],
    ['login.html', 'Войти'],
    ['register.html', 'Регистрация'],
    ...(user?.role === 'admin' ? [['admin.html', 'Админ-панель']] : []),
  ];

  mount.innerHTML = `
    <footer class="site-footer">
      <div class="footer-main container">
        <div class="footer-brand">
          <strong>ONDA ANDOR</strong>
          <span>SLEEP MODE</span>
          <p>Играй. Думай. Побеждай.</p>
        </div>
        <div class="footer-navigation">
          <h2>Навигация</h2>
          ${links.map(([href, label]) => `<a href="${href}">${label}</a>`).join('')}
        </div>
        <div class="footer-social" aria-label="Социальные сети">
          <span title="Telegram">✈</span>
          <span title="ВКонтакте">ᴠκ</span>
          <span title="YouTube">▶</span>
        </div>
      </div>
      <div class="footer-copy">${FOOTER_COPY}</div>
    </footer>
  `;
}

// Показывает на главной странице плитки перехода ко всем важным разделам.
export function renderQuickLinks() {
  const mount = document.querySelector('[data-quicklinks]');
  if (!mount) return;

  const user = getCurrentUser();
  const cards = [
    ['catalog.html', '🎲', 'Каталог игр', 'Все 18 игр'],
    ['booking.html', '📅', 'Бронирование', 'Выбрать время и игру'],
    ['profile.html', '👤', 'Личный кабинет', 'Посмотреть мои брони'],
  ];

  if (user) {
    cards.push(['index.html', '↩️', 'Выйти', 'Завершить сеанс', 'logout']);
    if (user.role === 'admin') {
      cards.push(['admin.html', '🛠️', 'Админ-панель', 'Управление клубом']);
    }
  } else {
    cards.push(
      ['login.html', '🔐', 'Войти', 'Уже с нами?'],
      ['register.html', '📝', 'Регистрация', 'Новый игрок?'],
    );
  }

  mount.innerHTML = cards
    .map(([href, icon, title, description, action]) => `
      <a class="quick-card" href="${href}" ${action ? 'data-logout' : ''}>
        <span class="quick-icon" aria-hidden="true">${icon}</span>
        <strong>${title}</strong>
        <small>${description}</small>
        <span class="quick-arrow" aria-hidden="true">→</span>
      </a>
    `)
    .join('');

  mount.querySelectorAll('[data-logout]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      logout();
    });
  });
}

// Завершает сеанс и возвращает посетителя на главную.
export function logout() {
  localStorage.removeItem('currentUser');
  location.href = 'index.html';
}

// Показывает временное уведомление об успехе или ошибке.
export function toast(message, type = 'success') {
  let region = document.querySelector('.toast-region');

  if (!region) {
    region = document.createElement('div');
    region.className = 'toast-region';
    region.setAttribute('aria-live', 'polite');
    document.body.append(region);
  }

  const item = document.createElement('div');
  item.className = `toast toast-${type}`;
  item.textContent = message;
  region.append(item);

  window.setTimeout(() => {
    item.classList.add('is-hidden');
    window.setTimeout(() => item.remove(), 250);
  }, 3000);
}

// Безопасно экранирует текст перед вставкой в HTML-разметку.
export function escapeHTML(value = '') {
  const symbols = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return String(value).replace(/[&<>"']/g, (character) => symbols[character]);
}

// Формирует дату для минимального значения календарного поля.
export function getTodayISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

// Создаёт короткий уникальный идентификатор для новых записей.
export function createId(prefix) {
  const timePart = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 7);
  return `${prefix}-${timePart}-${randomPart}`;
}

renderHeader();
renderFooter();
renderQuickLinks();
