const { test, expect } = require('@playwright/test');

const { cases } = require('../data/login.data');

test.describe('LOGIN FRONTEND - 250 pruebas con Playwright', () => {

  cases.forEach((item, index) => {

    const testId =
      `LOGIN-UI-${String(index + 1).padStart(3, '0')}`;

    test(
      `LOGIN /login | ${item.description} [${testId}]`,
      async ({ page }, testInfo) => {

        let actualStatus = null;
        let result = '';

        // Documentación de la prueba

        testInfo.annotations.push({
          type: 'Objetivo',
          description: item.description
        });

        testInfo.annotations.push({
          type: 'Categoría',
          description: item.category
        });

        // Abrir la página de inicio de sesión

        await page.goto('/login');

        const emailInput =
          page.getByTestId('login-email');

        const passwordInput =
          page.getByTestId('login-password');

        const submitButton =
          page.getByTestId('login-submit');

        // Comprobar elementos del formulario

        await expect(emailInput).toBeVisible();
        await expect(passwordInput).toBeVisible();
        await expect(submitButton).toBeVisible();

        // Ingresar datos de prueba

        await emailInput.fill(item.email ?? '');
        await passwordInput.fill(item.password ?? '');

        const startTime = Date.now();

        // =====================================
        // 1. CREDENCIALES CORRECTAS
        // =====================================

        if (item.expectedStatus === 200) {

          const responsePromise = page.waitForResponse(
            response =>
              response.url().includes('/api/auth/login') &&
              response.request().method() === 'POST'
          );

          await submitButton.click();

          const response = await responsePromise;

          actualStatus = response.status();

          expect(actualStatus).toBe(200);

          // Verificar navegación al Dashboard

          await expect(page).toHaveURL(
            /\/admin\/dashboard/
          );

          await expect(
            page.getByTestId('nav-users')
          ).toBeVisible();

          // Verificar sesión autenticada

          const sessionValid = await page.evaluate(() => {

            const session = sessionStorage.getItem(
              'usermanager_session'
            );

            if (!session) return false;

            const data = JSON.parse(session);

            return Boolean(
              data.token && data.role === 'ADMIN'
            );

          });

          expect(sessionValid).toBe(true);

          result = 'Inicio de sesión exitoso';

        }

        // =====================================
        // 2. CREDENCIALES INCORRECTAS
        // =====================================

        else if (item.expectedStatus === 401) {

          const responsePromise = page.waitForResponse(
            response =>
              response.url().includes('/api/auth/login') &&
              response.request().method() === 'POST'
          );

          await submitButton.click();

          const response = await responsePromise;

          actualStatus = response.status();

          expect(actualStatus).toBe(401);

          // Verificar mensaje de error

          const errorMessage =
            page.getByTestId('login-error');

          await expect(errorMessage).toBeVisible();

          await expect(errorMessage).not.toBeEmpty();

          // Debe permanecer en el Login

          await expect(page).toHaveURL(/\/login$/);

          result = 'Credenciales rechazadas correctamente';

        }

        // =====================================
        // 3. VALIDACIONES DEL FORMULARIO
        // =====================================

        else if (item.expectedStatus === 400) {

          const invalidFields = page.locator(
            'input.ng-invalid'
          );

          const invalidCount =
            await invalidFields.count();

          // Registrar solicitudes enviadas a la API

          const requests = [];

          const trackRequest = request => {

            if (
              request.url().includes('/api/auth/login') &&
              request.method() === 'POST'
            ) {
              requests.push(request);
            }

          };

          page.on('request', trackRequest);

          // Validación realizada por Angular

          if (invalidCount > 0) {

            if (await submitButton.isEnabled()) {

              await submitButton.click();

            }

            await expect(
              invalidFields.first()
            ).toBeVisible();

            await expect(page).toHaveURL(/\/login$/);

            // Comprobar que Angular bloquea la petición

            expect(requests.length).toBe(0);

            result = 'Datos inválidos rechazados por Angular';

          }

          // Validación realizada por el backend

          else {

            const responsePromise = page.waitForResponse(
              response =>
                response.url().includes('/api/auth/login') &&
                response.request().method() === 'POST'
            );

            await submitButton.click();

            const response = await responsePromise;

            actualStatus = response.status();

            expect(actualStatus).toBe(400);

            await expect(
              page.getByTestId('login-error')
            ).toBeVisible();

            result = 'Datos inválidos rechazados por la API';

          }

          page.off('request', trackRequest);

        }

        // =====================================
        // 4. VERIFICAR SEGURIDAD DE LA SESIÓN
        // =====================================

        if (item.expectedStatus !== 200) {

          await expect(page).toHaveURL(/\/login$/);

          const sessionExists = await page.evaluate(() => {

            return Boolean(
              sessionStorage.getItem(
                'usermanager_session'
              )
            );

          });

          expect(sessionExists).toBe(false);

        }

        const responseTime = Date.now() - startTime;

        // =====================================
        // 5. GENERAR EVIDENCIA DE LA PRUEBA
        // =====================================

        await testInfo.attach('Resultado de la prueba', {

          body: JSON.stringify({

            testId,

            category: item.category,

            description: item.description,

            component: 'Login Angular',

            route: '/login',

            expectedApiStatus: item.expectedStatus,

            actualStatus,

            result,

            responseTimeMs: responseTime,

            timestamp: new Date().toISOString()

          }, null, 2),

          contentType: 'application/json'

        });

      }
    );

  });

});
