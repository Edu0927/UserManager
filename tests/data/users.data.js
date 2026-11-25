const invalidNames = [
  '',
  null,
  ' ',
  '   ',
  'A',
  'a'.repeat(51),
  'a'.repeat(52),
  'a'.repeat(60),
  'a'.repeat(75),
  'a'.repeat(100)
];

const invalidEmails = [
  '',
  null,
  ' ',
  'usuario',
  'usuario@',
  '@gmail.com',
  'usuario@@gmail.com',
  'usuario prueba@gmail.com',
  'a'.repeat(41) + '@gmail.com',
  'a'.repeat(60) + '@gmail.com'
];

const invalidPhones = [
  '',
  null,
  ' ',
  '123',
  '123456789',
  '12345678901',
  'abcdefghij',
  '442123456a',
  '442-123456',
  '+521234567'
];

const invalidPasswords = [
  '',
  null,
  ' ',
  '1234567',
  '123456789',
  'abcdefgh',
  'ABCDEFGH',
  '12345678',
  'Abcdefgh',
  'Abcdef12',
  'abcdef@1',
  'ABCDEF@1',
  'Abcdef@#',
  'Abc 12@D',
  'Abc@12345'
];

module.exports = {
  invalidNames,
  invalidEmails,
  invalidPhones,
  invalidPasswords
};
