const {test,expect}=require('@playwright/test');
const Zip=require('../../../vendor/jszip.min.js');
const {PDFDocument}=require('../vendor/pdf-lib.min.js');
const ns='xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
const tx=(x,y,w,h)=>`<a:xfrm><a:off x="${x*12700}" y="${y*12700}"/><a:ext cx="${w*12700}" cy="${h*12700}"/></a:xfrm>`;
const rels=items=>`<Relationships>${items.map(([id,target,external])=>`<Relationship Id="${id}" Target="${target}" ${external?'TargetMode="External"':''}/>`).join('')}</Relationships>`;
const ph=idx=>`<p:nvSpPr><p:cNvPr id="${idx}"/><p:cNvSpPr/><p:nvPr><p:ph type="body" idx="${idx}"/></p:nvPr></p:nvSpPr>`;
async function fixture(page){
 const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=30;c.height=20;const g=c.getContext('2d');g.fillStyle='red';g.fillRect(0,0,30,20);g.fillStyle='#FDB719';g.fillRect(10,0,10,20);return c.toDataURL().split(',')[1];});
 const entries={
  'ppt/presentation.xml':`<p:presentation ${ns}><p:sldIdLst><p:sldId id="256" r:id="slide"/></p:sldIdLst><p:sldSz cx="9144000" cy="9144000"/></p:presentation>`,
  'ppt/_rels/presentation.xml.rels':rels([['slide','slides/slide1.xml']]),
  'ppt/slides/slide1.xml':`<p:sld ${ns}><p:cSld><p:spTree>
   <p:sp>${ph(0)}<p:spPr>${tx(0,0,540,90)}</p:spPr><p:txBody><a:bodyPr/><a:p><a:r><a:rPr sz="2400"/><a:t>Poster heading</a:t></a:r></a:p></p:txBody></p:sp>
   <p:sp><p:spPr>${tx(100,160,260,140)}<a:solidFill><a:schemeClr val="accent1"/></a:solidFill><a:ln w="38100"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill></a:ln></p:spPr><p:txBody><a:bodyPr lIns="127000" tIns="127000"/><a:lstStyle><a:lvl1pPr><a:defRPr sz="9600"/></a:lvl1pPr></a:lstStyle><a:p><a:r><a:rPr sz="1800"/><a:t>Normal </a:t></a:r><a:r><a:rPr sz="1800" b="1"/><a:t>bold</a:t></a:r><a:br/><a:r><a:rPr sz="1800"/><a:t>Next line</a:t></a:r></a:p><a:p><a:pPr marL="190500" indent="-127000"><a:buChar char="•"/></a:pPr><a:r><a:rPr sz="1800"/><a:t>Bullet</a:t></a:r></a:p></p:txBody></p:sp>
   <p:cxnSp><p:spPr>${tx(360,220,100,0)}<a:prstGeom prst="line"/><a:ln w="38100"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill></a:ln></p:spPr></p:cxnSp>
   <p:grpSp><p:grpSpPr><a:xfrm><a:off x="5080000" y="5080000"/><a:ext cx="2540000" cy="1270000"/><a:chOff x="0" y="0"/><a:chExt cx="1270000" cy="1270000"/></a:xfrm></p:grpSpPr><p:sp><p:spPr>${tx(0,0,100,100)}<a:solidFill><a:schemeClr val="accent1"/></a:solidFill></p:spPr></p:sp></p:grpSp>
   <p:graphicFrame><p:xfrm><a:off x="1270000" y="6604000"/><a:ext cx="3429000" cy="1016000"/></p:xfrm><a:graphic><a:graphicData><a:tbl><a:tblGrid><a:gridCol w="3429000"/></a:tblGrid><a:tr h="1016000"><a:tc><a:txBody><a:bodyPr/><a:p><a:r><a:rPr sz="1800"/><a:t>Table content</a:t></a:r></a:p></a:txBody></a:tc></a:tr></a:tbl></a:graphicData></a:graphic></p:graphicFrame>
   <p:pic><p:blipFill><a:blip r:embed="remote"/></p:blipFill><p:spPr>${tx(600,100,50,50)}</p:spPr></p:pic>
  </p:spTree></p:cSld></p:sld>`,
  'ppt/slides/_rels/slide1.xml.rels':rels([['layout','../slideLayouts/slideLayout1.xml'],['remote','https://example.invalid/private.png',true]]),
  'ppt/slideLayouts/slideLayout1.xml':`<p:sldLayout ${ns}><p:cSld><p:bg><p:bgPr><a:solidFill><a:schemeClr val="bg1"/></a:solidFill></p:bgPr></p:bg><p:spTree><p:sp>${ph(0)}<p:spPr>${tx(0,0,600,90)}<a:solidFill><a:schemeClr val="tx1"/></a:solidFill></p:spPr><p:txBody><a:bodyPr lIns="127000" tIns="127000" anchor="ctr"/><a:lstStyle><a:lvl1pPr algn="ctr"><a:defRPr sz="9600"><a:solidFill><a:schemeClr val="bg1"/></a:solidFill></a:defRPr></a:lvl1pPr></a:lstStyle><a:p><a:r><a:t>DO NOT RENDER TEMPLATE PROMPT</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sldLayout>`,
  'ppt/slideLayouts/_rels/slideLayout1.xml.rels':rels([['master','../slideMasters/slideMaster1.xml']]),
  'ppt/slideMasters/slideMaster1.xml':`<p:sldMaster ${ns}><p:cSld><p:spTree><p:pic><p:blipFill><a:blip r:embed="stripe"/><a:srcRect l="33333" r="33333"/></p:blipFill><p:spPr>${tx(0,0,30,720)}</p:spPr></p:pic></p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1"/></p:sldMaster>`,
  'ppt/slideMasters/_rels/slideMaster1.xml.rels':rels([['theme','../theme/theme1.xml'],['stripe','../media/stripe.png']]),
  'ppt/theme/theme1.xml':`<a:theme ${ns}><a:themeElements><a:clrScheme><a:dk1><a:srgbClr val="000000"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:accent1><a:srgbClr val="FFF2CC"/></a:accent1></a:clrScheme></a:themeElements></a:theme>`,
  'ppt/media/stripe.png':Buffer.from(png,'base64')
 };
 const zip=new Zip();for(const [path,data] of Object.entries(entries))zip.file(path,data);
 return {name:'poster.pptx',mimeType:'application/vnd.openxmlformats-officedocument.presentationml.presentation',buffer:await zip.generateAsync({type:'nodebuffer'})};
}

