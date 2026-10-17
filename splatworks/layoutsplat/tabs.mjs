// Resolve tab atoms with the browser's actual shaped text positions.
export function resolveTabs(root){
 const tabs=[...root.querySelectorAll('[data-layout-tab]')];if(!tabs.length)return;
 for(let pass=0;pass<3;pass++)for(const tab of tabs){
  const block=tab.closest('[data-tab-stops]')||root,stops=JSON.parse(block.dataset.tabStops||'[]'),rect=tab.getBoundingClientRect(),parent=block.getBoundingClientRect(),rtl=getComputedStyle(block).direction==='rtl',x=(rtl?parent.right-rect.right:rect.left-parent.left)*.75;
  const next=stops.find(n=>n>x+.5)??(Math.floor((x+.5)/36)+1)*36;tab.style.width=Math.max(1,next-x)+'pt';
 }
}
export function measureDetachedTabs(root){
 if(!root.querySelector('[data-layout-tab]'))return;
 const host=document.createElement('div');host.style.cssText='position:fixed;left:-100000px;top:0;visibility:hidden;pointer-events:none';document.body.append(host);const transform=root.style.transform;root.style.transform='none';host.append(root);resolveTabs(root);root.remove();root.style.transform=transform;host.remove();
}
