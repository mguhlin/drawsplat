/* DrawSplat compliance time limits — Day 2.8 client.
   Tracks active interaction time, displays remaining minutes, posts a
   heartbeat to the Apps Script backend every 30s, and locks the
   workspace when the daily limit is hit. The server (Day 2.9) is the
   authoritative gate on save/load. */
(function(){
  const SCRIPT_URL_KEY='drawsplat.googleScriptUrl';
  const STORAGE_PREFIX='drawsplat.timeUsage.';
  const HEARTBEAT_MS=30000;
  const TICK_MS=10000;
  const IDLE_MS=60000;

  function cfg(){
    return (window.complianceConfig && window.complianceConfig.timeLimits) || null;
  }
  function scriptUrl(){
    try{ return (localStorage.getItem(SCRIPT_URL_KEY)||'').trim(); }catch(e){ return ''; }
  }
  function studentInfo(){
    const board = window.board || {};
    return {
      studentName: String(board.studentName || '').trim(),
      className: String(board.className || '').trim(),
      mode: String(board.mode || 'teacher')
    };
  }
  function todayKey(){
    const d=new Date();
    return d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0');
  }
  function loadLocal(student){
    try{
      const raw=localStorage.getItem(STORAGE_PREFIX+student+'|'+todayKey());
      if(!raw) return 0;
      return parseInt(raw,10)||0;
    }catch(e){ return 0; }
  }
  function saveLocal(student,sec){
    try{ localStorage.setItem(STORAGE_PREFIX+student+'|'+todayKey(),String(sec)); }catch(e){}
  }

  let lastActivity = Date.now();
  let secondsToday = 0;
  let serverRemaining = null;
  let locked = false;
  let pendingDelta = 0;
  let started = false;
  let chip = null;

  function isStudentMode(){
    const c=cfg(); if(!c||!c.enabled) return false;
    const info=studentInfo();
    if(info.mode!=='student') return false;
    if(!info.studentName) return false;
    return true;
  }

  function makeChip(){
    if(chip) return chip;
    chip=document.createElement('div');
    chip.id='timeLimitChip';
    chip.style.cssText='position:fixed;bottom:14px;right:14px;z-index:200;background:#fff;border:1.5px solid #e2e6f0;border-radius:999px;padding:7px 14px;font:600 12px/1.1 Inter,system-ui,sans-serif;color:#1f2937;box-shadow:0 8px 24px #11182722;cursor:default';
    document.body.appendChild(chip);
    return chip;
  }
  function updateChip(){
    const c=cfg(); if(!c||!c.enabled){ if(chip) chip.style.display='none'; return; }
    const el=makeChip();
    const remaining=serverRemaining!=null?serverRemaining:Math.max(0,(c.dailySeconds||0)-secondsToday);
    const mins=Math.floor(remaining/60);
    const sec=Math.max(0,remaining%60);
    if(remaining<=0){ el.style.background='#fdecea'; el.style.borderColor='#fca5a5'; el.style.color='#b91c1c'; el.textContent='Time used — locked'; }
    else if(remaining<300){ el.style.background='#fff7e6'; el.style.borderColor='#fcd34d'; el.style.color='#92400e'; el.textContent=mins+'m '+sec+'s left today'; }
    else { el.style.background='#fff'; el.style.borderColor='#e2e6f0'; el.style.color='#1f2937'; el.textContent=mins+'m left today'; }
  }

  function showLock(reason){
    if(locked) return;
    locked=true;
    const overlay=document.createElement('div');
    overlay.id='timeLimitOverlay';
    overlay.style.cssText='position:fixed;inset:0;background:rgba(15,23,42,.78);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px';
    overlay.innerHTML='<div style="background:#fff;border-radius:16px;max-width:440px;padding:24px;box-shadow:0 30px 80px rgba(0,0,0,0.4);font-family:Inter,system-ui,sans-serif"><h2 style="margin:0 0 10px;color:#101827;font-size:22px">Time limit reached</h2><p style="margin:0 0 14px;color:#374151;line-height:1.5">'+reason+'</p><p class="hint" style="margin:0;color:#6b7280;font-size:13px">Your work auto-saves locally. Ask your teacher to extend the limit or come back tomorrow.</p></div>';
    document.body.appendChild(overlay);
    document.querySelectorAll('input,textarea,select,button').forEach(el=>{ if(!overlay.contains(el)) el.disabled=true; });
  }

  function recordActive(){
    if(locked) return;
    lastActivity=Date.now();
  }

  async function heartbeat(){
    if(!isStudentMode() || !pendingDelta) return;
    const url=scriptUrl();
    if(!url){ pendingDelta=0; return; }
    const info=studentInfo();
    const body=new URLSearchParams({action:'timeHeartbeat',studentName:info.studentName,className:info.className,deltaSeconds:String(pendingDelta)});
    pendingDelta=0;
    try{
      const res=await fetch(url,{method:'POST',body});
      const data=await res.json();
      if(data && data.ok){
        secondsToday=data.secondsToday||secondsToday;
        serverRemaining=data.remaining;
        saveLocal(info.studentName,secondsToday);
        updateChip();
        if(data.enabled && !data.allowed) showLock('You have reached your daily limit.');
      }
    }catch(e){ /* network blip — keep counting locally */ }
  }

  async function fetchInitialStatus(){
    const url=scriptUrl();
    if(!url) return;
    const info=studentInfo();
    if(!info.studentName) return;
    try{
      const params=new URLSearchParams({action:'timeStatus',studentName:info.studentName,className:info.className});
      const res=await fetch(url+'?'+params.toString());
      const data=await res.json();
      if(data && data.ok && data.config && data.config.enabled){
        window.complianceConfig=window.complianceConfig||{};
        window.complianceConfig.timeLimits=data.config;
        secondsToday=data.secondsUsedToday||0;
        serverRemaining=data.remaining;
        saveLocal(info.studentName,secondsToday);
        updateChip();
        if(!data.allowed) showLock(data.reason||'Time limit reached.');
      }
    }catch(e){}
  }

  function tick(){
    if(!isStudentMode()) return;
    const idle = Date.now() - lastActivity > IDLE_MS;
    if(!idle){
      secondsToday += TICK_MS/1000;
      pendingDelta += TICK_MS/1000;
      const info=studentInfo();
      if(info.studentName) saveLocal(info.studentName,secondsToday);
      updateChip();
      const c=cfg();
      if(c && c.enabled && c.dailySeconds && secondsToday>=c.dailySeconds){
        showLock('You have reached your daily time limit ('+Math.round(c.dailySeconds/60)+' minutes).');
      }
    }
  }

  function start(){
    if(started) return;
    started=true;
    const info=studentInfo();
    if(info.studentName) secondsToday=loadLocal(info.studentName);
    ['mousemove','keydown','pointerdown','touchstart','wheel','focus'].forEach(evt=>{
      window.addEventListener(evt,recordActive,{passive:true});
    });
    setInterval(tick,TICK_MS);
    setInterval(heartbeat,HEARTBEAT_MS);
    fetchInitialStatus();
  }

  window.addEventListener('compliance-config-ready',function(){
    if(isStudentMode()) start();
  });
  // If config already loaded by the time this script runs, kick off now.
  if(window.complianceConfig && isStudentMode()) start();
})();
