import {templateBodyCopy} from './template-copy.mjs';
import {newPublication,uid,frame,shape,textStyle,validatePublication} from './engine.mjs';
export const EBOOK_TEMPLATES=[
 {id:'ebook-novel',name:'The Quiet Journey · novel',description:'6 × 9 in · cover, title page and two story chapters',variant:0},
 {id:'ebook-guide',name:'A Field Guide to New Ideas',description:'6 × 9 in · cover, introduction, practical chapters and checklist',variant:1},
 {id:'ebook-picture',name:'Small Wonders · illustrated story',description:'8 × 8 in · illustrated cover and picture-book spreads',variant:2},
].map(e=>({...e,type:'ebook',sector:'library',industries:['library','education','arts','community'],orientation:'portrait',designName:e.name}));
const words={
 en:['THE QUIET JOURNEY','A FIELD GUIDE TO NEW IDEAS','SMALL WONDERS','Your name','A beginning','The road ahead','Every journey begins with a question. This is where your story takes its first step. Replace these words with your own voice, and give your reader a reason to turn the page.','Notice one small thing today. Look closely, ask a question, and imagine the story it could tell.','Try it yourself','Choose a question.\nCollect what you notice.\nShare what you discover.'],
 es:['EL VIAJE TRANQUILO','GUÍA DE NUEVAS IDEAS','PEQUEÑAS MARAVILLAS','Tu nombre','Un comienzo','El camino por delante','Cada viaje empieza con una pregunta. Aquí comienza tu historia. Reemplaza estas palabras con tu propia voz e invita a seguir leyendo.','Observa algo pequeño hoy. Mira de cerca, haz una pregunta e imagina su historia.','Pruébalo','Elige una pregunta.\nRecoge tus observaciones.\nComparte tus descubrimientos.'],
 vi:['HÀNH TRÌNH BÌNH YÊN','CẨM NANG Ý TƯỞNG MỚI','ĐIỀU KỲ DIỆU NHỎ','Tên của bạn','Khởi đầu','Con đường phía trước','Mỗi hành trình bắt đầu bằng một câu hỏi. Câu chuyện của bạn bắt đầu ở đây. Thay những dòng này bằng giọng văn riêng và mời người đọc khám phá tiếp.','Hãy chú ý một điều nhỏ hôm nay. Nhìn kỹ, đặt câu hỏi và tưởng tượng câu chuyện của nó.','Tự khám phá','Chọn một câu hỏi.\nGhi lại điều bạn thấy.\nChia sẻ khám phá.'],
 ar:['الرحلة الهادئة','دليل للأفكار الجديدة','عجائب صغيرة','اسمك','بداية','الطريق أمامنا','تبدأ كل رحلة بسؤال. هنا تخطو قصتك خطوتها الأولى. استبدل هذه الكلمات بصوتك الخاص وامنح القارئ سبباً لمتابعة القراءة.','لاحظ شيئاً صغيراً اليوم. انظر عن قرب واسأل سؤالاً وتخيل قصته.','جرّب بنفسك','اختر سؤالاً.\nسجل ما تلاحظه.\nشارك ما تكتشفه.'],
 zh:['宁静之旅','新想法实践指南','小小奇迹','您的姓名','开始','前方的路','每一次旅程都始于一个问题。您的故事从这里迈出第一步。请用自己的声音替换这些文字，邀请读者继续阅读。','今天留意一件小事。仔细观察，提出问题，想象它能讲述的故事。','亲自尝试','选择一个问题。\n记录您的观察。\n分享您的发现。'],
 uh:['शांत यात्रा','नए विचारों की मार्गदर्शिका','छोटे चमत्कार','आपका नाम','एक शुरुआत','आगे का रास्ता','हर यात्रा एक प्रश्न से शुरू होती है। आपकी कहानी यहाँ अपना पहला कदम रखती है। इन शब्दों को अपनी आवाज़ से बदलें और पाठक को आगे पढ़ने का कारण दें।','आज किसी छोटी चीज़ पर ध्यान दें। पास से देखें, एक प्रश्न पूछें और उसकी कहानी की कल्पना करें।','खुद आज़माएँ','एक प्रश्न चुनें।\nअपनी टिप्पणियाँ लिखें।\nअपनी खोज साझा करें।'],
};
export function ebookPublication(id,{language='en',theme}={}){
 const entry=EBOOK_TEMPLATES.find(e=>e.id===id);if(!entry)throw Error('Unknown ebook template.');
 const w=words[language]||words.en,v=entry.variant,d=newPublication(true),ink=theme?.ink||'#233b43',accent=theme?.accent||'#b16e42',pale=theme?.pale||'#edf1e9';
 d.pages=[];d.width=v===2?576:432;d.height=v===2?576:648;d.margin=42;d.guides.columns=1;d.title=w[v];d.language=language;d.publicationType='ebook';d.templateId=id;d.ebookMetadata={author:w[3],language:language==='uh'?'hi':language,publisher:'',description:'',rights:''};
 const page=()=>{const p={id:uid(),objects:[]};d.pages.push(p);return p;};
 const text=(p,t,x,y,width,h,size=12,heading=0)=>{const key=uid(),f=frame(key,x,y,width,h);f.padding=0;if(heading)f.readingHeading=heading;d.stories[key]={text:t,frames:[f.id],marks:[],style:{...textStyle(),font:v===1?'Arial':'Georgia',size,color:ink,lineHeight:1.5,direction:language==='ar'?'rtl':'ltr',align:language==='ar'?'right':'left',weight:heading?'bold':'normal'}};p.objects.push(f);return f;};
 const art=(p,x,y,width,h)=>{const key=uid();d.assets[key]={src:'sample-art.svg',sample:true,name:'Story illustration',alt:w[7],width:1080,height:420};p.objects.push({id:uid(),type:'image',assetId:key,x,y,w:width,h,rotation:0,fit:'cover',locked:false});};
 const cover=page();cover.objects.push(shape(0,0,d.width,d.height,pale));
 if(v===0){cover.objects.push(shape(42,54,4,210,accent));text(cover,w[0],64,70,296,190,34,1);cover.objects.push(shape(64,301,258,2,accent));text(cover,w[3],64,326,296,50,14);}
 if(v===1){cover.objects.push(shape(0,0,d.width,48,ink));text(cover,w[1],42,91,348,200,33,1);cover.objects.push(shape(42,328,78,7,accent));text(cover,w[3],42,376,348,48,14);}
 if(v===2){art(cover,0,0,576,330);text(cover,w[2],42,368,492,90,34,1);text(cover,w[3],42,480,492,42,14);}
 const title=page();text(title,w[v],42,90,d.width-84,145,25,1);text(title,w[3],42,270,d.width-84,45,13);text(title,'© '+new Date().getFullYear()+' '+w[3],42,d.height-110,d.width-84,36,10);
 for(let i=0;i<2;i++){const p=page();text(p,w[i+4],42,45,d.width-84,85,24,1);if(v===2){art(p,42,150,492,238);text(p,w[7],42,418,492,110,16);}else{text(p,w[6]+'\n\n'+w[6],42,160,348,310,12);if(v===1){text(p,w[8],42,493,348,34,16,2);text(p,w[9],42,535,348,80,11);}}}
 return validatePublication(templateBodyCopy(d));
}
