const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({
  testDir:'./tests',testMatch:/action-cards\.spec\.js/,timeout:30_000,workers:3,
  outputDir:'.tmp/presentation-results',
  use:{baseURL:process.env.DRAWSPLAT_URL||'http://127.0.0.1:4183',serviceWorkers:'block',screenshot:'only-on-failure'},
  projects:[
    {name:'chrome',use:{browserName:'chromium',channel:'chrome'}},
    {name:'firefox',use:{browserName:'firefox'}},
    {name:'webkit',use:{browserName:'webkit'}}
  ],
  webServer:process.env.DRAWSPLAT_URL?undefined:{command:'python3 -m http.server 4183 --bind 127.0.0.1',url:'http://127.0.0.1:4183',reuseExistingServer:true}
});
