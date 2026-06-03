// create-admin.js
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

(async () => {
  const password = process.argv[2] || 'AdminPass123!';
  const email = process.argv[3] || 'admin@medstore.com';
  const name = process.argv[4] || 'Admin';

  const hash = await bcrypt.hash(password, 10);
  const conn = await mysql.createConnection({
    host: 'HOST',
    user: 'USER',
    password: 'PASSWORD',
    database: 'DB_NAME',
  });

  // If you want to UPDATE existing admin:
  await conn.execute('UPDATE users SET password_hash = ? WHERE email = ?', [hash, email]);

  // Or INSERT new admin (if not exists)
  // await conn.execute('INSERT INTO users (email, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, NOW())', [email, hash, name, 'admin']);

  console.log('Set hash for', email);
  await conn.end();
})();