import {sortSelectOptions} from './option-sorting.mjs';
import { uid } from './engine.mjs';
import { importMedia } from './media.mjs';

export function setupBackgroundLibrary(api) {
  const $ = id => document.getElementById(id), { t } = api;
  document.body.insertAdjacentHTML('beforeend', `<dialog id="backgroundLibraryDialog"><form method="dialog"><div class="dialog-head"><h2 data-i18n="whiteboardCollection">Whiteboard backgrounds & images</h2><button value="cancel" data-i18n="close">Close</button></div><p data-i18n="backgroundCollectionHelp">Use the same classroom organizers, ScratchArt backgrounds, coloring pages, and animal photos as the DrawSplat whiteboard. Pictures are embedded in your project.</p><div class="library-filters"><label><span data-i18n="searchTemplates">Search</span><input id="backgroundSearch" type="search"></label><label><span data-i18n="collection">Collection</span><select id="backgroundGroup"><option value="" data-i18n="allTemplates">All</option><option value="classroom" data-i18n="classroomBackgrounds">Classroom organizers</option><option value="scratch">ScratchArt</option><option value="coloring" data-i18n="coloringPages">Coloring pages</option><option value="animals" data-i18n="animalPhotos">Animal photos</option></select></label><label><span data-i18n="placement">Placement</span><select id="backgroundPlacement"><option value="background" data-i18n="pageBackground">Page background</option><option value="picture" data-i18n="picture">Picture</option><option value="selected" data-i18n="selectedPictureBox">Selected picture box</option></select></label></div><p id="backgroundCount" role="status"></p><div id="backgroundGrid" class="background-grid"></div></form></dialog>`);
  let catalog, busy = false;
  function render() {
    const query = $('backgroundSearch').value.trim().toLocaleLowerCase(), group = $('backgroundGroup').value;
    const matches = catalog.filter(item => (!group || item.group === group) && (!query || `${item.name} ${item.category || ''}`.toLocaleLowerCase().includes(query)));
    $('backgroundCount').textContent = t('collectionCount', { count: matches.length });
    $('backgroundGrid').replaceChildren(...matches.map(item => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'background-card'; button.dataset.backgroundId = item.id;
      const image = document.createElement('img'); image.src = new URL('../../' + item.path, import.meta.url); image.alt = ''; image.loading = 'lazy';
      const label = document.createElement('strong'); label.textContent = item.name; button.append(image, label); return button;
    }));
  }
  for (const id of ['backgroundSearch', 'backgroundGroup']) $(id).addEventListener(id === 'backgroundSearch' ? 'input' : 'change', render);
  $('backgroundGrid').onclick = async event => {
    const button = event.target.closest('[data-background-id]'); if (!button || busy) return;
    const item = catalog.find(item => item.id === button.dataset.backgroundId), placement = $('backgroundPlacement').value;
    const selected = api.getSelectedObject();
    if (placement === 'selected' && (selected?.type !== 'image' || selected.locked)) return;
    busy = true; button.disabled = true;
    try {
      const response = await fetch(new URL('../../' + item.path, import.meta.url)); if (!response.ok) throw Error('The collection image could not be loaded.');
      const asset = await importMedia(new File([await response.blob()], item.path.split('/').at(-1)));
      asset.name = item.name; asset.alt = item.name; asset.collection = 'DrawSplat whiteboard'; delete asset.notes;
      const page = api.currentPage(), d = api.getDoc();
      if (placement !== 'selected' && page.objects.filter(o => placement !== 'background' || !o.whiteboardBackground).length >= 200) throw Error(t('pageLimit'));
      api.mutate(() => {
        const assetId = uid(); d.assets[assetId] = asset;
        if (placement === 'selected') selected.assetId = assetId;
        else {
          const w = placement === 'background' ? d.width : d.width - 2 * d.margin, h = placement === 'background' ? d.height : Math.min(d.height - 2 * d.margin, w * asset.height / asset.width);
          const object = { id: uid(), type: 'image', assetId, x: placement === 'background' ? 0 : d.margin, y: placement === 'background' ? 0 : d.margin, w, h, rotation: 0, fit: 'contain', locked: placement === 'background' };
          if (placement === 'background') { object.whiteboardBackground = true; page.objects = page.objects.filter(o => !o.whiteboardBackground); page.objects.unshift(object); }
          else page.objects.push(object);
          api.setSelected(placement === 'background' ? null : object.id);
        }
      });
      $('backgroundLibraryDialog').close();
    } catch (error) { api.showReport([error.message]); }
    finally { busy = false; button.disabled = false; }
  };
  return { async open() {
    try {
      catalog ||= await (await fetch(new URL('./whiteboard-catalog.json', import.meta.url))).json();
      $('backgroundSearch').value = ''; $('backgroundGroup').value = '';
      const selected = api.getSelectedObject(); $('backgroundPlacement').querySelector('[value="selected"]').disabled = selected?.type !== 'image' || selected.locked;
      $('backgroundPlacement').value = 'background'; WidgetI18n.refresh();for(const id of ['backgroundGroup','backgroundPlacement'])sortSelectOptions($(id)); render(); $('backgroundLibraryDialog').showModal();
    } catch (error) { api.showReport([error.message]); }
  } };
}
