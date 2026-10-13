/* LayoutSplat shares the original DrawSplat language picker and preference. */
(() => {
  const rows = `
skip|Skip to publication|Ir a la publicación|Đến ấn phẩm|انتقل إلى المنشور|跳到出版物|प्रकाशन पर जाएँ
studio|Publication studio|Estudio de publicaciones|Xưởng xuất bản|استوديو المنشورات|出版工作室|प्रकाशन स्टूडियो
publicationTitle|Publication title|Título de la publicación|Tên ấn phẩm|عنوان المنشور|出版物标题|प्रकाशन का शीर्षक
save|Save|Guardar|Lưu|حفظ|保存|सहेजें
apps|Apps|Aplicaciones|Ứng dụng|التطبيقات|应用|ऐप्स
file|File|Archivo|Tệp|ملف|文件|फ़ाइल
newBlank|New blank publication|Nueva publicación en blanco|Tạo ấn phẩm trống|منشور فارغ جديد|新建空白出版物|नया खाली प्रकाशन
sample|Open newsletter example|Abrir ejemplo de boletín|Mở bản tin mẫu|افتح نموذج النشرة|打开通讯示例|समाचार पत्र का उदाहरण खोलें
open|Open project|Abrir proyecto|Mở dự án|فتح مشروع|打开项目|प्रोजेक्ट खोलें
saveProject|Save project|Guardar proyecto|Lưu dự án|حفظ المشروع|保存项目|प्रोजेक्ट सहेजें
print|Print / Save as PDF|Imprimir / Guardar PDF|In / Lưu PDF|طباعة / حفظ PDF|打印 / 保存为 PDF|प्रिंट / PDF सहेजें
exportHtml|Export HTML publication|Exportar publicación HTML|Xuất ấn phẩm HTML|تصدير منشور HTML|导出 HTML 出版物|HTML प्रकाशन निर्यात करें
pageLayout|Page layout|Diseño de página|Bố cục trang|تخطيط الصفحة|页面布局|पृष्ठ लेआउट
preview|Preview|Vista previa|Xem trước|معاينة|预览|पूर्वावलोकन
designChecker|Design checker|Comprobar diseño|Kiểm tra thiết kế|فحص التصميم|设计检查|डिज़ाइन जाँच
help|Help|Ayuda|Trợ giúp|مساعدة|帮助|सहायता
earlyRelease|Layout proof|Prueba de diseño|Bản thử bố cục|نسخة اختبار التخطيط|布局验证版|लेआउट परीक्षण
undo|Undo|Deshacer|Hoàn tác|تراجع|撤销|पूर्ववत करें
redo|Redo|Rehacer|Làm lại|إعادة|重做|फिर करें
textFrame|Text frame|Marco de texto|Khung văn bản|إطار نص|文本框|टेक्स्ट फ़्रेम
picture|Picture|Imagen|Hình ảnh|صورة|图片|चित्र
rectangle|Rectangle|Rectángulo|Hình chữ nhật|مستطيل|矩形|आयत
ellipse|Ellipse|Elipse|Hình elip|شكل بيضاوي|椭圆|दीर्घवृत्त
line|Line|Línea|Đường thẳng|خط|直线|रेखा
editStory|Edit story|Editar texto enlazado|Sửa bài viết|تحرير النص المتصل|编辑文章|लेख संपादित करें
linkFrames|Link frames|Enlazar marcos|Liên kết khung|ربط الإطارات|链接文本框|फ़्रेम जोड़ें
pages|Pages|Páginas|Trang|الصفحات|页面|पृष्ठ
addPage|Add page|Añadir página|Thêm trang|إضافة صفحة|添加页面|पृष्ठ जोड़ें
duplicatePage|Duplicate page|Duplicar página|Nhân đôi trang|نسخ الصفحة|复制页面|पृष्ठ की प्रतिलिपि
deletePage|Delete page|Eliminar página|Xóa trang|حذف الصفحة|删除页面|पृष्ठ हटाएँ
startHere|Make it yours|Hazlo tuyo|Tạo dấu ấn của bạn|اجعله خاصاً بك|开始创作|इसे अपना बनाएँ
starterHint|Select an object to move or resize it. Double-click text to edit the entire linked story.|Selecciona un objeto para moverlo o cambiar su tamaño. Haz doble clic en el texto para editar todo el texto enlazado.|Chọn đối tượng để di chuyển hoặc đổi kích thước. Nhấp đúp văn bản để sửa toàn bộ bài viết liên kết.|حدد عنصراً لتحريكه أو تغيير حجمه. انقر النص مرتين لتحرير النص المتصل بالكامل.|选择对象以移动或调整大小。双击文本可编辑整篇链接文章。|वस्तु चुनकर उसका स्थान या आकार बदलें। पूरे जुड़े लेख को संपादित करने के लिए टेक्स्ट पर दो बार क्लिक करें।
roadmap|Development roadmap|Plan de desarrollo|Lộ trình phát triển|خطة التطوير|开发路线图|विकास योजना
chooseTarget|Choose a different text frame to continue this story. Esc cancels.|Elige otro marco de texto. Esc cancela.|Chọn khung văn bản khác. Esc để hủy.|اختر إطار نص مختلفاً. Esc للإلغاء.|选择另一个文本框。按 Esc 取消。|दूसरा टेक्स्ट फ़्रेम चुनें। Esc से रद्द करें।
backToEdit|Back to editing|Volver a editar|Quay lại chỉnh sửa|العودة للتحرير|返回编辑|संपादन पर लौटें
properties|Properties|Propiedades|Thuộc tính|الخصائص|属性|गुण
selectHint|Select an object to adjust its position and appearance.|Selecciona un objeto para ajustar su posición y apariencia.|Chọn đối tượng để điều chỉnh vị trí và hình thức.|حدد عنصراً لضبط موقعه ومظهره.|选择对象以调整位置和外观。|स्थान और रूप बदलने के लिए वस्तु चुनें।
positionX|X position|Posición X|Vị trí X|الموضع X|X 位置|X स्थिति
positionY|Y position|Posición Y|Vị trí Y|الموضع Y|Y 位置|Y स्थिति
width|Width|Ancho|Chiều rộng|العرض|宽度|चौड़ाई
height|Height|Alto|Chiều cao|الارتفاع|高度|ऊँचाई
rotation|Rotation|Rotación|Xoay|الدوران|旋转|घुमाव
locked|Locked|Bloqueado|Khóa|مقفل|锁定|लॉक
font|Font|Fuente|Phông chữ|الخط|字体|फ़ॉन्ट
fontSize|Size (pt)|Tamaño (pt)|Cỡ chữ (pt)|الحجم (pt)|字号 (pt)|आकार (pt)
bold|Bold|Negrita|Đậm|عريض|粗体|मोटा
color|Color|Color|Màu|اللون|颜色|रंग
lineSpacing|Line spacing|Interlineado|Giãn dòng|تباعد الأسطر|行距|पंक्ति अंतर
alignment|Alignment|Alineación|Căn chỉnh|المحاذاة|对齐|संरेखण
left|Left|Izquierda|Trái|يسار|左对齐|बाएँ
center|Center|Centro|Giữa|وسط|居中|मध्य
right|Right|Derecha|Phải|يمين|右对齐|दाएँ
justify|Justify|Justificar|Căn đều|ضبط|两端对齐|दोनों ओर
textDirection|Text direction|Dirección del texto|Hướng văn bản|اتجاه النص|文本方向|टेक्स्ट दिशा
ltr|Left to right|Izquierda a derecha|Trái sang phải|من اليسار لليمين|从左到右|बाएँ से दाएँ
rtl|Right to left|Derecha a izquierda|Phải sang trái|من اليمين لليسار|从右到左|दाएँ से बाएँ
continueStory|Continue on next page|Continuar en la siguiente página|Tiếp tục ở trang sau|متابعة في الصفحة التالية|继续到下一页|अगले पृष्ठ पर जारी रखें
fill|Fill|Relleno|Tô màu|التعبئة|填充|भराव
opacity|Opacity|Opacidad|Độ mờ|العتامة|不透明度|अपारदर्शिता
imageFit|Picture fit|Ajuste de imagen|Cách đặt ảnh|ملاءمة الصورة|图片适应方式|चित्र समायोजन
contain|Fit whole picture|Mostrar imagen completa|Hiện toàn bộ ảnh|عرض الصورة كاملة|显示完整图片|पूरा चित्र दिखाएँ
cover|Fill frame|Llenar el marco|Lấp đầy khung|ملء الإطار|填满框架|फ़्रेम भरें
bringFront|Bring to front|Traer al frente|Đưa lên trước|إحضار للمقدمة|置于顶层|सामने लाएँ
sendBack|Send to back|Enviar al fondo|Đưa ra sau|إرسال للخلف|置于底层|पीछे भेजें
duplicate|Duplicate|Duplicar|Nhân đôi|نسخ|复制|प्रतिलिपि बनाएँ
delete|Delete|Eliminar|Xóa|حذف|删除|हटाएँ
layers|Layers|Capas|Lớp|الطبقات|图层|परतें
units|Units|Unidades|Đơn vị|الوحدات|单位|इकाइयाँ
inches|Inches|Pulgadas|Inch|بوصات|英寸|इंच
centimeters|Centimeters|Centímetros|Centimét|سنتيمترات|厘米|सेंटीमीटर
picas|Picas|Picas|Pica|بيكا|派卡|पाइका
points|Points|Puntos|Point|نقاط|磅|पॉइंट
pixels|Pixels|Píxeles|Pixel|بكسلات|像素|पिक्सेल
guides|Guides|Guías|Đường gióng|الأدلة|参考线|गाइड
rulers|Rulers|Reglas|Thước|المساطر|标尺|रूलर
snap|Snap|Ajustar|Bám đường gióng|التقاط|吸附|स्नैप
zoom|Zoom|Zoom|Thu phóng|تكبير|缩放|ज़ूम
fitPage|Fit page|Ajustar página|Vừa trang|ملاءمة الصفحة|适合页面|पृष्ठ फ़िट करें
storyHint|Edit the complete story here. Its words flow through every linked frame.|Edita aquí todo el texto. Fluye por cada marco enlazado.|Sửa toàn bộ bài viết tại đây. Văn bản chảy qua mọi khung liên kết.|حرر النص كاملاً هنا. يتدفق عبر جميع الإطارات المرتبطة.|在此编辑整篇文章。文字会流入所有链接文本框。|यहाँ पूरा लेख संपादित करें। टेक्स्ट सभी जुड़े फ़्रेम में बहता है।
cancel|Cancel|Cancelar|Hủy|إلغاء|取消|रद्द करें
apply|Apply|Aplicar|Áp dụng|تطبيق|应用|लागू करें
paperSize|Paper size|Tamaño de papel|Khổ giấy|حجم الورق|纸张大小|कागज़ का आकार
landscape|Landscape|Horizontal|Ngang|أفقي|横向|क्षैतिज
margin|Margin (pt)|Margen (pt)|Lề (pt)|الهامش (pt)|页边距 (pt)|हाशिया (pt)
columns|Columns|Columnas|Cột|الأعمدة|列|स्तंभ
rows|Rows|Filas|Hàng|الصفوف|行|पंक्तियाँ
gutter|Gutter (pt)|Separación (pt)|Khoảng cột (pt)|الفاصل (pt)|间隔 (pt)|अंतर (pt)
baseline|Baseline (pt)|Línea base (pt)|Đường cơ sở (pt)|خط الأساس (pt)|基线 (pt)|आधार रेखा (pt)
showBaselines|Show baselines|Mostrar líneas base|Hiện đường cơ sở|إظهار خطوط الأساس|显示基线|आधार रेखाएँ दिखाएँ
sizeHint|Changing paper size preserves object measurements. Check any objects that now fall outside the page.|Cambiar el papel conserva las medidas de los objetos. Revisa los que quedan fuera de la página.|Đổi khổ giấy giữ nguyên kích thước đối tượng. Kiểm tra đối tượng nằm ngoài trang.|تغيير الورق يحافظ على قياسات العناصر. تحقق من العناصر خارج الصفحة.|更改纸张大小会保留对象尺寸。请检查超出页面的对象。|कागज़ बदलने पर वस्तुओं के माप सुरक्षित रहते हैं। पृष्ठ से बाहर की वस्तुएँ जाँचें।
welcome|Welcome to LayoutSplat|Bienvenido a LayoutSplat|Chào mừng đến LayoutSplat|مرحباً بك في LayoutSplat|欢迎使用 LayoutSplat|LayoutSplat में आपका स्वागत है
helpEdit|Select an object, drag it, or use the corner handle to resize it. Arrow keys move by 1 point; Shift moves by 10. Double-click a text frame to edit its whole story.|Selecciona y arrastra un objeto; usa la esquina para cambiar su tamaño. Las flechas mueven 1 punto; Mayús, 10. Doble clic para editar el texto.|Chọn và kéo đối tượng; dùng góc để đổi kích thước. Phím mũi tên di chuyển 1 point; Shift là 10. Nhấp đúp để sửa bài viết.|حدد عنصراً واسحبه أو غيّر حجمه من الزاوية. الأسهم تحرك نقطة واحدة؛ Shift عشر نقاط. انقر النص مرتين لتحريره.|选择并拖动对象，用角落手柄调整大小。方向键移动 1 磅，Shift 移动 10 磅。双击文本框编辑文章。|वस्तु चुनें और खींचें या कोने से आकार बदलें। तीर कुंजी 1 पॉइंट और Shift के साथ 10 पॉइंट चलाती है। लेख संपादन के लिए दो बार क्लिक करें।
helpLink|To link text, select a frame, choose Link frames, then select another frame. Continue on next page adds a connected frame for you.|Selecciona un marco, pulsa Enlazar marcos y selecciona otro. Continuar añade un marco en la página siguiente.|Chọn khung, nhấn Liên kết khung, rồi chọn khung khác. Tiếp tục thêm khung ở trang sau.|حدد إطاراً واختر ربط الإطارات ثم حدد إطاراً آخر. المتابعة تضيف إطاراً في الصفحة التالية.|选择文本框，点击链接文本框，再选择另一个。继续到下一页会添加链接框。|फ़्रेम चुनें, फ़्रेम जोड़ें दबाएँ, फिर दूसरा फ़्रेम चुनें। अगले पृष्ठ पर जारी रखें नया जुड़ा फ़्रेम जोड़ता है।
helpRulers|Drag from either ruler to add a guide. Double-click a custom guide to remove it. Units and zoom change the view, not the document.|Arrastra desde una regla para añadir una guía. Doble clic en una guía propia para eliminarla. Unidades y zoom solo cambian la vista.|Kéo từ thước để thêm đường gióng. Nhấp đúp đường tùy chỉnh để xóa. Đơn vị và thu phóng chỉ đổi cách xem.|اسحب من المسطرة لإضافة دليل. انقر الدليل المخصص مرتين لحذفه. الوحدات والتكبير يغيران العرض فقط.|从标尺拖动添加参考线。双击自定义参考线将其删除。单位和缩放仅改变视图。|रूलर से खींचकर गाइड जोड़ें। अपना गाइड हटाने के लिए दो बार क्लिक करें। इकाइयाँ और ज़ूम केवल दृश्य बदलते हैं।
helpPrint|Print / Save as PDF opens your browser's print dialog. Choose Save as PDF, actual size, zero margins, and no headers or footers. Preview and print use the same pages.|Imprimir abre el diálogo del navegador. Elige Guardar PDF, tamaño real, márgenes cero y sin encabezados ni pies. Vista previa e impresión usan las mismas páginas.|In mở hộp thoại trình duyệt. Chọn lưu PDF, kích thước thực, lề bằng không, không đầu/chân trang. Xem trước và in dùng cùng trang.|الطباعة تفتح حوار المتصفح. اختر حفظ PDF والحجم الفعلي وهوامش صفر وبدون ترويسات. المعاينة والطباعة تستخدمان الصفحات نفسها.|打印会打开浏览器对话框。选择保存 PDF、实际大小、零边距，并关闭页眉页脚。预览和打印使用相同页面。|प्रिंट ब्राउज़र का संवाद खोलता है। PDF, वास्तविक आकार, शून्य हाशिए और बिना शीर्ष/पाद लेख चुनें। पूर्वावलोकन और प्रिंट समान पृष्ठ उपयोग करते हैं।
helpScope|This first release proves page layout and linked text. Master pages, mail merge, rich typography, image export, and commercial print preparation are on the roadmap.|Esta versión prueba diseño y texto enlazado. Páginas maestras, combinación, tipografía avanzada, imágenes e imprenta están planificados.|Bản đầu thử bố cục và văn bản liên kết. Trang chủ, trộn thư, kiểu chữ nâng cao, xuất ảnh và in thương mại nằm trong lộ trình.|هذه النسخة تختبر التخطيط والنص المرتبط. الصفحات الرئيسية ودمج البريد والطباعة المتقدمة وتصدير الصور والطباعة التجارية ضمن الخطة.|首版验证布局和链接文本。母版、邮件合并、高级排版、图片导出和商业印刷已列入路线图。|यह पहला संस्करण लेआउट और जुड़े टेक्स्ट का परीक्षण है। मास्टर पृष्ठ, मेल मर्ज, उन्नत टाइपोग्राफ़ी, चित्र निर्यात और व्यावसायिक प्रिंट योजना में हैं।
helpSave|Work is saved in this browser when storage is available. Download a project to keep a portable copy. Fonts follow those installed on the computer.|El trabajo se guarda en este navegador si hay almacenamiento. Descarga una copia portátil. Se usan las fuentes instaladas en el equipo.|Công việc được lưu trong trình duyệt khi có bộ nhớ. Tải dự án để giữ bản di động. Phông chữ theo máy tính.|يُحفظ العمل في المتصفح عند توفر التخزين. نزّل المشروع لنسخة محمولة. الخطوط تعتمد على المثبت في الجهاز.|存储可用时，工作保存在本浏览器中。下载项目以保留可携带副本。字体取决于电脑安装情况。|स्टोरेज उपलब्ध होने पर कार्य इस ब्राउज़र में सहेजा जाता है। पोर्टेबल प्रतिलिपि के लिए प्रोजेक्ट डाउनलोड करें। फ़ॉन्ट कंप्यूटर पर स्थापित फ़ॉन्ट का उपयोग करते हैं।
close|Close|Cerrar|Đóng|إغلاق|关闭|बंद करें
pageNumber|Page {page} of {total}|Página {page} de {total}|Trang {page} / {total}|الصفحة {page} من {total}|第 {page} 页，共 {total} 页|पृष्ठ {page} / {total}
savedLocal|Saved in this browser|Guardado en este navegador|Đã lưu trong trình duyệt|محفوظ في هذا المتصفح|已保存在本浏览器|इस ब्राउज़र में सहेजा गया
recovered|Recovered the previous autosave. Download a project to keep a copy.|Se recuperó el guardado anterior. Descarga una copia del proyecto.|Đã khôi phục bản lưu trước. Tải dự án để giữ bản sao.|تمت استعادة الحفظ السابق. نزّل المشروع للاحتفاظ بنسخة.|已恢复上一份自动保存。请下载项目保留副本。|पिछला स्वतः सहेजा कार्य बहाल हुआ। प्रोजेक्ट डाउनलोड करें।
storageUnavailable|Browser storage is unavailable or full. Download a project to keep your work.|Almacenamiento no disponible o lleno. Descarga el proyecto.|Bộ nhớ không có hoặc đã đầy. Hãy tải dự án.|التخزين غير متاح أو ممتلئ. نزّل المشروع لحفظ العمل.|浏览器存储不可用或已满。请下载项目保存工作。|ब्राउज़र स्टोरेज अनुपलब्ध या भरा है। प्रोजेक्ट डाउनलोड करें।
savedProject|Project downloaded|Proyecto descargado|Đã tải dự án|تم تنزيل المشروع|项目已下载|प्रोजेक्ट डाउनलोड हुआ
opened|Project opened|Proyecto abierto|Đã mở dự án|تم فتح المشروع|项目已打开|प्रोजेक्ट खुला
invalidProject|Could not open this project. Choose a valid LayoutSplat version 1 file under 20 MB.|No se pudo abrir. Elige un archivo LayoutSplat versión 1 de menos de 20 MB.|Không mở được. Chọn tệp LayoutSplat phiên bản 1 dưới 20 MB.|تعذر الفتح. اختر ملف LayoutSplat إصدار 1 أقل من 20 MB.|无法打开。请选择小于 20 MB 的有效 LayoutSplat 版本 1 文件。|खुल नहीं सका। 20 MB से कम की वैध LayoutSplat संस्करण 1 फ़ाइल चुनें।
imageError|Choose a PNG, JPEG, or WebP picture under 8 MB.|Elige PNG, JPEG o WebP de menos de 8 MB.|Chọn ảnh PNG, JPEG hoặc WebP dưới 8 MB.|اختر صورة PNG أو JPEG أو WebP أقل من 8 MB.|请选择小于 8 MB 的 PNG、JPEG 或 WebP 图片。|8 MB से कम का PNG, JPEG या WebP चित्र चुनें।
overflow|{count} characters need another frame or more space.|{count} caracteres necesitan otro marco o más espacio.|{count} ký tự cần khung khác hoặc thêm chỗ.|{count} حرفاً بحاجة لإطار آخر أو مساحة أكبر.|{count} 个字符需要另一个文本框或更多空间。|{count} अक्षरों को दूसरा फ़्रेम या अधिक जगह चाहिए।
outside|Object extends outside the page.|El objeto sale de la página.|Đối tượng nằm ngoài trang.|العنصر يتجاوز الصفحة.|对象超出页面。|वस्तु पृष्ठ से बाहर है।
marginIssue|Object enters the page margin. Check before printing.|El objeto entra en el margen. Revísalo antes de imprimir.|Đối tượng vào lề. Kiểm tra trước khi in.|العنصر يدخل الهامش. تحقق قبل الطباعة.|对象进入页边距。请在打印前检查。|वस्तु हाशिए में है। प्रिंट से पहले जाँचें।
lowResolution|Picture resolution is about {count} ppi at this size.|Resolución de imagen: unos {count} ppp a este tamaño.|Độ phân giải ảnh khoảng {count} ppi ở cỡ này.|دقة الصورة نحو {count} ppi بهذا الحجم.|此大小下图片分辨率约为 {count} ppi。|इस आकार पर चित्र लगभग {count} ppi है।
noIssues|No layout issues found.|No se encontraron problemas de diseño.|Không có lỗi bố cục.|لا توجد مشاكل تخطيط.|未发现布局问题。|कोई लेआउट समस्या नहीं मिली।
checkScope|Checks cover overflow, page edges, margins, and picture resolution.|Se comprueban desbordamientos, bordes, márgenes y resolución.|Kiểm tra tràn chữ, mép trang, lề và độ phân giải.|الفحص يشمل النص الزائد والحواف والهوامش ودقة الصور.|检查涵盖文本溢出、页面边缘、页边距和图片分辨率。|जाँच में टेक्स्ट ओवरफ़्लो, किनारे, हाशिए और चित्र रिज़ॉल्यूशन शामिल हैं।
linkedInfo|{count} linked frames. Formatting applies to the entire story.|{count} marcos enlazados. El formato afecta a todo el texto.|{count} khung liên kết. Định dạng áp dụng cho cả bài.|{count} إطارات مرتبطة. التنسيق يطبق على النص كله.|{count} 个链接文本框。格式应用于整篇文章。|{count} जुड़े फ़्रेम। फ़ॉर्मैट पूरे लेख पर लागू होता है।
linkError|Choose a text frame from a different story.|Elige un marco de otro texto.|Chọn khung thuộc bài viết khác.|اختر إطاراً من نص مختلف.|请选择另一篇文章的文本框。|दूसरे लेख का टेक्स्ट फ़्रेम चुनें।
invalidMeasure|Enter a valid measurement. Object size must be at least 6 points.|Introduce una medida válida. Tamaño mínimo: 6 puntos.|Nhập số đo hợp lệ. Cỡ tối thiểu: 6 point.|أدخل قياساً صالحاً. أقل حجم 6 نقاط.|请输入有效尺寸。对象尺寸至少为 6 磅。|वैध माप दें। आकार कम से कम 6 पॉइंट होना चाहिए।
invalidSetup|Check page margins, guide counts, and gutter sizes.|Revisa márgenes, número de guías y separaciones.|Kiểm tra lề, số đường gióng và khoảng cách.|تحقق من الهوامش وعدد الأدلة والفواصل.|请检查页边距、参考线数量和间距。|हाशिए, गाइड संख्या और अंतर जाँचें।
replaceConfirm|Replace the current publication? Download a project first if you want to keep a copy.|¿Reemplazar la publicación? Descarga primero una copia si deseas conservarla.|Thay ấn phẩm hiện tại? Tải dự án trước để giữ bản sao.|استبدال المنشور الحالي؟ نزّل المشروع أولاً للاحتفاظ بنسخة.|替换当前出版物？如需保留副本，请先下载项目。|वर्तमान प्रकाशन बदलें? प्रतिलिपि रखने के लिए पहले प्रोजेक्ट डाउनलोड करें।
deletePageConfirm|Delete this page and its objects? Linked stories continue in their remaining frames.|¿Eliminar esta página y objetos? El texto continúa en los marcos restantes.|Xóa trang và đối tượng? Bài viết tiếp tục trong khung còn lại.|حذف الصفحة وعناصرها؟ النصوص تستمر في الإطارات المتبقية.|删除此页及其对象？文章将继续流入剩余文本框。|पृष्ठ और वस्तुएँ हटाएँ? जुड़े लेख शेष फ़्रेम में जारी रहेंगे।
pageLimit|This release supports up to 50 pages and 200 objects per page.|Esta versión admite 50 páginas y 200 objetos por página.|Bản này hỗ trợ 50 trang và 200 đối tượng mỗi trang.|هذه النسخة تدعم 50 صفحة و200 عنصر لكل صفحة.|本版支持最多 50 页，每页 200 个对象。|यह संस्करण 50 पृष्ठ और प्रति पृष्ठ 200 वस्तुओं तक समर्थित है।
exported|HTML publication downloaded|Publicación HTML descargada|Đã tải ấn phẩm HTML|تم تنزيل منشور HTML|HTML 出版物已下载|HTML प्रकाशन डाउनलोड हुआ
printReady|Choose Save as PDF in your browser's print dialog.|Elige Guardar PDF en el diálogo de impresión.|Chọn Lưu PDF trong hộp thoại in.|اختر حفظ PDF في حوار الطباعة.|请在浏览器打印对话框中选择保存 PDF。|प्रिंट संवाद में PDF सहेजें चुनें।
newText|Type your story here.|Escribe aquí tu texto.|Nhập bài viết tại đây.|اكتب النص هنا.|在此输入文章。|अपना लेख यहाँ लिखें।
saveFailed|Could not prepare the download. Your publication is still open; try again.|No se pudo descargar. La publicación sigue abierta; inténtalo otra vez.|Không tạo được bản tải. Ấn phẩm vẫn mở; thử lại.|تعذر تجهيز التنزيل. المنشور لا يزال مفتوحاً؛ حاول مجدداً.|无法准备下载。出版物仍然打开，请重试。|डाउनलोड तैयार नहीं हुआ। प्रकाशन खुला है; फिर प्रयास करें।
isolatedDraft|Imported project opened in a separate draft. Download a project before closing.|Proyecto importado en borrador separado. Descarga antes de cerrar.|Dự án nhập mở trong bản nháp riêng. Tải trước khi đóng.|المشروع المستورد في مسودة منفصلة. نزّله قبل الإغلاق.|导入项目已在独立草稿中打开。关闭前请下载。|आयातित प्रोजेक्ट अलग ड्राफ़्ट में खुला। बंद करने से पहले डाउनलोड करें।
guideAdded|Guide added. Double-click it to remove it.|Guía añadida. Doble clic para eliminarla.|Đã thêm đường gióng. Nhấp đúp để xóa.|تمت إضافة دليل. انقر مرتين لحذفه.|参考线已添加。双击删除。|गाइड जुड़ा। हटाने के लिए दो बार क्लिक करें।
lockedNotice|Unlock this object in Properties before editing it.|Desbloquea el objeto en Propiedades antes de editar.|Mở khóa trong Thuộc tính trước khi sửa.|افتح قفل العنصر في الخصائص قبل تحريره.|编辑前请在属性中解锁对象。|संपादन से पहले गुण में वस्तु का लॉक खोलें।
exportScope|HTML keeps fixed pages and uses the fonts available on the viewing computer.|HTML mantiene páginas fijas y usa las fuentes del equipo.|HTML giữ trang cố định và dùng phông chữ trên máy xem.|HTML يحافظ على الصفحات ويستخدم خطوط جهاز العرض.|HTML 保留固定页面并使用查看电脑的字体。|HTML निश्चित पृष्ठ और देखने वाले कंप्यूटर के फ़ॉन्ट उपयोग करता है।
`;
  const langs = ['en', 'es', 'vi', 'ar', 'zh', 'uh'], dict = Object.fromEntries(langs.map(l => [l, {}]));
  rows.trim().split('\n').forEach(row => { const [key, ...values] = row.split('|'); langs.forEach((lang, i) => { dict[lang][key] = values[i]; }); });
  WidgetI18n.register('layoutsplat', dict);
})();
