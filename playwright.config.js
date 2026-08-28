const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir:'./tests', timeout:30_000,
  use:{ baseURL:'http://127.0.0.1:4183' },
  webServer:{ command:'python3 -m http.server 4183 --bind 127.0.0.1', url:'http://127.0.0.1:4183/', reuseExistingServer:true }
});
