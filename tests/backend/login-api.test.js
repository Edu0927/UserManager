const request = require('supertest');

const { cases } = require('../data/login.data');

const API_URL = (
  process.env.API_URL || 'http://localhost:8080'
).replace(/\/$/, '');

describe('LOGIN BACKEND - Jest y Supertest', () => {

  // Comprobar disponibilidad del servidor

  beforeAll(async () => {

    const response = await request(API_URL)
      .get('/api/health')
      .timeout({
        response: 5000,
        deadline: 10000
      });

    expect(response.status).toBe(999);

    console.log('Backend disponible correctamente.');
  });

  // Generar las 250 pruebas automatizadas

  cases.forEach((item, index) => {

    const testId =
      `LOGIN-API-${String(index + 1).padStart(3, '0')}`;

    test(
      `POST /api/auth/login | ${item.description} | debe regresar ${item.expectedStatus} [${testId}]`,
      async () => {

        const startTime = Date.now();

        // Enviar solicitud HTTP mediante Supertest

        const response = await request(API_URL)
          .post('/api/auth/login')
          .set('Content-Type', 'application/json')
          .send({
            email: item.email,
            password: item.password
          })
          .timeout({
            response: 10000,
            deadline: 15000
          });

        const responseTime =
          Date.now() - startTime;

        // Validar código HTTP esperado

        expect(response.status)
          .toBe(item.expectedStatus);

        // Validar tiempo de respuesta

        expect(responseTime)
          .toBeLessThan(15000);

        // Validar inicio de sesión correcto

        if (item.expectedStatus === 200) {

          expect(response.body.token)
            .toBeDefined();

          expect(typeof response.body.token)
            .toBe('string');

          expect(response.body.token.length)
            .toBeGreaterThan(0);

          expect(response.body.tokenType)
            .toBe('Bearer');

          expect(response.body.email)
            .toBe(item.email);

          expect(response.body.role)
            .toBe('ADMIN');

          expect(response.body.id)
            .toBeGreaterThan(0);

          expect(response.body.name)
            .toBeTruthy();

          // Verificar estructura del JWT

          expect(
            response.body.token.split('.')
          ).toHaveLength(3);

        } else {

          // Las solicitudes inválidas no deben
          // generar tokens de autenticación

          expect(response.body.token)
            .toBeUndefined();

          expect(response.body.accessToken)
            .toBeUndefined();

          expect(response.text || '')
            .not.toContain('"token"');

        }

      }
    );

  });

});
