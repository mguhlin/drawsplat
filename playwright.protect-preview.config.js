const { defineConfig }=require('@playwright/test');
module.exports=defineConfig({testDir:'./tests',timeout:30_000,use:{baseURL:process.env.PRIVACY_BASE||'https://protect-v2-preview.drawsplat.pages.dev'},workers:2});
