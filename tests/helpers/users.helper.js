const request = require('supertest');
const crypto = require('crypto');

const API_URL = (
  process.env.API_URL || 'http://localhost:8080'
).replace(/\/$/, '');

const api = request(API_URL);

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL || 'admin@gmail.com';

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || 'Admin@12';

// Obtener token del administrador

async function loginAdmin() {

  const response = await api
    .post('/api/auth/login')
    .send({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

  expect(response.status).toBe(200);
  expect(response.body.token).toBeTruthy();

  return response.body.token;
}

// Generar datos únicos para cada usuario

function generateUser(overrides = {}) {

  const unique = crypto.randomBytes(8).toString('hex');

  return {
    name: 'Usuario de prueba',
    email: `test_${unique}@example.com`,
    phone: String(
      crypto.randomInt(1000000000, 9999999999)
    ),
    password: 'Test@123',
    role: 'USER',
    ...overrides
  };
}

// Crear usuario

async function createUser(token, overrides = {}) {

  const data = generateUser(overrides);

  const response = await api
    .post('/api/users')
    .set('Authorization', `Bearer ${token}`)
    .send(data);

  expect(response.status).toBe(201);
  expect(response.body.id).toBeGreaterThan(0);

  return {
    data,
    user: response.body
  };
}

// Eliminar usuario de prueba

async function deleteUser(token, id) {

  return api
    .delete(`/api/users/${id}`)
    .set('Authorization', `Bearer ${token}`);
}

module.exports = {
  api,
  loginAdmin,
  generateUser,
  createUser,
  deleteUser
};
