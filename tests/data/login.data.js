const VALID_EMAIL = process.env.ADMIN_EMAIL || 'admin@gmail.com';
const VALID_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@12';

const cases = [];

// 1. Credenciales válidas: 5 pruebas

for (let i = 1; i <= 5; i++) {
  cases.push({
    category: 'Credenciales válidas',
    description: `Inicio de sesión válido - ejecución ${i}`,
    email: VALID_EMAIL,
    password: VALID_PASSWORD,
    expectedStatus: 200
  });
}

// 2. Contraseñas incorrectas: 45 pruebas

for (let i = 1; i <= 45; i++) {
  cases.push({
    category: 'Contraseña incorrecta',
    description: `Rechazar contraseña incorrecta número ${i}`,
    email: VALID_EMAIL,
    password: `Bad@${String(i).padStart(4, '0')}`,
    expectedStatus: 401
  });
}

// 3. Correos no registrados: 30 pruebas

for (let i = 1; i <= 30; i++) {
  cases.push({
    category: 'Usuario inexistente',
    description: `Rechazar usuario inexistente número ${i}`,
    email: `noexiste${i}@example.com`,
    password: VALID_PASSWORD,
    expectedStatus: 401
  });
}

// 4. Campos vacíos o nulos: 10 pruebas

const emptyCases = [
  ['', VALID_PASSWORD],
  [VALID_EMAIL, ''],
  ['', ''],
  [null, VALID_PASSWORD],
  [VALID_EMAIL, null],
  [null, null],
  [' ', VALID_PASSWORD],
  ['   ', VALID_PASSWORD],
  [VALID_EMAIL, ' '],
  [VALID_EMAIL, '        ']
];

emptyCases.forEach(([email, password], i) => {
  cases.push({
    category: 'Campos vacíos o nulos',
    description: `Validar campos vacíos o nulos - caso ${i + 1}`,
    email,
    password,
    expectedStatus: 400
  });
});

// 5. Formatos de correo inválidos: 50 pruebas

for (let i = 1; i <= 10; i++) {

  const invalidEmails = [
    `usuario${i}`,
    `usuario${i}@`,
    `@gmail${i}.com`,
    `usuario ${i}@gmail.com`,
    `usuario${i}@@gmail.com`
  ];

  invalidEmails.forEach((email, j) => {
    cases.push({
      category: 'Formato de correo inválido',
      description: `Rechazar formato de correo ${i}-${j + 1}`,
      email,
      password: VALID_PASSWORD,
      expectedStatus: 400
    });
  });
}

// 6. Longitud de correo: 25 pruebas

for (let i = 1; i <= 25; i++) {

  const email = 'a'.repeat(38 + i) + '@example.com';

  cases.push({
    category: 'Longitud de correo',
    description: `Rechazar correo de ${email.length} caracteres`,
    email,
    password: VALID_PASSWORD,
    expectedStatus: 400
  });
}

// 7. Contraseñas menores de 8 caracteres: 35 pruebas

for (let length = 1; length <= 7; length++) {

  for (let i = 1; i <= 5; i++) {

    cases.push({
      category: 'Contraseña demasiado corta',
      description: `Rechazar contraseña de ${length} caracteres - variante ${i}`,
      email: VALID_EMAIL,
      password: String(i).repeat(length),
      expectedStatus: 400
    });
  }
}

// 8. Contraseñas mayores de 8 caracteres: 35 pruebas

for (let length = 9; length <= 15; length++) {

  for (let i = 1; i <= 5; i++) {

    cases.push({
      category: 'Contraseña demasiado larga',
      description: `Rechazar contraseña de ${length} caracteres - variante ${i}`,
      email: VALID_EMAIL,
      password: String(i).repeat(length),
      expectedStatus: 400
    });
  }
}

// 9. Caracteres especiales: 15 pruebas

const specialPasswords = [
  '!!!!!!!!',
  '@@@@@@@@',
  '########',
  '$$$$$$$$',
  '%%%%%%%%',
  '^^^^^^^^',
  '&&&&&&&&',
  '********',
  '--------',
  '________',
  '++++++++',
  '========',
  '????????',
  '1234!@#$',
  'Abcd!@#$'
];

specialPasswords.forEach((password, i) => {

  cases.push({
    category: 'Caracteres especiales',
    description: `Rechazar credencial con caracteres especiales - caso ${i + 1}`,
    email: VALID_EMAIL,
    password,
    expectedStatus: 401
  });
});

// Verificar cantidad de pruebas

if (cases.length !== 250) {
  throw new Error(
    `Se esperaban 250 casos, pero se generaron ${cases.length}`
  );
}

module.exports = {
  VALID_EMAIL,
  VALID_PASSWORD,
  cases
};