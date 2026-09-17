/* Local recovery for reviewed recordings, and one media player at a time. */
window.DrawSplatRecordingSupport=(()=>{
  const players=new Set();
  function pauseAll(except){players.forEach(player=>{if(player!==except&&!player.paused)player.pause()})}
  function register(player){if(!players.has(player)){players.add(player);player.addEventListener('play',()=>pauseAll(player))}return player}
  function unregister(player){players.delete(player)}
  let ready,queue=Promise.resolve(),pending=0;
  function open(){if(!ready)ready=new Promise((resolve,reject)=>{const request=indexedDB.open('drawsplat-recording-drafts',1);request.onupgradeneeded=()=>request.result.createObjectStore('drafts');request.onsuccess=()=>resolve(request.result);request.onerror=()=>{ready=null;reject(request.error)};request.onblocked=()=>{ready=null;reject(new Error('Draft storage is blocked'))}});return ready}
  function write(operation){pending++;const task=queue.then(async()=>{const db=await open();await new Promise((resolve,reject)=>{const tx=db.transaction('drafts','readwrite');operation(tx.objectStore('drafts'));tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error||new Error('Draft could not be saved'))})});queue=task.catch(()=>{});return task.finally(()=>pending--)}
  const drafts={
    put(key,value,expires){return write(store=>{store.put({...value,expires},key);const cursor=store.openCursor();cursor.onsuccess=()=>{const item=cursor.result;if(item){if(item.value.expires<Date.now())item.delete();item.continue()}}})},
    remove(key){return write(store=>store.delete(key))},
    clear(){return write(store=>store.clear())},
    async get(key){await queue;const db=await open();const value=await new Promise((resolve,reject)=>{const tx=db.transaction('drafts','readonly'),request=tx.objectStore('drafts').get(key);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});if(value?.expires>Date.now())return value;if(value)await drafts.remove(key);return null},
    pending:()=>pending>0
  };
  return {register,unregister,pauseAll,drafts};
})();
