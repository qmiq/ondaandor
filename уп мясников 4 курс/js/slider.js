import { getGames } from './db.js';
import { escapeHTML } from './ui.js';

const slides = [...document.querySelectorAll('.hero-slide')];
const dotsMount = document.querySelector('.hero-dots');
let activeIndex = 0;
let timerId = null;

// Показывает выбранный слайд и обновляет индикаторы.
function showSlide(index) {
  if (slides.length === 0) return;

  slides[activeIndex].classList.remove('is-active');
  dotsMount.children[activeIndex].classList.remove('is-active');
  activeIndex = (index + slides.length) % slides.length;
  slides[activeIndex].classList.add('is-active');
  dotsMount.children[activeIndex].classList.add('is-active');
  restartTimer();
}

// Перезапускает таймер автопрокрутки слайдера.
function restartTimer() {
  window.clearInterval(timerId);
  timerId = window.setInterval(() => showSlide(activeIndex + 1), 5000);
}

// Подключает стрелки, точки и управление автопрокруткой.
function initSlider() {
  if (slides.length === 0) return;

  slides.forEach((slide, index) => {
    const dot = document.createElement('button');
    dot.className = `hero-dot${index === 0 ? ' is-active' : ''}`;
    dot.type = 'button';
    dot.setAttribute('aria-label', `Показать слайд ${index + 1}`);
    dot.addEventListener('click', () => showSlide(index));
    dotsMount.append(dot);
  });

  document.querySelector('.hero-prev').addEventListener('click', () => {
    showSlide(activeIndex - 1);
  });
  document.querySelector('.hero-next').addEventListener('click', () => {
    showSlide(activeIndex + 1);
  });

  restartTimer();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) window.clearInterval(timerId);
    else restartTimer();
  });
  window.addEventListener('pagehide', () => window.clearInterval(timerId), { once: true });
}

// Рисует карточку игры для главной страницы.
function renderGameCard(game) {
  const genreEmblems = {
    стратегия: '🧭',
    классика: '♟️',
    семейная: '🏠',
    кооперативная: '🤝',
    карточная: '🃏',
    социальная: '🗣️',
    'пати-гейм': '🎉',
    ассоциативная: '💭',
  };

  return `
    <article class="game-card">
      <div class="image-placeholder" style="--game-gradient: ${escapeHTML(game.gradient)}">
        <span class="game-emoji" aria-hidden="true">${escapeHTML(game.emoji)}</span>
        <span class="genre-emblem" title="${escapeHTML(game.genre)}">${genreEmblems[game.genre] || '🎲'}</span>
      </div>
      <div class="game-body">
        <h3>${escapeHTML(game.title)}</h3>
        <p class="game-description">${escapeHTML(game.description)}</p>
        <div class="game-meta">
          <span>👥 ${game.playersMin}–${game.playersMax}</span>
          <span>🔞 ${game.age}+</span>
          <span class="game-price">${game.price} ₽</span>
        </div>
        <a class="button" href="booking.html?game=${encodeURIComponent(game.id)}">Забронировать</a>
      </div>
    </article>
  `;
}

// Показывает первые шесть игр из LocalStorage.
function renderPopularGames() {
  const mount = document.querySelector('#popular-games');
  if (!mount) return;

  const games = getGames().slice(0, 6);
  mount.innerHTML = games.length
    ? games.map(renderGameCard).join('')
    : '<p class="empty-state">Пока нет игр в каталоге.</p>';
}

initSlider();
renderPopularGames();
