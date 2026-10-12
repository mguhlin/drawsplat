// Import with the actual database client, then exercise first-run setup against it.
const fs=require('node:fs'),cp=require('node:child_process');
const env=Object.fromEntries(fs.readFileSync('selfhost/district/.env','utf8').trim().split('\n').map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1)];}));
const args=['compose','--env-file','selfhost/district/.env','-f','selfhost/district/compose.yml'];
cp.execFileSync('docker',[...args,'cp','downloads/drawsplat-starter.sql','db:/tmp/drawsplat-starter.sql']);
cp.execFileSync('docker',[...args,'exec','-T','db','sh','-ec',`export MYSQL_PWD="$MYSQL_ROOT_PASSWORD"
if command -v mariadb >/dev/null; then client=mariadb; else client=mysql; fi
"$client" -uroot -e "CREATE DATABASE drawsplat_starter_check CHARACTER SET utf8mb4; GRANT ALL ON drawsplat_starter_check.* TO 'drawsplat_app'@'%'"
"$client" -uroot drawsplat_starter_check < /tmp/drawsplat-starter.sql`],{stdio:'pipe'});
const container=cp.execFileSync('docker',[...args,'ps','-q','db'],{encoding:'utf8'}).trim();
const networks=JSON.parse(cp.execFileSync('docker',['inspect',container],{encoding:'utf8'}))[0].NetworkSettings.Networks;
const host=Object.values(networks)[0].IPAddress;
const result=cp.spawnSync(process.execPath,['--test','tests/setup-wizard.test.cjs'],{stdio:'inherit',env:{...process.env,MYSQL_SETUP_TEST_URL:'mysql://drawsplat_app:'+encodeURIComponent(env.DB_PASSWORD)+'@'+host+'/drawsplat_starter_check',MYSQL_SETUP_PREIMPORTED:'true'}});
process.exitCode=result.status ?? 1;
