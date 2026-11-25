import { getGames } from './db.js';
import { escapeHTML } from './ui.js';

const games = getGames();
const form = document.querySelector('#catalog-filters');
const genreSelect = document.querySelector('#genre');
const playerSelect = document.querySelector('#players');
const priceInput = document.querySelector('#price');
const searchInput = document.querySelector('#search');
const catalogMount = document.querySelector('#catalog-games');

// Заполняет жанры по сохранённым играм.
function populateGenres() {
  const genres = [...new Set(games.map((game) => game.genre))].sort();
  genres.forEach((genre) => genreSelect.add(new Option(genre, genre)));
}

// Возвращает карточку игры с градиентом и кнопкой бронирования.
function createGameCard(game) {
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
          <span>${escapeHTML(game.genre)}</span>
          <span>👥 ${game.playersMin}–${game.playersMax}</span>
          <span>🔞 ${game.age}+</span>
          <span class="game-price">${game.price} ₽</span>
        </div>
        <a class="button" href="booking.html?game=${encodeURIComponent(game.id)}">Забронировать</a>
      </div>
    </article>
  `;
}

// Проверяет, подходит ли диапазон игроков выбранному фильтру.
function matchesPlayerCount(game, filter) {
  if (!filter) return true;
  if (filter === '2') return game.playersMin <= 2 && game.playersMax >= 2;

  const [minimum, maximum] = filter.split('-').map(Number);
  if (filter.endsWith('+')) return game.playersMax >= Number(filter.slice(0, -1));

  return game.playersMin <= maximum && game.playersMax >= minimum;
}

// Применяет поиск и фильтры к каталогу.
function renderCatalog() {
  const query = searchInput.value.trim().toLocaleLowerCase('ru');
  const selectedGenre = genreSelect.value;
  const selectedPlayers = playerSelect.value;
  const maximumPrice = Number(priceInput.value);
  const filteredGames = games.filter((game) => {
    const matchesText = game.title.toLocaleLowerCase('ru').includes(query);
    const matchesGenre = !selectedGenre || game.genre === selectedGenre;
    const matchesPlayers = matchesPlayerCount(game, selectedPlayers);
    const matchesPrice = game.price <= maximumPrice;

    return matchesText && matchesGenre && matchesPlayers && matchesPrice;
  });

  document.querySelector('#price-value').textContent = `${maximumPrice} ₽`;
  document.querySelector('#results-count').textContent = `Найдено: ${filteredGames.length} игр`;
  catalogMount.innerHTML = filteredGames.length
    ? filteredGames.map(createGameCard).join('')
    : '<p class="empty-state">Игр не найдено. Попробуйте изменить фильтры.</p>';
}

populateGenres();
form.addEventListener('input', renderCatalog);
form.addEventListener('change', renderCatalog);
form.addEventListener('reset', () => window.requestAnimationFrame(renderCatalog));
renderCatalog();
