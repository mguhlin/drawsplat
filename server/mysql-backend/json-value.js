// MySQL returns native JSON; MariaDB versions/drivers may return JSON text.
function jsonValue(value) {
  if (typeof value === 'string' || Buffer.isBuffer(value)) return JSON.parse(value.toString());
  return value;
}
module.exports = { jsonValue };