test('poster retains template panels, theme, cropped master artwork, connectors and rich text',async({page})=>{
 await page.addInitScript(()=>{window.pptxPaint=[];const original=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,x,y,...args){window.pptxPaint.push({text,x,y,font:this.font,color:this.fillStyle});return original.call(this,text,x,y,...args);};});
 const remote=[];page.on('request',r=>{if(r.url().includes('example.invalid'))remote.push(r.url());});
 await page.goto('/solutions/pdfsplat/');await page.locator('#fileInput').setInputFiles(await fixture(page));await expect(page.locator('#status')).toContainText('converted to PDF');
 const samples=await page.locator('#pdfCanvas').evaluate(c=>{const g=c.getContext('2d');return [[10,500],[100,40],[650,40],[110,170],[100,200],[410,220],[550,450],[650,450]].map(([x,y])=>[...g.getImageData(Math.round(x*c.width/720),Math.round(y*c.height/720),1,1).data].slice(0,3));});
 // Mobile PDF scaling anti-aliases the box edge against its pale fill.
 expect(samples[4].every(channel=>channel<100)).toBe(true);
 expect(samples.filter((_,i)=>i!==4)).toEqual([[253,183,25],[0,0,0],[255,255,255],[255,242,204],[0,0,0],[255,242,204],[255,255,255]]);
 const paint=await page.evaluate(()=>window.pptxPaint);
 expect(paint.some(p=>p.text.includes('TEMPLATE'))).toBe(false);
 const heading=paint.find(p=>p.text==='Poster');expect(heading.color).toBe('#ffffff');expect(heading.y).toBeLessThan(90);
 const normal=paint.find(p=>p.text==='Normal'),bold=paint.find(p=>p.text==='bold'),next=paint.find(p=>p.text==='Next');
 expect(normal.font).not.toContain('bold');expect(bold.font).toContain('bold');expect(bold.y).toBe(normal.y);expect(next.y-normal.y).toBeCloseTo(18*1.16,1);expect(paint.some(p=>p.text==='•')).toBe(true);
 expect(paint.find(p=>p.text==='Table').x).toBeCloseTo(107.2,1);
 expect(remote).toEqual([]);
 const pending=page.waitForEvent('download');await page.locator('#saveAsSelect').selectOption('pdf');const pdf=await PDFDocument.load(await require('fs/promises').readFile(await(await pending).path()));expect(pdf.getPageCount()).toBe(1);expect(pdf.getPage(0).getSize()).toEqual({width:720,height:720});
});
