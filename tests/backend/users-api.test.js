const {
  api,
  loginAdmin,
  generateUser,
  createUser,
  deleteUser
} = require('../helpers/users.helper');

const {
  invalidNames,
  invalidEmails,
  invalidPhones,
  invalidPasswords
} = require('../data/users.data');

describe('CRUD BACKEND - 100 pruebas con Jest y Supertest', () => {

  let token;

  const createdIds = new Set();

  // Preparar autenticación

  beforeAll(async () => {

    token = await loginAdmin();

    console.log(
      'Autenticación del administrador correcta.'
    );
  });

  // Crear y registrar usuarios temporales

  async function newUser(overrides = {}) {

    const result = await createUser(token, overrides);

    createdIds.add(result.user.id);

    return result;
  }

  // Solicitudes autenticadas

  function postUser(data) {

    return api
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send(data);
  }

  function getUser(id) {

    return api
      .get(`/api/users/${id}`)
      .set('Authorization', `Bearer ${token}`);
  }

  function updateUser(id, data) {

    return api
      .put(`/api/users/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(data);
  }

  function changeStatus(id, active) {

    return api
      .patch(`/api/users/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ active });
  }

  // Limpiar usuarios después de cada prueba

  afterEach(async () => {

    for (const id of createdIds) {

      const response = await deleteUser(token, id);

      expect([204, 404]).toContain(response.status);

      createdIds.delete(id);
    }
  });

  // ==========================================
  // 1. CREACIÓN DE USUARIOS - 10 PRUEBAS
  // ==========================================

  describe('Creación de usuarios', () => {

    const names = [
      'Juan Pérez',
      'María López',
      'Carlos Hernández',
      'Ana García',
      'Luis Martínez',
      'Sofía Rodríguez',
      'José Ramírez',
      'Laura Sánchez',
      'Pedro González',
      'a'.repeat(50)
    ];

    names.forEach((name, index) => {

      test(
        `POST /api/users debe crear usuario válido ${index + 1} y regresar 201`,
        async () => {

          const { data, user } = await newUser({
            name
          });

          expect(user.name).toBe(data.name);
          expect(user.email).toBe(data.email);
          expect(user.phone).toBe(data.phone);
          expect(user.role).toBe('USER');
          expect(user.active).toBe(true);
          expect(user.password).toBeUndefined();

          // Comprobar persistencia

          const response = await getUser(user.id);

          expect(response.status).toBe(200);
          expect(response.body.email).toBe(data.email);
        }
      );
    });
  });

  // ==========================================
  // 2. VALIDACIÓN DEL NOMBRE - 10 PRUEBAS
  // ==========================================

  describe('Validación del nombre', () => {

    invalidNames.forEach((name, index) => {

      test(
        `POST /api/users debe rechazar nombre inválido ${index + 1} y regresar 400`,
        async () => {

          const response = await postUser(
            generateUser({ name })
          );

          if (response.status === 201) {
            createdIds.add(response.body.id);
          }

          expect(response.status).toBe(400);
        }
      );
    });
  });

  // ==========================================
  // 3. VALIDACIÓN DEL CORREO - 10 PRUEBAS
  // ==========================================

  describe('Validación del correo electrónico', () => {

    invalidEmails.forEach((email, index) => {

      test(
        `POST /api/users debe rechazar correo inválido ${index + 1} y regresar 400`,
        async () => {

          const response = await postUser(
            generateUser({ email })
          );

          if (response.status === 201) {
            createdIds.add(response.body.id);
          }

          expect(response.status).toBe(400);
        }
      );
    });
  });

  // ==========================================
  // 4. VALIDACIÓN DEL TELÉFONO - 10 PRUEBAS
  // ==========================================

  describe('Validación del teléfono', () => {

    invalidPhones.forEach((phone, index) => {

      test(
        `POST /api/users debe rechazar teléfono inválido ${index + 1} y regresar 400`,
        async () => {

          const response = await postUser(
            generateUser({ phone })
          );

          if (response.status === 201) {
            createdIds.add(response.body.id);
          }

          expect(response.status).toBe(400);
        }
      );
    });
  });

  // ==========================================
  // 5. VALIDACIÓN DE CONTRASEÑA - 15 PRUEBAS
  // ==========================================

  describe('Validación de contraseña', () => {

    invalidPasswords.forEach((password, index) => {

      test(
        `POST /api/users debe rechazar contraseña inválida ${index + 1} y regresar 400`,
        async () => {

          const response = await postUser(
            generateUser({ password })
          );

          if (response.status === 201) {
            createdIds.add(response.body.id);
          }

          expect(response.status).toBe(400);
        }
      );
    });
  });

  // ==========================================
  // 6. DATOS DUPLICADOS - 5 PRUEBAS
  // ==========================================

  describe('Datos duplicados', () => {

    const duplicateTypes = [
      'email',
      'phone',
      'both',
      'uppercase-email',
      'same-user'
    ];

    duplicateTypes.forEach(type => {

      test(
        `POST /api/users debe rechazar datos duplicados (${type}) y regresar 409`,
        async () => {

          const { data } = await newUser();

          let duplicate = generateUser();

          if (type === 'email') {
            duplicate.email = data.email;
          }

          if (type === 'phone') {
            duplicate.phone = data.phone;
          }

          if (type === 'both') {
            duplicate.email = data.email;
            duplicate.phone = data.phone;
          }

          if (type === 'uppercase-email') {
            duplicate.email = data.email.toUpperCase();
          }

          if (type === 'same-user') {
            duplicate = { ...data };
          }

          const response = await postUser(duplicate);

          if (response.status === 201) {
            createdIds.add(response.body.id);
          }

          expect(response.status).toBe(409);
        }
      );
    });
  });

  // ==========================================
  // 7. CONSULTA DE USUARIOS - 10 PRUEBAS
  // ==========================================

  describe('Consulta de usuarios', () => {

    test(
      'GET /api/users debe obtener los usuarios y regresar 200',
      async () => {

        const response = await api
          .get('/api/users')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      }
    );

    for (let i = 1; i <= 5; i++) {

      test(
        `GET /api/users/:id debe obtener usuario registrado ${i} y regresar 200`,
        async () => {

          const { user } = await newUser();

          const response = await getUser(user.id);

          expect(response.status).toBe(200);
          expect(response.body.id).toBe(user.id);
          expect(response.body.email).toBe(user.email);
          expect(response.body.password).toBeUndefined();
        }
      );
    }

    for (let i = 1; i <= 4; i++) {

      test(
        `GET /api/users/:id debe rechazar usuario inexistente ${i} y regresar 404`,
        async () => {

          const response = await getUser(-i);

          expect(response.status).toBe(404);
        }
      );
    }
  });

  // ==========================================
  // 8. ACTUALIZACIÓN DE USUARIOS - 10 PRUEBAS
  // ==========================================

  describe('Actualización de usuarios', () => {

    const updates = [
      { name: 'Nombre actualizado' },
      { name: 'María Actualizada' },
      { name: 'a'.repeat(50) },
      { role: 'ADMIN' },
      { password: 'New@1234' },
      { password: null },
      { name: 'Usuario Modificado' }
    ];

    updates.forEach((changes, index) => {

      test(
        `PUT /api/users/:id debe actualizar usuario ${index + 1} y regresar 200`,
        async () => {

          const { user, data } = await newUser();

          const updatedData = {
            ...data,
            password: null,
            ...changes
          };

          const response = await updateUser(
            user.id,
            updatedData
          );

          expect(response.status).toBe(200);
          expect(response.body.name).toBe(updatedData.name);
          expect(response.body.role).toBe(updatedData.role);
          expect(response.body.password).toBeUndefined();

          const persisted = await getUser(user.id);

          expect(persisted.status).toBe(200);
          expect(persisted.body.name).toBe(updatedData.name);
          expect(persisted.body.role).toBe(updatedData.role);

          // Comprobar contraseña nueva o conservada

          if ('password' in changes) {

            const login = await api
              .post('/api/auth/login')
              .send({
                email: data.email,
                password: changes.password || data.password
              });

            expect(login.status).toBe(200);
          }
        }
      );
    });

    test(
      'PUT /api/users/:id debe actualizar el correo y regresar 200',
      async () => {

        const { user, data } = await newUser();

        const email = generateUser().email;

        const response = await updateUser(user.id, {
          ...data,
          email,
          password: null
        });

        expect(response.status).toBe(200);
        expect(response.body.email).toBe(email);

        const persisted = await getUser(user.id);

        expect(persisted.status).toBe(200);
        expect(persisted.body.email).toBe(email);
      }
    );

    test(
      'PUT /api/users/:id debe actualizar el teléfono y regresar 200',
      async () => {

        const { user, data } = await newUser();

        const phone = generateUser().phone;

        const response = await updateUser(user.id, {
          ...data,
          phone,
          password: null
        });

        expect(response.status).toBe(200);
        expect(response.body.phone).toBe(phone);

        const persisted = await getUser(user.id);

        expect(persisted.status).toBe(200);
        expect(persisted.body.phone).toBe(phone);
      }
    );

    test(
      'PUT /api/users/:id debe rechazar usuario inexistente y regresar 404',
      async () => {

        const response = await updateUser(
          -1,
          generateUser()
        );

        expect(response.status).toBe(404);
      }
    );
  });

  // ==========================================
  // 9. ELIMINACIÓN DE USUARIOS - 5 PRUEBAS
  // ==========================================

  describe('Eliminación de usuarios', () => {

    for (let i = 1; i <= 4; i++) {

      test(
        `DELETE /api/users/:id debe eliminar usuario ${i} y regresar 204`,
        async () => {

          const { user } = await newUser();

          const response = await deleteUser(
            token,
            user.id
          );

          expect(response.status).toBe(204);

          createdIds.delete(user.id);

          const verification = await getUser(user.id);

          expect(verification.status).toBe(404);
        }
      );
    }

    test(
      'DELETE /api/users/:id debe rechazar usuario inexistente y regresar 404',
      async () => {

        const response = await deleteUser(token, -1);

        expect(response.status).toBe(404);
      }
    );
  });

  // ==========================================
  // 10. ACTIVACIÓN Y DESACTIVACIÓN - 5 PRUEBAS
  // ==========================================

  describe('Activación y desactivación', () => {

    for (let i = 1; i <= 2; i++) {

      test(
        `PATCH /api/users/:id/status debe desactivar usuario ${i} y regresar 200`,
        async () => {

          const { user } = await newUser();

          const response = await changeStatus(
            user.id,
            false
          );

          expect(response.status).toBe(200);
          expect(response.body.active).toBe(false);

          const persisted = await getUser(user.id);

          expect(persisted.body.active).toBe(false);
        }
      );

      test(
        `PATCH /api/users/:id/status debe activar usuario ${i} y regresar 200`,
        async () => {

          const { user } = await newUser();

          const disabled = await changeStatus(
            user.id,
            false
          );

          expect(disabled.status).toBe(200);

          const response = await changeStatus(
            user.id,
            true
          );

          expect(response.status).toBe(200);
          expect(response.body.active).toBe(true);
        }
      );
    }

    test(
      'PATCH /api/users/:id/status debe rechazar usuario inexistente y regresar 404',
      async () => {

        const response = await changeStatus(-1, false);

        expect(response.status).toBe(404);
      }
    );
  });

  // ==========================================
  // 11. SEGURIDAD Y PERMISOS - 10 PRUEBAS
  // ==========================================

  describe('Seguridad, permisos y JWT', () => {

    test(
      'GET /api/users sin token debe regresar 401',
      async () => {

        const response = await api.get('/api/users');

        expect(response.status).toBe(401);
      }
    );

    test(
      'POST /api/users sin token debe regresar 401',
      async () => {

        const response = await api
          .post('/api/users')
          .send(generateUser());

        expect(response.status).toBe(401);
      }
    );

    test(
      'PUT /api/users/:id sin token debe regresar 401',
      async () => {

        const response = await api
          .put('/api/users/-1')
          .send(generateUser());

        expect(response.status).toBe(401);
      }
    );

    test(
      'DELETE /api/users/:id sin token debe regresar 401',
      async () => {

        const response = await api
          .delete('/api/users/-1');

        expect(response.status).toBe(401);
      }
    );

    test(
      'PATCH /api/users/:id/status sin token debe regresar 401',
      async () => {

        const response = await api
          .patch('/api/users/-1/status')
          .send({ active: false });

        expect(response.status).toBe(401);
      }
    );

    test(
      'GET /api/users con token inválido debe regresar 401',
      async () => {

        const response = await api
          .get('/api/users')
          .set('Authorization', 'Bearer token-invalido');

        expect(response.status).toBe(401);
      }
    );

    test(
      'GET /api/users con token vacío debe regresar 401',
      async () => {

        const response = await api
          .get('/api/users')
          .set('Authorization', 'Bearer');

        expect(response.status).toBe(401);
      }
    );

    test(
      'GET /api/users con rol USER debe regresar 403',
      async () => {

        const { data } = await newUser();

        const login = await api
          .post('/api/auth/login')
          .send({
            email: data.email,
            password: data.password
          });

        expect(login.status).toBe(200);

        const response = await api
          .get('/api/users')
          .set(
            'Authorization',
            `Bearer ${login.body.token}`
          );

        expect(response.status).toBe(403);
      }
    );

    test(
      'POST /api/users con rol USER debe regresar 403',
      async () => {

        const { data } = await newUser();

        const login = await api
          .post('/api/auth/login')
          .send({
            email: data.email,
            password: data.password
          });

        expect(login.status).toBe(200);

        const response = await api
          .post('/api/users')
          .set(
            'Authorization',
            `Bearer ${login.body.token}`
          )
          .send(generateUser());

        if (response.status === 201) {
          createdIds.add(response.body.id);
        }

        expect(response.status).toBe(403);
      }
    );

    test(
      'POST /api/auth/login con usuario desactivado debe regresar 401',
      async () => {

        const { user, data } = await newUser();

        const disabled = await changeStatus(
          user.id,
          false
        );

        expect(disabled.status).toBe(200);

        const response = await api
          .post('/api/auth/login')
          .send({
            email: data.email,
            password: data.password
          });

        expect(response.status).toBe(401);
        expect(response.body.token).toBeUndefined();
      }
    );
  });

});
