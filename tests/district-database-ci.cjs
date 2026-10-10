const fs=require('node:fs'),cp=require('node:child_process');
const env=Object.fromEntries(fs.readFileSync('selfhost/district/.env','utf8').trim().split('\n').map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1)];}));
const args=['compose','--env-file','selfhost/district/.env','-f','selfhost/district/compose.yml'];
const container=cp.execFileSync('docker',[...args,'ps','-q','db'],{encoding:'utf8'}).trim();
const ip=JSON.parse(cp.execFileSync('docker',['inspect',container],{encoding:'utf8'}))[0].NetworkSettings.Networks;const host=Object.values(ip)[0].IPAddress;
const result=cp.spawnSync(process.execPath,['--test','tests/mysql-backend.test.cjs','tests/district-roster.test.cjs'],{stdio:'inherit',env:{...process.env,MYSQL_TEST_URL:'mysql://drawsplat_app:'+env.DB_PASSWORD+'@'+host+'/drawsplat',AUTH_RATE_LIMIT_PER_15_MIN:'100'}});process.exitCode=result.status;
