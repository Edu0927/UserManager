const { expect } = require('@playwright/test');
const crypto = require('crypto');

const API_URL = (
  process.env.API_URL || 'http://localhost:8080'
).replace(/\/$/, '');

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL || 'admin@gmail.com';

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || 'Admin@12';

// Generar usuarios únicos

function generateUser(overrides = {}) {

  const unique = crypto.randomBytes(8).toString('hex');

  return {
    name: 'Usuario de prueba',
    email: `ui_${unique}@example.com`,
    phone: String(
      crypto.randomInt(1000000000, 10000000000)
    ),
    password: 'Test@123',
    role: 'USER',
    ...overrides
  };
}

// Iniciar sesión desde Angular

async function login(page) {

  await page.goto('/login');

  await page.getByTestId('login-email')
    .fill(ADMIN_EMAIL);

  await page.getByTestId('login-password')
    .fill(ADMIN_PASSWORD);

  await page.getByTestId('login-submit').click();

  await expect(page).toHaveURL(
    /\/admin\/dashboard/
  );
}

// Abrir administración de usuarios

async function openUsers(page) {

  await page.getByTestId('nav-users').click();

  await expect(page).toHaveURL(
    /\/admin\/users/
  );

  await expect(
    page.getByTestId('users-table')
  ).toBeVisible();
}

// Obtener token para preparar datos

async function getToken(request) {

  const response = await request.post(
    `${API_URL}/api/auth/login`,
    {
      data: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      }
    }
  );

  expect(response.status()).toBe(200);

  const body = await response.json();

  return body.token;
}

// Crear usuario temporal mediante API

async function createUserAPI(request, token, data) {

  const response = await request.post(
    `${API_URL}/api/users`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
      data
    }
  );

  expect(response.status()).toBe(201);

  return response.json();
}

// Eliminar usuario temporal mediante API

async function deleteUserAPI(request, token, id) {

  const response = await request.delete(
    `${API_URL}/api/users/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  expect([204, 404]).toContain(response.status());
}

// Completar formulario

async function fillUserForm(page, data) {

  await page.getByTestId('user-name')
    .fill(data.name ?? '');

  await page.getByTestId('user-email')
    .fill(data.email ?? '');

  await page.getByTestId('user-phone')
    .fill(data.phone ?? '');

  await page.getByTestId('user-password')
    .fill(data.password ?? '');

  await page.getByTestId('user-role')
    .selectOption(data.role || 'USER');
}

// Buscar usuario por correo

async function findUser(page, email) {

  await page.getByTestId('search-users')
    .fill(email);

  const row = page.getByTestId('users-table')
    .locator('tbody tr')
    .filter({ hasText: email });

  await expect(row).toHaveCount(1);

  return row;
}

// Esperar respuesta de una operación HTTP

function waitAPI(page, method, endpoint) {

  return page.waitForResponse(response => {

    const path = new URL(response.url()).pathname;

    return path === endpoint &&
      response.request().method() === method;

  });
}

module.exports = {
  API_URL,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  generateUser,
  login,
  openUsers,
  getToken,
  createUserAPI,
  deleteUserAPI,
  fillUserForm,
  findUser,
  waitAPI
};
