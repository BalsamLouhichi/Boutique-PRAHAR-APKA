// Utilitaire CLI: génère un hash bcrypt pour créer/mettre à jour un compte admin
// Usage: node src/scripts/hashPassword.js "MonMotDePasse123!"
const bcrypt = require('bcrypt');

const password = process.argv[2];
if (!password) {
  console.error('Usage: node src/scripts/hashPassword.js "MonMotDePasse"');
  process.exit(1);
}

bcrypt.hash(password, 10).then((hash) => {
  console.log('\nHash bcrypt à insérer dans admin_users.password_hash :\n');
  console.log(hash);
  console.log('\nExemple SQL :');
  console.log(`UPDATE admin_users SET password_hash = '${hash}' WHERE email = 'admin@boutique.tn';\n`);
});
