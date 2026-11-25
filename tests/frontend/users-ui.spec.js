const { test, expect } = require('@playwright/test');

const {
  API_URL,
  ADMIN_EMAIL,
  generateUser,
  login,
  openUsers,
  getToken,
  createUserAPI,
  deleteUserAPI,
  fillUserForm,
  findUser,
  waitAPI
} = require('../helpers/users-ui.helper');

const {
  invalidNames,
  invalidEmails,
  invalidPhones,
  invalidPasswords
} = require('../data/users.data');

test.describe('CRUD FRONTEND - 100 pruebas con Playwright', () => {

  let token;
  let temporaryIds;
  let temporaryEmails;

  // Preparación antes de cada prueba

  test.beforeEach(async ({ page, request }) => {

    temporaryIds = new Set();
    temporaryEmails = new Set();

    token = await getToken(request);

    await login(page);
    await openUsers(page);

  });

  // Generar datos temporales

  function newData(overrides = {}) {

    const data = generateUser(overrides);

    temporaryEmails.add(data.email);

    return data;
  }

  // Preparar usuario mediante API

  async function prepareUser(page, request, overrides = {}) {

    const data = newData(overrides);

    const user = await createUserAPI(
      request, token, data
    );

    temporaryIds.add(user.id);

    await page.reload();

    await expect(
      page.getByTestId('users-table')
    ).toBeVisible();

    return { data, user };
  }

  // Limpiar usuarios temporales

  test.afterEach(async ({ request }) => {

    if (!token) return;

    const response = await request.get(
      `${API_URL}/api/users`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    expect(response.status()).toBe(200);

    const users = await response.json();

    for (const user of users) {

      if (
        temporaryIds.has(user.id) ||
        temporaryEmails.has(user.email)
      ) {

        await deleteUserAPI(
          request, token, user.id
        );

      }
    }

  });

  // Abrir formulario de registro

  async function openCreate(page, data) {

    await page.getByTestId('create-user').click();

    await expect(
      page.getByTestId('user-modal')
    ).toBeVisible();

    await fillUserForm(page, data);
  }

  // Comprobar validaciones del formulario

  async function validateField(
    page, field, value, message
  ) {

    const data = newData({
      [field]: value
    });

    await openCreate(page, data);

    const requests = [];

    const listener = request => {

      if (
        new URL(request.url()).pathname === '/api/users' &&
        request.method() === 'POST'
      ) {
        requests.push(request);
      }

    };

    page.on('request', listener);

    try {

      await page.getByTestId('save-user').click();

      await expect(
        page.getByTestId('user-modal')
      ).toBeVisible();

      const modal = page.getByTestId('user-modal');

      // El nombre compuesto únicamente por espacios
      // puede ser rechazado por la validación adicional.

      if (
        field === 'name' &&
        typeof value === 'string' &&
        value.length >= 2 &&
        value.trim().length < 2
      ) {

        await expect(
          page.getByTestId('modal-error')
        ).toHaveText('Ingresa un nombre válido.');

      } else {

        await expect(
          modal.getByText(message, { exact: true })
        ).toBeVisible();

      }

      expect(requests.length).toBe(0);

    } finally {

      page.off('request', listener);

    }
  }

  // ==========================================
  // 1. CREACIÓN DE USUARIOS - 10 PRUEBAS
  // ==========================================

  test.describe('Creación de usuarios', () => {

    const names = [
      'Juan Pérez',
      'María López',
      'Carlos Hernández',
      'Ana García',
      'Luis Martínez',
      'Sofía Rodríguez',
      'José Ramírez',
      'Laura Sánchez',
      'AB',
      'a'.repeat(50)
    ];

    names.forEach((name, index) => {

      test(
        `CRUD-UI-CREATE-${index + 1} | Registrar usuario válido desde el formulario`,
        async ({ page }) => {

          const data = newData({ name });

          await openCreate(page, data);

          const responsePromise = waitAPI(
            page, 'POST', '/api/users'
          );

          await page.getByTestId('save-user').click();

          const response = await responsePromise;

          expect(response.status()).toBe(201);

          const user = await response.json();

          temporaryIds.add(user.id);

          await expect(
            page.getByTestId('success-message')
          ).toHaveText(
            'Usuario registrado correctamente.'
          );

          await expect(
            page.getByTestId('user-modal')
          ).toBeHidden();

          const row = await findUser(page, data.email);

          await expect(row).toContainText(data.name);
          await expect(row).toContainText(data.phone);

        }
      );
    });

  });

  // ==========================================
  // 2. VALIDACIÓN DEL NOMBRE - 10 PRUEBAS
  // ==========================================

  test.describe('Validación del nombre', () => {

    invalidNames.forEach((name, index) => {

      test(
        `CRUD-UI-NAME-${index + 1} | Rechazar nombre inválido ${JSON.stringify(name)}`,
        async ({ page }) => {

          await validateField(
            page,
            'name',
            name,
            'El nombre debe contener entre 2 y 50 caracteres.'
          );

        }
      );

    });

  });

  // ==========================================
  // 3. VALIDACIÓN DEL CORREO - 10 PRUEBAS
  // ==========================================

  test.describe('Validación del correo', () => {

    invalidEmails.forEach((email, index) => {

      test(
        `CRUD-UI-EMAIL-${index + 1} | Rechazar correo inválido ${JSON.stringify(email)}`,
        async ({ page }) => {

          await validateField(
            page,
            'email',
            email,
            'Ingresa un correo válido de máximo 50 caracteres.'
          );

        }
      );

    });

  });

  // ==========================================
  // 4. VALIDACIÓN DEL TELÉFONO - 10 PRUEBAS
  // ==========================================

  test.describe('Validación del teléfono', () => {

    invalidPhones.forEach((phone, index) => {

      test(
        `CRUD-UI-PHONE-${index + 1} | Rechazar teléfono inválido ${JSON.stringify(phone)}`,
        async ({ page }) => {

          await validateField(
            page,
            'phone',
            phone,
            'El teléfono debe contener exactamente 10 dígitos.'
          );

        }
      );

    });

  });

  // ==========================================
  // 5. VALIDACIÓN DE CONTRASEÑA - 15 PRUEBAS
  // ==========================================

  test.describe('Validación de contraseña', () => {

    invalidPasswords.forEach((password, index) => {

      test(
        `CRUD-UI-PASS-${index + 1} | Rechazar contraseña que incumple los requisitos`,
        async ({ page }) => {

          await validateField(
            page,
            'password',
            password,
            'La contraseña no cumple con los requisitos.'
          );

        }
      );

    });

  });

  // ==========================================
  // 6. DATOS DUPLICADOS - 5 PRUEBAS
  // ==========================================

  test.describe('Datos duplicados', () => {

    const types = [
      'Correo duplicado',
      'Teléfono duplicado',
      'Correo y teléfono duplicados',
      'Correo duplicado en mayúsculas',
      'Usuario completamente duplicado'
    ];

    types.forEach((type, index) => {

      test(
        `CRUD-UI-DUP-${index + 1} | Rechazar ${type}`,
        async ({ page, request }) => {

          const { data } = await prepareUser(
            page, request
          );

          let duplicate = newData();

          if (index === 0) {
            duplicate.email = data.email;
          }

          if (index === 1) {
            duplicate.phone = data.phone;
          }

          if (index === 2) {
            duplicate.email = data.email;
            duplicate.phone = data.phone;
          }

          if (index === 3) {
            duplicate.email = data.email.toUpperCase();
          }

          if (index === 4) {
            duplicate = { ...data };
          }

          temporaryEmails.add(
            duplicate.email.toLowerCase()
          );

          await openCreate(page, duplicate);

          const responsePromise = waitAPI(
            page, 'POST', '/api/users'
          );

          await page.getByTestId('save-user').click();

          const response = await responsePromise;

          expect(response.status()).toBe(409);

          await expect(
            page.getByTestId('modal-error')
          ).toContainText(
            /registrado|conflicto/i
          );

          await expect(
            page.getByTestId('user-modal')
          ).toBeVisible();

        }
      );

    });

  });

  // ==========================================
  // 7. CONSULTA Y BÚSQUEDA - 10 PRUEBAS
  // ==========================================

  test.describe('Consulta y búsqueda de usuarios', () => {

    test('CRUD-UI-SEARCH-1 | Mostrar tabla de usuarios', async ({ page }) => {

      await expect(
        page.getByTestId('users-table')
      ).toBeVisible();

      await expect(
        page.getByRole('columnheader', {
          name: 'Teléfono'
        })
      ).toBeVisible();

    });

    const fields = ['name', 'email', 'phone'];

    fields.forEach((field, index) => {

      test(
        `CRUD-UI-SEARCH-${index + 2} | Buscar usuario por ${field}`,
        async ({ page, request }) => {

          const { data } = await prepareUser(
            page, request,
            { name: `Usuario ${Date.now()}` }
          );

          await page.getByTestId('search-users')
            .fill(data[field]);

          await expect(
            page.getByTestId('users-table')
              .locator('tbody tr')
              .filter({ hasText: data.email })
          ).toHaveCount(1);

        }
      );

    });

    test('CRUD-UI-SEARCH-5 | Buscar usuario inexistente', async ({ page }) => {

      await page.getByTestId('search-users')
        .fill(`inexistente_${Date.now()}`);

      await expect(
        page.getByText('No se encontraron usuarios')
      ).toBeVisible();

    });

    test('CRUD-UI-SEARCH-6 | Filtrar administradores', async ({ page }) => {

      await page.getByTestId('role-filter')
        .selectOption('ADMIN');

      const rows = page.getByTestId('users-table')
        .locator('tbody tr');

      expect(await rows.count()).toBeGreaterThan(0);

      for (const row of await rows.all()) {

        await expect(
          row.locator('.role-badge')
        ).toHaveText('Administrador');

      }

    });

    test('CRUD-UI-SEARCH-7 | Filtrar usuarios normales', async ({ page, request }) => {

      const { data } = await prepareUser(
        page, request
      );

      await page.getByTestId('role-filter')
        .selectOption('USER');

      const row = await findUser(page, data.email);

      await expect(
        row.locator('.role-badge')
      ).toHaveText('Usuario');

    });

    test('CRUD-UI-SEARCH-8 | Filtrar usuarios activos', async ({ page, request }) => {

      const { data } = await prepareUser(
        page, request
      );

      await page.getByTestId('status-filter')
        .selectOption('ACTIVE');

      const row = await findUser(page, data.email);

      await expect(
        row.locator('.status-badge')
      ).toHaveText('Activo');

    });

    test('CRUD-UI-SEARCH-9 | Filtrar usuarios inactivos', async ({ page, request }) => {

      const { user, data } = await prepareUser(
        page, request
      );

      const response = await request.patch(
        `${API_URL}/api/users/${user.id}/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          data: { active: false }
        }
      );

      expect(response.status()).toBe(200);

      await page.reload();

      await expect(
        page.getByTestId('users-table')
      ).toBeVisible();

      await page.getByTestId('status-filter')
        .selectOption('INACTIVE');

      const row = await findUser(page, data.email);

      await expect(
        row.locator('.status-badge')
      ).toHaveText('Inactivo');

    });

    test('CRUD-UI-SEARCH-10 | Actualizar tabla de usuarios', async ({ page }) => {

      const responsePromise = waitAPI(
        page, 'GET', '/api/users'
      );

      await page.getByRole('button', {
        name: 'Actualizar',
        exact: true
      }).click();

      const response = await responsePromise;

      expect(response.status()).toBe(200);

      await expect(
        page.getByTestId('users-table')
      ).toBeVisible();

    });

  });

  // ==========================================
  // 8. EDICIÓN DE USUARIOS - 10 PRUEBAS
  // ==========================================

  test.describe('Edición de usuarios', () => {

    const updates = [

      { name: 'Nombre actualizado' },

      { name: 'María Actualizada' },

      { name: 'a'.repeat(50) },

      { name: 'AB' },

      { role: 'ADMIN' },

      { password: 'New@1234' },

      { password: '' },

      { name: 'Usuario Modificado' },

      { email: 'GENERATE' },

      { phone: 'GENERATE' }

    ];

    updates.forEach((changes, index) => {

      test(
        `CRUD-UI-EDIT-${index + 1} | Actualizar ${Object.keys(changes)[0]} del usuario`,
        async ({ page, request }) => {

          const { user, data } = await prepareUser(
            page, request
          );

          await findUser(page, data.email);

          await page.getByTestId(
            `edit-user-${user.id}`
          ).click();

          await expect(
            page.getByTestId('user-modal')
          ).toBeVisible();

          const updatedData = {
            ...data,
            password: '',
            ...changes
          };

          if (updatedData.email === 'GENERATE') {

            updatedData.email = newData().email;

          }

          if (updatedData.phone === 'GENERATE') {

            updatedData.phone = generateUser().phone;

          }

          await fillUserForm(page, updatedData);

          const responsePromise = waitAPI(
            page,
            'PUT',
            `/api/users/${user.id}`
          );

          await page.getByTestId('save-user').click();

          const response = await responsePromise;

          expect(response.status()).toBe(200);

          await expect(
            page.getByTestId('success-message')
          ).toHaveText(
            'Usuario actualizado correctamente.'
          );

          const row = await findUser(
            page, updatedData.email
          );

          await expect(row).toContainText(
            updatedData.name
          );

          await expect(row).toContainText(
            updatedData.phone
          );

          await expect(
            row.locator('.role-badge')
          ).toHaveText(
            updatedData.role === 'ADMIN'
              ? 'Administrador'
              : 'Usuario'
          );

          // Verificar contraseña nueva o conservada

          if ('password' in changes) {

            const loginResponse = await request.post(
              `${API_URL}/api/auth/login`,
              {
                data: {
                  email: updatedData.email,
                  password:
                    updatedData.password ||
                    data.password
                }
              }
            );

            expect(loginResponse.status()).toBe(200);

          }

        }
      );

    });

  });

  // ==========================================
  // 9. ELIMINACIÓN DE USUARIOS - 5 PRUEBAS
  // ==========================================

  test.describe('Eliminación de usuarios', () => {

    for (let i = 1; i <= 4; i++) {

      test(
        `CRUD-UI-DELETE-${i} | Eliminar usuario mediante confirmación`,
        async ({ page, request }) => {

          const { user, data } = await prepareUser(
            page, request
          );

          await findUser(page, data.email);

          await page.getByTestId(
            `delete-user-${user.id}`
          ).click();

          await expect(
            page.getByTestId('confirmation-modal')
          ).toBeVisible();

          const responsePromise = waitAPI(
            page,
            'DELETE',
            `/api/users/${user.id}`
          );

          await page.getByTestId('confirm-action')
            .click();

          const response = await responsePromise;

          expect(response.status()).toBe(204);

          await expect(
            page.getByTestId('success-message')
          ).toHaveText(
            'Usuario eliminado correctamente.'
          );

          await expect(
            page.getByTestId(`user-row-${user.id}`)
          ).toHaveCount(0);

          await expect(
            page.getByText('No se encontraron usuarios')
          ).toBeVisible();

        }
      );

    }

    test('CRUD-UI-DELETE-5 | Cancelar eliminación de usuario', async ({ page, request }) => {

      const { user, data } = await prepareUser(
        page, request
      );

      await findUser(page, data.email);

      await page.getByTestId(
        `delete-user-${user.id}`
      ).click();

      await page.getByTestId('confirmation-modal')
        .getByRole('button', { name: 'Cancelar' })
        .click();

      await expect(
        page.getByTestId('confirmation-modal')
      ).toBeHidden();

      await expect(
        page.getByTestId(`user-row-${user.id}`)
      ).toBeVisible();

    });

  });

  // ==========================================
  // 10. ACTIVACIÓN Y DESACTIVACIÓN - 5 PRUEBAS
  // ==========================================

  test.describe('Activación y desactivación', () => {

    async function changeStatus(page, user, active) {

      await page.getByTestId(
        `status-user-${user.id}`
      ).click();

      const responsePromise = waitAPI(
        page,
        'PATCH',
        `/api/users/${user.id}/status`
      );

      await page.getByTestId('confirm-action').click();

      const response = await responsePromise;

      expect(response.status()).toBe(200);

      await expect(
        page.getByTestId('success-message')
      ).toHaveText(
        active
          ? 'Usuario activado correctamente.'
          : 'Usuario desactivado correctamente.'
      );

      await expect(
        page.getByTestId(`user-row-${user.id}`)
          .locator('.status-badge')
      ).toHaveText(
        active ? 'Activo' : 'Inactivo'
      );

    }

    for (let i = 1; i <= 2; i++) {

      test(
        `CRUD-UI-STATUS-${i} | Desactivar usuario`,
        async ({ page, request }) => {

          const { user, data } = await prepareUser(
            page, request
          );

          await findUser(page, data.email);

          await changeStatus(page, user, false);

        }
      );

      test(
        `CRUD-UI-ACTIVE-${i} | Reactivar usuario`,
        async ({ page, request }) => {

          const { user, data } = await prepareUser(
            page, request
          );

          await findUser(page, data.email);

          await changeStatus(page, user, false);

          await changeStatus(page, user, true);

        }
      );

    }

    test('CRUD-UI-STATUS-5 | Cancelar cambio de estado', async ({ page, request }) => {

      const { user, data } = await prepareUser(
        page, request
      );

      await findUser(page, data.email);

      await page.getByTestId(
        `status-user-${user.id}`
      ).click();

      await page.getByTestId('confirmation-modal')
        .getByRole('button', { name: 'Cancelar' })
        .click();

      await expect(
        page.getByTestId('confirmation-modal')
      ).toBeHidden();

      await expect(
        page.getByTestId(`user-row-${user.id}`)
          .locator('.status-badge')
      ).toHaveText('Activo');

    });

  });

  // ==========================================
  // 11. SEGURIDAD Y NAVEGACIÓN - 10 PRUEBAS
  // ==========================================

  test.describe('Seguridad y navegación', () => {

    test('CRUD-UI-SEC-1 | Bloquear acceso a usuarios sin sesión', async ({ page }) => {

      await page.evaluate(() => {
        sessionStorage.removeItem('usermanager_session');
      });

      await page.goto('/admin/users');

      await expect(page).toHaveURL(/\/login$/);

    });

    test('CRUD-UI-SEC-2 | Bloquear acceso al dashboard sin sesión', async ({ page }) => {

      await page.evaluate(() => {
        sessionStorage.removeItem('usermanager_session');
      });

      await page.goto('/admin/dashboard');

      await expect(page).toHaveURL(/\/login$/);

    });

    test('CRUD-UI-SEC-3 | Cerrar sesión correctamente', async ({ page }) => {

      await page.getByTestId('logout-button').click();

      await expect(page).toHaveURL(/\/login$/);

      const session = await page.evaluate(() =>
        sessionStorage.getItem('usermanager_session')
      );

      expect(session).toBeNull();

    });

    test('CRUD-UI-SEC-4 | Navegar al dashboard', async ({ page }) => {

      await page.getByTestId('nav-dashboard').click();

      await expect(page).toHaveURL(
        /\/admin\/dashboard/
      );

    });

    test('CRUD-UI-SEC-5 | Impedir eliminar al administrador actual', async ({ page }) => {

      const row = await findUser(page, ADMIN_EMAIL);

      await expect(
        row.getByRole('button', {
          name: 'Eliminar usuario'
        })
      ).toBeDisabled();

    });

    test('CRUD-UI-SEC-6 | Impedir desactivar al administrador actual', async ({ page }) => {

      const row = await findUser(page, ADMIN_EMAIL);

      await expect(
        row.getByRole('button', {
          name: 'Desactivar usuario'
        })
      ).toBeDisabled();

    });

    test('CRUD-UI-SEC-7 | Ocultar contraseña por defecto', async ({ page }) => {

      await page.getByTestId('create-user').click();

      await expect(
        page.getByTestId('user-password')
      ).toHaveAttribute('type', 'password');

    });

    test('CRUD-UI-SEC-8 | Mostrar contraseña mediante botón', async ({ page }) => {

      await page.getByTestId('create-user').click();

      await page.getByRole('button', {
        name: 'Mostrar contraseña'
      }).click();

      await expect(
        page.getByTestId('user-password')
      ).toHaveAttribute('type', 'text');

    });

    test('CRUD-UI-SEC-9 | Volver a ocultar contraseña', async ({ page }) => {

      await page.getByTestId('create-user').click();

      await page.getByRole('button', {
        name: 'Mostrar contraseña'
      }).click();

      await page.getByRole('button', {
        name: 'Ocultar contraseña'
      }).click();

      await expect(
        page.getByTestId('user-password')
      ).toHaveAttribute('type', 'password');

    });

    test('CRUD-UI-SEC-10 | Bloquear acceso con token inválido', async ({ page }) => {

      await page.evaluate(() => {

        const session = JSON.parse(
          sessionStorage.getItem('usermanager_session')
        );

        session.token = 'token-invalido';

        sessionStorage.setItem(
          'usermanager_session',
          JSON.stringify(session)
        );

      });

      await page.goto('/admin/users');

      await expect(page).toHaveURL(/\/login$/);

    });

  });

});
