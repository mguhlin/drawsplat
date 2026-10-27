export const TEMPLATE_PHOTOS=[
 {id:'studio',alt:'Sunlit creative workspace with a blank notebook, camera, colored pencils and a plant'},
 {id:'garden',alt:'Community garden with leafy vegetables, flowers and raised growing beds'},
 {id:'library',alt:'Bright neighborhood library with wood tables, chairs and shelves of books'},
 {id:'cafe',alt:'Welcoming courtyard cafe table with bread, fruit, coffee and flowers'},
 {id:'workspace',alt:'Modern collaborative workspace with natural light, desks and green plants'},
 {id:'coast',alt:'Coastal walking trail through grasses and wildflowers above a blue ocean'},
].map(p=>({...p,src:`template-photos/${p.id}.jpg`,width:1024,height:683,name:'Photorealistic template photo — '+p.id,sample:true}));
export const PHOTO_ASSET_PATHS=TEMPLATE_PHOTOS.map(p=>p.src);
const pools={education:['library','studio','garden'],library:['library','studio'],community:['library','cafe','garden'],environment:['garden','coast'],nonprofit:['garden','library'],wellness:['garden','coast'],food:['cafe','garden'],retail:['cafe','studio'],travel:['coast','cafe','garden'],sports:['coast','garden'],technology:['workspace','studio'],professional:['workspace','studio'], 'real-estate':['workspace','cafe','coast'],arts:['studio','library']};
export function photoPlaceholder(sector='arts',index=0){const pool=pools[sector]||['studio','library','garden'],id=pool[index%pool.length];return {...TEMPLATE_PHOTOS.find(p=>p.id===id)};}
