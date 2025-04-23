const crypto = require('crypto');
const util = require('util');

const scryptAsync = util.promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function main() {
  try {
    const password = 'password123';
    const hashedPassword = await hashPassword(password);
    console.log('Original password:', password);
    console.log('Hashed password:', hashedPassword);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();