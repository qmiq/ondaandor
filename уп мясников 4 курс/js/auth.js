import {
  getCurrentUser,
  getUsers,
  hashPassword,
  saveCurrentUser,
  saveUsers,
} from './db.js';
import { createId, toast } from './ui.js';

// Входит в аккаунт и перенаправляет пользователя по его роли.
export function login(emailValue, password) {
  const email = emailValue.trim().toLowerCase();
  const user = getUsers().find(
    (item) =>
      item.email.toLowerCase() === email &&
      item.passwordHash === hashPassword(password),
  );

  if (!user) {
    toast('Неверный email или пароль.', 'error');
    return false;
  }

  saveCurrentUser({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
  });
  location.href = user.role === 'admin' ? 'admin.html' : 'profile.html';
  return true;
}

// Создаёт аккаунт, проверяет уникальность email и автоматически входит.
export function register({ name, email, password, confirmation }) {
  const normalizedEmail = email.trim().toLowerCase();

  if (name.trim().length < 2) {
    toast('Имя должно содержать не менее двух символов.', 'error');
    return false;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    toast('Проверьте формат email.', 'error');
    return false;
  }

  if (password.length < 6) {
    toast('Пароль должен содержать не менее 6 символов.', 'error');
    return false;
  }

  if (password !== confirmation) {
    toast('Пароли не совпадают.', 'error');
    return false;
  }

  const users = getUsers();
  if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    toast('Пользователь с таким email уже существует.', 'error');
    return false;
  }

  const user = {
    id: createId('user'),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    role: 'user',
    phone: '',
    createdAt: new Date().toISOString(),
  };

  saveUsers([...users, user]);
  saveCurrentUser({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  });
  location.href = 'profile.html';
  return true;
}

// Проверяет, что у посетителя есть активная пользовательская сессия.
export function requireAuth() {
  const user = getCurrentUser();

  if (!user) {
    location.replace('login.html');
    return null;
  }

  return user;
}

// Проверяет права администратора перед открытием панели управления.
export function requireAdmin() {
  const user = requireAuth();

  if (user && user.role !== 'admin') {
    sessionStorage.setItem('authNotice', 'admin');
    location.replace('profile.html');
    return null;
  }

  return user;
}

// Подключает обработчики форм входа и регистрации на соответствующей странице.
export function initAuthForms() {
  document.querySelector('#login-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    login(form.elements.email.value, form.elements.password.value);
  });

  document.querySelector('#register-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    register({
      name: form.elements.name.value,
      email: form.elements.email.value,
      password: form.elements.password.value,
      confirmation: form.elements.confirmation.value,
    });
  });
}
