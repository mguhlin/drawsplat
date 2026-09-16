const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({
  testDir:'./tests',testMatch:/admin-google-setup\.spec\.js/,outputDir:'.tmp/admin-setup-tests',timeout:30000,workers:3,
  use:{baseURL:process.env.ADMIN_URL||'http://127.0.0.1:4183',serviceWorkers:'block',screenshot:'only-on-failure',trace:'retain-on-failure'},
  projects:[{name:'chrome',use:{browserName:'chromium',channel:'chrome'}},{name:'firefox',use:{browserName:'firefox'}},{name:'webkit',use:{browserName:'webkit'}}],
  webServer:process.env.ADMIN_URL?undefined:{command:'python3 -m http.server 4183 --bind 127.0.0.1',url:'http://127.0.0.1:4183',reuseExistingServer:true}
});
