const crypto = require('node:crypto');
function passwordRecord(password, pepper) {
  const salt = crypto.randomBytes(32);
  return {salt, hash:crypto.scryptSync(String(password), Buffer.concat([Buffer.from(pepper, 'utf8'),salt]),64)};
}
module.exports={passwordRecord};
