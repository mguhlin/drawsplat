/* Compliance configuration loader. Reads /compliance.config.json on boot
   and exposes window.complianceConfig. Safe default returns null while
   loading so callers fall back to permissive behavior until ready. */
(function loadComplianceConfig(){
  window.complianceConfig = window.complianceConfig || null;
  try{
    const base = (location.pathname.indexOf('/app/')===0 || location.pathname.indexOf('/admin/')===0 || location.pathname.indexOf('/parents/')===0) ? '../compliance.config.json' : 'compliance.config.json';
    fetch(base, { cache: 'no-cache' })
      .then(r => r.ok ? r.json() : null)
      .then(cfg => { if (cfg) { window.complianceConfig = cfg; window.dispatchEvent(new CustomEvent('compliance-config-ready', { detail: cfg })); } })
      .catch(() => {});
  }catch(e){}
})();

/* DrawSplatTM v3.0 — single source of app behaviour.
   v2.5 changes vs v2.4:
   - Object lookup is O(1) via a per-render Map.
   - render() is RAF-coalesced; pointermove no longer triggers a synchronous redraw per event.
   - History snapshots only happen on commit boundaries.
   - localStorage autosave falls back to IndexedDB on quota errors.
   - Image uploads are sniffed by magic bytes, not just MIME headers.
   - BroadcastChannel sends deltas plus a periodic full board for resync.
   - Keyboard shortcuts dialog (?), reduced-motion respect, focus-visible.
   - Service worker registered for offline shell.
*/
(function(){
/* -------------------------------------------------------------------------
   Configuration and board state
   -------------------------------------------------------------------------
   This block defines the version, Google Apps Script endpoint storage,
   supported object types, starter assets, and the in-memory board model.
   Almost every user action mutates `board`, then calls render() + saveState().
*/
/* Google Apps Script Web App URL.
   Replace the placeholder below after deploying apps-script/Code.gs. */
const DEFAULT_GOOGLE_SCRIPT_URL='PUT GOOGLE APPS SCRIPT WEB APP URL HERE';
const GOOGLE_SCRIPT_URL_PLACEHOLDER='PUT GOOGLE APPS SCRIPT WEB APP URL HERE';
const VERSION='3.0.83';
const APP_ROOT=/\/(app|languages)\//.test(location.pathname)?'../':'';
const appPath=path=>APP_ROOT+path;
const SCRIPT_URL_STORAGE_KEY='drawsplat.googleScriptUrl';
const STORAGE_MODE_KEY='drawsplat.storageMode';
const SESSION_HOURS_KEY='drawsplat.sessionHours';
const SESSION_EXPIRES_KEY='drawsplat.sessionExpiresAt';
const svg=document.getElementById('boardSvg'), NS='http://www.w3.org/2000/svg', XHTML='http://www.w3.org/1999/xhtml';
const TEXTABLE_TYPES=['text','sticky','comment','audio','rect','ellipse','diamond','triangle','callout','speech','polygon','star'], SHAPE_TEXT_TYPES=['rect','ellipse','diamond','triangle','callout','speech','polygon','star'];
const ADVANCED_TOOLS=['connector','callout','speech','comment','audio'];
const STICKERS=[{id:'star',label:'Star',icon:'⭐',bg:'#fde68a'},{id:'check',label:'Check',icon:'✅',bg:'#bbf7d0'},{id:'idea',label:'Idea',icon:'💡',bg:'#fde68a'},{id:'question',label:'Question',icon:'❓',bg:'#dbeafe'},{id:'smile',label:'Smile',icon:'😀',bg:'#fecdd3'},{id:'book',label:'Book',icon:'📚',bg:'#ddd6fe'},{id:'pencil',label:'Pencil',icon:'✏️',bg:'#fed7aa'},{id:'pin',label:'Pin',icon:'📌',bg:'#fecaca'},{id:'search',label:'Search',icon:'🔍',bg:'#cffafe'},{id:'globe',label:'Globe',icon:'🌎',bg:'#bfdbfe'}];
const EMOJI_CHOICES=['😀','😎','🤩','😂','😍','🤔','🐶','🐱','🐻','🐸','🦋','🐠','⭐','❤️','🔵','🟩','🔺','🌈','☀️','🌙','🌍','🍎','🍕','🍩','🚗','🚌','🚀','✈️','⛵','🏠','📚','✏️','🔬','💡','🎵','⚽'];
const GRAPH_I18N={
  en:{creator:'Graph Creator',type:'Type',bar:'Bar',line:'Line',area:'Area',pie:'Pie',title:'Title',xLabel:'X Label',yLabel:'Y Label',source:'Source',data:'Data',insert:'Insert Graph',classGraph:'Class Graph',category:'Category',value:'Value',classSurvey:'Class survey',favorite:'Favorite Lunches',choice:'Choice',votes:'Votes',sample:'Pizza,12\nTacos,8\nSalad,5\nSandwich,7',placeholder:'Pizza,12\nTacos,8\nSalad,5',empty:'Add labels and values to preview the graph.',added:'Graph inserted.',updated:'Graph updated.',needData:'Add at least one label and number.',close:'Close',pictureGraph:'Picture Graph',insertPictureGraph:'Insert Picture Graph',pictureTitle:'Class Picture Graph',direction:'Direction',vertical:'Vertical',horizontal:'Horizontal',icon:'Fallback picture',scale:'Each picture =',showNumbers:'Show numbers',loadPicture:'Load fallback picture',clearPicture:'Use typed fallback',rowPictures:'Row pictures',chooseRowPicture:'Choose image',removeRowPicture:'Remove',fallback:'Fallback',imageState:'Image',textState:'Text',pictureHint:'Use one row per category, like Pizza,12. Then add a different row picture for each category if needed.',pictureAdded:'Picture graph inserted.',pictureUpdated:'Picture graph updated.'},
  es:{creator:'Creador de gráficos',type:'Tipo',bar:'Barras',line:'Líneas',area:'Área',pie:'Circular',title:'Título',xLabel:'Etiqueta X',yLabel:'Etiqueta Y',source:'Fuente',data:'Datos',insert:'Insertar gráfico',classGraph:'Gráfico de la clase',category:'Categoría',value:'Valor',classSurvey:'Encuesta de la clase',favorite:'Almuerzos favoritos',choice:'Opción',votes:'Votos',sample:'Pizza,12\nTacos,8\nEnsalada,5\nSándwich,7',placeholder:'Pizza,12\nTacos,8\nEnsalada,5',empty:'Agrega etiquetas y valores para ver el gráfico.',added:'Gráfico insertado.',updated:'Gráfico actualizado.',needData:'Agrega al menos una etiqueta y un número.',close:'Cerrar',pictureGraph:'Pictograma',insertPictureGraph:'Insertar pictograma',pictureTitle:'Pictograma de la clase',direction:'Dirección',vertical:'Vertical',horizontal:'Horizontal',icon:'Imagen de respaldo',scale:'Cada imagen =',showNumbers:'Mostrar números',loadPicture:'Cargar imagen de respaldo',clearPicture:'Usar símbolo escrito',rowPictures:'Imágenes por fila',chooseRowPicture:'Elegir imagen',removeRowPicture:'Quitar',fallback:'Respaldo',imageState:'Imagen',textState:'Texto',pictureHint:'Usa una fila por categoría, como Pizza,12. Luego agrega una imagen distinta para cada categoría si hace falta.',pictureAdded:'Pictograma insertado.',pictureUpdated:'Pictograma actualizado.'},
  vi:{creator:'Trình tạo biểu đồ',type:'Loại',bar:'Cột',line:'Đường',area:'Vùng',pie:'Tròn',title:'Tiêu đề',xLabel:'Nhãn X',yLabel:'Nhãn Y',source:'Nguồn',data:'Dữ liệu',insert:'Chèn biểu đồ',classGraph:'Biểu đồ lớp học',category:'Danh mục',value:'Giá trị',classSurvey:'Khảo sát lớp học',favorite:'Bữa trưa yêu thích',choice:'Lựa chọn',votes:'Phiếu bầu',sample:'Pizza,12\nTaco,8\nSalad,5\nBánh mì,7',placeholder:'Pizza,12\nTaco,8\nSalad,5',empty:'Thêm nhãn và giá trị để xem trước biểu đồ.',added:'Đã chèn biểu đồ.',updated:'Đã cập nhật biểu đồ.',needData:'Thêm ít nhất một nhãn và một số.',close:'Đóng',pictureGraph:'Biểu đồ tranh',insertPictureGraph:'Chèn biểu đồ tranh',pictureTitle:'Biểu đồ tranh lớp học',direction:'Hướng',vertical:'Dọc',horizontal:'Ngang',icon:'Hình dự phòng',scale:'Mỗi hình =',showNumbers:'Hiển thị số',loadPicture:'Tải hình dự phòng',clearPicture:'Dùng ký hiệu đã gõ',rowPictures:'Hình theo dòng',chooseRowPicture:'Chọn hình',removeRowPicture:'Xóa',fallback:'Dự phòng',imageState:'Hình',textState:'Chữ',pictureHint:'Mỗi dòng một danh mục, ví dụ Pizza,12. Sau đó thêm hình khác nhau cho từng danh mục nếu cần.',pictureAdded:'Đã chèn biểu đồ tranh.',pictureUpdated:'Đã cập nhật biểu đồ tranh.'},
  ar:{creator:'منشئ الرسوم البيانية',type:'النوع',bar:'أعمدة',line:'خطّي',area:'مساحة',pie:'دائري',title:'العنوان',xLabel:'تسمية X',yLabel:'تسمية Y',source:'المصدر',data:'البيانات',insert:'إدراج الرسم',classGraph:'رسم بياني للصف',category:'الفئة',value:'القيمة',classSurvey:'استطلاع الصف',favorite:'وجبات الغداء المفضلة',choice:'الخيار',votes:'الأصوات',sample:'بيتزا,12\nتاكو,8\nسلطة,5\nشطيرة,7',placeholder:'بيتزا,12\nتاكو,8\nسلطة,5',empty:'أضف تسميات وقيما لمعاينة الرسم.',added:'تم إدراج الرسم البياني.',updated:'تم تحديث الرسم البياني.',needData:'أضف تسمية واحدة ورقما واحدا على الأقل.',close:'إغلاق',pictureGraph:'رسم بالصور',insertPictureGraph:'إدراج رسم بالصور',pictureTitle:'رسم صفي بالصور',direction:'الاتجاه',vertical:'عمودي',horizontal:'أفقي',icon:'صورة احتياطية',scale:'كل صورة =',showNumbers:'إظهار الأرقام',loadPicture:'تحميل صورة احتياطية',clearPicture:'استخدام الرمز المكتوب',rowPictures:'صور الصفوف',chooseRowPicture:'اختيار صورة',removeRowPicture:'إزالة',fallback:'احتياطي',imageState:'صورة',textState:'نص',pictureHint:'استخدم صفا لكل فئة، مثل بيتزا,12. ثم أضف صورة مختلفة لكل فئة عند الحاجة.',pictureAdded:'تم إدراج الرسم بالصور.',pictureUpdated:'تم تحديث الرسم بالصور.'},
  zh:{creator:'图表生成器',type:'类型',bar:'柱状图',line:'折线图',area:'面积图',pie:'饼图',title:'标题',xLabel:'X 轴标签',yLabel:'Y 轴标签',source:'来源',data:'数据',insert:'插入图表',classGraph:'班级图表',category:'类别',value:'数值',classSurvey:'班级调查',favorite:'最喜欢的午餐',choice:'选项',votes:'票数',sample:'披萨,12\n玉米卷,8\n沙拉,5\n三明治,7',placeholder:'披萨,12\n玉米卷,8\n沙拉,5',empty:'添加标签和数值以预览图表。',added:'已插入图表。',updated:'已更新图表。',needData:'请至少添加一个标签和一个数字。',close:'关闭',pictureGraph:'象形统计图',insertPictureGraph:'插入象形统计图',pictureTitle:'班级象形统计图',direction:'方向',vertical:'纵向',horizontal:'横向',icon:'备用图案',scale:'每个图案 =',showNumbers:'显示数字',loadPicture:'加载备用图片',clearPicture:'使用输入符号',rowPictures:'每行图片',chooseRowPicture:'选择图片',removeRowPicture:'移除',fallback:'备用',imageState:'图片',textState:'文字',pictureHint:'每行一个类别，例如 披萨,12。需要时可为每个类别添加不同图片。',pictureAdded:'已插入象形统计图。',pictureUpdated:'已更新象形统计图。'},
  uh:{creator:'ग्राफ निर्माता / گراف بنانے والا',type:'प्रकार / قسم',bar:'बार / بار',line:'लाइन / لائن',area:'क्षेत्र / رقبہ',pie:'पाई / پائی',title:'शीर्षक / عنوان',xLabel:'X लेबल / X لیبل',yLabel:'Y लेबल / Y لیبل',source:'स्रोत / ذریعہ',data:'डेटा / ڈیٹا',insert:'ग्राफ डालें / گراف داخل کریں',classGraph:'कक्षा ग्राफ / کلاس گراف',category:'श्रेणी / زمرہ',value:'मान / قدر',classSurvey:'कक्षा सर्वे / کلاس سروے',favorite:'पसंदीदा दोपहर का भोजन / پسندیدہ لنچ',choice:'विकल्प / انتخاب',votes:'वोट / ووٹ',sample:'Pizza,12\nTacos,8\nSalad,5\nSandwich,7',placeholder:'Pizza,12\nTacos,8\nSalad,5',empty:'ग्राफ देखने के लिए लेबल और मान जोड़ें।',added:'ग्राफ जोड़ा गया। / گراف شامل کیا گیا۔',updated:'ग्राफ अपडेट हुआ। / گراف اپ ڈیٹ ہوا۔',needData:'कम से कम एक लेबल और संख्या जोड़ें।',close:'बंद करें / بند کریں',pictureGraph:'चित्र ग्राफ / تصویری گراف',insertPictureGraph:'चित्र ग्राफ डालें / تصویری گراف داخل کریں',pictureTitle:'कक्षा चित्र ग्राफ / کلاس تصویری گراف',direction:'दिशा / سمت',vertical:'लंबवत / عمودی',horizontal:'क्षैतिज / افقی',icon:'बैकअप चित्र / متبادل تصویر',scale:'हर चित्र = / ہر تصویر =',showNumbers:'संख्या दिखाएँ / نمبر دکھائیں',loadPicture:'बैकअप चित्र लोड करें / متبادل تصویر لوڈ کریں',clearPicture:'लिखा प्रतीक उपयोग करें / لکھا نشان استعمال کریں',rowPictures:'पंक्ति चित्र / قطار تصاویر',chooseRowPicture:'चित्र चुनें / تصویر منتخب کریں',removeRowPicture:'हटाएँ / ہٹائیں',fallback:'बैकअप / متبادل',imageState:'चित्र / تصویر',textState:'पाठ / متن',pictureHint:'हर श्रेणी के लिए एक पंक्ति लिखें, जैसे Pizza,12. जरूरत हो तो हर श्रेणी के लिए अलग चित्र जोड़ें।',pictureAdded:'चित्र ग्राफ जोड़ा गया। / تصویری گراف شامل کیا گیا۔',pictureUpdated:'चित्र ग्राफ अपडेट हुआ। / تصویری گراف اپ ڈیٹ ہوا۔'}
};
const DOT_PALETTE=['#ef4444','#f97316','#facc15','#22c55e','#14b8a6','#3b82f6','#8b5cf6','#ec4899','#111827','#ffffff'];
const ERASER_SIZE_CHOICES=[['Small',4],['Bigger',18],['Biggest',36]];
const PEN_SIZE_CHOICES=[['Fine',2],['Medium',5],['Bold',10],['Marker',20]];
// Pen and eraser each remember their own stroke width so switching tools
// doesn't carry the eraser's chunky width back into the pen (or vice versa).
// The Style panel's strokeWidth slider holds whichever value belongs to the
// currently active tool; setTool restores the right one on switch, and the
// slider's input listener pushes user-driven changes back to the active
// tool's stored value.
let penStrokeWidth=4, eraserStrokeWidth=4;
const DOT_PICTURES=[
  {id:'heart',label:'Heart',rows:['.XX.XX.','XXXXXXX','XXXXXXX','.XXXXX.','..XXX..','...X...'],color:'#fecdd3'},
  {id:'flower',label:'Flower',rows:['..XXX..','.XXXXX.','XXXOXXX','.XXXXX.','..XXX..','...S...','...S...','..SSS..'],color:'#fde68a'},
  {id:'rocket',label:'Rocket',rows:['...X...','..XXX..','..XOX..','..XXX..','.XXXXX.','XXXSXXX','X.XXX.X','..X.X..'],color:'#bfdbfe'},
  {id:'butterfly',label:'Butterfly',rows:['XX...XX','XXX.XXX','.XXXXX.','..XXX..','.XXXXX.','XXX.XXX','XX...XX'],color:'#ddd6fe'},
  {id:'apple',label:'Apple',rows:['...LL..','..L....','.XXXXX.','XXXXXXX','XXXXXXX','.XXXXX.','..XXX..'],color:'#fecaca'},
  {id:'tenframe',label:'Ten Frame',rows:['XXXXX','XXXXX'],color:'#bbf7d0'},
  {id:'smile',label:'Smile',rows:['.XXXXX.','XX...XX','X.X.X.X','X.....X','X.X.X.X','XX...XX','.XXXXX.'],color:'#fde68a'},
  {id:'house',label:'House',rows:['...X...','..XXX..','.XXXXX.','XXXXXXX','XX...XX','XX...XX','XXXXXXX'],color:'#fed7aa'},
  {id:'tree',label:'Tree',rows:['...X...','..XXX..','.XXXXX.','XXXXXXX','..SSS..','..SSS..','.SSSSS.'],color:'#bbf7d0'},
  {id:'fish',label:'Fish',rows:['..XXXX.','XXXXXXX','XXOXXXX','XXXXXXX','..XXXX.','....X.X'],color:'#bae6fd'},
  {id:'sun',label:'Sun',rows:['X..X..X','..XXX..','XXXXXXX','.XXXXX.','XXXXXXX','..XXX..','X..X..X'],color:'#fde68a'},
  {id:'boat',label:'Boat',rows:['...X...','..XX...','.XXX...','XXXXXXX','.XXXXX.','..XXX..'],color:'#bfdbfe'}
];
const COLORING_BOOK_EXTENSIONS=['jpg','jpeg','png'];
function assetSlug(label){return String(label).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
const COLORING_BOOK_ITEMS=[
  ['allosaurus','dinosaurs','Allosaurus','allosaurus'],
  ['anteater','animals','Anteater','anteater'],
  ['apatosaurus','dinosaurs','Apatosaurus','apatosaurus'],
  ['archaopteryx','dinosaurs','Archaeopteryx','archaopteryx'],
  ['bear','animals','Bear','bear'],
  ['beaver','animals','Beaver','beaver'],
  ['beaverpup','animals','Beaver Pup','beaverpup'],
  ['brachiosaurus','dinosaurs','Brachiosaurus','brachiosaurus'],
  ['ceratosaurus','dinosaurs','Ceratosaurus','ceratosaurus'],
  ['copsognathus','dinosaurs','Compsognathus','copsognathus'],
  ['diplodocus','dinosaurs','Diplodocus','diplodocus'],
  ['elephant','animals','Elephant','elephant'],
  ['giraffe','animals','Giraffe','giraffe'],
  ['goat','animals','Goat','goat'],
  ['leopard','animals','Leopard','leopard'],
  ['meerkats','animals','Meerkats','meerkats'],
  ['platypus','animals','Platypus','platypus'],
  ['pterosaur','dinosaurs','Pterosaur','pterosaur'],
  ['raccoon','animals','Raccoon','raccoon'],
  ['sauropod-eggs','dinosaurs','Sauropod Eggs','sauropod_eggs'],
  ['stegosaurus','dinosaurs','Stegosaurus','stegosaurus'],
  ['wolves','animals','Wolves','wolves']
];
const COLORING_BOOK_CATEGORIES=COLORING_BOOK_ITEMS.reduce((acc,item)=>{(acc[item[1]]||(acc[item[1]]=[])).push(item[2]); return acc},{});
function coloringBookItems(){return COLORING_BOOK_ITEMS.map(([idv,category,label,fileBase])=>{const base=appPath('assets/coloring-book/'+fileBase), paths=COLORING_BOOK_EXTENSIONS.map(ext=>base+'.'+ext); return {id:idv,category,label,path:paths[0],paths}})}

let board={version:VERSION,title:'',className:'',studentName:'',mode:'teacher',assignmentMode:false,currentLayer:'shared',restorePoints:[],showAnswerKey:true,active:0,panels:[{id:id(),name:'Panel 1',bg:'grid',objects:[]}]};
let tool='select', selectedIds=[], drawing=null, liveDrawingPathEl=null, drag=null, zoom=1, fillEnabled=true, connectorPendingFrom=null, marquee=null, clipboard=null, dotPaintDrag=null, scratchErase=null, eraserDirty=false;
let dotPaintTargetId=null;
let touchMultiSelect=false;
let coloringPaintColor='#f97316', coloringPaintWidth=28, coloringPaintMode='brush';
let imageGalleryMode='insert';
let history=[], future=[], lastSnapshot=''; let localChannel=null, cloudTimer=null, collabRoom='', instanceId=id(), lastCloudTs='', roleLock=''; let liveCursors={}, mediaRecorder=null, recordChunks=[]; let inlineEditId=null, inlineEditOriginal=null;

/* v2.5: O(1) object lookup. Rebuilt every render. */
let objectIndex=new Map();
/* v2.5: render coalescing. */
let renderRequested=false;
function requestRender(){if(renderRequested) return; renderRequested=true; requestAnimationFrame(()=>{renderRequested=false; render()})}

const ui={};
['workspaceMode','interfaceMode','panelSelect','strokeColor','strokeWidth','fillColor','fillPattern','stickyColor','opacity','status','boardTitle','className','studentName','scriptUrl','richEditor','textColor','fontSize','fontSizeValue','textRotation','textRotationValue','autoScaleText','userMode','collabRoom','syncStatus','cursorStatus','templateSelect','stickerSelect','restorePointSelect','restorePointHint','assignmentModeToggle','activeLayerSelect','showAnswerKeyToggle','layerBadge'].forEach(k=>{ui[k]=document.getElementById(k)});

const SAFE_IMAGE_TYPES=['image/png','image/jpeg','image/webp','image/gif'];
const SAFE_AUDIO_TYPES=['audio/webm','audio/mpeg','audio/mp4','audio/wav','audio/ogg'];
const MAX_IMAGE_BYTES=25*1024*1024;
const MAX_AUDIO_BYTES=25*1024*1024;
const MAX_BOARD_BYTES=64*1024*1024;

/* Upload safety helpers: validate MIME type, byte size, and image magic bytes
   before any user-provided media is read into the board as a data URL. */
/* v2.5: magic-byte sniff so a renamed .svg or .exe can't slip past the MIME whitelist. */
const IMAGE_SIGS=[
  {type:'image/png', bytes:[0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]},
  {type:'image/jpeg',bytes:[0xFF,0xD8,0xFF]},
  {type:'image/gif', bytes:[0x47,0x49,0x46,0x38]},
  {type:'image/webp',bytes:[0x52,0x49,0x46,0x46]}
];
async function sniffImage(file){
  const head=new Uint8Array(await file.slice(0,16).arrayBuffer());
  for(const sig of IMAGE_SIGS){
    let ok=true; for(let i=0;i<sig.bytes.length;i++){ if(head[i]!==sig.bytes[i]){ ok=false; break } }
    if(ok){
      if(sig.type==='image/webp'){
        if(head[8]===0x57&&head[9]===0x45&&head[10]===0x42&&head[11]===0x50) return sig.type;
      } else return sig.type;
    }
  }
  return '';
}
function validateUpload(file,kind){
  if(!file) return false;
  const isImage=kind==='image', allowed=isImage?SAFE_IMAGE_TYPES:SAFE_AUDIO_TYPES, limit=isImage?MAX_IMAGE_BYTES:MAX_AUDIO_BYTES;
  if(!allowed.includes(file.type)){setStatus((isImage?'Image':'Audio')+' upload blocked. Use '+allowed.map(t=>t.split('/')[1].toUpperCase()).join(', ')+'.','danger'); return false}
  if(file.size>limit){setStatus((isImage?'Image':'Audio')+' upload blocked. Maximum size is '+Math.round(limit/1024/1024)+' MB.','danger'); return false}
  return true
}
async function validateImageDeep(file){
  if(!validateUpload(file,'image')) return false;
  const sniffed=await sniffImage(file);
  if(!sniffed){ setStatus('Image rejected: file content does not match a supported image format.','danger'); return false }
  return true;
}

function gid(x){return document.getElementById(x)}
function setButtonChrome(elOrId,label,icon){
  const el=typeof elOrId==='string'?gid(elOrId):elOrId;
  if(!el) return;
  if(label){
    el.setAttribute('aria-label',label);
    el.setAttribute('title',label);
    el.setAttribute('data-tooltip',label);
  }
  const lbl=el.querySelector?.('.icon-label');
  if(lbl&&label) lbl.textContent=label;
  const sym=el.querySelector?.('.icon-symbol');
  if(sym&&icon) sym.innerHTML=icon;
  if(!sym&&label) el.textContent=label;
}
function graphLang(){const lang=(window.DRAWSPLAT_LOCALE||document.documentElement.lang||'en').toLowerCase(); return lang.startsWith('es')?'es':lang.startsWith('vi')?'vi':lang.startsWith('ar')?'ar':lang.startsWith('zh')?'zh':(lang==='uh'||lang.includes('ur')||lang.includes('hi'))?'uh':'en'}
function gt(key){return (GRAPH_I18N[graphLang()]||GRAPH_I18N.en)[key]||GRAPH_I18N.en[key]||key}
function gtf(key,fallback){const v=gt(key); return v===key?fallback:v}
const TEMPLATE_I18N={
  en:{frayerTitle:'Frayer Model',definition:'Definition',characteristics:'Characteristics',examples:'Examples',nonExamples:'Non-Examples',kwlKnow:'Know',kwlWant:'Want to Know',kwlLearned:'Learned',sideA:'Side A',sideB:'Side B',caption:'Caption',both:'Both',mainIdea:'Main Idea',idea:'Idea',event:'Event'},
  es:{frayerTitle:'Modelo Frayer',definition:'Definición',characteristics:'Características',examples:'Ejemplos',nonExamples:'No ejemplos',kwlKnow:'Sé',kwlWant:'Quiero saber',kwlLearned:'Aprendí',sideA:'Lado A',sideB:'Lado B',caption:'Subtítulo',both:'Ambos',mainIdea:'Idea principal',idea:'Idea',event:'Evento'},
  vi:{frayerTitle:'Mô hình Frayer',definition:'Định nghĩa',characteristics:'Đặc điểm',examples:'Ví dụ',nonExamples:'Không phải ví dụ',kwlKnow:'Đã biết',kwlWant:'Muốn biết',kwlLearned:'Đã học',sideA:'Bên A',sideB:'Bên B',caption:'Chú thích',both:'Cả hai',mainIdea:'Ý chính',idea:'Ý tưởng',event:'Sự kiện'},
  ar:{frayerTitle:'نموذج فراير',definition:'تعريف',characteristics:'خصائص',examples:'أمثلة',nonExamples:'أمثلة غير صحيحة',kwlKnow:'أعرف',kwlWant:'أريد أن أعرف',kwlLearned:'تعلمت',sideA:'الجانب أ',sideB:'الجانب ب',caption:'تعليق',both:'كلاهما',mainIdea:'الفكرة الرئيسة',idea:'فكرة',event:'حدث'},
  zh:{frayerTitle:'Frayer 模型',definition:'定义',characteristics:'特征',examples:'例子',nonExamples:'非例子',kwlKnow:'已知',kwlWant:'想知道',kwlLearned:'已学',sideA:'A 面',sideB:'B 面',caption:'说明',both:'共同点',mainIdea:'主要想法',idea:'想法',event:'事件'},
  uh:{frayerTitle:'Frayer मॉडल / فراير ماڈل',definition:'परिभाषा / تعریف',characteristics:'विशेषताएँ / خصوصیات',examples:'उदाहरण / مثالیں',nonExamples:'गैर-उदाहरण / غیر مثالیں',kwlKnow:'जानता हूँ / جانتا ہوں',kwlWant:'जानना चाहता हूँ / جاننا چاہتا ہوں',kwlLearned:'सीखा / سیکھا',sideA:'पक्ष A / طرف A',sideB:'पक्ष B / طرف B',caption:'कैप्शन / عنوان',both:'दोनों / دونوں',mainIdea:'मुख्य विचार / مرکزی خیال',idea:'विचार / خیال',event:'घटना / واقعہ'}
};
function tplText(key){const set=TEMPLATE_I18N[graphLang()]||TEMPLATE_I18N.en; return set[key]||TEMPLATE_I18N.en[key]||key}
function id(){return 'ib_'+Math.random().toString(36).slice(2,10)+Date.now().toString(36)}
function panel(){return board.panels[board.active]}
let _statusToastTimer=null;
function tr(msg){return window.DRAWSPLAT_TRANSLATE?window.DRAWSPLAT_TRANSLATE(msg):msg}
function applyI18n(root=document.body){if(window.DRAWSPLAT_APPLY_I18N) window.DRAWSPLAT_APPLY_I18N(root)}
function setStatus(msg,cls=''){msg=tr(msg); if(ui.status){ui.status.className='hint '+cls;ui.status.textContent=msg} const toast=document.getElementById('statusToast'); if(toast){clearTimeout(_statusToastTimer); if(msg){toast.textContent=msg; toast.className='status-toast show'+(cls?' '+cls:''); _statusToastTimer=setTimeout(()=>toast.classList.remove('show'),3500)} else {toast.classList.remove('show')}}}
function setSyncStatus(msg,cls=''){msg=tr(msg); if(ui.syncStatus){ui.syncStatus.className='hint '+cls;ui.syncStatus.textContent=msg}}
window.setStatus=setStatus; window.setSyncStatus=setSyncStatus;
let _floatingTipTimer=null;
function hideFloatingTip(persistKey=''){
  const tip=gid('floatingTip');
  if(tip) tip.classList.remove('show');
  clearTimeout(_floatingTipTimer);
  if(persistKey){try{localStorage.setItem(persistKey,'1')}catch(_){}}
}
function showFloatingTip(title,text,opts={}){
  const tip=gid('floatingTip'), titleEl=gid('floatingTipTitle'), textEl=gid('floatingTipText'), close=gid('floatingTipClose');
  if(!tip||!titleEl||!textEl) return;
  if(opts.persistKey){try{if(localStorage.getItem(opts.persistKey)) return}catch(_){}}
  clearTimeout(_floatingTipTimer);
  titleEl.textContent=tr(title||'Tip');
  textEl.textContent=tr(text||'');
  if(close) close.onclick=()=>hideFloatingTip(opts.persistKey||'');
  tip.classList.add('show');
  const duration=opts.duration===0?0:(opts.duration||12000);
  if(duration) _floatingTipTimer=setTimeout(()=>hideFloatingTip(),duration);
}
const STARTUP_TIPS=[
  ['ScratchArt','Use Scratch Cover to load a random gallery background, then erase the cover to reveal it.'],
  ['Frames','Use the + button near the frame arrows to add a new screen. Grey arrows mean there is no previous or next screen yet.'],
  ['Selection','When something is selected, use the X button in the floating toolbar to deselect it.'],
  ['Widgets','Open Tools, then Classroom Widgets, to add timers, dice, bingo cards, polls, and more.'],
  ['Backgrounds','Use the background menu or Set Background to switch between grids, templates, images, and ScratchArt.']
];
function showStartupTip(){
  try{
    const key='drawsplat.startupTipDate', today=new Date().toISOString().slice(0,10);
    if(localStorage.getItem(key)===today) return;
    const idx=(parseInt(localStorage.getItem('drawsplat.startupTipIndex')||'0',10)||0)%STARTUP_TIPS.length;
    localStorage.setItem('drawsplat.startupTipIndex',String((idx+1)%STARTUP_TIPS.length));
    localStorage.setItem(key,today);
    showFloatingTip(STARTUP_TIPS[idx][0],STARTUP_TIPS[idx][1],{duration:14000});
  }catch(_){
    showFloatingTip(STARTUP_TIPS[0][0],STARTUP_TIPS[0][1],{duration:14000});
  }
}

/* Modal and header feedback helpers used by destructive actions, autosave,
   collaboration status, and short-lived toast messages. */
function askConfirm(msg,opts={}){return new Promise(resolve=>{const dlg=document.getElementById('confirmDialog'); if(!dlg||typeof dlg.showModal!=='function'){resolve(window.confirm(tr(msg))); return} const m=document.getElementById('confirmDialogMsg'),ok=document.getElementById('confirmDialogOk'),cancel=document.getElementById('confirmDialogCancel'); if(m) m.textContent=tr(msg); if(ok) ok.textContent=tr(opts.okLabel||'OK'); if(cancel) cancel.textContent=tr(opts.cancelLabel||'Cancel'); const cleanup=()=>{ok.onclick=null; cancel.onclick=null; dlg.removeEventListener('cancel',onCancel)}; const onOk=()=>{cleanup(); dlg.close(); resolve(true)}; const onCancel=(e)=>{if(e&&e.preventDefault) e.preventDefault(); cleanup(); dlg.close(); resolve(false)}; ok.onclick=onOk; cancel.onclick=onCancel; dlg.addEventListener('cancel',onCancel); dlg.showModal()})}
let _savedAt=null,_saveStateTimer=null;
function setSaveState(state,msg){const chip=document.getElementById('saveStateChip'); if(!chip) return; if(state==='saving'){chip.textContent=tr('Saving…'); chip.className='save-state saving'} else if(state==='saved'){_savedAt=Date.now(); chip.textContent=tr(msg||'Saved'); chip.className='save-state saved'} else if(state==='error'){chip.textContent=tr(msg||'Save failed'); chip.className='save-state error'} else if(state==='tick'){if(!_savedAt) return; const sec=Math.round((Date.now()-_savedAt)/1000); chip.textContent=sec<5?tr('Saved'):sec<60?tr('Saved ') + sec + tr('s ago'):sec<3600?tr('Saved ') + Math.round(sec/60) + tr('m ago'):tr('Saved ') + Math.round(sec/3600) + tr('h ago')}}
if(!_saveStateTimer) _saveStateTimer=setInterval(()=>setSaveState('tick'),30000);
function ensureConnectorLabelToolbarButton(){
  const tb=document.getElementById('selectionToolbar');
  if(!tb) return null;
  let btn=document.getElementById('floatConnectorLabelBtn');
  if(btn) return btn;
  btn=document.createElement('button');
  btn.id='floatConnectorLabelBtn';
  btn.type='button';
  btn.textContent='Label';
  btn.addEventListener('click',openConnectorLabelDialog);
  setButtonChrome(btn,'Connector Label');
  const dup=document.getElementById('floatDuplicateBtn');
  tb.insertBefore(btn,dup||null);
  return btn;
}
function ensureConceptImageToolbarButton(){
  const tb=document.getElementById('selectionToolbar');
  if(!tb) return null;
  let btn=document.getElementById('floatConceptImageBtn');
  if(btn) return btn;
  btn=document.createElement('button');
  btn.id='floatConceptImageBtn';
  btn.type='button';
  btn.textContent='Image';
  btn.addEventListener('click',openConceptImagePicker);
  setButtonChrome(btn,'Attach Image');
  const label=document.getElementById('floatConnectorLabelBtn')||document.getElementById('floatDuplicateBtn');
  tb.insertBefore(btn,label||null);
  return btn;
}
function ensureConceptImagePicker(){
  let dlg=document.getElementById('conceptImagePickerDialog');
  if(dlg) return dlg;
  dlg=document.createElement('dialog');
  dlg.id='conceptImagePickerDialog';
  dlg.className='confirm-dialog concept-image-picker-dialog';
  dlg.innerHTML=`<div class="modal-head"><h2>Concept Node Image</h2><button class="close" id="conceptImagePickerClose" aria-label="Close">Close</button></div><p class="confirm-msg">Choose a Picture Graph preset or upload your own image for the selected concept-map node.</p><div class="row"><label>Preset</label><select id="conceptImagePickerPreset">${pictureGraphIconOptions()}</select></div><div class="confirm-actions"><button id="conceptImagePickerClear" type="button">Clear</button><button id="conceptImagePickerUpload" type="button">Upload</button><button id="conceptImagePickerUse" type="button" class="primary">Use Preset</button></div>`;
  document.body.appendChild(dlg);
  dlg.querySelector('#conceptImagePickerClose').addEventListener('click',()=>dlg.close());
  dlg.querySelector('#conceptImagePickerUpload').addEventListener('click',()=>{ensureConceptCanvasControls?.(); gid('conceptNodeImageInput')?.click(); dlg.close()});
  dlg.querySelector('#conceptImagePickerClear').addEventListener('click',()=>{clearConceptNodeImage(); dlg.close()});
  dlg.querySelector('#conceptImagePickerUse').addEventListener('click',async()=>{await applyConceptPresetImage(dlg.querySelector('#conceptImagePickerPreset')?.value||''); dlg.close()});
  return dlg;
}
function openConceptImagePicker(){
  if(!selectedConceptNode()) return setStatus('Select a concept-map node first.','danger');
  const dlg=ensureConceptImagePicker(), preset=dlg.querySelector('#conceptImagePickerPreset');
  if(preset) preset.value='';
  if(typeof dlg.showModal==='function') dlg.showModal(); else dlg.show();
}
function ensureConnectorLabelDialog(){
  let dlg=document.getElementById('connectorLabelDialog');
  if(dlg) return dlg;
  dlg=document.createElement('dialog');
  dlg.id='connectorLabelDialog';
  dlg.className='confirm-dialog connector-label-dialog';
  dlg.innerHTML='<div class="modal-head"><h2>Connector Label</h2><button class="close" id="connectorLabelDialogClose" aria-label="Close">Close</button></div><p class="confirm-msg">Add a relationship phrase for the selected connector.</p><div class="row connector-label-row"><label>Label</label><textarea id="connectorLabelDialogText" rows="3" placeholder="focus on"></textarea></div><div class="row"><label>Position</label><input id="connectorLabelDialogPosition" type="range" min="8" max="92" value="50"><span id="connectorLabelDialogPositionValue" class="value-chip">50%</span></div><div class="confirm-actions"><button id="connectorLabelDialogClear" type="button">Clear</button><button id="connectorLabelDialogDone" type="button" class="primary">Done</button></div>';
  document.body.appendChild(dlg);
  const text=dlg.querySelector('#connectorLabelDialogText'), pos=dlg.querySelector('#connectorLabelDialogPosition'), value=dlg.querySelector('#connectorLabelDialogPositionValue');
  const sync=()=>{const o=selectedConnector(); if(!o) return; o.connectorLabel=text.value; o.connectorLabelT=+pos.value; if(value) value.textContent=pos.value+'%'; render(); saveState(false)};
  text.addEventListener('input',sync);
  pos.addEventListener('input',sync);
  dlg.querySelector('#connectorLabelDialogClear').addEventListener('click',()=>{text.value=''; sync(); saveState();});
  dlg.querySelector('#connectorLabelDialogDone').addEventListener('click',()=>{saveState(); dlg.close()});
  dlg.querySelector('#connectorLabelDialogClose').addEventListener('click',()=>{saveState(); dlg.close()});
  return dlg;
}
function openConnectorLabelDialog(){
  const o=selectedConnector();
  if(!o){setStatus('Select a connector first.','danger'); return}
  openInlineTextEditor(o.id);
}
function selectedColoringPage(){
  if(selectedIds.length!==1) return null;
  const o=currentObj();
  return o&&o.type==='image'&&o.coloringBookId&&canEditObject(o)?o:null;
}
function ensureColoringPaintToolbar(){
  const tb=document.getElementById('selectionToolbar');
  if(!tb) return null;
  let bar=document.getElementById('coloringPaintToolbar');
  if(bar) return bar;
  bar=document.createElement('div');
  bar.id='coloringPaintToolbar';
  bar.className='coloring-paint-toolbar';
  const colors=['#ef4444','#f97316','#facc15','#22c55e','#14b8a6','#3b82f6','#8b5cf6','#ec4899','#a16207','#111827','#ffffff'];
  bar.innerHTML=colors.map(color=>`<button type="button" class="coloring-swatch" data-coloring-color="${color}" aria-label="Paint ${color}" style="--swatch:${color}"></button>`).join('')+
    '<input id="coloringCustomColor" type="color" aria-label="Custom coloring color" title="Custom color">'+
    '<select id="coloringBrushSize" aria-label="Brush size"><option value="14">Small</option><option value="28" selected>Medium</option><option value="46">Large</option></select>'+
    '<select id="coloringPaintMode" aria-label="Coloring tool"><option value="brush">Brush</option><option value="bucket">Bucket</option><option value="spray">Spray</option></select>'+
    '<button type="button" id="coloringPaintModeBtn">Paint</button>';
  bar.addEventListener('pointerdown',e=>e.stopPropagation());
  bar.querySelectorAll('[data-coloring-color]').forEach(btn=>btn.addEventListener('click',()=>{
    coloringPaintColor=btn.dataset.coloringColor;
    bar.querySelector('#coloringCustomColor').value=coloringPaintColor;
    setTool('coloringpaint');
    refreshColoringPaintToolbar();
  }));
  bar.querySelector('#coloringCustomColor').addEventListener('input',e=>{coloringPaintColor=e.target.value; setTool('coloringpaint'); refreshColoringPaintToolbar()});
  bar.querySelector('#coloringBrushSize').addEventListener('change',e=>{coloringPaintWidth=+e.target.value||28; setTool('coloringpaint'); refreshColoringPaintToolbar()});
  bar.querySelector('#coloringPaintMode').addEventListener('change',e=>{coloringPaintMode=e.target.value||'brush'; setTool('coloringpaint'); refreshColoringPaintToolbar()});
  bar.querySelector('#coloringPaintModeBtn').addEventListener('click',()=>{setTool('coloringpaint'); refreshColoringPaintToolbar()});
  const dup=document.getElementById('floatDuplicateBtn');
  tb.insertBefore(bar,dup||null);
  return bar;
}
function refreshColoringPaintToolbar(){
  const o=selectedColoringPage(), bar=ensureColoringPaintToolbar();
  if(!bar) return;
  bar.style.display=o?'inline-flex':'none';
  if(!o) return;
  bar.querySelectorAll('[data-coloring-color]').forEach(btn=>btn.classList.toggle('active',btn.dataset.coloringColor.toLowerCase()===coloringPaintColor.toLowerCase()));
  const custom=bar.querySelector('#coloringCustomColor'); if(custom) custom.value=coloringPaintColor;
  const size=bar.querySelector('#coloringBrushSize'); if(size) size.value=String(coloringPaintWidth);
  const mode=bar.querySelector('#coloringPaintMode'); if(mode) mode.value=coloringPaintMode;
  bar.querySelector('#coloringPaintModeBtn')?.classList.toggle('active',tool==='coloringpaint');
  bar.querySelector('#coloringPaintModeBtn').textContent=coloringPaintMode==='bucket'?'Pour':(coloringPaintMode==='spray'?'Spray':'Paint');
}
function pointInBox(p,b){return p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h}
function transformPathData(d,fn){
  let i=0;
  return String(d||'').replace(/-?\d+(?:\.\d+)?/g,n=>{
    const v=+n, axis=i++%2?'y':'x';
    const next=fn(v,axis);
    return Number.isFinite(next)?String(Math.round(next*100)/100):n;
  });
}
function translatedPathData(d,dx,dy){return transformPathData(d,(v,axis)=>v+(axis==='x'?dx:dy))}
function scaledPathData(d,ox,oy,sx,sy){return transformPathData(d,(v,axis)=>axis==='x'?ox+(v-ox)*sx:oy+(v-oy)*sy)}
function coloringImageRect(o,b){
  const nw=o.naturalW||900, nh=o.naturalH||1200, imageRatio=nw/nh, boxRatio=b.w/b.h;
  if(boxRatio>imageRatio){const w=b.h*imageRatio; return{x:b.x+(b.w-w)/2,y:b.y,w,h:b.h,naturalW:nw,naturalH:nh}}
  const h=b.w/imageRatio; return{x:b.x,y:b.y+(b.h-h)/2,w:b.w,h,naturalW:nw,naturalH:nh};
}
function coloringCanvasPoint(target,p){
  const b=normBox(target), ib=coloringImageRect(target,b);
  if(!pointInBox(p,ib)) return null;
  return {x:Math.floor((p.x-ib.x)/ib.w*ib.naturalW),y:Math.floor((p.y-ib.y)/ib.h*ib.naturalH),rect:ib};
}
function loadImageForCanvas(src){return new Promise((resolve,reject)=>{const img=new Image(); img.onload=()=>resolve(img); img.onerror=()=>reject(new Error('Could not read coloring page.')); img.src=src})}
function hexToRgb(hex){const h=String(hex||'#000000').replace('#','');return{r:parseInt(h.slice(0,2),16)||0,g:parseInt(h.slice(2,4),16)||0,b:parseInt(h.slice(4,6),16)||0}}
function isColoringBoundary(data,idx){
  const a=data[idx+3], r=data[idx], g=data[idx+1], b=data[idx+2];
  return a>32 && (r+g+b)<500;
}
async function startColoringBucketFill(p,target){
  const hit=coloringCanvasPoint(target,p);
  if(!hit) return setStatus('Click inside the coloring page to pour color.','danger');
  try{
    const img=await loadImageForCanvas(target.src), w=hit.rect.naturalW, h=hit.rect.naturalH, sx=clamp(hit.x,0,w-1), sy=clamp(hit.y,0,h-1);
    const source=document.createElement('canvas'); source.width=w; source.height=h;
    const sctx=source.getContext('2d',{willReadFrequently:true}); sctx.drawImage(img,0,0,w,h);
    const src=sctx.getImageData(0,0,w,h), srcData=src.data, seed=(sy*w+sx)*4;
    if(isColoringBoundary(srcData,seed)) return setStatus('Bucket fill starts in white space, not on a line.','danger');
    const out=document.createElement('canvas'); out.width=w; out.height=h;
    const octx=out.getContext('2d'), outImg=octx.createImageData(w,h), outData=outImg.data, seen=new Uint8Array(w*h), stack=[sy*w+sx], rgb=hexToRgb(coloringPaintColor);
    let filled=0;
    while(stack.length){
      const pos=stack.pop();
      if(seen[pos]) continue;
      seen[pos]=1;
      const idx=pos*4;
      if(isColoringBoundary(srcData,idx)) continue;
      outData[idx]=rgb.r; outData[idx+1]=rgb.g; outData[idx+2]=rgb.b; outData[idx+3]=205;
      filled++;
      const x=pos%w, y=(pos-x)/w;
      if(x>0) stack.push(pos-1);
      if(x<w-1) stack.push(pos+1);
      if(y>0) stack.push(pos-w);
      if(y<h-1) stack.push(pos+w);
    }
    if(!filled) return setStatus('No fillable space found there.','danger');
    octx.putImageData(outImg,0,0);
    const b=normBox(target);
    panel().objects.push(makeObj('image',b.x,b.y,b.w,b.h,{src:out.toDataURL('image/png'),naturalW:w,naturalH:h,fill:'none',stroke:'none',strokeWidth:0,opacity:1,coloringPaintFor:target.id,clipBox:{x:b.x,y:b.y,w:b.w,h:b.h}}));
    selectedIds=[target.id];
    render();
    saveState();
    setStatus('Color poured into the selected space.','success');
  }catch(err){
    setStatus((err&&err.message)||'Bucket fill failed.','danger');
  }
}
function appendSprayDots(o,p,count=18){
  const radius=Math.max(8,coloringPaintWidth*.72);
  let d=o.d||'';
  for(let i=0;i<count;i++){
    const a=Math.random()*Math.PI*2, rr=radius*Math.sqrt(Math.random()), x=p.x+Math.cos(a)*rr, y=p.y+Math.sin(a)*rr, dx=0.01;
    d+=` M ${Math.round(x*100)/100} ${Math.round(y*100)/100} L ${Math.round((x+dx)*100)/100} ${Math.round(y*100)/100}`;
  }
  o.d=d;
}
function startColoringStroke(p){
  const target=selectedColoringPage();
  if(!target) return false;
  const b=normBox(target);
  if(!pointInBox(p,b)) return false;
  if(coloringPaintMode==='bucket'){startColoringBucketFill(p,target); return true}
  if(coloringPaintMode==='spray'){
    drawing={id:id(),type:'path',d:'',x:p.x,y:p.y,w:1,h:1,locked:false,stroke:coloringPaintColor,strokeWidth:Math.max(2,coloringPaintWidth/5),fill:'none',fillPattern:'',opacity:.62,coloringPaintFor:target.id,coloringSpray:true,clipBox:{x:b.x,y:b.y,w:b.w,h:b.h}};
    appendSprayDots(drawing,p,24);
  } else {
    drawing={id:id(),type:'path',d:`M ${p.x} ${p.y}`,x:p.x,y:p.y,w:1,h:1,locked:false,stroke:coloringPaintColor,strokeWidth:coloringPaintWidth,fill:'none',fillPattern:'',opacity:.72,coloringPaintFor:target.id,clipBox:{x:b.x,y:b.y,w:b.w,h:b.h}};
  }
  panel().objects.push(drawing);
  selectedIds=[target.id];
  requestRender();
  return true;
}
function ensureSelectionAlignPopover(){
  let pop=document.getElementById('selectionAlignPopover');
  if(pop) return pop;
  const shell=document.querySelector('.canvas-shell');
  if(!shell) return null;
  pop=document.createElement('div');
  pop.id='selectionAlignPopover';
  pop.className='selection-align-popover';
  pop.setAttribute('role','toolbar');
  pop.setAttribute('aria-label','Object alignment');
  pop.innerHTML='<div class="selection-align-title">Object align</div><div class="selection-align-grid"><button type="button" data-align-mode="left" aria-label="Align left">Left</button><button type="button" data-align-mode="centerH" aria-label="Align horizontal centers">Center H</button><button type="button" data-align-mode="right" aria-label="Align right">Right</button><button type="button" data-align-mode="top" aria-label="Align top">Top</button><button type="button" data-align-mode="middleV" aria-label="Align vertical centers">Middle V</button><button type="button" data-align-mode="bottom" aria-label="Align bottom">Bottom</button></div>';
  pop.addEventListener('pointerdown',e=>e.stopPropagation());
  pop.addEventListener('click',e=>{
    const btn=e.target.closest('[data-align-mode]');
    if(!btn) return;
    alignSelectedObjects(btn.dataset.alignMode);
  });
  shell.appendChild(pop);
  return pop;
}
function refreshSelectionAlignPopover(){
  const pop=ensureSelectionAlignPopover();
  if(!pop) return;
  const ids=selectedResizableIds();
  const visible=ids.length>1&&!inlineEditId&&!drag&&!drawing&&!marquee;
  pop.classList.toggle('show',visible);
  if(!visible) return;
  const shell=document.querySelector('.canvas-shell'), b=selectionBounds(ids);
  if(!shell||!b) return;
  const shellRect=shell.getBoundingClientRect();
  const svgRect=svg.getBoundingClientRect();
  const popRect=pop.getBoundingClientRect();
  const centerX=svgRect.left-shellRect.left+(b.x+b.w/2)*zoom;
  const selectionTop=svgRect.top-shellRect.top+b.y*zoom;
  const selectionBottom=svgRect.top-shellRect.top+(b.y+b.h)*zoom;
  const w=popRect.width||330, h=popRect.height||120, margin=10;
  const maxLeft=Math.max(margin,shellRect.width-w-margin);
  const left=Math.min(maxLeft,Math.max(margin,centerX-w/2));
  const topAbove=selectionTop-h-margin;
  const top=topAbove>=margin?topAbove:Math.min(shellRect.height-h-margin,selectionBottom+margin);
  pop.style.left=left+'px';
  pop.style.top=Math.max(margin,top)+'px';
}
function refreshSelectionToolbar(){
  const tb=document.getElementById('selectionToolbar');
  if(!tb) return;
  const visible=selectedIds.length>0&&!inlineEditId;
  tb.classList.toggle('show',visible);
  if(visible){
    const o=currentObj(), editable=o&&TEXTABLE_TYPES.includes(o.type)&&canEditObject(o), cropable=o&&o.type==='image'&&canEditObject(o), concept=o&&o.conceptNode&&canEditObject(o), connector=o&&o.type==='connector'&&canEditObject(o);
    const editBtn=document.getElementById('floatEditBtn'); if(editBtn) editBtn.style.display=editable?'inline-flex':'none';
    const cropBtn=document.getElementById('floatCropBtn'); if(cropBtn) cropBtn.style.display=cropable?'inline-flex':'none';
    const childBtn=document.getElementById('floatConceptChildBtn'); if(childBtn) childBtn.style.display=concept?'inline-flex':'none';
    const linkBtn=document.getElementById('floatConceptLinkBtn'); if(linkBtn) linkBtn.style.display=concept?'inline-flex':'none';
    const imageBtn=ensureConceptImageToolbarButton(); if(imageBtn) imageBtn.style.display=concept?'inline-flex':'none';
    const labelBtn=ensureConnectorLabelToolbarButton(); if(labelBtn) labelBtn.style.display=connector?'inline-flex':'none';
  }
  refreshSelectionAlignPopover();
  refreshColoringPaintToolbar();
  refreshConceptCanvasControls?.();
}
function syncSimpleColor(){const inp=document.getElementById('simpleColorInput'); const color=tool==='sticky'?(ui.stickyColor?.value||'#fff59d'):(ui.strokeColor?.value||'#1E398D'); if(inp) inp.value=color; updateToolColorPaletteActive(color)}
function paintColor(){return ui.strokeColor?.value||gid('simpleColorInput')?.value||'#7c3aed'}
function setPaintColor(color){
  if(ui.strokeColor) ui.strokeColor.value=color;
  if(ui.fillColor) ui.fillColor.value=color;
  const simple=gid('simpleColorInput'); if(simple) simple.value=color;
  updateDotPaintPaletteActive(color);
  updateToolColorPaletteActive(color);
}
function updateDotPaintPaletteActive(color=paintColor()){
  document.querySelectorAll('[data-dot-color]').forEach(btn=>btn.classList.toggle('active',btn.dataset.dotColor?.toLowerCase()===String(color).toLowerCase()));
}
function ensureDotPaintPalette(){
  let pop=gid('dotPaintPalette');
  if(pop) return pop;
  pop=document.createElement('div');
  pop.id='dotPaintPalette';
  pop.className='dot-paint-palette';
  pop.setAttribute('role','dialog');
  pop.setAttribute('aria-label','Dot paint colors');
  pop.innerHTML=DOT_PALETTE.map(color=>`<button type="button" class="dot-paint-swatch" data-dot-color="${color}" aria-label="Paint ${color}" style="--dot-color:${color}"></button>`).join('')+'<input type="color" id="dotPaintCustomColor" aria-label="Custom dot color" title="Custom color">';
  document.body.appendChild(pop);
  pop.querySelectorAll('[data-dot-color]').forEach(btn=>btn.addEventListener('click',()=>paintDotWith(btn.dataset.dotColor)));
  pop.querySelector('#dotPaintCustomColor')?.addEventListener('input',e=>paintDotWith(e.target.value,false));
  pop.querySelector('#dotPaintCustomColor')?.addEventListener('change',e=>paintDotWith(e.target.value,true));
  return pop;
}
function openDotPaintPalette(objId,evt){
  dotPaintTargetId=objId;
  const pop=ensureDotPaintPalette();
  const color=paintColor();
  const custom=gid('dotPaintCustomColor'); if(custom) custom.value=color;
  updateDotPaintPaletteActive(color);
  const x=evt?.clientX??window.innerWidth/2, y=evt?.clientY??window.innerHeight/2;
  pop.style.left=Math.min(window.innerWidth-230,Math.max(8,x+12))+'px';
  pop.style.top=Math.min(window.innerHeight-120,Math.max(8,y+12))+'px';
  pop.classList.add('show');
}
function closeDotPaintPalette(){gid('dotPaintPalette')?.classList.remove('show'); dotPaintTargetId=null}
function paintDotWith(color,close=true){
  const o=findObj(dotPaintTargetId);
  setPaintColor(color);
  if(o&&o.type==='dot'&&canEditObject(o)){
    o.fill=color;
    o.fillPattern='';
    selectedIds=[o.id];
    render();
    saveState();
  }
  if(close) closeDotPaintPalette();
}
function paintDotObject(o,color=paintColor()){
  if(!o||o.type!=='dot'||!canEditObject(o)) return false;
  if(o.fill===color&&o.fillPattern==='') return false;
  o.fill=color;
  o.fillPattern='';
  return true;
}
function dotAtPoint(x,y){
  const objs=[...panel().objects].reverse();
  return objs.find(o=>{
    if(o.type!=='dot'||!canEditObject(o)) return false;
    const b=normBox(o), cx=b.x+b.w/2, cy=b.y+b.h/2, r=Math.max(3,Math.min(b.w,b.h)/2)+3;
    return Math.hypot(x-cx,y-cy)<=r;
  })||null;
}
function paintDotAtPoint(x,y){
  const o=dotAtPoint(x,y);
  if(!o||dotPaintDrag?.painted?.has(o.id)) return false;
  const changed=paintDotObject(o,dotPaintDrag?.color||paintColor());
  if(changed){
    dotPaintDrag?.painted?.add(o.id);
    selectedIds=[o.id];
    requestRender();
  }
  return changed;
}
function buildDotPaintInlinePalette(){
  const wrap=gid('dotPaintInlinePalette');
  if(!wrap) return;
  wrap.innerHTML=DOT_PALETTE.map(color=>`<button type="button" class="dot-paint-swatch" data-dot-color="${color}" aria-label="Use ${color}" style="--dot-color:${color}"></button>`).join('')+'<input type="color" id="dotPaintInlineColor" aria-label="Custom dot color" title="Custom color">';
  wrap.querySelectorAll('[data-dot-color]').forEach(btn=>btn.addEventListener('click',()=>{setPaintColor(btn.dataset.dotColor); setTool('dotpaint')}));
  wrap.querySelector('#dotPaintInlineColor')?.addEventListener('input',e=>{setPaintColor(e.target.value); setTool('dotpaint')});
  updateDotPaintPaletteActive();
}
function syncSimpleStickyPalette(){document.querySelectorAll('.sticky-color-swatch').forEach(btn=>btn.classList.toggle('active',btn.dataset.stickyColor===(ui.stickyColor?.value||'')))}
function buildStickyPalette(className){
  const palette=document.createElement('div'); palette.className=className; palette.setAttribute('aria-label','Sticky note colors');
  [['#fff59d','Yellow'],['#bae6fd','Blue'],['#bbf7d0','Green'],['#fecdd3','Pink'],['#fed7aa','Orange']].forEach(([color,label])=>{const b=document.createElement('button'); b.type='button'; b.className='sticky-color-swatch'; b.dataset.stickyColor=color; b.style.setProperty('--swatch',color); b.setAttribute('aria-label',label+' sticky note'); b.setAttribute('title',label+' sticky note'); b.addEventListener('click',()=>{if(ui.stickyColor){ui.stickyColor.value=color; ui.stickyColor.dispatchEvent(new Event('change',{bubbles:true}))} setTool('sticky'); syncSimpleColor(); syncSimpleStickyPalette()}); palette.appendChild(b)});
  return palette;
}
function updateToolColorPaletteActive(color=paintColor()){
  document.querySelectorAll('[data-tool-color]').forEach(btn=>btn.classList.toggle('active',btn.dataset.toolColor?.toLowerCase()===String(color).toLowerCase()));
}
function buildToolColorPalette(){
  const palette=document.createElement('div');
  palette.className='tool-color-palette';
  palette.setAttribute('aria-label','Drawing colors');
  palette.innerHTML=DOT_PALETTE.map(color=>`<button type="button" class="tool-color-swatch" data-tool-color="${color}" aria-label="Use ${color}" style="--tool-color:${color}"></button>`).join('')+'<input type="color" class="tool-color-custom" id="toolCustomColor" aria-label="Custom drawing color" title="Custom color">';
  const choose=color=>{setPaintColor(color); if(selectedIds.length) ui.strokeColor?.dispatchEvent(new Event('input',{bubbles:true}))};
  palette.querySelectorAll('[data-tool-color]').forEach(btn=>btn.addEventListener('click',()=>choose(btn.dataset.toolColor)));
  palette.querySelector('#toolCustomColor')?.addEventListener('input',e=>choose(e.target.value));
  updateToolColorPaletteActive();
  return palette;
}
function eraserWidthLabel(){
  const current=+ui.strokeWidth?.value||4;
  const exact=ERASER_SIZE_CHOICES.find(([,width])=>width===current);
  if(exact) return exact[0];
  return current<12?'Small':(current<28?'Bigger':'Biggest');
}
function refreshEraserSizeControls(){
  const wrap=gid('eraserSizeControls');
  if(wrap) wrap.hidden=tool!=='eraser';
  const current=+ui.strokeWidth?.value||4;
  document.querySelectorAll('[data-eraser-width]').forEach(btn=>btn.classList.toggle('active',+btn.dataset.eraserWidth===current));
}
function setEraserWidth(width,label){
  eraserStrokeWidth=width;
  if(ui.strokeWidth) ui.strokeWidth.value=String(width);
  refreshEraserSizeControls();
  setTool('eraser');
  setStatus('Eraser thickness updated.','success');
}
function buildEraserSizeControls(){
  const wrap=document.createElement('div');
  wrap.id='eraserSizeControls';
  wrap.className='eraser-size-controls';
  wrap.hidden=true;
  wrap.setAttribute('aria-label','Eraser thickness');
  wrap.innerHTML='<span>Eraser</span>'+ERASER_SIZE_CHOICES.map(([label,width],index)=>`<button type="button" data-eraser-width="${width}" aria-label="${label} eraser"><span class="eraser-size-dot eraser-size-dot-${index+1}" aria-hidden="true"></span></button>`).join('');
  wrap.querySelectorAll('[data-eraser-width]').forEach(btn=>btn.addEventListener('click',event=>{
    event.stopPropagation();
    setEraserWidth(+btn.dataset.eraserWidth,btn.textContent);
  }));
  refreshEraserSizeControls();
  return wrap;
}
// Pen thickness presets — same shape as the eraser controls. The wrapper
// hides itself unless the pen tool is active so the popover stays tidy.
function refreshPenSizeControls(){
  const wrap=gid('penSizeControls');
  if(wrap) wrap.hidden=tool!=='pen';
  const current=+ui.strokeWidth?.value||penStrokeWidth;
  document.querySelectorAll('[data-pen-width]').forEach(btn=>btn.classList.toggle('active',+btn.dataset.penWidth===current));
}
function setPenWidth(width){
  penStrokeWidth=width;
  if(ui.strokeWidth) ui.strokeWidth.value=String(width);
  refreshPenSizeControls();
  setTool('pen');
  setStatus('Pencil thickness updated.','success');
}
function buildPenSizeControls(){
  const wrap=document.createElement('div');
  wrap.id='penSizeControls';
  wrap.className='eraser-size-controls pen-size-controls';
  wrap.hidden=true;
  wrap.setAttribute('aria-label','Pencil thickness');
  wrap.innerHTML='<span>Pencil</span>'+PEN_SIZE_CHOICES.map(([label,width],index)=>`<button type="button" data-pen-width="${width}" aria-label="${label} pencil" title="${label}"><span class="eraser-size-dot pen-size-dot-${index+1}" aria-hidden="true"></span></button>`).join('');
  wrap.querySelectorAll('[data-pen-width]').forEach(btn=>btn.addEventListener('click',event=>{
    event.stopPropagation();
    setPenWidth(+btn.dataset.penWidth);
  }));
  refreshPenSizeControls();
  return wrap;
}

/* Runtime UI assembly. The HTML keeps stable IDs for event handlers; these
   helpers add extra simple-mode buttons, sticky palettes, and top menus after
   the base DOM loads so translated entry pages can share one app.js. */
function ensureSimpleExtras(){
  const grid=document.querySelector('.simple-tools .grid.simple-only');
  if(!grid||grid.dataset.extrasReady==='1') return;
  grid.dataset.extrasReady='1';
  const graph=document.createElement('button'); graph.id='simpleGraphBtn'; graph.type='button'; graph.textContent=gt('creator'); graph.addEventListener('click',()=>gid('openGraphDialogBtn')?.click());
  const pictureGraph=document.createElement('button'); pictureGraph.id='simplePictureGraphBtn'; pictureGraph.type='button'; pictureGraph.textContent=gt('pictureGraph'); pictureGraph.addEventListener('click',()=>openPictureGraphDialog());
  const widgets=document.createElement('button'); widgets.id='simpleClassroomWidgetsBtn'; widgets.type='button'; widgets.textContent='Classroom Widgets'; widgets.addEventListener('click',()=>openClassroomWidgetPicker());
  const spinner=document.createElement('button'); spinner.id='simpleWheelSpinnerBtn'; spinner.type='button'; spinner.textContent='Wheel Spinner'; spinner.addEventListener('click',()=>insertClassroomWidget('wheelspinner'));
  const coloring=document.createElement('button'); coloring.id='simpleColoringBookBtn'; coloring.type='button'; coloring.textContent='Coloring Book'; coloring.addEventListener('click',()=>openColoringBookDialog());
  const mosaic=document.createElement('button'); mosaic.id='simpleMosaicBtn'; mosaic.type='button'; mosaic.textContent='Mosaic'; mosaic.addEventListener('click',()=>gid('openMosaicDialogBtn')?.click());
  const collage=document.createElement('button'); collage.id='simpleCollageBtn'; collage.type='button'; collage.textContent='Collage'; collage.addEventListener('click',()=>gid('openCollageDialogBtn')?.click());
  const mer=document.createElement('button'); mer.id='simpleMermaidBtn'; mer.type='button'; mer.textContent='Mermaid Diagram'; mer.addEventListener('click',()=>gid('insertMermaidBtn')?.click());
  const wc=document.createElement('button'); wc.id='simpleWordCloudBtn'; wc.type='button'; wc.textContent='Word Cloud'; wc.addEventListener('click',()=>gid('insertWordCloudBtn')?.click());
  const dots=document.createElement('button'); dots.id='simpleDotPicturesBtn'; dots.type='button'; dots.textContent='Dot Pictures'; dots.addEventListener('click',()=>gid('openDotPictureLibraryBtn')?.click());
  const emoji=document.createElement('button'); emoji.id='simpleEmojiBtn'; emoji.type='button'; emoji.textContent='Emoji Mixer'; emoji.addEventListener('click',()=>gid('openEmojiDialogBtn')?.click());
  const gif=document.createElement('button'); gif.id='simpleGifBtn'; gif.type='button'; gif.textContent='Create GIF'; gif.addEventListener('click',()=>gid('openGifDialogBtn')?.click());
  const concept=document.createElement('button'); concept.id='simpleConceptMapBtn'; concept.type='button'; concept.textContent='Concept Map'; concept.addEventListener('click',()=>insertNativeConceptMap());
  const palette=buildStickyPalette('simple-sticky-palette');
  palette.id='simpleStickyPalette';
  const stickyTool=document.querySelector('#toolButtons [data-tool="sticky"]');
  if(stickyTool&&stickyTool.parentNode) stickyTool.insertAdjacentElement('afterend',palette);
  const ref=gid('simpleDeleteBtn')||gid('simpleTntBtn');
  grid.insertBefore(graph,ref);
  grid.insertBefore(pictureGraph,ref);
  grid.insertBefore(widgets,ref);
  grid.insertBefore(spinner,ref);
  grid.insertBefore(coloring,ref);
  grid.insertBefore(mosaic,ref);
  grid.insertBefore(collage,ref);
  grid.insertBefore(mer,ref);
  grid.insertBefore(wc,ref);
  grid.insertBefore(concept,ref);
  grid.insertBefore(dots,ref);
  grid.insertBefore(emoji,ref);
  grid.insertBefore(gif,ref);
  syncSimpleStickyPalette();
}
function ensureColoringBookButton(){
  if(gid('openColoringBookDialogBtn')) return;
  const anchor=gid('imageBtn')||gid('openGraphDialogBtn');
  if(!anchor||!anchor.parentElement) return;
  const btn=document.createElement('button');
  btn.id='openColoringBookDialogBtn';
  btn.type='button';
  btn.textContent='Coloring Book';
  btn.addEventListener('click',()=>openColoringBookDialog());
  anchor.insertAdjacentElement('afterend',btn);
}
function ensurePictureGraphButton(){
  if(gid('openPictureGraphDialogBtn')) return;
  const graph=gid('openGraphDialogBtn');
  if(!graph||!graph.parentElement) return;
  const btn=document.createElement('button');
  btn.id='openPictureGraphDialogBtn';
  btn.type='button';
  btn.textContent=gt('pictureGraph');
  btn.addEventListener('click',()=>openPictureGraphDialog());
  graph.insertAdjacentElement('afterend',btn);
}
function ensureConceptMapButton(){
  if(gid('openConceptMapDialogBtn')) return;
  const anchor=gid('insertWordCloudBtn')||gid('insertMermaidBtn')||gid('openCollageDialogBtn');
  if(!anchor||!anchor.parentElement) return;
  const btn=document.createElement('button');
  btn.id='openConceptMapDialogBtn';
  btn.type='button';
  btn.textContent='Concept Map';
  btn.dataset.ui='advanced';
  btn.addEventListener('click',()=>insertNativeConceptMap());
  anchor.insertAdjacentElement('afterend',btn);
}
function ensureAdvancedStickyPalette(){
  const stickySelect=gid('stickyColor');
  if(!stickySelect||gid('advancedStickyPalette')) return;
  const row=stickySelect.closest('.row');
  if(!row) return;
  const palette=buildStickyPalette('advanced-sticky-palette');
  palette.id='advancedStickyPalette';
  row.insertAdjacentElement('afterend',palette);
  syncSimpleStickyPalette();
}
function ensureTopMenus(){
  const header=document.querySelector('header');
  if(!header||gid('topMenuBar')) return;
  const menuDefs=[
    ['File',[['Save File','saveLocalBtn'],['Load File','loadLocalBtn'],['Import Panels...','importPanelsBtn'],['Export PNG','exportBtn'],['Export PDF','exportPdfBtn'],['Save to Google','saveDriveBtn'],['Load from Google','loadDriveBtn'],['divider'],['Save Restore Point','saveRestorePointBtn'],['Restore Point','restorePointBtn']]],
    ['Edit',[['Undo','undoBtn'],['Redo','redoBtn'],['Duplicate','duplicateBtn'],['Delete Selected','deleteBtn'],['Group','groupBtn'],['Ungroup','ungroupBtn'],['Align Left','alignLeftBtn'],['Align Center Horizontally','alignCenterHBtn'],['Align Right','alignRightBtn'],['Align Top','alignTopBtn'],['Align Middle Vertically','alignMiddleVBtn'],['Align Bottom','alignBottomBtn'],['Bring Front','frontBtn'],['Send Back','backBtn']]],
    ['Insert',[['Load Image','imageBtn'],['Coloring Book','openColoringBookDialogBtn'],['Mosaic Images','openMosaicDialogBtn'],['Collage','openCollageDialogBtn','collageSubmenu'],['divider'],[gt('creator'),'openGraphDialogBtn'],[gt('pictureGraph'),'openPictureGraphDialogBtn'],['Mermaid Diagram','insertMermaidBtn'],['Word Cloud','insertWordCloudBtn'],['Concept Map','openConceptMapDialogBtn'],['Emoji Mixer','openEmojiDialogBtn'],['ScratchArt','scratchCoverBtn'],['divider'],['Dot Pictures','openDotPictureLibraryBtn','dotPictureSubmenu'],['divider'],['Insert Sticker','insertStickerBtn'],['Custom Sticker','createCustomStickerBtn']]],
    ['Tools',[['Create GIF','openGifDialogBtn'],['Classroom Widgets','openClassroomWidgetsBtn'],['divider'],['Set Background','loadBgImageBtn'],['Clear Background','clearBgImageBtn'],['Remove BG Color','removeBgColorBtn'],['divider'],['Built-in Layouts','insertTemplateBtn','layoutSubmenu'],['Save Current Frame as Reusable Template','saveTemplateBtn'],['Open Reusable Frame Templates','loadTemplateGalleryBtn'],['divider'],['TNT Reset','tntBtn']]],
    ['Options',[['View','viewToggleBtn','viewSubmenu'],['Inspector','inspectorToggleBtn'],['Keyboard Shortcuts','shortcutsBtn'],['Mode','optionsBtn'],['About','aboutBtn']]]
  ];
  const nav=document.createElement('nav');
  nav.id='topMenuBar';
  nav.className='top-menubar';
  nav.setAttribute('aria-label','Application menus');
  menuDefs.forEach(([title,items])=>{
    const details=document.createElement('details');
    details.className='top-menu';
    const summary=document.createElement('summary');
    summary.textContent=title;
    details.appendChild(summary);
    details.addEventListener('toggle',()=>{if(details.open) nav.querySelectorAll('details[open]').forEach(d=>{if(d!==details)d.open=false})});
    const list=document.createElement('div');
    list.className='top-menu-list';
    items.forEach(([label,target,submenu])=>{
      if(label==='divider'){
        const divider=document.createElement('div');
        divider.className='top-menu-divider';
        divider.setAttribute('role','separator');
        list.appendChild(divider);
        return;
      }
      if(submenu==='viewSubmenu'){
        const row=document.createElement('div');
        row.className='top-menu-submenu';
        const btn=document.createElement('button');
        btn.type='button';
        btn.textContent=label;
        btn.dataset.menuTarget=target;
        const panel=document.createElement('div');
        panel.className='top-submenu-list';
        [['Simple View','simple'],['Advanced View','advanced']].forEach(([choiceLabel,mode])=>{
          const choice=document.createElement('button');
          choice.type='button';
          choice.textContent=choiceLabel;
          choice.addEventListener('click',()=>{
            if(ui.interfaceMode) ui.interfaceMode.value=mode;
            applyInterfaceMode(mode);
            refreshViewToggle?.();
            nav.querySelectorAll('details[open]').forEach(d=>d.open=false);
          });
          panel.appendChild(choice);
        });
        row.appendChild(btn);
        row.appendChild(panel);
        list.appendChild(row);
        return;
      }
      if(submenu==='layoutSubmenu'){
        const row=document.createElement('div');
        row.className='top-menu-submenu';
        const btn=document.createElement('button');
        btn.type='button';
        btn.textContent=label;
        btn.dataset.menuTarget=target;
        const panel=document.createElement('div');
        panel.className='top-submenu-list';
        const sel=gid('templateSelect');
        const options=sel?[...sel.options]:[];
        options.forEach(opt=>{
          const layoutRow=document.createElement('div');
          layoutRow.className='top-menu-submenu';
          const layoutBtn=document.createElement('button');
          layoutBtn.type='button';
          layoutBtn.textContent=opt.textContent;
          const actionPanel=document.createElement('div');
          actionPanel.className='top-submenu-list';
          [['Add to Current Frame','insertTemplateBtn'],['New Frame from Layout','newTemplatePanelBtn']].forEach(([actionLabel,actionTarget])=>{
            const action=document.createElement('button');
            action.type='button';
            action.textContent=actionLabel;
            action.addEventListener('click',()=>{if(sel) sel.value=opt.value; nav.querySelectorAll('details[open]').forEach(d=>d.open=false); gid(actionTarget)?.click()});
            actionPanel.appendChild(action);
          });
          layoutRow.appendChild(layoutBtn);
          layoutRow.appendChild(actionPanel);
          panel.appendChild(layoutRow);
        });
        row.appendChild(btn);
        row.appendChild(panel);
        list.appendChild(row);
        return;
      }
      if(submenu==='dotPictureSubmenu'){
        const row=document.createElement('div');
        row.className='top-menu-submenu';
        const btn=document.createElement('button');
        btn.type='button';
        btn.textContent=label;
        btn.dataset.menuTarget=target;
        const panel=document.createElement('div');
        panel.className='top-submenu-list';
        const open=document.createElement('button');
        open.type='button';
        open.textContent='Open Library';
        open.addEventListener('click',()=>{nav.querySelectorAll('details[open]').forEach(d=>d.open=false); gid(target)?.click()});
        panel.appendChild(open);
        const paint=document.createElement('button');
        paint.type='button';
        paint.textContent='Paint Dots';
        paint.addEventListener('click',()=>{nav.querySelectorAll('details[open]').forEach(d=>d.open=false); gid('activateDotPaintBtn')?.click()});
        panel.appendChild(paint);
        const divider=document.createElement('div');
        divider.className='top-menu-divider';
        divider.setAttribute('role','separator');
        panel.appendChild(divider);
        DOT_PICTURES.forEach(tpl=>{
          const choice=document.createElement('button');
          choice.type='button';
          choice.textContent=tpl.label;
          choice.addEventListener('click',()=>{
            const sel=gid('dotPictureSelect');
            if(sel) sel.value=tpl.id;
            nav.querySelectorAll('details[open]').forEach(d=>d.open=false);
            insertDotPicture(tpl.id);
          });
          panel.appendChild(choice);
        });
        row.appendChild(btn);
        row.appendChild(panel);
        list.appendChild(row);
        return;
      }
      if(submenu==='collageSubmenu'){
        const row=document.createElement('div');
        row.className='top-menu-submenu';
        const btn=document.createElement('button');
        btn.type='button';
        btn.textContent=label;
        btn.dataset.menuTarget=target;
        const panel=document.createElement('div');
        panel.className='top-submenu-list';
        [['Open Builder',''],['Two Column','two'],['Feature + Two','feature'],['Four Grid','grid4'],['Story Strip','strip']].forEach(([choiceLabel,layout])=>{
          const choice=document.createElement('button');
          choice.type='button';
          choice.textContent=choiceLabel;
          choice.addEventListener('click',()=>{
            const sel=gid('collageLayout');
            if(sel&&layout) sel.value=layout;
            nav.querySelectorAll('details[open]').forEach(d=>d.open=false);
            gid(target)?.click();
          });
          panel.appendChild(choice);
        });
        row.appendChild(btn);
        row.appendChild(panel);
        list.appendChild(row);
        return;
      }
      const btn=document.createElement('button');
      btn.type='button';
      btn.textContent=label;
      btn.dataset.menuTarget=target;
      const src=gid(target);
      if(src?.classList.contains('teacher-only')||src?.closest('.teacher-only')) btn.classList.add('teacher-only');
      btn.addEventListener('click',()=>{
        nav.querySelectorAll('details[open]').forEach(d=>d.open=false);
        const actions={alignLeftBtn:()=>alignSelectedObjects('left'),alignCenterHBtn:()=>alignSelectedObjects('centerH'),alignRightBtn:()=>alignSelectedObjects('right'),alignTopBtn:()=>alignSelectedObjects('top'),alignMiddleVBtn:()=>alignSelectedObjects('middleV'),alignBottomBtn:()=>alignSelectedObjects('bottom')};
        if(actions[target]) actions[target]();
        else gid(target)?.click();
      });
      list.appendChild(btn);
    });
    if(title==='Options'){
      const lang=gid('languageSwitcher');
      if(lang){
        const wrap=document.createElement('label');
        wrap.className='top-menu-select';
        wrap.textContent='Language';
        wrap.appendChild(lang);
        list.appendChild(wrap);
      }
    }
    details.appendChild(list);
    nav.appendChild(details);
  });
  const anchor=gid('saveStateChip')||header.querySelector('h1');
  anchor?.insertAdjacentElement('afterend',nav);
  ['undoBtn','redoBtn','shortcutsBtn','viewToggleBtn','optionsBtn','aboutBtn','inspectorToggleBtn','moreOptionsBtn','saveDriveBtn','exportBtn','exportPdfBtn','tntBtn'].forEach(idv=>gid(idv)?.classList.add('top-menu-source-hidden'));
  document.addEventListener('click',e=>{if(nav.contains(e.target)) return; nav.querySelectorAll('details[open]').forEach(d=>d.open=false)});
  document.addEventListener('keydown',e=>{if(e.key==='Escape') nav.querySelectorAll('details[open]').forEach(d=>d.open=false)});
}
function hideSidebarTemplateSection(){
  const summary=[...document.querySelectorAll('.sidebar .section-collapsible>summary')].find(el=>el.textContent.trim()==='Templates');
  summary?.parentElement?.classList.add('templates-section-hidden');
}

/* Classroom launch/session helpers. Student share links can lock the UI into
   student mode, prefill the collaboration room, and hide Google admin fields. */
function storageMode(){try{return localStorage.getItem(STORAGE_MODE_KEY)||'google'}catch(_){return 'google'}}
function storageAllowsGoogle(){return storageMode()==='google'}
function googleScriptUrl(){if(!storageAllowsGoogle()) return ''; const url=(ui.scriptUrl?.value||DEFAULT_GOOGLE_SCRIPT_URL||'').trim(); return url===GOOGLE_SCRIPT_URL_PLACEHOLDER?'':url}
function refreshSessionExpiry(){
  if(storageMode()!=='browser-session') return;
  try{
    const hours=Math.max(1,parseInt(localStorage.getItem(SESSION_HOURS_KEY)||'24',10));
    localStorage.setItem(SESSION_EXPIRES_KEY,String(Date.now()+hours*60*60*1000));
  }catch(_){}
}
function clearAutosaveStorage(){
  try{localStorage.removeItem('drawsplat.autosave')}catch(_){}
  try{if(typeof idbPut==='function') idbPut(null)}catch(_){}
}
function expireBrowserSessionIfNeeded(){
  if(storageMode()!=='browser-session') return false;
  try{
    const expires=parseInt(localStorage.getItem(SESSION_EXPIRES_KEY)||'0',10);
    if(expires&&Date.now()>expires){
      clearAutosaveStorage();
      localStorage.removeItem(SESSION_EXPIRES_KEY);
      setStatus('Previous browser-only session expired and was cleared.','success');
      return true;
    }
    if(!expires) refreshSessionExpiry();
  }catch(_){}
  return false;
}
function cloudPassword(){return (gid('cloudPassword')?.value||'').trim()}
function enforceRoleLock(){
  if(roleLock!=='student') return;
  board.mode='student';
  board.assignmentMode=true;
  board.currentLayer='student';
  board.showAnswerKey=false;
}
function ensureCloudClassroomControls(){
  const room=gid('collabRoom');
  if(!room||gid('cloudPassword')) return;
  const roomRow=room.closest('.row');
  const passRow=document.createElement('div');
  passRow.className='row';
  passRow.innerHTML='<label>Password</label><input id="cloudPassword" type="password" autocomplete="current-password" placeholder="Optional room password">';
  roomRow?.insertAdjacentElement('afterend',passRow);
  const actions=document.createElement('div');
  actions.className='grid teacher-only';
  actions.innerHTML='<button id="createStudentLinkBtn" type="button">Copy Student Link</button>';
  passRow.insertAdjacentElement('afterend',actions);
  ui.cloudPassword=gid('cloudPassword');
  gid('createStudentLinkBtn')?.addEventListener('click',copyStudentShareLink);
}
const BACKGROUND_TEMPLATES={
  'kwl-chart':appPath('assets/backgrounds/kwl-chart.svg'),
  'frayer-model':appPath('assets/backgrounds/frayer-model.svg'),
  't-chart':appPath('assets/backgrounds/t-chart.svg'),
  'storyboard':appPath('assets/backgrounds/storyboard.svg'),
  'venn-diagram':appPath('assets/backgrounds/venn-diagram.svg'),
  'timeline':appPath('assets/backgrounds/timeline.svg'),
  'cornell-notes':appPath('assets/backgrounds/cornell-notes.svg'),
  'exit-ticket':appPath('assets/backgrounds/exit-ticket.svg'),
  'lab-notes':appPath('assets/backgrounds/lab-notes.svg'),
  'vocabulary-builder':appPath('assets/backgrounds/vocabulary-builder.svg'),
  'coordinate-plane':appPath('assets/backgrounds/coordinate-plane.svg'),
  'reading-response':appPath('assets/backgrounds/reading-response.svg'),
  'choice-board':appPath('assets/backgrounds/choice-board.svg'),
  'blank-anchor-chart':appPath('assets/backgrounds/blank-anchor-chart.svg')
};
const BACKGROUND_TEMPLATE_TEXT={
  es:{'Know':'Sé','Want to Know':'Quiero saber','Learned':'Aprendí','Side A':'Lado A','Side B':'Lado B','Lab Notes':'Notas de laboratorio','Question':'Pregunta','Hypothesis':'Hipótesis','Evidence / Data':'Evidencia / Datos','Conclusion':'Conclusión','Word':'Palabra','Summary':'Resumen','Text Evidence':'Evidencia del texto','Cornell Notes':'Notas Cornell','Cues / Questions':'Pistas / Preguntas','Notes':'Notas','Exit Ticket':'Boleto de salida',"How I feel about today's learning:":'Cómo me siento sobre el aprendizaje de hoy:','Anchor Chart Title':'Título del cartel','Choice Board':'Tablero de opciones','Word / Concept':'Palabra / Concepto','Definition':'Definición','Characteristics':'Características','Examples':'Ejemplos','Non-Examples':'No ejemplos','Event 1':'Evento 1','Event 2':'Evento 2','Event 3':'Evento 3','Event 4':'Evento 4','Event 5':'Evento 5','Event 6':'Evento 6'},
  vi:{'Know':'Đã biết','Want to Know':'Muốn biết','Learned':'Đã học','Side A':'Bên A','Side B':'Bên B','Lab Notes':'Ghi chú thí nghiệm','Question':'Câu hỏi','Hypothesis':'Giả thuyết','Evidence / Data':'Bằng chứng / Dữ liệu','Conclusion':'Kết luận','Word':'Từ','Summary':'Tóm tắt','Text Evidence':'Bằng chứng văn bản','Cornell Notes':'Ghi chú Cornell','Cues / Questions':'Gợi ý / Câu hỏi','Notes':'Ghi chú','Exit Ticket':'Phiếu ra lớp',"How I feel about today's learning:":'Cảm nhận của em về bài học hôm nay:','Anchor Chart Title':'Tiêu đề biểu đồ','Choice Board':'Bảng lựa chọn','Word / Concept':'Từ / Khái niệm','Definition':'Định nghĩa','Characteristics':'Đặc điểm','Examples':'Ví dụ','Non-Examples':'Không phải ví dụ','Event 1':'Sự kiện 1','Event 2':'Sự kiện 2','Event 3':'Sự kiện 3','Event 4':'Sự kiện 4','Event 5':'Sự kiện 5','Event 6':'Sự kiện 6'},
  ar:{'Know':'أعرف','Want to Know':'أريد أن أعرف','Learned':'تعلمت','Side A':'الجانب أ','Side B':'الجانب ب','Lab Notes':'ملاحظات المختبر','Question':'سؤال','Hypothesis':'فرضية','Evidence / Data':'دليل / بيانات','Conclusion':'استنتاج','Word':'كلمة','Summary':'ملخص','Text Evidence':'دليل من النص','Cornell Notes':'ملاحظات كورنيل','Cues / Questions':'تلميحات / أسئلة','Notes':'ملاحظات','Exit Ticket':'بطاقة خروج',"How I feel about today's learning:":'شعوري تجاه تعلم اليوم:','Anchor Chart Title':'عنوان المخطط','Choice Board':'لوحة الاختيار','Word / Concept':'كلمة / مفهوم','Definition':'تعريف','Characteristics':'خصائص','Examples':'أمثلة','Non-Examples':'أمثلة غير صحيحة','Event 1':'حدث 1','Event 2':'حدث 2','Event 3':'حدث 3','Event 4':'حدث 4','Event 5':'حدث 5','Event 6':'حدث 6'},
  zh:{'Know':'已知','Want to Know':'想知道','Learned':'已学','Side A':'A 面','Side B':'B 面','Lab Notes':'实验记录','Question':'问题','Hypothesis':'假设','Evidence / Data':'证据 / 数据','Conclusion':'结论','Word':'词语','Summary':'总结','Text Evidence':'文本证据','Cornell Notes':'康奈尔笔记','Cues / Questions':'提示 / 问题','Notes':'笔记','Exit Ticket':'离堂票',"How I feel about today's learning:":'我对今天学习的感受：','Anchor Chart Title':'锚图标题','Choice Board':'选择板','Word / Concept':'词语 / 概念','Definition':'定义','Characteristics':'特征','Examples':'例子','Non-Examples':'非例子','Event 1':'事件 1','Event 2':'事件 2','Event 3':'事件 3','Event 4':'事件 4','Event 5':'事件 5','Event 6':'事件 6'},
  uh:{'Know':'जानता हूँ / جانتا ہوں','Want to Know':'जानना चाहता हूँ / جاننا چاہتا ہوں','Learned':'सीखा / سیکھا','Side A':'पक्ष A / طرف A','Side B':'पक्ष B / طرف B','Lab Notes':'लैब नोट्स / لیب نوٹس','Question':'प्रश्न / سوال','Hypothesis':'परिकल्पना / مفروضہ','Evidence / Data':'साक्ष्य / डेटा','Conclusion':'निष्कर्ष / نتیجہ','Word':'शब्द / لفظ','Summary':'सारांश / خلاصہ','Text Evidence':'पाठ साक्ष्य / متنی ثبوت','Cornell Notes':'Cornell नोट्स / کارنیل نوٹس','Cues / Questions':'संकेत / प्रश्न','Notes':'नोट्स / نوٹس','Exit Ticket':'एग्जिट टिकट / خروج ٹکٹ',"How I feel about today's learning:":'आज की सीख के बारे में मेरी भावना:','Anchor Chart Title':'चार्ट शीर्षक / چارٹ عنوان','Choice Board':'चॉइस बोर्ड / انتخاب بورڈ','Word / Concept':'शब्द / अवधारणा','Definition':'परिभाषा / تعریف','Characteristics':'विशेषताएँ / خصوصیات','Examples':'उदाहरण / مثالیں','Non-Examples':'गैर-उदाहरण / غیر مثالیں','Event 1':'घटना 1','Event 2':'घटना 2','Event 3':'घटना 3','Event 4':'घटना 4','Event 5':'घटना 5','Event 6':'घटना 6'}
};
function svgTextEscape(s){return String(s).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]))}
async function localizeBackgroundTemplate(bgTemplate,targetPanel){
  const lang=graphLang(), map=BACKGROUND_TEMPLATE_TEXT[lang];
  if(!map||!BACKGROUND_TEMPLATES[bgTemplate]||!targetPanel) return;
  try{
    const res=await fetch(BACKGROUND_TEMPLATES[bgTemplate],{cache:'no-cache'});
    if(!res.ok) return;
    let svgText=await res.text();
    Object.keys(map).sort((a,b)=>b.length-a.length).forEach(src=>{
      svgText=svgText.replaceAll('>'+svgTextEscape(src)+'<','>'+svgTextEscape(map[src])+'<');
    });
    targetPanel.bgImage='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svgText);
    render();
    persistLocal();
  }catch(_){}
}
function applyLaunchParams(){
  const params=new URLSearchParams(location.search);
  roleLock=params.get('role')==='student'?'student':'';
  const scriptParam=params.get('script')||'';
  const savedScript=(()=>{try{return localStorage.getItem(SCRIPT_URL_STORAGE_KEY)||''}catch(_){return ''}})();
  if(ui.scriptUrl){
    ui.scriptUrl.value=scriptParam||savedScript||DEFAULT_GOOGLE_SCRIPT_URL||ui.scriptUrl.value||'';
    ui.scriptUrl.addEventListener('change',()=>{try{if(roleLock!=='student') localStorage.setItem(SCRIPT_URL_STORAGE_KEY,googleScriptUrl())}catch(_){}});
  }
  if(ui.collabRoom&&params.get('room')) ui.collabRoom.value=params.get('room');
  if(ui.cloudPassword&&params.get('password')) ui.cloudPassword.value=params.get('password');
  if(params.get('student')){board.studentName=params.get('student'); if(ui.studentName) ui.studentName.value=board.studentName}
  const bgTemplate=params.get('bgTemplate');
  if(bgTemplate&&BACKGROUND_TEMPLATES[bgTemplate]){
    const p=panel();
    p.bg='blank';
    p.bgImage=BACKGROUND_TEMPLATES[bgTemplate];
    p.objects=[];
    p.name=p.name&&p.name!=='Panel 1'?p.name:bgTemplate.split('-').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ');
    board.title=board.title||p.name;
    clearSelection();
    localizeBackgroundTemplate(bgTemplate,p);
  }
  enforceRoleLock();
}
function copyStudentShareLink(){
  const room=(ui.collabRoom?.value||'').trim();
  if(!room) return setStatus('Enter a room name before creating a student link.','danger');
  const url=new URL(location.href);
  url.search='';
  url.hash='';
  url.searchParams.set('role','student');
  url.searchParams.set('room',room);
  if(!DEFAULT_GOOGLE_SCRIPT_URL&&googleScriptUrl()) url.searchParams.set('script',googleScriptUrl());
  const link=url.toString();
  const done=()=>setStatus('Student link copied. Students will enter the room password when they join.','success');
  if(navigator.clipboard?.writeText) navigator.clipboard.writeText(link).then(done).catch(()=>prompt('Student link:',link));
  else prompt('Student link:',link);
}
function shouldAutoCloudJoin(){return !!(new URLSearchParams(location.search).get('room')&&googleScriptUrl()&&roleLock==='student')}

/* Tool, workspace, and selection primitives. These are intentionally small
   because drawing, editing, grouping, and inspector code all depend on them. */
function refreshToolGroupsActive(){document.querySelectorAll('#toolButtons .tool-popover-group').forEach(group=>group.classList.toggle('active',!!group.querySelector(`button.active,[data-tool="${tool}"]`)))}
function setTool(next){
  // Restore the per-tool stored stroke width before re-rendering controls.
  // Pen and eraser each keep their own width so the slider reflects the
  // active tool's choice instead of carrying the previous tool's value.
  if(ui.strokeWidth){
    if(next==='pen') ui.strokeWidth.value=String(penStrokeWidth);
    else if(next==='eraser') ui.strokeWidth.value=String(eraserStrokeWidth);
  }
  tool=next; document.body.dataset.tool=next; document.querySelectorAll('#toolButtons button').forEach(b=>b.classList.toggle('active',b.dataset.tool===tool)); refreshToolGroupsActive(); gid('activateDotPaintBtn')?.classList.toggle('active',tool==='dotpaint'); if(tool!=='connector') connectorPendingFrom=null; if(tool!=='dotpaint') closeDotPaintPalette(); applyToolContext(); syncSimpleColor(); refreshColoringPaintToolbar?.(); refreshEraserSizeControls?.(); refreshPenSizeControls?.(); if(next==='eraser') setStatus('Eraser: choose Small, Bigger, or Biggest, then drag over a Scratch Cover to reveal the background. Click other objects to delete them.'); else if(next==='pen') setStatus('Pencil: pick a thickness — Fine, Medium, Bold, or Marker — then drag on the canvas.'); else if(next==='bucket') setStatus('Paint Bucket: click a shape, note, dot, or line, or click blank canvas to add a color layer above the panel background.'); else if(next==='laser') setStatus('Laser pointer: drag to draw a temporary trail.'); else if(next==='dotpaint') setStatus(panel().objects.some(o=>o.type==='dot')?'Dot Paint: click or drag across dots in a Dot Picture, then pick a color from the palette.':'Dot Paint works after you insert a Dot Picture. Open Dot Pictures first, then paint its dots.'); else if(next==='coloringpaint') setStatus(coloringPaintMode==='bucket'?'Bucket: click a white space inside the selected coloring page to pour color.':(coloringPaintMode==='spray'?'Spray: drag inside the selected coloring page to spray color.':'Coloring paint: drag inside the selected coloring page. Strokes stay clipped to the page.'),'success')
}
function applyToolContext(){const o=(selectedIds.length===1)?currentObj():null; const objType=o?o.type:null; document.querySelectorAll('.ctx-group').forEach(el=>{const ctx=el.dataset.context; const active=(tool===ctx)||(objType===ctx); el.open=active; el.classList.toggle('context-active',active)})}
function applyInterfaceMode(mode,quiet=false){mode=mode||ui.interfaceMode?.value||localStorage.getItem('drawsplat.interfaceMode')||'simple'; if(ui.interfaceMode) ui.interfaceMode.value=mode; localStorage.setItem('drawsplat.interfaceMode',mode); document.body.dataset.view=mode; document.querySelectorAll('[data-ui],[data-ui-section]').forEach(el=>{const level=el.dataset.uiSection||el.dataset.ui||'core'; el.classList.toggle('simple-hidden',mode==='simple'&&level==='advanced')}); if(mode==='simple'&&ADVANCED_TOOLS.includes(tool)) setTool('select'); if(!quiet) setStatus(mode==='simple'?'Simple interface enabled.':'Advanced interface enabled.','success')}
function applyWorkspaceMode(mode,quiet=false){mode=mode||ui.workspaceMode?.value||localStorage.getItem('drawsplat.workspaceMode')||'productivity'; if(mode!=='education') mode='productivity'; document.body.dataset.workspace=mode; if(ui.workspaceMode) ui.workspaceMode.value=mode; localStorage.setItem('drawsplat.workspaceMode',mode); const msg=mode==='education'?'Education tools enabled.':'Productivity workspace enabled. Education-only controls are hidden.'; const ws=gid('workspaceStatus'); if(ws) ws.textContent=mode==='education'?'Education Tools shows class, student, answer-key, turn-in, assignment, and moderation controls.':'Productivity hides classroom-only controls. Choose Education Tools to reveal class, student, answer-key, turn-in, and moderation features.'; if(!quiet) setStatus(msg,'success')}

function pt(evt){const r=svg.getBoundingClientRect();return{x:(evt.clientX-r.left)/zoom,y:(evt.clientY-r.top)/zoom}}
function clamp(n,min,max){return Math.max(min,Math.min(max,n))}
function style(){return{stroke:ui.strokeColor.value,strokeWidth:+ui.strokeWidth.value,fill:fillEnabled?ui.fillColor.value:'none',fillPattern:ui.fillPattern?ui.fillPattern.value:'',opacity:+ui.opacity.value/100}}
function defaultTextProps(type){const shape=SHAPE_TEXT_TYPES.includes(type);return{html:'',text:'',textColor:'#111827',fontSize:type==='sticky'?16:(type==='text'?24:20),hAlign:shape?'center':'left',vAlign:shape?'middle':'top',textRotation:0,autoScaleText:shape}}
function activeInsertLayer(){if(!board.assignmentMode) return 'shared'; if(board.mode==='student') return 'student'; return board.currentLayer||'teacher'}
function canEditObject(o){return !!o && !o.locked && !(board.assignmentMode && board.mode==='student' && o.layer==='teacher')}
function bucketFillObject(o,color=paintColor()){
  if(!o||!canEditObject(o)) return false;
  if(['rect','ellipse','diamond','triangle','callout','speech','sticky','dot','polygon','star'].includes(o.type)){
    o.fill=color;
    o.fillPattern='';
    return true;
  }
  if(o.type==='path'||o.type==='line'||o.type==='arrow'||o.type==='connector'){
    o.stroke=color;
    if(o.type==='connector') o.connectorLabelColor=color;
    return true;
  }
  return false;
}
function applyCanvasBucketFill(){
  if(board.mode==='student'){
    setStatus('Students cannot change the panel background.','danger');
    return true;
  }
  const p=panel();
  p.canvasFill={color:paintColor(),opacity:+ui.opacity.value/100};
  clearSelection();
  render();
  saveState();
  setStatus('Canvas color layer added above the panel background.','success');
  return true;
}
function applyBucketFill(o){
  if(!o) return false;
  if(!canEditObject(o)){
    setStatus(o.locked?'That item is locked.':'Teacher-layer items are protected in assignment mode.','danger');
    return true;
  }
  if(!bucketFillObject(o)){
    setStatus('Paint Bucket fills shapes, notes, dots, and lines.','danger');
    return true;
  }
  selectedIds=[o.id];
  render();
  saveState();
  setStatus('Filled with the selected color.','success');
  return true;
}
function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c))}
window.esc=esc;

/* Board/object migration keeps older autosaves usable. Add defaults here when
   introducing new object fields so old JSON opens without special cases later. */
function makeObj(type,x,y,w=120,h=80,extra={}){const layer=activeInsertLayer();return{id:id(),type,x,y,w,h,locked:false,layer,...(board.assignmentMode&&board.mode==='student'?{studentOwner:instanceId}:{}),...style(),...(TEXTABLE_TYPES.includes(type)?defaultTextProps(type):{}),...extra}}
function findObj(idv){return objectIndex.get(idv)||panel().objects.find(o=>o.id===idv)}
function currentObj(){return findObj(selectedIds[0])}
function isSelected(idv){return selectedIds.includes(idv)}
function clearSelection(){commitInlineTextEditor(); selectedIds=[]}
function setSingleSelection(idv){if(inlineEditId&&inlineEditId!==idv) commitInlineTextEditor(); selectedIds=idv?[idv]:[]}
function toggleSelection(idv){if(inlineEditId&&inlineEditId!==idv) commitInlineTextEditor(); selectedIds=isSelected(idv)?selectedIds.filter(x=>x!==idv):[...selectedIds,idv]}

function setInputIfIdle(el,val){if(!el) return; if(document.activeElement===el) return; if(el.value!==val) el.value=val}
function plainTextToHtml(t){return String(t||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])).replace(/\n/g,'<br>')}
function htmlToPlainText(h){const d=document.createElement('div');d.innerHTML=h||'';return (d.textContent||d.innerText||'').trim()}
/* v2.5: stricter HTML cleaner — strip all tags except a small allowlist plus remove on* attributes. */
function cleanEditorHtml(h){
  let s=(h||'').replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').trim();
  if(s==='<br>'||s==='<div><br></div>') return '';
  const tmp=document.createElement('div'); tmp.innerHTML=s;
  const allow=new Set(['B','I','U','EM','STRONG','BR','DIV','SPAN','UL','OL','LI','P']);
  const walker=document.createTreeWalker(tmp,NodeFilter.SHOW_ELEMENT,null);
  const remove=[];
  let n=walker.currentNode;
  while((n=walker.nextNode())){
    if(!allow.has(n.tagName)){ remove.push(n); continue }
    [...n.attributes].forEach(a=>{ const an=a.name.toLowerCase(); if(an.startsWith('on')||an==='style'||an==='href'||an==='src') n.removeAttribute(a.name) });
  }
  remove.forEach(node=>{ while(node.firstChild) node.parentNode.insertBefore(node.firstChild,node); node.parentNode.removeChild(node) });
  return tmp.innerHTML;
}
function objectHtml(o,f=''){if(o.id===inlineEditId) return ''; return cleanEditorHtml(o.html||plainTextToHtml(o.text||f||''))}

function connectorLabelLayout(o){
  const p=connectorEndpoints(o), t=clamp((+o.connectorLabelT||50)/100,0.08,0.92), x=p.x1+(p.x2-p.x1)*t, y=p.y1+(p.y2-p.y1)*t, fs=Math.max(10,+o.connectorLabelSize||14), label=String(o.connectorLabel||'');
  const lines=(label.trim()?label:'relationship').split(/\n/).flatMap(line=>{
    const words=line.trim().split(/\s+/).filter(Boolean), out=[];
    let cur='';
    words.forEach(word=>{const next=cur?cur+' '+word:word; if(next.length>22&&cur){out.push(cur); cur=word}else cur=next});
    if(cur) out.push(cur);
    return out;
  }).slice(0,4);
  const lineH=fs*1.14, maxLen=Math.max(10,...lines.map(line=>line.length)), w=Math.max(96,Math.min(230,maxLen*fs*.58+18)), h=Math.max(34,lines.length*lineH+10);
  let angle=Math.atan2(p.y2-p.y1,p.x2-p.x1)*180/Math.PI;
  if(angle>90) angle-=180;
  if(angle<-90) angle+=180;
  return {x,y,w,h,fs,angle};
}
function objectTextEditBox(o){const b=normBox(o); if(o.type==='connector'){const l=connectorLabelLayout(o); return {x:l.x-l.w/2,y:l.y-l.h/2,w:l.w,h:l.h,angle:l.angle,fontSize:l.fs}} if(SHAPE_TEXT_TYPES.includes(o.type)) return textBoxFor(o.type,b); if(o.type==='comment') return {x:b.x+24,y:b.y,w:Math.max(120,b.w-24),h:Math.max(50,b.h)}; if(o.type==='sticky'){const imageH=o.imageSrc?Math.min(b.h*0.45,110):0; return {x:b.x+12,y:b.y+12+(imageH?imageH+8:0),w:Math.max(40,b.w-24),h:Math.max(36,b.h-24-(imageH?imageH+8:0))}} return {x:b.x+8,y:b.y+8,w:Math.max(40,b.w-16),h:Math.max(36,b.h-16)}}
function measureTextLine(text,fontSize){
  const cv=measureTextLine._canvas||(measureTextLine._canvas=document.createElement('canvas'));
  const ctx=cv.getContext('2d');
  ctx.font=`${fontSize}px Inter, Arial, sans-serif`;
  return ctx.measureText(text||' ').width;
}
function fitPlainTextBoxToContent(o){
  if(!o||o.type!=='text'||o.textAutoFitBox!==true) return;
  const fontSize=Math.max(10,+o.fontSize||24), padX=16, padY=12;
  const lines=String(o.text||'').split(/\n/);
  const textLines=lines.length?lines:[''];
  const maxFrameW=Math.max(180,(svg?.clientWidth||900)/zoom*0.72);
  const lineWidths=textLines.map(line=>measureTextLine(line,fontSize));
  const desiredW=Math.min(maxFrameW,Math.max(80,...lineWidths)+padX);
  const visualLineCount=textLines.reduce((sum,line,i)=>{
    const width=lineWidths[i]||measureTextLine(' ',fontSize);
    return sum+Math.max(1,Math.ceil(width/Math.max(40,desiredW-padX)));
  },0);
  o.w=Math.max(80,Math.round(desiredW));
  o.h=Math.max(Math.round(fontSize*1.25+padY),Math.round(visualLineCount*fontSize*1.25+padY));
}
function positionInlineTextEditor(){if(!inlineEditId) return; const o=findObj(inlineEditId); const wrap=gid('inlineTextEditorWrap'); if(!o||!wrap) return commitInlineTextEditor(false); const box=objectTextEditBox(o); const left=Math.max(0,box.x*zoom), top=Math.max(0,box.y*zoom), width=Math.max(60,box.w*zoom), height=Math.max(34,box.h*zoom); wrap.style.left=left+'px'; wrap.style.top=top+'px'; wrap.style.width=width+'px'; wrap.style.height=height+'px'; wrap.style.transform=o.type==='connector'?`rotate(${box.angle||0}deg)`:''; wrap.style.transformOrigin='center center'; wrap.classList.toggle('connector-label-edit',o.type==='connector'); const ta=gid('inlineTextEditor'); ta.style.minHeight='0'; ta.style.height=height+'px'}
function openInlineTextEditor(objId,starter=null){const o=findObj(objId); if(!o||!(TEXTABLE_TYPES.includes(o.type)||o.type==='connector')) return; if(inlineEditId&&inlineEditId!==objId) commitInlineTextEditor(); inlineEditId=objId; inlineEditOriginal={html:o.html||'',text:o.text||'',connectorLabel:o.connectorLabel||''}; setSingleSelection(objId); const wrap=gid('inlineTextEditorWrap'), ta=gid('inlineTextEditor'); const startVal=starter!==null?starter:(o.type==='connector'?(o.connectorLabel||''):(o.text||'')); ta.value=startVal; ta.style.fontSize=(o.type==='connector'?(o.connectorLabelSize||14):(o.fontSize||16))+'px'; ta.style.color=o.type==='connector'?(o.connectorLabelColor||o.stroke||'#334155'):(o.textColor||'#111827'); ta.style.fontFamily='Inter, Arial, sans-serif'; ta.style.textAlign=o.type==='connector'?'center':''; ta.style.fontWeight=o.type==='connector'?'700':''; ta.placeholder=o.type==='connector'?'relationship phrase':(o.type==='sticky'?'Add note...':(o.type==='audio'?'Voice note':(o.type==='comment'?'Add feedback...':(o.type==='text'?'Type here...':'Type here...')))); wrap.classList.add('show'); updateInlineTextObject(false); render(); setTimeout(()=>{ta.focus(); ta.select()},0)}
function updateInlineTextObject(updateInspectorToo=true){if(!inlineEditId) return; const o=findObj(inlineEditId), ta=gid('inlineTextEditor'); if(!o||!ta) return; if(o.type==='connector'){o.connectorLabel=ta.value}else{o.text=ta.value; o.html=plainTextToHtml(ta.value); fitPlainTextBoxToContent(o)} positionInlineTextEditor(); requestRender(); if(updateInspectorToo&&ui.richEditor&&selectedIds.length===1&&selectedIds[0]===o.id&&o.type!=='connector') ui.richEditor.innerHTML=o.html}
function commitInlineTextEditor(save=true){if(!inlineEditId) return; const o=findObj(inlineEditId), wrap=gid('inlineTextEditorWrap'), ta=gid('inlineTextEditor'); let blockReason=''; if(save&&o&&ta&&window.DrawSplatSafety){const surface=o.type==='sticky'?'sticky':(o.type==='text'?'text':(o.type==='comment'?'comment':'text')); const r=window.DrawSplatSafety.checkAll(ta.value,surface); if(!r.allowed){blockReason=r.reason; save=false}} if(save){updateInlineTextObject(true)}else if(o&&inlineEditOriginal){if(o.type==='connector') o.connectorLabel=inlineEditOriginal.connectorLabel; else{o.text=inlineEditOriginal.text;o.html=inlineEditOriginal.html}} inlineEditId=null; inlineEditOriginal=null; if(wrap){wrap.classList.remove('show','connector-label-edit'); wrap.style.transform=''} if(ta){ta.style.textAlign=''; ta.style.fontWeight=''} render(); if(blockReason) setStatus(blockReason,'danger'); else if(save) saveState()}

function migrateBoard(b){if(!b||!Array.isArray(b.panels))return;b.version=VERSION;if(!b.mode)b.mode='teacher';if(b.title==='Untitled DrawSplat'||b.title==='Untitled DrawSplatTM') b.title=''; if(!('studentName' in b)) b.studentName=''; if(!('assignmentMode' in b)) b.assignmentMode=false; if(!('currentLayer' in b)) b.currentLayer='shared'; if(!Array.isArray(b.restorePoints)) b.restorePoints=[]; if(!('showAnswerKey' in b)) b.showAnswerKey=true; b.panels.forEach((p,i)=>{if(!p.id) p.id='panel_'+id(); if(!p.name) p.name='Panel '+(i+1); if(!p.bg) p.bg='grid'; if(typeof p.bgImage!=='string') p.bgImage=''; if(p.canvasFill&&typeof p.canvasFill==='string') p.canvasFill={color:p.canvasFill,opacity:1}; if(p.canvasFill&&typeof p.canvasFill==='object'){p.canvasFill.color=p.canvasFill.color||'#ffffff'; if(p.canvasFill.opacity===undefined) p.canvasFill.opacity=1} else p.canvasFill=null; p.objects=(p.objects||[]).map(migrateObject)}); ensureActivePanel(); if(typeof ensurePendingImagePoller==='function') ensurePendingImagePoller()}
const LEGACY_PLACEHOLDERS=new Set(['Add note...','Voice note','Add feedback...','Type here','Text']);
function migrateObject(o){if(TEXTABLE_TYPES.includes(o.type)){const d=defaultTextProps(o.type); for(const k in d) if(o[k]===undefined) o[k]=d[k]; if((!o.html||o.html==='')&&o.text) o.html=plainTextToHtml(o.text); o.text=htmlToPlainText(o.html||o.text||''); if(LEGACY_PLACEHOLDERS.has(o.text)){o.text=''; o.html=''}} if(o.type==='dot'){if(o.fill===undefined||o.fill==='none') o.fill='#ffffff'; if(o.dotDefaultFill===undefined) o.dotDefaultFill=o.fill; if(o.stroke===undefined) o.stroke='#374151'; if(o.strokeWidth===undefined) o.strokeWidth=2; if(o.opacity===undefined) o.opacity=1} if(o.type==='scratch'){if(!Array.isArray(o.scratchErasePaths)) o.scratchErasePaths=[]; if(!o.fill||o.fill==='none') o.fill='#ffffff'; if(o.opacity===undefined) o.opacity=1; o.stroke='none'; o.strokeWidth=0} if(o.type==='widget'){const d=defaultWidgetConfig(o.widgetKind||o.kind||'traffic'); o.widgetKind=o.widgetKind||d.widgetKind; o.widgetConfig={...d.widgetConfig,...(o.widgetConfig||{})}} if(o.layer===undefined) o.layer='shared'; if(o.fillPattern===undefined) o.fillPattern=''; if(o.answerKey===undefined) o.answerKey=false; if(o.audioSrc===undefined) o.audioSrc=''; return o}
function normBox(o){if(o.type==='connector'){const p=connectorEndpoints(o);const x=Math.min(p.x1,p.x2),y=Math.min(p.y1,p.y2),w=Math.abs(p.x2-p.x1),h=Math.abs(p.y2-p.y1);return{x,y,w,h,cx:x+w/2,cy:y+h/2}} const x=Math.min(o.x,o.x+o.w),y=Math.min(o.y,o.y+o.h),w=Math.abs(o.w),h=Math.abs(o.h);return{x,y,w,h,cx:x+w/2,cy:y+h/2}}
function normalizeObject(o){if(!o||['line','arrow','path','connector'].includes(o.type))return;const b=normBox(o);o.x=b.x;o.y=b.y;o.w=b.w;o.h=b.h}
function resetInteractionState(){commitInlineTextEditor?.(true); selectedIds=[]; connectorPendingFrom=null; marquee=null; drawing=null; liveDrawingPathEl=null; drag=null; scratchErase=null; eraserDirty=false}

function switchPanel(panelId){ensureActivePanel(); const panelKey=String(panelId||''); let idx=board.panels.findIndex(p=>String(p.id)===panelKey); if(idx<0&&/^\d+$/.test(panelKey)) idx=parseInt(panelKey,10); if(idx<0||idx>=board.panels.length)return; if(idx===board.active){syncPanelSelect();return} resetInteractionState(); board.active=idx; render(); saveState(false); setStatus('Switched to '+(board.panels[idx]?.name||('Panel '+(idx+1)))+'.','success')}
function ensureActivePanel(){if(!board.panels.length) board.panels=[{id:'panel_'+id(),name:'Panel 1',bg:'grid',objects:[]}]; board.panels.forEach((p,i)=>{if(!p.id) p.id='panel_'+id(); if(!p.name) p.name='Panel '+(i+1); if(!p.bg) p.bg='grid'; if(!Array.isArray(p.objects)) p.objects=[]}); if(board.active<0||board.active>=board.panels.length) board.active=0}
function renderTabs(){ensureActivePanel();const tabs=gid('tabs');if(tabs){tabs.innerHTML='';board.panels.forEach((p,i)=>{const b=document.createElement('button');b.type='button';b.className='tab '+(i===board.active?'active':'');b.textContent=p.name||('Panel '+(i+1));b.dataset.panelId=p.id;b.dataset.panelIndex=String(i);b.setAttribute('aria-label','Switch to '+(p.name||('Panel '+(i+1))));tabs.appendChild(b)});const plus=document.createElement('button');plus.type='button';plus.className='tab';plus.textContent='+';plus.dataset.action='add-panel';plus.setAttribute('aria-label','Add panel');tabs.appendChild(plus)} syncPanelSelect()}
function syncPanelSelect(){ensureActivePanel();const sel=gid('panelSelect');if(!sel)return;const currentId=board.panels[board.active]?.id||'';sel.innerHTML=board.panels.map((p,i)=>`<option value="${esc(p.id)}">${esc(p.name||('Panel '+(i+1)))}</option>`).join('');sel.value=currentId;const hint=gid('panelCurrentHint');if(hint) hint.textContent=`Current panel: ${board.panels[board.active]?.name||('Panel '+(board.active+1))} (${board.active+1} of ${board.panels.length})`}
function handleTabsClick(evt){const btn=evt.target.closest('button'); if(!btn||!gid('tabs')?.contains(btn)) return; evt.preventDefault(); evt.stopPropagation(); if(btn.dataset.action==='add-panel') return addPanel(); switchPanel(btn.dataset.panelId||btn.dataset.panelIndex)}
if(gid('tabs')) gid('tabs').addEventListener('click',handleTabsClick);
if(gid('panelSelect')) gid('panelSelect').addEventListener('change',e=>switchPanel(e.target.value));

/* SVG rendering pipeline. render() rebuilds the object index, redraws the
   current panel, then refreshes selection outlines, inspector state, and
   inline editors. Object-specific helpers create SVG/foreignObject nodes. */
function bgDefs(bg){let pat=''; if(bg==='grid')pat='<pattern id="bgp" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#dbe3f3" stroke-width="1"/></pattern>'; if(bg==='dots')pat='<pattern id="bgp" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="#cbd5e1"/></pattern>'; if(bg==='graph')pat='<pattern id="small" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="#e5e7eb" stroke-width="1"/></pattern><pattern id="bgp" width="80" height="80" patternUnits="userSpaceOnUse"><rect width="80" height="80" fill="url(#small)"/><path d="M80 0H0V80" fill="none" stroke="#b6c2d8" stroke-width="1.4"/></pattern>'; if(bg==='lines')pat='<pattern id="bgp" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M0 47H48" stroke="#c7d2fe" stroke-width="1.2"/></pattern>'; if(bg==='isometric')pat='<pattern id="bgp" width="40" height="35" patternUnits="userSpaceOnUse"><path d="M20 0v35M0 17.5l20 17.5 20-17.5M0 17.5L20 0l20 17.5" fill="none" stroke="#dbe3f3" stroke-width="1"/></pattern>'; return pat}
function fillPatternDefs(){return '<pattern id="fillpat_dots" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="transparent"/><circle cx="2.5" cy="2.5" r="1.5" fill="rgba(30,57,141,.35)"/></pattern><pattern id="fillpat_diagonal" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="10" stroke="rgba(30,57,141,.35)" stroke-width="3"/></pattern><pattern id="fillpat_crosshatch" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M0 0L12 12M12 0L0 12" stroke="rgba(30,57,141,.3)" stroke-width="1.5"/></pattern><pattern id="fillpat_checker" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="transparent"/><rect width="8" height="8" fill="rgba(30,57,141,.2)"/><rect x="8" y="8" width="8" height="8" fill="rgba(30,57,141,.2)"/></pattern>'}
function objectFill(o){return o.fillPattern?`url(#fillpat_${o.fillPattern})`:o.fill}
function presenceName(){return (board.mode==='teacher'?'Teacher':'Student')+(board.studentName?': '+board.studentName:'')}
function cursorColorFor(idv){let h=0; for(let i=0;i<idv.length;i++) h=(h*31+idv.charCodeAt(i))%360; return `hsl(${h} 70% 45%)`}

function rebuildIndex(){
  objectIndex=new Map();
  for(const p of board.panels) for(const o of p.objects) objectIndex.set(o.id,o);
}

function render(){
  rebuildIndex();
  renderTabs();
  const _lasers=[...svg.querySelectorAll('.laser-trail')];
  setInputIfIdle(ui.boardTitle,board.title); setInputIfIdle(ui.className,board.className); setInputIfIdle(ui.studentName,board.studentName||''); ui.userMode.value=board.mode||'teacher'; ui.assignmentModeToggle.checked=!!board.assignmentMode; ui.activeLayerSelect.value=board.currentLayer||'shared'; ui.showAnswerKeyToggle.checked=!!board.showAnswerKey;
  ui.layerBadge.textContent='Layer: '+((board.assignmentMode?(board.mode==='student'?'Student':'Teacher: '+(board.currentLayer||'shared')):'Shared').replace(/^Teacher: shared$/,'Shared'));
  refreshRestorePoints(); applyModeUI(); refreshFrameNav(); setButtonChrome('zoomResetBtn',Math.round(zoom*100)+'%'); gid('zoomResetBtn')?.setAttribute('aria-label','Reset Zoom'); gid('zoomResetBtn')?.setAttribute('title','Reset Zoom'); gid('zoomResetBtn')?.setAttribute('data-tooltip','Reset Zoom');
  const p=panel();
  syncScratchCoversToFrame(p);
  const bgImageSvg=p.bgImage?`<image x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" href="${esc(p.bgImage)}"/>`:'';
  const canvasFillSvg=p.canvasFill?`<rect width="100%" height="100%" fill="${esc(p.canvasFill.color||'#ffffff')}" opacity="${clamp(+(p.canvasFill.opacity??1),0,1)}"/>`:'';
  svg.innerHTML='<defs>'+bgDefs(p.bg)+fillPatternDefs()+'</defs>'+(p.bg==='blank'?'<rect width="100%" height="100%" fill="#fff"/>':'<rect width="100%" height="100%" fill="url(#bgp)"/>')+bgImageSvg+canvasFillSvg+'<g id="viewport" transform="scale('+zoom+')"></g>';
  _lasers.forEach(l=>svg.appendChild(l));
  const g=svg.querySelector('#viewport');
  const layerOrder={teacher:0,shared:1,student:2};
  [...p.objects].filter(o=>!o.hiddenForGif&&!(o.answerKey && !board.showAnswerKey)).sort((a,b)=>((a.type==='connector'?-10:0)+(layerOrder[a.layer]??1))-((b.type==='connector'?-10:0)+(layerOrder[b.layer]??1))).forEach(o=>g.appendChild(drawObject(o)));
  drawLiveCursors(g);
  drawSelection();
  if(marquee&&marquee.active) g.appendChild(svgEl(`<rect class="marquee" x="${Math.min(marquee.x1,marquee.x2)}" y="${Math.min(marquee.y1,marquee.y2)}" width="${Math.abs(marquee.x2-marquee.x1)}" height="${Math.abs(marquee.y2-marquee.y1)}"/>`));
  updateInspector();
  applyToolContext();
  refreshSelectionToolbar();
  if(inlineEditId) positionInlineTextEditor();
}

function drawLiveCursors(g){const now=Date.now(); let count=0; Object.values(liveCursors).forEach(c=>{if(!c||c.panel!==board.active||now-c.ts>12000) return; count++; const x=c.x||0,y=c.y||0,color=c.color||'#2563eb'; g.appendChild(svgEl(`<g class="cursor-tag" opacity="0.98"><path d="M ${x} ${y} L ${x+10} ${y+24} L ${x+14} ${y+14} L ${x+28} ${y+14} Z" fill="${color}"/><rect x="${x+14}" y="${y+14}" rx="9" ry="9" width="${Math.max(74,(c.name||'User').length*8)}" height="24" fill="${color}"/><text x="${x+24}" y="${y+30}" font-size="12" font-weight="700" fill="white">${esc(c.name||'User')}</text></g>`))}); if(ui.cursorStatus) ui.cursorStatus.textContent=count?`${count} collaborator cursor${count===1?'':'s'} visible.`:'No live collaborator cursors yet.'}

function createPathObject(o){
  const path=`<path d="${esc(o.d||'')}" fill="none" stroke="${esc(o.stroke||'#111827')}" stroke-width="${o.strokeWidth||2}" opacity="${o.opacity??1}" stroke-linecap="round" stroke-linejoin="round"/>`;
  if(!o.clipBox) return svgEl(path);
  const b=o.clipBox,cid=`clip_${o.id}`;
  return svgEl(`<g><defs><clipPath id="${esc(cid)}"><rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}"/></clipPath></defs><g clip-path="url(#${esc(cid)})">${path}</g></g>`);
}
function createScratchObject(o,b){
  const maskId=`scratch_mask_${o.id}`;
  const erasures=(o.scratchErasePaths||[]).map(path=>`<path d="${esc(path.d||'')}" fill="none" stroke="#000" stroke-width="${Math.max(1,+path.width||32)}" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  return svgEl(`<g opacity="${o.opacity??1}"><defs><mask id="${esc(maskId)}" maskUnits="userSpaceOnUse"><rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="#fff"/>${erasures}</mask></defs><rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="${esc(o.fill||'#ffffff')}" mask="url(#${esc(maskId)})"/></g>`);
}
function drawObject(o){const el=document.createElementNS(NS,'g');el.classList.add('object');if(o.coloringPaintFor){el.classList.add('coloring-paint-object');el.style.pointerEvents='none'}if(isSelected(o.id))el.classList.add('selected');el.dataset.id=o.id;el.style.cursor=o.locked?'not-allowed':(tool==='eraser'&&o.type==='scratch'?'crosshair':(tool==='dotpaint'&&o.type==='dot'?'copy':(o.type==='connector'?'pointer':'move')));const b=normBox(o);let node=null;const common=`stroke="${o.stroke}" stroke-width="${o.strokeWidth}" fill="${objectFill(o)}" opacity="${o.opacity}"`; if(o.type==='dot')node=svgEl(`<circle cx="${b.x+b.w/2}" cy="${b.y+b.h/2}" r="${Math.max(3,Math.min(b.w,b.h)/2)}" ${common}/>`); if(o.type==='rect')node=svgEl(`<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="${o.conceptNode?18:8}" ${common}/>`);if(o.type==='ellipse')node=svgEl(`<ellipse cx="${b.x+b.w/2}" cy="${b.y+b.h/2}" rx="${b.w/2}" ry="${b.h/2}" ${common}/>`);if(o.type==='line')node=svgEl(`<line x1="${o.x}" y1="${o.y}" x2="${o.x+o.w}" y2="${o.y+o.h}" stroke="${o.stroke}" stroke-width="${o.strokeWidth}" opacity="${o.opacity}" stroke-linecap="round"/>`);if(o.type==='arrow')node=svgEl(`<g opacity="${o.opacity}"><defs><marker id="m_${o.id}" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="${o.stroke}"/></marker></defs><line x1="${o.x}" y1="${o.y}" x2="${o.x+o.w}" y2="${o.y+o.h}" stroke="${o.stroke}" stroke-width="${o.strokeWidth}" stroke-linecap="round" marker-end="url(#m_${o.id})"/></g>`);if(o.type==='connector'){const p=connectorEndpoints(o);node=svgEl(`<g opacity="${o.opacity}"><defs><marker id="cm_${o.id}" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="${o.stroke}"/></marker></defs><path d="M ${p.x1} ${p.y1} L ${p.x2} ${p.y2}" fill="none" stroke="${o.stroke}" stroke-width="${o.strokeWidth}" stroke-linecap="round" marker-end="url(#cm_${o.id})"/></g>`)} if(o.type==='diamond')node=svgEl(`<polygon points="${b.x+b.w/2},${b.y} ${b.x+b.w},${b.y+b.h/2} ${b.x+b.w/2},${b.y+b.h} ${b.x},${b.y+b.h/2}" ${common}/>`);if(o.type==='triangle')node=svgEl(`<polygon points="${b.x+b.w/2},${b.y} ${b.x+b.w},${b.y+b.h} ${b.x},${b.y+b.h}" ${common}/>`);if(o.type==='polygon')node=svgEl(`<polygon points="${hexagonPoints(b.x+b.w/2,b.y+b.h/2,b.w/2,b.h/2)}" ${common}/>`);if(o.type==='star')node=svgEl(`<polygon points="${starPoints(b.x+b.w/2,b.y+b.h/2,b.w/2,b.h/2)}" ${common}/>`);if(o.type==='callout')node=svgEl(`<path d="${calloutPath(b)}" ${common}/>`);if(o.type==='speech')node=svgEl(`<path d="${speechPath(b)}" ${common}/>`);if(o.type==='path')node=createPathObject(o);if(o.type==='scratch')node=createScratchObject(o,b);if(o.type==='image'){node=createImageObject(o,b)}if(o.type==='text')node=createTextObject(o,b);if(o.type==='sticky')node=createStickyObject(o,b);if(o.type==='comment')node=createCommentObject(o,b);if(o.type==='stamp')node=createStampObject(o,b);if(o.type==='audio')node=createAudioObject(o,b);if(o.type==='widget')node=createClassroomWidgetObject(o,b); if(node)el.appendChild(node); if(o.type==='connector'){const labelNode=createConnectorLabelObject(o); if(labelNode) el.appendChild(labelNode)} if(SHAPE_TEXT_TYPES.includes(o.type)) {if(o.conceptNode) el.appendChild(createConceptNodeExtras(o,b)); el.appendChild(createShapeTextObject(o,b))} if(o.answerKey&&board.showAnswerKey){el.appendChild(svgEl(`<g><rect x="${b.x+6}" y="${b.y+6}" rx="8" ry="8" width="76" height="20" fill="#FAA634" opacity="0.95"/><text x="${b.x+16}" y="${b.y+20}" font-size="11" font-weight="800" fill="#111827">ANSWER KEY</text></g>`))} el.addEventListener('pointerdown',objectDown); el.addEventListener('dblclick',ev=>{ev.stopPropagation(); if(TEXTABLE_TYPES.includes(o.type)){openInlineTextEditor(o.id)} else if(o.type==='widget'){openClassroomWidgetDialog(o.id)} else if(o.type==='image'&&o.pictureGraphConfig){openPictureGraphDialog(o.id)} else if(o.type==='image'&&o.graphConfig){openGraphDialog(o.id)} else if(o.type==='image'&&o.mermaidSource){openMermaidDialog(o.id)} else if(o.type==='image'&&o.wordCloudSource){openWordCloudDialog(o.id)}}); return el}

function calloutPath(b){const r=Math.min(16,b.w/8,b.h/8),tx=b.x+Math.min(40,b.w*.3),ty=b.y+b.h,n=Math.min(26,b.h*.22);return`M ${b.x+r} ${b.y} H ${b.x+b.w-r} Q ${b.x+b.w} ${b.y} ${b.x+b.w} ${b.y+r} V ${b.y+b.h-n-r} Q ${b.x+b.w} ${b.y+b.h-n} ${b.x+b.w-r} ${b.y+b.h-n} H ${tx+18} L ${tx} ${ty} L ${tx+8} ${b.y+b.h-n} H ${b.x+r} Q ${b.x} ${b.y+b.h-n} ${b.x} ${b.y+b.h-n-r} V ${b.y+r} Q ${b.x} ${b.y} ${b.x+r} ${b.y} Z`}
function speechPath(b){const r=Math.min(18,b.w/8,b.h/8),n=Math.min(28,b.h*.22),cx=b.x+b.w*.55;return`M ${b.x+r} ${b.y} H ${b.x+b.w-r} Q ${b.x+b.w} ${b.y} ${b.x+b.w} ${b.y+r} V ${b.y+b.h-n-r} Q ${b.x+b.w} ${b.y+b.h-n} ${b.x+b.w-r} ${b.y+b.h-n} H ${cx+18} L ${cx-2} ${b.y+b.h} L ${cx-8} ${b.y+b.h-n} H ${b.x+r} Q ${b.x} ${b.y+b.h-n} ${b.x} ${b.y+b.h-n-r} V ${b.y+r} Q ${b.x} ${b.y} ${b.x+r} ${b.y} Z`}
function regularPolygonPoints(cx,cy,rx,ry,n,rot=-Math.PI/2){return Array.from({length:n},(_,i)=>`${cx+Math.cos(rot+i*Math.PI*2/n)*rx},${cy+Math.sin(rot+i*Math.PI*2/n)*ry}`).join(' ')}
function starPoints(cx,cy,rx,ry,inner=.46,points=5){return Array.from({length:points*2},(_,i)=>{const r=i%2?inner:1,a=-Math.PI/2+i*Math.PI/points;return`${cx+Math.cos(a)*rx*r},${cy+Math.sin(a)*ry*r}`}).join(' ')}
function hexagonPoints(cx,cy,rx,ry){return Array.from({length:6},(_,i)=>{const a=i*Math.PI/3;return`${cx+Math.cos(a)*rx},${cy+Math.sin(a)*ry}`}).join(' ')}
function heartPath(b){const x=b.x,y=b.y,w=b.w,h=b.h;return`M ${x+w/2} ${y+h*.88} C ${x+w*.1} ${y+h*.58} ${x} ${y+h*.34} ${x+w*.18} ${y+h*.16} C ${x+w*.32} ${y} ${x+w*.48} ${y+h*.08} ${x+w/2} ${y+h*.23} C ${x+w*.52} ${y+h*.08} ${x+w*.68} ${y} ${x+w*.82} ${y+h*.16} C ${x+w} ${y+h*.34} ${x+w*.9} ${y+h*.58} ${x+w/2} ${y+h*.88} Z`}
const CROP_CUSTOM_MASKS={
  bird:'M12 55 C28 22 58 24 88 18 C62 38 50 58 36 78 C32 66 22 60 12 55 Z',
  butterfly:'M50 50 C22 12 2 12 12 48 C-4 82 28 90 50 58 C72 90 104 82 88 48 C98 12 78 12 50 50 Z',
  cat:'M20 90 L20 32 L34 46 L50 18 L66 46 L80 32 L80 90 Z M36 62 L42 62 M58 62 L64 62',
  dog:'M12 70 C20 42 40 36 60 46 L78 32 L88 42 L74 56 C80 74 64 88 40 86 C22 84 10 80 12 70 Z',
  fish:'M8 50 L28 32 C54 16 82 28 92 50 C82 72 54 84 28 68 Z M14 50 L2 34 L2 66 Z',
  dolphin:'M8 58 C28 24 62 18 92 34 C66 36 54 52 40 76 L32 58 Z',
  shark:'M6 56 C28 24 64 24 94 48 L66 62 L94 76 C64 80 30 78 6 56 Z',
  turtle:'M14 56 C20 28 80 28 86 56 C78 82 22 82 14 56 Z M84 52 C94 48 98 58 88 64 Z',
  rabbit:'M22 86 C8 58 28 42 50 52 C72 42 92 58 78 86 Z M40 50 C24 18 28 4 48 40 Z M56 50 C72 18 68 4 52 40 Z',
  frog:'M14 62 C18 34 82 34 86 62 C72 86 28 86 14 62 Z M26 34 A10 10 0 1 1 46 34 M54 34 A10 10 0 1 1 74 34',
  horse:'M16 78 L24 44 L46 30 L70 42 L84 70 L72 88 L56 64 L34 76 Z',
  dinosaur:'M10 74 C22 42 54 36 72 50 L92 42 L78 64 L84 82 L58 76 L36 88 Z',
  birdhouse:'M18 46 L50 14 L82 46 L74 46 L74 88 L26 88 L26 46 Z M42 52 A8 8 0 1 1 58 52',
  house:'M14 48 L50 14 L86 48 L76 48 L76 88 L24 88 L24 48 Z',
  drop:'M50 8 C74 42 86 60 72 80 C58 100 22 88 22 62 C22 44 36 28 50 8 Z',
  plug:'M32 8 H44 V34 H56 V8 H68 V36 C68 52 58 60 50 64 V92 H42 V64 C34 60 32 52 32 36 Z',
  key:'M28 56 A18 18 0 1 1 56 36 L94 36 L94 48 L82 48 L82 60 L68 60 L68 72 L56 72 L48 64 A18 18 0 0 1 28 56 Z',
  phone:'M18 32 C36 14 64 14 82 32 V80 C64 96 36 96 18 80 Z M30 40 H70 V72 H30 Z',
  cup:'M22 36 H68 V70 C62 88 30 88 24 70 Z M68 42 H84 C88 54 78 68 68 66 Z',
  pan:'M14 54 H64 C78 54 82 72 68 82 H28 C16 80 8 66 14 54 Z M64 60 H96 V70 H64 Z',
  lamp:'M34 20 H66 L80 54 H20 Z M46 54 H54 V86 H72 V94 H28 V86 H46 Z',
  faucet:'M24 70 V52 H52 V38 H42 V26 H70 V38 H60 V52 H82 C94 52 96 70 82 74 H66 C66 64 58 60 50 60 H34 V70 Z',
  wrench:'M76 12 C86 24 82 42 68 48 L34 82 C28 88 18 82 24 74 L58 40 C52 26 62 12 76 12 Z',
  gamepad:'M16 60 C20 36 36 34 50 46 C64 34 80 36 84 60 C88 82 72 88 58 70 H42 C28 88 12 82 16 60 Z',
  heartArrow:'M50 90 C10 62 2 34 22 20 C36 10 48 20 50 34 C52 20 64 10 78 20 C98 34 90 62 50 90 Z M6 16 H30 M22 8 L30 16 L22 24',
  brokenHeart:'M50 90 C12 62 4 34 24 20 C38 10 48 22 50 34 L42 50 L54 54 L44 72 L58 54 L48 50 L56 34 C58 22 70 10 84 20 C104 34 88 62 50 90 Z',
  pixelHeart:'M20 20 H40 V30 H50 V20 H80 V50 H70 V70 H60 V80 H50 V90 H40 V80 H30 V70 H20 V50 H10 V30 H20 Z',
  heartLock:'M50 90 C10 62 2 34 22 20 C36 10 48 20 50 34 C52 20 64 10 78 20 C98 34 90 62 50 90 Z M38 54 H62 V76 H38 Z M44 54 V46 C44 36 56 36 56 46 V54',
  arrowDown:'M36 4 H64 V52 H88 L50 94 L12 52 H36 Z',
  arrowUp:'M50 6 L88 48 H64 V96 H36 V48 H12 Z',
  arrowLeft:'M6 50 L48 12 V36 H96 V64 H48 V88 Z',
  arrowRight:'M94 50 L52 12 V36 H4 V64 H52 V88 Z',
  arrowRefresh:'M78 24 L94 24 L94 8 M88 24 C76 8 48 6 30 22 C10 40 12 70 32 84 C52 98 80 90 90 66 H74 C66 78 48 80 36 70 C24 58 26 40 38 30 C50 20 66 18 78 24 Z',
  airplane:'M6 54 L94 16 L76 50 L94 84 L58 68 L38 94 L30 76 L42 60 Z',
  car:'M10 66 L22 42 H74 L90 66 V82 H10 Z M24 82 A8 8 0 1 1 40 82 M60 82 A8 8 0 1 1 76 82',
  bike:'M22 76 A16 16 0 1 1 54 76 M62 76 A16 16 0 1 1 94 76 M38 76 L52 48 L66 76 M52 48 H72 M52 48 L42 34',
  submarine:'M8 62 C24 38 76 38 92 62 C76 86 24 86 8 62 Z M36 42 V24 H52 V42 M28 62 A5 5 0 1 1 38 62 M48 62 A5 5 0 1 1 58 62 M68 62 A5 5 0 1 1 78 62',
  hotAirBalloon:'M50 10 C76 10 88 34 78 58 C70 74 60 82 50 82 C40 82 30 74 22 58 C12 34 24 10 50 10 Z M38 82 H62 L58 96 H42 Z'
};
const CROP_SHAPE_GROUPS=[
  ['Basic',[['none','Original rectangle'],['circle','Circle'],['oval','Oval'],['triangle','Triangle'],['diamond','Diamond'],['pentagon','Pentagon'],['hexagon','Hexagon'],['octagon','Octagon'],['star','Star'],['heart','Heart']]],
  ['Animals',[['bird','Bird'],['butterfly','Butterfly'],['cat','Cat'],['dog','Dog'],['fish','Fish'],['dolphin','Dolphin'],['shark','Shark'],['turtle','Turtle'],['rabbit','Rabbit'],['frog','Frog'],['horse','Horse'],['dinosaur','Dinosaur']]],
  ['Household',[['house','House'],['birdhouse','Birdhouse'],['drop','Drop'],['plug','Plug'],['key','Key'],['phone','Phone'],['cup','Cup'],['pan','Pan'],['lamp','Lamp'],['faucet','Faucet'],['wrench','Wrench'],['gamepad','Gamepad']]],
  ['Hearts and arrows',[['heartArrow','Heart with arrow'],['brokenHeart','Broken heart'],['pixelHeart','Pixel heart'],['heartLock','Heart lock'],['arrowDown','Arrow down'],['arrowUp','Arrow up'],['arrowLeft','Arrow left'],['arrowRight','Arrow right'],['arrowRefresh','Refresh arrow']]],
  ['Transport',[['airplane','Airplane'],['car','Car'],['bike','Bike'],['submarine','Submarine'],['hotAirBalloon','Hot air balloon']]]
];
function cropShapeOptionsHtml(){
  return CROP_SHAPE_GROUPS.map(([group,items])=>`<optgroup label="${esc(group)}">${items.map(([value,label])=>`<option value="${esc(value)}">${esc(label)}</option>`).join('')}</optgroup>`).join('');
}
function customMaskPath(shape,b){
  const d=CROP_CUSTOM_MASKS[shape]; if(!d) return '';
  return `<path d="${d}" transform="translate(${b.x} ${b.y}) scale(${b.w/100} ${b.h/100})"/>`;
}
function imageMaskContentBox(shape,b){
  const fits={star:.64,heart:.76,diamond:.74,triangle:.72,pentagon:.84,butterfly:.82,heartArrow:.76,brokenHeart:.76,pixelHeart:.82,heartLock:.76,arrowDown:.78,arrowUp:.78,arrowLeft:.78,arrowRight:.78,arrowRefresh:.84};
  const f=fits[shape]||1;
  if(f>=1) return b;
  const w=b.w*f,h=b.h*f;
  let x=b.x+(b.w-w)/2,y=b.y+(b.h-h)/2;
  if(shape==='triangle') y=b.y+b.h*.23;
  if(shape==='heart') y=b.y+b.h*.16;
  return {x,y,w,h};
}
function imageMaskClipSvg(shape,b){
  if(!shape||shape==='none') return '';
  const custom=customMaskPath(shape,b); if(custom) return custom;
  if(shape==='circle') return `<ellipse cx="${b.x+b.w/2}" cy="${b.y+b.h/2}" rx="${Math.min(b.w,b.h)/2}" ry="${Math.min(b.w,b.h)/2}"/>`;
  if(shape==='oval') return `<ellipse cx="${b.x+b.w/2}" cy="${b.y+b.h/2}" rx="${b.w/2}" ry="${b.h/2}"/>`;
  if(shape==='triangle') return `<polygon points="${b.x+b.w/2},${b.y} ${b.x+b.w},${b.y+b.h} ${b.x},${b.y+b.h}"/>`;
  if(shape==='diamond') return `<polygon points="${b.x+b.w/2},${b.y} ${b.x+b.w},${b.y+b.h/2} ${b.x+b.w/2},${b.y+b.h} ${b.x},${b.y+b.h/2}"/>`;
  if(shape==='pentagon') return `<polygon points="${regularPolygonPoints(b.x+b.w/2,b.y+b.h/2,b.w/2,b.h/2,5)}"/>`;
  if(shape==='hexagon') return `<polygon points="${regularPolygonPoints(b.x+b.w/2,b.y+b.h/2,b.w/2,b.h/2,6,0)}"/>`;
  if(shape==='octagon') return `<polygon points="${regularPolygonPoints(b.x+b.w/2,b.y+b.h/2,b.w/2,b.h/2,8,Math.PI/8)}"/>`;
  if(shape==='star') return `<polygon points="${starPoints(b.x+b.w/2,b.y+b.h/2,b.w/2,b.h/2)}"/>`;
  if(shape==='heart') return `<path d="${heartPath(b)}"/>`;
  return '';
}
function createImageObject(o,b){
  const ib=o.maskShape&&o.maskShape!=='none'?imageMaskContentBox(o.maskShape,b):b;
  let inner;
  if(o.crop&&o.naturalW&&o.naturalH){
    const c=o.crop, vbX=c.x*o.naturalW, vbY=c.y*o.naturalH, vbW=c.w*o.naturalW, vbH=c.h*o.naturalH;
    inner=`<svg x="${ib.x}" y="${ib.y}" width="${ib.w}" height="${ib.h}" viewBox="${vbX} ${vbY} ${vbW} ${vbH}" preserveAspectRatio="xMidYMid meet"><image href="${esc(o.src)}" width="${o.naturalW}" height="${o.naturalH}" preserveAspectRatio="none"/></svg>`;
  } else {
    inner=`<image x="${ib.x}" y="${ib.y}" width="${ib.w}" height="${ib.h}" href="${esc(o.src)}" preserveAspectRatio="xMidYMid meet"/>`;
    if(!o.naturalW){const probe=new Image(); probe.onload=()=>{o.naturalW=probe.width; o.naturalH=probe.height; requestRender()}; probe.src=o.src}
  }
  const clip=imageMaskClipSvg(o.maskShape,b);
  if(!clip) return svgEl(`<g opacity="${o.opacity}">${inner}</g>`);
  return svgEl(`<g opacity="${o.opacity}"><defs><clipPath id="imgmask_${o.id}">${clip}</clipPath></defs><g clip-path="url(#imgmask_${o.id})">${inner}</g></g>`);
}
function shapeClipNode(type,b){if(type==='rect')return svgEl(`<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="8"/>`);if(type==='ellipse')return svgEl(`<ellipse cx="${b.x+b.w/2}" cy="${b.y+b.h/2}" rx="${b.w/2}" ry="${b.h/2}"/>`);if(type==='diamond')return svgEl(`<polygon points="${b.x+b.w/2},${b.y} ${b.x+b.w},${b.y+b.h/2} ${b.x+b.w/2},${b.y+b.h} ${b.x},${b.y+b.h/2}"/>`);if(type==='triangle')return svgEl(`<polygon points="${b.x+b.w/2},${b.y} ${b.x+b.w},${b.y+b.h} ${b.x},${b.y+b.h}"/>`);if(type==='callout')return svgEl(`<path d="${calloutPath(b)}"/>`);return svgEl(`<path d="${speechPath(b)}"/>`)}
function textBoxFor(type,b){if(type==='ellipse')return{x:b.x+b.w*.18,y:b.y+b.h*.18,w:b.w*.64,h:b.h*.64};if(type==='diamond')return{x:b.x+b.w*.21,y:b.y+b.h*.21,w:b.w*.58,h:b.h*.58};if(type==='triangle')return{x:b.x+b.w*.19,y:b.y+b.h*.16,w:b.w*.62,h:b.h*.68};if(type==='polygon')return{x:b.x+b.w*.18,y:b.y+b.h*.22,w:b.w*.64,h:b.h*.56};if(type==='star')return{x:b.x+b.w*.28,y:b.y+b.h*.34,w:b.w*.44,h:b.h*.34};if(type==='callout'||type==='speech')return{x:b.x+14,y:b.y+12,w:b.w-28,h:b.h-Math.min(30,b.h*.24)-16};if(type==='sticky')return{x:b.x+12,y:b.y+12,w:b.w-24,h:b.h-24};if(type==='text')return{x:b.x,y:b.y,w:b.w,h:b.h};return{x:b.x+12,y:b.y+12,w:b.w-24,h:b.h-24}}

function createStyledDiv(o){const d=document.createElementNS(XHTML,'div'),h=o.hAlign||'left',v=o.vAlign||'top';d.setAttribute('xmlns',XHTML);Object.assign(d.style,{width:'100%',height:'100%',boxSizing:'border-box',display:'flex',flexDirection:'column',justifyContent:v==='top'?'flex-start':(v==='middle'?'center':'flex-end'),alignItems:h==='left'?'flex-start':(h==='center'?'center':'flex-end'),textAlign:h,padding:'2px',color:o.textColor||'#111827',fontFamily:'Inter, Arial, sans-serif',fontSize:(o.fontSize||20)+'px',lineHeight:'1.25',transform:`rotate(${o.textRotation||0}deg)`,transformOrigin:'center center',wordBreak:'break-word',overflow:'hidden'});d.innerHTML=objectHtml(o,o.type==='sticky'?'Add note...':(o.type==='text'?'Text':''));return d}
function createShapeTextObject(o,b){const g=document.createElementNS(NS,'g'),defs=document.createElementNS(NS,'defs'),clip=document.createElementNS(NS,'clipPath');clip.id='clip_'+o.id;clip.appendChild(shapeClipNode(o.type,b));defs.appendChild(clip);g.appendChild(defs);const fo=document.createElementNS(NS,'foreignObject'),box=textBoxFor(o.type,b);if(o.conceptNode&&o.conceptImageSrc){const inset=Math.min(58,b.w*.34);box.x+=inset;box.w=Math.max(24,box.w-inset)}fo.setAttribute('x',box.x);fo.setAttribute('y',box.y);fo.setAttribute('width',Math.max(10,box.w));fo.setAttribute('height',Math.max(10,box.h));fo.setAttribute('clip-path',`url(#clip_${o.id})`);fo.setAttribute('pointer-events','none');fo.appendChild(createStyledDiv(o));g.appendChild(fo);return g}
function createConceptNodeExtras(o,b){
  const g=document.createElementNS(NS,'g');
  if(o.conceptImageSrc){
    const x=b.x+10,y=b.y+10,w=Math.min(46,b.w*.28),h=Math.min(46,b.h-20),cx=x+w/2,cy=y+h/2,kind=o.conceptImageKind||pictureGraphSymbolKind(o.conceptImageSrc);
    if(kind==='image') g.appendChild(svgEl(`<image x="${x}" y="${y}" width="${w}" height="${h}" href="${esc(o.conceptImageSrc)}" preserveAspectRatio="xMidYMid meet" opacity="${o.opacity}"/>`));
    else g.appendChild(svgEl(`<text x="${cx}" y="${cy+Math.min(w,h)*.32}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.min(w,h)}" opacity="${o.opacity}">${esc(o.conceptImageSrc).slice(0,4)}</text>`));
  }
  if(o.conceptLink) g.appendChild(svgEl(`<g opacity="${o.opacity}"><circle cx="${b.x+b.w-18}" cy="${b.y+18}" r="10" fill="#eff6ff" stroke="#2563eb" stroke-width="1.4"/><text x="${b.x+b.w-18}" y="${b.y+23}" text-anchor="middle" font-size="15" fill="#2563eb" font-weight="800">↗</text></g>`));
  return g;
}
function createConnectorLabelObject(o){
  if(o.id===inlineEditId) return null;
  const label=String(o.connectorLabel||'').trim();
  if(!label) return null;
  const layout=connectorLabelLayout(o), fs=layout.fs, lineH=fs*1.14;
  const rawLines=label.split(/\n/).flatMap(line=>{
    const words=line.trim().split(/\s+/).filter(Boolean), lines=[];
    let cur='';
    words.forEach(word=>{
      const next=cur?cur+' '+word:word;
      if(next.length>22&&cur){lines.push(cur); cur=word}else cur=next;
    });
    if(cur) lines.push(cur);
    return lines;
  }).slice(0,4);
  if(!rawLines.length) return null;
  const w=layout.w, h=rawLines.length*lineH+8, angle=layout.angle;
  const text=rawLines.map((line,i)=>`<tspan x="0" dy="${i?lineH:0}">${esc(line)}</tspan>`).join('');
  const y0=-(rawLines.length-1)*lineH/2+fs*.34;
  return svgEl(`<g opacity="${o.opacity}" pointer-events="none" transform="translate(${layout.x} ${layout.y}) rotate(${angle})"><rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="4" fill="${esc(o.connectorLabelFill||'#ffffff')}" opacity="0.92"/><text x="0" y="${y0}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="${fs}" font-weight="700" fill="${esc(o.connectorLabelColor||o.stroke||'#334155')}">${text}</text></g>`);
}
function createTextObject(o,b){const fo=document.createElementNS(NS,'foreignObject');fo.setAttribute('x',b.x);fo.setAttribute('y',b.y);fo.setAttribute('width',Math.max(20,b.w));fo.setAttribute('height',Math.max(20,b.h));fo.setAttribute('opacity',o.opacity);fo.appendChild(createStyledDiv(o));return fo}
function createStickyObject(o,b){const fo=document.createElementNS(NS,'foreignObject');fo.setAttribute('x',b.x);fo.setAttribute('y',b.y);fo.setAttribute('width',Math.max(20,b.w));fo.setAttribute('height',Math.max(20,b.h));fo.setAttribute('opacity',o.opacity);const d=document.createElementNS(XHTML,'div');d.setAttribute('xmlns',XHTML);d.className='postit';Object.assign(d.style,{background:o.fill,width:'100%',height:'100%',fontSize:(o.fontSize||16)+'px',color:o.textColor||'#111827',display:'flex',flexDirection:'column',justifyContent:(o.vAlign||'top')==='top'?'flex-start':((o.vAlign||'top')==='middle'?'center':'flex-end'),textAlign:o.hAlign||'left',alignItems:(o.hAlign||'left')==='left'?'flex-start':((o.hAlign||'left')==='center'?'center':'flex-end'),transform:`rotate(${o.textRotation||0}deg)`,transformOrigin:'center center',gap:'8px'});if(o.imageSrc){const img=document.createElementNS(XHTML,'img');img.setAttribute('src',o.imageSrc);Object.assign(img.style,{width:'100%',maxHeight:'45%',objectFit:'cover',borderRadius:'8px',border:'1px solid rgba(0,0,0,.12)'});d.appendChild(img)}const content=document.createElementNS(XHTML,'div');content.innerHTML=objectHtml(o,'Add note...');content.style.width='100%';d.appendChild(content);fo.appendChild(d);return fo}
function createCommentObject(o,b){const g=document.createElementNS(NS,'g');const pinFill=o.resolved?'#9ca3af':'#ef4444';g.appendChild(svgEl(`<line x1="${b.x+14}" y1="${b.y+16}" x2="${b.x+14}" y2="${b.y+b.h}" stroke="${pinFill}" stroke-width="3" opacity="${o.opacity}"/>`));g.appendChild(svgEl(`<circle cx="${b.x+14}" cy="${b.y+14}" r="10" fill="${pinFill}" opacity="${o.opacity}"/>`));const fo=document.createElementNS(NS,'foreignObject');fo.setAttribute('x',b.x+24);fo.setAttribute('y',b.y);fo.setAttribute('width',Math.max(120,b.w-24));fo.setAttribute('height',Math.max(50,b.h));const d=document.createElementNS(XHTML,'div');d.setAttribute('xmlns',XHTML);Object.assign(d.style,{width:'100%',height:'100%',background:o.resolved?'#f3f4f6':'#fff7e6',border:'1px solid '+(o.resolved?'#d1d5db':'#f59e0b'),borderRadius:'10px',padding:'10px',fontSize:(o.fontSize||16)+'px',color:o.textColor||'#111827',display:'flex',flexDirection:'column',justifyContent:'space-between'});const badge=document.createElementNS(XHTML,'div');badge.textContent=o.resolved?'Resolved Comment':'Feedback Pin';badge.style.fontWeight='700';badge.style.fontSize='12px';badge.style.marginBottom='6px';const content=document.createElementNS(XHTML,'div');content.innerHTML=objectHtml(o,'Add feedback...');content.style.flex='1';content.style.wordBreak='break-word';d.appendChild(badge);d.appendChild(content);fo.appendChild(d);g.appendChild(fo);return g}
function createStampObject(o,b){const fo=document.createElementNS(NS,'foreignObject');fo.setAttribute('x',b.x);fo.setAttribute('y',b.y);fo.setAttribute('width',Math.max(30,b.w));fo.setAttribute('height',Math.max(30,b.h));fo.setAttribute('opacity',o.opacity);const d=document.createElementNS(XHTML,'div');d.setAttribute('xmlns',XHTML);Object.assign(d.style,{width:'100%',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',border:o.emojiParts?'2px solid rgba(124,58,237,.18)':'2px solid rgba(0,0,0,.08)',borderRadius:'18px',background:o.stampBg||'#eef2ff',overflow:'hidden'});let icon;if(o.stampSrc){icon=document.createElementNS(XHTML,'img');icon.setAttribute('src',o.stampSrc);Object.assign(icon.style,{maxWidth:'70%',maxHeight:'56%',objectFit:'contain'})}else if(o.emojiParts?.length){icon=document.createElementNS(XHTML,'div');Object.assign(icon.style,{position:'relative',width:'78%',height:'68%',minHeight:'44px'});o.emojiParts.slice(0,4).forEach((emoji,i)=>{const part=document.createElementNS(XHTML,'span');part.textContent=emoji;Object.assign(part.style,{position:'absolute',left:[8,34,18,44][i%4]+'%',top:[4,22,36,6][i%4]+'%',fontSize:Math.max(24,Math.min(b.w,b.h)*[.5,.44,.38,.34][i%4])+'px',transform:`rotate(${[-10,12,0,-18][i%4]}deg)`,filter:'drop-shadow(0 2px 1px rgba(0,0,0,.12))'});icon.appendChild(part)})}else{icon=document.createElementNS(XHTML,'div');icon.textContent=o.stampIcon||'⭐';icon.style.fontSize=Math.max(26,Math.min(b.w,b.h)*0.56)+'px';}const label=document.createElementNS(XHTML,'div');label.textContent=o.stampLabel||'Sticker';label.style.fontSize='12px';label.style.fontWeight='700';label.style.marginTop='4px';d.appendChild(icon);d.appendChild(label);fo.appendChild(d);return fo}
function createAudioObject(o,b){const fo=document.createElementNS(NS,'foreignObject');fo.setAttribute('x',b.x);fo.setAttribute('y',b.y);fo.setAttribute('width',Math.max(80,b.w));fo.setAttribute('height',Math.max(60,b.h));fo.setAttribute('opacity',o.opacity);const d=document.createElementNS(XHTML,'div');d.setAttribute('xmlns',XHTML);d.className='audio-card';Object.assign(d.style,{width:'100%',height:'100%',background:o.fill&&o.fill!=='none'?o.fill:'#eff6ff',border:'1px solid #bfdbfe'});const pill=document.createElementNS(XHTML,'div');pill.className='audio-pill';pill.textContent=o.audioSrc?'Audio Ready':'Audio Note';const title=document.createElementNS(XHTML,'div');title.style.fontWeight='700';title.innerHTML=objectHtml(o,'Voice note');const meta=document.createElementNS(XHTML,'div');meta.style.fontSize='12px';meta.style.color='#475569';meta.textContent=o.audioSrc?(o.audioName||'Tap Play Audio in the inspector'):'Use Record Audio or Load Audio';d.appendChild(pill);d.appendChild(title);d.appendChild(meta);fo.appendChild(d);return fo}
function svgEl(s){const t=document.createElementNS(NS,'g');t.innerHTML=s.trim();return t.firstChild}

function selectionBounds(ids=selectedIds){const objs=ids.map(findObj).filter(Boolean);if(!objs.length)return null;const boxes=objs.map(normBox);const x=Math.min(...boxes.map(b=>b.x)),y=Math.min(...boxes.map(b=>b.y)),r=Math.max(...boxes.map(b=>b.x+b.w)),bt=Math.max(...boxes.map(b=>b.y+b.h));return{x,y,w:r-x,h:bt-y}}
function selectedResizableIds(){return selectedIds.filter(idv=>{const o=findObj(idv);return o&&o.type!=='connector'&&o.type!=='scratch'&&canEditObject(o)&&!o.locked})}
function drawSelection(){const g=svg.querySelector('#viewport');if(!selectedIds.length||!g)return;selectedIds.forEach(idv=>{const o=findObj(idv);if(!o)return;const b=normBox(o),pad=(o.type==='image'||o.type==='stamp')?1:4;g.appendChild(svgEl(`<rect class="selection" x="${b.x-pad}" y="${b.y-pad}" width="${b.w+pad*2}" height="${b.h+pad*2}"/>`))});const resizeIds=selectedResizableIds();if(selectedIds.length===1){const o=findObj(selectedIds[0]);if(o&&resizeIds.length){const b=normBox(o),sz=22;const h=svgEl(`<rect class="handle" x="${b.x+b.w-sz/2}" y="${b.y+b.h-sz/2}" width="${sz}" height="${sz}" rx="4"/>`);h.addEventListener('pointerdown',resizeDown);g.appendChild(h)}}else{const b=selectionBounds(resizeIds); if(b){g.appendChild(svgEl(`<rect class="selection group-selection" x="${b.x-8}" y="${b.y-8}" width="${b.w+16}" height="${b.h+16}"/>`));const sz=24,h=svgEl(`<rect class="handle group-handle" x="${b.x+b.w-sz/2}" y="${b.y+b.h-sz/2}" width="${sz}" height="${sz}" rx="5"/>`);h.addEventListener('pointerdown',resizeDown);g.appendChild(h)}}}
function groupMembers(o){if(!o||!o.groupId)return[o?.id].filter(Boolean);return panel().objects.filter(x=>x.groupId===o.groupId).map(x=>x.id)}
function coloringPaintIdsFor(ids){return panel().objects.filter(o=>ids.includes(o.coloringPaintFor)&&canEditObject(o)&&!o.locked).map(o=>o.id)}
function idsWithColoringPaint(ids){return [...new Set([...ids,...coloringPaintIdsFor(ids)])]}

let _lastObjClick={id:null,t:0};
function scratchEraseWidth(){return Math.max(12,Math.min(96,(+ui.strokeWidth?.value||12)*2.4))}
function startScratchErase(o,p){
  if(!o||o.type!=='scratch') return false;
  if(!canEditObject(o)||o.locked){setStatus('That scratch cover is locked.','danger'); return true}
  o.scratchErasePaths=o.scratchErasePaths||[];
  const path={d:`M ${p.x} ${p.y}`,width:scratchEraseWidth()};
  o.scratchErasePaths.push(path);
  const mask=document.getElementById(`scratch_mask_${o.id}`);
  const maskPath=mask?svgEl(`<path d="${esc(path.d)}" fill="none" stroke="#000" stroke-width="${Math.max(1,+path.width||32)}" stroke-linecap="round" stroke-linejoin="round"/>`):null;
  if(mask&&maskPath) mask.appendChild(maskPath);
  scratchErase={objectId:o.id,path,pathEl:maskPath,lastX:p.x,lastY:p.y};
  eraserDirty=true;
  if(!maskPath) requestRender();
  return true;
}
function appendScratchErasePoint(p){
  if(!scratchErase) return false;
  const o=findObj(scratchErase.objectId);
  if(!o||!scratchErase.path) return false;
  if(Math.hypot(p.x-(scratchErase.lastX??p.x),p.y-(scratchErase.lastY??p.y))<1.5) return true;
  scratchErase.path.d+=` L ${p.x} ${p.y}`;
  scratchErase.lastX=p.x;
  scratchErase.lastY=p.y;
  if(scratchErase.pathEl) scratchErase.pathEl.setAttribute('d',scratchErase.path.d);
  else requestRender();
  return true;
}
function objectDown(e){if(tool==='eraser') return; e.stopPropagation();const o=findObj(e.currentTarget.dataset.id);if(!o)return; const p=pt(e); if(tool==='bucket'){applyBucketFill(o); return} if(tool==='coloringpaint'){if(startColoringStroke(p)) return; setStatus('Select a coloring page, then drag inside it to paint.','danger'); return} if(board.assignmentMode&&board.mode==='student'&&o.layer==='teacher'){setStatus('Teacher-layer items are protected in assignment mode.','danger'); return} if(tool==='dotpaint'){if(o.type!=='dot') return setStatus('Dot Paint colors dot-picture dots only.','danger'); if(!canEditObject(o)) return setStatus('That dot is locked.','danger'); dotPaintDrag={active:true,moved:false,startX:p.x,startY:p.y,color:paintColor(),painted:new Set,clickDotId:o.id}; selectedIds=[o.id]; render(); return} if(tool==='select'&&handleWheelSpinnerScreenAction(o,p)){_lastObjClick={id:null,t:0}; return} if(tool==='select'&&handleScoreboardScreenAction(o,p)){_lastObjClick={id:null,t:0}; return} const _now=performance.now(); if(tool==='select'&&_lastObjClick.id===o.id&&(_now-_lastObjClick.t)<500){_lastObjClick={id:null,t:0}; if(TEXTABLE_TYPES.includes(o.type)){openInlineTextEditor(o.id); return} if(o.type==='widget'){openClassroomWidgetDialog(o.id); return} if(o.type==='image'&&o.pictureGraphConfig){openPictureGraphDialog(o.id); return} if(o.type==='image'&&o.graphConfig){openGraphDialog(o.id); return} if(o.type==='image'&&o.mermaidSource){openMermaidDialog(o.id); return} if(o.type==='image'&&o.wordCloudSource){openWordCloudDialog(o.id); return}} _lastObjClick={id:o.id,t:_now}; if(tool==='connector'){if(o.type==='connector')return; if(!connectorPendingFrom){connectorPendingFrom=o.id; setSingleSelection(o.id); render(); setStatus('Connector: select the second shape.','success'); return}else if(connectorPendingFrom!==o.id){panel().objects.push(makeObj('connector',0,0,0,0,{fromId:connectorPendingFrom,toId:o.id,fill:'none'})); connectorPendingFrom=null; render(); saveState(); setStatus('Connector added.','success'); return}else{connectorPendingFrom=null; setStatus('Connector cancelled.'); return}}
  const multi=e.shiftKey||touchMultiSelect;
  const keepCurrentSelection=!multi&&selectedIds.length>1&&isSelected(o.id);
  const ids=multi?(toggleSelection(o.id),selectedIds):(keepCurrentSelection?selectedIds:((o.groupId&&!e.altKey)?groupMembers(o):[o.id]));
  if(!multi) selectedIds=ids;
  if(o.locked||o.type==='connector'||(touchMultiSelect&&e.pointerType==='touch')){render();return}
  const dragIds=idsWithColoringPaint(selectedIds.filter(idv=>{const s=findObj(idv);return s&&s.type!=='connector'&&s.type!=='scratch'&&canEditObject(s)&&!s.locked}));
  if(!dragIds.length){render();return}
  drag={resize:false,ids:[...dragIds],startX:p.x,startY:p.y,starts:dragIds.map(idv=>{const s=findObj(idv);return{id:s.id,x:s.x,y:s.y,w:s.w,h:s.h,fontSize:s.fontSize||20,d:s.d,clipBox:s.clipBox?{...s.clipBox}:null}})};
  if(['sticky','text','comment'].includes(o.type)&&canEditObject(o)&&!multi&&!keepCurrentSelection) drag.candidateEdit=o.id;
  render()}
function resizeDown(e){e.stopPropagation();const ids=selectedResizableIds();if(!ids.length)return;ids.forEach(idv=>{const o=findObj(idv); if(o?.type==='text') o.textAutoFitBox=false});const b=selectionBounds(ids),p=pt(e);if(!b)return;const dragIds=idsWithColoringPaint(ids);drag={resize:true,ids:dragIds,sx:p.x,sy:p.y,ox:b.x,oy:b.y,ow:b.w,oh:b.h,starts:dragIds.map(idv=>{const s=findObj(idv);return{id:s.id,x:s.x,y:s.y,w:s.w,h:s.h,fontSize:s.fontSize||20,d:s.d,clipBox:s.clipBox?{...s.clipBox}:null}})}}

svg.addEventListener('pointerdown',e=>{const p=pt(e); if(tool==='coloringpaint'){if(startColoringStroke(p)) return; setStatus('Select a coloring page, then drag inside it to paint.','danger'); return} if(tool==='dotpaint'){if(e.target.closest('.object')) return; const o=dotAtPoint(p.x,p.y); if(o){dotPaintDrag={active:true,moved:false,startX:p.x,startY:p.y,color:paintColor(),painted:new Set}; paintDotAtPoint(p.x,p.y); return} setStatus('Dot Paint: drag across dots or click a dot to choose a color.','danger'); return} if(tool==='bucket'){const objEl=e.target.closest('.object'); if(objEl){applyBucketFill(findObj(objEl.dataset.id)); return} applyCanvasBucketFill(); return} if(tool==='eraser'){const objEl=e.target.closest('.object'); if(objEl){const o=findObj(objEl.dataset.id); if(o?.type==='scratch'){startScratchErase(o,p); return} if(o&&canEditObject(o)&&!o.locked){cleanupConnectors([o.id]); cleanupColoringPaint([o.id]); panel().objects=panel().objects.filter(x=>x.id!==o.id); clearSelection(); render(); saveState(); setStatus('Erased.','success')} else if(o&&o.locked) setStatus('That item is locked.','danger')} else setStatus('Drag on a Scratch Cover, or click an object to erase it.','danger'); return} if(tool==='laser'){drawing={id:'laser_'+id(),type:'laser',d:`M ${p.x} ${p.y}`,x:p.x,y:p.y,w:1,h:1}; const path=svgEl(`<path class="laser-trail" d="${drawing.d}" stroke="#ef4444" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.95"/>`); svg.appendChild(path); drawing._laserPath=path; return} if(tool==='select'){if(!e.target.closest('.object')){clearSelection(); connectorPendingFrom=null; marquee={active:true,x1:p.x,y1:p.y,x2:p.x,y2:p.y}; render()} return} if(['rect','ellipse','line','arrow','diamond','triangle','callout','speech','polygon','star'].includes(tool)){const extra=TEXTABLE_TYPES.includes(tool)?{html:'',text:'',textColor:ui.textColor.value,fontSize:+ui.fontSize.value||20,hAlign:'center',vAlign:'middle',textRotation:0,autoScaleText:true}:{}; drawing=makeObj(tool,p.x,p.y,1,1,extra); panel().objects.push(drawing); setSingleSelection(drawing.id); render(); return} if(tool==='pen'){drawing={id:id(),type:'path',d:`M ${p.x} ${p.y}`,x:p.x,y:p.y,w:1,h:1,locked:false,...style()}; panel().objects.push(drawing); setSingleSelection(drawing.id); const g=svg.querySelector('#viewport'); liveDrawingPathEl=svgEl(`<path d="${esc(drawing.d)}" fill="none" stroke="${esc(drawing.stroke||'#111827')}" stroke-width="${drawing.strokeWidth||2}" opacity="${drawing.opacity??1}" stroke-linecap="round" stroke-linejoin="round"/>`); if(g&&liveDrawingPathEl) g.appendChild(liveDrawingPathEl); else requestRender(); return} if(tool==='text'){const fontSize=+ui.fontSize.value||24; const obj=makeObj('text',p.x,p.y,Math.max(96,fontSize*4),Math.round(fontSize*1.25+12),{fill:'none',stroke:'none',html:'',text:'',fontSize,textColor:ui.textColor.value,hAlign:'left',vAlign:'top',autoScaleText:true,textAutoFitBox:true}); addObj(obj); openInlineTextEditor(obj.id); return} if(tool==='sticky'){const obj=makeObj('sticky',p.x,p.y,180,160,{fill:ui.stickyColor.value,stroke:'#111827',strokeWidth:1,html:'',text:'',fontSize:+ui.fontSize.value||16,textColor:ui.textColor.value,autoScaleText:true,imageSrc:''}); addObj(obj); openInlineTextEditor(obj.id); return} if(tool==='comment'){const obj=makeObj('comment',p.x,p.y,220,120,{fill:'#fff7e6',stroke:'#f59e0b',strokeWidth:2,html:'',text:'',fontSize:16,textColor:'#111827',resolved:false}); addObj(obj); openInlineTextEditor(obj.id); return} if(tool==='audio'){addObj(makeObj('audio',p.x,p.y,220,100,{fill:'#eff6ff',stroke:'#93c5fd',strokeWidth:2,html:'',text:'',fontSize:18,textColor:'#111827',audioSrc:'',audioName:''})); return} if(tool==='connector'){connectorPendingFrom=null; setStatus('Connector: click first shape, then second shape.'); return}});

/* v2.5: pointermove uses requestRender (RAF coalescing). */
let lastCursorBroadcast=0;
svg.addEventListener('pointermove',e=>{const p=pt(e); const now=performance.now(); if(localChannel && now-lastCursorBroadcast>50){ broadcastCursor(p.x,p.y); lastCursorBroadcast=now } if(dotPaintDrag?.active&&e.buttons>0){if(Math.hypot(p.x-dotPaintDrag.startX,p.y-dotPaintDrag.startY)>4) dotPaintDrag.moved=true; paintDotAtPoint(p.x,p.y); return} if(tool==='eraser'&&e.buttons>0){if(scratchErase){appendScratchErasePoint(p); return} const objEl=e.target.closest('.object'); if(objEl){const o=findObj(objEl.dataset.id); if(o?.type==='scratch'){startScratchErase(o,p); return} if(o&&o.type==='path'&&canEditObject(o)&&!o.locked){panel().objects=panel().objects.filter(x=>x.id!==o.id); eraserDirty=true; requestRender()}} return} if(marquee&&marquee.active){marquee.x2=p.x; marquee.y2=p.y; requestRender(); return} if(drag){if(drag.candidateEdit&&Math.hypot(p.x-drag.startX,p.y-drag.startY)>4) drag.candidateEdit=null; if(drag.resize){const nextW=Math.max(20,drag.ow+(p.x-drag.sx)),nextH=Math.max(20,drag.oh+(p.y-drag.sy)),scaleX=nextW/Math.max(1,drag.ow),scaleY=nextH/Math.max(1,drag.oh),fontScale=Math.min(scaleX,scaleY);drag.starts.forEach(s=>{const o=findObj(s.id); if(!o||o.locked||o.type==='connector')return; o.x=drag.ox+(s.x-drag.ox)*scaleX; o.y=drag.oy+(s.y-drag.oy)*scaleY; o.w=Math.max(20,s.w*scaleX); o.h=Math.max(20,s.h*scaleY); if(o.type==='path'&&s.d){o.d=scaledPathData(s.d,drag.ox,drag.oy,scaleX,scaleY); if(s.clipBox)o.clipBox={x:drag.ox+(s.clipBox.x-drag.ox)*scaleX,y:drag.oy+(s.clipBox.y-drag.oy)*scaleY,w:s.clipBox.w*scaleX,h:s.clipBox.h*scaleY}} if(TEXTABLE_TYPES.includes(o.type)&&o.autoScaleText) o.fontSize=clamp(Math.round(s.fontSize*fontScale),8,96)}); requestRender(); return}else{const dx=p.x-drag.startX,dy=p.y-drag.startY; drag.starts.forEach(s=>{const o=findObj(s.id); if(!o||o.locked||o.type==='connector')return; o.x=s.x+dx; o.y=s.y+dy; if(o.type==='path'&&s.d){o.d=translatedPathData(s.d,dx,dy); if(s.clipBox)o.clipBox={x:s.clipBox.x+dx,y:s.clipBox.y+dy,w:s.clipBox.w,h:s.clipBox.h}}}); requestRender(); return}} if(drawing){if(drawing.type==='laser'){drawing.d+=` L ${p.x} ${p.y}`; if(drawing._laserPath) drawing._laserPath.setAttribute('d',drawing.d); return} if(drawing.type==='path'){if(drawing.coloringSpray) appendSprayDots(drawing,p); else drawing.d+=` L ${p.x} ${p.y}`; drawing.w=Math.max(drawing.w,p.x-drawing.x); drawing.h=Math.max(drawing.h,p.y-drawing.y); if(liveDrawingPathEl&&!drawing.coloringSpray){liveDrawingPathEl.setAttribute('d',drawing.d); return}} else {drawing.w=p.x-drawing.x; drawing.h=p.y-drawing.y} requestRender()}});

window.addEventListener('pointerup',e=>{if(dotPaintDrag?.active){const wasMoved=dotPaintDrag.moved, painted=dotPaintDrag.painted?.size||0, targetId=selectedIds[0]; dotPaintDrag=null; if(wasMoved){if(painted) saveState(); render(); return} const o=findObj(targetId); if(o&&o.type==='dot') openDotPaintPalette(o.id,e); return} if(tool==='eraser'){scratchErase=null; if(eraserDirty) saveState(); else saveState(false); eraserDirty=false; return} if(marquee&&marquee.active){const m={x:Math.min(marquee.x1,marquee.x2),y:Math.min(marquee.y1,marquee.y2),w:Math.abs(marquee.x2-marquee.x1),h:Math.abs(marquee.y2-marquee.y1)}; selectedIds=panel().objects.filter(o=>{const b=normBox(o); return !(board.assignmentMode&&board.mode==='student'&&o.layer==='teacher') && b.x<=m.x+m.w && b.x+b.w>=m.x && b.y<=m.y+m.h && b.y+b.h>=m.y}).map(o=>o.id); marquee=null; render(); return} if(drawing&&drawing.type==='laser'){const path=drawing._laserPath; if(path){setTimeout(()=>{path.style.transition='opacity 1.2s ease-out'; path.style.opacity='0'; setTimeout(()=>path.remove(),1300)},1500)} drawing=null; return} if(drag&&drag.candidateEdit&&!drag.resize){const editId=drag.candidateEdit; drag=null; openInlineTextEditor(editId); return} if(drawing)normalizeObject(drawing); if(drag) drag.ids.forEach(i=>normalizeObject(findObj(i))); if(drag||drawing)saveState(); liveDrawingPathEl=null; drag=null; drawing=null; render()});

svg.addEventListener('dblclick',e=>{const objEl=e.target.closest('.object'); if(!objEl) return; const o=findObj(objEl.dataset.id); if(!o) return; if(o.type==='widget'){e.stopPropagation(); openClassroomWidgetDialog(o.id); return} if(o.type==='image'&&o.pictureGraphConfig){e.stopPropagation(); openPictureGraphDialog(o.id); return} if(o.type==='image'&&o.graphConfig){e.stopPropagation(); openGraphDialog(o.id); return} if(o.type==='image'&&o.wordCloudSource){e.stopPropagation(); openWordCloudDialog(o.id); return} if(o.type==='image'&&o.mermaidSource){e.stopPropagation(); openMermaidDialog(o.id); return} if((TEXTABLE_TYPES.includes(o.type)||o.type==='connector')&&canEditObject(o)){e.stopPropagation(); openInlineTextEditor(o.id)}});
document.addEventListener('pointerdown',e=>{const pop=gid('dotPaintPalette'); if(pop?.classList.contains('show')&&!pop.contains(e.target)&&!e.target.closest('.object')) closeDotPaintPalette()});
function addObj(o){panel().objects.push(o); setSingleSelection(o.id); render(); saveState()}
function cleanupConnectors(ids){panel().objects=panel().objects.filter(o=>o.type!=='connector'||(!ids.includes(o.id)&&!ids.includes(o.fromId)&&!ids.includes(o.toId)))}
function cleanupColoringPaint(ids){panel().objects=panel().objects.filter(o=>!ids.includes(o.coloringPaintFor))}
function deleteSelected(){if(!selectedIds.length)return; const editable=selectedIds.filter(idv=>canEditObject(findObj(idv))); cleanupConnectors(editable); cleanupColoringPaint(editable); panel().objects=panel().objects.filter(o=>!editable.includes(o.id)); clearSelection(); render(); saveState()}
function duplicateSelected(){if(!selectedIds.length)return; const copies=[], map={}, sourceIds=idsWithColoringPaint(selectedIds); sourceIds.forEach(sel=>{const o=findObj(sel); if(!o||o.type==='connector'||!canEditObject(o))return; const c=JSON.parse(JSON.stringify(o)); c.id=id(); c.x+=24; c.y+=24; if(c.type==='path'&&c.d)c.d=translatedPathData(c.d,24,24); if(c.clipBox)c.clipBox={x:c.clipBox.x+24,y:c.clipBox.y+24,w:c.clipBox.w,h:c.clipBox.h}; if(board.assignmentMode&&board.mode==='student') c.layer='student'; map[o.id]=c.id; copies.push(c)}); copies.forEach(c=>{if(c.coloringPaintFor&&map[c.coloringPaintFor]) c.coloringPaintFor=map[c.coloringPaintFor]}); panel().objects.push(...copies); selectedIds=copies.filter(c=>sourceIds.includes(c.coloringPaintFor)?false:!c.coloringPaintFor).map(c=>c.id); render(); saveState(); if(copies.length) setStatus('Duplicated '+copies.length+' item'+(copies.length===1?'':'s')+'.','success')}
function copySelection(){if(!selectedIds.length)return; const sourceIds=idsWithColoringPaint(selectedIds); const list=panel().objects.filter(o=>sourceIds.includes(o.id) && o.type!=='connector').map(o=>JSON.parse(JSON.stringify(o))); const selSet=new Set(list.map(o=>o.id)); const connectors=panel().objects.filter(o=>o.type==='connector'&&selSet.has(o.fromId)&&selSet.has(o.toId)).map(o=>JSON.parse(JSON.stringify(o))); clipboard={objects:list,connectors}; setStatus('Selection copied.','success')}
function selectAllObjects(){commitInlineTextEditor(); selectedIds=panel().objects.filter(o=>!(board.assignmentMode&&board.mode==='student'&&o.layer==='teacher')).map(o=>o.id); render(); setStatus(selectedIds.length?('Selected '+selectedIds.length+' item'+(selectedIds.length===1?'':'s')+'.'):'No items on this frame.','success')}
function pasteClipboard(){if(!clipboard||!clipboard.objects?.length)return; const idMap={}, items=[]; clipboard.objects.forEach(o=>{const c=JSON.parse(JSON.stringify(o)); idMap[o.id]=id(); c.id=idMap[o.id]; c.x+=28; c.y+=28; if(c.type==='path'&&c.d)c.d=translatedPathData(c.d,28,28); if(c.clipBox)c.clipBox={x:c.clipBox.x+28,y:c.clipBox.y+28,w:c.clipBox.w,h:c.clipBox.h}; if(board.assignmentMode&&board.mode==='student') c.layer='student'; items.push(c)}); items.forEach(c=>{if(c.coloringPaintFor&&idMap[c.coloringPaintFor]) c.coloringPaintFor=idMap[c.coloringPaintFor]}); clipboard.connectors?.forEach(o=>{const c=JSON.parse(JSON.stringify(o)); c.id=id(); c.fromId=idMap[o.fromId]; c.toId=idMap[o.toId]; if(c.fromId&&c.toId) items.push(c)}); panel().objects.push(...items); selectedIds=items.filter(o=>o.type!=='connector'&&!o.coloringPaintFor).map(o=>o.id); render(); saveState()}
function selectedMovableObjects(){return selectedIds.map(findObj).filter(o=>o&&o.type!=='connector'&&canEditObject(o)&&!o.locked)}
function frameBounds(){return{x:0,y:0,w:Math.max(1,(svg?.clientWidth||900)/zoom),h:Math.max(1,(svg?.clientHeight||600)/zoom)}}
function syncScratchCoversToFrame(p=panel()){
  const b=frameBounds();
  (p.objects||[]).forEach(o=>{
    if(o.type!=='scratch') return;
    o.x=0;
    o.y=0;
    o.w=Math.max(Math.abs(+o.w||0),b.w);
    o.h=Math.max(Math.abs(+o.h||0),b.h);
  });
}
const SCRATCH_ART_DIR=appPath('assets/scratch-art/');
const SCRATCH_ART_FALLBACKS=['scratch_bkgrnd1.png','scratch_bkgrnd2.png','scratch_bkgrnd3.png','scratch_bkgrnd4.png','scratch_bkgrnd5.png'];
let scratchArtImageCache=null;
let pendingScratchCoverColor=null;
function scratchArtUrl(name){return SCRATCH_ART_DIR+String(name||'').replace(/^\.?\/*/,'')}
function normalizeScratchArtList(list){
  return [...new Set((Array.isArray(list)?list:[]).map(item=>typeof item==='string'?item:(item&&item.src)).filter(Boolean).filter(src=>/\.(png|jpe?g|webp|gif|svg)$/i.test(src)).map(src=>src.startsWith('http')||src.startsWith('data:')||src.includes('/')?src:scratchArtUrl(src)))];
}
async function loadScratchArtImages(){
  if(scratchArtImageCache?.length) return scratchArtImageCache;
  let images=[];
  try{
    const res=await fetch(SCRATCH_ART_DIR+'manifest.json',{cache:'no-cache'});
    if(res.ok) images=normalizeScratchArtList(await res.json());
  }catch(_){}
  if(!images.length){
    try{
      const res=await fetch(SCRATCH_ART_DIR,{cache:'no-cache'});
      if(res.ok){
        const html=await res.text();
        const matches=[...html.matchAll(/href=["']([^"']+\.(?:png|jpe?g|webp|gif|svg))["']/gi)].map(m=>decodeURIComponent(m[1]).split('/').pop());
        images=normalizeScratchArtList(matches);
      }
    }catch(_){}
  }
  scratchArtImageCache=images.length?images:normalizeScratchArtList(SCRATCH_ART_FALLBACKS);
  return scratchArtImageCache;
}
async function chooseScratchArtWallpaper(){
  const images=await loadScratchArtImages();
  return images[Math.floor(Math.random()*images.length)]||'';
}
function hasPanelWallpaper(p=panel()){return !!(p&&p.bgImage)}
async function setRandomScratchArtBackground(showTip=true){
  if(board.mode==='student') return setStatus('Students cannot change the panel background.','danger');
  try{
    const wallpaper=await chooseScratchArtWallpaper();
    if(!wallpaper) return setStatus('No ScratchArt backgrounds found.','danger');
    const p=panel();
    p.bg='blank';
    p.bgImage=wallpaper;
    render();
    saveState();
    setStatus('Random ScratchArt background loaded.','success');
    if(showTip) showFloatingTip('ScratchArt Background','Use Scratch Cover to hide it, then erase to reveal. To remove the background later, use Clear Background in the background tools.',{duration:0});
    return true;
  }catch(err){
    setStatus('ScratchArt background failed. '+(err&&err.message?err.message:String(err)),'danger');
    return false;
  }
}
function ensureScratchArtDialog(){
  let dlg=gid('scratchArtDialog');
  if(dlg) return dlg;
  dlg=document.createElement('dialog');
  dlg.id='scratchArtDialog';
  dlg.className='confirm-dialog scratch-art-dialog';
  dlg.innerHTML='<div class="modal-head"><h2>ScratchArt</h2></div><p class="confirm-msg">Choose the cover color. If this panel has no background image, DrawSplatTM will add a random ScratchArt wallpaper first.</p><div class="row"><label for="scratchCoverColorInput">Cover color</label><input type="color" id="scratchCoverColorInput" value="#ffffff" style="width:60px;height:40px;padding:2px;border:1px solid var(--line);border-radius:8px"></div><div class="confirm-actions"><button id="scratchArtCancelBtn" type="button">Cancel</button><button id="scratchArtRandomBgBtn" type="button">Random Background</button><button id="scratchArtChooseBgBtn" type="button">Choose Background Image</button><button id="scratchArtAddBtn" type="button" class="primary">Add ScratchArt</button></div>';
  document.body.appendChild(dlg);
  gid('scratchArtCancelBtn')?.addEventListener('click',()=>{pendingScratchCoverColor=null; dlg.close()});
  gid('scratchArtRandomBgBtn')?.addEventListener('click',async()=>{await setRandomScratchArtBackground(true);});
  gid('scratchArtChooseBgBtn')?.addEventListener('click',()=>{pendingScratchCoverColor=gid('scratchCoverColorInput')?.value||'#ffffff'; dlg.close(); gid('bgImageInput')?.click()});
  gid('scratchArtAddBtn')?.addEventListener('click',()=>{const color=gid('scratchCoverColorInput')?.value||'#ffffff'; dlg.close(); addScratchCover(color)});
  return dlg;
}
function openScratchArtDialog(){
  if(board.mode==='student') return setStatus('Students cannot add scratch covers to this shared board.','danger');
  const dlg=ensureScratchArtDialog();
  const color=paintColor();
  const input=gid('scratchCoverColorInput');
  if(input) input.value=/^#[0-9a-f]{6}$/i.test(color)?color:'#ffffff';
  dlg.showModal();
}
async function addScratchCover(coverColor){
  if(board.mode==='student') return setStatus('Students cannot add scratch covers to this shared board.','danger');
  const p=panel();
  let usedRandomWallpaper=false;
  if(!hasPanelWallpaper(p)){
    try{
      const wallpaper=await chooseScratchArtWallpaper();
      if(wallpaper){
        p.bg='blank';
        p.bgImage=wallpaper;
        usedRandomWallpaper=true;
      }
    }catch(_){}
  }
  const b=frameBounds();
  const cover=makeObj('scratch',0,0,b.w,b.h,{fill:coverColor||'#ffffff',stroke:'none',strokeWidth:0,opacity:1,fillPattern:'',scratchErasePaths:[]});
  p.objects.push(cover);
  clearSelection();
  render();
  saveState();
  setTool('eraser');
  setStatus((usedRandomWallpaper?'ScratchArt wallpaper and cover added.':'Scratch Cover added.')+' Use the Eraser to reveal the background underneath.','success');
  showFloatingTip('ScratchArt Cover','Erase the cover to reveal the background. To remove everything later, select the cover and delete it, then use Clear Background to remove the wallpaper.',{duration:0});
}
function alignSelectedObjects(mode){
  const objs=selectedMovableObjects();
  if(!objs.length) return setStatus('Select one or more editable objects first.','danger');
  const ref=objs.length>1?selectionBounds(objs.map(o=>o.id)):frameBounds();
  if(!ref) return;
  objs.forEach(o=>{
    const b=normBox(o);
    if(mode==='left') o.x+=ref.x-b.x;
    if(mode==='centerH') o.x+=ref.x+ref.w/2-(b.x+b.w/2);
    if(mode==='right') o.x+=ref.x+ref.w-(b.x+b.w);
    if(mode==='top') o.y+=ref.y-b.y;
    if(mode==='middleV') o.y+=ref.y+ref.h/2-(b.y+b.h/2);
    if(mode==='bottom') o.y+=ref.y+ref.h-(b.y+b.h);
  });
  render(); saveState();
  setStatus((objs.length===1?'Aligned to frame.':'Aligned selected objects.'),'success');
}
function nudgeSelected(dx,dy){
  const objs=selectedMovableObjects();
  if(!objs.length) return false;
  objs.forEach(o=>{o.x+=dx; o.y+=dy});
  render(); saveState(false);
  return true;
}
function pasteBlobAsImage(blob,label){return new Promise(async resolve=>{if(!blob||!(await validateImageDeep(blob))){resolve(false); return} const reader=new FileReader(); reader.onload=async()=>{let dataUrl=reader.result, pendingImageId=''; if(imageNeedsModeration()){const m=await submitImageForApproval(dataUrl,'paste.png'); if(m.blocked){resolve(false); return} dataUrl=m.dataUrl; pendingImageId=m.imageId||''} const probe=new Image(); probe.onload=()=>{let w=probe.width,h=probe.height; const maxDim=600; if(Math.max(w,h)>maxDim){const s=maxDim/Math.max(w,h); w=Math.round(w*s); h=Math.round(h*s)} const extra=pendingImageId?{pendingImageId}:{}; addObj(makeObj('image',120,120,Math.max(40,w),Math.max(40,h),{src:dataUrl,fill:'none',stroke:'#000',strokeWidth:1,...extra})); if(pendingImageId) ensurePendingImagePoller(); else setStatus(label||'Image pasted.','success'); resolve(true)}; probe.onerror=()=>resolve(false); probe.src=dataUrl}; reader.onerror=()=>resolve(false); reader.readAsDataURL(blob)})}
async function smartPaste(){if(navigator.clipboard&&navigator.clipboard.read){try{const items=await navigator.clipboard.read(); for(const item of items){const imgType=item.types.find(t=>t.startsWith('image/')); if(imgType){const blob=await item.getType(imgType); if(await pasteBlobAsImage(blob,'Image pasted from clipboard.')) return}}}catch(_){}} pasteClipboard()}
function svgUrlToPngBlob(svgDataUrl,bgFill='#ffffff',minWidth=1600){return new Promise((resolve,reject)=>{const img=new Image(); img.onload=()=>{const naturalW=img.naturalWidth||img.width||800, naturalH=img.naturalHeight||img.height||600; const aspect=naturalH/naturalW; const w=Math.max(minWidth,naturalW*2); const h=Math.max(40,Math.round(w*aspect)); const cv=document.createElement('canvas'); cv.width=w; cv.height=h; const cx=cv.getContext('2d'); if(bgFill){cx.fillStyle=bgFill; cx.fillRect(0,0,w,h)} try{cx.drawImage(img,0,0,w,h)}catch(err){reject(err); return} cv.toBlob(b=>{if(b) resolve(b); else reject(new Error('PNG encode failed'))},'image/png')}; img.onerror=()=>reject(new Error('SVG decode failed')); img.src=svgDataUrl})}
async function copySelectionAsPngBlob(){if(!selectedIds.length) throw new Error('No selection.'); const objs=selectedIds.map(findObj).filter(Boolean); if(!objs.length) throw new Error('No selection.'); const pad=20; let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity; for(const o of objs){const b=normBox(o); if(b.w<=0||b.h<=0) continue; minX=Math.min(minX,b.x); minY=Math.min(minY,b.y); maxX=Math.max(maxX,b.x+b.w); maxY=Math.max(maxY,b.y+b.h)} if(!isFinite(minX)) throw new Error('Selection has no extent.'); minX-=pad; minY-=pad; maxX+=pad; maxY+=pad; const bbox={x:minX,y:minY,w:maxX-minX,h:maxY-minY}; const fullCv=await exportCanvas(); const scaleX=fullCv.width/svg.clientWidth; const scaleY=fullCv.height/svg.clientHeight; const cx=Math.max(0,bbox.x*zoom*scaleX), cy=Math.max(0,bbox.y*zoom*scaleY); const cw=Math.min(fullCv.width-cx,bbox.w*zoom*scaleX), ch=Math.min(fullCv.height-cy,bbox.h*zoom*scaleY); const cv=document.createElement('canvas'); cv.width=Math.max(20,Math.round(cw)); cv.height=Math.max(20,Math.round(ch)); const ctx=cv.getContext('2d'); ctx.drawImage(fullCv,cx,cy,cw,ch,0,0,cv.width,cv.height); return new Promise((resolve,reject)=>{cv.toBlob(b=>b?resolve(b):reject(new Error('PNG encode failed')),'image/png')})}
async function downloadSelectionPng(){
  if(!selectedIds.length){setStatus('Select content to download first.','danger'); return}
  try{
    setStatus('Preparing download...');
    const blob=await copySelectionAsPngBlob();
    const url=URL.createObjectURL(blob);
    const safeTitle=(board.title||'drawsplat').replace(/\W+/g,'-');
    download(url,safeTitle+'-selection.png',true);
    setStatus('Selection downloaded as PNG.','success');
  }catch(err){
    setStatus('Download failed: '+(err&&err.message?err.message:String(err)),'danger');
  }
}
async function smartCopy(){copySelection(); if(!selectedIds.length) return; if(!navigator.clipboard||!navigator.clipboard.write||typeof ClipboardItem==='undefined') return; if(selectedIds.length===1){const o=currentObj(); if(o&&o.type==='image'&&o.src){try{let blob; const isSvg=typeof o.src==='string'&&o.src.startsWith('data:image/svg'); if(isSvg) blob=await svgUrlToPngBlob(o.src); else {const res=await fetch(o.src); blob=await res.blob()} await navigator.clipboard.write([new ClipboardItem({[blob.type||'image/png']:blob})]); setStatus(isSvg?'Diagram copied to clipboard as PNG.':'Image copied to clipboard.','success'); return}catch(_){}}} try{const blob=await copySelectionAsPngBlob(); await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]); setStatus('Selection copied to clipboard as PNG.','success')}catch(_){}}
function groupSelected(){const ids=selectedIds.filter(idv=>findObj(idv)?.type!=='connector'); if(ids.length<2)return; const gidv='grp_'+id(); ids.forEach(i=>{const o=findObj(i); if(o) o.groupId=gidv}); render(); saveState(); setStatus('Grouped '+ids.length+' items.','success')}
function ungroupSelected(){const gids=[...new Set(selectedIds.map(i=>findObj(i)?.groupId).filter(Boolean))]; if(!gids.length)return; panel().objects.forEach(o=>{if(gids.includes(o.groupId)) delete o.groupId}); render(); saveState(); setStatus('Ungrouped selection.','success')}
function selectCurrentGroup(){const o=currentObj(); if(!o) return setStatus('Select an item first.','danger'); if(!o.groupId){selectedIds=[o.id]; render(); return setStatus('This item is not grouped.','danger')} selectedIds=groupMembers(o); render(); setStatus('Group selected.','success')}

document.addEventListener('keydown',e=>{const tag=(e.target&&e.target.tagName?e.target.tagName.toLowerCase():'');if(tag==='textarea'||tag==='input'||e.target?.isContentEditable)return; const meta=e.ctrlKey||e.metaKey; const o=currentObj();
  if(!meta&&!e.altKey&&e.key==='?'&&!e.shiftKey){/* shift+/ on US */}
  if(!meta&&!e.altKey&&(e.key==='?'||(e.shiftKey&&e.key==='/'))){e.preventDefault(); openShortcutsDialog(); return}
  if(e.key==='Escape'&&gid('dotPaintPalette')?.classList.contains('show')){e.preventDefault(); closeDotPaintPalette(); return}
  if(!meta&&e.altKey&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault(); const map={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'top',ArrowDown:'bottom'}; alignSelectedObjects(map[e.key]); return}
  if(!meta&&e.altKey&&e.shiftKey&&e.key.toLowerCase()==='h'){e.preventDefault(); alignSelectedObjects('centerH'); return}
  if(!meta&&e.altKey&&e.shiftKey&&e.key.toLowerCase()==='v'){e.preventDefault(); alignSelectedObjects('middleV'); return}
  if(!meta&&!e.altKey&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)&&selectedIds.length){const amount=e.shiftKey?10:1; const map={ArrowLeft:[-amount,0],ArrowRight:[amount,0],ArrowUp:[0,-amount],ArrowDown:[0,amount]}; if(nudgeSelected(...map[e.key])) e.preventDefault(); return}
  if(!meta&&!e.altKey&&selectedIds.length===1&&o&&o.type==='widget'&&e.key==='Enter'){e.preventDefault(); openClassroomWidgetDialog(o.id); return}
  if(!meta&&!e.altKey&&selectedIds.length===1&&o&&(TEXTABLE_TYPES.includes(o.type)||o.type==='connector')&&canEditObject(o)){if(e.key==='Enter'){e.preventDefault(); openInlineTextEditor(o.id); return} if(e.key.length===1){e.preventDefault(); openInlineTextEditor(o.id,e.key); return}}
  if(e.key==='Delete'||e.key==='Backspace')deleteSelected();
  if(meta&&e.key.toLowerCase()==='a'){e.preventDefault(); selectAllObjects()}
  if(meta&&e.key.toLowerCase()==='d'){e.preventDefault(); duplicateSelected()}
  if(meta&&e.key.toLowerCase()==='c'){e.preventDefault(); smartCopy()}
  if(meta&&e.key.toLowerCase()==='v'){e.preventDefault(); smartPaste()}
  if(meta&&e.key.toLowerCase()==='g'){e.preventDefault(); if(e.shiftKey) ungroupSelected(); else groupSelected()}
  if(meta&&e.key.toLowerCase()==='z'){e.preventDefault(); e.shiftKey?redo():undo()}
});
document.addEventListener('click',e=>{if(e.target?.id==='openSelectedWidgetControlsBtn'){const o=currentObj(); if(o?.type==='widget') openClassroomWidgetDialog(o.id)}});

gid('toolButtons').addEventListener('click',e=>{const btn=e.target.closest('[data-tool]'); if(btn&&gid('toolButtons').contains(btn)&&!btn.classList.contains('simple-hidden')){setTool(btn.dataset.tool)}});
document.addEventListener('paste',async e=>{const t=document.activeElement; const tag=t&&t.tagName?t.tagName.toLowerCase():''; if(tag==='input'||tag==='textarea'||(t&&t.isContentEditable)) return; const items=e.clipboardData?.items||[]; for(const item of items){if(item.kind==='file'&&item.type.startsWith('image/')){e.preventDefault(); const blob=item.getAsFile(); if(blob) await pasteBlobAsImage(blob,'Image pasted from clipboard.'); return}}});
document.querySelectorAll('[data-bg]').forEach(b=>b.onclick=()=>{panel().bg=b.dataset.bg; render(); saveState()});

function buildStickerUI(){ui.stickerSelect.innerHTML=STICKERS.map(s=>`<option value="${s.id}">${s.label}</option>`).join(''); const grid=gid('stickerGrid'); grid.innerHTML=STICKERS.map(s=>`<button class="sticker-tile" data-sticker="${esc(s.id)}" aria-label="${esc(s.label)}"><span class="sticker-icon" style="background:${esc(s.bg)}">${s.icon}</span><span>${esc(s.label)}</span></button>`).join(''); grid.querySelectorAll('[data-sticker]').forEach(btn=>btn.onclick=()=>{ui.stickerSelect.value=btn.dataset.sticker; insertSticker(btn.dataset.sticker); gid('stickerDialog').close()})}
function insertSticker(idv){const s=STICKERS.find(x=>x.id===idv)||STICKERS[0]; addObj(makeObj('stamp',90,90,88,88,{stampId:s.id,stampIcon:s.icon,stampLabel:s.label,stampBg:s.bg,fill:'none',stroke:'none',strokeWidth:0}))}
gid('openStickerLibraryBtn').onclick=()=>gid('stickerDialog').showModal();
gid('insertStickerBtn').onclick=()=>insertSticker(ui.stickerSelect.value);
gid('closeStickerDialog').onclick=()=>gid('stickerDialog').close();
buildStickerUI();

function ensureColoringBookDialog(){
  let dlg=gid('coloringBookDialog');
  if(dlg) return dlg;
  dlg=document.createElement('dialog');
  dlg.id='coloringBookDialog';
  dlg.className='coloring-book-dialog';
  dlg.innerHTML='<div class="modal-head"><h2>Coloring Book</h2><button class="close" id="closeColoringBookDialog" aria-label="Close">Close</button></div><p class="confirm-msg">Choose an original copyright-free line-art page, then insert it on the board for coloring, annotation, or download.</p><div class="coloring-book-tabs" id="coloringBookTabs"></div><div class="coloring-book-grid" id="coloringBookGrid"></div>';
  document.body.appendChild(dlg);
  gid('closeColoringBookDialog')?.addEventListener('click',()=>dlg.close());
  const tabs=gid('coloringBookTabs');
  const filters=[['all','All'],...Object.keys(COLORING_BOOK_CATEGORIES).map(k=>[k,k[0].toUpperCase()+k.slice(1)])];
  tabs.innerHTML=filters.map(([key,label])=>`<button type="button" data-coloring-category="${esc(key)}">${esc(label)}</button>`).join('');
  tabs.querySelectorAll('[data-coloring-category]').forEach(btn=>btn.addEventListener('click',()=>renderColoringBookGrid(btn.dataset.coloringCategory)));
  renderColoringBookGrid('all');
  return dlg;
}
function renderColoringBookGrid(category='all'){
  const grid=gid('coloringBookGrid'), tabs=gid('coloringBookTabs');
  if(!grid) return;
  tabs?.querySelectorAll('[data-coloring-category]').forEach(btn=>btn.classList.toggle('active',btn.dataset.coloringCategory===category));
  const items=coloringBookItems().filter(item=>category==='all'||item.category===category);
  grid.innerHTML=items.map(item=>`<button type="button" class="coloring-book-tile" data-coloring-id="${esc(item.id)}" data-coloring-paths="${esc(item.paths.join('|'))}"><img src="${esc(item.path)}" alt="" data-path-index="0"><span>${esc(item.label)}</span><small>${esc(item.category)}</small></button>`).join('');
  grid.querySelectorAll('.coloring-book-tile img').forEach(img=>img.addEventListener('error',()=>{
    const tile=img.closest('[data-coloring-paths]'), paths=(tile?.dataset.coloringPaths||'').split('|').filter(Boolean);
    const next=(+img.dataset.pathIndex||0)+1;
    if(next<paths.length){img.dataset.pathIndex=String(next); img.src=paths[next]}
  }));
  grid.querySelectorAll('[data-coloring-id]').forEach(btn=>btn.addEventListener('click',()=>insertColoringBookPage(btn.dataset.coloringId)));
}
function openColoringBookDialog(){
  const dlg=ensureColoringBookDialog();
  if(typeof dlg.showModal==='function') dlg.showModal(); else dlg.show();
}
function imageDimensions(src){
  return new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>resolve({w:img.naturalWidth||img.width||0,h:img.naturalHeight||img.height||0});
    img.onerror=()=>resolve({w:0,h:0});
    img.src=src;
  });
}
async function insertColoringBookPage(itemId){
  const item=coloringBookItems().find(x=>x.id===itemId);
  if(!item) return setStatus('Coloring page not found.','danger');
  try{
    let src='', loadedPath='';
    for(const path of item.paths){
      try{src=await imageUrlToDataUrl(path); loadedPath=path; break}catch(_){}
    }
    if(!src) throw new Error('No PNG or JPG file found for '+item.label+'.');
    const meta=await imageDimensions(src);
    const naturalW=meta.w||900, naturalH=meta.h||1200;
    const maxW=520, maxH=560, scale=Math.min(1,maxW/naturalW,maxH/naturalH);
    const w=Math.max(80,Math.round(naturalW*scale)), h=Math.max(80,Math.round(naturalH*scale));
    addObj(makeObj('image',140,70,w,h,{src,naturalW,naturalH,fill:'none',stroke:'none',strokeWidth:0,coloringBookId:item.id,coloringBookLabel:item.label,coloringBookCategory:item.category,coloringBookPath:loadedPath}));
    gid('coloringBookDialog')?.close();
    setStatus('Coloring page inserted: '+item.label+'.','success');
  }catch(err){
    setStatus('Could not load coloring page. '+(err&&err.message?err.message:String(err)),'danger');
  }
}

const GRAPH_COLORS=['#2563eb','#dc2626','#16a34a','#f59e0b','#7c3aed','#0891b2','#db2777','#475569'];
function parseGraphRows(text){
  return String(text||'').split(/\n+/).map(line=>line.trim()).filter(Boolean).map(line=>{
    const parts=line.includes(',')?line.split(','):line.split(/\t+/);
    if(parts.length<2){const m=line.match(/^(.*?)[\s:]+(-?\d+(?:\.\d+)?)$/); return m?{label:m[1].trim(),value:+m[2]}:null}
    const value=parseFloat(parts.pop());
    return Number.isFinite(value)?{label:parts.join(',').trim()||'Item',value}:null;
  }).filter(Boolean);
}
const PICTURE_GRAPH_ICON_CATALOG=[
  ['Food',[['pizza','Pizza','🍕'],['taco','Taco','🌮'],['salad','Salad','🥗'],['sandwich','Sandwich','🥪'],['apple','Apple','🍎'],['banana','Banana','🍌'],['carrot','Carrot','🥕']]],
  ['Animals',[['dog','Dog','🐕'],['cat','Cat','🐈'],['dolphin','Dolphin','🐬'],['whale','Whale','🐋'],['shark','Shark','🦈'],['parrot','Parrot','🦜'],['bird','Bird','🐦'],['toucan','Toucan','🦜'],['fish','Fish','🐟'],['turtle','Turtle','🐢'],['frog','Frog','🐸'],['butterfly','Butterfly','🦋']]],
  ['Smithsonian Open Access Animals',[
    ['smithsonian-clouded-leopard-cub','Clouded leopard cub','./assets/smithsonian-animals/clouded-leopard-cub.jpg'],
    ['smithsonian-african-lion-cub','African lion cub','./assets/smithsonian-animals/african-lion-cub.jpg'],
    ['smithsonian-asian-elephant','Asian elephant','./assets/smithsonian-animals/asian-elephant.jpg'],
    ['smithsonian-cheetah','Cheetah','./assets/smithsonian-animals/cheetah.jpg'],
    ['smithsonian-california-sea-lion','California sea lion','./assets/smithsonian-animals/california-sea-lion.jpg'],
    ['smithsonian-alpaca','Alpaca','./assets/smithsonian-animals/alpaca.jpg'],
    ['smithsonian-giant-panda','Giant panda','./assets/smithsonian-animals/giant-panda.jpg'],
    ['smithsonian-grevys-zebra',"Grevy's zebra",'./assets/smithsonian-animals/grevys-zebra.jpg'],
    ['smithsonian-elds-deer',"Eld's deer",'./assets/smithsonian-animals/elds-deer.jpg'],
    ['smithsonian-fennec-fox','Fennec fox','./assets/smithsonian-animals/fennec-fox.jpg']
  ]],
  ['Life Science',[['vertebrate','Vertebrate','🦴'],['invertebrate','Invertebrate','🪱'],['mammal','Mammal','🐾'],['reptile','Reptile','🦎'],['amphibian','Amphibian','🐸'],['insect','Insect','🐞'],['plant','Plant','🌱']]],
  ['Colored Candies',[['red-candy','Red candy','🔴'],['orange-candy','Orange candy','🟠'],['yellow-candy','Yellow candy','🟡'],['green-candy','Green candy','🟢'],['blue-candy','Blue candy','🔵'],['purple-candy','Purple candy','🟣'],['brown-candy','Brown candy','🟤']]],
  ['School',[['book','Book','📚'],['pencil','Pencil','✏️'],['backpack','Backpack','🎒'],['calculator','Calculator','🧮'],['star','Star','⭐'],['check','Check','✅']]],
  ['Weather',[['sun','Sun','☀️'],['cloud','Cloud','☁️'],['rain','Rain','🌧️'],['snow','Snow','❄️'],['storm','Storm','⛈️'],['rainbow','Rainbow','🌈']]]
];
const PICTURE_GRAPH_PRESET_IMAGE_CACHE={};
function pictureGraphPresetIsImage(value){return /^(data:image\/|blob:|https?:\/\/|\.?\/?assets\/)/i.test(String(value||''))}
function pictureGraphIconOptions(selected=''){
  return '<option value="">'+esc(gtf('choosePreset','Choose preset'))+'</option>'+PICTURE_GRAPH_ICON_CATALOG.map(([group,items])=>`<optgroup label="${esc(group)}">${items.map(([idv,label,icon])=>{const image=pictureGraphPresetIsImage(icon), prefix=image?'Photo: ':icon+' '; return `<option value="${esc(icon)}" ${icon===selected?'selected':''}>${esc(prefix+label)}</option>`}).join('')}</optgroup>`).join('');
}
function pictureGraphSymbolKind(value){
  if(!value) return 'fallback';
  if(typeof value==='object') return value.kind||value.type||'icon';
  return pictureGraphPresetIsImage(value)?'image':'icon';
}
function pictureGraphSymbolValue(value){
  if(!value) return '';
  if(typeof value==='object') return value.value||value.src||value.icon||'';
  return String(value);
}
async function pictureGraphImagePresetDataUrl(src){
  if(!pictureGraphPresetIsImage(src)) return '';
  if(/^data:image\//i.test(src)) return src;
  if(PICTURE_GRAPH_PRESET_IMAGE_CACHE[src]) return PICTURE_GRAPH_PRESET_IMAGE_CACHE[src];
  const res=await fetch(src);
  if(!res.ok) throw new Error('Could not load preset image.');
  const blob=await res.blob();
  const dataUrl=await new Promise((resolve,reject)=>{const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=()=>reject(new Error('Could not read preset image.')); r.readAsDataURL(blob)});
  PICTURE_GRAPH_PRESET_IMAGE_CACHE[src]=dataUrl;
  return dataUrl;
}
async function pictureGraphPresetSymbol(value){
  if(!value) return '';
  return pictureGraphPresetIsImage(value)?await pictureGraphImagePresetDataUrl(value):value;
}
function pictureGraphLayoutMetrics(config,data){
  const W=720,H=460,left=86,right=42,top=64,bottom=80,cw=W-left-right,ch=H-top-bottom, scale=Math.max(1,+config.scale||1);
  const maxIcons=Math.max(...data.map(d=>Math.ceil(Math.max(0,d.value)/scale)),1), visibleMaxIcons=Math.min(maxIcons,80);
  if(config.direction==='horizontal'){
    const rowH=ch/data.length, iconSize=Math.min(30,Math.max(8,(cw-86)/Math.max(visibleMaxIcons,1)-5)), gap=Math.max(2,iconSize*.32), startX=left+84;
    return {W,H,left,right,top,bottom,cw,ch,scale,maxIcons,visibleMaxIcons,rowH,iconSize,gap,startX};
  }
  const slot=cw/data.length, iconSize=Math.min(30,Math.max(8,Math.min(slot*.72,ch/Math.max(visibleMaxIcons,1)*.78))), gap=Math.max(2,iconSize*.18), baseY=top+ch-6;
  return {W,H,left,right,top,bottom,cw,ch,scale,maxIcons,visibleMaxIcons,slot,iconSize,gap,baseY};
}
function niceMax(v){if(v<=0)return 10; const p=Math.pow(10,Math.floor(Math.log10(v))), n=v/p; return (n<=2?2:n<=5?5:10)*p}
function ensurePictureGraphDialog(){
  if(gid('pictureGraphDialog')) return;
  const dlg=document.createElement('dialog');
  dlg.id='pictureGraphDialog';
  dlg.className='graph-dialog picture-graph-dialog';
  dlg.innerHTML=`<div class="modal-head"><h2>${esc(gt('pictureGraph'))}</h2><button class="close" id="pictureGraphCancelBtn" aria-label="${esc(gt('close'))}">${esc(gt('close'))}</button></div><div class="graph-builder picture-graph-builder"><div class="graph-form"><div class="row"><label>${esc(gt('title'))}</label><input id="pictureGraphTitle" placeholder="${esc(gt('pictureTitle'))}"></div><div class="row"><label>${esc(gt('direction'))}</label><select id="pictureGraphDirection"><option value="vertical">${esc(gt('vertical'))}</option><option value="horizontal">${esc(gt('horizontal'))}</option></select></div><div class="row picture-fallback-control"><label>${esc(gtf('presetIcon','Preset icon'))}</label><select id="pictureGraphIconPreset">${pictureGraphIconOptions()}</select></div><div class="row picture-fallback-control"><label>${esc(gt('icon'))}</label><input id="pictureGraphIcon" value="⭐" maxlength="8"></div><div class="picture-symbol-actions picture-fallback-control"><button id="pictureGraphLoadSymbolBtn" type="button">${esc(gt('loadPicture'))}</button><button id="pictureGraphClearSymbolBtn" type="button">${esc(gt('clearPicture'))}</button><span id="pictureGraphSymbolState" class="value-chip"></span></div><input id="pictureGraphSymbolInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden><div class="row"><label>${esc(gt('scale'))}</label><input id="pictureGraphScale" type="number" min="1" max="100" step="1" value="1"></div><div class="checkrow"><input id="pictureGraphShowNumbers" type="checkbox" checked><label for="pictureGraphShowNumbers">${esc(gt('showNumbers'))}</label></div><label class="graph-data-label" for="pictureGraphData">${esc(gt('data'))}</label><textarea id="pictureGraphData" spellcheck="false" placeholder="${esc(gt('placeholder'))}"></textarea><p class="hint">${esc(gt('pictureHint'))}</p><div id="pictureGraphPicker" class="picture-graph-picker" hidden><div class="picture-picker-title">${esc(gtf('selectedPicture','Selected picture'))}</div><select id="pictureGraphSelectedPreset">${pictureGraphIconOptions()}</select><div class="picture-picker-actions"><button id="pictureGraphSelectedLoadBtn" type="button">${esc(gt('chooseRowPicture'))}</button><button id="pictureGraphSelectedRemoveBtn" type="button">${esc(gt('removeRowPicture'))}</button></div></div><p class="hint smithsonian-credit">${esc(gtf('smithsonianCredit','Smithsonian Open Access animal photos are included locally with credit to Smithsonian Open Access Animal Images.'))}</p><div class="picture-row-picture-head">${esc(gt('rowPictures'))}</div><div id="pictureGraphRowPictures" class="picture-row-pictures"></div><input id="pictureGraphRowImageInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden><div class="confirm-actions"><button id="pictureGraphInsertBtn" type="button" class="primary">${esc(gt('insertPictureGraph'))}</button></div></div><div id="pictureGraphPreview" class="graph-preview picture-graph-preview" aria-label="${esc(gt('pictureGraph'))}"></div></div>`;
  document.body.appendChild(dlg);
  gid('pictureGraphIconPreset')?.addEventListener('change',async e=>{if(!e.target.value) return; try{const symbol=await pictureGraphPresetSymbol(e.target.value); if(pictureGraphSymbolKind(symbol)==='image'){dlg.dataset.symbolSrc=symbol}else{gid('pictureGraphIcon').value=symbol; dlg.dataset.symbolSrc=''} const state=gid('pictureGraphSymbolState'); if(state) state.textContent=pictureGraphSymbolKind(symbol)==='image'?gt('imageState'):gt('textState'); updatePictureGraphPreview()}catch(_){setStatus('Preset image could not be loaded.','danger')}});
  applyI18n(dlg);
}
function applyGraphLocale(){
  const dlg=gid('graphDialog'); if(!dlg) return;
  const title=dlg.querySelector('.modal-head h2'); if(title) title.textContent=gt('creator');
  const labelFor={graphType:'type',graphTitle:'title',graphXLabel:'xLabel',graphYLabel:'yLabel',graphSourceText:'source'};
  Object.entries(labelFor).forEach(([idv,key])=>{const row=gid(idv)?.closest('.row'), lab=row?.querySelector('label'); if(lab) lab.textContent=gt(key)});
  const dataLabel=dlg.querySelector('.graph-data-label'); if(dataLabel) dataLabel.textContent=gt('data');
  const type=gid('graphType'); if(type){['bar','line','area','pie'].forEach(v=>{const opt=[...type.options].find(o=>o.value===v); if(opt) opt.textContent=gt(v)})}
  const placeholders={graphTitle:'classGraph',graphXLabel:'category',graphYLabel:'value',graphSourceText:'classSurvey',graphData:'placeholder'};
  Object.entries(placeholders).forEach(([idv,key])=>{const el=gid(idv); if(el) el.placeholder=gt(key)});
  setButtonChrome('openGraphDialogBtn',gt('creator'));
  setButtonChrome('simpleGraphBtn',gt('creator'));
  setButtonChrome('graphInsertBtn',gt('insert'));
  setButtonChrome('graphCancelBtn',gt('close')||'Close');
  setButtonChrome('openPictureGraphDialogBtn',gt('pictureGraph'));
  setButtonChrome('simplePictureGraphBtn',gt('pictureGraph'));
}
function graphConfigFromDialog(){return{type:gid('graphType')?.value||'bar',title:gid('graphTitle')?.value||gt('classGraph'),xLabel:gid('graphXLabel')?.value||'',yLabel:gid('graphYLabel')?.value||'',source:gid('graphSourceText')?.value||'',dataText:gid('graphData')?.value||''}}
function graphSvg(config){
  const data=parseGraphRows(config.dataText), W=720,H=460,left=74,right=38,top=58,bottom=78,cw=W-left-right,ch=H-top-bottom;
  const title=esc(config.title||'Graph'), xLabel=esc(config.xLabel||''), yLabel=esc(config.yLabel||''), source=esc(config.source||'');
  if(!data.length) return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="#fff"/><text x="${W/2}" y="${H/2}" text-anchor="middle" font-family="Arial" font-size="22" fill="#64748b">${esc(gt('empty'))}</text></svg>`;
  const max=niceMax(Math.max(...data.map(d=>d.value),1)), y=v=>top+ch-(Math.max(0,v)/max)*ch, x=i=>left+(data.length===1?cw/2:(i/(data.length-1))*cw);
  let body='';
  if(config.type==='pie'){
    const cx=W/2,cy=238,r=128,total=data.reduce((s,d)=>s+Math.max(0,d.value),0)||1; let a=-Math.PI/2;
    body=data.map((d,i)=>{const part=Math.max(0,d.value)/total,a2=a+part*Math.PI*2,large=part>.5?1:0,x1=cx+Math.cos(a)*r,y1=cy+Math.sin(a)*r,x2=cx+Math.cos(a2)*r,y2=cy+Math.sin(a2)*r,mid=(a+a2)/2,lx=cx+Math.cos(mid)*(r+34),ly=cy+Math.sin(mid)*(r+34); a=a2; return `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z" fill="${GRAPH_COLORS[i%GRAPH_COLORS.length]}" stroke="#fff" stroke-width="3"/><text x="${lx}" y="${ly}" text-anchor="${lx<cx?'end':'start'}" font-family="Arial" font-size="13" fill="#1f2937">${esc(d.label)}</text>`}).join('');
  } else {
    const axis=`<line x1="${left}" y1="${top}" x2="${left}" y2="${top+ch}" stroke="#334155" stroke-width="2"/><line x1="${left}" y1="${top+ch}" x2="${left+cw}" y2="${top+ch}" stroke="#334155" stroke-width="2"/>`;
    const ticks=[0,1,2,3,4].map(i=>{const val=max*i/4, yy=y(val); return `<line x1="${left}" y1="${yy}" x2="${left+cw}" y2="${yy}" stroke="#e2e8f0"/><text x="${left-10}" y="${yy+4}" text-anchor="end" font-family="Arial" font-size="13" fill="#475569">${Number.isInteger(val)?val:val.toFixed(1)}</text>`}).join('');
    const labels=data.map((d,i)=>`<text x="${x(i)}" y="${top+ch+24}" text-anchor="middle" font-family="Arial" font-size="13" fill="#1f2937">${esc(d.label).slice(0,18)}</text>`).join('');
    if(config.type==='bar'){
      const slot=cw/data.length,bw=Math.max(18,slot*.62);
      body=data.map((d,i)=>`<rect x="${left+i*slot+(slot-bw)/2}" y="${y(d.value)}" width="${bw}" height="${top+ch-y(d.value)}" rx="5" fill="${GRAPH_COLORS[i%GRAPH_COLORS.length]}"/><text x="${left+i*slot+slot/2}" y="${y(d.value)-8}" text-anchor="middle" font-family="Arial" font-size="13" fill="#1f2937">${d.value}</text>`).join('');
    } else {
      const pts=data.map((d,i)=>`${x(i)},${y(d.value)}`).join(' ');
      if(config.type==='area') body+=`<polygon points="${left},${top+ch} ${pts} ${left+cw},${top+ch}" fill="#93c5fd" opacity=".45"/>`;
      body+=`<polyline points="${pts}" fill="none" stroke="#2563eb" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
      body+=data.map((d,i)=>`<circle cx="${x(i)}" cy="${y(d.value)}" r="6" fill="#2563eb" stroke="#fff" stroke-width="2"/><text x="${x(i)}" y="${y(d.value)-12}" text-anchor="middle" font-family="Arial" font-size="13" fill="#1f2937">${d.value}</text>`).join('');
    }
    body=ticks+axis+body+labels+`<text x="${left+cw/2}" y="${H-28}" text-anchor="middle" font-family="Arial" font-size="15" fill="#334155">${xLabel}</text><text x="22" y="${top+ch/2}" text-anchor="middle" font-family="Arial" font-size="15" fill="#334155" transform="rotate(-90 22 ${top+ch/2})">${yLabel}</text>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="#fff"/><text x="${W/2}" y="32" text-anchor="middle" font-family="Arial" font-size="24" font-weight="700" fill="#111827">${title}</text>${body}${source?`<text x="${W-16}" y="${H-14}" text-anchor="end" font-family="Arial" font-size="12" fill="#64748b">Source: ${source}</text>`:''}</svg>`;
}
function graphDataUrl(config){return 'data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(graphSvg(config))))}
function updateGraphPreview(){const p=gid('graphPreview'); if(p) p.innerHTML=graphSvg(graphConfigFromDialog())}
function openGraphDialog(existingId){
  const dlg=gid('graphDialog'); if(!dlg) return;
  applyGraphLocale();
  const obj=existingId?findObj(existingId):null, cfg=obj?.graphConfig||{type:'bar',title:gt('favorite'),xLabel:gt('choice'),yLabel:gt('votes'),source:gt('classSurvey'),dataText:gt('sample')};
  gid('graphType').value=cfg.type||'bar'; gid('graphTitle').value=cfg.title||''; gid('graphXLabel').value=cfg.xLabel||''; gid('graphYLabel').value=cfg.yLabel||''; gid('graphSourceText').value=cfg.source||''; gid('graphData').value=cfg.dataText||''; dlg.dataset.editId=obj?obj.id:''; updateGraphPreview(); dlg.showModal();
}
function insertGraphFromDialog(){
  const cfg=graphConfigFromDialog(), rows=parseGraphRows(cfg.dataText); if(!rows.length) return setStatus(gt('needData'),'danger');
  const meta={src:graphDataUrl(cfg),naturalW:720,naturalH:460,graphConfig:cfg,fill:'none',stroke:'none',strokeWidth:0}, dlg=gid('graphDialog'), editId=dlg?.dataset.editId;
  if(editId){const obj=findObj(editId); if(obj){Object.assign(obj,meta); delete obj.crop; render(); saveState(); setStatus(gt('updated'),'success'); dlg.close(); return}}
  addObj(makeObj('image',120,120,480,307,meta)); setStatus(gt('added'),'success'); dlg?.close();
}
function pictureGraphConfigFromDialog(){
  const dlg=gid('pictureGraphDialog');
  return {
    title:gid('pictureGraphTitle')?.value||gt('pictureTitle'),
    direction:gid('pictureGraphDirection')?.value||'vertical',
    icon:(gid('pictureGraphIcon')?.value||'⭐').trim()||'⭐',
    symbolSrc:dlg?.dataset.symbolSrc||'',
    itemSymbols:{...(dlg?._itemSymbols||{})},
    scale:Math.max(1,+gid('pictureGraphScale')?.value||1),
    showNumbers:!!gid('pictureGraphShowNumbers')?.checked,
    dataText:gid('pictureGraphData')?.value||''
  };
}
function pictureGraphLabelKey(label){return String(label||'').trim().toLowerCase()}
function syncPictureGraphItemSymbols(){
  const dlg=gid('pictureGraphDialog'); if(!dlg) return {};
  const rows=parseGraphRows(gid('pictureGraphData')?.value||''), keep=new Set(rows.map(r=>pictureGraphLabelKey(r.label)));
  const next={};
  Object.entries(dlg._itemSymbols||{}).forEach(([key,src])=>{if(keep.has(key)) next[key]=src});
  dlg._itemSymbols=next;
  return next;
}
function updatePictureGraphRowPictures(){
  const wrap=gid('pictureGraphRowPictures'), dlg=gid('pictureGraphDialog'); if(!wrap||!dlg) return;
  const rows=parseGraphRows(gid('pictureGraphData')?.value||'');
  const symbols=syncPictureGraphItemSymbols();
  wrap.innerHTML=rows.length?rows.map(row=>{
    const key=pictureGraphLabelKey(row.label), rowSymbol=symbols[key], kind=pictureGraphSymbolKind(rowSymbol), value=pictureGraphSymbolValue(rowSymbol), has=!!rowSymbol;
    const state=kind==='image'?gt('imageState'):(kind==='icon'&&value?value:gt('fallback'));
    return `<div class="picture-row-picture" data-label-key="${esc(key)}"><span class="picture-row-label">${esc(row.label)}</span><span class="picture-row-state">${esc(state)}</span><select data-picture-row-preset="${esc(key)}" aria-label="${esc(gtf('rowPreset','Row preset'))}">${pictureGraphIconOptions(kind==='icon'?value:'')}</select><div class="picture-row-count" aria-label="${esc(gtf('count','Count'))}"><button type="button" data-picture-row-minus="${esc(key)}" aria-label="${esc(gtf('decrease','Decrease'))}">−</button><strong>${esc(String(row.value))}</strong><button type="button" data-picture-row-plus="${esc(key)}" aria-label="${esc(gtf('increase','Increase'))}">+</button></div><button type="button" data-picture-row-choose="${esc(key)}">${esc(gt('chooseRowPicture'))}</button><button type="button" data-picture-row-remove="${esc(key)}" ${has?'':'disabled'}>${esc(gt('removeRowPicture'))}</button></div>`;
  }).join(''):`<p class="hint">${esc(gt('empty'))}</p>`;
}
function pictureGraphSvg(config){
  const data=parseGraphRows(config.dataText), W=720,H=460,left=86,right=42,top=64,bottom=80,cw=W-left-right,ch=H-top-bottom;
  const title=esc(config.title||gt('pictureTitle')), icon=esc((config.icon||'⭐').trim()||'⭐'), symbolSrc=config.symbolSrc||'', itemSymbols=config.itemSymbols||{}, scale=Math.max(1,+config.scale||1), showNumbers=config.showNumbers!==false;
  const drawSymbol=(x,y,size,row)=>{const rowSymbol=itemSymbols[pictureGraphLabelKey(row?.label)], kind=pictureGraphSymbolKind(rowSymbol), value=pictureGraphSymbolValue(rowSymbol); if(kind==='image'&&value) return `<image href="${esc(value)}" x="${x-size/2}" y="${y-size*.82}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`; if(kind==='icon'&&value) return `<text x="${x}" y="${y+size*.36}" font-family="Arial, sans-serif" font-size="${size}" text-anchor="middle">${esc(value)}</text>`; return symbolSrc?`<image href="${esc(symbolSrc)}" x="${x-size/2}" y="${y-size*.82}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`:`<text x="${x}" y="${y+size*.36}" font-family="Arial, sans-serif" font-size="${size}" text-anchor="middle">${icon}</text>`};
  if(!data.length) return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="#fff"/><text x="${W/2}" y="${H/2}" text-anchor="middle" font-family="Arial" font-size="22" fill="#64748b">${esc(gt('empty'))}</text></svg>`;
  const metrics=pictureGraphLayoutMetrics(config,data), gridStroke='#e2e8f0';
  let body='';
  if(config.direction==='horizontal'){
    const {rowH,iconSize,gap,startX}=metrics;
    body+=`<line x1="${startX-10}" y1="${top}" x2="${startX-10}" y2="${top+ch}" stroke="#334155" stroke-width="2"/>`;
    data.forEach((d,i)=>{
      const y=top+i*rowH+rowH/2, n=Math.ceil(Math.max(0,d.value)/scale);
      body+=`<line x1="${startX-10}" y1="${y+rowH/2-5}" x2="${left+cw}" y2="${y+rowH/2-5}" stroke="${gridStroke}"/>`;
      body+=drawSymbol(left+48,y,28,d);
      const drawN=Math.min(n,80);
      for(let j=0;j<drawN;j++) body+=drawSymbol(startX+j*(iconSize+gap),y,iconSize,d);
      if(n>drawN) body+=`<text x="${Math.min(left+cw-18,startX+drawN*(iconSize+gap)+6)}" y="${y+5}" font-family="Arial" font-size="14" font-weight="800" fill="#64748b">+</text>`;
      if(showNumbers) body+=`<text x="${left+cw-4}" y="${y+5}" text-anchor="end" font-family="Arial" font-size="14" font-weight="700" fill="#111827">${esc(String(d.value))}</text>`;
    });
  } else {
    const {slot,iconSize,gap,baseY}=metrics;
    body+=`<line x1="${left}" y1="${baseY+8}" x2="${left+cw}" y2="${baseY+8}" stroke="#334155" stroke-width="2"/>`;
    data.forEach((d,i)=>{
      const cx=left+i*slot+slot/2, n=Math.ceil(Math.max(0,d.value)/scale);
      body+=`<line x1="${cx}" y1="${top}" x2="${cx}" y2="${baseY+8}" stroke="${gridStroke}"/>`;
      const drawN=Math.min(n,80);
      for(let j=0;j<drawN;j++) body+=drawSymbol(cx,baseY-j*(iconSize+gap),iconSize,d);
      if(n>drawN) body+=`<text x="${cx}" y="${Math.max(top+32,baseY-drawN*(iconSize+gap)-4)}" text-anchor="middle" font-family="Arial" font-size="14" font-weight="800" fill="#64748b">+</text>`;
      if(showNumbers) body+=`<text x="${cx}" y="${Math.max(top+18,baseY-drawN*(iconSize+gap)-20)}" text-anchor="middle" font-family="Arial" font-size="14" font-weight="700" fill="#111827">${esc(String(d.value))}</text>`;
      body+=drawSymbol(cx,H-48,28,d);
    });
  }
  const key=`${esc(gt('scale'))} ${esc(String(scale))}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="#fff"/><text x="${W/2}" y="34" text-anchor="middle" font-family="Arial" font-size="24" font-weight="700" fill="#111827">${title}</text>${body}<text x="${W-18}" y="${H-16}" text-anchor="end" font-family="Arial" font-size="12" fill="#64748b">${key}</text></svg>`;
}
function pictureGraphDataUrl(config){return 'data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(pictureGraphSvg(config))))}
function updatePictureGraphPreview(){updatePictureGraphRowPictures(); const p=gid('pictureGraphPreview'); if(p) p.innerHTML=pictureGraphSvg(pictureGraphConfigFromDialog()); refreshPictureGraphPicker()}
function setPictureGraphRowValueByKey(key,value){
  const data=gid('pictureGraphData'), rows=parseGraphRows(data?.value||''); if(!data||!rows.length) return;
  const idx=rows.findIndex(row=>pictureGraphLabelKey(row.label)===key); if(idx<0) return;
  const nextValue=Math.max(0,Math.round(+value||0));
  rows[idx].value=nextValue;
  data.value=rows.map(row=>`${row.label},${row.value}`).join('\n');
  updatePictureGraphPreview();
}
function pictureGraphPreviewPoint(ev){
  const svgNode=gid('pictureGraphPreview')?.querySelector('svg'); if(!svgNode) return null;
  const rect=svgNode.getBoundingClientRect(); if(!rect.width||!rect.height) return null;
  const vb=(svgNode.getAttribute('viewBox')||'0 0 720 460').split(/\s+/).map(Number), W=vb[2]||720,H=vb[3]||460;
  return {x:((ev.clientX-rect.left)/rect.width)*W,y:((ev.clientY-rect.top)/rect.height)*H};
}
function pictureGraphHitFromEvent(ev){
  const cfg=pictureGraphConfigFromDialog(), rows=parseGraphRows(cfg.dataText), pt=pictureGraphPreviewPoint(ev); if(!rows.length||!pt) return null;
  const m=pictureGraphLayoutMetrics(cfg,rows);
  if(cfg.direction==='horizontal'){
    const idx=Math.max(0,Math.min(rows.length-1,Math.floor((pt.y-m.top)/m.rowH)));
    const icons=pt.x<m.startX?0:Math.max(0,Math.round((pt.x-m.startX)/(m.iconSize+m.gap))+1);
    return {key:pictureGraphLabelKey(rows[idx].label), value:icons*m.scale};
  }
  const idx=Math.max(0,Math.min(rows.length-1,Math.floor((pt.x-m.left)/m.slot)));
  const icons=pt.y>m.baseY+m.iconSize*.6?0:Math.max(0,Math.round((m.baseY-pt.y)/(m.iconSize+m.gap))+1);
  return {key:pictureGraphLabelKey(rows[idx].label), value:icons*m.scale};
}
function pictureGraphMarkerHitFromEvent(ev){
  const cfg=pictureGraphConfigFromDialog(), rows=parseGraphRows(cfg.dataText), pt=pictureGraphPreviewPoint(ev); if(!rows.length||!pt) return null;
  const m=pictureGraphLayoutMetrics(cfg,rows);
  if(cfg.direction==='horizontal'){
    if(pt.x>m.left+76) return null;
    const idx=Math.max(0,Math.min(rows.length-1,Math.floor((pt.y-m.top)/m.rowH)));
    const y=m.top+idx*m.rowH+m.rowH/2;
    return Math.abs(pt.y-y)<=Math.max(24,m.rowH/2)?pictureGraphLabelKey(rows[idx].label):null;
  }
  if(pt.y<m.H-76) return null;
  const idx=Math.max(0,Math.min(rows.length-1,Math.floor((pt.x-m.left)/m.slot)));
  const x=m.left+idx*m.slot+m.slot/2;
  return Math.abs(pt.x-x)<=Math.max(24,m.slot/2)?pictureGraphLabelKey(rows[idx].label):null;
}
function updatePictureGraphFromPointer(ev){
  const hit=pictureGraphHitFromEvent(ev); if(hit) setPictureGraphRowValueByKey(hit.key,hit.value);
}
function selectedPictureGraphKey(){
  return gid('pictureGraphDialog')?.dataset.selectedPictureKey||'';
}
function openPictureGraphPicker(key){
  const dlg=gid('pictureGraphDialog'), picker=gid('pictureGraphPicker'), preset=gid('pictureGraphSelectedPreset'); if(!dlg||!picker||!preset||!key) return;
  dlg.dataset.selectedPictureKey=key;
  const value=dlg._itemSymbols?.[key], kind=pictureGraphSymbolKind(value), symbol=pictureGraphSymbolValue(value);
  preset.value=kind==='icon'?symbol:'';
  picker.hidden=false;
}
function refreshPictureGraphPicker(){
  const key=selectedPictureGraphKey();
  if(key) openPictureGraphPicker(key);
}
function applyPictureGraphLocale(){
  ensurePictureGraphDialog();
  const dlg=gid('pictureGraphDialog'); if(!dlg) return;
  const title=dlg.querySelector('.modal-head h2'); if(title) title.textContent=gt('pictureGraph');
  const labelFor={pictureGraphTitle:'title',pictureGraphDirection:'direction',pictureGraphIconPreset:'presetIcon',pictureGraphIcon:'icon',pictureGraphScale:'scale'};
  Object.entries(labelFor).forEach(([idv,key])=>{const lab=gid(idv)?.closest('.row')?.querySelector('label'); if(lab) lab.textContent=gtf(key,key==='presetIcon'?'Preset icon':key)});
  const dataLabel=dlg.querySelector('.graph-data-label'); if(dataLabel) dataLabel.textContent=gt('data');
  const rowHead=dlg.querySelector('.picture-row-picture-head'); if(rowHead) rowHead.textContent=gt('rowPictures');
  const hint=dlg.querySelector('.graph-form > .hint:not(.smithsonian-credit)'); if(hint) hint.textContent=gt('pictureHint');
  const credit=dlg.querySelector('.smithsonian-credit'); if(credit) credit.textContent=gtf('smithsonianCredit','Smithsonian Open Access animal photos are included locally with credit to Smithsonian Open Access Animal Images.');
  const show=dlg.querySelector('label[for="pictureGraphShowNumbers"]'); if(show) show.textContent=gt('showNumbers');
  const dir=gid('pictureGraphDirection'); if(dir){const v=dir.querySelector('[value="vertical"]'), h=dir.querySelector('[value="horizontal"]'); if(v) v.textContent=gt('vertical'); if(h) h.textContent=gt('horizontal')}
  const data=gid('pictureGraphData'); if(data) data.placeholder=gt('placeholder');
  const titleInput=gid('pictureGraphTitle'); if(titleInput) titleInput.placeholder=gt('pictureTitle');
  setButtonChrome('pictureGraphLoadSymbolBtn',gt('loadPicture'));
  setButtonChrome('pictureGraphClearSymbolBtn',gt('clearPicture'));
  setButtonChrome('pictureGraphInsertBtn',gt('insertPictureGraph'));
  setButtonChrome('pictureGraphCancelBtn',gt('close'));
}
function openPictureGraphDialog(existingId){
  ensurePictureGraphDialog();
  applyPictureGraphLocale();
  const dlg=gid('pictureGraphDialog'), obj=existingId?findObj(existingId):null;
  const cfg=obj?.pictureGraphConfig||{title:gt('pictureTitle'),direction:'vertical',icon:'⭐',symbolSrc:'',itemSymbols:{},scale:1,showNumbers:true,dataText:gt('sample')};
  gid('pictureGraphTitle').value=cfg.title||''; gid('pictureGraphDirection').value=cfg.direction||'vertical'; gid('pictureGraphIcon').value=cfg.icon||'⭐'; if(gid('pictureGraphIconPreset')) gid('pictureGraphIconPreset').value=''; gid('pictureGraphScale').value=cfg.scale||1; gid('pictureGraphShowNumbers').checked=cfg.showNumbers!==false; gid('pictureGraphData').value=cfg.dataText||''; dlg.dataset.editId=obj?obj.id:''; dlg.dataset.symbolSrc=cfg.symbolSrc||''; dlg.dataset.selectedPictureKey=''; dlg._itemSymbols={...(cfg.itemSymbols||{})}; const picker=gid('pictureGraphPicker'); if(picker) picker.hidden=true; gid('pictureGraphSymbolState').textContent=cfg.symbolSrc?gt('imageState'):gt('textState'); updatePictureGraphPreview(); dlg.showModal();
}
function insertPictureGraphFromDialog(){
  const cfg=pictureGraphConfigFromDialog(), rows=parseGraphRows(cfg.dataText); if(!rows.length) return setStatus(gt('needData'),'danger');
  const meta={src:pictureGraphDataUrl(cfg),naturalW:720,naturalH:460,pictureGraphConfig:cfg,fill:'none',stroke:'none',strokeWidth:0}, dlg=gid('pictureGraphDialog'), editId=dlg?.dataset.editId;
  if(editId){const obj=findObj(editId); if(obj){Object.assign(obj,meta); delete obj.crop; render(); saveState(); setStatus(gt('pictureUpdated'),'success'); dlg.close(); return}}
  addObj(makeObj('image',120,120,480,307,meta)); setStatus(gt('pictureAdded'),'success'); dlg?.close();
}
['graphType','graphTitle','graphXLabel','graphYLabel','graphSourceText','graphData'].forEach(idv=>gid(idv)?.addEventListener('input',updateGraphPreview));
gid('openGraphDialogBtn')?.addEventListener('click',()=>openGraphDialog());
gid('graphInsertBtn')?.addEventListener('click',insertGraphFromDialog);
gid('graphCancelBtn')?.addEventListener('click',()=>gid('graphDialog')?.close());
ensurePictureGraphDialog();
['pictureGraphTitle','pictureGraphDirection','pictureGraphIcon','pictureGraphScale','pictureGraphShowNumbers','pictureGraphData'].forEach(idv=>gid(idv)?.addEventListener('input',updatePictureGraphPreview));
gid('pictureGraphLoadSymbolBtn')?.addEventListener('click',()=>gid('pictureGraphSymbolInput')?.click());
gid('pictureGraphClearSymbolBtn')?.addEventListener('click',()=>{const dlg=gid('pictureGraphDialog'); if(dlg) dlg.dataset.symbolSrc=''; const state=gid('pictureGraphSymbolState'); if(state) state.textContent=gt('textState'); updatePictureGraphPreview()});
gid('pictureGraphSymbolInput')?.addEventListener('change',async e=>{const f=e.target.files?.[0]; if(!f) return; if(!(await validateImageDeep(f))){e.target.value=''; return} const r=new FileReader(); r.onload=()=>{const dlg=gid('pictureGraphDialog'); if(dlg) dlg.dataset.symbolSrc=r.result; const state=gid('pictureGraphSymbolState'); if(state) state.textContent=gt('imageState'); updatePictureGraphPreview(); e.target.value=''}; r.onerror=()=>{setStatus('Image upload failed.','danger'); e.target.value=''}; r.readAsDataURL(f)});
gid('pictureGraphRowPictures')?.addEventListener('click',e=>{const choose=e.target.closest('[data-picture-row-choose]'), remove=e.target.closest('[data-picture-row-remove]'), plus=e.target.closest('[data-picture-row-plus]'), minus=e.target.closest('[data-picture-row-minus]'), dlg=gid('pictureGraphDialog'); if(!dlg) return; if(choose){dlg.dataset.pendingRowKey=choose.dataset.pictureRowChoose; gid('pictureGraphRowImageInput')?.click()} if(remove){delete (dlg._itemSymbols||{})[remove.dataset.pictureRowRemove]; updatePictureGraphPreview()} if(plus||minus){const key=(plus||minus).dataset.pictureRowPlus||(plus||minus).dataset.pictureRowMinus, rows=parseGraphRows(gid('pictureGraphData')?.value||''), row=rows.find(r=>pictureGraphLabelKey(r.label)===key), step=Math.max(1,+gid('pictureGraphScale')?.value||1); if(row) setPictureGraphRowValueByKey(key,row.value+(plus?step:-step))}});
gid('pictureGraphRowPictures')?.addEventListener('change',async e=>{const preset=e.target.closest('[data-picture-row-preset]'), dlg=gid('pictureGraphDialog'); if(!preset||!dlg) return; dlg._itemSymbols=dlg._itemSymbols||{}; try{if(preset.value) dlg._itemSymbols[preset.dataset.pictureRowPreset]=await pictureGraphPresetSymbol(preset.value); else delete dlg._itemSymbols[preset.dataset.pictureRowPreset]; updatePictureGraphPreview()}catch(_){setStatus('Preset image could not be loaded.','danger')}});
gid('pictureGraphRowImageInput')?.addEventListener('change',async e=>{const f=e.target.files?.[0], dlg=gid('pictureGraphDialog'), key=dlg?.dataset.pendingRowKey; if(!f||!dlg||!key) return; if(!(await validateImageDeep(f))){e.target.value=''; return} const r=new FileReader(); r.onload=()=>{dlg._itemSymbols=dlg._itemSymbols||{}; dlg._itemSymbols[key]=r.result; dlg.dataset.pendingRowKey=''; updatePictureGraphPreview(); e.target.value=''}; r.onerror=()=>{setStatus('Image upload failed.','danger'); e.target.value=''}; r.readAsDataURL(f)});
gid('pictureGraphSelectedPreset')?.addEventListener('change',async e=>{const dlg=gid('pictureGraphDialog'), key=selectedPictureGraphKey(); if(!dlg||!key) return; dlg._itemSymbols=dlg._itemSymbols||{}; try{if(e.target.value) dlg._itemSymbols[key]=await pictureGraphPresetSymbol(e.target.value); else delete dlg._itemSymbols[key]; updatePictureGraphPreview()}catch(_){setStatus('Preset image could not be loaded.','danger')}});
gid('pictureGraphSelectedLoadBtn')?.addEventListener('click',()=>{const dlg=gid('pictureGraphDialog'), key=selectedPictureGraphKey(); if(!dlg||!key) return; dlg.dataset.pendingRowKey=key; gid('pictureGraphRowImageInput')?.click()});
gid('pictureGraphSelectedRemoveBtn')?.addEventListener('click',()=>{const dlg=gid('pictureGraphDialog'), key=selectedPictureGraphKey(); if(!dlg||!key) return; delete (dlg._itemSymbols||{})[key]; updatePictureGraphPreview()});
gid('pictureGraphPreview')?.addEventListener('pointerdown',e=>{const p=gid('pictureGraphPreview'); if(!p?.querySelector('svg')) return; const markerKey=pictureGraphMarkerHitFromEvent(e); if(markerKey){e.preventDefault(); openPictureGraphPicker(markerKey); return} e.preventDefault(); p.dataset.dragging='1'; p.setPointerCapture?.(e.pointerId); updatePictureGraphFromPointer(e)});
gid('pictureGraphPreview')?.addEventListener('pointermove',e=>{if(gid('pictureGraphPreview')?.dataset.dragging==='1') updatePictureGraphFromPointer(e)});
gid('pictureGraphPreview')?.addEventListener('pointerup',e=>{const p=gid('pictureGraphPreview'); if(p) p.dataset.dragging=''; p?.releasePointerCapture?.(e.pointerId)});
gid('pictureGraphPreview')?.addEventListener('pointercancel',()=>{const p=gid('pictureGraphPreview'); if(p) p.dataset.dragging=''});
gid('pictureGraphInsertBtn')?.addEventListener('click',insertPictureGraphFromDialog);
gid('pictureGraphCancelBtn')?.addEventListener('click',()=>gid('pictureGraphDialog')?.close());

const CLASSROOM_WIDGETS=[
  {kind:'biglink',title:'Big Link',w:520,h:260},
  {kind:'poll',title:'Poll',w:480,h:320},
  {kind:'race',title:'Race Progress',w:560,h:320},
  {kind:'randomizer',title:'Random Pick',w:440,h:270},
  {kind:'scoreboard',title:'Scoreboard',w:520,h:300},
  {kind:'timer',title:'Timer',w:420,h:280},
  {kind:'traffic',title:'Traffic Light',w:280,h:420},
  {kind:'wheelspinner',title:'Wheel Spinner',w:520,h:520},
  {kind:'workmode',title:'Work Mode',w:360,h:260}
];
const CLASSROOM_TOOL_LINKS=[
  {title:'Bingo Card Generator',summary:'Create printable bingo cards from vocabulary, questions, names, or B-I-N-G-O numbers.',url:appPath('solutions/bingo-card-generator/index.html')},
  {title:'Live Bingo Caller',summary:'Run a classroom bingo caller with animated picks and a same-device player card.',url:appPath('solutions/bingo-caller/index.html')},
  {title:'Coin Flipper',summary:'Flip one or many stylized coins for choices, probability, or teams.',url:appPath('solutions/coinflipping/index.html')},
  {title:'Concept Map Studio',summary:'Build radial mind maps or left-to-right concept maps from indented text. Export as SVG or PNG.',url:appPath('solutions/concept-map/index.html')},
  {title:'Dicebreaker Creator',summary:'Create roll-and-discuss dicebreaker activities.',url:appPath('solutions/dicebreakers/index.html')},
  {title:'Dice Roller',summary:'Roll classroom dice with simple or advanced display modes.',url:appPath('solutions/dice/index.html')},
  {title:'Markdown Studio',summary:'Clean, preview, convert, and export Markdown for classroom publishing.',url:appPath('solutions/markdown-studio/index.html')},
  {title:'Mermaid Diagram Studio',summary:'Compose flowcharts, sequence diagrams, mind maps, Gantt, timelines, class, and state diagrams with live preview.',url:appPath('solutions/mermaid/index.html')},
  {title:'Meme Puzzle',summary:'Build an image reveal puzzle with student questions.',url:appPath('solutions/memepuzzle/index.html')},
  {title:'Rubric Builder',summary:'Build printable rubrics with criteria, levels, points, and feedback descriptors.',url:appPath('solutions/rubric-builder/index.html')},
  {title:'Story Wheel',summary:'Spin prompt wheels for story ideas and writing choices.',url:appPath('solutions/storywheel/index.html')},
  {title:'Word Search Maker',summary:'Generate printable vocabulary word searches.',url:appPath('solutions/wordsearch/index.html')}
];
function defaultWidgetConfig(kind){
  const base={widgetKind:kind,widgetConfig:{}};
  if(kind==='poll') base.widgetConfig={question:'Quick Poll',options:['Yes','No','Not sure'],counts:[0,0,0],showTotal:true};
  if(kind==='randomizer') base.widgetConfig={title:'Random Pick',names:'Ava\nBen\nCarlos\nDana',picked:'',history:[]};
  if(kind==='wheelspinner') base.widgetConfig={title:'Wheel Spinner',items:'Ava\nBen\nCarlos\nDana',activeItems:['Ava','Ben','Carlos','Dana'],picked:'Ready',history:[],removeMode:'keep',palette:'bright',theme:'drawsplat'};
  if(kind==='biglink') base.widgetConfig={title:'Join Here',url:'drawsplat.org',note:'Type this address into your browser'};
  if(kind==='workmode') base.widgetConfig={mode:'focus'};
  if(kind==='traffic') base.widgetConfig={state:'green'};
  if(kind==='timer') base.widgetConfig={title:'Timer',minutes:5,style:'digital',running:false,endAt:0,remainingSec:300};
  if(kind==='scoreboard') base.widgetConfig={homeName:'Home',awayName:'Visitors',homeScore:0,awayScore:0};
  if(kind==='race') base.widgetConfig={title:'Progress Race',homeName:'Team A',awayName:'Team B',homeScore:0,awayScore:0,target:10};
  return base;
}
function widgetTitle(kind){return (CLASSROOM_WIDGETS.find(w=>w.kind===kind)||{}).title||'Widget'}
function clampWidgetScore(v){return Math.max(0,Math.round(+v||0))}
function widgetLinesText(lines,x,y,size=18,fill='#111827',weight=700,anchor='start',gap=1.25){
  return lines.map((line,i)=>`<text x="${x}" y="${y+i*size*gap}" font-size="${size}" font-weight="${weight}" font-family="Inter, Arial, sans-serif" fill="${fill}" text-anchor="${anchor}">${esc(line)}</text>`).join('');
}
function widgetWrapText(text,max=22,lines=3){
  const words=String(text||'').split(/\s+/).filter(Boolean), out=[]; let cur='';
  words.forEach(w=>{if((cur+' '+w).trim().length>max&&cur){out.push(cur); cur=w}else cur=(cur+' '+w).trim()});
  if(cur) out.push(cur);
  return out.slice(0,lines);
}
function bigLinkWrapText(text,max=22,lines=3){
  const chunks=[];
  String(text||'').split(/\s+/).filter(Boolean).forEach(word=>{
    let rest=word;
    while(rest.length>max){chunks.push(rest.slice(0,max)); rest=rest.slice(max)}
    if(rest) chunks.push(rest);
  });
  const out=[]; let cur='';
  chunks.forEach(chunk=>{
    const next=(cur+' '+chunk).trim();
    if(next.length>max&&cur){out.push(cur); cur=chunk}
    else cur=next;
  });
  if(cur) out.push(cur);
  if(out.length>lines){
    const clipped=out.slice(0,lines);
    clipped[clipped.length-1]=clipped[clipped.length-1].slice(0,Math.max(1,max-3))+'...';
    return clipped;
  }
  return out;
}
function bigLinkScale(cfg){return clamp(+(cfg?.textScale||cfg?.scale||1),.65,2.6)}
function bigLinkTextFit(url,W,H,scale=1){
  const text=String(url||'drawsplat.org').trim()||'drawsplat.org';
  const headerH=clamp(60*scale,48,128), footerH=clamp(50*scale,42,112);
  const maxLines=Math.max(1,Math.min(5,Math.floor((H-headerH-footerH)/Math.max(28,38*scale))));
  const maxSize=Math.max(24,Math.min(140*scale,W/4.8,H/2.15));
  for(let size=Math.floor(maxSize);size>=18;size-=2){
    const maxChars=Math.max(8,Math.floor((W-44)/(size*.56)));
    const lines=bigLinkWrapText(text,maxChars,maxLines);
    const longest=Math.max(1,...lines.map(line=>line.length));
    if(longest*size*.56<=W-44 && lines.length*size*1.12<=H-headerH-footerH) return {lines,size,headerH,footerH};
  }
  return {lines:bigLinkWrapText(text,Math.max(8,Math.floor((W-44)/(18*.56))),maxLines),size:18,headerH,footerH};
}
function autosizeBigLinkWidget(o){
  if(!o||o.type!=='widget'||o.widgetKind!=='biglink') return;
  const cfg=o.widgetConfig||{}, url=String(cfg.url||'drawsplat.org').trim()||'drawsplat.org', note=String(cfg.note||'').trim(), title=String(cfg.title||'Join Here').trim();
  const scale=bigLinkScale(cfg), longest=Math.max(url.length,note.length,title.length,14);
  o.w=clamp(Math.round(longest*14*scale+110*scale),360,1200);
  o.h=clamp(Math.round((220+(url.length>30?54:0)+(note?22:0))*scale),220,680);
}
const WHEEL_SPINNER_PALETTES={
  bright:{label:'Bright classroom',colors:['#ef4444','#f97316','#facc15','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899'],accent:'#7c3aed',soft:'#f5f3ff'},
  rgb:{label:'Red, green, blue',colors:['#ef4444','#22c55e','#3b82f6','#facc15','#06b6d4','#a855f7'],accent:'#2563eb',soft:'#eff6ff'},
  pastel:{label:'Pastel',colors:['#fecdd3','#fed7aa','#fef3c7','#bbf7d0','#bae6fd','#ddd6fe','#fbcfe8'],accent:'#a855f7',soft:'#faf5ff'},
  metallic:{label:'Gold, bronze, silver',colors:['#fbbf24','#d97706','#e5e7eb','#ca8a04','#a3a3a3','#92400e','#fde68a','#d1d5db'],accent:'#92400e',soft:'#fffbeb'},
  jewel:{label:'Jewel tones',colors:['#be123c','#7c2d12','#047857','#0f766e','#1d4ed8','#6d28d9','#a21caf'],accent:'#6d28d9',soft:'#f5f3ff'},
  cool:{label:'Cool colors',colors:['#0ea5e9','#06b6d4','#14b8a6','#22c55e','#6366f1','#8b5cf6'],accent:'#0f766e',soft:'#ecfeff'},
  warm:{label:'Warm colors',colors:['#dc2626','#f97316','#f59e0b','#facc15','#fb7185','#e11d48'],accent:'#dc2626',soft:'#fff7ed'},
  drawsplat:{label:'DrawSplatTM purple',colors:['#7c3aed','#a855f7','#ede9fe','#ffffff','#c084fc','#6d28d9','#f5f3ff','#8b5cf6'],accent:'#7c3aed',soft:'#f5f3ff'}
};
function wheelSpinnerPalette(cfg){
  return WHEEL_SPINNER_PALETTES[cfg.palette||cfg.theme]||WHEEL_SPINNER_PALETTES.bright;
}
function wheelSpinnerPaletteOptions(selected){
  return Object.entries(WHEEL_SPINNER_PALETTES).map(([key,p])=>`<option value="${key}" ${key===(selected||'bright')?'selected':''}>${esc(p.label)}</option>`).join('');
}
function parseWheelItems(text){
  const seen=new Set(), unique=[];
  String(text||'').split(/[\n,]+/).map(s=>s.trim()).filter(Boolean).forEach(item=>{
    const key=item.toLowerCase();
    if(!seen.has(key)){seen.add(key); unique.push(item)}
  });
  return unique;
}
function wheelSpinnerItems(cfg){
  const parsed=parseWheelItems(cfg.items||'');
  const active=(cfg.activeItems||[]).filter(item=>parsed.some(p=>p.toLowerCase()===String(item).toLowerCase()));
  return active.length?active:parsed;
}
function wheelSpinnerRotation(cfg){
  const now=Date.now(), start=+cfg.spinStartAt||0, until=+cfg.spinUntil||0, duration=Math.max(1,(+cfg.spinDuration||0)||(until-start)||1);
  if(until&&now<until){
    const t=clamp((now-start)/duration,0,1), eased=1-Math.pow(1-t,3);
    return (+cfg.spinStartRotation||0)+((+cfg.spinEndRotation||0)-(+cfg.spinStartRotation||0))*eased;
  }
  return +cfg.spinRotation||0;
}
function wheelSpinnerSlicePath(cx,cy,r,start,end){
  const x1=cx+Math.cos(start)*r,y1=cy+Math.sin(start)*r,x2=cx+Math.cos(end)*r,y2=cy+Math.sin(end)*r,large=end-start>Math.PI?1:0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}
function wheelSpinnerTextColor(hex){
  const clean=String(hex||'').replace('#','');
  if(clean.length===6){
    const r=parseInt(clean.slice(0,2),16),g=parseInt(clean.slice(2,4),16),b=parseInt(clean.slice(4,6),16);
    if((r*299+g*587+b*114)/1000>160) return '#312e81';
  }
  return '#ffffff';
}
function wheelSpinnerSvgParts(cfg,x,y,W,H){
  const palette=wheelSpinnerPalette(cfg), items=wheelSpinnerItems(cfg), cx=x+W/2, cy=y+H*.49, r=Math.min(W,H)*.32, angle=Math.PI*2/Math.max(1,items.length), spinning=(+cfg.spinUntil||0)>Date.now(), picked=spinning?'Spinning...':(cfg.picked&&cfg.picked!=='Ready'?cfg.picked:'Ready to spin'), colors=palette.colors, rotation=wheelSpinnerRotation(cfg);
  if(!items.length){
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${palette.soft}" stroke="${palette.accent}" stroke-width="4"/><text x="${cx}" y="${cy-5}" font-size="${Math.max(20,W/14)}" font-weight="900" fill="${palette.accent}" text-anchor="middle">Add items</text><text x="${cx}" y="${cy+24}" font-size="${Math.max(12,W/28)}" font-weight="800" fill="#6b7280" text-anchor="middle">Double-click to edit</text>`;
  }
  let body='';
  items.forEach((item,i)=>{
    const start=-Math.PI/2+i*angle, end=start+angle, mid=start+angle/2, color=colors[i%colors.length], tx=cx+Math.cos(mid)*r*.68, ty=cy+Math.sin(mid)*r*.68, rot=mid*180/Math.PI;
    body+=`<path d="${wheelSpinnerSlicePath(cx,cy,r,start,end)}" fill="${color}" stroke="#ffffff" stroke-width="3"/>`;
    body+=`<text x="${tx}" y="${ty+4}" transform="rotate(${rot} ${tx} ${ty})" font-size="${Math.max(10,Math.min(18,W/28,220/Math.max(5,item.length)))}" font-weight="900" fill="${wheelSpinnerTextColor(color)}" text-anchor="middle">${esc(item).slice(0,22)}</text>`;
  });
  body+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${palette.accent}" stroke-width="5"/><circle cx="${cx}" cy="${cy}" r="${Math.max(22,r*.14)}" fill="#ffffff" stroke="${palette.accent}" stroke-width="4"/>`;
  return `<g transform="rotate(${rotation} ${cx} ${cy})">${body}</g><path d="M ${cx+r+20} ${cy} L ${cx+r-12} ${cy-14} L ${cx+r-12} ${cy+14} Z" fill="${palette.accent}"/><rect x="${x+20}" y="${y+H-78}" width="${W-40}" height="52" rx="14" fill="${palette.soft}" stroke="${palette.accent}" opacity=".96"/><text x="${cx}" y="${y+H-47}" font-size="${Math.max(16,W/24)}" font-weight="900" fill="${palette.accent}" text-anchor="middle">${esc(String(picked).slice(0,34))}</text>`;
}
function wheelSpinnerEditorPreview(cfg){
  return `<svg viewBox="0 0 360 330" role="img" aria-label="Wheel spinner preview">${wheelSpinnerSvgParts(cfg,0,0,360,330)}</svg>`;
}
function timerRemainingSec(cfg){
  if(cfg.running&&cfg.endAt) return Math.max(0,Math.ceil((cfg.endAt-Date.now())/1000));
  return Math.max(0,Math.round(+cfg.remainingSec||(+cfg.minutes||0)*60||0));
}
function timerText(sec){const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60; return h?`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${m}:${String(s).padStart(2,'0')}`}
function scoreboardHitZones(b){
  const W=b.w,H=b.h,x=b.x,y=b.y,btnW=Math.max(54,Math.min(76,W*.14)),btnH=34,gap=10,by=y+H-54;
  const homeX=x+W*.25,awayX=x+W*.75,labelW=Math.max(110,W*.38);
  return {
    homeLabel:{x:homeX-labelW/2,y:y+64,w:labelW,h:42,field:'homeName',fallback:'Home'},
    awayLabel:{x:awayX-labelW/2,y:y+64,w:labelW,h:42,field:'awayName',fallback:'Visitors'},
    homeMinus:{x:homeX-btnW-gap/2,y:by,w:btnW,h:btnH,score:'homeScore',delta:-1},
    homePlus:{x:homeX+gap/2,y:by,w:btnW,h:btnH,score:'homeScore',delta:1},
    awayMinus:{x:awayX-btnW-gap/2,y:by,w:btnW,h:btnH,score:'awayScore',delta:-1},
    awayPlus:{x:awayX+gap/2,y:by,w:btnW,h:btnH,score:'awayScore',delta:1}
  };
}
function pointInRect(p,r){return p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h}
function scoreboardButtonSvg(r,label,color){
  return `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="12" fill="${color}" stroke="#ffffff" stroke-width="2"/><text x="${r.x+r.w/2}" y="${r.y+23}" font-size="17" font-weight="900" fill="#ffffff" text-anchor="middle">${label}</text>`;
}
function handleScoreboardScreenAction(o,p){
  if(!o||o.type!=='widget'||o.widgetKind!=='scoreboard'||!canEditObject(o)||o.locked) return false;
  const cfg=o.widgetConfig=o.widgetConfig||{}, zones=scoreboardHitZones(normBox(o));
  for(const key of ['homeMinus','homePlus','awayMinus','awayPlus']){
    const z=zones[key];
    if(pointInRect(p,z)){
      cfg[z.score]=clampWidgetScore((cfg[z.score]||0)+z.delta);
      selectedIds=[o.id];
      render(); saveState();
      setStatus('Score updated.','success');
      return true;
    }
  }
  for(const key of ['homeLabel','awayLabel']){
    const z=zones[key];
    if(pointInRect(p,z)){
      const next=prompt('Team name:',cfg[z.field]||z.fallback);
      if(next!==null){
        cfg[z.field]=String(next).trim()||z.fallback;
        selectedIds=[o.id];
        render(); saveState();
        setStatus('Scoreboard label updated.','success');
      }
      return true;
    }
  }
  return false;
}
function wheelSpinnerHitZones(b){
  const spinY=b.y+b.h-78, cx=b.x+b.w/2, cy=b.y+48+(b.h-48)*.49, r=Math.min(b.w,b.h-48)*.32;
  return {
    wheel:{cx,cy,r},
    button:{x:b.x+20,y:spinY,w:b.w-40,h:52}
  };
}
function pointInCircle(p,c){return Math.hypot(p.x-c.cx,p.y-c.cy)<=c.r}
function finishWheelSpin(o,saveNow=false){
  const cfg=o?.widgetConfig;
  if(!cfg||!cfg.pendingPick) return false;
  const pick=cfg.pendingPick, items=Array.isArray(cfg.pendingItems)?cfg.pendingItems:wheelSpinnerItems(cfg);
  cfg.picked=pick;
  cfg.history=[...(cfg.history||[]),pick].slice(-20);
  cfg.activeItems=cfg.removeMode==='remove'?items.filter(item=>item!==pick):items;
  cfg.spinRotation=((+cfg.spinEndRotation||0)%360+360)%360;
  delete cfg.pendingPick; delete cfg.pendingItems; delete cfg.pendingPickIndex;
  cfg.spinUntil=0; cfg.spinStartAt=0; cfg.spinDuration=0;
  if(saveNow) setStatus('Wheel picked '+pick+'.','success');
  if(saveNow) saveState();
  return true;
}
function startWheelSpin(o){
  if(!o||o.type!=='widget'||o.widgetKind!=='wheelspinner'||!canEditObject(o)||o.locked) return false;
  const cfg=o.widgetConfig=o.widgetConfig||{};
  if((+cfg.spinUntil||0)>Date.now()) return true;
  const items=wheelSpinnerItems(cfg);
  if(!items.length){cfg.picked='Add items first'; render(); refreshOpenWheelSpinnerPreview(); saveState(); setStatus('Add names or choices before spinning.','danger'); return true}
  const pickIndex=Math.floor(Math.random()*items.length), pick=items[pickIndex], slice=Math.PI*2/items.length, mid=-Math.PI/2+pickIndex*slice+slice/2;
  const startRot=wheelSpinnerRotation(cfg), target=(((-mid*180/Math.PI)%360)+360)%360, delta=(target-((startRot%360+360)%360)+360)%360;
  cfg.pendingPick=pick;
  cfg.pendingItems=[...items];
  cfg.pendingPickIndex=pickIndex;
  cfg.picked='Spinning...';
  cfg.spinStartAt=Date.now();
  cfg.spinDuration=1800;
  cfg.spinUntil=cfg.spinStartAt+cfg.spinDuration;
  cfg.spinStartRotation=startRot;
  cfg.spinEndRotation=startRot+1440+delta;
  ensureWidgetSpinTick();
  render();
  refreshOpenWheelSpinnerPreview();
  setStatus('Wheel spinning...','success');
  return true;
}
function handleWheelSpinnerScreenAction(o,p){
  if(!o||o.type!=='widget'||o.widgetKind!=='wheelspinner') return false;
  const zones=wheelSpinnerHitZones(normBox(o));
  if(pointInRect(p,zones.button)||pointInCircle(p,zones.wheel)) return startWheelSpin(o);
  return false;
}
function createClassroomWidgetObject(o,b){
  const cfg=o.widgetConfig||{}, kind=o.widgetKind||'traffic', W=b.w, H=b.h, x=b.x, y=b.y, rx=Math.min(22,W*.06,H*.08);
  let body=`<rect x="${x}" y="${y}" width="${W}" height="${H}" rx="${rx}" fill="#fff" stroke="#d7dce8" stroke-width="2"/><rect x="${x}" y="${y}" width="${W}" height="${Math.min(54,H*.18)}" rx="${rx}" fill="#f8fafc"/><text x="${x+18}" y="${y+34}" font-size="18" font-weight="900" font-family="Inter,Arial" fill="#111827">${esc(cfg.title||cfg.question||widgetTitle(kind))}</text>`;
  if(kind==='poll'){
    const opts=(cfg.options||[]).map(String).filter(Boolean), counts=(cfg.counts||[]).map(n=>Math.max(0,+n||0)), total=counts.reduce((a,b)=>a+b,0), top=y+72, rowH=Math.max(32,Math.min(52,(H-102)/Math.max(1,opts.length)));
    body+=`<text x="${x+W-18}" y="${y+34}" font-size="14" font-weight="800" fill="#64748b" text-anchor="end">Total ${total}</text>`;
    opts.forEach((opt,i)=>{const c=counts[i]||0,pct=total?c/total:0, yy=top+i*rowH, barW=(W-170)*pct; body+=`<text x="${x+18}" y="${yy+22}" font-size="15" font-weight="800" fill="#111827">${esc(opt.slice(0,28))}</text><rect x="${x+130}" y="${yy+7}" width="${Math.max(0,W-178)}" height="20" rx="10" fill="#e5e7eb"/><rect x="${x+130}" y="${yy+7}" width="${barW}" height="20" rx="10" fill="${['#2563eb','#16a34a','#f59e0b','#db2777','#7c3aed','#0891b2'][i%6]}"/><text x="${x+W-20}" y="${yy+22}" font-size="13" font-weight="900" fill="#111827" text-anchor="end">${c}</text>`});
  }
  if(kind==='randomizer'){
    const picked=cfg.picked||'Tap Pick'; body+=`<text x="${x+W/2}" y="${y+H*.53}" font-size="${Math.max(34,Math.min(68,W/8))}" font-weight="900" font-family="Inter,Arial" fill="#7c3aed" text-anchor="middle">${esc(picked)}</text><text x="${x+W/2}" y="${y+H-32}" font-size="15" font-weight="800" fill="#64748b" text-anchor="middle">${esc((cfg.history||[]).slice(-3).join('  •  '))}</text>`;
  }
  if(kind==='wheelspinner'){
    const items=wheelSpinnerItems(cfg), palette=wheelSpinnerPalette(cfg);
    body=`<rect x="${x}" y="${y}" width="${W}" height="${H}" rx="${rx}" fill="#ffffff" stroke="${palette.accent}" stroke-width="2"/><rect x="${x}" y="${y}" width="${W}" height="${Math.min(58,H*.16)}" rx="${rx}" fill="${palette.accent}"/><text x="${x+18}" y="${y+36}" font-size="18" font-weight="900" font-family="Inter,Arial" fill="#ffffff">${esc(cfg.title||'Wheel Spinner')}</text><text x="${x+W-18}" y="${y+36}" font-size="13" font-weight="900" fill="#ffffff" text-anchor="end">${items.length} on wheel</text>${wheelSpinnerSvgParts(cfg,x,y+48,W,H-48)}`;
  }
  if(kind==='biglink'){
    const scale=bigLinkScale(cfg), fit=bigLinkTextFit(cfg.url||'drawsplat.org',W,H,scale), titleSize=clamp(22*scale,18,58), noteSize=clamp(16*scale,13,42), blockH=fit.lines.length*fit.size*1.12, startY=y+fit.headerH+(H-fit.headerH-fit.footerH)/2-blockH/2+fit.size*.72;
    body=`<rect x="${x}" y="${y}" width="${W}" height="${H}" rx="${rx}" fill="#fff" stroke="#d7dce8" stroke-width="2"/><rect x="${x}" y="${y}" width="${W}" height="${fit.headerH}" rx="${rx}" fill="#f8fafc"/><text x="${x+W/2}" y="${y+fit.headerH*.63}" font-size="${titleSize}" font-weight="900" font-family="Inter,Arial" fill="#111827" text-anchor="middle">${esc(cfg.title||'Join Here')}</text>`;
    body+=widgetLinesText(fit.lines,x+W/2,startY,fit.size,'#6d28d9',900,'middle',1.12);
    body+=`<text x="${x+W/2}" y="${y+H-fit.footerH*.42}" font-size="${noteSize}" font-weight="800" fill="#64748b" text-anchor="middle">${esc(cfg.note||'')}</text>`;
  }
  if(kind==='workmode'){
    const modes={focus:['Quiet Focus','Work on your own','#4f46e5','M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z'],partner:['Partner Check','Check with one person','#0f766e','M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M16 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],table:['Table Talk','Share at your table','#f59e0b','M4 8h16v8H4z'],team:['Team Task','Build together','#db2777','M12 3l9 5-9 5-9-5 9-5z M3 13l9 5 9-5'],help:['Teacher Help','Raise a hand or ask','#dc2626','M8 20V8a2 2 0 0 1 4 0v5-1a2 2 0 0 1 4 0v3']}[cfg.mode||'focus'];
    body+=`<circle cx="${x+W/2}" cy="${y+H*.45}" r="${Math.min(W,H)*.19}" fill="${modes[2]}22" stroke="${modes[2]}" stroke-width="4"/><path d="${modes[3]}" transform="translate(${x+W/2-12} ${y+H*.45-12})" fill="none" stroke="${modes[2]}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/><text x="${x+W/2}" y="${y+H*.72}" font-size="${Math.max(28,Math.min(46,W/9))}" font-weight="900" fill="${modes[2]}" text-anchor="middle">${esc(modes[0])}</text><text x="${x+W/2}" y="${y+H*.84}" font-size="16" font-weight="800" fill="#64748b" text-anchor="middle">${esc(modes[1])}</text>`;
  }
  if(kind==='traffic'){
    const state=cfg.state||'green', colors={red:'#dc2626',yellow:'#facc15',green:'#22c55e'}, labels={red:'Stop',yellow:'Wrap Up',green:'Begin'};
    ['red','yellow','green'].forEach((s,i)=>{const cy=y+H*.28+i*H*.2, active=s===state; body+=`<circle cx="${x+W/2}" cy="${cy}" r="${Math.min(W,H)*.095}" fill="${colors[s]}" opacity="${active?1:.18}" stroke="${active?'#111827':'#cbd5e1'}" stroke-width="${active?4:2}"/>`});
    body+=`<text x="${x+W/2}" y="${y+H-36}" font-size="${Math.max(28,Math.min(46,W/6))}" font-weight="900" fill="${colors[state]}" text-anchor="middle">${labels[state]}</text>`;
  }
  if(kind==='timer'){
    const sec=timerRemainingSec(cfg), dur=Math.max(1,(+cfg.minutes||1)*60), pct=clamp(sec/dur,0,1);
    if(cfg.style==='hourglass'){
      const cx=x+W/2, top=y+72, gh=H-128, gw=Math.min(W*.32,120), sand='#f59e0b';
      body+=`<path d="M ${cx-gw/2} ${top} H ${cx+gw/2} L ${cx+18} ${top+gh/2} L ${cx+gw/2} ${top+gh} H ${cx-gw/2} L ${cx-18} ${top+gh/2} Z" fill="#f8fafc" stroke="#334155" stroke-width="4"/><polygon points="${cx-gw*.36},${top+gh*.1} ${cx+gw*.36},${top+gh*.1} ${cx},${top+gh*(.12+.34*pct)}" fill="${sand}" opacity=".9"/><polygon points="${cx},${top+gh*.54} ${cx-gw*.36},${top+gh*.9} ${cx+gw*.36},${top+gh*.9}" fill="${sand}" opacity="${1-pct+.15}"/><line x1="${cx}" y1="${top+gh*.48}" x2="${cx}" y2="${top+gh*.64}" stroke="${sand}" stroke-width="4" stroke-linecap="round"/><text x="${cx}" y="${y+H-24}" font-size="30" font-weight="900" fill="#111827" text-anchor="middle">${timerText(sec)}</text>`;
    }else{
      body+=`<text x="${x+W/2}" y="${y+H*.56}" font-size="${Math.max(52,Math.min(94,W/5.6))}" font-weight="900" font-family="ui-monospace,Menlo,Consolas,monospace" fill="#111827" text-anchor="middle">${timerText(sec)}</text><rect x="${x+42}" y="${y+H-58}" width="${W-84}" height="16" rx="8" fill="#e5e7eb"/><rect x="${x+42}" y="${y+H-58}" width="${(W-84)*pct}" height="16" rx="8" fill="#7c3aed"/>`;
    }
  }
  if(kind==='scoreboard'){
    const mid=x+W/2,z=scoreboardHitZones(b), nameFs=Math.max(18,Math.min(24,W/22)), scoreFs=Math.max(60,Math.min(104,W/5.4));
    body+=`<line x1="${mid}" y1="${y+62}" x2="${mid}" y2="${y+H-18}" stroke="#e5e7eb" stroke-width="2"/>
      <rect x="${z.homeLabel.x}" y="${z.homeLabel.y}" width="${z.homeLabel.w}" height="${z.homeLabel.h}" rx="12" fill="#eff6ff" stroke="#bfdbfe"/>
      <rect x="${z.awayLabel.x}" y="${z.awayLabel.y}" width="${z.awayLabel.w}" height="${z.awayLabel.h}" rx="12" fill="#fef2f2" stroke="#fecaca"/>
      <text x="${x+W*.25}" y="${y+92}" font-size="${nameFs}" font-weight="900" fill="#1d4ed8" text-anchor="middle">${esc(cfg.homeName||'Home')}</text>
      <text x="${x+W*.75}" y="${y+92}" font-size="${nameFs}" font-weight="900" fill="#b91c1c" text-anchor="middle">${esc(cfg.awayName||'Visitors')}</text>
      <text x="${x+W*.25}" y="${y+H*.62}" font-size="${scoreFs}" font-weight="900" font-family="ui-monospace,Menlo,Consolas,monospace" fill="#111827" text-anchor="middle">${clampWidgetScore(cfg.homeScore)}</text>
      <text x="${x+W*.75}" y="${y+H*.62}" font-size="${scoreFs}" font-weight="900" font-family="ui-monospace,Menlo,Consolas,monospace" fill="#111827" text-anchor="middle">${clampWidgetScore(cfg.awayScore)}</text>
      ${scoreboardButtonSvg(z.homeMinus,'-1','#1d4ed8')}${scoreboardButtonSvg(z.homePlus,'+1','#1d4ed8')}
      ${scoreboardButtonSvg(z.awayMinus,'-1','#b91c1c')}${scoreboardButtonSvg(z.awayPlus,'+1','#b91c1c')}`;
  }
  if(kind==='race'){
    const target=Math.max(1,+cfg.target||10), h=clampWidgetScore(cfg.homeScore), a=clampWidgetScore(cfg.awayScore), trackX=x+42, trackW=W-112, y1=y+128, y2=y+214;
    const car=(cx,cy,color)=>`<g transform="translate(${cx-22} ${cy-12})"><rect x="3" y="7" width="38" height="16" rx="5" fill="${color}"/><path d="M10 7l7-7h12l8 7" fill="${color}"/><circle cx="12" cy="25" r="5" fill="#111827"/><circle cx="33" cy="25" r="5" fill="#111827"/></g>`;
    body+=`<text x="${x+W/2}" y="${y+84}" font-size="20" font-weight="900" fill="#111827" text-anchor="middle">${esc(cfg.title||'Progress Race')}</text><line x1="${trackX}" y1="${y1}" x2="${trackX+trackW}" y2="${y1}" stroke="#cbd5e1" stroke-width="12" stroke-linecap="round"/><line x1="${trackX}" y1="${y2}" x2="${trackX+trackW}" y2="${y2}" stroke="#cbd5e1" stroke-width="12" stroke-linecap="round"/><line x1="${trackX+trackW+14}" y1="${y1-34}" x2="${trackX+trackW+14}" y2="${y2+34}" stroke="#111827" stroke-width="4" stroke-dasharray="8 5"/>${car(trackX+trackW*Math.min(1,h/target),y1,'#2563eb')}${car(trackX+trackW*Math.min(1,a/target),y2,'#dc2626')}<text x="${x+18}" y="${y1+6}" font-size="14" font-weight="900" fill="#1d4ed8">${esc(cfg.homeName||'Team A')} ${h}</text><text x="${x+18}" y="${y2+6}" font-size="14" font-weight="900" fill="#b91c1c">${esc(cfg.awayName||'Team B')} ${a}</text><text x="${x+W-18}" y="${y+H-18}" font-size="13" font-weight="800" fill="#64748b" text-anchor="end">Goal ${target}</text>`;
  }
  return svgEl(`<g class="classroom-widget">${body}</g>`);
}
function ensureClassroomWidgetButton(){
  if(gid('openClassroomWidgetsBtn')) return;
  const anchor=gid('openPictureGraphDialogBtn')||gid('openGraphDialogBtn')||gid('imageBtn');
  if(!anchor||!anchor.parentElement) return;
  const btn=document.createElement('button');
  btn.id='openClassroomWidgetsBtn';
  btn.type='button';
  btn.textContent='Classroom Widgets';
  btn.addEventListener('click',()=>openClassroomWidgetPicker());
  anchor.insertAdjacentElement('afterend',btn);
}
function openClassroomWidgetPicker(){
  ensureClassroomWidgetDialog();
  const dlg=gid('classroomWidgetDialog');
  if(dlg.open) dlg.close();
  dlg.classList.remove('widget-editor-dialog');
  dlg.dataset.editId='';
  dlg.dataset.kind='';
  gid('classroomWidgetTitle').textContent='Classroom Widgets';
  const items=[
    ...CLASSROOM_WIDGETS.map(w=>({title:w.title,html:`<button type="button" data-widget-kind="${esc(w.kind)}"><strong>${esc(w.title)}</strong><span>${esc(widgetSummary(w.kind))}</span></button>`})),
    ...CLASSROOM_TOOL_LINKS.map(t=>({title:t.title,html:`<button type="button" data-widget-tool-url="${esc(t.url)}"><strong>${esc(t.title)}</strong><span>${esc(t.summary)} Opens in a new tab.</span></button>`}))
  ].sort((a,b)=>a.title.localeCompare(b.title));
  gid('classroomWidgetBody').innerHTML=`<div class="classroom-widget-picker">${items.map(item=>item.html).join('')}</div>`;
  dlg.showModal();
}
function widgetSummary(kind){
  return {poll:'Ask and tally quick answers.',randomizer:'Pick from a student list.',wheelspinner:'Spin a wheel of names or choices.',biglink:'Display a URL in large text.',workmode:'Show the current collaboration mode.',traffic:'Show begin, wrap up, or stop.',timer:'Digital or hourglass countdown.',scoreboard:'Home and visitor points.',race:'Two-team progress race.'}[kind]||'Classroom tool.';
}
function insertClassroomWidget(kind){
  const def=CLASSROOM_WIDGETS.find(w=>w.kind===kind)||CLASSROOM_WIDGETS[0], cfg=defaultWidgetConfig(def.kind);
  const obj=makeObj('widget',100,100,def.w,def.h,{...cfg,fill:'none',stroke:'none',strokeWidth:0});
  addObj(obj);
  gid('classroomWidgetDialog')?.close();
  openClassroomWidgetDialog(obj.id);
  setStatus(def.title+' inserted. Use the controls dialog to run or edit it.','success');
}
function ensureClassroomWidgetDialog(){
  if(gid('classroomWidgetDialog')) return;
  const dlg=document.createElement('dialog');
  dlg.id='classroomWidgetDialog';
  dlg.className='classroom-widget-dialog';
  dlg.innerHTML='<div class="modal-head"><h2 id="classroomWidgetTitle">Classroom Widgets</h2><button class="close widget-editor-close" id="classroomWidgetCancelBtn" aria-label="Close controls">Done</button></div><div id="classroomWidgetBody"></div>';
  document.body.appendChild(dlg);
  gid('classroomWidgetCancelBtn')?.addEventListener('click',()=>dlg.close());
  dlg.addEventListener('click',e=>{
    if(e.target.closest('[data-widget-close]')){dlg.close(); return}
    const pick=e.target.closest('[data-widget-kind]');
    if(pick){insertClassroomWidget(pick.dataset.widgetKind); return}
    const tool=e.target.closest('[data-widget-tool-url]');
    if(tool){window.open(tool.dataset.widgetToolUrl,'_blank','noopener,noreferrer'); return}
    const action=e.target.closest('[data-widget-action]');
    if(action) handleWidgetDialogAction(action.dataset.widgetAction,action.dataset.index);
  });
  dlg.addEventListener('input',e=>{if(e.target.closest('[data-widget-field]')) applyWidgetDialogFields(false)});
  dlg.addEventListener('change',e=>{if(e.target.closest('[data-widget-field]')) applyWidgetDialogFields(true)});
}
function openClassroomWidgetDialog(idv){
  ensureClassroomWidgetDialog();
  const o=findObj(idv); if(!o||o.type!=='widget') return;
  const dlg=gid('classroomWidgetDialog'), kind=o.widgetKind||'traffic', cfg=o.widgetConfig||{};
  if(dlg.open&&dlg.matches?.(':modal')) dlg.close();
  dlg.classList.add('widget-editor-dialog');
  dlg.dataset.editId=o.id; dlg.dataset.kind=kind;
  gid('classroomWidgetTitle').textContent=widgetTitle(kind);
  gid('classroomWidgetBody').innerHTML=widgetEditorHtml(kind,cfg)+'<div class="widget-close-row"><button type="button" class="primary" data-widget-close>Done</button></div>';
  if(!dlg.open) dlg.show();
}
function widgetEditorHtml(kind,cfg){
  if(kind==='poll') return `<div class="widget-form"><label>Question<input data-widget-field="question" value="${esc(cfg.question||'')}"></label><label>Options and counts<textarea data-widget-field="pollRows">${esc((cfg.options||[]).map((o,i)=>`${o},${(cfg.counts||[])[i]||0}`).join('\n'))}</textarea></label><div class="poll-tally-controls">${(cfg.options||[]).map((opt,i)=>`<button type="button" data-widget-action="pollVote" data-index="${i}">+ ${esc(opt)}</button>`).join('')}</div><div class="widget-action-row"><button type="button" data-widget-action="pollReset">Reset Counts</button></div></div>`;
  if(kind==='randomizer') return `<div class="widget-form"><label>Title<input data-widget-field="title" value="${esc(cfg.title||'')}"></label><label>Names<textarea data-widget-field="names">${esc(cfg.names||'')}</textarea></label><div class="widget-action-row"><button type="button" class="primary" data-widget-action="pickName">Pick</button><button type="button" data-widget-action="clearPick">Clear</button></div><p class="hint">Current pick: ${esc(cfg.picked||'none')}</p></div>`;
  if(kind==='wheelspinner') return `<div class="widget-form wheel-widget-form"><div class="wheel-editor-preview" id="wheelSpinnerEditorPreview">${wheelSpinnerEditorPreview(cfg)}</div><label>Title<input data-widget-field="title" value="${esc(cfg.title||'Wheel Spinner')}"></label><label>Color palette<select data-widget-field="palette">${wheelSpinnerPaletteOptions(cfg.palette||cfg.theme)}</select></label><label>Names or choices<textarea data-widget-field="items" placeholder="Ava&#10;Ben&#10;Carlos&#10;Dana">${esc(cfg.items||'')}</textarea></label><label>After a spin<select data-widget-field="removeMode"><option value="keep" ${cfg.removeMode!=='remove'?'selected':''}>Keep selected item on the wheel</option><option value="remove" ${cfg.removeMode==='remove'?'selected':''}>Remove selected item from the wheel</option></select></label><div class="widget-action-row"><button type="button" class="primary" data-widget-action="spinWheel">Spin</button><button type="button" data-widget-action="buildWheel">Build Wheel</button><button type="button" data-widget-action="resetWheel">Reset Wheel</button><button type="button" data-widget-action="clearWheelHistory">Clear History</button></div><p class="hint">Selected: ${esc(cfg.picked&&cfg.picked!=='Ready'?cfg.picked:'none')}</p><p class="hint">Picked so far: ${esc((cfg.history||[]).join(', ')||'none')}</p></div>`;
  if(kind==='biglink') return `<div class="widget-form"><label>Title<input data-widget-field="title" value="${esc(cfg.title||'')}"></label><label>URL<input data-widget-field="url" value="${esc(cfg.url||'')}"></label><label>Note<input data-widget-field="note" value="${esc(cfg.note||'')}"></label><div class="widget-action-row"><button type="button" data-widget-action="bigLinkSmaller" aria-label="Make Big Link text smaller">-</button><button type="button" class="primary" data-widget-action="bigLinkLarger" aria-label="Make Big Link text bigger">+</button><button type="button" data-widget-action="bigLinkResetSize">Reset size</button></div><p class="hint">Text size: ${Math.round(bigLinkScale(cfg)*100)}%</p></div>`;
  if(kind==='workmode') return `<div class="widget-form"><label>Mode<select data-widget-field="mode"><option value="focus" ${cfg.mode==='focus'?'selected':''}>Quiet Focus</option><option value="partner" ${cfg.mode==='partner'?'selected':''}>Partner Check</option><option value="table" ${cfg.mode==='table'?'selected':''}>Table Talk</option><option value="team" ${cfg.mode==='team'?'selected':''}>Team Task</option><option value="help" ${cfg.mode==='help'?'selected':''}>Teacher Help</option></select></label></div>`;
  if(kind==='traffic') return `<div class="widget-form widget-traffic-controls"><button type="button" class="traffic-red" data-widget-action="traffic" data-index="red">Stop</button><button type="button" class="traffic-yellow" data-widget-action="traffic" data-index="yellow">Wrap Up</button><button type="button" class="traffic-green" data-widget-action="traffic" data-index="green">Begin</button></div>`;
  if(kind==='timer') return `<div class="widget-form"><label>Title<input data-widget-field="title" value="${esc(cfg.title||'')}"></label><label>Minutes<input data-widget-field="minutes" type="number" min="1" max="240" value="${esc(cfg.minutes||5)}"></label><label>Style<select data-widget-field="style"><option value="digital" ${cfg.style!=='hourglass'?'selected':''}>Digital</option><option value="hourglass" ${cfg.style==='hourglass'?'selected':''}>Hourglass</option></select></label><div class="widget-action-row"><button type="button" class="primary" data-widget-action="timerStart">Start</button><button type="button" data-widget-action="timerPause">Pause</button><button type="button" data-widget-action="timerReset">Reset</button></div><p class="hint">Remaining: ${timerText(timerRemainingSec(cfg))}</p></div>`;
  if(kind==='scoreboard') return `<div class="widget-form widget-score-controls"><label>Home name<input data-widget-field="homeName" value="${esc(cfg.homeName||'')}"></label><label>Visitor name<input data-widget-field="awayName" value="${esc(cfg.awayName||'')}"></label><div class="score-control-row"><b>${esc(cfg.homeName||'Home')}</b><button data-widget-action="homeMinus" type="button">-1</button><button data-widget-action="homePlus1" type="button">+1</button><button data-widget-action="homePlus2" type="button">+2</button><button data-widget-action="homePlus3" type="button">+3</button></div><div class="score-control-row"><b>${esc(cfg.awayName||'Visitors')}</b><button data-widget-action="awayMinus" type="button">-1</button><button data-widget-action="awayPlus1" type="button">+1</button><button data-widget-action="awayPlus2" type="button">+2</button><button data-widget-action="awayPlus3" type="button">+3</button></div><button type="button" data-widget-action="scoreReset">Reset</button></div>`;
  if(kind==='race') return `<div class="widget-form widget-score-controls"><label>Title<input data-widget-field="title" value="${esc(cfg.title||'')}"></label><label>Team A<input data-widget-field="homeName" value="${esc(cfg.homeName||'')}"></label><label>Team B<input data-widget-field="awayName" value="${esc(cfg.awayName||'')}"></label><label>Goal<input data-widget-field="target" type="number" min="1" max="999" value="${esc(cfg.target||10)}"></label><div class="score-control-row"><b>${esc(cfg.homeName||'Team A')}</b><button data-widget-action="homeMinus" type="button">-1</button><button data-widget-action="homePlus1" type="button">+1</button><button data-widget-action="homePlus2" type="button">+2</button></div><div class="score-control-row"><b>${esc(cfg.awayName||'Team B')}</b><button data-widget-action="awayMinus" type="button">-1</button><button data-widget-action="awayPlus1" type="button">+1</button><button data-widget-action="awayPlus2" type="button">+2</button></div><button type="button" data-widget-action="scoreReset">Reset</button></div>`;
  return '';
}
function widgetDialogObj(){return findObj(gid('classroomWidgetDialog')?.dataset.editId)}
function applyWidgetDialogFields(saveNow=false){
  const o=widgetDialogObj(); if(!o) return;
  const cfg=o.widgetConfig=o.widgetConfig||{};
  gid('classroomWidgetBody')?.querySelectorAll('[data-widget-field]').forEach(el=>{
    const k=el.dataset.widgetField, v=el.value;
    if(k==='minutes'){cfg.minutes=Math.max(1,+v||1); if(!cfg.running) cfg.remainingSec=cfg.minutes*60}
    else if(k==='target') cfg.target=Math.max(1,+v||1);
    else if(k==='pollRows'){const rows=parseGraphRows(v); cfg.options=rows.map(r=>r.label); cfg.counts=rows.map(r=>Math.max(0,Math.round(r.value)))}
    else if(k==='items'){cfg.items=v; const parsed=parseWheelItems(v), active=(cfg.activeItems||[]).filter(item=>parsed.some(p=>p.toLowerCase()===String(item).toLowerCase())); cfg.activeItems=active.length?active:parsed}
    else cfg[k]=v;
  });
  if(o.widgetKind==='biglink') autosizeBigLinkWidget(o);
  if(o.widgetKind==='wheelspinner'){
    const preview=gid('wheelSpinnerEditorPreview');
    if(preview) preview.innerHTML=wheelSpinnerEditorPreview(cfg);
  }
  render(); if(saveNow) saveState();
}
function handleWidgetDialogAction(action,index){
  const o=widgetDialogObj(); if(!o) return;
  applyWidgetDialogFields(false);
  const cfg=o.widgetConfig=o.widgetConfig||{};
  if(action==='pollReset') cfg.counts=(cfg.options||[]).map(()=>0);
  if(action==='pollVote'){const i=Math.max(0,parseInt(index||'0',10)); cfg.counts=cfg.counts||[]; cfg.counts[i]=Math.max(0,(+cfg.counts[i]||0)+1)}
  if(action==='pickName'){const names=String(cfg.names||'').split(/\n+/).map(s=>s.trim()).filter(Boolean); if(names.length){cfg.picked=names[Math.floor(Math.random()*names.length)]; cfg.history=[...(cfg.history||[]),cfg.picked].slice(-8)}}
  if(action==='clearPick'){cfg.picked=''; cfg.history=[]}
  if(action==='bigLinkSmaller'||action==='bigLinkLarger'||action==='bigLinkResetSize'){
    if(action==='bigLinkResetSize') cfg.textScale=1;
    else cfg.textScale=clamp(bigLinkScale(cfg)+(action==='bigLinkLarger' ? .18 : -.18),.65,2.6);
    autosizeBigLinkWidget(o);
  }
  if(action==='buildWheel'){const items=parseWheelItems(cfg.items||''); cfg.activeItems=[...items]; cfg.picked='Ready'; cfg.history=[]; delete cfg.pendingPick; cfg.spinUntil=0}
  if(action==='spinWheel'){startWheelSpin(o); return}
  if(action==='resetWheel'){cfg.activeItems=parseWheelItems(cfg.items||''); cfg.picked='Ready'; delete cfg.pendingPick; cfg.spinUntil=0}
  if(action==='clearWheelHistory'){cfg.history=[]}
  if(action==='traffic') cfg.state=index||'green';
  if(action==='timerStart'){const sec=timerRemainingSec(cfg)||Math.max(1,+cfg.minutes||1)*60; cfg.remainingSec=sec; cfg.endAt=Date.now()+sec*1000; cfg.running=true; ensureWidgetTimerTick()}
  if(action==='timerPause'){cfg.remainingSec=timerRemainingSec(cfg); cfg.running=false; cfg.endAt=0}
  if(action==='timerReset'){cfg.running=false; cfg.endAt=0; cfg.remainingSec=Math.max(1,+cfg.minutes||1)*60}
  const scoreOps={homeMinus:['homeScore',-1],homePlus1:['homeScore',1],homePlus2:['homeScore',2],homePlus3:['homeScore',3],awayMinus:['awayScore',-1],awayPlus1:['awayScore',1],awayPlus2:['awayScore',2],awayPlus3:['awayScore',3]};
  if(scoreOps[action]){const [k,d]=scoreOps[action]; cfg[k]=clampWidgetScore((cfg[k]||0)+d)}
  if(action==='scoreReset'){cfg.homeScore=0; cfg.awayScore=0}
  render(); saveState(); openClassroomWidgetDialog(o.id);
}
let widgetTimerTick=null;
let widgetSpinTick=null;
function refreshOpenWheelSpinnerPreview(){
  const dlg=gid('classroomWidgetDialog'), preview=gid('wheelSpinnerEditorPreview'), o=widgetDialogObj();
  if(dlg?.open&&preview&&o?.widgetKind==='wheelspinner') preview.innerHTML=wheelSpinnerEditorPreview(o.widgetConfig||{});
}
function ensureWidgetSpinTick(){
  if(widgetSpinTick) return;
  widgetSpinTick=setInterval(()=>{
    let active=false, finished=false;
    board.panels.forEach(p=>p.objects.forEach(o=>{
      const cfg=o.type==='widget'&&o.widgetKind==='wheelspinner'?o.widgetConfig:null;
      if(!cfg) return;
      if((+cfg.spinUntil||0)>Date.now()) active=true;
      else if(cfg.pendingPick){finished=finishWheelSpin(o,true)||finished}
    }));
    if(active||finished){render(); refreshOpenWheelSpinnerPreview()}
    else {clearInterval(widgetSpinTick); widgetSpinTick=null}
  },33);
}
function ensureWidgetTimerTick(){
  if(widgetTimerTick) return;
  widgetTimerTick=setInterval(()=>{
    let active=false;
    board.panels.forEach(p=>p.objects.forEach(o=>{const cfg=o.type==='widget'&&o.widgetKind==='timer'?o.widgetConfig:null; if(cfg?.running){active=true; if(timerRemainingSec(cfg)<=0){cfg.running=false; cfg.remainingSec=0; cfg.endAt=0; setStatus((cfg.title||'Timer')+' finished.','success')}}}));
    if(active) render(); else {clearInterval(widgetTimerTick); widgetTimerTick=null}
  },1000);
}
ensureWidgetTimerTick();
ensureWidgetSpinTick();

/* Concept Map creates a lightweight Inspiration/FreeMind-style organizer from
   indented text. It is inserted as an image with editable source metadata. */
const CONCEPT_MAP_SAMPLE='Ecosystems | https://education.nationalgeographic.org/\n- Producers | | 🌱\n-- Plants make food\n- Consumers | | 🐇\n-- Herbivores\n-- Carnivores\n- Decomposers | | 🍄\n- Energy Flow | https://www.si.edu/ | ⚡';
function conceptMapSafeUrl(url){const u=String(url||'').trim(); return /^(https?:\/\/|mailto:)/i.test(u)?u:''}
function parseConceptMapRows(text){
  const nodes=[], stack=[];
  String(text||'').split(/\n+/).forEach((raw,lineIndex)=>{
    if(!raw.trim()) return;
    const indent=(raw.match(/^\s*/)||[''])[0].length, dash=(raw.trim().match(/^-+/)||[''])[0].length;
    const depth=dash?dash:Math.floor(indent/2);
    const body=raw.trim().replace(/^-+\s*/,'');
    const [label='',link='',image='']=body.split('|').map(s=>s.trim());
    if(!label) return;
    const node={id:nodes.length,label,link:conceptMapSafeUrl(link),image,depth:Math.max(0,depth),children:[],lineIndex};
    while(stack.length&&stack[stack.length-1].depth>=node.depth) stack.pop();
    if(stack.length){node.parent=stack[stack.length-1].id; stack[stack.length-1].children.push(node.id)}
    nodes.push(node); stack.push(node);
  });
  return nodes;
}
function conceptMapLayout(nodes,layout){
  const W=900,H=560,pad=70,levels={};
  nodes.forEach(n=>(levels[n.depth]||(levels[n.depth]=[])).push(n));
  if(layout==='tree'){
    const maxDepth=Math.max(...nodes.map(n=>n.depth),1);
    Object.entries(levels).forEach(([depth,list])=>{
      const x=pad+(W-pad*2)*(+depth/Math.max(1,maxDepth));
      list.forEach((n,i)=>{n.x=x;n.y=pad+(H-pad*2)*((i+1)/(list.length+1))});
    });
  } else {
    const root=nodes.find(n=>!n.parent)||nodes[0];
    if(root){root.x=W/2;root.y=H/2}
    const branches=nodes.filter(n=>n.parent===root?.id);
    branches.forEach((n,i)=>{
      const a=(Math.PI*2*i/Math.max(1,branches.length))-Math.PI/2,r=170;
      n.x=W/2+Math.cos(a)*r;n.y=H/2+Math.sin(a)*r;
      const kids=nodes.filter(k=>k.parent===n.id);
      kids.forEach((k,j)=>{const spread=(kids.length-1)*0.34, aa=a-spread/2+j*.34, rr=300; k.x=W/2+Math.cos(aa)*rr; k.y=H/2+Math.sin(aa)*rr});
    });
    nodes.filter(n=>typeof n.x!=='number').forEach((n,i)=>{const a=(Math.PI*2*i/Math.max(1,nodes.length))-Math.PI/2,r=235;n.x=W/2+Math.cos(a)*r;n.y=H/2+Math.sin(a)*r});
  }
  nodes.forEach(n=>{n.x=Math.max(80,Math.min(W-80,n.x));n.y=Math.max(58,Math.min(H-58,n.y))});
  return {W,H,nodes};
}
function conceptMapImageMarkup(value,x,y,size){
  if(!value) return '';
  if(/^(data:image\/|\.?\/?assets\/|blob:)/i.test(value)) return `<image href="${esc(value)}" x="${x-size/2}" y="${y-size/2}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`;
  return `<text x="${x}" y="${y+size*.34}" font-family="Arial, sans-serif" font-size="${size}" text-anchor="middle">${esc(value.slice(0,4))}</text>`;
}
function conceptMapSvg(config){
  const parsed=parseConceptMapRows(config.source), layout=conceptMapLayout(parsed,config.layout||'radial'), nodes=layout.nodes, W=layout.W,H=layout.H;
  if(!nodes.length) return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="#fff"/><text x="${W/2}" y="${H/2}" text-anchor="middle" font-family="Arial" font-size="22" fill="#64748b">Add one node per line.</text></svg>`;
  const colors=['#dbeafe','#fce7f3','#d1fae5','#ffedd5','#fef3c7','#e9d5ff'];
  let body='<rect width="100%" height="100%" rx="18" fill="#ffffff"/>';
  nodes.filter(n=>typeof n.parent==='number').forEach(n=>{const p=nodes[n.parent]; if(p) body+=`<path d="M ${p.x} ${p.y} C ${(p.x+n.x)/2} ${p.y}, ${(p.x+n.x)/2} ${n.y}, ${n.x} ${n.y}" fill="none" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>`});
  nodes.forEach((n,i)=>{
    const isRoot=typeof n.parent!=='number', w=Math.min(210,Math.max(118,n.label.length*8+52+(n.image?34:0))), h=n.image?74:58, x=n.x-w/2,y=n.y-h/2, fill=isRoot?'#7c3aed':colors[n.depth%colors.length], stroke=isRoot?'#5b21b6':'#cbd5e1', text=isRoot?'#fff':'#111827';
    const labelX=x+(n.image?58:w/2), anchor=n.image?'start':'middle', image=conceptMapImageMarkup(n.image,x+32,n.y,30);
    const link=n.link?`<text x="${x+w-24}" y="${y+20}" font-family="Arial" font-size="17" fill="${isRoot?'#fef3c7':'#2563eb'}">↗</text><text x="${x+w/2}" y="${y+h-9}" text-anchor="middle" font-family="Arial" font-size="9" fill="${isRoot?'#ede9fe':'#64748b'}">${esc(n.link.replace(/^https?:\/\//,'').slice(0,32))}</text>`:'';
    body+=`<g>${n.link?`<a href="${esc(n.link)}" target="_blank" rel="noopener noreferrer">`:''}<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${fill}" stroke="${stroke}" stroke-width="2"/><title>${esc(n.link||n.label)}</title>${image}<text x="${labelX}" y="${y+(n.image?32:35)}" text-anchor="${anchor}" font-family="Arial" font-size="${isRoot?18:15}" font-weight="800" fill="${text}">${esc(n.label).slice(0,30)}</text>${link}${n.link?'</a>':''}</g>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>`;
}
function conceptMapNodeBounds(n){
  const w=Math.min(210,Math.max(118,n.label.length*8+52+(n.image?34:0))), h=n.image?74:58;
  return {x:n.x-w/2,y:n.y-h/2,w,h};
}
function conceptMapHitLink(obj,boardPoint){
  const b=normBox(obj), layout=conceptMapLayout(parseConceptMapRows(obj.conceptMapConfig?.source||''),obj.conceptMapConfig?.layout||'radial');
  const s=Math.min(b.w/layout.W,b.h/layout.H), ox=b.x+(b.w-layout.W*s)/2, oy=b.y+(b.h-layout.H*s)/2;
  const x=(boardPoint.x-ox)/s, y=(boardPoint.y-oy)/s;
  for(let i=layout.nodes.length-1;i>=0;i--){const n=layout.nodes[i], nb=conceptMapNodeBounds(n); if(n.link&&x>=nb.x&&x<=nb.x+nb.w&&y>=nb.y&&y<=nb.y+nb.h) return n.link}
  return '';
}
function conceptMapConfigFromDialog(){return{layout:gid('conceptMapLayout')?.value||'radial',source:gid('conceptMapSource')?.value||''}}
function conceptMapDataUrl(config){return 'data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(conceptMapSvg(config))))}
function updateConceptMapPreview(){const p=gid('conceptMapPreview'); if(p) p.innerHTML=conceptMapSvg(conceptMapConfigFromDialog())}
function ensureConceptMapDialog(){
  if(gid('conceptMapDialog')) return;
  const dlg=document.createElement('dialog'); dlg.id='conceptMapDialog'; dlg.className='graph-dialog concept-map-dialog';
  dlg.innerHTML=`<div class="modal-head"><h2>Concept Map</h2><button class="close" id="conceptMapCancelBtn" aria-label="Close">Close</button></div><p class="confirm-msg">Use one node per line. Add hyphens for child ideas. Optional format: label | https://link | emoji or image. Use the image button to attach an image to the current line. On the board, Ctrl/Cmd-click a linked node to open its link.</p><div class="graph-builder concept-map-builder"><div class="graph-form"><div class="row"><label>Layout</label><select id="conceptMapLayout"><option value="radial">Radial mind map</option><option value="tree">Left-to-right concept map</option></select></div><label class="graph-data-label" for="conceptMapSource">Nodes</label><textarea id="conceptMapSource" spellcheck="false"></textarea><div class="concept-map-actions"><button id="conceptMapSampleBtn" type="button">Sample</button><button id="conceptMapImageBtn" type="button">Add image to line</button><button id="conceptMapInsertBtn" type="button" class="primary">Insert Concept Map</button></div><input id="conceptMapImageInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden></div><div id="conceptMapPreview" class="graph-preview concept-map-preview" aria-label="Concept map preview"></div></div>`;
  document.body.appendChild(dlg);
  gid('conceptMapLayout')?.addEventListener('input',updateConceptMapPreview);
  gid('conceptMapSource')?.addEventListener('input',updateConceptMapPreview);
  gid('conceptMapSampleBtn')?.addEventListener('click',()=>{gid('conceptMapSource').value=CONCEPT_MAP_SAMPLE; updateConceptMapPreview()});
  gid('conceptMapImageBtn')?.addEventListener('click',()=>gid('conceptMapImageInput')?.click());
  gid('conceptMapImageInput')?.addEventListener('change',async e=>{const f=e.target.files?.[0], ta=gid('conceptMapSource'); if(!f||!ta) return; if(!(await validateImageDeep(f))){e.target.value=''; return} const r=new FileReader(); r.onload=()=>{const start=ta.selectionStart||0, lines=ta.value.split('\n'); let pos=0, idx=0; for(;idx<lines.length;idx++){if(start<=pos+lines[idx].length) break; pos+=lines[idx].length+1} const parts=(lines[idx]||'New idea').split('|').map(s=>s.trim()); while(parts.length<3) parts.push(''); parts[2]=r.result; lines[idx]=parts.join(' | '); ta.value=lines.join('\n'); updateConceptMapPreview(); e.target.value=''}; r.readAsDataURL(f)});
  gid('conceptMapInsertBtn')?.addEventListener('click',insertConceptMapFromDialog);
  gid('conceptMapCancelBtn')?.addEventListener('click',()=>dlg.close());
}
function openConceptMapDialog(existingId){
  ensureConceptMapDialog();
  const dlg=gid('conceptMapDialog'), obj=existingId?findObj(existingId):null, cfg=obj?.conceptMapConfig||{layout:'radial',source:CONCEPT_MAP_SAMPLE};
  gid('conceptMapLayout').value=cfg.layout||'radial'; gid('conceptMapSource').value=cfg.source||CONCEPT_MAP_SAMPLE; dlg.dataset.editId=obj?obj.id:''; updateConceptMapPreview(); dlg.showModal();
}
function insertConceptMapFromDialog(){
  const cfg=conceptMapConfigFromDialog(), nodes=parseConceptMapRows(cfg.source); if(!nodes.length) return setStatus('Add at least one concept map node.','danger');
  const meta={src:conceptMapDataUrl(cfg),naturalW:900,naturalH:560,conceptMapConfig:cfg,fill:'none',stroke:'none',strokeWidth:0}, dlg=gid('conceptMapDialog'), editId=dlg?.dataset.editId;
  if(editId){const obj=findObj(editId); if(obj){Object.assign(obj,meta); delete obj.crop; render(); saveState(); setStatus('Concept map updated.','success'); dlg.close(); return}}
  addObj(makeObj('image',110,100,540,336,meta)); setStatus('Concept map inserted.','success'); dlg?.close();
}
svg.addEventListener('dblclick',e=>{const objEl=e.target.closest('.object'); if(!objEl) return; const o=findObj(objEl.dataset.id); if(o?.type==='image'&&o.conceptMapConfig){e.stopPropagation(); openConceptMapDialog(o.id)}},true);
svg.addEventListener('click',e=>{if(!(e.ctrlKey||e.metaKey)) return; const objEl=e.target.closest('.object'); if(!objEl) return; const o=findObj(objEl.dataset.id); if(!(o?.type==='image'&&o.conceptMapConfig)) return; const url=conceptMapHitLink(o,pt(e)); if(url){e.preventDefault(); e.stopPropagation(); window.open(url,'_blank','noopener,noreferrer')}},true);

function makeConceptNode(x,y,label,extra={}){
  return makeObj('rect',x,y,180,78,{conceptNode:true,conceptMapId:extra.conceptMapId||id(),html:plainTextToHtml(label||'Idea'),text:label||'Idea',fill:extra.fill||'#eff6ff',stroke:extra.stroke||'#7c3aed',strokeWidth:2,textColor:extra.textColor||'#111827',fontSize:extra.fontSize||18,hAlign:'center',vAlign:'middle',autoScaleText:true,...extra});
}
function connectConceptNodes(fromId,toId){
  return makeObj('connector',0,0,0,0,{fromId,toId,conceptConnector:true,fill:'none',stroke:'#94a3b8',strokeWidth:3,opacity:1});
}
function insertNativeConceptMap(){
  const mapId=id(), cx=260, cy=170;
  const root=makeConceptNode(cx,cy,'Main Idea',{conceptMapId:mapId,fill:'#7c3aed',stroke:'#5b21b6',textColor:'#ffffff',fontSize:20});
  const ideas=[
    makeConceptNode(cx-230,cy-105,'Idea 1',{conceptMapId:mapId,fill:'#dbeafe',stroke:'#2563eb'}),
    makeConceptNode(cx+230,cy-105,'Idea 2',{conceptMapId:mapId,fill:'#d1fae5',stroke:'#059669'}),
    makeConceptNode(cx-230,cy+125,'Idea 3',{conceptMapId:mapId,fill:'#fef3c7',stroke:'#ca8a04'}),
    makeConceptNode(cx+230,cy+125,'Idea 4',{conceptMapId:mapId,fill:'#fce7f3',stroke:'#db2777'})
  ];
  panel().objects.push(root,...ideas,...ideas.map(n=>connectConceptNodes(root.id,n.id)));
  selectedIds=[root.id];
  render(); saveState();
  setStatus('Editable concept map added. Drag nodes, double-click text, or use Add Child on a selected node.','success');
}
function selectedConceptNode(){
  const o=currentObj();
  return selectedIds.length===1&&o&&o.conceptNode&&canEditObject(o)?o:null;
}
function selectedConnector(){
  const o=currentObj();
  return selectedIds.length===1&&o&&o.type==='connector'&&canEditObject(o)?o:null;
}
function applyConceptNodeShape(shape){
  const o=selectedConceptNode();
  if(!o) return;
  const previous=o.type;
  if(shape==='square'||shape==='circle'){
    const b=normBox(o), size=Math.max(64,Math.max(b.w,b.h));
    o.x=b.cx-size/2; o.y=b.cy-size/2; o.w=size; o.h=size;
    o.type=shape==='circle'?'ellipse':'rect';
  } else {
    o.type=shape||'rect';
  }
  if(TEXTABLE_TYPES.includes(o.type)){
    const d=defaultTextProps(o.type);
    ['hAlign','vAlign','autoScaleText'].forEach(k=>{if(o[k]===undefined||!TEXTABLE_TYPES.includes(previous)) o[k]=d[k]});
  }
  render(); saveState();
}
function conceptNodeShapeValue(o){
  if(!o) return 'rect';
  if(o.type==='ellipse'){
    const b=normBox(o);
    return Math.abs(b.w-b.h)<2?'circle':'ellipse';
  }
  if(o.type==='rect'){
    const b=normBox(o);
    return Math.abs(b.w-b.h)<2?'square':'rect';
  }
  return SHAPE_TEXT_TYPES.includes(o.type)?o.type:'rect';
}
function addConceptChildNode(parent=selectedConceptNode()){
  if(!parent) return setStatus('Select a concept-map node first.','danger');
  const siblings=panel().objects.filter(o=>o.conceptNode&&panel().objects.some(c=>c.type==='connector'&&c.fromId===parent.id&&c.toId===o.id)).length;
  const angle=-Math.PI/2+siblings*(Math.PI/4), b=normBox(parent), distance=190;
  const child=makeConceptNode(b.cx+Math.cos(angle)*distance-90,b.cy+Math.sin(angle)*distance-39,'New Idea',{conceptMapId:parent.conceptMapId||id(),fill:'#ffffff',stroke:parent.stroke||'#7c3aed'});
  panel().objects.push(child,connectConceptNodes(parent.id,child.id));
  selectedIds=[child.id];
  render(); saveState();
  openInlineTextEditor(child.id);
}
function setConceptLink(){
  const o=selectedConceptNode();
  if(!o) return setStatus('Select a concept-map node first.','danger');
  const value=prompt('Link for this node. Use https:// or mailto:',o.conceptLink||'');
  if(value===null) return;
  const cleaned=conceptMapSafeUrl(value);
  if(value.trim()&&!cleaned) return setStatus('Use a link that starts with https://, http://, or mailto:.','danger');
  o.conceptLink=cleaned;
  render(); saveState();
  setStatus(cleaned?'Node link saved. Ctrl/Cmd-click the node to open it.':'Node link removed.','success');
}
function attachConceptImageFile(file){
  const o=selectedConceptNode();
  if(!o||!file) return;
  const r=new FileReader();
  r.onload=()=>{o.conceptImageSrc=r.result; o.conceptImageKind='image'; render(); saveState(); setStatus('Image attached to concept node.','success')};
  r.onerror=()=>setStatus('Image upload failed.','danger');
  r.readAsDataURL(file);
}
async function applyConceptPresetImage(value){
  const o=selectedConceptNode();
  if(!o) return setStatus('Select a concept-map node first.','danger');
  if(!value) return;
  try{
    const symbol=await pictureGraphPresetSymbol(value);
    o.conceptImageSrc=symbol;
    o.conceptImageKind=pictureGraphSymbolKind(symbol);
    render(); saveState();
    setStatus('Preset image attached to concept node.','success');
  }catch(_){
    setStatus('Preset image could not be loaded.','danger');
  }
}
function clearConceptNodeImage(){
  const o=selectedConceptNode();
  if(!o) return setStatus('Select a concept-map node first.','danger');
  delete o.conceptImageSrc;
  delete o.conceptImageKind;
  render(); saveState();
  setStatus('Concept node image removed.','success');
}
function ensureConceptCanvasControls(){
  if(gid('conceptNodeControls')&&gid('connectorControls')) return;
  const alignPanel=document.querySelector('.object-align-panel');
  if(!alignPanel) return;
  if(!gid('conceptNodeControls')){
    const wrap=document.createElement('div');
    wrap.id='conceptNodeControls';
    wrap.className='concept-node-controls';
    wrap.innerHTML=`<div class="hint">Concept map node</div><div class="row"><label>Shape</label><select id="conceptNodeShape"><option value="rect">Rectangle</option><option value="square">Square</option><option value="ellipse">Ellipse</option><option value="circle">Circle</option><option value="diamond">Diamond</option><option value="triangle">Triangle</option><option value="callout">Callout</option><option value="speech">Speech Bubble</option></select></div><div class="row"><label>Image</label><select id="conceptNodePresetImage">${pictureGraphIconOptions()}</select></div><div class="grid"><button id="conceptAddChildBtn" type="button">Add Child</button><button id="conceptSetLinkBtn" type="button">Set Link</button><button id="conceptOpenLinkBtn" type="button">Open Link</button><button id="conceptAttachImageBtn" type="button">Upload Image</button><button id="conceptUsePresetImageBtn" type="button">Use Preset</button><button id="conceptClearImageBtn" type="button">Clear Image</button></div><input id="conceptNodeImageInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden>`;
    alignPanel.insertAdjacentElement('beforebegin',wrap);
  }
  if(!gid('connectorControls')){
    const wrap=document.createElement('div');
    wrap.id='connectorControls';
    wrap.className='concept-node-controls';
    wrap.innerHTML='<div class="hint">Connector</div><div class="row connector-label-row"><label>Label</label><textarea id="connectorLabelInput" rows="2" placeholder="focus on"></textarea></div><div class="row"><label>Position</label><input id="connectorLabelPosition" type="range" min="8" max="92" value="50"><span id="connectorLabelPositionValue" class="value-chip">50%</span></div><p class="hint">Use the main Stroke color and Stroke width controls for connector color and line thickness.</p>';
    alignPanel.insertAdjacentElement('beforebegin',wrap);
  }
  gid('conceptNodeShape')?.addEventListener('change',e=>applyConceptNodeShape(e.target.value));
  gid('conceptAddChildBtn')?.addEventListener('click',()=>addConceptChildNode());
  gid('conceptSetLinkBtn')?.addEventListener('click',setConceptLink);
  gid('conceptOpenLinkBtn')?.addEventListener('click',()=>{const o=selectedConceptNode(); if(o?.conceptLink) window.open(o.conceptLink,'_blank','noopener,noreferrer'); else setStatus('This concept node has no link yet.','danger')});
  gid('conceptAttachImageBtn')?.addEventListener('click',()=>gid('conceptNodeImageInput')?.click());
  gid('conceptUsePresetImageBtn')?.addEventListener('click',()=>applyConceptPresetImage(gid('conceptNodePresetImage')?.value||''));
  gid('conceptClearImageBtn')?.addEventListener('click',clearConceptNodeImage);
  gid('conceptNodeImageInput')?.addEventListener('change',async e=>{const f=e.target.files?.[0]; if(!f) return; if(await validateImageDeep(f)) attachConceptImageFile(f); e.target.value=''});
  gid('connectorLabelInput')?.addEventListener('input',e=>{const o=selectedConnector(); if(!o) return; o.connectorLabel=e.target.value; render(); saveState(false)});
  gid('connectorLabelPosition')?.addEventListener('input',e=>{const o=selectedConnector(); if(!o) return; o.connectorLabelT=+e.target.value; const v=gid('connectorLabelPositionValue'); if(v) v.textContent=e.target.value+'%'; render(); saveState(false)});
  gid('connectorLabelInput')?.addEventListener('change',()=>saveState());
  gid('connectorLabelPosition')?.addEventListener('change',()=>saveState());
}
function refreshConceptCanvasControls(){
  ensureConceptCanvasControls();
  const node=selectedConceptNode(), connector=selectedConnector(), nodeWrap=gid('conceptNodeControls'), connectorWrap=gid('connectorControls');
  if(nodeWrap) nodeWrap.hidden=!node;
  if(connectorWrap) connectorWrap.hidden=!connector;
  if(node&&gid('conceptNodeShape')) gid('conceptNodeShape').value=conceptNodeShapeValue(node);
  if(connector){
    setInputIfIdle(gid('connectorLabelInput'),connector.connectorLabel||'');
    setInputIfIdle(gid('connectorLabelPosition'),String(connector.connectorLabelT||50));
    const v=gid('connectorLabelPositionValue'); if(v) v.textContent=(connector.connectorLabelT||50)+'%';
  }
}
svg.addEventListener('click',e=>{if(!(e.ctrlKey||e.metaKey)) return; const objEl=e.target.closest('.object'); if(!objEl) return; const o=findObj(objEl.dataset.id); if(o?.conceptNode&&o.conceptLink){e.preventDefault(); e.stopPropagation(); window.open(o.conceptLink,'_blank','noopener,noreferrer')}},true);

function emojiStamp(label,parts,x=100,y=100,w=118,h=118){
  return makeObj('stamp',x,y,w,h,{stampId:'emoji_'+id(),stampIcon:parts.join(''),emojiParts:parts,stampLabel:label,stampBg:'#f8fafc',fill:'none',stroke:'none',strokeWidth:0});
}
function buildEmojiUI(){
  const grid=gid('emojiGrid'), a=gid('emojiMixA'), b=gid('emojiMixB'), preview=gid('emojiMixPreview');
  if(!grid||!a||!b) return;
  const opts=EMOJI_CHOICES.map(e=>`<option value="${esc(e)}">${esc(e)}</option>`).join('');
  a.innerHTML=opts; b.innerHTML=opts; b.value=EMOJI_CHOICES[1]||EMOJI_CHOICES[0];
  grid.innerHTML=EMOJI_CHOICES.map(e=>`<button type="button" class="emoji-tile" data-emoji="${esc(e)}" aria-label="Insert ${esc(e)}">${esc(e)}</button>`).join('');
  const refresh=()=>{if(preview) preview.textContent=(a.value||'')+(b.value||'')};
  a.addEventListener('change',refresh); b.addEventListener('change',refresh); refresh();
  grid.querySelectorAll('[data-emoji]').forEach(btn=>btn.addEventListener('click',()=>{insertEmoji(btn.dataset.emoji); gid('emojiDialog')?.close()}));
}
function insertEmoji(emoji){
  addObj(emojiStamp('Emoji',[emoji],120,120,92,92));
}
function insertEmojiMix(parts=null){
  const mix=parts||[gid('emojiMixA')?.value||EMOJI_CHOICES[0],gid('emojiMixB')?.value||EMOJI_CHOICES[1]||EMOJI_CHOICES[0]].filter(Boolean);
  if(!mix.length) return;
  addObj(emojiStamp('Emoji Mix',mix,120,120,132,132));
}
function mixSelectedEmojis(){
  const emojis=selectedIds.map(findObj).filter(o=>o&&o.type==='stamp').flatMap(o=>o.emojiParts?.length?o.emojiParts:[o.stampIcon].filter(Boolean)).filter(Boolean).slice(0,4);
  if(emojis.length<2) return setStatus('Select two or more emoji stickers first.','danger');
  const b=selectionBounds(), obj=emojiStamp('Emoji Mix',emojis,b?b.x:140,b?b.y:140,Math.max(118,b?.w||132),Math.max(118,b?.h||132));
  panel().objects.push(obj);
  selectedIds=[obj.id];
  render();
  saveState();
  setStatus('Emoji mix created.','success');
}
gid('openEmojiDialogBtn')?.addEventListener('click',()=>gid('emojiDialog')?.showModal());
gid('insertEmojiMixBtn')?.addEventListener('click',()=>{insertEmojiMix(); gid('emojiDialog')?.close()});
gid('mixSelectedEmojiBtn')?.addEventListener('click',mixSelectedEmojis);
gid('closeEmojiDialog')?.addEventListener('click',()=>gid('emojiDialog')?.close());
buildEmojiUI();

function imageObjectsForMosaic(){
  return selectedIds.map(findObj).filter(o=>o&&o.type==='image'&&o.src&&canEditObject(o));
}
function loadImageElement(src){return new Promise((resolve,reject)=>{const img=new Image(); img.onload=()=>resolve(img); img.onerror=()=>reject(new Error('Could not read an image.')); img.src=src})}
function imageCropRect(o,img){
  return o.crop&&o.naturalW&&o.naturalH?{sx:o.crop.x*img.width,sy:o.crop.y*img.height,sw:o.crop.w*img.width,sh:o.crop.h*img.height}:{sx:0,sy:0,sw:img.width,sh:img.height};
}
function roundRectPath(ctx,x,y,w,h,r){
  r=Math.max(0,Math.min(r,w/2,h/2));
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}
function drawImageCover(ctx,img,crop,x,y,w,h,rounded=0){
  ctx.save();
  if(rounded){roundRectPath(ctx,x,y,w,h,rounded); ctx.clip()}
  const scale=Math.max(w/crop.sw,h/crop.sh), dw=crop.sw*scale, dh=crop.sh*scale;
  ctx.drawImage(img,crop.sx,crop.sy,crop.sw,crop.sh,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
  ctx.restore();
}
async function loadSelectedImageFrames(){
  const imgs=imageObjectsForMosaic();
  const frames=[];
  for(const o of imgs){
    const img=await loadImageElement(o.src), crop=imageCropRect(o,img);
    frames.push({o,img,crop,visibleW:crop.sw,visibleH:crop.sh});
  }
  return frames;
}
async function createMosaicFromSelection(){
  const frames=await loadSelectedImageFrames();
  if(frames.length<2) return setStatus('Select two or more images first.','danger');
  const cols=Math.max(1,+gid('mosaicColumns')?.value||2), gap=Math.max(0,+gid('mosaicGap')?.value||12), rounded=Math.max(0,+gid('mosaicRounded')?.value||0), bg=gid('mosaicBg')?.value||'#ffffff';
  let tileW=+gid('mosaicTileW')?.value||0, tileH=+gid('mosaicTileH')?.value||0;
  if(!tileW) tileW=Math.min(2400,Math.max(...frames.map(f=>f.visibleW)));
  if(!tileH) tileH=Math.min(1800,Math.max(...frames.map(f=>f.visibleH)));
  const rows=Math.ceil(frames.length/cols), maxPixels=32000000;
  let outW=cols*tileW+(cols+1)*gap, outH=rows*tileH+(rows+1)*gap;
  if(outW*outH>maxPixels){const s=Math.sqrt(maxPixels/(outW*outH)); tileW=Math.floor(tileW*s); tileH=Math.floor(tileH*s); outW=cols*tileW+(cols+1)*gap; outH=rows*tileH+(rows+1)*gap}
  const cv=document.createElement('canvas'); cv.width=outW; cv.height=outH;
  const ctx=cv.getContext('2d'); ctx.fillStyle=bg; ctx.fillRect(0,0,cv.width,cv.height);
  for(let i=0;i<frames.length;i++){
    const f=frames[i], col=i%cols,row=Math.floor(i/cols), x=gap+col*(tileW+gap), y=gap+row*(tileH+gap);
    drawImageCover(ctx,f.img,f.crop,x,y,tileW,tileH,rounded);
  }
  const src=cv.toDataURL('image/png'), maxW=560, dispW=Math.min(maxW,cv.width), dispH=Math.round(dispW*(cv.height/cv.width));
  addObj(makeObj('image',120,120,dispW,dispH,{src,naturalW:cv.width,naturalH:cv.height,fill:'none',stroke:'none',strokeWidth:0,mosaicSourceIds:frames.map(f=>f.o.id)}));
  gid('mosaicDialog')?.close();
  setStatus('High-resolution mosaic inserted.','success');
}
gid('openMosaicDialogBtn')?.addEventListener('click',()=>gid('mosaicDialog')?.showModal());
gid('mosaicCreateBtn')?.addEventListener('click',createMosaicFromSelection);
gid('mosaicCancelBtn')?.addEventListener('click',()=>gid('mosaicDialog')?.close());

function collageSlots(layout,w,h,margin,bannerH,gap){
  const top=margin+bannerH+gap, bodyH=h-top-margin;
  if(layout==='two') return [{x:margin,y:top,w:(w-margin*2-gap)/2,h:bodyH},{x:margin+(w-margin*2-gap)/2+gap,y:top,w:(w-margin*2-gap)/2,h:bodyH}];
  if(layout==='feature') return [{x:margin,y:top,w:(w-margin*2-gap)*0.58,h:bodyH},{x:margin+(w-margin*2-gap)*0.58+gap,y:top,w:(w-margin*2-gap)*0.42,h:(bodyH-gap)/2},{x:margin+(w-margin*2-gap)*0.58+gap,y:top+(bodyH-gap)/2+gap,w:(w-margin*2-gap)*0.42,h:(bodyH-gap)/2}];
  if(layout==='strip') return [0,1,2].map(i=>({x:margin+i*((w-margin*2-gap*2)/3+gap),y:top,w:(w-margin*2-gap*2)/3,h:bodyH}));
  const cw=(w-margin*2-gap)/2, ch=(bodyH-gap)/2;
  return [{x:margin,y:top,w:cw,h:ch},{x:margin+cw+gap,y:top,w:cw,h:ch},{x:margin,y:top+ch+gap,w:cw,h:ch},{x:margin+cw+gap,y:top+ch+gap,w:cw,h:ch}];
}
async function createCollageFromSelection(){
  const frames=await loadSelectedImageFrames();
  if(frames.length<2) return setStatus('Select two or more images first.','danger');
  const layout=gid('collageLayout')?.value||'grid4', title=(gid('collageTitle')?.value||'').trim(), banner=(gid('collageBanner')?.value||'').trim(), bg=gid('collageBg')?.value||'#ffffff', accent=gid('collageAccent')?.value||'#123c69';
  const w=2400,h=1600,margin=96,gap=44,bannerH=title||banner?220:92,slots=collageSlots(layout,w,h,margin,bannerH,gap);
  const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
  const ctx=cv.getContext('2d'); ctx.fillStyle=bg; ctx.fillRect(0,0,w,h);
  ctx.fillStyle=accent; roundRectPath(ctx,margin,margin,w-margin*2,bannerH-24,28); ctx.fill();
  ctx.fillStyle='#ffffff'; ctx.textAlign='center'; ctx.textBaseline='middle';
  if(title){ctx.font='800 76px Arial, sans-serif'; ctx.fillText(title,w/2,margin+74)}
  if(banner){ctx.font='500 42px Arial, sans-serif'; ctx.fillText(banner,w/2,margin+(title?152:94))}
  slots.forEach(s=>{ctx.fillStyle='#f8fafc'; roundRectPath(ctx,s.x,s.y,s.w,s.h,24); ctx.fill()});
  for(let i=0;i<slots.length;i++){
    const f=frames[i%frames.length], s=slots[i];
    drawImageCover(ctx,f.img,f.crop,s.x,s.y,s.w,s.h,24);
  }
  const src=cv.toDataURL('image/png'), dispW=560, dispH=Math.round(dispW*(h/w));
  addObj(makeObj('image',120,120,dispW,dispH,{src,naturalW:w,naturalH:h,fill:'none',stroke:'none',strokeWidth:0,collageLayout:layout,collageSourceIds:frames.map(f=>f.o.id)}));
  gid('collageDialog')?.close();
  setStatus('Collage inserted.','success');
}
gid('openCollageDialogBtn')?.addEventListener('click',()=>gid('collageDialog')?.showModal());
gid('collageCreateBtn')?.addEventListener('click',createCollageFromSelection);
gid('collageCancelBtn')?.addEventListener('click',()=>gid('collageDialog')?.close());

function dotPictureDots(tpl,x0=100,y0=100,step=26){
  const dots=[], rows=tpl.rows||[], maxCols=Math.max(...rows.map(r=>r.length));
  rows.forEach((row,ri)=>[...row].forEach((ch,ci)=>{
    if(ch==='.') return;
    const fill=ch==='O'?'#ffffff':(ch==='S'?'#86efac':(ch==='L'?'#22c55e':'#ffffff'));
    dots.push({x:x0+(ci-(maxCols-1)/2)*step,y:y0+ri*step,fill});
  }));
  return dots;
}
function dotPreviewSvg(tpl){
  const dots=dotPictureDots(tpl,45,12,10), maxY=Math.max(...dots.map(d=>d.y),70);
  return `<svg viewBox="0 0 90 ${Math.max(70,maxY+12)}" aria-hidden="true" focusable="false">${dots.map(d=>`<circle cx="${d.x}" cy="${d.y}" r="4" fill="${d.fill==='#ffffff'?tpl.color:d.fill}" stroke="#374151" stroke-width="1"/>`).join('')}</svg>`;
}
function buildDotPictureUI(){
  const sel=gid('dotPictureSelect');
  if(sel) sel.innerHTML=DOT_PICTURES.map(s=>`<option value="${s.id}">${s.label}</option>`).join('');
  const grid=gid('dotPictureGrid');
  if(grid){grid.innerHTML=DOT_PICTURES.map(s=>`<button class="dot-picture-tile" data-dot-picture="${esc(s.id)}" aria-label="${esc(s.label)}">${dotPreviewSvg(s)}<span>${esc(s.label)}</span></button>`).join(''); grid.querySelectorAll('[data-dot-picture]').forEach(btn=>btn.onclick=()=>{if(sel) sel.value=btn.dataset.dotPicture; insertDotPicture(btn.dataset.dotPicture); gid('dotPictureDialog').close()})}
}
function insertDotPicture(idv){
  const tpl=DOT_PICTURES.find(x=>x.id===idv)||DOT_PICTURES[0], groupId='dotpic_'+id(), dots=dotPictureDots(tpl,180,120,26);
  const objects=dots.map(d=>makeObj('dot',d.x-10,d.y-10,20,20,{groupId,dotPictureId:tpl.id,dotPictureLabel:tpl.label,fill:d.fill,dotDefaultFill:d.fill,stroke:'#374151',strokeWidth:2,opacity:1,fillPattern:''}));
  panel().objects.push(...objects);
  selectedIds=objects.map(o=>o.id);
  render();
  saveState();
  setTool('dotpaint');
  setStatus(tpl.label+' dot picture inserted. Choose a color, then click dots to color them.','success');
}
function selectedDotPictureDots(){
  const dots=selectedIds.map(findObj).filter(o=>o&&o.type==='dot');
  const groupIds=[...new Set(dots.map(o=>o.groupId).filter(Boolean))];
  if(groupIds.length) return panel().objects.filter(o=>o.type==='dot'&&groupIds.includes(o.groupId)&&canEditObject(o));
  return dots.filter(canEditObject);
}
function resetSelectedDotPicture(){
  const dots=selectedDotPictureDots();
  if(!dots.length) return setStatus('Select a dot picture or one of its dots first.','danger');
  dots.forEach(o=>{o.fill=o.dotDefaultFill||'#ffffff'; o.fillPattern=''});
  selectedIds=dots.map(o=>o.id);
  render();
  saveState();
  setStatus('Dot picture colors reset.','success');
}
gid('openDotPictureLibraryBtn')?.addEventListener('click',()=>gid('dotPictureDialog')?.showModal());
gid('dotPictureToolBtn')?.addEventListener('click',()=>gid('dotPictureDialog')?.showModal());
gid('insertDotPictureBtn')?.addEventListener('click',()=>insertDotPicture(gid('dotPictureSelect')?.value));
gid('activateDotPaintBtn')?.addEventListener('click',()=>setTool('dotpaint'));
gid('resetDotPictureBtn')?.addEventListener('click',resetSelectedDotPicture);
gid('closeDotPictureDialog')?.addEventListener('click',()=>gid('dotPictureDialog')?.close());
buildDotPaintInlinePalette();
buildDotPictureUI();

const IMAGE_GALLERY_CATALOG=[
  ['Smithsonian Open Access Animals',[
    ['smithsonian-clouded-leopard-cub','Clouded leopard cub','./assets/smithsonian-animals/clouded-leopard-cub.jpg'],
    ['smithsonian-african-lion-cub','African lion cub','./assets/smithsonian-animals/african-lion-cub.jpg'],
    ['smithsonian-asian-elephant','Asian elephant','./assets/smithsonian-animals/asian-elephant.jpg'],
    ['smithsonian-cheetah','Cheetah','./assets/smithsonian-animals/cheetah.jpg'],
    ['smithsonian-california-sea-lion','California sea lion','./assets/smithsonian-animals/california-sea-lion.jpg'],
    ['smithsonian-alpaca','Alpaca','./assets/smithsonian-animals/alpaca.jpg'],
    ['smithsonian-giant-panda','Giant panda','./assets/smithsonian-animals/giant-panda.jpg'],
    ['smithsonian-grevys-zebra',"Grevy's zebra",'./assets/smithsonian-animals/grevys-zebra.jpg'],
    ['smithsonian-elds-deer',"Eld's deer",'./assets/smithsonian-animals/elds-deer.jpg'],
    ['smithsonian-fennec-fox','Fennec fox','./assets/smithsonian-animals/fennec-fox.jpg']
  ]]
];
function imageGalleryGroupHtml(group,items){
  return `<section class="image-gallery-group"><h3>${esc(group)}</h3><div class="image-gallery-grid">${items.map(item=>{
    const [idv,label,src,paths,kind]=item;
    const pathList=(paths&&paths.length?paths:[src]).filter(Boolean);
    return `<button class="image-gallery-tile" type="button" data-gallery-src="${esc(src)}" data-gallery-paths="${esc(pathList.join('|'))}" data-gallery-label="${esc(label)}" data-gallery-kind="${esc(kind||'image')}" data-coloring-id="${esc(kind==='coloring-book'?idv:'')}" aria-label="${esc(label)}"><img src="${esc(src)}" alt="" loading="lazy" data-path-index="0"><span>${esc(label)}</span></button>`;
  }).join('')}</div></section>`;
}
async function scratchArtGalleryItems(){
  const images=await loadScratchArtImages();
  return images.map((src,i)=>{
    const match=String(src).match(/scratch_bkgrnd(\d+)/i);
    const n=match?match[1]:(i+1);
    return ['scratch-art-'+n,'ScratchArt Background '+n,src];
  });
}
function coloringBookGalleryItems(){
  return coloringBookItems().map(item=>[item.id,item.label,item.path,item.paths,'coloring-book']);
}
function openImageUpload(){
  gid('imageInput')?.click();
}
function ensureImageSourceDialog(){
  if(gid('imageSourceDialog')) return;
  const dlg=document.createElement('dialog');
  dlg.id='imageSourceDialog';
  dlg.className='image-source-dialog';
  dlg.innerHTML=`<div class="modal-head"><h2>Load Image</h2><button class="close" id="imageSourceCancelBtn" aria-label="Close">Close</button></div><div class="image-source-actions"><button id="imageSourceUploadBtn" type="button"><strong>Upload from device</strong><span>Use PNG, JPG, WEBP, GIF, PDF, PPTX, or ODP.</span></button><button id="imageSourceGalleryBtn" type="button"><strong>Image gallery</strong><span>Choose a built-in classroom image.</span></button></div>`;
  document.body.appendChild(dlg);
  gid('imageSourceUploadBtn')?.addEventListener('click',()=>{dlg.close(); openImageUpload()});
  gid('imageSourceGalleryBtn')?.addEventListener('click',()=>{dlg.close(); openImageGalleryDialog()});
  gid('imageSourceCancelBtn')?.addEventListener('click',()=>dlg.close());
}
function openImageSourceDialog(){
  ensureImageSourceDialog();
  gid('imageSourceDialog')?.showModal();
}
function openBackgroundUpload(){
  gid('bgImageInput')?.click();
}
function ensureBackgroundSourceDialog(){
  if(gid('backgroundSourceDialog')) return;
  const dlg=document.createElement('dialog');
  dlg.id='backgroundSourceDialog';
  dlg.className='image-source-dialog';
  dlg.innerHTML=`<div class="modal-head"><h2>Set Background</h2><button class="close" id="backgroundSourceCancelBtn" aria-label="Close">Close</button></div><div class="image-source-actions"><button id="backgroundSourceUploadBtn" type="button"><strong>Upload from device</strong><span>Use PNG, JPG, WEBP, PDF, PPTX, or ODP.</span></button><button id="backgroundSourceGalleryBtn" type="button"><strong>Image gallery</strong><span>Choose a built-in image as the panel background.</span></button></div>`;
  document.body.appendChild(dlg);
  gid('backgroundSourceUploadBtn')?.addEventListener('click',()=>{dlg.close(); openBackgroundUpload()});
  gid('backgroundSourceGalleryBtn')?.addEventListener('click',()=>{dlg.close(); openImageGalleryDialog('background')});
  gid('backgroundSourceCancelBtn')?.addEventListener('click',()=>dlg.close());
}
function openBackgroundSourceDialog(){
  ensureBackgroundSourceDialog();
  gid('backgroundSourceDialog')?.showModal();
}
async function ensureImageGalleryDialog(){
  let dlg=gid('imageGalleryDialog');
  if(!dlg){
    dlg=document.createElement('dialog');
    dlg.id='imageGalleryDialog';
    dlg.className='image-gallery-dialog';
    document.body.appendChild(dlg);
    dlg.addEventListener('click',e=>{
      const tile=e.target.closest('.image-gallery-tile');
      if(!tile) return;
      if(imageGalleryMode==='background'){
        setBackgroundFromGalleryTile(tile);
        return;
      }
      if(tile.dataset.galleryKind==='coloring-book'&&tile.dataset.coloringId){
        insertColoringBookPage(tile.dataset.coloringId);
        return;
      }
      insertGalleryImage(tile.dataset.gallerySrc,tile.dataset.galleryLabel||'Gallery image');
    });
  }
  let scratchItems=[];
  try{scratchItems=await scratchArtGalleryItems()}catch(_){}
  const coloringItems=coloringBookGalleryItems();
  const catalog=[...(scratchItems.length?[['ScratchArt Backgrounds',scratchItems]]:[]),...(coloringItems.length?[['Coloring Book Pages',coloringItems]]:[]),...IMAGE_GALLERY_CATALOG];
  const groups=catalog.map(([group,items])=>imageGalleryGroupHtml(group,items)).join('');
  const backgroundMode=imageGalleryMode==='background';
  dlg.innerHTML=`<div class="modal-head"><h2>${backgroundMode?'Set Background from Gallery':'Image Gallery'}</h2><button class="close" id="imageGalleryCancelBtn" aria-label="Close">Close</button></div><p class="confirm-msg">${backgroundMode?'Choose an image to use as the current panel background.':'Choose an image to place it on the board.'} ScratchArt backgrounds, coloring book pages, and Smithsonian Open Access animal photos are included locally.</p>${groups}`;
  gid('imageGalleryCancelBtn')?.addEventListener('click',()=>dlg.close());
  dlg.querySelectorAll('.image-gallery-tile img').forEach(img=>img.addEventListener('error',()=>{
    const tile=img.closest('[data-gallery-paths]'), paths=(tile?.dataset.galleryPaths||'').split('|').filter(Boolean);
    const next=(+img.dataset.pathIndex||0)+1;
    if(next<paths.length){img.dataset.pathIndex=String(next); img.src=paths[next]}
  }));
}
async function openImageGalleryDialog(mode='insert'){
  imageGalleryMode=mode||'insert';
  await ensureImageGalleryDialog();
  gid('imageGalleryDialog')?.showModal();
}
gid('imageBtn').onclick=openImageSourceDialog;
function batchImagePosition(index,w,h){
  const cols=3, gap=28, startX=80, startY=80, col=index%cols, row=Math.floor(index/cols);
  return {x:startX+col*(Math.min(w,220)+gap), y:startY+row*(Math.min(h,170)+gap)};
}
const PENDING_IMAGE_PLACEHOLDER='data:image/svg+xml;base64,'+btoa('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="180" viewBox="0 0 240 180"><rect width="240" height="180" rx="12" fill="#fef3c7" stroke="#d97706" stroke-width="2"/><circle cx="120" cy="78" r="22" fill="none" stroke="#d97706" stroke-width="3"/><path d="M120 64 V78 L132 86" stroke="#d97706" stroke-width="3" stroke-linecap="round" fill="none"/><text x="120" y="128" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="13" font-weight="600" fill="#92400e">Pending teacher approval</text><text x="120" y="148" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="11" fill="#92400e">Image appears once approved.</text></svg>');
const REJECTED_IMAGE_PLACEHOLDER='data:image/svg+xml;base64,'+btoa('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="180" viewBox="0 0 240 180"><rect width="240" height="180" rx="12" fill="#fee2e2" stroke="#b91c1c" stroke-width="2"/><circle cx="120" cy="78" r="22" fill="none" stroke="#b91c1c" stroke-width="3"/><path d="M104 62 L136 94 M136 62 L104 94" stroke="#b91c1c" stroke-width="3" stroke-linecap="round" fill="none"/><text x="120" y="128" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="13" font-weight="600" fill="#7f1d1d">Image rejected</text><text x="120" y="148" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="11" fill="#7f1d1d">Ask your teacher for details.</text></svg>');

function imageNeedsModeration(){return !!(board&&board.mode==='student'&&googleScriptUrl())}
async function submitImageForApproval(dataUrl,fileName){
  const url=googleScriptUrl();
  if(!url) return {approved:true,dataUrl,imageId:''};
  try{
    const res=await fetch(url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({
      action:'uploadImage',
      dataUrl,
      fileName:fileName||'image.png',
      boardId:(board&&board.boardId)||'',
      roomId:(typeof collabRoom!=='undefined'&&collabRoom)||'',
      uploadedBy:(board&&board.studentName)||'',
      uploaderRole:(board&&board.mode==='student')?'student':'teacher'
    })});
    const out=await res.json();
    if(!out.ok){setStatus(out.error||'Image upload blocked by safety filter.','danger'); return {approved:false,blocked:true};}
    if(out.status==='approved') return {approved:true,dataUrl:out.src||dataUrl,imageId:out.id||''};
    setStatus('Image sent to teacher for approval.','success');
    return {approved:false,pending:true,imageId:out.id,dataUrl:PENDING_IMAGE_PLACEHOLDER};
  }catch(err){setStatus('Image upload failed: '+err.message,'danger'); return {approved:false,blocked:true};}
}
let _pendingImagePoller=null;
function listPendingImageObjects(){
  const out=[];
  (board&&board.panels?board.panels:[]).forEach(p=>(p.objects||[]).forEach(o=>{if(o&&o.pendingImageId) out.push(o)}));
  return out;
}
function setObjectImageSrc(o,src){
  if(!o) return;
  if(o.type==='image') o.src=src;
  else if(o.type==='sticky') o.imageSrc=src;
  else if(o.type==='stamp') o.stampSrc=src;
}
async function pollPendingImages(){
  const url=googleScriptUrl(); if(!url){if(_pendingImagePoller){clearInterval(_pendingImagePoller); _pendingImagePoller=null} return}
  const pending=listPendingImageObjects();
  if(!pending.length){if(_pendingImagePoller){clearInterval(_pendingImagePoller); _pendingImagePoller=null} return}
  let changed=false;
  for(const o of pending){
    try{
      const res=await fetch(url+'?action=imageQueueResolve&id='+encodeURIComponent(o.pendingImageId));
      const out=await res.json();
      if(!out.ok) continue;
      if(out.status==='approved'&&out.src){setObjectImageSrc(o,out.src); delete o.pendingImageId; changed=true}
      else if(out.status==='rejected'){setObjectImageSrc(o,REJECTED_IMAGE_PLACEHOLDER); delete o.pendingImageId; changed=true}
    }catch(err){}
  }
  if(changed){render(); saveState(false)}
}
function ensurePendingImagePoller(){
  if(_pendingImagePoller) return;
  if(!listPendingImageObjects().length) return;
  _pendingImagePoller=setInterval(pollPendingImages,8000);
  setTimeout(pollPendingImages,1500);
}
async function addImageDataUrlToBoard(src,offset=0,batch=false,opts={}){
  const meta=await transparentContentCrop(src);
  let naturalW=meta.naturalW||0,naturalH=meta.naturalH||0,w=320,h=220;
  if(naturalW&&naturalH){const visibleW=meta.crop?meta.crop.w*naturalW:naturalW, visibleH=meta.crop?meta.crop.h*naturalH:naturalH; const s=Math.min(1,480/Math.max(visibleW,visibleH)); w=Math.max(40,Math.round(visibleW*s)); h=Math.max(40,Math.round(visibleH*s))}
  const pos=batch?batchImagePosition(offset,w,h):{x:80+offset*28,y:80+offset*28};
  const extra=opts&&opts.pendingImageId?{pendingImageId:opts.pendingImageId}:{};
  panel().objects.push(makeObj('image',pos.x,pos.y,w,h,{src,fill:'none',stroke:'#000',strokeWidth:1,naturalW,naturalH,...(meta.crop?{crop:meta.crop}: {}),...extra}));
  return true;
}
function addImageFileToBoard(f,offset=0,batch=false){
  return new Promise(resolve=>{
    const r=new FileReader();
    r.onload=async()=>{
      let src=r.result, pendingImageId='';
      if(imageNeedsModeration()){
        const m=await submitImageForApproval(src,f.name||'image.png');
        if(m.blocked){resolve(false); return}
        src=m.dataUrl; pendingImageId=m.imageId||'';
      }
      const ok=await addImageDataUrlToBoard(src,offset,batch,{pendingImageId});
      if(pendingImageId) ensurePendingImagePoller();
      resolve(ok);
    };
    r.onerror=()=>resolve(false);
    r.readAsDataURL(f);
  });
}
async function imageUrlToDataUrl(src){
  const res=await fetch(src);
  if(!res.ok) throw new Error('Could not load gallery image.');
  const blob=await res.blob();
  return await new Promise((resolve,reject)=>{const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=()=>reject(new Error('Could not read gallery image.')); r.readAsDataURL(blob)});
}
async function insertGalleryImage(src,label){
  if(!src) return;
  const dlg=gid('imageGalleryDialog');
  try{
    setStatus('Loading gallery image...','success');
    const dataUrl=await imageUrlToDataUrl(src);
    const before=panel().objects.length;
    if(await addImageDataUrlToBoard(dataUrl,0,false)){
      const obj=panel().objects[panel().objects.length-1];
      selectedIds=obj?[obj.id]:[];
      render();
      saveState();
      setStatus((label||'Gallery image')+' added.','success');
      dlg?.close();
    }else if(panel().objects.length===before){
      setStatus('Gallery image could not be added.','danger');
    }
  }catch(err){
    setStatus((err&&err.message)||'Gallery image could not be loaded.','danger');
  }
}
async function galleryTileSource(tile){
  const paths=(tile?.dataset.galleryPaths||tile?.dataset.gallerySrc||'').split('|').filter(Boolean);
  for(const src of paths){
    try{
      const dataUrl=await imageUrlToDataUrl(src);
      return {src,dataUrl};
    }catch(_){}
  }
  throw new Error('Gallery image could not be loaded.');
}
async function setBackgroundFromGalleryTile(tile){
  if(board.mode==='student') return setStatus('Students cannot change the panel background.','danger');
  try{
    setStatus('Loading gallery background...','success');
    const {dataUrl}=await galleryTileSource(tile);
    const p=panel();
    p.bg='blank';
    p.bgImage=dataUrl;
    p.canvasFill=null;
    clearSelection();
    render();
    saveState();
    gid('imageGalleryDialog')?.close();
    setStatus((tile.dataset.galleryLabel||'Gallery image')+' set as background.','success');
  }catch(err){
    setStatus((err&&err.message)||'Gallery background could not be loaded.','danger');
  }
}
gid('imageInput').onchange=async e=>{
  const files=[...e.target.files]; if(!files.length)return;
  if(files.length===1){const importFmt=(typeof detectPanelImportFormat==='function')?detectPanelImportFormat(files[0]):null; if(importFmt){ e.target.value=''; await importPanelsFromFile(files[0]); return }}
  const added=[];
  for(const f of files){if(!(await validateImageDeep(f))) continue; if(await addImageFileToBoard(f,added.length,files.length>1)) added.push(f)}
  if(added.length){selectedIds=panel().objects.slice(-added.length).map(o=>o.id); render(); saveState(); setStatus('Added '+added.length+' image'+(added.length===1?'':'s')+'.','success')}
  e.target.value='';
};
gid('stickyImageInput').onchange=async e=>{const f=e.target.files[0], o=currentObj(); if(!f||!o||o.type!=='sticky') return; if(!(await validateImageDeep(f))){e.target.value='';return} const r=new FileReader(); r.onload=async()=>{let src=r.result, pendingImageId=''; if(imageNeedsModeration()){const m=await submitImageForApproval(src,f.name||'sticky.png'); if(m.blocked){e.target.value=''; return} src=m.dataUrl; pendingImageId=m.imageId||''} o.imageSrc=src; if(pendingImageId){o.pendingImageId=pendingImageId; ensurePendingImagePoller()}else if(o.pendingImageId) delete o.pendingImageId; render(); saveState()}; r.readAsDataURL(f); e.target.value=''};
gid('customStickerInput').onchange=async e=>{const f=e.target.files[0]; if(!f) return; if(!(await validateImageDeep(f))){e.target.value='';return} const r=new FileReader(); r.onload=async()=>{let src=r.result, pendingImageId=''; if(imageNeedsModeration()){const m=await submitImageForApproval(src,f.name||'sticker.png'); if(m.blocked){e.target.value=''; return} src=m.dataUrl; pendingImageId=m.imageId||''} const obj=makeObj('stamp',90,90,104,104,{stampLabel:(f.name||'Sticker').replace(/\.[^.]+$/,''),stampBg:'#ffffff',stampSrc:src,fill:'none',stroke:'none',strokeWidth:0}); if(pendingImageId) obj.pendingImageId=pendingImageId; addObj(obj); if(pendingImageId) ensurePendingImagePoller()}; r.readAsDataURL(f); e.target.value=''};
gid('audioInput').onchange=e=>{const f=e.target.files[0], o=currentObj(); if(!f||!o||o.type!=='audio') return; if(!validateUpload(f,'audio')){e.target.value='';return} const r=new FileReader(); r.onload=()=>setAudioOnCurrent(r.result,f.name||'Audio file'); r.readAsDataURL(f); e.target.value=''};
function compressImageForBg(file,maxDim=1600,quality=0.85){return new Promise((resolve,reject)=>{const fr=new FileReader(); fr.onload=()=>{const img=new Image(); img.onload=()=>{const scale=Math.min(1,maxDim/Math.max(img.width,img.height)); const w=Math.max(1,Math.round(img.width*scale)), h=Math.max(1,Math.round(img.height*scale)); const cv=document.createElement('canvas'); cv.width=w; cv.height=h; const cx=cv.getContext('2d'); cx.drawImage(img,0,0,w,h); resolve(cv.toDataURL('image/jpeg',quality))}; img.onerror=()=>reject(new Error('decode failed')); img.src=fr.result}; fr.onerror=()=>reject(new Error('read failed')); fr.readAsDataURL(file)})}
function transparentContentCrop(dataUrl){return new Promise(resolve=>{const img=new Image(); img.onload=()=>{try{const w=img.width,h=img.height;if(!w||!h||w*h>12000000)return resolve({naturalW:w,naturalH:h});const cv=document.createElement('canvas');cv.width=w;cv.height=h;const cx=cv.getContext('2d',{willReadFrequently:true});cx.drawImage(img,0,0);const px=cx.getImageData(0,0,w,h).data;let minX=w,minY=h,maxX=-1,maxY=-1,hasAlpha=false;for(let y=0;y<h;y++){for(let x=0;x<w;x++){const a=px[(y*w+x)*4+3];if(a<250)hasAlpha=true;if(a>12){if(x<minX)minX=x;if(y<minY)minY=y;if(x>maxX)maxX=x;if(y>maxY)maxY=y}}}if(!hasAlpha||maxX<0)return resolve({naturalW:w,naturalH:h});const pad=Math.max(2,Math.round(Math.min(w,h)*0.01));minX=Math.max(0,minX-pad);minY=Math.max(0,minY-pad);maxX=Math.min(w-1,maxX+pad);maxY=Math.min(h-1,maxY+pad);const cropW=maxX-minX+1,cropH=maxY-minY+1;if(cropW>w*0.96&&cropH>h*0.96)return resolve({naturalW:w,naturalH:h});resolve({naturalW:w,naturalH:h,crop:{x:minX/w,y:minY/h,w:cropW/w,h:cropH/h}})}catch(_){resolve({naturalW:img.width||0,naturalH:img.height||0})}};img.onerror=()=>resolve({});img.src=dataUrl})}
function removeColorFromImage(dataUrl,hexColor,tolerance=40){return new Promise((resolve,reject)=>{const img=new Image(); img.onload=()=>{try{const cv=document.createElement('canvas'); cv.width=img.width; cv.height=img.height; const cx=cv.getContext('2d'); cx.drawImage(img,0,0); const data=cx.getImageData(0,0,cv.width,cv.height); const p=data.data; const tR=parseInt(hexColor.slice(1,3),16),tG=parseInt(hexColor.slice(3,5),16),tB=parseInt(hexColor.slice(5,7),16); const tol2=tolerance*tolerance*3; for(let i=0;i<p.length;i+=4){const dr=p[i]-tR,dg=p[i+1]-tG,db=p[i+2]-tB; if(dr*dr+dg*dg+db*db<=tol2) p[i+3]=0} cx.putImageData(data,0,0); resolve(cv.toDataURL('image/png'))}catch(err){reject(err)}}; img.onerror=()=>reject(new Error('decode failed')); img.src=dataUrl})}
function sampleCornerColor(dataUrl){return new Promise((resolve,reject)=>{const img=new Image(); img.onload=()=>{try{const cv=document.createElement('canvas'); cv.width=img.width; cv.height=img.height; const cx=cv.getContext('2d'); cx.drawImage(img,0,0); const px=cx.getImageData(0,0,1,1).data; resolve('#'+[px[0],px[1],px[2]].map(v=>v.toString(16).padStart(2,'0')).join(''))}catch(err){reject(err)}}; img.onerror=()=>reject(new Error('decode failed')); img.src=dataUrl})}
gid('loadBgImageBtn').onclick=openBackgroundSourceDialog;
gid('clearBgImageBtn').onclick=()=>{const p=panel(); if(!p.bgImage&&!p.canvasFill) return; p.bgImage=''; p.canvasFill=null; render(); saveState(); setStatus('Background cleared.','success')};
gid('bgImageInput').onchange=async e=>{const f=e.target.files[0], scratchColor=pendingScratchCoverColor; pendingScratchCoverColor=null; if(!f) return; const importFmt=(typeof detectPanelImportFormat==='function')?detectPanelImportFormat(f):null; if(importFmt){ e.target.value=''; await importPanelsFromFile(f); return } if(!(await validateImageDeep(f))){e.target.value=''; return} try{const data=await compressImageForBg(f); panel().bgImage=data; render(); saveState(); if(scratchColor){await addScratchCover(scratchColor)}else setStatus('Background image set.','success')}catch(err){setStatus('Background image failed. '+err.message,'danger')} e.target.value=''};
gid('removeBgColorBtn')?.addEventListener('click',async()=>{const sel=selectedIds.length===1?currentObj():null; const isImage=sel&&sel.type==='image'&&sel.src; const p=panel(); const sourceUrl=isImage?sel.src:p.bgImage; if(!sourceUrl){setStatus(isImage?'Selected image has no source.':'Select an image or set a panel background first.','danger'); return} try{const corner=await sampleCornerColor(sourceUrl); gid('bgRemoveColorInput').value=corner; const tolEl=gid('bgRemoveTolerance'); if(tolEl) gid('bgRemoveToleranceValue').textContent=tolEl.value; const dlg=gid('bgRemoveDialog'); const titleEl=dlg.querySelector('h2'); const msgEl=dlg.querySelector('.confirm-msg'); if(titleEl) titleEl.textContent=isImage?'Remove Color from Image':'Remove Background Color'; if(msgEl) msgEl.textContent=isImage?'Pick the color in the selected image to make transparent. The starting color is sampled from the top-left corner of the image.':'Pick the color in the panel background to make transparent. The starting color is sampled from the top-left corner.'; dlg.dataset.target=isImage?'image':'bg'; dlg.dataset.objectId=isImage?sel.id:''; dlg.showModal()}catch(err){setStatus('Could not read image. '+err.message,'danger')}});
gid('simpleRemoveBgColorBtn')?.addEventListener('click',()=>gid('removeBgColorBtn').click());
gid('bgRemoveTolerance')?.addEventListener('input',e=>{const v=gid('bgRemoveToleranceValue'); if(v) v.textContent=e.target.value});
gid('bgRemoveCancel')?.addEventListener('click',()=>gid('bgRemoveDialog').close());
gid('bgRemoveApply')?.addEventListener('click',async()=>{const target=gid('bgRemoveColorInput').value; const tol=+gid('bgRemoveTolerance').value; const dlg=gid('bgRemoveDialog'); const targetType=dlg.dataset.target||'bg'; const objectId=dlg.dataset.objectId||''; dlg.close(); if(targetType==='image'&&objectId){const obj=findObj(objectId); if(!obj||!obj.src){setStatus('Image no longer available.','danger'); return} setStatus('Removing color…','success'); try{const newUrl=await removeColorFromImage(obj.src,target,tol); obj.src=newUrl; render(); saveState(); setStatus('Image color removed.','success')}catch(err){setStatus('Failed to remove color. '+err.message,'danger')}} else {const p=panel(); if(!p.bgImage) return; setStatus('Removing color…','success'); try{const newUrl=await removeColorFromImage(p.bgImage,target,tol); p.bgImage=newUrl; render(); saveState(); setStatus('Background color removed.','success')}catch(err){setStatus('Failed to remove color. '+err.message,'danger')}}});

gid('inlineTextSaveBtn').onclick=()=>commitInlineTextEditor(true);
gid('inlineTextCancelBtn').onclick=()=>commitInlineTextEditor(false);
gid('inlineTextEditor').addEventListener('input',()=>updateInlineTextObject(true));
gid('inlineTextEditor').addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault(); commitInlineTextEditor(true)} if(e.key==='Escape'){e.preventDefault(); commitInlineTextEditor(false)}});
gid('inlineTextEditor').addEventListener('blur',()=>{if(inlineEditId) commitInlineTextEditor(true)});

if(ui.workspaceMode){ui.workspaceMode.value=localStorage.getItem('drawsplat.workspaceMode')||'productivity'; ui.workspaceMode.addEventListener('change',()=>applyWorkspaceMode(ui.workspaceMode.value))}
if(ui.interfaceMode){ui.interfaceMode.value=localStorage.getItem('drawsplat.interfaceMode')||'simple'; ui.interfaceMode.addEventListener('change',()=>{applyInterfaceMode(ui.interfaceMode.value); refreshViewToggle()})}

gid('deleteBtn').onclick=deleteSelected;
gid('duplicateBtn').onclick=duplicateSelected;
gid('alignLeftBtn')&&(gid('alignLeftBtn').onclick=()=>alignSelectedObjects('left'));
gid('alignCenterHBtn')&&(gid('alignCenterHBtn').onclick=()=>alignSelectedObjects('centerH'));
gid('alignRightBtn')&&(gid('alignRightBtn').onclick=()=>alignSelectedObjects('right'));
gid('alignTopBtn')&&(gid('alignTopBtn').onclick=()=>alignSelectedObjects('top'));
gid('alignMiddleVBtn')&&(gid('alignMiddleVBtn').onclick=()=>alignSelectedObjects('middleV'));
gid('alignBottomBtn')&&(gid('alignBottomBtn').onclick=()=>alignSelectedObjects('bottom'));
gid('groupBtn').onclick=groupSelected;
gid('ungroupBtn').onclick=ungroupSelected;
gid('selectGroupBtn').onclick=selectCurrentGroup;
gid('attachStickyImageBtn').onclick=()=>{const o=currentObj(); if(!o||o.type!=='sticky'){setStatus('Select a sticky note first.','danger'); return} gid('stickyImageInput').click()};
gid('toggleCommentResolvedBtn').onclick=()=>{const o=currentObj(); if(!o||o.type!=='comment'){setStatus('Select a comment pin first.','danger'); return} o.resolved=!o.resolved; render(); saveState()};
gid('recordAudioBtn').onclick=()=>startAudioRecording();
gid('loadAudioBtn').onclick=()=>{const o=currentObj(); if(!o||o.type!=='audio') return setStatus('Select an audio note first.','danger'); gid('audioInput').click()};
gid('playAudioBtn').onclick=()=>playSelectedAudio();
gid('answerKeyBtn').onclick=()=>{const editable=selectedIds.map(idv=>findObj(idv)).filter(o=>o&&canEditObject(o)); if(!editable.length) return setStatus('Select one or more editable objects first.','danger'); const next=!editable.every(o=>o.answerKey); editable.forEach(o=>o.answerKey=next); render(); saveState(); setStatus(next?'Marked as answer key.':'Removed from answer key.','success')};
gid('frontBtn').onclick=()=>{if(!selectedIds.length)return; const sel=panel().objects.filter(o=>selectedIds.includes(o.id)), others=panel().objects.filter(o=>!selectedIds.includes(o.id)); panel().objects=[...others,...sel]; render(); saveState()};
gid('backBtn').onclick=()=>{if(!selectedIds.length)return; const sel=panel().objects.filter(o=>selectedIds.includes(o.id)), others=panel().objects.filter(o=>!selectedIds.includes(o.id)); panel().objects=[...sel,...others]; render(); saveState()};
gid('refreshModerationBtn').onclick=()=>openModerationDashboard();
gid('openModerationBtn').onclick=()=>openModerationDashboard();
gid('closeModerationDialog').onclick=()=>gid('moderationDialog').close();
gid('tntBtn').onclick=()=>runTntReset();
gid('lockBtn').onclick=()=>{selectedIds.forEach(i=>{const o=findObj(i); if(o) o.locked=true}); render(); saveState()};
gid('unlockBtn').onclick=()=>{selectedIds.forEach(i=>{const o=findObj(i); if(o) o.locked=false}); render(); saveState()};
gid('noFillBtn').onclick=()=>{fillEnabled=!fillEnabled; setButtonChrome('noFillBtn',fillEnabled?'No fill':'Use fill')};
gid('createCustomStickerBtn').onclick=()=>gid('customStickerInput').click();

function applyStyleToSelectedObject(o){
  if(!o||o.locked||!canEditObject(o)) return;
  const st=style();
  if(o.type==='connector'){
    o.stroke=st.stroke;
    o.strokeWidth=st.strokeWidth;
    o.opacity=st.opacity;
    o.connectorLabelColor=st.stroke;
    return;
  }
  Object.assign(o,st);
}
['strokeColor','strokeWidth','fillColor','opacity','fillPattern'].forEach(k=>gid(k).addEventListener('input',()=>{if(k==='strokeColor') updateToolColorPaletteActive(ui.strokeColor.value); if(k==='strokeWidth'){const v=+ui.strokeWidth.value||4; if(tool==='pen') penStrokeWidth=v; else if(tool==='eraser') eraserStrokeWidth=v; refreshEraserSizeControls?.(); refreshPenSizeControls?.();} selectedIds.forEach(idv=>applyStyleToSelectedObject(findObj(idv))); const c=currentObj(); if(c&&c.type==='sticky') c.fill=ui.stickyColor.value; render(); saveState()}));
ui.stickyColor.addEventListener('change',()=>{selectedIds.forEach(idv=>{const o=findObj(idv); if(o&&o.type==='sticky') o.fill=ui.stickyColor.value}); syncSimpleStickyPalette(); syncSimpleColor(); render(); saveState()});
ui.fontSize.addEventListener('input',()=>{ui.fontSizeValue.textContent=ui.fontSize.value+'px'; const o=currentObj(); if(o&&TEXTABLE_TYPES.includes(o.type)&&selectedIds.length===1){o.fontSize=+ui.fontSize.value; fitPlainTextBoxToContent(o); render(); saveState()}});
ui.textColor.addEventListener('input',()=>{const o=currentObj(); if(o&&TEXTABLE_TYPES.includes(o.type)&&selectedIds.length===1){o.textColor=ui.textColor.value; render(); saveState()}});
ui.textRotation.addEventListener('input',()=>{ui.textRotationValue.textContent=ui.textRotation.value+'°'; const o=currentObj(); if(o&&TEXTABLE_TYPES.includes(o.type)&&selectedIds.length===1){o.textRotation=+ui.textRotation.value; render(); saveState()}});
ui.autoScaleText.addEventListener('change',()=>{const o=currentObj(); if(o&&TEXTABLE_TYPES.includes(o.type)&&selectedIds.length===1){o.autoScaleText=ui.autoScaleText.checked; saveState()}});

document.querySelectorAll('.editor-toolbar [data-cmd]').forEach(btn=>btn.onclick=()=>{ui.richEditor.focus(); document.execCommand(btn.dataset.cmd,false,null)});
gid('clearFormattingBtn').onclick=()=>{ui.richEditor.focus(); document.execCommand('removeFormat',false,null)};
document.querySelectorAll('[data-axis="h"]').forEach(btn=>btn.onclick=()=>{const o=currentObj(); if(o&&TEXTABLE_TYPES.includes(o.type)&&selectedIds.length===1){o.hAlign=btn.dataset.align; markAlignButtons(); render(); saveState()}});
document.querySelectorAll('[data-axis="v"]').forEach(btn=>btn.onclick=()=>{const o=currentObj(); if(o&&TEXTABLE_TYPES.includes(o.type)&&selectedIds.length===1){o.vAlign=btn.dataset.align; markAlignButtons(); render(); saveState()}});
function markAlignButtons(){const o=currentObj(); document.querySelectorAll('[data-axis="h"]').forEach(btn=>btn.classList.toggle('active',selectedIds.length===1&&o&&o.hAlign===btn.dataset.align)); document.querySelectorAll('[data-axis="v"]').forEach(btn=>btn.classList.toggle('active',selectedIds.length===1&&o&&o.vAlign===btn.dataset.align))}

/* Inspector and board-settings bindings. These functions mirror selected
   object data into the right panel and persist board-level metadata changes. */
function updateInspector(){const info=gid('selectedInfo'), wrap=gid('textEditorWrap'); if(!selectedIds.length){info.textContent='No object selected.'; wrap.hidden=true; setButtonChrome('answerKeyBtn','Toggle Answer Key'); return} if(selectedIds.length>1){info.innerHTML=`<b>${esc(selectedIds.length)} items selected</b><br>${esc('Use group drag, group/ungroup, delete, duplicate, and front/back ordering.')}`; wrap.hidden=true; setButtonChrome('answerKeyBtn','Toggle Answer Key'); return} const o=currentObj(), b=normBox(o); info.innerHTML=`<b>${esc(o.type)}</b><br>${Math.round(b.x)}, ${Math.round(b.y)} · ${Math.round(b.w)} × ${Math.round(b.h)}${o.groupId?' · grouped':''}${o.locked?' · locked':''}${o.layer?' · layer: '+esc(o.layer):''}${o.answerKey?' · answer key':''}${o.audioSrc?' · has audio':''}${o.type==='widget'?`<br><button type="button" id="openSelectedWidgetControlsBtn">Open Controls</button>`:''}`; setInputIfIdle(ui.strokeColor,o.stroke||'#1E398D'); setInputIfIdle(ui.strokeWidth,String(o.strokeWidth||1)); setInputIfIdle(ui.opacity,String(Math.round((o.opacity??1)*100))); if(o.type!=='connector') setInputIfIdle(ui.fillColor,o.fill&&o.fill!=='none'?o.fill:'#ffffff'); if(ui.fillPattern && typeof o.fillPattern!=='undefined') ui.fillPattern.value=o.fillPattern||''; setButtonChrome('answerKeyBtn',o.answerKey?'Remove Answer Key':'Mark Answer Key'); wrap.hidden=!TEXTABLE_TYPES.includes(o.type); if(!wrap.hidden){const ph=o.type==='sticky'?'Add note...':(o.type==='audio'?'Voice note':(o.type==='comment'?'Add feedback...':(o.type==='text'?'Type here':'Type text'))); ui.richEditor.dataset.placeholder=ph; if(document.activeElement!==ui.richEditor){const desired=o.html||''; if(ui.richEditor.innerHTML!==desired) ui.richEditor.innerHTML=desired} refreshRichEditorEmpty(); setInputIfIdle(ui.textColor,o.textColor||'#111827'); setInputIfIdle(ui.fontSize,String(o.fontSize||20)); ui.fontSizeValue.textContent=(o.fontSize||20)+'px'; setInputIfIdle(ui.textRotation,String(o.textRotation||0)); ui.textRotationValue.textContent=(o.textRotation||0)+'°'; ui.autoScaleText.checked=!!o.autoScaleText; markAlignButtons()}}
function refreshRichEditorEmpty(){if(!ui.richEditor) return; const txt=(ui.richEditor.textContent||'').replace(/ /g,' ').trim(); ui.richEditor.dataset.empty=txt===''?'true':'false'}

gid('applyTextBtn').onclick=()=>{const o=currentObj(); if(o&&selectedIds.length===1){o.html=cleanEditorHtml(ui.richEditor.innerHTML); o.text=htmlToPlainText(o.html); o.textColor=ui.textColor.value; o.fontSize=+ui.fontSize.value; o.textRotation=+ui.textRotation.value; o.autoScaleText=ui.autoScaleText.checked; fitPlainTextBoxToContent(o); render(); saveState()}};
ui.richEditor.addEventListener('input',()=>{const o=currentObj(); if(o&&TEXTABLE_TYPES.includes(o.type)&&selectedIds.length===1){o.html=cleanEditorHtml(ui.richEditor.innerHTML); o.text=htmlToPlainText(o.html); fitPlainTextBoxToContent(o); render(); saveState(false)} refreshRichEditorEmpty()});
ui.richEditor.addEventListener('blur',refreshRichEditorEmpty);

ui.boardTitle.oninput=()=>{ if(window.DrawSplatSafety){const r=window.DrawSplatSafety.checkAll(ui.boardTitle.value,'boardTitle'); if(!r.allowed){ui.boardTitle.value=board.title||''; setStatus(r.reason,'danger'); return}} board.title=ui.boardTitle.value; saveState(false)};
ui.className.oninput=()=>{board.className=ui.className.value; saveState(false)};
ui.studentName.oninput=()=>{board.studentName=ui.studentName.value; saveState(false)};
ui.userMode.onchange=()=>{board.mode=ui.userMode.value; if(board.mode==='student'&&!board.assignmentMode) board.showAnswerKey=false; applyModeUI(); saveState(false); render()};
ui.assignmentModeToggle.onchange=()=>{board.assignmentMode=ui.assignmentModeToggle.checked; if(board.assignmentMode && board.currentLayer==='shared') board.currentLayer='teacher'; if(!board.assignmentMode) board.currentLayer='shared'; render(); saveState()};
ui.activeLayerSelect.onchange=()=>{board.currentLayer=ui.activeLayerSelect.value; render(); saveState(false)};
ui.showAnswerKeyToggle.onchange=()=>{board.showAnswerKey=ui.showAnswerKeyToggle.checked; render(); saveState(false)};
function applyModeUI(){enforceRoleLock(); document.querySelectorAll('.teacher-only').forEach(el=>el.classList.toggle('hidden-by-mode',board.mode==='student')); ['bgSelectSimple','clearFrameBtn','frameNavAdd'].forEach(idv=>gid(idv)?.classList.toggle('hidden-by-mode',board.mode==='student')); if(ui.userMode) ui.userMode.disabled=roleLock==='student'; ui.assignmentModeToggle.disabled=board.mode==='student'; ui.activeLayerSelect.disabled=board.mode==='student' || !board.assignmentMode; ui.showAnswerKeyToggle.disabled=(board.mode==='student'); if(board.mode==='student'&&board.assignmentMode) ui.layerBadge.textContent='Layer: Student'}

function addPanel(){if(board.mode==='student'){setStatus('Students cannot add panels to this shared board.','danger'); return false} ensureActivePanel(); resetInteractionState(); const newPanel={id:'panel_'+id(),name:'Panel '+(board.panels.length+1),bg:'grid',objects:[]}; board.panels.push(newPanel); board.active=board.panels.length-1; render(); saveState(); setStatus('Added '+newPanel.name+'.','success'); return true}
gid('addPanelBtn').onclick=addPanel;
gid('frameNavPrev')?.addEventListener('click',()=>{if(board.active>0) switchPanel(board.panels[board.active-1].id)});
gid('frameNavNext')?.addEventListener('click',()=>{if(board.active<board.panels.length-1) switchPanel(board.panels[board.active+1].id)});
gid('frameNavAdd')?.addEventListener('click',addPanel);
gid('floatDeselectBtn')?.addEventListener('click',()=>{clearSelection(); render(); setStatus('Selection cleared.','success')});
gid('clearFrameBtn')?.addEventListener('click',()=>{if(board.mode==='student') return setStatus('Students cannot clear shared panels.','danger'); askConfirm('Clear this frame?',{okLabel:'Clear'}).then(ok=>{if(ok){panel().objects=[]; clearSelection(); render(); saveState(); setStatus('Frame cleared.','success')}})});
gid('bgSelectSimple')?.addEventListener('change',e=>{if(board.mode==='student'){e.target.value=panel().bg||'grid'; return setStatus('Students cannot change the panel background.','danger')} panel().bg=e.target.value; render(); saveState()});
gid('moreOptionsBtn')?.addEventListener('click',()=>gid('moreOptionsDialog').showModal());
gid('closeMoreOptions')?.addEventListener('click',()=>gid('moreOptionsDialog').close());
['saveLocalBtn','loadLocalBtn','exportBtn','exportPdfBtn','saveDriveBtn','loadDriveBtn','deletePanelBtn','tntBtn'].forEach(target=>{const m=gid('more_'+target); if(m) m.onclick=()=>{gid('moreOptionsDialog').close(); gid(target)?.click()}});
gid('simpleImageBtn')?.addEventListener('click',()=>gid('imageBtn').click());
gid('simpleTntBtn')?.addEventListener('click',()=>gid('tntBtn').click());
gid('simpleBgImageBtn')?.addEventListener('click',()=>gid('loadBgImageBtn').click());
gid('scratchCoverBtn')?.addEventListener('click',openScratchArtDialog);
gid('simpleScratchCoverBtn')?.addEventListener('click',openScratchArtDialog);
gid('simpleClearBgBtn')?.addEventListener('click',()=>gid('clearBgImageBtn').click());
gid('simpleDeleteBtn')?.addEventListener('click',()=>{if(!selectedIds.length){setStatus('Select an item first.','danger'); return} deleteSelected()});
gid('floatDeleteBtn')?.addEventListener('click',()=>{if(selectedIds.length) deleteSelected()});
gid('floatDuplicateBtn')?.addEventListener('click',()=>{if(selectedIds.length) duplicateSelected()});
gid('floatSaveBtn')?.addEventListener('click',()=>downloadSelectionPng());
gid('floatEditBtn')?.addEventListener('click',()=>{const o=currentObj(); if(o&&TEXTABLE_TYPES.includes(o.type)) openInlineTextEditor(o.id)});
gid('floatCropBtn')?.addEventListener('click',()=>openCropDialog());
gid('floatConceptChildBtn')?.addEventListener('click',()=>addConceptChildNode());
gid('floatConceptLinkBtn')?.addEventListener('click',setConceptLink);

/* Mermaid and word-cloud tools render diagrams locally, then insert them as
   ordinary image objects with source metadata so they can be re-edited later. */
let _mermaidInitDone=false, _mermaidPreviewTimer=null;
function ensureMermaidInit(){if(_mermaidInitDone) return; if(typeof window.mermaid==='undefined') return; try{window.mermaid.initialize({startOnLoad:false,theme:'default',securityLevel:'strict'}); _mermaidInitDone=true}catch(_){}}
const _MERMAID_PALETTE=[{fill:'#dbeafe',stroke:'#2563eb',text:'#1e3a8a'},{fill:'#fce7f3',stroke:'#db2777',text:'#831843'},{fill:'#d1fae5',stroke:'#059669',text:'#064e3b'},{fill:'#ffedd5',stroke:'#ea580c',text:'#7c2d12'},{fill:'#fef3c7',stroke:'#ca8a04',text:'#713f12'},{fill:'#e9d5ff',stroke:'#7c3aed',text:'#581c87'}];
function applyMermaidPalette(svgString,source){if(/classDef|:::/.test(source||'')) return svgString; try{const parser=new DOMParser(); const doc=parser.parseFromString(svgString,'image/svg+xml'); const nodes=doc.querySelectorAll('g.node'); if(!nodes.length) return svgString; nodes.forEach((node,i)=>{const c=_MERMAID_PALETTE[i%_MERMAID_PALETTE.length]; node.querySelectorAll('rect, polygon, circle, ellipse, path').forEach(shape=>{const cls=(shape.getAttribute('class')||''); if(cls.includes('label-container')||shape.tagName==='path'&&!cls.includes('basic')) {} shape.setAttribute('fill',c.fill); shape.setAttribute('stroke',c.stroke); shape.setAttribute('stroke-width','1.5')}); node.querySelectorAll('text, tspan').forEach(t=>{t.setAttribute('fill',c.text); t.setAttribute('style',(t.getAttribute('style')||'')+';color:'+c.text)}); node.querySelectorAll('foreignObject div, foreignObject span, foreignObject p').forEach(el=>{if(el.style) el.style.color=c.text})}); return new XMLSerializer().serializeToString(doc)}catch(_){return svgString}}
function tightenSvgString(svgString,pad=12){return new Promise(resolve=>{try{const wrap=document.createElement('div');Object.assign(wrap.style,{position:'absolute',left:'-10000px',top:'-10000px',opacity:'0',pointerEvents:'none'});wrap.innerHTML=svgString;const s=wrap.querySelector('svg');if(!s)return resolve(svgString);s.querySelectorAll('rect').forEach(r=>{const x=r.getAttribute('x')||'0',y=r.getAttribute('y')||'0',w=r.getAttribute('width')||'',h=r.getAttribute('height')||'',fill=(r.getAttribute('fill')||'').toLowerCase();if((x==='0'||x==='0px')&&(y==='0'||y==='0px')&&(w==='100%'||h==='100%'||fill==='#fff'||fill==='#ffffff'||fill==='white'))r.style.display='none'});document.body.appendChild(wrap);requestAnimationFrame(()=>{try{const b=s.getBBox();document.body.removeChild(wrap);if(!b||!isFinite(b.width)||!isFinite(b.height)||b.width<1||b.height<1)return resolve(svgString);const x=Math.floor(b.x-pad),y=Math.floor(b.y-pad),w=Math.ceil(b.width+pad*2),h=Math.ceil(b.height+pad*2);s.setAttribute('viewBox',`${x} ${y} ${w} ${h}`);s.setAttribute('width',String(w));s.setAttribute('height',String(h));s.style.maxWidth='';s.style.height='';resolve(new XMLSerializer().serializeToString(s))}catch(_){try{document.body.removeChild(wrap)}catch(__){}resolve(svgString)}})}catch(_){resolve(svgString)}})}
async function renderMermaidTo(target,source){if(!target) return; ensureMermaidInit(); if(typeof window.mermaid==='undefined'){target.innerHTML='<div class="mermaid-error">Mermaid library not loaded. Add vendor/mermaid.min.js and reload — see README.</div>'; return} if(!source||!source.trim()){target.innerHTML='<div class="mermaid-error" style="color:var(--muted)">Type Mermaid syntax on the left to preview here.</div>'; return} try{const renderId='mp_'+Math.random().toString(36).slice(2); const out=await window.mermaid.render(renderId,source); const raw=out&&out.svg?out.svg:String(out||''); target.innerHTML=applyMermaidPalette(raw,source)}catch(err){target.innerHTML='<div class="mermaid-error">'+esc(err&&err.message?err.message:String(err))+'</div>'}}
function openMermaidDialog(existingId){const dlg=gid('mermaidDialog'); if(!dlg||dlg.open) return; const ta=gid('mermaidSource'); const preview=gid('mermaidPreview'); const obj=existingId?findObj(existingId):null; const starter=obj&&obj.mermaidSource?obj.mermaidSource:mermaidTemplate('flowchart'); ta.value=starter; dlg.dataset.editId=obj?obj.id:''; renderMermaidTo(preview,ta.value); dlg.showModal()}
gid('mermaidSource')?.addEventListener('input',()=>{clearTimeout(_mermaidPreviewTimer); _mermaidPreviewTimer=setTimeout(()=>renderMermaidTo(gid('mermaidPreview'),gid('mermaidSource').value),300)});
gid('mermaidCancel')?.addEventListener('click',()=>gid('mermaidDialog').close());
gid('closeMermaid')?.addEventListener('click',()=>gid('mermaidDialog').close());
gid('insertMermaidBtn')?.addEventListener('click',()=>openMermaidDialog());
async function renderMermaidColoredSvg(source){const renderId='mr_'+Math.random().toString(36).slice(2); const out=await window.mermaid.render(renderId,source); const svg=out&&out.svg?out.svg:String(out||''); return tightenSvgString(applyMermaidPalette(svg,source),14)}
const MERMAID_TEMPLATES={
  en:{flowchart:'graph TD\n  A[Start] --> B{Decision}\n  B -->|Yes| C[Continue]\n  B -->|No| D[Stop]',pie:'pie title Favorite Subjects\n  "Math" : 30\n  "Science" : 25\n  "English" : 20\n  "Art" : 15\n  "Other" : 10',sequence:'sequenceDiagram\n  Student->>Teacher: Has a question\n  Teacher->>Student: Provides an answer\n  Student->>Notebook: Writes down notes',mindmap:'mindmap\n  root((Topic))\n    Idea 1\n      Detail A\n      Detail B\n    Idea 2\n      Detail C\n    Idea 3\n      Detail D\n      Detail E',gantt:'gantt\n  title Project Timeline\n  dateFormat YYYY-MM-DD\n  section Planning\n    Outline   :a1, 2026-01-01, 7d\n    Research  :a2, after a1, 14d\n  section Build\n    Draft     :b1, after a2, 21d\n    Review    :b2, after b1, 7d',timeline:'timeline\n  title School Year\n  August    : Welcome week\n  October   : Midterms\n  December  : Holiday break\n  March     : Spring break\n  May       : Final exams',class:'classDiagram\n  class Animal {\n    +String name\n    +int age\n    +makeSound()\n  }\n  class Dog {\n    +String breed\n    +bark()\n  }\n  Animal <|-- Dog',state:'stateDiagram-v2\n  [*] --> Idle\n  Idle --> Working : start\n  Working --> Review : submit\n  Review --> Working : revise\n  Review --> Done : approve\n  Done --> [*]'},
  es:{flowchart:'graph TD\n  A[Inicio] --> B{Decisión}\n  B -->|Sí| C[Continuar]\n  B -->|No| D[Detener]',pie:'pie title Materias favoritas\n  "Matemáticas" : 30\n  "Ciencias" : 25\n  "Español" : 20\n  "Arte" : 15\n  "Otra" : 10',sequence:'sequenceDiagram\n  Estudiante->>Docente: Tiene una pregunta\n  Docente->>Estudiante: Da una respuesta\n  Estudiante->>Cuaderno: Escribe notas',mindmap:'mindmap\n  root((Tema))\n    Idea 1\n      Detalle A\n      Detalle B\n    Idea 2\n      Detalle C\n    Idea 3\n      Detalle D\n      Detalle E',gantt:'gantt\n  title Cronograma del proyecto\n  dateFormat YYYY-MM-DD\n  section Planificación\n    Esquema   :a1, 2026-01-01, 7d\n    Investigación  :a2, after a1, 14d\n  section Construcción\n    Borrador     :b1, after a2, 21d\n    Revisión    :b2, after b1, 7d',timeline:'timeline\n  title Año escolar\n  Agosto    : Semana de bienvenida\n  Octubre   : Exámenes parciales\n  Diciembre  : Vacaciones\n  Marzo     : Descanso de primavera\n  Mayo       : Exámenes finales',class:'classDiagram\n  class Animal {\n    +String nombre\n    +int edad\n    +hacerSonido()\n  }\n  class Perro {\n    +String raza\n    +ladrar()\n  }\n  Animal <|-- Perro',state:'stateDiagram-v2\n  [*] --> Inactivo\n  Inactivo --> Trabajando : iniciar\n  Trabajando --> Revisión : enviar\n  Revisión --> Trabajando : revisar\n  Revisión --> Terminado : aprobar\n  Terminado --> [*]'},
  vi:{flowchart:'graph TD\n  A[Bắt đầu] --> B{Quyết định}\n  B -->|Có| C[Tiếp tục]\n  B -->|Không| D[Dừng]',pie:'pie title Môn học yêu thích\n  "Toán" : 30\n  "Khoa học" : 25\n  "Tiếng Việt" : 20\n  "Nghệ thuật" : 15\n  "Khác" : 10',sequence:'sequenceDiagram\n  Học_sinh->>Giáo_viên: Có câu hỏi\n  Giáo_viên->>Học_sinh: Trả lời\n  Học_sinh->>Vở: Ghi chú',mindmap:'mindmap\n  root((Chủ đề))\n    Ý tưởng 1\n      Chi tiết A\n      Chi tiết B\n    Ý tưởng 2\n      Chi tiết C\n    Ý tưởng 3\n      Chi tiết D\n      Chi tiết E',gantt:'gantt\n  title Tiến độ dự án\n  dateFormat YYYY-MM-DD\n  section Lập kế hoạch\n    Dàn ý   :a1, 2026-01-01, 7d\n    Nghiên cứu  :a2, after a1, 14d\n  section Thực hiện\n    Bản nháp     :b1, after a2, 21d\n    Xem lại    :b2, after b1, 7d',timeline:'timeline\n  title Năm học\n  Tháng 8    : Tuần chào mừng\n  Tháng 10   : Kiểm tra giữa kỳ\n  Tháng 12  : Nghỉ lễ\n  Tháng 3     : Nghỉ xuân\n  Tháng 5       : Kiểm tra cuối kỳ',class:'classDiagram\n  class Động_vật {\n    +String tên\n    +int tuổi\n    +phátÂm()\n  }\n  class Chó {\n    +String giống\n    +sủa()\n  }\n  Động_vật <|-- Chó',state:'stateDiagram-v2\n  [*] --> Chờ\n  Chờ --> Làm_việc : bắt đầu\n  Làm_việc --> Xem_lại : nộp\n  Xem_lại --> Làm_việc : sửa\n  Xem_lại --> Hoàn_thành : duyệt\n  Hoàn_thành --> [*]'},
  ar:{flowchart:'graph TD\n  A[البداية] --> B{قرار}\n  B -->|نعم| C[متابعة]\n  B -->|لا| D[توقف]',pie:'pie title المواد المفضلة\n  "رياضيات" : 30\n  "علوم" : 25\n  "لغة" : 20\n  "فن" : 15\n  "أخرى" : 10',sequence:'sequenceDiagram\n  طالب->>معلم: لديه سؤال\n  معلم->>طالب: يقدم إجابة\n  طالب->>دفتر: يكتب ملاحظات',mindmap:'mindmap\n  root((موضوع))\n    فكرة 1\n      تفصيل A\n      تفصيل B\n    فكرة 2\n      تفصيل C\n    فكرة 3\n      تفصيل D\n      تفصيل E',gantt:'gantt\n  title الجدول الزمني للمشروع\n  dateFormat YYYY-MM-DD\n  section تخطيط\n    مخطط   :a1, 2026-01-01, 7d\n    بحث  :a2, after a1, 14d\n  section بناء\n    مسودة     :b1, after a2, 21d\n    مراجعة    :b2, after b1, 7d',timeline:'timeline\n  title العام الدراسي\n  أغسطس    : أسبوع الترحيب\n  أكتوبر   : اختبارات منتصف الفصل\n  ديسمبر  : عطلة\n  مارس     : عطلة الربيع\n  مايو       : الاختبارات النهائية',class:'classDiagram\n  class حيوان {\n    +String اسم\n    +int عمر\n    +إصدار_صوت()\n  }\n  class كلب {\n    +String سلالة\n    +نباح()\n  }\n  حيوان <|-- كلب',state:'stateDiagram-v2\n  [*] --> خامل\n  خامل --> يعمل : ابدأ\n  يعمل --> مراجعة : إرسال\n  مراجعة --> يعمل : تعديل\n  مراجعة --> منجز : اعتماد\n  منجز --> [*]'},
  zh:{flowchart:'graph TD\n  A[开始] --> B{决定}\n  B -->|是| C[继续]\n  B -->|否| D[停止]',pie:'pie title 最喜欢的科目\n  "数学" : 30\n  "科学" : 25\n  "语文" : 20\n  "艺术" : 15\n  "其他" : 10',sequence:'sequenceDiagram\n  学生->>教师: 有问题\n  教师->>学生: 给出答案\n  学生->>笔记本: 写下笔记',mindmap:'mindmap\n  root((主题))\n    想法 1\n      细节 A\n      细节 B\n    想法 2\n      细节 C\n    想法 3\n      细节 D\n      细节 E',gantt:'gantt\n  title 项目时间表\n  dateFormat YYYY-MM-DD\n  section 计划\n    大纲   :a1, 2026-01-01, 7d\n    研究  :a2, after a1, 14d\n  section 制作\n    草稿     :b1, after a2, 21d\n    审阅    :b2, after b1, 7d',timeline:'timeline\n  title 学年\n  八月    : 欢迎周\n  十月   : 期中考试\n  十二月  : 假期\n  三月     : 春假\n  五月       : 期末考试',class:'classDiagram\n  class 动物 {\n    +String 名称\n    +int 年龄\n    +发声()\n  }\n  class 狗 {\n    +String 品种\n    +叫()\n  }\n  动物 <|-- 狗',state:'stateDiagram-v2\n  [*] --> 空闲\n  空闲 --> 工作中 : 开始\n  工作中 --> 审阅 : 提交\n  审阅 --> 工作中 : 修改\n  审阅 --> 完成 : 批准\n  完成 --> [*]'},
  uh:{flowchart:'graph TD\n  A[शुरू / شروع] --> B{निर्णय / فیصلہ}\n  B -->|हाँ / ہاں| C[जारी रखें / جاری رکھیں]\n  B -->|नहीं / نہیں| D[रोकें / روکیں]',pie:'pie title पसंदीदा विषय / پسندیدہ مضامین\n  "Math" : 30\n  "Science" : 25\n  "Language" : 20\n  "Art" : 15\n  "Other" : 10',sequence:'sequenceDiagram\n  Student->>Teacher: प्रश्न है / سوال ہے\n  Teacher->>Student: उत्तर देता है / جواب دیتا ہے\n  Student->>Notebook: नोट लिखता है / نوٹ لکھتا ہے',mindmap:'mindmap\n  root((विषय / موضوع))\n    विचार 1\n      विवरण A\n      विवरण B\n    विचार 2\n      विवरण C\n    विचार 3\n      विवरण D\n      विवरण E',gantt:'gantt\n  title परियोजना समयरेखा / منصوبہ ٹائم لائن\n  dateFormat YYYY-MM-DD\n  section योजना / منصوبہ بندی\n    रूपरेखा   :a1, 2026-01-01, 7d\n    शोध  :a2, after a1, 14d\n  section निर्माण / تعمیر\n    मसौदा     :b1, after a2, 21d\n    समीक्षा    :b2, after b1, 7d',timeline:'timeline\n  title स्कूल वर्ष / تعلیمی سال\n  August    : स्वागत सप्ताह / خوش آمدید ہفتہ\n  October   : मध्यावधि / مڈٹرم\n  December  : छुट्टी / تعطیل\n  March     : वसंत अवकाश / بہار تعطیل\n  May       : अंतिम परीक्षा / آخری امتحان',class:'classDiagram\n  class Animal {\n    +String नाम\n    +int उम्र\n    +आवाज़()\n  }\n  class Dog {\n    +String नस्ल\n    +भौंकना()\n  }\n  Animal <|-- Dog',state:'stateDiagram-v2\n  [*] --> Idle\n  Idle --> Working : शुरू / شروع\n  Working --> Review : जमा / جمع\n  Review --> Working : सुधार / ترمیم\n  Review --> Done : मंजूर / منظور\n  Done --> [*]'}
};
function mermaidTemplate(key){const lang=graphLang(), set=MERMAID_TEMPLATES[lang]||MERMAID_TEMPLATES.en; return set[key]||MERMAID_TEMPLATES.en[key]||''}
document.querySelectorAll('[data-mtpl]').forEach(btn=>btn.addEventListener('click',()=>{const key=btn.dataset.mtpl; const tpl=mermaidTemplate(key); if(!tpl) return; gid('mermaidSource').value=tpl; renderMermaidTo(gid('mermaidPreview'),tpl)}));
const _WORDCLOUD_PALETTES={vibrant:['#7c3aed','#db2777','#059669','#ea580c','#ca8a04','#2563eb'],pastel:['#a78bfa','#f472b6','#34d399','#fb923c','#facc15','#60a5fa'],warm:['#dc2626','#ea580c','#ca8a04','#c2410c','#b91c1c','#92400e'],cool:['#1e40af','#0e7490','#059669','#7c3aed','#0891b2','#1d4ed8'],monochrome:['#1e293b','#334155','#475569','#64748b','#94a3b8','#cbd5e1']};
function parseWordList(text){const lines=String(text||'').split(/[\n,]+/).map(s=>s.trim()).filter(Boolean); const words=[],counts={}; for(const line of lines){const m=line.match(/^(.+?):\s*(\d+(?:\.\d+)?)$/); if(m){const w=m[1].trim(),wt=parseFloat(m[2]); const ex=words.find(x=>x.word===w); if(ex) ex.weight=Math.max(ex.weight,wt); else words.push({word:w,weight:wt})} else {counts[line]=(counts[line]||0)+1}} for(const [w,c] of Object.entries(counts)){if(!words.find(x=>x.word===w)) words.push({word:w,weight:c})} return words.sort((a,b)=>b.weight-a.weight)}
function _wcRectsOverlap(a,b){return !(a.x+a.w<b.x||b.x+b.w<a.x||a.y+a.h<b.y||b.y+b.h<a.y)}
function _wcRotatedAABB(w,h,angleDeg){if(angleDeg===0) return [w,h]; if(Math.abs(angleDeg)===90) return [h,w]; const r=angleDeg*Math.PI/180; const c=Math.abs(Math.cos(r)),s=Math.abs(Math.sin(r)); return [w*c+h*s,w*s+h*c]}
const _WORDCLOUD_SHAPES={heart:'M50 88 C20 65 5 45 5 28 C5 14 16 5 28 5 C38 5 46 11 50 22 C54 11 62 5 72 5 C84 5 95 14 95 28 C95 45 80 65 50 88 Z',star:'M50 5 L62 38 L97 38 L68 58 L80 92 L50 72 L20 92 L32 58 L3 38 L38 38 Z',cloud:'M30 70 C15 70 5 60 5 50 C5 40 15 32 25 33 C28 22 38 15 50 15 C62 15 72 22 75 33 C85 32 95 40 95 50 C95 60 85 70 70 70 Z',apple:'M50 25 C46 12 35 8 28 12 C20 16 18 25 22 32 C18 36 12 42 12 55 C12 75 28 92 50 92 C72 92 88 75 88 55 C88 42 82 36 78 32 C82 25 80 16 72 12 C65 8 54 12 50 25 Z',house:'M50 5 L92 35 L82 35 L82 92 L60 92 L60 65 L40 65 L40 92 L18 92 L18 35 L8 35 Z',diamond:'M50 5 L92 50 L50 95 L8 50 Z',pentagon:'M50 5 L93 38 L77 90 L23 90 L7 38 Z',bolt:'M58 5 L20 55 L42 55 L32 95 L75 40 L52 40 L62 5 Z'};
const _WORDCLOUD_EMOJI_SHAPES={dog:'🐕',cat:'🐈',bird:'🐦',fish:'🐟',whale:'🐳',dolphin:'🐬',horse:'🐴',pig:'🐷',cow:'🐮',butterfly:'🦋',bear:'🐻',mouse:'🐭',lion:'🦁',tiger:'🐯',rabbit:'🐰',turtle:'🐢',panda:'🐼',monkey:'🐵',frog:'🐸',penguin:'🐧',owl:'🦉',unicorn:'🦄',dragon:'🐲',octopus:'🐙',snail:'🐌',ladybug:'🐞',pumpkin:'🎃',tree:'🌳',flower:'🌸',sun:'☀️',moon:'🌙',globe:'🌍',leaf:'🍃',rocket:'🚀'};
function _wcEmojiToMask(emoji,W,H){const cv=document.createElement('canvas'); cv.width=W; cv.height=H; const ctx=cv.getContext('2d',{willReadFrequently:true}); const fontSize=Math.min(W,H)*0.92; ctx.font=fontSize+'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#000'; ctx.fillText(emoji,W/2,H/2); let data; try{data=ctx.getImageData(0,0,W,H)}catch(_){return null} const px=data.data; for(let i=0;i<px.length;i+=4){px[i+3]=px[i+3]>40?255:0; px[i]=0; px[i+1]=0; px[i+2]=0} return data}
function _wcEdgeAnchors(mask,W,H,count){
  if(!mask) return [];
  const data=mask.data;
  const inside=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&data[(y*W+x)*4+3]>128;
  const edgeMap=new Uint8Array(W*H);
  const edges=[];
  for(let y=1;y<H-1;y++){for(let x=1;x<W-1;x++){if(!inside(x,y)) continue; if(!inside(x-1,y)||!inside(x+1,y)||!inside(x,y-1)||!inside(x,y+1)){edgeMap[y*W+x]=1; edges.push({x,y})}}}
  if(edges.length<16) return [];
  // Trace contours via 8-connected walk; keep the longest one
  const visited=new Uint8Array(W*H);
  let best=[];
  for(const start of edges){
    const sIdx=start.y*W+start.x;
    if(visited[sIdx]) continue;
    const contour=[start]; visited[sIdx]=1;
    let cur=start;
    while(true){
      let next=null;
      for(let dy=-1;dy<=1&&!next;dy++){for(let dx=-1;dx<=1&&!next;dx++){if(dx===0&&dy===0) continue; const nx=cur.x+dx,ny=cur.y+dy; if(nx<0||ny<0||nx>=W||ny>=H) continue; const nIdx=ny*W+nx; if(edgeMap[nIdx]&&!visited[nIdx]){next={x:nx,y:ny}; visited[nIdx]=1}}}
      if(!next) break;
      contour.push(next); cur=next;
    }
    if(contour.length>best.length) best=contour;
  }
  if(best.length<16) return [];
  // Resample evenly along arc length, computing tangent angle per anchor
  const cum=[0];
  for(let i=1;i<best.length;i++){cum.push(cum[i-1]+Math.hypot(best[i].x-best[i-1].x, best[i].y-best[i-1].y))}
  const total=cum[cum.length-1];
  if(total<50) return [];
  const cx=W/2,cy=H/2,inset=14;
  const anchors=[];
  for(let k=0;k<count;k++){
    const target=(k/count)*total;
    let i=0;
    while(i<cum.length-1&&cum[i+1]<target) i++;
    const ti=Math.max(1,Math.min(best.length-2,i));
    const tp1=best[ti-1], tp2=best[Math.min(ti+1,best.length-1)];
    let angle=Math.atan2(tp2.y-tp1.y, tp2.x-tp1.x)*180/Math.PI;
    if(angle>90) angle-=180; else if(angle<-90) angle+=180;
    const ex=best[i].x, ey=best[i].y;
    const dx=cx-ex, dy=cy-ey, dist=Math.hypot(dx,dy)||1;
    anchors.push({x:ex+(dx/dist)*inset, y:ey+(dy/dist)*inset, angle});
  }
  return anchors;
}
function _wcBuildMask(shape,W,H){if(shape==='rect') return null; if(_WORDCLOUD_EMOJI_SHAPES[shape]) return _wcEmojiToMask(_WORDCLOUD_EMOJI_SHAPES[shape],W,H); const cv=document.createElement('canvas'); cv.width=W; cv.height=H; const ctx=cv.getContext('2d',{willReadFrequently:true}); ctx.fillStyle='#000'; if(shape==='circle'){ctx.beginPath(); ctx.arc(W/2,H/2,Math.min(W,H)/2-6,0,Math.PI*2); ctx.fill()} else if(shape==='oval'){ctx.beginPath(); ctx.ellipse(W/2,H/2,W/2-6,H/2-6,0,0,Math.PI*2); ctx.fill()} else {const d=_WORDCLOUD_SHAPES[shape]; if(!d) return null; try{const p=new Path2D(d); const scale=Math.min(W,H)/100*0.92; const tx=(W-100*scale)/2, ty=(H-100*scale)/2; ctx.translate(tx,ty); ctx.scale(scale,scale); ctx.fill(p); ctx.setTransform(1,0,0,1,0,0)}catch(_){return null}} try{return ctx.getImageData(0,0,W,H)}catch(_){return null}}
function _wcPointInMask(mask,x,y){if(!mask) return true; const ix=Math.floor(x),iy=Math.floor(y); if(ix<0||iy<0||ix>=mask.width||iy>=mask.height) return false; const idx=(iy*mask.width+ix)*4; return mask.data[idx+3]>128}
function _wcPickAngle(mode,i){if(mode==='ninety') return (i>0&&Math.random()<0.32)?90:0; if(mode==='random'){if(i===0) return 0; const angles=[0,0,0,0,15,-15,30,-30,45,-45,60,-60,75,-75,90,-90]; return angles[Math.floor(Math.random()*angles.length)]} return 0}
function _wcSpiralPlace(wd,fontSize,angle,W,H,mask,placed,maxIters,checkMask,startTheta){
  const cx=W/2,cy=H/2;
  let placedIt=null;
  for(let shrink=0;shrink<6&&!placedIt;shrink++){
    if(fontSize<8) break;
    const baseW=fontSize*0.58*wd.word.length+10;
    const baseH=fontSize*1.18;
    const [w,h]=_wcRotatedAABB(baseW,baseH,angle);
    let theta=startTheta||0,radius=0;
    for(let it=0;it<maxIters;it++){
      const x=cx+radius*Math.cos(theta)-w/2, y=cy+radius*Math.sin(theta)-h/2;
      if(x<4||y<4||x+w>W-4||y+h>H-4){theta+=0.22; radius+=0.55; continue}
      if(checkMask&&mask){
        const samples=[[x,y],[x+w,y],[x,y+h],[x+w,y+h],[x+w/2,y],[x+w,y+h/2],[x+w/2,y+h],[x,y+h/2],[x+w/2,y+h/2]];
        let outside=false;
        for(const [px,py] of samples){if(!_wcPointInMask(mask,px,py)){outside=true; break}}
        if(outside){theta+=0.22; radius+=0.55; continue}
      }
      const cand={x,y,w,h};
      let collides=false;
      for(const p of placed){if(_wcRectsOverlap(cand,p)){collides=true; break}}
      if(!collides){placedIt={x,y,w,h,fontSize}; break}
      theta+=0.22; radius+=0.55;
    }
    if(!placedIt) fontSize*=0.8;
  }
  return placedIt;
}
function placeWordsLayout(words,opts){
  const W=opts.width,H=opts.height,shape=opts.shape||'rect';
  const rotMode=opts.rotation||'none';
  const mask=_wcBuildMask(shape,W,H);
  const minSize=opts.minSize||14, maxSize=opts.maxSize||(mask?54:64);
  const maxWt=Math.max(...words.map(w=>w.weight));
  const minWt=Math.min(...words.map(w=>w.weight));
  const range=maxWt-minWt||1;
  const placed=[];
  const maxIters=mask?1500:800;

  // Outline mode: place along the perimeter, then fill nooks with smaller copies
  if(rotMode==='outline'&&mask){
    const anchors=_wcEdgeAnchors(mask,W,H,Math.max(28,words.length*2));
    if(anchors.length){
      const olMin=Math.min(16,minSize+2), olMax=Math.min(38,maxSize-10);
      let anchorIdx=0;
      for(let i=0;i<words.length;i++){
        const wd=words[i];
        const norm=(wd.weight-minWt)/range;
        const fontSize=olMin+norm*(olMax-olMin);
        let placedIt=null;
        for(let attempt=0;attempt<anchors.length&&!placedIt;attempt++){
          const a=anchors[(anchorIdx+attempt)%anchors.length];
          const baseW=fontSize*0.58*wd.word.length+10;
          const baseH=fontSize*1.18;
          const [w,h]=_wcRotatedAABB(baseW,baseH,a.angle);
          const x=a.x-w/2, y=a.y-h/2;
          if(x<4||y<4||x+w>W-4||y+h>H-4) continue;
          const cand={x,y,w,h};
          let collides=false;
          for(const p of placed){if(_wcRectsOverlap(cand,p)){collides=true; break}}
          if(!collides){placedIt={x,y,w,h,fontSize,angle:a.angle}; anchorIdx=(anchorIdx+attempt+1)%anchors.length}
        }
        if(placedIt) placed.push({...placedIt,word:wd.word,color:opts.palette[i%opts.palette.length],rotation:placedIt.angle});
      }
    }
    // Fill nooks: smaller, horizontal copies of every word, spiraled into the interior
    const fillerMin=10, fillerMax=20;
    for(let i=0;i<words.length;i++){
      const wd=words[i];
      const norm=(wd.weight-minWt)/range;
      const fontSize=fillerMin+norm*(fillerMax-fillerMin);
      const placedIt=_wcSpiralPlace(wd,fontSize,0,W,H,mask,placed,maxIters,true,(i%2===0)?0:Math.PI);
      if(placedIt) placed.push({...placedIt,word:wd.word,color:opts.palette[(i+3)%opts.palette.length],rotation:0});
    }
    return placed;
  }

  // Standard mode: spiral fill with shrink-on-failure
  for(let i=0;i<words.length;i++){
    const wd=words[i];
    const norm=(wd.weight-minWt)/range;
    const fontSize=minSize+norm*(maxSize-minSize);
    const angle=_wcPickAngle(rotMode,i);
    const placedIt=_wcSpiralPlace(wd,fontSize,angle,W,H,mask,placed,maxIters,!!mask,(i%2===0)?0:Math.PI);
    if(placedIt) placed.push({...placedIt,word:wd.word,color:opts.palette[i%opts.palette.length],rotation:angle});
  }
  return placed;
}
function _wcDarken(hex,amount){const m=hex.match(/^#?([0-9a-f]{6})$/i); if(!m) return hex; const n=parseInt(m[1],16); const r=Math.max(0,Math.floor(((n>>16)&255)*(1-amount))), g=Math.max(0,Math.floor(((n>>8)&255)*(1-amount))), b=Math.max(0,Math.floor((n&255)*(1-amount))); return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('')}
function _wcShapeBackgroundSvg(shape,W,H,color){if(shape==='rect') return ''; if(_WORDCLOUD_EMOJI_SHAPES[shape]){const emoji=_WORDCLOUD_EMOJI_SHAPES[shape]; const fontSize=Math.min(W,H)*0.92; return `<text x="${W/2}" y="${H/2}" text-anchor="middle" dominant-baseline="central" font-size="${fontSize}" opacity="0.14">${emoji}</text>`} if(shape==='circle') return `<circle cx="${W/2}" cy="${H/2}" r="${Math.min(W,H)/2-6}" fill="${color}" opacity="0.13"/>`; if(shape==='oval') return `<ellipse cx="${W/2}" cy="${H/2}" rx="${W/2-6}" ry="${H/2-6}" fill="${color}" opacity="0.13"/>`; const d=_WORDCLOUD_SHAPES[shape]; if(!d) return ''; const scale=Math.min(W,H)/100*0.92; const tx=(W-100*scale)/2, ty=(H-100*scale)/2; return `<g transform="translate(${tx} ${ty}) scale(${scale})"><path d="${d}" fill="${color}" opacity="0.18"/></g>`}
function _wcContentBox(placed,W,H,pad=22){if(!placed.length)return{x:0,y:0,w:W,h:H};let minX=W,minY=H,maxX=0,maxY=0;placed.forEach(p=>{minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x+p.w);maxY=Math.max(maxY,p.y+p.h)});minX=Math.max(0,Math.floor(minX-pad));minY=Math.max(0,Math.floor(minY-pad));maxX=Math.min(W,Math.ceil(maxX+pad));maxY=Math.min(H,Math.ceil(maxY+pad));return{x:minX,y:minY,w:Math.max(80,maxX-minX),h:Math.max(60,maxY-minY)}}
function renderWordCloudSvg(placed,W,H,effect,shape,palette){effect=effect||'flat'; const box=_wcContentBox(placed,W,H); const bgColor=(palette&&palette[0])||'#7c3aed'; const bg=_wcShapeBackgroundSvg(shape||'rect',W,H,bgColor); const items=placed.map(p=>{const cx=p.x+p.w/2; const cy=p.y+p.h/2+p.fontSize*0.32; const tr=p.rotation?` transform="rotate(${p.rotation} ${cx} ${cy})"`:''; const baseAttrs=`text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="${p.fontSize}" font-weight="700"`; const word=esc(p.word); if(effect==='shadow'){return `<text x="${cx+2}" y="${cy+2}" ${baseAttrs} fill="rgba(0,0,0,0.28)"${tr}>${word}</text><text x="${cx}" y="${cy}" ${baseAttrs} fill="${p.color}"${tr}>${word}</text>`} if(effect==='3d'){const dark=_wcDarken(p.color,0.55); let layers=''; for(let dz=4;dz>=1;dz--){layers+=`<text x="${cx+dz}" y="${cy+dz}" ${baseAttrs} fill="${dark}" opacity="${0.55+(4-dz)*0.08}"${tr}>${word}</text>`} return layers+`<text x="${cx}" y="${cy}" ${baseAttrs} fill="${p.color}" stroke="rgba(0,0,0,0.35)" stroke-width="0.6"${tr}>${word}</text>`} return `<text x="${cx}" y="${cy}" ${baseAttrs} fill="${p.color}"${tr}>${word}</text>`}).join(''); return `<svg xmlns="http://www.w3.org/2000/svg" width="${box.w}" height="${box.h}" viewBox="${box.x} ${box.y} ${box.w} ${box.h}">${bg}${items}</svg>`}
let _wcPreviewTimer=null;
function generateWordCloudPreview(){const target=gid('wcPreview'); if(!target) return; const source=gid('wcSource').value; const shape=gid('wcShape').value; const rotation=gid('wcRotation')?gid('wcRotation').value:'none'; const effect=gid('wcEffect')?gid('wcEffect').value:'flat'; const palette=_WORDCLOUD_PALETTES[gid('wcPalette').value]||_WORDCLOUD_PALETTES.vibrant; const words=parseWordList(source); if(!words.length){target.innerHTML='<div class="mermaid-error" style="color:var(--muted)">Add some words on the left.</div>'; return} const W=720,H=480; const placed=placeWordsLayout(words,{width:W,height:H,shape,palette,rotation}); if(!placed.length){target.innerHTML='<div class="mermaid-error">Could not lay out any words. Try shorter words or fewer items.</div>'; return} target.innerHTML=renderWordCloudSvg(placed,W,H,effect,shape,palette); target.dataset.wcPlaced='1'}
function openWordCloudDialog(existingId){const dlg=gid('wordCloudDialog'); if(!dlg||dlg.open) return; const obj=existingId?findObj(existingId):null; if(obj&&obj.wordCloudSource){gid('wcSource').value=obj.wordCloudSource; gid('wcShape').value=obj.wordCloudShape||'rect'; gid('wcPalette').value=obj.wordCloudPalette||'vibrant'; if(gid('wcRotation')) gid('wcRotation').value=obj.wordCloudRotation||'none'; if(gid('wcEffect')) gid('wcEffect').value=obj.wordCloudEffect||'flat'; dlg.dataset.editId=obj.id} else {if(!gid('wcSource').value.trim()) gid('wcSource').value='curiosity\nimagination\nplay\nlearn\nlearn\ndiscover\nteamwork\ngrowth\nquestions\ngrowth\nwonder\ncuriosity\ncreate\nask\nlearn\nshare'; dlg.dataset.editId=''} generateWordCloudPreview(); dlg.showModal()}
const _WORDCLOUD_TEMPLATES={
  classroom:{shape:'apple',palette:'vibrant',rotation:'random',effect:'shadow',source:'curiosity\nlearn\nlearn\nlearn\nread\nwrite\ncreate\nshare\nask\nteacher\nstudent\nfriend\nbook\nschool\nschool\ndiscover\nimagine\nplay\nteach\ngrow\nclassroom\nthink\nwonder\nstudy\nmath\nscience\nart\nmusic\nfocus\ncollaborate\nrespect\nlisten\ndraw\nstory\nanswer\nquestion\nproject\nteam'},
  friendship:{shape:'heart',palette:'warm',rotation:'random',effect:'3d',source:'friend\nfriend\nfriend\nlove\nlove\nlaugh\ntogether\ncare\nshare\nshare\nkind\ntrust\nlisten\nhug\nsmile\nplay\nhelp\nfun\nbestie\nfamily\njoy\nmemories\nloyal\nhonest\nsupport\nadventure\ntalk\nenjoy\ncompanion\nbond'},
  growth:{shape:'tree',palette:'cool',rotation:'random',effect:'shadow',source:'grow\ngrow\ngrow\nlearn\nlearn\ntry\neffort\nyet\npractice\nmistake\nmistake\nfeedback\nstrategy\nbrain\nchallenge\npersist\nimprove\nbelieve\nfocus\ngoal\nsucceed\nprogress\npatience\ncourage\nresilient\nimagine\nexplore\nattempt\ndare\nstretch'},
  science:{shape:'rocket',palette:'cool',rotation:'random',effect:'3d',source:'discover\nexplore\nexplore\nask\nhypothesis\nexperiment\nobserve\nmeasure\ndata\nanalyze\nconclude\ntest\nresearch\ndesign\nbuild\nscience\nspace\nstars\nphysics\nbiology\nchemistry\ninnovate\ninvent\ngalaxy\nplanet\norbit\ncosmos\nlaunch\nzero\ngravity\nmars\nmoon'},
  earth:{shape:'globe',palette:'cool',rotation:'random',effect:'shadow',source:'earth\nplanet\nplanet\nrecycle\nrecycle\nreduce\nreuse\ngreen\nclean\nplant\nplant\nwater\nocean\nforest\nanimal\nhabitat\nclimate\ncare\nsustain\nrenew\nfuture\nshare\nresponsibility\nnature\necosystem\nbiodiversity\npollinate\nconserve\ngarden\ncompost\nsolar\nwind'},
  halloween:{shape:'pumpkin',palette:'warm',rotation:'random',effect:'3d',source:'spooky\nspooky\npumpkin\npumpkin\nghost\ncostume\ncandy\ntrick\ntreat\norange\nwitch\nbat\nblack\nmoon\nautumn\nfun\nscary\nboo\nspider\nweb\nskeleton\ncauldron\nhowl\nharvest\ncarve\nlantern\nshadow'},
  birthday:{shape:'star',palette:'vibrant',rotation:'random',effect:'3d',source:'birthday\nbirthday\ncelebrate\ncelebrate\ncake\nballoons\npresents\nfriends\nfamily\nwish\nblow\ncandles\njoy\nfun\nsing\nparty\nspecial\nlove\nmemories\nyear\nsmile\ngifts\nconfetti\nhappy\ncheer\ndance\nsparkle\nfestive'},
  kindness:{shape:'butterfly',palette:'pastel',rotation:'random',effect:'shadow',source:'kind\nkind\nkindness\ncare\ngentle\nhelp\nshare\nlisten\nrespect\ninclude\nsmile\nthanks\nplease\nfriend\nfair\nhope\npeace\nlove\ngive\nhug\nempathy\ncompassion\nforgive\ngenerous\nwarm\nopen\nencourage\nuplift\nsupport\nbelong'},
  feelings:{shape:'cloud',palette:'pastel',rotation:'random',effect:'shadow',source:'happy\nhappy\nsad\nexcited\ncalm\nproud\nsilly\nshy\nbrave\ncurious\ngrateful\nworried\nangry\nfrustrated\nhopeful\nloved\nsafe\nnervous\ntired\nplayful\nthankful\nconfused\nconfident\nrelaxed\njoyful\nlonely\nsurprised\ngentle\npeaceful'},
  ocean:{shape:'whale',palette:'cool',rotation:'random',effect:'shadow',source:'ocean\nocean\nwave\nfish\nwhale\ndolphin\ncoral\nreef\nshark\nswim\ndive\nbeach\nshell\nsand\ndeep\nblue\ntide\nseaweed\nturtle\ncrab\noctopus\njellyfish\nstarfish\nsalt\nlagoon\nmarine\ncurrent\nshore\nmangrove'},
  space:{shape:'moon',palette:'monochrome',rotation:'random',effect:'3d',source:'space\nstars\nstars\nmoon\nplanet\nrocket\norbit\ngalaxy\ncomet\nasteroid\nnebula\nblack hole\nuniverse\ncosmos\nmars\nvenus\njupiter\nsaturn\nastronaut\nlight year\nsolar\nlunar\nmilky way\nconstellation\nmeteor\neclipse\nsupernova\ngravity'},
  vocab:{shape:'star',palette:'vibrant',rotation:'random',effect:'shadow',source:'vocabulary\ndefine\nsynonym\nantonym\nprefix\nsuffix\nroot\ncontext\nclues\nspelling\nphonics\nsentence\nparagraph\nidiom\nmetaphor\nsimile\nadjective\nverb\nnoun\nadverb\npronoun\nrhyme\ndescribe\nclarify\nexpand\nlanguage\nliterature\ngrammar'}
};
function _wcApplyTemplate(key){const tpl=_WORDCLOUD_TEMPLATES[key]; if(!tpl) return; gid('wcSource').value=tpl.source; gid('wcShape').value=tpl.shape; gid('wcPalette').value=tpl.palette; if(gid('wcRotation')) gid('wcRotation').value=tpl.rotation||'none'; if(gid('wcEffect')) gid('wcEffect').value=tpl.effect||'flat'; generateWordCloudPreview()}
document.querySelectorAll('[data-wctpl]').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault(); _wcApplyTemplate(btn.dataset.wctpl)}));
gid('insertWordCloudBtn')?.addEventListener('click',()=>openWordCloudDialog());
gid('wcSource')?.addEventListener('input',()=>{clearTimeout(_wcPreviewTimer); _wcPreviewTimer=setTimeout(generateWordCloudPreview,300)});
gid('wcShape')?.addEventListener('change',generateWordCloudPreview);
gid('wcPalette')?.addEventListener('change',generateWordCloudPreview);
gid('wcRotation')?.addEventListener('change',generateWordCloudPreview);
gid('wcEffect')?.addEventListener('change',generateWordCloudPreview);
gid('wcGenerate')?.addEventListener('click',generateWordCloudPreview);
gid('wcCancel')?.addEventListener('click',()=>gid('wordCloudDialog').close());
gid('closeWordCloud')?.addEventListener('click',()=>gid('wordCloudDialog').close());
gid('wcInsert')?.addEventListener('click',()=>{const target=gid('wcPreview'); const svg=target&&target.querySelector('svg'); if(!svg){setStatus('Generate a word cloud first.','danger'); return} const xml=new XMLSerializer().serializeToString(svg); const dataUrl='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(xml))); const naturalW=parseInt(svg.getAttribute('width'))||720, naturalH=parseInt(svg.getAttribute('height'))||480; const dispW=Math.min(480,naturalW), dispH=Math.round(dispW*(naturalH/naturalW)); const dlg=gid('wordCloudDialog'); const editId=dlg.dataset.editId; const meta={src:dataUrl,naturalW,naturalH,wordCloudSource:gid('wcSource').value,wordCloudShape:gid('wcShape').value,wordCloudPalette:gid('wcPalette').value,wordCloudRotation:gid('wcRotation')?gid('wcRotation').value:'none',wordCloudEffect:gid('wcEffect')?gid('wcEffect').value:'flat',fill:'none',stroke:'none',strokeWidth:0}; if(editId){const obj=findObj(editId); if(obj){Object.assign(obj,meta); delete obj.crop; render(); saveState(); setStatus('Word cloud updated.','success'); dlg.close(); return}} addObj(makeObj('image',120,120,dispW,dispH,meta)); setStatus('Word cloud inserted.','success'); dlg.close()});
gid('wcCopyPng')?.addEventListener('click',async()=>{const target=gid('wcPreview'); const svg=target&&target.querySelector('svg'); if(!svg){setStatus('Generate a word cloud first.','danger'); return} if(!navigator.clipboard||!navigator.clipboard.write||typeof ClipboardItem==='undefined'){setStatus('Clipboard write is not supported in this browser.','danger'); return} try{const xml=new XMLSerializer().serializeToString(svg); const dataUrl='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(xml))); const blob=await svgUrlToPngBlob(dataUrl); await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]); setStatus('Word cloud copied to clipboard as PNG.','success')}catch(err){setStatus('Copy failed: '+(err&&err.message?err.message:String(err)),'danger')}});
gid('mermaidCopyPng')?.addEventListener('click',async()=>{const source=gid('mermaidSource').value; if(!source.trim()){setStatus('Mermaid source is empty.','danger'); return} ensureMermaidInit(); if(typeof window.mermaid==='undefined'){setStatus('Mermaid library not loaded.','danger'); return} if(!navigator.clipboard||!navigator.clipboard.write||typeof ClipboardItem==='undefined'){setStatus('Clipboard write is not supported in this browser. Try Ctrl/Cmd+C after inserting.','danger'); return} try{const svg=await renderMermaidColoredSvg(source); const dataUrl='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg))); const blob=await svgUrlToPngBlob(dataUrl); await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]); setStatus('Diagram copied to clipboard as PNG.','success')}catch(err){setStatus('Copy failed: '+(err&&err.message?err.message:String(err)),'danger')}});
gid('mermaidInsert')?.addEventListener('click',async()=>{const dlg=gid('mermaidDialog'); const source=gid('mermaidSource').value; if(!source.trim()){setStatus('Mermaid source is empty.','danger'); return} ensureMermaidInit(); if(typeof window.mermaid==='undefined'){setStatus('Mermaid library not loaded.','danger'); return} try{const svg=await renderMermaidColoredSvg(source); const dataUrl='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg))); const probe=new Image(); probe.onload=()=>{const naturalW=probe.width||640, naturalH=probe.height||480; let w=Math.min(480,naturalW), h=Math.round(w*(naturalH/naturalW)); const editId=dlg.dataset.editId; if(editId){const obj=findObj(editId); if(obj){obj.src=dataUrl; obj.mermaidSource=source; obj.naturalW=naturalW; obj.naturalH=naturalH; delete obj.crop; render(); saveState(); setStatus('Diagram updated.','success'); dlg.close(); return}} addObj(makeObj('image',120,120,w,h,{src:dataUrl,mermaidSource:source,naturalW,naturalH,fill:'none',stroke:'none',strokeWidth:0})); setStatus('Diagram inserted.','success'); dlg.close()}; probe.onerror=()=>{setStatus('Could not render diagram preview.','danger')}; probe.src=dataUrl}catch(err){setStatus('Mermaid error: '+(err&&err.message?err.message:String(err)),'danger')}});
function ensureCropShapeControls(){
  if(gid('cropShape')) return;
  const actions=gid('cropDialog')?.querySelector('.confirm-actions');
  if(!actions) return;
  const row=document.createElement('div');
  row.className='crop-row';
  row.innerHTML='<label>Shape</label><select id="cropShape">'+cropShapeOptionsHtml()+'</select>';
  actions.parentElement.insertBefore(row,actions);
  gid('cropShape')?.addEventListener('change',updateCropPreview);
}
function openCropDialog(){const o=currentObj(); if(!o||o.type!=='image'||!o.src){setStatus('Select an image first.','danger'); return} const ensureNatural=()=>new Promise(resolve=>{if(o.naturalW&&o.naturalH) return resolve(true); const probe=new Image(); probe.onload=()=>{o.naturalW=probe.width; o.naturalH=probe.height; resolve(true)}; probe.onerror=()=>resolve(false); probe.src=o.src}); ensureNatural().then(ok=>{if(!ok){setStatus('Could not read image dimensions.','danger'); return} ensureCropShapeControls(); const c=o.crop||{x:0,y:0,w:1,h:1}; gid('cropTop').value=Math.round(c.y*100); gid('cropBottom').value=Math.round((1-c.y-c.h)*100); gid('cropLeft').value=Math.round(c.x*100); gid('cropRight').value=Math.round((1-c.x-c.w)*100); if(gid('cropShape')) gid('cropShape').value=o.maskShape||'none'; gid('cropDialog').dataset.objectId=o.id; updateCropPreview(); gid('cropDialog').showModal()})}
function canvasMaskContentBox(shape,w,h){
  const fits={star:.64,heart:.76,diamond:.74,triangle:.72,pentagon:.84};
  const f=fits[shape]||1;
  if(f>=1) return {x:0,y:0,w,h};
  const bw=w*f,bh=h*f;
  let x=(w-bw)/2,y=(h-bh)/2;
  if(shape==='triangle') y=h*.23;
  if(shape==='heart') y=h*.16;
  return {x,y,w:bw,h:bh};
}
function canvasMaskPath(ctx,shape,w,h){
  if(!shape||shape==='none'){ctx.rect(0,0,w,h);return}
  const cx=w/2,cy=h/2,rx=w/2,ry=h/2;
  if(CROP_CUSTOM_MASKS[shape]){ctx.rect(0,0,w,h);return}
  if(shape==='circle'){const r=Math.min(w,h)/2; ctx.arc(cx,cy,r,0,Math.PI*2); return}
  if(shape==='oval'){ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2); return}
  if(shape==='triangle'){ctx.moveTo(cx,0);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();return}
  if(shape==='diamond'){ctx.moveTo(cx,0);ctx.lineTo(w,cy);ctx.lineTo(cx,h);ctx.lineTo(0,cy);ctx.closePath();return}
  if(shape==='heart'){ctx.moveTo(cx,h*.88);ctx.bezierCurveTo(w*.1,h*.58,0,h*.34,w*.18,h*.16);ctx.bezierCurveTo(w*.32,0,w*.48,h*.08,cx,h*.23);ctx.bezierCurveTo(w*.52,h*.08,w*.68,0,w*.82,h*.16);ctx.bezierCurveTo(w,h*.34,w*.9,h*.58,cx,h*.88);ctx.closePath();return}
  const n=shape==='pentagon'?5:shape==='hexagon'?6:shape==='octagon'?8:0;
  if(n){const rot=shape==='hexagon'?0:shape==='octagon'?Math.PI/8:-Math.PI/2; for(let i=0;i<n;i++){const a=rot+i*Math.PI*2/n,x=cx+Math.cos(a)*rx,y=cy+Math.sin(a)*ry; i?ctx.lineTo(x,y):ctx.moveTo(x,y)} ctx.closePath(); return}
  if(shape==='star'){for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?.46:1,x=cx+Math.cos(a)*rx*r,y=cy+Math.sin(a)*ry*r; i?ctx.lineTo(x,y):ctx.moveTo(x,y)} ctx.closePath(); return}
  ctx.rect(0,0,w,h);
}
function updateCropPreview(){const id=gid('cropDialog').dataset.objectId; const o=findObj(id); if(!o) return; const top=+gid('cropTop').value, right=+gid('cropRight').value, bottom=+gid('cropBottom').value, left=+gid('cropLeft').value; gid('cropTopValue').textContent=top+'%'; gid('cropRightValue').textContent=right+'%'; gid('cropBottomValue').textContent=bottom+'%'; gid('cropLeftValue').textContent=left+'%'; const totalH=top+bottom, totalW=left+right; if(totalH>=95||totalW>=95){gid('cropApply').disabled=true; return} else {gid('cropApply').disabled=false} const img=new Image(); img.onload=()=>{const cw=img.width, ch=img.height; const cx=(left/100)*cw, cy=(top/100)*ch; const cropW=((100-left-right)/100)*cw, cropH=((100-top-bottom)/100)*ch; const cv=gid('cropPreviewCanvas'); const previewMax=320; const scale=Math.min(previewMax/cropW,previewMax/cropH,1); cv.width=Math.max(20,Math.round(cropW*scale)); cv.height=Math.max(20,Math.round(cropH*scale)); const ctx=cv.getContext('2d'), shape=gid('cropShape')?.value||'none', ib=canvasMaskContentBox(shape,cv.width,cv.height); ctx.fillStyle='#f5f7fb'; ctx.fillRect(0,0,cv.width,cv.height); try{ctx.save(); if(CROP_CUSTOM_MASKS[shape]&&typeof Path2D!=='undefined'){ctx.scale(cv.width/100,cv.height/100);ctx.clip(new Path2D(CROP_CUSTOM_MASKS[shape]));ctx.setTransform(1,0,0,1,0,0)}else{ctx.beginPath();canvasMaskPath(ctx,shape,cv.width,cv.height);ctx.clip()} ctx.drawImage(img,cx,cy,cropW,cropH,ib.x,ib.y,ib.w,ib.h);ctx.restore()}catch(_){}}; img.src=o.src}
['cropTop','cropRight','cropBottom','cropLeft'].forEach(id=>gid(id)?.addEventListener('input',updateCropPreview));
gid('cropCancel')?.addEventListener('click',()=>gid('cropDialog').close());
gid('cropReset')?.addEventListener('click',()=>{gid('cropTop').value=0; gid('cropRight').value=0; gid('cropBottom').value=0; gid('cropLeft').value=0; if(gid('cropShape')) gid('cropShape').value='none'; updateCropPreview()});
gid('cropApply')?.addEventListener('click',()=>{const id=gid('cropDialog').dataset.objectId; const o=findObj(id); if(!o){gid('cropDialog').close(); return} const top=+gid('cropTop').value, right=+gid('cropRight').value, bottom=+gid('cropBottom').value, left=+gid('cropLeft').value, shape=gid('cropShape')?.value||'none'; if(top+bottom>=95||left+right>=95){setStatus('Crop too aggressive — leave at least 5% visible.','danger'); return} if(top===0&&right===0&&bottom===0&&left===0){delete o.crop} else {o.crop={x:left/100,y:top/100,w:(100-left-right)/100,h:(100-top-bottom)/100}} if(shape==='none') delete o.maskShape; else o.maskShape=shape; render(); saveState(); setStatus(shape==='none'?'Image cropped.':'Image shape applied.','success'); gid('cropDialog').close()});
gid('welcomeDismiss')?.addEventListener('click',()=>{try{localStorage.setItem('drawsplat.welcomed','1')}catch(_){} const dlg=gid('welcomeDialog'); if(dlg) dlg.close(); setTimeout(showStartupTip,500)});
gid('simpleColorInput')?.addEventListener('input',e=>{const v=e.target.value; if(tool==='sticky'){if(ui.stickyColor){ui.stickyColor.value=v; ui.stickyColor.dispatchEvent(new Event('change',{bubbles:true}))}} else {setPaintColor(v); ui.strokeColor?.dispatchEvent(new Event('input',{bubbles:true}))}});
function refreshViewToggle(){const btn=gid('viewToggleBtn'); if(!btn) return; const m=ui.interfaceMode?.value||'simple'; const text=m==='simple'?'Simple':'Advanced'; const tip=m==='simple'?'Switch to Advanced view':'Switch to Simple view'; setButtonChrome(btn,text); btn.setAttribute('title',tip); btn.setAttribute('aria-label',tip); btn.setAttribute('data-tooltip',tip)}
gid('viewToggleBtn')?.addEventListener('click',()=>{const next=(ui.interfaceMode?.value||'simple')==='simple'?'advanced':'simple'; if(ui.interfaceMode) ui.interfaceMode.value=next; applyInterfaceMode(next); refreshViewToggle()});
function refreshFrameNav(){const c=gid('frameCounter'); if(c){const p=panel(); const name=p?.name||('Panel '+(board.active+1)); c.textContent=name+' · '+(board.active+1)+'/'+board.panels.length; c.title=name+' ('+(board.active+1)+' of '+board.panels.length+')'} const prev=gid('frameNavPrev'),next=gid('frameNavNext'); if(prev){prev.disabled=board.active<=0; prev.setAttribute('aria-disabled',prev.disabled?'true':'false')} if(next){next.disabled=board.active>=board.panels.length-1; next.setAttribute('aria-disabled',next.disabled?'true':'false')} const bs=gid('bgSelectSimple'); if(bs) bs.value=panel().bg||'grid'}
gid('renamePanelBtn').onclick=()=>{const n=prompt('Panel name:',panel().name); if(n){panel().name=n; render(); saveState()}};
gid('deletePanelBtn').onclick=()=>{if(board.panels.length<2){setStatus('Keep at least one panel.','danger'); return} askConfirm('Delete this panel?',{okLabel:'Delete'}).then(ok=>{if(!ok) return; const deletedId=panel().id; board.panels=board.panels.filter(p=>p.id!==deletedId); board.active=Math.max(0,Math.min(board.active,board.panels.length-1)); resetInteractionState(); render(); saveState(); setStatus('Panel deleted.','success')})};
gid('clearPanelBtn').onclick=()=>{askConfirm('Clear this panel?',{okLabel:'Clear'}).then(ok=>{if(ok){panel().objects=[]; clearSelection(); render(); saveState()}})};
gid('zoomInBtn').onclick=()=>{zoom=Math.min(2,zoom+.1); render()};
gid('zoomOutBtn').onclick=()=>{zoom=Math.max(.4,zoom-.1); render()};
gid('zoomResetBtn').onclick=()=>{zoom=1; render()};

function connectorEndpoints(o){const a=findObj(o.fromId),b=findObj(o.toId); if(!a||!b)return{x1:0,y1:0,x2:0,y2:0}; const ba=normBox(a),bb=normBox(b),p1=edgePoint(ba,bb.cx,bb.cy,a.type),p2=edgePoint(bb,ba.cx,ba.cy,b.type); return{x1:p1.x,y1:p1.y,x2:p2.x,y2:p2.y}}
function edgePoint(box,tx,ty,type){const cx=box.cx,cy=box.cy,dx=tx-cx,dy=ty-cy; if(type==='ellipse'){const rx=Math.max(1,box.w/2),ry=Math.max(1,box.h/2),s=1/Math.sqrt((dx*dx)/(rx*rx)+(dy*dy)/(ry*ry)||1); return{x:cx+dx*s,y:cy+dy*s}} const hw=box.w/2,hh=box.h/2,s=Math.min(dx===0?1e9:hw/Math.abs(dx),dy===0?1e9:hh/Math.abs(dy)); return{x:cx+dx*s,y:cy+dy*s}}

/* Export and animated-GIF helpers rasterize the current SVG board or selected
   objects through canvas so output works in common document/slides apps. */
async function exportCanvas(){const keep=[...selectedIds]; clearSelection(); render(); const clone=svg.cloneNode(true); clone.setAttribute('width',svg.clientWidth); clone.setAttribute('height',svg.clientHeight); const data='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(clone)), img=new Image(); await new Promise((res,rej)=>{img.onload=res; img.onerror=rej; img.src=data}); const c=document.createElement('canvas'); c.width=svg.clientWidth*2; c.height=svg.clientHeight*2; const ctx=c.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,c.width,c.height); ctx.scale(2,2); ctx.drawImage(img,0,0); selectedIds=keep; render(); return c}
async function exportPng(){return (await exportCanvas()).toDataURL('image/png')}
gid('exportBtn').onclick=async()=>download(await exportPng(),(board.title||'drawsplat').replace(/\W+/g,'-')+'.png');
gid('exportPdfBtn').onclick=async()=>{const canvas=await exportCanvas(); const pdfBlob=canvasToPdfBlob(canvas); download(URL.createObjectURL(pdfBlob),(board.title||'drawsplat').replace(/\W+/g,'-')+'.pdf',true)};

function selectedGifFrameSets(){
  const sets=[], seen=new Set();
  selectedIds.forEach(idv=>{
    const o=findObj(idv); if(!o||o.type==='connector') return;
    const key=o.groupId||o.id;
    if(seen.has(key)) return;
    seen.add(key);
    const ids=o.groupId?panel().objects.filter(x=>x.groupId===o.groupId&&x.type!=='connector').map(x=>x.id):[o.id];
    sets.push(ids);
  });
  return sets;
}
async function blobToImage(blob){return new Promise((resolve,reject)=>{const img=new Image(); const url=URL.createObjectURL(blob); img.onload=()=>{URL.revokeObjectURL(url); resolve(img)}; img.onerror=()=>{URL.revokeObjectURL(url); reject(new Error('Could not render GIF frame'))}; img.src=url})}
async function imageObjectToNaturalCanvas(o){
  const img=await loadImageElement(o.src), crop=o.crop&&o.naturalW&&o.naturalH?{sx:o.crop.x*img.width,sy:o.crop.y*img.height,sw:o.crop.w*img.width,sh:o.crop.h*img.height}:{sx:0,sy:0,sw:img.width,sh:img.height};
  const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(crop.sw)); c.height=Math.max(1,Math.round(crop.sh));
  const ctx=c.getContext('2d'); ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,c.width,c.height); ctx.drawImage(img,crop.sx,crop.sy,crop.sw,crop.sh,0,0,c.width,c.height);
  return c;
}
async function selectedObjectsToGifCanvases(){
  const frameSets=selectedGifFrameSets();
  if(frameSets.length<2) throw new Error('Select at least two objects or grouped images for GIF frames.');
  const keep=[...selectedIds], hidden=new Map(), images=[];
  try{
    for(const ids of frameSets){
      const only=ids.length===1?findObj(ids[0]):null;
      if(only&&only.type==='image'&&only.src){images.push(await imageObjectToNaturalCanvas(only)); continue}
      hidden.clear();
      panel().objects.forEach(o=>{if(!ids.includes(o.id)){hidden.set(o.id,o.hiddenForGif); o.hiddenForGif=true}});
      selectedIds=[...ids];
      const blob=await copySelectionAsPngBlob();
      images.push(await blobToImage(blob));
      hidden.forEach((val,idv)=>{const o=findObj(idv); if(o) o.hiddenForGif=val});
    }
  } finally {
    hidden.forEach((val,idv)=>{const o=findObj(idv); if(o) o.hiddenForGif=val});
    selectedIds=keep;
    render();
  }
  const maxW=Math.max(...images.map(i=>i.naturalWidth||i.width)), maxH=Math.max(...images.map(i=>i.naturalHeight||i.height));
  const maxGifSize=960, fit=Math.min(1,maxGifSize/Math.max(maxW,maxH)), w=Math.max(40,Math.round(maxW*fit)), h=Math.max(40,Math.round(maxH*fit));
  return images.map(img=>{const c=document.createElement('canvas'); c.width=w; c.height=h; const ctx=c.getContext('2d'); ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,w,h); const iw=(img.naturalWidth||img.width)*fit, ih=(img.naturalHeight||img.height)*fit; ctx.drawImage(img,(w-iw)/2,(h-ih)/2,iw,ih); return c});
}
function gifPalette(){const p=[]; for(let r=0;r<8;r++)for(let g=0;g<8;g++)for(let b=0;b<4;b++)p.push(Math.round(r*255/7),Math.round(g*255/7),Math.round(b*255/3)); return p}
function canvasToGifIndices(c){const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data, out=new Uint8Array(c.width*c.height); for(let i=0,j=0;i<d.length;i+=4,j++){const a=d[i+3]; if(a<80){out[j]=255; continue} const r=d[i]>>5,g=d[i+1]>>5,b=d[i+2]>>6; out[j]=(r<<5)|(g<<2)|b} return out}
function packGifSubBlocks(bytes){const out=[]; for(let i=0;i<bytes.length;i+=255){const chunk=bytes.slice(i,i+255); out.push(chunk.length,...chunk)} out.push(0); return out}
function appendBytes(target,bytes){for(let i=0;i<bytes.length;i+=8192) target.push(...bytes.slice(i,i+8192))}
function lzwGifEncode(indices,minCodeSize=8){
  const clear=1<<minCodeSize, end=clear+1, out=[]; let cur=0,bits=0,codeCount=0;
  const write=code=>{cur|=code<<bits; bits+=minCodeSize+1; while(bits>=8){out.push(cur&255); cur>>=8; bits-=8}};
  write(clear);
  indices.forEach(idx=>{if(codeCount>=240){write(clear); codeCount=0} write(idx); codeCount++});
  write(end);
  if(bits>0) out.push(cur&255);
  return out;
}
function encodeGif(canvases,delayMs=450){
  const w=canvases[0].width,h=canvases[0].height,pal=gifPalette(), out=[];
  const text=s=>[...s].forEach(ch=>out.push(ch.charCodeAt(0))); text('GIF89a');
  out.push(w&255,w>>8,h&255,h>>8,0xF7,0,255,...pal);
  out.push(0x21,0xFF,11); text('NETSCAPE2.0'); out.push(3,1,0,0,0);
  const delay=Math.max(2,Math.round(delayMs/10));
  canvases.forEach(c=>{out.push(0x21,0xF9,4,0x00,delay&255,delay>>8,0,0,0x2C,0,0,0,0,w&255,w>>8,h&255,h>>8,0,8); appendBytes(out,packGifSubBlocks(lzwGifEncode(canvasToGifIndices(c),8)))});
  out.push(0x3B); return new Blob([new Uint8Array(out)],{type:'image/gif'});
}
async function createGifFromSelection(){
  try{
    const btn=gid('createGifBtn'); if(btn) btn.disabled=true;
    setStatus('Creating GIF...');
    const canvases=await selectedObjectsToGifCanvases(), delay=+gid('gifDelay')?.value||450, blob=encodeGif(canvases,delay), url=URL.createObjectURL(blob);
    const img=gid('gifPreview'); if(img){img.onload=()=>setStatus('GIF ready.','success'); img.onerror=()=>setStatus('GIF preview could not be decoded.','danger'); img.src=url; img.hidden=false}
    const dl=gid('downloadGifBtn'); if(dl){dl.disabled=false; dl.dataset.gifUrl=url}
    setStatus('GIF ready.','success');
  }catch(err){setStatus(err.message||'Could not create GIF.','danger')}
  finally{const btn=gid('createGifBtn'); if(btn) btn.disabled=false}
}
gid('openGifDialogBtn')?.addEventListener('click',()=>gid('gifDialog')?.showModal());
gid('createGifBtn')?.addEventListener('click',createGifFromSelection);
gid('downloadGifBtn')?.addEventListener('click',()=>{const url=gid('downloadGifBtn')?.dataset.gifUrl; if(url) download(url,(board.title||'drawsplat').replace(/\W+/g,'-')+'.gif',true)});
gid('closeGifDialog')?.addEventListener('click',()=>gid('gifDialog')?.close());
gid('touchMultiSelectBtn')?.addEventListener('click',()=>{touchMultiSelect=!touchMultiSelect; gid('touchMultiSelectBtn')?.classList.toggle('active',touchMultiSelect); setStatus(touchMultiSelect?'Multi-select on. Tap items to add/remove.':'Multi-select off.','success')});
function download(data,name,isBlobUrl){const a=document.createElement('a'); a.href=data; a.download=name; document.body.appendChild(a); a.click(); a.remove(); if(isBlobUrl) setTimeout(()=>URL.revokeObjectURL(data),2000)}
function canvasToPdfBlob(canvas){const jpegData=canvas.toDataURL('image/jpeg',0.92); const bin=atob(jpegData.split(',')[1]); const imgBytes=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) imgBytes[i]=bin.charCodeAt(i); const W=canvas.width, H=canvas.height; const pageW=612, pageH=Math.max(200,Math.round(pageW*(H/W))); const content=`q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Im0 Do\nQ`; const enc=new TextEncoder(); const parts=[]; const add=s=>parts.push(enc.encode(s)); add('%PDF-1.4\n'); const offsets=[0]; let len=parts[0].length; function pushObj(str,binArr){offsets.push(len); const head=enc.encode(str); parts.push(head); len+=head.length; if(binArr){parts.push(binArr); len+=binArr.length; const tail=enc.encode('\nendstream\nendobj\n'); parts.push(tail); len+=tail.length}} add('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'); add('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n'); add(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 4 0 R >> /ProcSet [/PDF /ImageC] >> /Contents 5 0 R >>\nendobj\n`); offsets.push(len); const o4h=enc.encode(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${W} /Height ${H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes.length} >>\nstream\n`); parts.push(o4h); len+=o4h.length; parts.push(imgBytes); len+=imgBytes.length; const o4t=enc.encode('\nendstream\nendobj\n'); parts.push(o4t); len+=o4t.length; offsets.push(len); const contBytes=enc.encode(content); const o5h=enc.encode(`5 0 obj\n<< /Length ${contBytes.length} >>\nstream\n`); parts.push(o5h); len+=o5h.length; parts.push(contBytes); len+=contBytes.length; const o5t=enc.encode('\nendstream\nendobj\n'); parts.push(o5t); len+=o5t.length; const xrefStart=len; const count=6; let xref='xref\n0 '+count+'\n0000000000 65535 f \n'; for(let i=1;i<count;i++) xref+=String(offsets[i]).padStart(10,'0')+' 00000 n \n'; xref+=`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`; parts.push(enc.encode(xref)); return new Blob(parts,{type:'application/pdf'}) }

/* v2.5: IndexedDB autosave fallback when localStorage hits quota. */
const IDB_DB='drawsplat',IDB_STORE='kv',IDB_KEY='autosave';
let idbReady=null;
function openIdb(){
  if(idbReady) return idbReady;
  idbReady=new Promise((resolve,reject)=>{
    const req=indexedDB.open(IDB_DB,1);
    req.onupgradeneeded=()=>{ req.result.createObjectStore(IDB_STORE) };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
  return idbReady;
}
async function idbPut(value){try{const db=await openIdb(); return new Promise((resolve,reject)=>{ const tx=db.transaction(IDB_STORE,'readwrite'); tx.objectStore(IDB_STORE).put(value,IDB_KEY); tx.oncomplete=()=>resolve(); tx.onerror=()=>reject(tx.error) })}catch(_){}}
async function idbGet(){try{const db=await openIdb(); return new Promise((resolve)=>{ const tx=db.transaction(IDB_STORE,'readonly'); const r=tx.objectStore(IDB_STORE).get(IDB_KEY); r.onsuccess=()=>resolve(r.result||null); r.onerror=()=>resolve(null) })}catch(_){return null}}

function cloneBoardForRestore(){const c=JSON.parse(JSON.stringify(board)); c.restorePoints=[]; return c}
function snapshot(){return JSON.stringify(board)}
function persistLocal(){
  const snap=snapshot();
  try{ localStorage.setItem('drawsplat.autosave',snap); setSaveState('saved') }
  catch(err){ idbPut(snap); setSaveState('saved') /* falls back when localStorage quota exceeds */ }
  /* always mirror to IDB on big boards so a future load works even if LS was wiped. */
  if(snap.length>2_000_000) idbPut(snap);
  refreshSessionExpiry();
}
function initHistory(){const snap=snapshot(); history=[snap]; future=[]; lastSnapshot=snap}
function saveState(pushHistory=true){persistLocal(); if(pushHistory){const snap=snapshot(); if(snap!==lastSnapshot){history.push(snap); if(history.length>50) history.shift(); future=[]; lastSnapshot=snap}} broadcastLocal(); pushCloudRoom()}
function undo(){if(history.length<2)return; future.push(history.pop()); board=JSON.parse(history[history.length-1]); migrateBoard(board); clearSelection(); connectorPendingFrom=null; lastSnapshot=history[history.length-1]; persistLocal(); render(); broadcastLocal()}
function redo(){if(!future.length)return; const snap=future.pop(); history.push(snap); board=JSON.parse(snap); migrateBoard(board); clearSelection(); connectorPendingFrom=null; lastSnapshot=snap; persistLocal(); render(); broadcastLocal()}
function refreshRestorePoints(){const pts=board.restorePoints||[]; ui.restorePointSelect.innerHTML=pts.map((p,i)=>`<option value="${i}">${esc(p.name)} — ${new Date(p.at).toLocaleString()}</option>`).join(''); ui.restorePointHint.textContent=pts.length?`${pts.length} restore point${pts.length===1?'':'s'} available.`:'No restore points yet.'}
function saveRestorePoint(){const name=prompt('Restore point name:','Checkpoint '+((board.restorePoints?.length||0)+1)); if(!name) return; board.restorePoints=board.restorePoints||[]; board.restorePoints.unshift({name,at:new Date().toISOString(),state:cloneBoardForRestore()}); board.restorePoints=board.restorePoints.slice(0,20); refreshRestorePoints(); saveState(); setStatus('Restore point saved.','success')}
function restoreSelectedPoint(){const idx=parseInt(ui.restorePointSelect.value||'-1',10); const pt=board.restorePoints?.[idx]; if(!pt) return setStatus('Choose a restore point first.','danger'); askConfirm('Restore this checkpoint? Current unsaved work on the board will be replaced.',{okLabel:'Restore'}).then(ok=>{if(!ok) return; const savedPoints=board.restorePoints; board=JSON.parse(JSON.stringify(pt.state)); migrateBoard(board); board.restorePoints=savedPoints; clearSelection(); initHistory(); render(); persistLocal(); setStatus('Restore point loaded.','success')})}
gid('saveRestorePointBtn').onclick=saveRestorePoint;
gid('restorePointBtn').onclick=restoreSelectedPoint;
gid('undoBtn').onclick=undo;
gid('redoBtn').onclick=redo;
// Mirror the header Undo/Redo into the sidebar so they're reachable
// without hunting through the top menu. Same handlers, same shortcuts.
gid('sidebarUndoBtn')?.addEventListener('click',undo);
gid('sidebarRedoBtn')?.addEventListener('click',redo);

/* Local file save/load keeps DrawSplatTM usable without a backend. Imported JSON
   is migrated immediately so old boards pick up new default fields. */
gid('saveLocalBtn').onclick=()=>download('data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(board,null,2)),(board.title||'drawsplat').replace(/\W+/g,'-')+'.drawsplat.json');
gid('loadLocalBtn').onclick=()=>gid('jsonInput').click();
gid('jsonInput').onchange=e=>{const f=e.target.files[0]; if(!f)return; if(f.size>MAX_BOARD_BYTES){setStatus('Board import blocked. Maximum board file size is '+Math.round(MAX_BOARD_BYTES/1024/1024)+' MB.','danger'); e.target.value=''; return} const r=new FileReader(); r.onload=()=>{try{const loaded=JSON.parse(r.result); board=loaded; migrateBoard(board); clearSelection(); initHistory(); render(); persistLocal(); setStatus('Board loaded.','success')}catch(err){setStatus('Board import failed. The file is not valid DrawSplatTM JSON.','danger')}}; r.readAsText(f); e.target.value=''};

/* Panel import: PDF (rendered to bgImage per page), PPTX/ODP (text + images extracted per slide). */
const PANEL_IMPORT_MAX_PAGES=100;
const PANEL_IMPORT_MAX_FILE_BYTES=64*1024*1024;
const PANEL_IMPORT_TARGET_LONG_EDGE=1600;
function importLibsReady(format){
  if(format==='pdf')  return typeof window.pdfjsLib!=='undefined' && !window.__pdfjsMissing;
  if(format==='pptx'||format==='odp') return typeof window.JSZip!=='undefined' && !window.__jszipMissing;
  return false;
}
function detectPanelImportFormat(file){
  const n=(file&&file.name||'').toLowerCase();
  const t=file&&file.type||'';
  if(n.endsWith('.pdf')||t==='application/pdf') return 'pdf';
  if(n.endsWith('.pptx')||t==='application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'pptx';
  if(n.endsWith('.odp')||t==='application/vnd.oasis.opendocument.presentation') return 'odp';
  return null;
}
function showImportProgress(label){
  const dlg=gid('importProgressDialog'); if(!dlg) return null;
  const labelEl=gid('importProgressLabel'); if(labelEl) labelEl.textContent=label||'Importing…';
  const bar=gid('importProgressBar'); if(bar) bar.value=0;
  const state={cancelled:false};
  const cancelBtn=gid('importProgressCancel');
  if(cancelBtn) cancelBtn.onclick=()=>{state.cancelled=true};
  try{if(!dlg.open) dlg.showModal()}catch(_){}
  return {
    update(text,frac){if(labelEl&&text) labelEl.textContent=text; if(bar&&typeof frac==='number') bar.value=Math.max(0,Math.min(1,frac))*100;},
    cancelled(){return state.cancelled},
    close(){try{dlg.close()}catch(_){}}
  };
}
function fileToArrayBuffer(f){return new Promise((res,rej)=>{const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=()=>rej(new Error('read failed')); r.readAsArrayBuffer(f)})}
async function importPanelsFromFile(file){
  if(!file) return;
  if(file.size>PANEL_IMPORT_MAX_FILE_BYTES){setStatus('Import blocked: file is larger than '+Math.round(PANEL_IMPORT_MAX_FILE_BYTES/1024/1024)+' MB.','danger'); return}
  const format=detectPanelImportFormat(file);
  if(!format){setStatus('Unsupported file. Use PDF, PPTX, or ODP.','danger'); return}
  if(!importLibsReady(format)){
    setStatus(format==='pdf'?'PDF import unavailable: vendor/pdf.min.js is missing.':'Slide import unavailable: vendor/jszip.min.js is missing.','danger');
    return;
  }
  const progress=showImportProgress('Reading '+file.name+'…');
  try{
    let result;
    if(format==='pdf')  result=await importPdfAsPanels(file,progress);
    else if(format==='pptx') result=await importPptxAsPanels(file,progress);
    else if(format==='odp')  result=await importOdpAsPanels(file,progress);
    progress&&progress.close();
    if(result&&result.added){
      clearSelection(); render(); saveState(); persistLocal();
      const msg=format==='pdf'
        ? 'Imported '+result.added+' PDF page'+(result.added===1?'':'s')+' as panels.'
        : 'Imported '+result.added+' slide'+(result.added===1?'':'s')+'. Text, images, and slide background images extracted where supported — for full fidelity, export to PDF and import that.';
      setStatus(msg,'success');
    } else if(result&&result.cancelled){
      setStatus('Import cancelled.','danger');
    } else {
      setStatus('Nothing imported from that file.','danger');
    }
  } catch(err){
    progress&&progress.close();
    setStatus('Import failed: '+(err&&err.message?err.message:String(err)),'danger');
  }
}
async function importPdfAsPanels(file,progress){
  pdfjsLib.GlobalWorkerOptions.workerSrc=appPath('vendor/pdf.worker.min.js');
  const buf=await fileToArrayBuffer(file);
  const pdf=await pdfjsLib.getDocument({data:buf,disableFontFace:false,useSystemFonts:false,isEvalSupported:false}).promise;
  const total=Math.min(pdf.numPages,PANEL_IMPORT_MAX_PAGES);
  const baseName=(file.name||'PDF').replace(/\.[^.]+$/,'');
  let added=0;
  for(let i=1;i<=total;i++){
    if(progress&&progress.cancelled()) return {cancelled:true};
    progress&&progress.update('Rendering page '+i+' of '+total+'…',(i-1)/total);
    const page=await pdf.getPage(i);
    const baseVp=page.getViewport({scale:1});
    const scale=PANEL_IMPORT_TARGET_LONG_EDGE/Math.max(baseVp.width,baseVp.height);
    const vp=page.getViewport({scale});
    const cv=document.createElement('canvas');
    cv.width=Math.max(1,Math.round(vp.width));
    cv.height=Math.max(1,Math.round(vp.height));
    const cx=cv.getContext('2d');
    cx.fillStyle='#fff'; cx.fillRect(0,0,cv.width,cv.height);
    await page.render({canvasContext:cx,viewport:vp}).promise;
    const dataUrl=cv.toDataURL('image/jpeg',0.85);
    board.panels.push({id:'panel_'+id(),name:baseName+' p.'+i,bg:'blank',bgImage:dataUrl,objects:[]});
    added++;
    if(page.cleanup) page.cleanup();
  }
  if(added>0) board.active=board.panels.length-added;
  progress&&progress.update('Done',1);
  return {added};
}
function _xmlLocal(el){return el&&(el.localName||(el.tagName||'').replace(/^[^:]+:/,''))}
function _emuToPx(v){const n=parseInt(v||'0',10); return Math.round((n/914400)*96)}
function _odfLenToPx(s){if(!s) return 0; const m=String(s).match(/^(-?[\d.]+)(cm|mm|in|pt|px|pc)?$/i); if(!m) return 0; const v=parseFloat(m[1]); const u=(m[2]||'cm').toLowerCase(); if(u==='in') return Math.round(v*96); if(u==='cm') return Math.round(v/2.54*96); if(u==='mm') return Math.round(v/25.4*96); if(u==='pt') return Math.round(v/72*96); if(u==='pc') return Math.round(v*16); return Math.round(v)}
function _parseXml(text){const d=new DOMParser().parseFromString(text,'application/xml'); if(d.getElementsByTagName('parsererror').length) throw new Error('XML parse error'); return d}
function _allOfLocalName(root,name){return Array.from(root.getElementsByTagName('*')).filter(n=>_xmlLocal(n)===name)}
function _childOfLocalName(root,name){return Array.from(root.children||[]).find(n=>_xmlLocal(n)===name)}
function _extOrMimeForName(name){const ext=(String(name).split('.').pop()||'png').toLowerCase(); if(ext==='jpg'||ext==='jpeg') return 'image/jpeg'; if(ext==='gif') return 'image/gif'; if(ext==='webp') return 'image/webp'; if(ext==='svg') return 'image/svg+xml'; if(ext==='bmp') return 'image/bmp'; return 'image/png'}
function _zipPathDir(path){const p=String(path||''); const i=p.lastIndexOf('/'); return i>=0?p.slice(0,i):''}
function _zipNormalizePath(path){
  const parts=[];
  String(path||'').replace(/^\/+/,'').split('/').forEach(part=>{
    if(!part||part==='.') return;
    if(part==='..') parts.pop();
    else parts.push(part);
  });
  return parts.join('/');
}
function _pptxRelPathForPart(partPath){
  const dir=_zipPathDir(partPath);
  const name=String(partPath||'').split('/').pop();
  return (dir?dir+'/':'')+'_rels/'+name+'.rels';
}
function _pptxResolveTargetPath(ownerPartPath,target){
  const t=String(target||'');
  if(!t) return '';
  if(/^https?:\/\//i.test(t)||/^data:/i.test(t)) return t;
  if(t.startsWith('/')) return _zipNormalizePath(t);
  if(t.startsWith('ppt/')) return _zipNormalizePath(t);
  return _zipNormalizePath(_zipPathDir(ownerPartPath)+'/'+t);
}
async function _pptxReadRels(zip,ownerPartPath){
  const relsPath=_pptxRelPathForPart(ownerPartPath);
  const relsFile=zip.file(relsPath);
  const relMap={};
  if(!relsFile) return relMap;
  try{
    const rdoc=_parseXml(await relsFile.async('text'));
    Array.from(rdoc.getElementsByTagName('*')).filter(n=>_xmlLocal(n)==='Relationship').forEach(r=>{
      const id=r.getAttribute('Id'); const target=r.getAttribute('Target'); const type=r.getAttribute('Type')||'';
      if(id&&target) relMap[id]={target,path:_pptxResolveTargetPath(ownerPartPath,target),type};
    });
  }catch(_){}
  return relMap;
}
function _pptxRId(blip){
  if(!blip) return null;
  const RELN='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  let v=blip.getAttributeNS && blip.getAttributeNS(RELN,'embed');
  if(v) return v;
  v=blip.getAttribute && blip.getAttribute('r:embed');
  if(v) return v;
  v=blip.getAttributeNS && blip.getAttributeNS(RELN,'link');
  if(v) return v;
  v=blip.getAttribute && blip.getAttribute('r:link');
  if(v) return v;
  if(blip.attributes) for(const a of Array.from(blip.attributes)){
    if((a.localName||a.name||'').toLowerCase()==='embed' && a.value) return a.value;
  }
  return null;
}
const _PPTX_IMG_DIAG={skipped:[],warned:[]};
function _pptxResetDiag(){_PPTX_IMG_DIAG.skipped=[];_PPTX_IMG_DIAG.warned=[]}
async function _pptxResolveImage(zip,relMap,rId){
  const rel=relMap[rId];
  if(!rel){_PPTX_IMG_DIAG.skipped.push({rId,reason:'no rel target'}); return null}
  const target=typeof rel==='string'?rel:rel.target;
  const fullPath=typeof rel==='string'?_zipNormalizePath(rel):rel.path;
  if(/^https?:\/\//i.test(fullPath||'')){_PPTX_IMG_DIAG.warned.push({rId,target,reason:'linked external image'}); return null}
  const entry=zip.file(fullPath);
  if(!entry){_PPTX_IMG_DIAG.skipped.push({rId,target,fullPath,reason:'zip file missing'}); return null}
  const ext=(target.split('.').pop()||'').toLowerCase();
  const UNSUPPORTED=['emf','wmf','tiff','tif'];
  if(UNSUPPORTED.includes(ext)){
    _PPTX_IMG_DIAG.warned.push({rId,target,ext,reason:'browser cannot render this format'});
    return null;
  }
  const b64=await entry.async('base64');
  return 'data:'+_extOrMimeForName(target)+';base64,'+b64;
}
async function _pptxBackgroundImageFromPart(zip,partPath,seen=new Set()){
  if(!partPath||seen.has(partPath)) return '';
  seen.add(partPath);
  const entry=zip.file(partPath);
  if(!entry) return '';
  let doc; try{doc=_parseXml(await entry.async('text'))}catch(_){return ''}
  const relMap=await _pptxReadRels(zip,partPath);
  const bgEl=_allOfLocalName(doc,'bg')[0];
  if(bgEl){
    const bgBlip=_allOfLocalName(bgEl,'blip')[0];
    const bgRid=_pptxRId(bgBlip);
    if(bgRid){
      try{ const url=await _pptxResolveImage(zip,relMap,bgRid); if(url) return url }catch(_){}
    }
  }
  const layoutRel=Object.values(relMap).find(r=>/\/slideLayout$/i.test(r.type||''));
  if(layoutRel){
    const url=await _pptxBackgroundImageFromPart(zip,layoutRel.path,seen);
    if(url) return url;
  }
  const masterRel=Object.values(relMap).find(r=>/\/slideMaster$/i.test(r.type||''));
  if(masterRel){
    const url=await _pptxBackgroundImageFromPart(zip,masterRel.path,seen);
    if(url) return url;
  }
  return '';
}
async function importPptxAsPanels(file,progress){
  _pptxResetDiag();
  const buf=await fileToArrayBuffer(file);
  const zip=await JSZip.loadAsync(buf);
  const slideEntries=Object.keys(zip.files).filter(k=>/^ppt\/slides\/slide\d+\.xml$/.test(k)).sort((a,b)=>parseInt(a.match(/slide(\d+)\.xml/)[1])-parseInt(b.match(/slide(\d+)\.xml/)[1]));
  const total=Math.min(slideEntries.length,PANEL_IMPORT_MAX_PAGES);
  if(!total) throw new Error('No slides found in PPTX.');
  const baseName=(file.name||'Slides').replace(/\.[^.]+$/,'');
  let added=0, totalImgs=0;
  for(let i=0;i<total;i++){
    if(progress&&progress.cancelled()) return {cancelled:true};
    progress&&progress.update('Reading slide '+(i+1)+' of '+total+'…',i/total);
    const slidePath=slideEntries[i];
    const slideXml=await zip.file(slidePath).async('text');
    const relMap=await _pptxReadRels(zip,slidePath);
    let doc; try{doc=_parseXml(slideXml)}catch(_){continue}
    const objects=[];
    const panelBgImage=await _pptxBackgroundImageFromPart(zip,slidePath);
    for(const sp of _allOfLocalName(doc,'sp')){
      const xfrm=_allOfLocalName(sp,'xfrm')[0];
      let x=40,y=40,w=300,h=80;
      if(xfrm){
        const off=_childOfLocalName(xfrm,'off'), ext=_childOfLocalName(xfrm,'ext');
        if(off){x=_emuToPx(off.getAttribute('x')); y=_emuToPx(off.getAttribute('y'))}
        if(ext){w=_emuToPx(ext.getAttribute('cx'))||w; h=_emuToPx(ext.getAttribute('cy'))||h}
      }
      const paras=_allOfLocalName(sp,'p');
      const lines=paras.map(p=>_allOfLocalName(p,'t').map(t=>t.textContent||'').join('')).filter(s=>s.length);
      const text=lines.join('\n').trim();
      if(text){
        const html=plainTextToHtml(text);
        objects.push(makeObj('text',Math.max(0,x),Math.max(0,y),Math.max(80,w),Math.max(40,h),{fill:'none',stroke:'none',html,text,fontSize:Math.min(36,Math.max(14,Math.round(h/Math.max(1,lines.length)/1.6))),textColor:'#111827',hAlign:'left',vAlign:'top',autoScaleText:true}));
      }
    }
    for(const pic of _allOfLocalName(doc,'pic')){
      const xfrm=_allOfLocalName(pic,'xfrm')[0];
      let x=80,y=80,w=320,h=240;
      if(xfrm){
        const off=_childOfLocalName(xfrm,'off'), ext=_childOfLocalName(xfrm,'ext');
        if(off){x=_emuToPx(off.getAttribute('x')); y=_emuToPx(off.getAttribute('y'))}
        if(ext){w=_emuToPx(ext.getAttribute('cx'))||w; h=_emuToPx(ext.getAttribute('cy'))||h}
      }
      const rId=_pptxRId(_allOfLocalName(pic,'blip')[0]);
      if(!rId) continue;
      const dataUrl=await _pptxResolveImage(zip,relMap,rId); if(!dataUrl) continue;
      objects.push(makeObj('image',Math.max(0,x),Math.max(0,y),Math.max(40,w),Math.max(40,h),{src:dataUrl,fill:'none',stroke:'none',strokeWidth:0}));
      totalImgs++;
    }
    board.panels.push({id:'panel_'+id(),name:baseName+' #'+(i+1),bg:'blank',bgImage:panelBgImage,objects});
    added++;
  }
  if(added>0) board.active=board.panels.length-added;
  console.info('[DrawSplatTM import] PPTX summary:',{slides:added,imagesExtracted:totalImgs,skipped:_PPTX_IMG_DIAG.skipped,unsupportedFormat:_PPTX_IMG_DIAG.warned});
  if(_PPTX_IMG_DIAG.warned.length){
    const fmts=[...new Set(_PPTX_IMG_DIAG.warned.map(w=>w.ext.toUpperCase()))].join(', ');
    setStatus('Imported '+added+' slides. '+_PPTX_IMG_DIAG.warned.length+' image(s) in '+fmts+' format were skipped — browsers can\'t render those. Re-export images as PNG/JPEG.','danger');
  }
  return {added};
}
async function importOdpAsPanels(file,progress){
  const buf=await fileToArrayBuffer(file);
  const zip=await JSZip.loadAsync(buf);
  const contentEntry=zip.file('content.xml');
  if(!contentEntry) throw new Error('ODP is missing content.xml.');
  const doc=_parseXml(await contentEntry.async('text'));
  const pages=_allOfLocalName(doc,'page').filter(n=>n.namespaceURI&&n.namespaceURI.includes('drawing'));
  const total=Math.min(pages.length,PANEL_IMPORT_MAX_PAGES);
  if(!total) throw new Error('No slides found in ODP.');
  const baseName=(file.name||'Slides').replace(/\.[^.]+$/,'');
  let added=0;
  for(let i=0;i<total;i++){
    if(progress&&progress.cancelled()) return {cancelled:true};
    progress&&progress.update('Reading slide '+(i+1)+' of '+total+'…',i/total);
    const page=pages[i];
    const objects=[];
    for(const fr of _allOfLocalName(page,'frame')){
      const x=_odfLenToPx(fr.getAttribute('svg:x'));
      const y=_odfLenToPx(fr.getAttribute('svg:y'));
      const w=_odfLenToPx(fr.getAttribute('svg:width'))||300;
      const h=_odfLenToPx(fr.getAttribute('svg:height'))||80;
      const img=_childOfLocalName(fr,'image');
      if(img){
        let href=img.getAttributeNS && img.getAttributeNS('http://www.w3.org/1999/xlink','href');
        if(!href) href=img.getAttribute && img.getAttribute('xlink:href');
        if(!href && img.attributes) for(const a of Array.from(img.attributes)){
          if((a.localName||a.name||'').toLowerCase()==='href' && a.value){ href=a.value; break }
        }
        if(href){
          const entry=zip.file(href);
          if(entry){
            const b64=await entry.async('base64');
            const dataUrl='data:'+_extOrMimeForName(href)+';base64,'+b64;
            objects.push(makeObj('image',Math.max(0,x),Math.max(0,y),Math.max(40,w),Math.max(40,h),{src:dataUrl,fill:'none',stroke:'none',strokeWidth:0}));
          }
        }
        continue;
      }
      const tb=_childOfLocalName(fr,'text-box');
      if(tb){
        const paras=_allOfLocalName(tb,'p');
        const text=paras.map(p=>p.textContent||'').join('\n').trim();
        if(text){
          const html=plainTextToHtml(text);
          objects.push(makeObj('text',Math.max(0,x),Math.max(0,y),Math.max(80,w),Math.max(40,h),{fill:'none',stroke:'none',html,text,fontSize:Math.min(32,Math.max(14,Math.round(h/Math.max(1,paras.length)/1.6))),textColor:'#111827',hAlign:'left',vAlign:'top',autoScaleText:true}));
        }
      }
    }
    board.panels.push({id:'panel_'+id(),name:baseName+' #'+(i+1),bg:'blank',bgImage:'',objects});
    added++;
  }
  if(added>0) board.active=board.panels.length-added;
  return {added};
}
gid('importPanelsBtn')&&(gid('importPanelsBtn').onclick=()=>gid('importPanelsInput')&&gid('importPanelsInput').click());
gid('more_importPanelsBtn')&&(gid('more_importPanelsBtn').onclick=()=>{gid('moreOptionsDialog')&&gid('moreOptionsDialog').close(); gid('importPanelsInput')&&gid('importPanelsInput').click()});
gid('importPanelsInput')&&(gid('importPanelsInput').onchange=async e=>{const f=e.target.files[0]; e.target.value=''; if(f) await importPanelsFromFile(f)});

/* Collaboration has two paths: BroadcastChannel for same-browser/same-host
   sessions, and Apps Script polling for cross-device classroom rooms. */
function startLocalSync(){stopSync('local'); collabRoom=ui.collabRoom.value.trim(); if(!collabRoom)return setSyncStatus('Enter a room name first.','danger'); if(!('BroadcastChannel' in window))return setSyncStatus('This browser does not support local BroadcastChannel sync.','danger'); localChannel=new BroadcastChannel('drawsplat_'+collabRoom); localChannel.onmessage=(evt)=>{const m=evt.data||{}; if(!m||typeof m!=='object'||m.instanceId===instanceId)return; if(m.type==='board' && m.board && Array.isArray(m.board.panels)){board=m.board; migrateBoard(board); clearSelection(); connectorPendingFrom=null; persistLocal(); lastSnapshot=snapshot(); render(); setSyncStatus('Local sync active for room: '+collabRoom,'success')} if(m.type==='cursor' && m.cursor && typeof m.cursor.x==='number'){liveCursors[m.instanceId]={...m.cursor,ts:Date.now()}; requestRender()}}; setSyncStatus('Local sync active for room: '+collabRoom,'success'); broadcastLocal()}
function stopSync(which='both'){if((which==='both'||which==='local')&&localChannel){localChannel.close(); localChannel=null; liveCursors={}} if((which==='both'||which==='cloud')&&cloudTimer){clearInterval(cloudTimer); cloudTimer=null; lastCloudTs=''} if(which==='both') collabRoom=''; setSyncStatus('Sync stopped.'); if(ui.cursorStatus) ui.cursorStatus.textContent=''}
function broadcastLocal(){if(localChannel) localChannel.postMessage({type:'board',instanceId,room:collabRoom,board})}
function broadcastCursor(x,y){if(localChannel) localChannel.postMessage({type:'cursor',instanceId,room:collabRoom,cursor:{x,y,panel:board.active,name:presenceName(),color:cursorColorFor(instanceId)}})}

async function startCloudSync(){stopSync('cloud'); if(!storageAllowsGoogle())return setSyncStatus('Cloud sync requires Google storage mode in Teacher Admin.','danger'); enforceRoleLock(); collabRoom=ui.collabRoom.value.trim(); const url=googleScriptUrl(); if(!collabRoom)return setSyncStatus('Enter a room name first.','danger'); if(!url)return setSyncStatus('Add your Google Apps Script URL for cloud sync.','danger'); if(roleLock==='student'&&!cloudPassword()) return setSyncStatus('Enter the room password first.','danger'); await pullCloudRoom(true); cloudTimer=setInterval(()=>pullCloudRoom(false),4000); setSyncStatus('Cloud sync active for room: '+collabRoom,'success'); if(roleLock!=='student') pushCloudRoom()}
let cloudPushPending=false;
async function pushCloudRoom(){if(!cloudTimer&& !ui.syncStatus.textContent.includes('Cloud sync active')) return; enforceRoleLock(); const url=googleScriptUrl(); if(!url||!collabRoom||cloudPushPending) return; cloudPushPending=true; try{const res=await fetch(url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'roomSave',room:collabRoom,password:cloudPassword(),role:board.mode||'teacher',instanceId,board})}); const out=await res.json(); if(out.ok && out.updatedAt) lastCloudTs=out.updatedAt; else if(out.error) setSyncStatus(out.error,'danger')}catch(err){} finally{cloudPushPending=false}}
async function pullCloudRoom(force){const url=googleScriptUrl(); if(!url||!collabRoom) return; try{const ref='?action=roomLoad&room='+encodeURIComponent(collabRoom)+'&password='+encodeURIComponent(cloudPassword())+(force?'':'&since='+encodeURIComponent(lastCloudTs||'')); const res=await fetch(url+ref); const out=await res.json(); if(out.ok && out.board && out.updatedAt && out.updatedAt!==lastCloudTs && out.instanceId!==instanceId){board=out.board; migrateBoard(board); enforceRoleLock(); clearSelection(); connectorPendingFrom=null; persistLocal(); lastSnapshot=snapshot(); lastCloudTs=out.updatedAt; render(); setSyncStatus('Cloud sync active for room: '+collabRoom,'success')} else if(out.ok && out.updatedAt){lastCloudTs=out.updatedAt} else if(out.error){setSyncStatus(out.error,'danger')}}catch(err){setSyncStatus('Cloud sync error: '+err.message,'danger')}}
gid('startSyncBtn').onclick=startLocalSync;
gid('startCloudSyncBtn').onclick=startCloudSync;
gid('stopSyncBtn').onclick=()=>stopSync('both');
gid('refreshCloudBtn').onclick=()=>pullCloudRoom(true);

/* Templates are plain board objects generated from code. They are grouped on
   insertion so teachers can move or resize the scaffold as one unit. */
function templateObjects(name){const objs=[]; const add=(o)=>objs.push(o);
  if(name==='frayer'){add(makeObj('rect',60,60,460,300,{fill:'#fff'})); add(makeObj('line',290,60,0,300,{fill:'none'})); add(makeObj('line',60,210,460,0,{fill:'none'})); add(makeObj('rect',180,20,220,40,{fill:'#FFF7E6',html:tplText('frayerTitle'),text:tplText('frayerTitle'),hAlign:'center',vAlign:'middle',fontSize:22})); [[tplText('definition'),80,90],[tplText('characteristics'),320,90],[tplText('examples'),80,240],[tplText('nonExamples'),320,240]].forEach(([t,x,y])=>add(makeObj('text',x,y,170,44,{fill:'none',stroke:'none',html:t,text:t,fontSize:20,autoScaleText:true})))}
  if(name==='kwl'){add(makeObj('rect',50,70,540,290,{fill:'#fff'})); add(makeObj('line',230,70,0,290,{fill:'none'})); add(makeObj('line',410,70,0,290,{fill:'none'})); [tplText('kwlKnow'),tplText('kwlWant'),tplText('kwlLearned')].forEach((t,i)=>add(makeObj('rect',50+i*180,20,180,50,{fill:'#FFF7E6',html:t,text:t,hAlign:'center',vAlign:'middle',fontSize:20,autoScaleText:true})))}
  if(name==='tchart'){add(makeObj('line',320,70,0,280,{fill:'none',strokeWidth:5})); add(makeObj('line',80,70,480,0,{fill:'none',strokeWidth:5})); add(makeObj('text',90,20,200,40,{fill:'none',stroke:'none',html:tplText('sideA'),text:tplText('sideA'),fontSize:24,autoScaleText:true})); add(makeObj('text',350,20,200,40,{fill:'none',stroke:'none',html:tplText('sideB'),text:tplText('sideB'),fontSize:24,autoScaleText:true}))}
  if(name==='storyboard'){for(let i=0;i<4;i++){const x=50+(i%2)*290,y=50+Math.floor(i/2)*190; add(makeObj('rect',x,y,240,140,{fill:'#fff'})); add(makeObj('text',x+10,y+145,220,30,{fill:'none',stroke:'none',html:tplText('caption'),text:tplText('caption'),fontSize:18,autoScaleText:true}))}}
  if(name==='venn'){add(makeObj('ellipse',120,90,220,200,{fill:'#dbeafe'})); add(makeObj('ellipse',260,90,220,200,{fill:'#fde68a'})); add(makeObj('text',150,120,100,30,{fill:'none',stroke:'none',html:'A',text:'A',fontSize:28})); add(makeObj('text',380,120,100,30,{fill:'none',stroke:'none',html:'B',text:'B',fontSize:28})); add(makeObj('text',250,170,100,30,{fill:'none',stroke:'none',html:tplText('both'),text:tplText('both'),fontSize:20,hAlign:'center',autoScaleText:true}))}
  if(name==='brainstorm'){add(makeObj('ellipse',230,140,180,100,{fill:'#FFF7E6',html:tplText('mainIdea'),text:tplText('mainIdea'),hAlign:'center',vAlign:'middle',autoScaleText:true})); [[80,40],[420,40],[40,230],[460,230],[220,280]].forEach((p,i)=>{add(makeObj('sticky',p[0],p[1],120,90,{fill:['#fff59d','#bae6fd','#bbf7d0','#fecdd3','#fed7aa'][i%5],html:tplText('idea'),text:tplText('idea'),autoScaleText:true})); add(makeObj('connector',0,0,0,0,{fromId:objs[0]?.id||'',toId:objs[objs.length-1].id,fill:'none'}))})}
  if(name==='timeline'){add(makeObj('line',80,220,500,0,{fill:'none',strokeWidth:5})); for(let i=0;i<5;i++){const x=100+i*110,t=tplText('event')+' '+(i+1); add(makeObj('ellipse',x,200,20,20,{fill:'#1E398D'})); add(makeObj('text',x-40,150,100,40,{fill:'none',stroke:'none',html:t,text:t,fontSize:18,hAlign:'center',autoScaleText:true}))}}
  return objs}
function fitTemplateObjectsToFrame(objects){
  const ids=objects.filter(o=>o.type!=='connector').map(o=>o.id), b=selectionBounds(ids);
  if(!b||!b.w||!b.h) return;
  const vw=Math.max(640,svg.clientWidth/zoom), vh=Math.max(420,svg.clientHeight/zoom);
  const targetW=vw*0.82,targetH=vh*0.78,scale=Math.min(targetW/b.w,targetH/b.h);
  const nextW=b.w*scale,nextH=b.h*scale,nextX=(vw-nextW)/2,nextY=Math.max(24,(vh-nextH)/2);
  objects.forEach(o=>{
    if(o.type==='connector') return;
    o.x=nextX+(o.x-b.x)*scale;
    o.y=nextY+(o.y-b.y)*scale;
    o.w=Math.max(20,o.w*scale);
    o.h=Math.max(20,o.h*scale);
    if(TEXTABLE_TYPES.includes(o.type)&&o.autoScaleText) o.fontSize=clamp(Math.round((o.fontSize||20)*scale),8,96);
  });
}
function insertTemplate(newPanel){const name=ui.templateSelect.value; if(newPanel&&!addPanel()) return; const objects=templateObjects(name); const groupId='grp_tpl_'+id(); objects.forEach(o=>{o.groupId=groupId; if(board.assignmentMode&&board.mode==='teacher'&&board.currentLayer==='shared') o.layer='teacher'}); panel().objects.push(...objects); selectedIds=objects.filter(o=>o.type!=='connector').map(o=>o.id); fitTemplateObjectsToFrame(objects); render(); saveState(); setStatus('Template inserted full-size and grouped. Drag the blue corner handle to resize it.','success')}
gid('insertTemplateBtn').onclick=()=>insertTemplate(false);
gid('newTemplatePanelBtn').onclick=()=>insertTemplate(true);

async function saveToGoogle(){const url=googleScriptUrl(); if(!url)return setStatus('Add your Google Apps Script Web App URL first.','danger'); setStatus('Saving board to Google Drive and Sheets...'); try{const png=await exportPng(); const res=await fetch(url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'save',board,png})}); const out=await res.json(); if(out.ok)setStatus('Saved: '+(out.folderUrl||out.fileUrl),'success'); else setStatus(out.error||'Save failed.','danger')}catch(err){setStatus('Google save failed. '+err.message,'danger')}}
async function saveCurrentAsTemplate(){const url=googleScriptUrl(); if(!url)return setStatus('Add your Google Apps Script URL first.','danger'); const name=prompt('Template name:', board.title+' Template'); if(!name)return; const payload={name,bg:panel().bg,objects:JSON.parse(JSON.stringify(panel().objects))}; try{const res=await fetch(url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'templateSave',template:payload})}); const out=await res.json(); if(out.ok) setStatus('Template saved to Google Drive.','success'); else setStatus(out.error||'Template save failed.','danger')}catch(err){setStatus('Template save failed. '+err.message,'danger')}}
async function loadTemplateGallery(){const url=googleScriptUrl(); if(!url)return setStatus('Add your Google Apps Script URL first.','danger'); try{const res=await fetch(url+'?action=templateList'); const out=await res.json(); if(!out.ok||!out.templates||!out.templates.length) return setStatus('No templates found in Google Drive.','danger'); const menu=out.templates.map((t,i)=>`${i+1}. ${t.name}`).join('\n'); const choice=prompt('Choose a template number:\n'+menu); const idx=Math.max(1,parseInt(choice||'0',10))-1; if(!out.templates[idx]) return; const load=await fetch(url+'?action=templateLoad&templateId='+encodeURIComponent(out.templates[idx].templateId)); const loaded=await load.json(); if(loaded.ok&&loaded.template){const tpl=loaded.template; panel().bg=tpl.bg||panel().bg; panel().objects=(tpl.objects||[]).map(o=>migrateObject(o)); clearSelection(); render(); saveState(); setStatus('Template loaded: '+tpl.name,'success')} else setStatus(loaded.error||'Template load failed.','danger')}catch(err){setStatus('Template gallery failed. '+err.message,'danger')}}
async function submitTurnIn(){const url=googleScriptUrl(); if(!url)return setStatus('Add your Google Apps Script URL first.','danger'); const student=board.studentName||prompt('Student name:',board.studentName||''); if(!student)return setStatus('Enter a student name first.','danger'); board.studentName=student; ui.studentName.value=student; try{const png=await exportPng(); const res=await fetch(url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'turnInSave',turnin:{studentName:student,className:board.className,title:board.title,board},png})}); const out=await res.json(); if(out.ok) setStatus('Turn-in submitted.','success'); else setStatus(out.error||'Turn-in failed.','danger')}catch(err){setStatus('Turn-in failed. '+err.message,'danger')}}
async function reviewTurnIns(){const url=googleScriptUrl(); if(!url)return setStatus('Add your Google Apps Script URL first.','danger'); try{const res=await fetch(url+'?action=turnInList'); const out=await res.json(); if(!out.ok||!out.turnins||!out.turnins.length) return setStatus('No turn-ins found.','danger'); const menu=out.turnins.map((t,i)=>`${i+1}. ${t.studentName} — ${t.title} (${t.className||'No class'})`).join('\n'); const choice=prompt('Choose a turn-in number to load:\n'+menu); const idx=Math.max(1,parseInt(choice||'0',10))-1; if(!out.turnins[idx]) return; const load=await fetch(url+'?action=turnInLoad&turninId='+encodeURIComponent(out.turnins[idx].turninId)); const loaded=await load.json(); if(loaded.ok&&loaded.turnin&&loaded.turnin.board){board=loaded.turnin.board; migrateBoard(board); clearSelection(); initHistory(); render(); persistLocal(); setStatus('Loaded turn-in from '+(loaded.turnin.studentName||'student')+'.','success')} else setStatus(loaded.error||'Turn-in load failed.','danger')}catch(err){setStatus('Turn-in review failed. '+err.message,'danger')}}
gid('saveDriveBtn').onclick=saveToGoogle;
gid('saveTemplateBtn').onclick=saveCurrentAsTemplate;
gid('loadTemplateGalleryBtn').onclick=loadTemplateGallery;
gid('submitTurnInBtn').onclick=submitTurnIn;
gid('reviewTurnInsBtn').onclick=reviewTurnIns;
gid('loadDriveBtn').onclick=async()=>{const url=googleScriptUrl(),boardId=prompt('Paste DrawSplatTM boardId from the Sheet:'); if(!url||!boardId)return; try{const res=await fetch(url+'?action=load&boardId='+encodeURIComponent(boardId)); const out=await res.json(); if(out.ok){board=out.board; migrateBoard(board); clearSelection(); initHistory(); render(); persistLocal(); setStatus('Loaded board from Google.','success')} else setStatus(out.error||'Load failed.','danger')}catch(err){setStatus('Google load failed. '+err.message,'danger')}};
gid('settingsBtn')&&(gid('settingsBtn').onclick=()=>{window.location.href=appPath('admin/admin.html')});
gid('resetBoardBtn')?.addEventListener('click',()=>{
  askConfirm('Wipe every panel and start with a blank board? This can\'t be undone.',{okLabel:'Reset',cancelLabel:'Keep'}).then(ok=>{
    if(!ok) return;
    const optionsDlg=gid('optionsDialog'); if(optionsDlg&&optionsDlg.open) optionsDlg.close();
    stopSync('both');
    board={version:VERSION,title:'',className:'',studentName:board.studentName||'',mode:board.mode||'teacher',assignmentMode:false,currentLayer:'shared',restorePoints:[],showAnswerKey:true,active:0,panels:[{id:'panel_'+id(),name:'Panel 1',bg:'grid',objects:[]}]};
    clearSelection(); resetInteractionState();
    try{localStorage.removeItem('drawsplat.autosave')}catch(_){}
    try{if(typeof idbPut==='function') idbPut(null)}catch(_){}
    initHistory(); render(); persistLocal();
    setStatus('Board reset.','success');
  });
});
gid('closeSetup')&&(gid('closeSetup').onclick=()=>gid('setupDialog')?.close());
gid('optionsBtn').onclick=()=>gid('optionsDialog').showModal();
gid('closeOptions').onclick=()=>gid('optionsDialog').close();
gid('aboutBtn').onclick=()=>gid('aboutDialog').showModal();
gid('closeAbout').onclick=()=>gid('aboutDialog').close();
function _isInspectorMobile(){return window.matchMedia('(max-width: 1180px)').matches}
function setInspectorOpen(open){const ins=document.querySelector('.inspector'),bd=gid('inspectorBackdrop'); if(!ins) return; if(_isInspectorMobile()){ins.classList.toggle('show',open); if(bd) bd.classList.toggle('show',open)} else {document.body.classList.toggle('inspector-collapsed',!open); try{localStorage.setItem('drawsplat.inspectorOpen',open?'1':'0')}catch(_){}}}
function _isInspectorOpen(){const ins=document.querySelector('.inspector'); if(!ins) return false; if(_isInspectorMobile()) return ins.classList.contains('show'); return !document.body.classList.contains('inspector-collapsed')}
try{if(localStorage.getItem('drawsplat.inspectorOpen')==='0') document.body.classList.add('inspector-collapsed')}catch(_){}
gid('inspectorToggleBtn').onclick=()=>setInspectorOpen(!_isInspectorOpen());
gid('inspectorCloseBtn').onclick=()=>setInspectorOpen(false);
gid('inspectorBackdrop').onclick=()=>setInspectorOpen(false);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&_isInspectorMobile()&&document.querySelector('.inspector')?.classList.contains('show')) setInspectorOpen(false)});
async function loadTurnInById(turninId){const url=googleScriptUrl(); if(!url||!turninId) return; const load=await fetch(url+'?action=turnInLoad&turninId='+encodeURIComponent(turninId)); const loaded=await load.json(); if(loaded.ok&&loaded.turnin&&loaded.turnin.board){board=loaded.turnin.board; migrateBoard(board); clearSelection(); initHistory(); render(); persistLocal(); gid('moderationDialog').close(); setStatus('Loaded turn-in from '+(loaded.turnin.studentName||'student')+'.','success')}}
async function openModerationDashboard(){const comments=[]; board.panels.forEach((p,pi)=>p.objects.filter(o=>o.type==='comment').forEach(o=>comments.push({panelIndex:pi,panelName:p.name,obj:o}))); const unresolved=comments.filter(c=>!c.obj.resolved).length, resolved=comments.length-unresolved; gid('moderationSummary').innerHTML=`<span class="pill warn">${esc(unresolved)} unresolved</span> <span class="pill ok">${esc(resolved)} resolved</span> <span class="pill">${esc(comments.length)} total comments</span>`; gid('moderationComments').innerHTML=comments.length?comments.map((c,i)=>`<div class="list-item"><h4>${esc(c.panelName)} — ${c.obj.resolved?'Resolved':'Open'}</h4><p>${esc(c.obj.text||htmlToPlainText(c.obj.html)||'No text')}</p><button data-jump-comment="${i}">Jump to Comment</button></div>`).join(''):'<div class="list-item">No comments on this board.</div>'; gid('moderationComments').querySelectorAll('[data-jump-comment]').forEach(btn=>btn.onclick=()=>{const c=comments[+btn.dataset.jumpComment]; board.active=c.panelIndex; setSingleSelection(c.obj.id); gid('moderationDialog').close(); render()}); let turnins=[]; const url=googleScriptUrl(); if(url){ try{const res=await fetch(url+'?action=turnInList'); const out=await res.json(); if(out.ok&&out.turnins) turnins=out.turnins}catch(err){} } gid('moderationTurnins').innerHTML=turnins.length?turnins.map(t=>`<div class="list-item"><h4>${esc(t.studentName||'Student')} — ${esc(t.title||'Untitled')}</h4><p>${esc(t.className||'No class')} · ${esc(t.updatedAt||'')}</p><button data-load-turnin="${esc(t.turninId)}">Load Turn-In</button></div>`).join(''):'<div class="list-item">No Google turn-ins found yet.</div>'; gid('moderationTurnins').querySelectorAll('[data-load-turnin]').forEach(btn=>btn.onclick=()=>loadTurnInById(btn.dataset.loadTurnin)); gid('moderationDialog').showModal()}
// Whiteboard TNT detonation uses a single CC0 Red Library MP3 ("Huge
// Explosion with Long Decay") for a dramatic blast that matches the
// canvas-shake visual. Cached after the first play so repeat detonations
// fire instantly. Source and license live at
// assets/audio/explosions/README.md.
let _tntBoomAudio=null;
function playTntBoom(){
  try{
    if(!_tntBoomAudio){
      _tntBoomAudio=new Audio('../assets/audio/explosions/r09-52-huge-explosion-with-long-decay.mp3');
      _tntBoomAudio.preload='auto';
    }
    // Clone so a second TNT click while the first is still playing doesn't
    // cut the previous sample short.
    const node=_tntBoomAudio.cloneNode();
    node.volume=0.85;
    node.play().catch(()=>{});
  }catch(_){/* audio unavailable — visual still plays */}
}
function playCanvasDetonation(){
  const shell=document.querySelector('.canvas-shell');
  if(!shell) return;
  shell.classList.remove('tnt-detonating');
  void shell.offsetWidth;
  shell.classList.add('tnt-detonating');
  // Kick off the layered explosion audio in parallel with the visual.
  playTntBoom();
  setTimeout(()=>shell.classList.remove('tnt-detonating'),1700);
}
function clearCurrentPanelCompletely(){
  const p=panel();
  p.objects=[];
  p.bg='blank';
  p.bgImage='';
  p.canvasFill=null;
  clearSelection();
}
function runTntReset(){askConfirm('Blow up the current panel and start over?',{okLabel:'Blow up!'}).then(ok=>{if(!ok) return; const overlay=gid('boomOverlay'); overlay.classList.add('show'); playCanvasDetonation(); setTimeout(()=>{clearCurrentPanelCompletely(); render(); saveState(); setStatus('Boom! Panel cleared completely.','success')},1100); setTimeout(()=>overlay.classList.remove('show'),1700)})}

function setAudioOnCurrent(dataUrl,name='Audio note'){const o=currentObj(); if(!o||o.type!=='audio') return setStatus('Select an audio note first.','danger'); o.audioSrc=dataUrl; o.audioName=name; render(); saveState(); setStatus('Audio attached.','success')}
async function startAudioRecording(){const o=currentObj(); if(!o||o.type!=='audio') return setStatus('Select an audio note first.','danger'); if(mediaRecorder&&mediaRecorder.state==='recording'){mediaRecorder.stop(); return} if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined') return setStatus('Audio recording is not supported in this browser.','danger'); try{const stream=await navigator.mediaDevices.getUserMedia({audio:true}); recordChunks=[]; mediaRecorder=new MediaRecorder(stream); mediaRecorder.ondataavailable=e=>{if(e.data&&e.data.size) recordChunks.push(e.data)}; mediaRecorder.onstop=()=>{const blob=new Blob(recordChunks,{type:mediaRecorder.mimeType||'audio/webm'}); const r=new FileReader(); r.onload=()=>setAudioOnCurrent(r.result,'Recorded audio'); r.readAsDataURL(blob); stream.getTracks().forEach(t=>t.stop()); setButtonChrome('recordAudioBtn','Record Audio')}; mediaRecorder.start(); setButtonChrome('recordAudioBtn','Stop Recording'); setStatus('Recording audio... click again to stop.','success')}catch(err){setStatus('Audio recording failed. '+err.message,'danger')}}
function playSelectedAudio(){const o=currentObj(); if(!o||o.type!=='audio'||!o.audioSrc) return setStatus('Select an audio note with audio attached.','danger'); new Audio(o.audioSrc).play().catch(err=>setStatus('Playback failed. '+err.message,'danger'))}

/* v2.5: keyboard shortcuts dialog. Opened by '?' key or by the new button if present. */
function openShortcutsDialog(){
  let dlg=gid('shortcutsDialog');
  if(!dlg){
    dlg=document.createElement('dialog');
    dlg.id='shortcutsDialog';
    dlg.innerHTML=`<div class="modal-head"><h2>Keyboard Shortcuts</h2><button class="close" id="closeShortcutsDialog" aria-label="Close">×</button></div><dl class="shortcuts-list">
      <dt><span class="kbd">Shift</span> + click</dt><dd>Multi-select</dd>
      <dt>Drag empty canvas</dt><dd>Marquee select</dd>
      <dt><span class="kbd">Ctrl/Cmd</span> + A</dt><dd>Select all items on the current frame</dd>
      <dt><span class="kbd">Ctrl/Cmd</span> + C</dt><dd>Copy selection</dd>
      <dt><span class="kbd">Ctrl/Cmd</span> + V</dt><dd>Paste selection</dd>
      <dt><span class="kbd">Ctrl/Cmd</span> + D</dt><dd>Duplicate selection</dd>
      <dt><span class="kbd">Ctrl/Cmd</span> + G</dt><dd>Group selection</dd>
      <dt><span class="kbd">Ctrl/Cmd</span> + Shift + G</dt><dd>Ungroup selection</dd>
      <dt><span class="kbd">Ctrl/Cmd</span> + Z</dt><dd>Undo</dd>
      <dt><span class="kbd">Ctrl/Cmd</span> + Shift + Z</dt><dd>Redo</dd>
      <dt>Arrow keys</dt><dd>Nudge selected objects by 1px; hold Shift for 10px</dd>
      <dt><span class="kbd">Alt/Option</span> + Arrow keys</dt><dd>Align selected objects to left, right, top, or bottom</dd>
      <dt><span class="kbd">Alt/Option</span> + Shift + H</dt><dd>Align horizontal centers</dd>
      <dt><span class="kbd">Alt/Option</span> + Shift + V</dt><dd>Align vertical centers</dd>
      <dt><span class="kbd">Delete</span> / <span class="kbd">Backspace</span></dt><dd>Delete selection</dd>
      <dt>Double-click shape</dt><dd>Edit text inside</dd>
      <dt><span class="kbd">Ctrl/Cmd</span> + Enter</dt><dd>Apply inline text edits</dd>
      <dt><span class="kbd">Esc</span></dt><dd>Cancel inline text edits</dd>
      <dt><span class="kbd">?</span></dt><dd>This shortcuts dialog</dd>
    </dl>`;
    document.body.appendChild(dlg);
    dlg.querySelector('#closeShortcutsDialog').onclick=()=>dlg.close();
  }
  dlg.showModal();
}
const shortcutsBtn=document.getElementById('shortcutsBtn');
if(shortcutsBtn) shortcutsBtn.onclick=openShortcutsDialog;

async function loadAutosnapshot(){
  if(expireBrowserSessionIfNeeded()){migrateBoard(board); return}
  let s=null;
  try{ s=localStorage.getItem('drawsplat.autosave') }catch(_){}
  if(!s) s=await idbGet();
  if(s){try{board=JSON.parse(s); migrateBoard(board)}catch{}} else migrateBoard(board);
}

/* v2.5: register service worker for offline shell. Skipped on file:// where it cannot run. */
function registerServiceWorker(){
  if(!('serviceWorker' in navigator)) return;
  if(location.protocol!=='http:'&&location.protocol!=='https:') return;
  navigator.serviceWorker.register(appPath('sw.js')).catch(()=>{});
}

(async function init(){
  await loadAutosnapshot();
  ensureCloudClassroomControls();
  applyLaunchParams();
  ensureSimpleExtras();
  ensureClassroomWidgetButton();
  ensureAdvancedStickyPalette();
  ensureTopMenus();
  applyGraphLocale();
  hideSidebarTemplateSection();
  initHistory();
  applyWorkspaceMode(ui.workspaceMode?.value||'productivity',true);
  applyInterfaceMode(ui.interfaceMode?.value||'simple',true);
  refreshViewToggle?.();
  syncSimpleStickyPalette();
  syncSimpleColor();
  render();
  try{if(!localStorage.getItem('drawsplat.welcomed')){setTimeout(()=>{const w=gid('welcomeDialog'); if(w&&typeof w.showModal==='function') w.showModal()},700)}else setTimeout(showStartupTip,900)}catch(_){setTimeout(showStartupTip,900)}
  ensureWidgetTimerTick();
  registerServiceWorker();
  if(shouldAutoCloudJoin()) setTimeout(()=>startCloudSync(),500);
  /* v2.5: replay-friendly version stamp the user can read in DevTools. */
  const verEl=document.getElementById('appVersion'); if(verEl) verEl.textContent='v'+VERSION;
  const aboutVerEl=document.getElementById('aboutVersion'); if(aboutVerEl) aboutVerEl.textContent='v'+VERSION;
  document.title=(document.title||'DrawSplatTM').replace(/^DrawSplatTM(\s+v[\d.]+)?/, 'DrawSplatTM v'+VERSION);
  console.info('[DrawSplatTM] v'+VERSION+' ready');
})();

/* v2.5: language switcher (kept here so it works without i18n.js). */
(function(){
  const pages={en:appPath('app/whiteboard.html'),es:appPath('languages/index-sp.html'),vi:appPath('languages/index-vn.html'),ar:appPath('languages/index-ab.html'),zh:appPath('languages/index-cn.html'),uh:appPath('languages/index.uh.html')};
  const currentFile=(location.pathname.split('/').pop()||'whiteboard.html').toLowerCase();
  const fileLang=currentFile.includes('index-sp')?'es':currentFile.includes('index-vn')?'vi':currentFile.includes('index-ab')?'ar':currentFile.includes('index-cn')?'zh':currentFile.includes('index.uh')?'uh':'en';
  const rawLang=(window.DRAWSPLAT_LANG||document.documentElement.lang||fileLang||'en').toLowerCase();
  const current=rawLang.startsWith('es')?'es':rawLang.startsWith('vi')?'vi':rawLang.startsWith('ar')?'ar':rawLang.startsWith('zh')?'zh':(rawLang==='uh'||rawLang.startsWith('ur')||rawLang.startsWith('hi'))?'uh':'en';
  const sel=document.getElementById('languageSwitcher');
  try{localStorage.setItem('drawsplat.language',current)}catch(_){}
  if(sel){ sel.value=current; sel.addEventListener('change',()=>{try{localStorage.setItem('drawsplat.language',sel.value)}catch(_){} location.href=pages[sel.value]||appPath('app/whiteboard.html') }) }
})();

/* v2.12: modern inline SVG icon system for every core toolbar/control button. */
(function(){
  const S='stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"';
  const F='fill="currentColor"';
  const svg=body=>`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
  const icons={
    select:svg(`<path ${S} d="M5 3l12 8-5 1.5 3.5 6-3 1.7-3.4-5.9L5 18V3z"/>`),
    pen:'<img src="../assets/icons/tools/pen.png" alt="">',
    bucket:'<img src="../assets/icons/tools/bucket.png" alt="">',
    dotpaint:'<img src="../assets/icons/tools/dotpaint.png" alt="">',
    dotheart:'<img src="../assets/icons/tools/dotpictures.png" alt="">',
    eraser:'<img src="../assets/icons/tools/eraser.png" alt="">',
    laser:'<img src="../assets/icons/tools/laser.png" alt="">',
    line:'<img src="../assets/icons/tools/shape-line.png" alt="">',
    arrow:'<img src="../assets/icons/tools/shape-arrow.png" alt="">',
    rect:'<img src="../assets/icons/tools/shape-rect.png" alt="">',
    ellipse:'<img src="../assets/icons/tools/shape-ellipse.png" alt="">',
    text:'<img src="../assets/icons/tools/text.png" alt="">',
    sticky:'<img src="../assets/icons/tools/sticky.png" alt="">',
    connector:'<img src="../assets/icons/tools/adv-concept.svg" alt="">',
    diamond:'<img src="../assets/icons/tools/shape-diamond.png" alt="">',
    triangle:'<img src="../assets/icons/tools/shape-triangle.png" alt="">',
    polygon:'<img src="../assets/icons/tools/shape-polygon.png" alt="">',
    shape_star:'<img src="../assets/icons/tools/shape-star.png" alt="">',
    callout:svg(`<path ${S} d="M4 5h16v10H9l-5 4V5z"/><path ${S} d="M8 9h8M8 12h5"/>`),
    speech:svg(`<path ${S} d="M5 6h14v9H9l-4 4V6z"/><path ${S} d="M9 10h6"/>`),
    comment:svg(`<path ${S} d="M12 3a5 5 0 0 1 5 5c0 4-5 9-5 9S7 12 7 8a5 5 0 0 1 5-5z"/><circle ${F} cx="12" cy="8" r="1.4"/><path ${S} d="M9 21h6"/>`),
    audio:svg(`<path ${S} d="M12 4a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V7a3 3 0 0 0-3-3z"/><path ${S} d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/>`),
    undo:svg(`<path ${S} d="M9 7H4v5"/><path ${S} d="M4 12a8 8 0 1 0 2.3-5.7L4 8"/>`),
    redo:svg(`<path ${S} d="M15 7h5v5"/><path ${S} d="M20 12a8 8 0 1 1-2.3-5.7L20 8"/>`),
    cloudUp:svg(`<path ${S} d="M7 18h10a4 4 0 0 0 .4-8 6 6 0 0 0-11.3 1.7A3.5 3.5 0 0 0 7 18z"/><path ${S} d="M12 16V9M9 12l3-3 3 3"/>`),
    cloudDown:'<img src="../assets/icons/tools/adv-cloud-down.png" alt="">',
    image:svg(`<rect ${S} x="4" y="5" width="16" height="14" rx="2"/><circle ${S} cx="9" cy="10" r="1.5"/><path ${S} d="M5 17l5-5 4 4 2-2 3 3"/>`),
    file:svg(`<path ${S} d="M7 3h7l5 5v13H7V3z"/><path ${S} d="M14 3v6h5"/><path ${S} d="M9 14h6M9 17h4"/>`),
    coloringBook:svg(`<path ${S} d="M6 3h10l4 4v14H6V3z"/><path ${S} d="M16 3v5h4"/><circle ${S} cx="13" cy="13" r="2.2"/><path ${S} d="M13 10V7M13 16v3M10 13H7M16 13h3M10.9 10.9l-2-2M15.1 15.1l2 2M15.1 10.9l2-2M10.9 15.1l-2 2"/>`),
    pdf:svg(`<path ${S} d="M7 3h7l5 5v13H7V3z"/><path ${S} d="M14 3v6h5"/><path ${S} d="M8.5 16h7"/>`),
    tnt:svg(`<g transform="rotate(-8 12 12)"><rect x="4.5" y="9" width="5.2" height="10" rx="1.5" fill="#ef4444" stroke="#7f1d1d" stroke-width="1.4"/><rect x="9.4" y="7" width="5.2" height="12" rx="1.5" fill="#dc2626" stroke="#7f1d1d" stroke-width="1.4"/><rect x="14.3" y="9" width="5.2" height="10" rx="1.5" fill="#ef4444" stroke="#7f1d1d" stroke-width="1.4"/><path d="M5.3 12h13.4M5.3 16h13.4" stroke="#fee2e2" stroke-width="1.2" stroke-linecap="round"/><path d="M12 7c.2-2.5 2.8-4.3 5.2-3" fill="none" stroke="#111827" stroke-width="1.5" stroke-linecap="round"/><path d="M17.4 3.8l1-1.8M18.1 4.8h2M17.2 5.5l1.3 1.5" stroke="#facc15" stroke-width="1.4" stroke-linecap="round"/></g>`),
    duplicate:'<img src="../assets/icons/tools/adv-duplicate.svg" alt="">',
    front:'<img src="../assets/icons/tools/adv-front.png" alt="">',
    back:'<img src="../assets/icons/tools/adv-back.png" alt="">',
    group:'<img src="../assets/icons/tools/adv-group.svg" alt="">',
    ungroup:svg(`<rect ${S} x="3" y="5" width="6" height="6" rx="1.5"/><rect ${S} x="15" y="5" width="6" height="6" rx="1.5"/><rect ${S} x="9" y="15" width="6" height="5" rx="1.5"/><path ${S} d="M9 8h6M12 11v4"/>`),
    star:'<img src="../assets/icons/tools/adv-star.svg" alt="">',
    stamp:'<img src="../assets/icons/tools/adv-stamp.svg" alt="">',
    adv_image:'<img src="../assets/icons/tools/adv-image.svg" alt="">',
    adv_graph:'<img src="../assets/icons/tools/adv-graph.svg" alt="">',
    adv_picgraph:'<img src="../assets/icons/tools/adv-picgraph.svg" alt="">',
    adv_chart:'<img src="../assets/icons/tools/adv-chart.svg" alt="">',
    adv_mosaic:'<img src="../assets/icons/tools/adv-mosaic.svg" alt="">',
    adv_collage:'<img src="../assets/icons/tools/adv-collage.svg" alt="">',
    adv_bg:'<img src="../assets/icons/tools/adv-bg.svg" alt="">',
    adv_eraser:'<img src="../assets/icons/tools/adv-eraser.svg" alt="">',
    adv_ungroup:'<img src="../assets/icons/tools/adv-ungroup.svg" alt="">',
    adv_mermaid:'<img src="../assets/icons/tools/adv-mermaid.svg" alt="">',
    adv_wordcloud:'<img src="../assets/icons/tools/adv-wordcloud.svg" alt="">',
    adv_share:'<img src="../assets/icons/tools/adv-share.svg" alt="">',
    plus:svg(`<path ${S} d="M12 5v14M5 12h14"/>`),
    template:svg(`<rect ${S} x="4" y="5" width="16" height="14" rx="2"/><path ${S} d="M4 11h16M10 5v14"/>`),
    panel:svg(`<rect ${S} x="4" y="5" width="16" height="14" rx="2"/><path ${S} d="M8 9h8M8 13h5"/>`),
    save:svg(`<path ${S} d="M4 4h13l3 3v13H4V4z"/><path ${S} d="M7 4v6h9V4"/><path ${S} d="M8 16h8v4H8z"/><path ${S} d="M14 6v2"/><path ${S} d="M8 13h8"/>`),
    library:'<img src="../assets/icons/tools/adv-library.svg" alt="">',
    edit:svg(`<path ${S} d="M4 20l4-1 10-10-3-3L5 16l-1 4z"/><path ${S} d="M13.5 7.5l3 3"/>`),
    trash:svg(`<path ${S} d="M5 7h14M10 11v6M14 11v6M8 7l1-3h6l1 3M7 7l1 13h8l1-13"/>`),
    clear:svg(`<path ${S} d="M4 18h16M8 18l-3-5 8-8 5 5-8 8H8z"/><path ${S} d="M12 6l5 5"/>`),
    restore:svg(`<path ${S} d="M8 7H4v4"/><path ${S} d="M4 11a8 8 0 1 0 2.3-5.7L4 8"/><path ${S} d="M12 8v5l3 2"/>`),
    check:svg(`<path ${S} d="M4 13l5 5L20 6"/>`),
    close:svg(`<path ${S} d="M6 6l12 12M18 6L6 18"/>`),
    mic:svg(`<path ${S} d="M12 4a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0V7a3 3 0 0 0-3-3z"/><path ${S} d="M5 11a7 7 0 0 0 14 0M12 18v3"/>`),
    music:svg(`<path ${S} d="M9 18a3 3 0 1 1-2-2.8V5l11-2v11"/><path ${S} d="M18 14a3 3 0 1 1-2-2.8"/>`),
    play:'<img src="../assets/icons/tools/adv-play.svg" alt="">',
    lock:'<img src="../assets/icons/tools/adv-lock.png" alt="">',
    unlock:'<img src="../assets/icons/tools/adv-unlock.png" alt="">',
    sync:'<img src="../assets/icons/tools/adv-sync.png" alt="">',
    cloudSync:'<img src="../assets/icons/tools/adv-cloud-sync.png" alt="">',
    stop:'<img src="../assets/icons/tools/adv-stop.png" alt="">',
    download:svg(`<path ${S} d="M12 4v11M8 11l4 4 4-4M5 20h14"/>`),
    folder:svg(`<path ${S} d="M3 7h7l2 3h9v9H3V7z"/>`),
    import:svg(`<path ${S} d="M12 4v10M8 10l4 4 4-4"/><path ${S} d="M5 20h14"/>`),
    settings:svg(`<path ${S} d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/><path ${S} d="M4 12h2M18 12h2M12 4v2M12 18v2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4"/>`),
    submit:svg(`<path ${S} d="M4 12l16-8-5 16-3-7-8-1z"/><path ${S} d="M12 13l8-9"/>`),
    review:svg(`<path ${S} d="M7 3h10v18H7z"/><path ${S} d="M9 8h6M9 12h4M9 16h5"/><path ${S} d="M15 18l2 2 4-5"/>`),
    shield:svg(`<path ${S} d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path ${S} d="M9 12l2 2 4-5"/>`),
    refresh:svg(`<path ${S} d="M20 6v5h-5"/><path ${S} d="M4 18v-5h5"/><path ${S} d="M18 11a6 6 0 0 0-10-4.5L4 10M6 13a6 6 0 0 0 10 4.5l4-3.5"/>`),
    zoomOut:svg(`<circle ${S} cx="11" cy="11" r="6"/><path ${S} d="M8 11h6M16 16l4 4"/>`),
    zoomIn:svg(`<circle ${S} cx="11" cy="11" r="6"/><path ${S} d="M8 11h6M11 8v6M16 16l4 4"/>`),
    keyboard:svg(`<rect ${S} x="3" y="6" width="18" height="12" rx="2"/><path ${S} d="M7 10h.01M11 10h.01M15 10h.01M18 10h.01M7 14h10"/>`),
    options:svg(`<circle ${F} cx="12" cy="5" r="1.8"/><circle ${F} cx="12" cy="12" r="1.8"/><circle ${F} cx="12" cy="19" r="1.8"/>`),
    info:svg(`<circle ${S} cx="12" cy="12" r="9"/><path ${S} d="M12 11v6M12 7h.01"/>`),
    switch:svg(`<path ${S} d="M7 7h13l-4-4M17 17H4l4 4"/>`),
    bg:'<img src="../assets/icons/tools/bg.png" alt="">',
    textgroup:'<img src="../assets/icons/tools/textgroup.png" alt="">',
    imagegroup:'<img src="../assets/icons/tools/imagegroup.png" alt="">',
    pop_image:'<img src="../assets/icons/tools/insert-image.png" alt="">',
    pop_coloring:'<img src="../assets/icons/tools/insert-coloring.png" alt="">',
    pop_graph:'<img src="../assets/icons/tools/insert-graph.png" alt="">',
    pop_picgraph:'<img src="../assets/icons/tools/insert-picgraph.png" alt="">',
    pop_widgets:'<img src="../assets/icons/tools/insert-widgets.png" alt="">',
    pop_spinner:'<img src="../assets/icons/tools/insert-spinner.png" alt="">',
    pop_mosaic:'<img src="../assets/icons/tools/insert-mosaic.png" alt="">',
    pop_collage:'<img src="../assets/icons/tools/insert-collage.png" alt="">',
    pop_emoji:'<img src="../assets/icons/tools/insert-emoji.png" alt="">',
    pop_gif:'<img src="../assets/icons/tools/insert-gif.png" alt="">',
    pop_mermaid:'<img src="../assets/icons/tools/insert-mermaid.png" alt="">',
    pop_wordcloud:'<img src="../assets/icons/tools/insert-wordcloud.png" alt="">',
    pop_concept:'<img src="../assets/icons/tools/insert-concept.png" alt="">',
    pop_dotpic:'<img src="../assets/icons/tools/insert-dotpic.png" alt="">',
    pop_trash:'<img src="../assets/icons/tools/trash.png" alt="">',
    pop_tnt:'<img src="../assets/icons/tools/tnt.png" alt="">',
    clearBg:'<img src="../assets/icons/tools/adv-clearbg.svg" alt="">',
    prev:svg(`<path ${S} d="M15 6l-6 6 6 6"/>`),
    next:svg(`<path ${S} d="M9 6l6 6-6 6"/>`),
    more:svg(`<circle ${F} cx="5" cy="12" r="1.8"/><circle ${F} cx="12" cy="12" r="1.8"/><circle ${F} cx="19" cy="12" r="1.8"/>`),
    inspector:svg(`<rect ${S} x="4" y="4" width="16" height="16" rx="2"/><path ${S} d="M9 4v16M12 8h5M12 12h5M12 16h3"/>`),
    magic:'<img src="../assets/icons/tools/adv-magic.svg" alt="">',
    crop:svg(`<path ${S} d="M6 3v15h15"/><path ${S} d="M3 6h15v15"/><path ${S} d="M10 10h8v8"/>`),
    chart:svg(`<path ${S} d="M4 19V5M4 19h16"/><rect ${S} x="7" y="11" width="3" height="5"/><rect ${S} x="12" y="8" width="3" height="8"/><rect ${S} x="17" y="6" width="3" height="10"/>`),
    pictureGraph:svg(`<path ${S} d="M4 19V5M4 19h16"/><circle ${F} cx="8" cy="16" r="1.5"/><circle ${F} cx="8" cy="12" r="1.5"/><circle ${F} cx="13" cy="16" r="1.5"/><circle ${F} cx="13" cy="12" r="1.5"/><circle ${F} cx="13" cy="8" r="1.5"/><circle ${F} cx="18" cy="16" r="1.5"/>`),
    mermaid:svg(`<rect ${S} x="3.5" y="5" width="5" height="4" rx="1"/><rect ${S} x="15.5" y="5" width="5" height="4" rx="1"/><rect ${S} x="9.5" y="15" width="5" height="4" rx="1"/><path ${S} d="M8.5 7h7M18 9v3a3 3 0 0 1-3 3h-.5M6 9v3a3 3 0 0 0 3 3h.5"/>`),
    shapeGroup:'<img src="../assets/icons/tools/shapes.png" alt="">',
    wordcloud:svg(`<path ${S} d="M7 17h10a4 4 0 0 0 .3-8 5.5 5.5 0 0 0-10.5 1.4A3.4 3.4 0 0 0 7 17z"/><path ${S} d="M8 13h8M10 10h4"/>`),
    concept:svg(`<circle ${S} cx="6" cy="12" r="3"/><circle ${S} cx="18" cy="7" r="3"/><circle ${S} cx="18" cy="17" r="3"/><path ${S} d="M8.8 10.8l6.4-2.7M8.8 13.2l6.4 2.7"/>`),
    openLink:svg(`<path ${S} d="M14 4h6v6"/><path ${S} d="M20 4l-9 9"/><path ${S} d="M10 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-4"/>`),
    noFill:svg(`<rect ${S} x="5" y="5" width="14" height="14" rx="2"/><path ${S} d="M5 19L19 5"/>`),
    blank:svg(`<rect ${S} x="5" y="5" width="14" height="14" rx="2"/>`),
    grid:svg(`<rect ${S} x="4" y="4" width="16" height="16" rx="1"/><path ${S} d="M4 10h16M4 15h16M10 4v16M15 4v16"/>`),
    dots:svg(`<circle ${F} cx="7" cy="7" r="1.2"/><circle ${F} cx="12" cy="7" r="1.2"/><circle ${F} cx="17" cy="7" r="1.2"/><circle ${F} cx="7" cy="12" r="1.2"/><circle ${F} cx="12" cy="12" r="1.2"/><circle ${F} cx="17" cy="12" r="1.2"/><circle ${F} cx="7" cy="17" r="1.2"/><circle ${F} cx="12" cy="17" r="1.2"/><circle ${F} cx="17" cy="17" r="1.2"/>`),
    graph:svg(`<rect ${S} x="4" y="4" width="16" height="16" rx="1"/><path ${S} d="M4 12h16M12 4v16M8 4v16M16 4v16M4 8h16M4 16h16"/>`),
    lines:svg(`<path ${S} d="M5 7h14M5 12h14M5 17h14"/>`),
    isometric:svg(`<path ${S} d="M12 3v18M4 8l8 4 8-4M4 16l8-4 8 4"/>`),
    reset:svg(`<path ${S} d="M9 5H5v4"/><path ${S} d="M5 9a8 8 0 1 0 2.3-5.7L5 6"/><path ${S} d="M9 12h6M12 9v6"/>`)
  };
  const toolIcons={select:['select','Select'],pen:['pen','Pen'],bucket:['bucket','Paint Bucket'],dotpaint:['dotpaint','Dot Paint'],eraser:['eraser','Eraser'],laser:['laser','Laser Pointer'],line:['line','Line'],arrow:['arrow','Arrow'],rect:['rect','Rectangle'],ellipse:['ellipse','Ellipse'],text:['text','Text'],sticky:['sticky','Sticky Note'],connector:['connector','Connector'],diamond:['diamond','Diamond'],triangle:['triangle','Triangle'],polygon:['polygon','Polygon'],star:['shape_star','Star'],callout:['callout','Callout'],speech:['speech','Speech'],comment:['comment','Comment'],audio:['audio','Audio']};
  const buttonIcons={
    undoBtn:['undo','Undo'],redoBtn:['redo','Redo'],saveDriveBtn:['cloudUp','Save to Google'],exportBtn:['image','Export PNG'],exportPdfBtn:['pdf','Export PDF'],tntBtn:['pop_tnt','TNT Reset'],
    imageBtn:['adv_image','Load Image'],openColoringBookDialogBtn:['pop_coloring','Coloring Book'],openGraphDialogBtn:['adv_graph','Graph Creator'],openPictureGraphDialogBtn:['adv_picgraph','Picture Graph'],openClassroomWidgetsBtn:['pop_widgets','Classroom Widgets'],openMosaicDialogBtn:['adv_mosaic','Mosaic Images'],openCollageDialogBtn:['adv_collage','Collage'],openEmojiDialogBtn:['star','Emoji Mixer'],openGifDialogBtn:['play','Create GIF'],duplicateBtn:['duplicate','Duplicate'],frontBtn:['front','Bring Front'],backBtn:['back','Send Back'],groupBtn:['group','Group'],ungroupBtn:['adv_ungroup','Ungroup'],
    dotPictureToolBtn:['dotheart','Dot Pictures'],openDotPictureLibraryBtn:['dotheart','Open Dot Picture Library'],insertDotPictureBtn:['plus','Insert Dot Picture'],activateDotPaintBtn:['dotpaint','Paint Dots'],resetDotPictureBtn:['reset','Reset Dot Picture Colors'],simpleDotPicturesBtn:['pop_dotpic','Dot Pictures'],
    openStickerLibraryBtn:['stamp','Open Sticker Library'],insertStickerBtn:['stamp','Insert Sticker'],createCustomStickerBtn:['adv_share','Create Custom Sticker'],
    insertTemplateBtn:['template','Insert Template'],newTemplatePanelBtn:['panel','New Template Panel'],saveTemplateBtn:['save','Save as Template'],loadTemplateGalleryBtn:['library','Load Gallery'],
    addPanelBtn:['plus','Add Panel'],renamePanelBtn:['edit','Rename Panel'],deletePanelBtn:['pop_trash','Delete Panel'],clearPanelBtn:['clear','Clear Panel'],
    saveRestorePointBtn:['comment','Save Restore Point'],restorePointBtn:['restore','Restore Point'],applyTextBtn:['check','Apply Text'],noFillBtn:['noFill','No fill'],
    attachStickyImageBtn:['image','Attach Sticky Image'],toggleCommentResolvedBtn:['check','Resolve/Reopen Comment'],recordAudioBtn:['mic','Record Audio'],loadAudioBtn:['music','Load Audio'],playAudioBtn:['play','Play Audio'],
    selectGroupBtn:['group','Select Group'],answerKeyBtn:['check','Answer Key'],lockBtn:['lock','Lock'],unlockBtn:['unlock','Unlock'],deleteBtn:['pop_trash','Delete'],
    startSyncBtn:['sync','Start Local Sync'],startCloudSyncBtn:['cloudSync','Start Cloud Sync'],stopSyncBtn:['stop','Stop Sync'],refreshCloudBtn:['cloudDown','Pull Cloud'],
    saveLocalBtn:['save','Save File'],loadLocalBtn:['folder','Load File'],importPanelsBtn:['import','Import Panels'],loadDriveBtn:['cloudDown','Load from Google'],settingsBtn:['settings','Open Teacher Admin'],
    submitTurnInBtn:['submit','Submit Turn-In'],reviewTurnInsBtn:['review','Review Turn-Ins'],openModerationBtn:['shield','Open Moderation Dashboard'],refreshModerationBtn:['refresh','Refresh Data'],
    zoomOutBtn:['zoomOut','Zoom Out'],zoomResetBtn:['zoomIn','Reset Zoom'],zoomInBtn:['zoomIn','Zoom In'],shortcutsBtn:['keyboard','Keyboard Shortcuts'],optionsBtn:['settings','Options'],aboutBtn:['info','About'],
    viewToggleBtn:['switch','Switch View'],loadBgImageBtn:['adv_bg','Set Background'],clearBgImageBtn:['clearBg','Clear Background'],frameNavPrev:['prev','Previous Frame'],frameNavNext:['next','Next Frame'],
    frameNavAdd:['plus','Add Frame'],clearFrameBtn:['clear','Clear Frame'],moreOptionsBtn:['more','More Options'],inspectorToggleBtn:['inspector','Toggle Inspector'],
    simpleImageBtn:['pop_image','Add Image'],simpleColoringBookBtn:['pop_coloring','Coloring Book'],simpleGraphBtn:['pop_graph','Graph Creator'],simplePictureGraphBtn:['pop_picgraph','Picture Graph'],simpleClassroomWidgetsBtn:['pop_widgets','Classroom Widgets'],simpleWheelSpinnerBtn:['pop_spinner','Wheel Spinner'],simpleMosaicBtn:['pop_mosaic','Mosaic Images'],simpleCollageBtn:['pop_collage','Collage'],simpleMermaidBtn:['pop_mermaid','Mermaid Diagram'],simpleWordCloudBtn:['pop_wordcloud','Word Cloud'],simpleConceptMapBtn:['pop_concept','Concept Map'],simpleEmojiBtn:['pop_emoji','Emoji Mixer'],simpleGifBtn:['pop_gif','Create GIF'],simpleTntBtn:['pop_tnt','TNT Reset'],simpleBgImageBtn:['bg','Set Background'],scratchCoverBtn:['adv_eraser','Scratch Cover'],simpleScratchCoverBtn:['eraser','Scratch Cover'],simpleClearBgBtn:['clearBg','Clear Background'],simpleRemoveBgColorBtn:['magic','Remove BG Color'],
    removeBgColorBtn:['magic','Remove BG Color'],simpleDeleteBtn:['pop_trash','Delete Selected'],floatDeselectBtn:['close','Deselect'],floatDeleteBtn:['pop_trash','Delete'],floatDuplicateBtn:['duplicate','Duplicate'],floatSaveBtn:['save','Download selected content'],floatEditBtn:['edit','Edit Text'],floatCropBtn:['crop','Crop Image'],floatConceptChildBtn:['plus','Add Concept Child'],floatConceptLinkBtn:['concept','Set Concept Link'],
    insertMermaidBtn:['adv_mermaid','Mermaid Diagram'],insertWordCloudBtn:['adv_wordcloud','Word Cloud'],openConceptMapDialogBtn:['connector','Concept Map'],resetBoardBtn:['reset','Reset Board'],
    closeSetup:['close','Close'],closeEmojiDialog:['close','Close'],closeGifDialog:['close','Close'],closeDotPictureDialog:['close','Close'],closeStickerDialog:['close','Close'],closeModerationDialog:['close','Close'],inlineTextCancelBtn:['close','Cancel'],inlineTextSaveBtn:['check','Done'],
    closeOptions:['close','Close'],closeAbout:['close','Close'],closeMoreOptions:['close','Close'],closeMermaid:['close','Close'],closeWordCloud:['close','Close'],
    more_saveLocalBtn:['save','Save File'],more_loadLocalBtn:['folder','Load File'],more_importPanelsBtn:['import','Import Panels'],more_exportBtn:['image','Export PNG'],more_exportPdfBtn:['pdf','Export PDF'],
    more_saveDriveBtn:['cloudUp','Save to Google'],more_loadDriveBtn:['cloudDown','Load from Google'],more_deletePanelBtn:['pop_trash','Delete Frame'],more_tntBtn:['pop_tnt','TNT Reset'],
    graphInsertBtn:['plus','Insert Graph'],graphCancelBtn:['close','Close'],pictureGraphInsertBtn:['plus','Insert Picture Graph'],pictureGraphCancelBtn:['close','Close'],mosaicCreateBtn:['plus','Create Mosaic'],mosaicCancelBtn:['close','Cancel'],collageCreateBtn:['plus','Create Collage'],collageCancelBtn:['close','Cancel'],touchMultiSelectBtn:['check','Multi-Select'],insertEmojiMixBtn:['plus','Insert Mix'],mixSelectedEmojiBtn:['magic','Mix Selected Emojis'],createGifBtn:['play','Create GIF'],downloadGifBtn:['download','Download GIF'],
    pictureGraphLoadSymbolBtn:['image','Load picture symbol'],pictureGraphClearSymbolBtn:['text','Use typed symbol'],
    wcGenerate:['wordcloud','Generate'],wcCopyPng:['image','Copy PNG'],wcCancel:['close','Cancel'],wcInsert:['check','Insert'],conceptAddChildBtn:['plus','Add Child'],conceptSetLinkBtn:['concept','Set Link'],conceptOpenLinkBtn:['openLink','Open Link'],conceptAttachImageBtn:['image','Attach Image'],conceptMapSampleBtn:['file','Sample'],conceptMapImageBtn:['image','Add image to line'],conceptMapCancelBtn:['close','Cancel'],conceptMapInsertBtn:['check','Insert Concept Map'],mermaidCopyPng:['image','Copy PNG'],mermaidCancel:['close','Cancel'],mermaidInsert:['check','Insert'],
    cropReset:['reset','Reset'],cropCancel:['close','Cancel'],cropApply:['crop','Apply'],bgRemoveCancel:['close','Cancel'],bgRemoveApply:['magic','Apply'],confirmDialogCancel:['close','Cancel'],confirmDialogOk:['check','OK'],welcomeDismiss:['check','Got it']
  };
  const keepTextIds=new Set(['saveDriveBtn','exportBtn','exportPdfBtn','tntBtn','submitTurnInBtn','reviewTurnInsBtn','openModerationBtn','refreshModerationBtn','settingsBtn','loadDriveBtn','saveLocalBtn','loadLocalBtn','importPanelsBtn','inlineTextSaveBtn','inlineTextCancelBtn','optionsBtn','aboutBtn','viewToggleBtn','zoomResetBtn','confirmDialogOk','confirmDialogCancel','welcomeDismiss']);
  function currentLabel(el,fallback){const text=(el.textContent||'').trim();return el.getAttribute('aria-label')||el.getAttribute('title')||text||fallback}
  function iconize(el,iconKey,label,withText=false){if(!el||el.dataset.iconized==='1') return;const finalLabel=currentLabel(el,label);el.dataset.iconized='1';el.classList.add('icon-btn');if(withText) el.classList.add('icon-with-text');el.setAttribute('aria-label',finalLabel);el.removeAttribute('title');el.setAttribute('data-tooltip',finalLabel);el.innerHTML=`<span class="icon-symbol" aria-hidden="true">${icons[iconKey]||iconKey}</span><span class="icon-label">${esc(finalLabel)}</span>`}
  function groupToolPalette(){
    const tools=gid('toolButtons');
    if(!tools||tools.dataset.grouped==='1') return;
    tools.dataset.grouped='1';
    function makeGroup({id:groupId,label,icon,items,className=''}){
      const details=document.createElement('details');
      details.id=groupId;
      details.className='tool-popover-group '+className;
      const summary=document.createElement('summary');
      summary.className='tool-popover-trigger icon-btn';
      summary.setAttribute('aria-label',tr(label));
      summary.setAttribute('data-tooltip',tr(label));
      summary.innerHTML=`<span class="icon-symbol" aria-hidden="true">${icons[icon]}</span><span class="icon-label">${esc(tr(label))}</span>`;
      const panelEl=document.createElement('div');
      panelEl.className='tool-popover-panel';
      items.forEach(item=>{
        const el=typeof item==='string'&&item.startsWith('#')?gid(item.slice(1)):tools.querySelector(`[data-tool="${item}"]`)||gid(item);
        if(el){el.classList.add(className||groupId); panelEl.appendChild(el)}
      });
      if(groupId==='drawToolGroup'){
        panelEl.appendChild(buildToolColorPalette());
        panelEl.appendChild(buildPenSizeControls());
        panelEl.appendChild(buildEraserSizeControls());
      }
      details.append(summary,panelEl);
      details.addEventListener('toggle',()=>{
        if(!details.open) return;
        tools.querySelectorAll('.tool-popover-group[open]').forEach(other=>{
          if(other!==details) other.open=false;
        });
      });
      panelEl.addEventListener('click',event=>{
        const btn=event.target.closest('button');
        if(!btn) return;
        if(btn.dataset.tool==='eraser'||btn.closest('.eraser-size-controls')) return;
        details.open=false;
      });
      return details;
    }
    const selectBtn=tools.querySelector('[data-tool="select"]');
    const drawGroup=makeGroup({id:'drawToolGroup',label:'Draw Tools',icon:'pen',items:['pen','bucket','eraser','laser','dotpaint','#dotPictureToolBtn'],className:'tool-group-draw'});
    const shapeGroup=makeGroup({id:'shapeToolGroup',label:'Shapes and Lines',icon:'shapeGroup',items:['line','arrow','rect','ellipse','triangle','diamond','polygon','star','connector','callout','speech'],className:'tool-group-shapes'});
    const textGroup=makeGroup({id:'textToolGroup',label:'Text and Notes',icon:'textgroup',items:['text','sticky','comment','audio'],className:'tool-group-text'});
    const insertGroup=makeGroup({id:'insertToolGroup',label:'Images and Diagrams',icon:'imagegroup',items:['#simpleImageBtn','#simpleColoringBookBtn','#simpleGraphBtn','#simplePictureGraphBtn','#simpleClassroomWidgetsBtn','#simpleWheelSpinnerBtn','#simpleMosaicBtn','#simpleCollageBtn','#simpleEmojiBtn','#simpleGifBtn','#simpleMermaidBtn','#simpleWordCloudBtn','#simpleConceptMapBtn','#simpleDotPicturesBtn'],className:'tool-group-insert'});
    const bgGroup=makeGroup({id:'backgroundToolGroup',label:'Background and Reveal',icon:'bg',items:['#simpleBgImageBtn','#simpleScratchCoverBtn','#simpleClearBgBtn','#simpleRemoveBgColorBtn'],className:'tool-group-bg'});
    const moreGroup=makeGroup({id:'moreToolGroup',label:'More Actions',icon:'options',items:['#simpleDeleteBtn','#simpleTntBtn'],className:'tool-group-more'});
    tools.append(drawGroup,shapeGroup,textGroup,insertGroup,bgGroup,moreGroup);
    if(selectBtn) selectBtn.classList.add('tool-group-nav');
    refreshToolGroupsActive();
  }
  function applyIcons(){
    ensureSimpleExtras?.();
    ensureColoringBookButton?.();
    ensurePictureGraphButton?.();
    ensureClassroomWidgetButton?.();
    ensureConceptMapButton?.();
    ensureAdvancedStickyPalette?.();
    ensureTopMenus?.();
    groupToolPalette();
    document.body.classList.add('tool-palette-condensed');
    document.querySelectorAll('#toolButtons [data-tool]').forEach(btn=>{const data=toolIcons[btn.dataset.tool];if(data) iconize(btn,data[0],data[1],false)});
    Object.entries(buttonIcons).forEach(([elid,data])=>{const el=document.getElementById(elid);if(el) iconize(el,data[0],data[1],keepTextIds.has(elid))});
    document.querySelectorAll('[data-bg]').forEach(btn=>{const label=currentLabel(btn,'Background');const map={blank:'blank',grid:'grid',dots:'dots',graph:'graph',lines:'lines',isometric:'isometric'};iconize(btn,map[btn.dataset.bg]||'grid',label,false)});
    document.querySelectorAll('input,select,textarea').forEach(el=>{
      if(el.getAttribute('aria-label')) return;
      const lbl=el.closest('.row,.checkrow')?.querySelector('label')?.textContent?.trim();
      if(lbl) el.setAttribute('aria-label',lbl);
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',applyIcons); else applyIcons();
})();

})();
