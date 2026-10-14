/* LayoutSplat shares the original DrawSplat language picker and preference. */
(() => {
  const rows = `
readingOrder|Reading order|Orden de lectura|Thứ tự đọc|ترتيب القراءة|阅读顺序|पढ़ने का क्रम
readingHint|Set the HTML reading edition's text, picture and table order. Linked stories appear once. Stacking and placement stay unchanged.|Ordena textos, imágenes y tablas en la edición HTML. Las historias vinculadas aparecen una vez. No cambia las capas ni la ubicación.|Đặt thứ tự văn bản, ảnh và bảng cho bản HTML. Bài liên kết xuất hiện một lần. Không đổi lớp hay vị trí.|رتّب النص والصور والجداول في نسخة HTML. تظهر القصص المرتبطة مرة واحدة. لا يتغير التكديس أو الموضع.|设置 HTML 阅读版的文字、图片和表格顺序。链接故事仅显示一次。不改变叠放和位置。|HTML संस्करण में पाठ, चित्र और तालिका क्रम तय करें। लिंक कहानी एक बार दिखती है। परत और स्थान नहीं बदलते।
readingObject|Reading item|Elemento de lectura|Mục đọc|عنصر القراءة|阅读项目|पढ़ने का आइटम
readingEarlier|Earlier|Antes|Trước|سابق|提前|पहले
readingLater|Later|Después|Sau|لاحق|推后|बाद में
readingExclude|Omit from reading edition|Omitir en edición de lectura|Bỏ khỏi bản đọc|حذف من نسخة القراءة|从阅读版中省略|पढ़ने के संस्करण से हटाएँ
whiteboardCollection|Whiteboard backgrounds & images|Fondos e imágenes de la pizarra|Nền và ảnh bảng trắng|خلفيات وصور السبورة|白板背景与图片|व्हाइटबोर्ड पृष्ठभूमि और चित्र
backgroundCollectionHelp|Use the whiteboard's classroom organizers, ScratchArt backgrounds, coloring pages, and animal photos. Pictures are embedded in your project.|Usa organizadores, fondos ScratchArt, páginas para colorear y fotos de animales de la pizarra. Las imágenes se guardan en el proyecto.|Dùng mẫu lớp học, nền ScratchArt, trang tô màu và ảnh động vật của bảng trắng. Ảnh được nhúng vào dự án.|استخدم منظمات الفصل وخلفيات ScratchArt وصفحات التلوين وصور الحيوانات. الصور مضمنة في المشروع.|使用白板的课堂图表、ScratchArt 背景、涂色页和动物照片。图片嵌入项目中。|कक्षा आयोजक, ScratchArt पृष्ठभूमि, रंग भरने के पृष्ठ और पशु फ़ोटो उपयोग करें। चित्र प्रोजेक्ट में शामिल होते हैं।
collection|Collection|Colección|Bộ sưu tập|المجموعة|集合|संग्रह
classroomBackgrounds|Classroom organizers|Organizadores de aula|Mẫu lớp học|منظمات الفصل|课堂图表|कक्षा आयोजक
coloringPages|Coloring pages|Páginas para colorear|Trang tô màu|صفحات التلوين|涂色页|रंग भरने के पृष्ठ
animalPhotos|Animal photos|Fotos de animales|Ảnh động vật|صور الحيوانات|动物照片|पशु फ़ोटो
placement|Placement|Colocación|Vị trí|الموضع|放置|स्थान
pageBackground|Page background|Fondo de página|Nền trang|خلفية الصفحة|页面背景|पृष्ठ पृष्ठभूमि
selectedPictureBox|Selected picture box|Marco de imagen seleccionado|Khung ảnh đã chọn|إطار الصورة المحدد|所选图片框|चयनित चित्र फ़्रेम
collectionCount|{count} backgrounds and images|{count} fondos e imágenes|{count} nền và ảnh|{count} خلفيات وصور|{count} 个背景和图片|{count} पृष्ठभूमि और चित्र
resume|Resumes|Currículos|Hồ sơ nghề nghiệp|السير الذاتية|简历|रिज़्यूमे
photo-collage|Photo collages|Collages de fotos|Ghép ảnh|صور مجمعة|照片拼贴|फ़ोटो कोलाज
document|Documents|Documentos|Tài liệu|المستندات|文档|दस्तावेज़
skip|Skip to publication|Ir a la publicación|Đến ấn phẩm|انتقل إلى المنشور|跳到出版物|प्रकाशन पर जाएँ
publishingRelease|Publishing tools|Herramientas de publicación|Công cụ xuất bản|أدوات النشر|出版工具|प्रकाशन उपकरण
shapes|Shapes|Formas|Hình dạng|أشكال|形状|आकृतियाँ
linkTextBoxes|Link text boxes|Vincular cuadros de texto|Liên kết hộp văn bản|ربط مربعات النص|链接文本框|टेक्स्ट बॉक्स लिंक करें
unlinkTextBoxes|Unlink text box|Desvincular cuadro de texto|Bỏ liên kết hộp văn bản|فك ربط مربع النص|取消文本框链接|टेक्स्ट बॉक्स अलग करें
stretchPicture|Stretch to frame|Estirar al marco|Kéo giãn theo khung|تمديد إلى الإطار|拉伸填充框架|फ़्रेम में फैलाएँ
hexagon|Hexagon|Hexágono|Lục giác|سداسي|六边形|षट्भुज
transparency|Transparency|Transparencia|Độ trong suốt|الشفافية|透明度|पारदर्शिता
layerTransparency|Transparency: {name}|Transparencia: {name}|Độ trong suốt: {name}|الشفافية: {name}|透明度：{name}|पारदर्शिता: {name}
clearBrowser|Clear saved browser data|Borrar datos del navegador|Xóa dữ liệu trình duyệt|مسح بيانات المتصفح المحفوظة|清除浏览器保存的数据|सहेजा ब्राउज़र डेटा साफ़ करें
clearBrowserConfirm|Clear this LayoutSplat workspace's saved draft, recovery copy, and current publication? Save a project file first if needed. This starts a blank publication; other apps and downloaded files are kept.|¿Borrar el borrador, la recuperación y la publicación actual de LayoutSplat? Guarda un archivo si lo necesitas. Se inicia una publicación vacía; se conservan otras apps y descargas.|Xóa bản nháp, bản khôi phục và ấn phẩm hiện tại của LayoutSplat? Lưu tệp dự án trước nếu cần. Bắt đầu ấn phẩm trống; giữ ứng dụng khác và tệp đã tải.|مسح مسودة LayoutSplat ونسخة الاستعادة والمنشور الحالي؟ احفظ ملفاً أولاً عند الحاجة. يبدأ منشور فارغ وتبقى التطبيقات الأخرى والملفات المنزلة.|清除当前 LayoutSplat 工作区的草稿、恢复副本和出版物？如需保留，请先保存项目文件。将打开空白出版物，其他应用和下载文件保留。|इस LayoutSplat कार्यक्षेत्र का ड्राफ़्ट, रिकवरी और वर्तमान प्रकाशन मिटाएँ? आवश्यकता हो तो पहले प्रोजेक्ट सहेजें। खाली प्रकाशन खुलेगा; अन्य ऐप और डाउनलोड सुरक्षित रहेंगे।
browserCleared|Saved draft and recovery cleared. Start a new publication.|Borrador y recuperación borrados. Inicia una publicación.|Đã xóa bản nháp và khôi phục. Tạo ấn phẩm mới.|تم مسح المسودة والاستعادة. ابدأ منشوراً جديداً.|已清除草稿和恢复副本。开始新出版物。|ड्राफ़्ट और रिकवरी मिट गए। नया प्रकाशन शुरू करें।
templateLibrary|Template library|Biblioteca de plantillas|Thư viện mẫu|مكتبة القوالب|模板库|टेम्पलेट लाइब्रेरी
originalTemplates|Original editable designs with descriptive titles. Filter by industry or search Avery product numbers.|Diseños editables con títulos descriptivos. Filtra por sector o busca números Avery.|Mẫu chỉnh sửa với tên mô tả. Lọc ngành hoặc tìm mã Avery.|تصاميم قابلة للتحرير بأسماء وصفية. رشّح حسب المجال أو ابحث برقم Avery.|可编辑设计，标题说明样式。按行业筛选或搜索 Avery 产品编号。|वर्णनात्मक नामों वाले संपादन योग्य डिज़ाइन। उद्योग फ़िल्टर या Avery नंबर खोजें।
searchTemplates|Search templates|Buscar plantillas|Tìm mẫu|البحث في القوالب|搜索模板|टेम्पलेट खोजें
publicationType|Publication type|Tipo de publicación|Loại ấn phẩm|نوع المنشور|出版物类型|प्रकाशन प्रकार
industry|Industry|Sector|Ngành|المجال|行业|उद्योग
orientation|Orientation|Orientación|Hướng trang|الاتجاه|方向|अभिविन्यास
portrait|Portrait|Vertical|Dọc|عمودي|纵向|लंबवत
allTemplates|All|Todas|Tất cả|الكل|全部|सभी
templateLanguage|Publication language|Idioma de publicación|Ngôn ngữ ấn phẩm|لغة المنشور|出版物语言|प्रकाशन भाषा
industryPalette|Industry palette|Paleta del sector|Màu theo ngành|ألوان المجال|行业配色|उद्योग रंग
downloadTemplates|Download this collection|Descargar colección|Tải bộ mẫu này|تنزيل المجموعة|下载此集合|संग्रह डाउनलोड करें
templateCount|{count} of {total} designs|{count} de {total} diseños|{count}/{total} mẫu|{count} من {total} تصميم|{total} 个设计中的 {count} 个|{total} में से {count} डिज़ाइन
customSize|Custom size|Tamaño personalizado|Kích thước riêng|حجم مخصص|自定义尺寸|कस्टम आकार
pageWidth|Custom width (pt)|Ancho (pt)|Rộng (pt)|العرض (نقطة)|宽度（磅）|चौड़ाई (pt)
pageHeight|Custom height (pt)|Alto (pt)|Cao (pt)|الارتفاع (نقطة)|高度（磅）|ऊँचाई (pt)
safeArea|Safe inset (pt)|Margen seguro (pt)|Lề an toàn (pt)|هامش الأمان (نقطة)|安全边距（磅）|सुरक्षित किनारा (pt)
originX|Ruler origin X (pt)|Origen X (pt)|Gốc thước X (pt)|أصل المسطرة X (نقطة)|标尺原点 X（磅）|रूलर मूल X (pt)
originY|Ruler origin Y (pt)|Origen Y (pt)|Gốc thước Y (pt)|أصل المسطرة Y (نقطة)|标尺原点 Y（磅）|रूलर मूल Y (pt)
facingPages|Facing pages in preview|Páginas enfrentadas en vista previa|Trang đối diện khi xem trước|صفحات متقابلة في المعاينة|预览对页|पूर्वावलोकन में आमने-सामने पृष्ठ
lockGuides|Lock custom guides|Bloquear guías|Khóa đường dẫn riêng|قفل الأدلة المخصصة|锁定自定义参考线|कस्टम गाइड लॉक करें
horizontalRuler|Horizontal ruler|Regla horizontal|Thước ngang|المسطرة الأفقية|水平标尺|क्षैतिज रूलर
verticalRuler|Vertical ruler|Regla vertical|Thước dọc|المسطرة العمودية|垂直标尺|लंबवत रूलर
baselineAlign|Align text to baseline grid|Alinear a retícula base|Căn theo lưới đường cơ sở|محاذاة النص لشبكة الأساس|文字对齐基线网格|टेक्स्ट बेसलाइन ग्रिड पर रखें
leftMaster|Apply to left pages|Aplicar a páginas izquierdas|Áp dụng trang bên trái|تطبيق على الصفحات اليسرى|应用于左页|बाएँ पृष्ठों पर लागू करें
rightMaster|Apply to right pages|Aplicar a páginas derechas|Áp dụng trang bên phải|تطبيق على الصفحات اليمنى|应用于右页|दाएँ पृष्ठों पर लागू करें
publisherSettings|Publisher import settings|Ajustes de importación Publisher|Cài đặt nhập Publisher|إعدادات استيراد Publisher|Publisher 导入设置|Publisher आयात सेटिंग
publisherNativeNotice|Native .pub decoding runs in this browser. No LibreOffice or conversion service is required. Review converted text, fonts, and effects.|Los archivos .pub se decodifican en el navegador sin LibreOffice ni servicio externo. Revisa texto, fuentes y efectos.|Giải mã .pub trong trình duyệt, không cần LibreOffice hay dịch vụ. Kiểm tra văn bản, phông và hiệu ứng.|فك ملفات .pub داخل المتصفح دون LibreOffice أو خدمة تحويل. راجع النص والخطوط والتأثيرات.|在此浏览器中解码 .pub，无需 LibreOffice 或转换服务。请检查文字、字体和效果。|.pub ब्राउज़र में खुलता है। LibreOffice या सेवा नहीं चाहिए। टेक्स्ट, फ़ॉन्ट और प्रभाव जाँचें।
publisherEncoding|Legacy text encoding|Codificación de texto antigua|Mã hóa văn bản cũ|ترميز النص القديم|旧版文字编码|पुराना टेक्स्ट एन्कोडिंग
publisherEncodingHint|Keep Automatic for modern files. If older text is garbled, choose its original encoding and reopen the .pub.|Usa Automático para archivos actuales. Si el texto antiguo es ilegible, elige su codificación y vuelve a abrir.|Giữ Tự động cho tệp mới. Nếu chữ cũ lỗi, chọn mã hóa gốc rồi mở lại .pub.|اترك التلقائي للملفات الحديثة. إذا تشوه النص القديم فاختر الترميز الأصلي وأعد الفتح.|新文件保留自动。旧文件文字乱码时，请选择原始编码并重新打开。|नए फ़ाइल के लिए स्वचालित रखें। पुराने टेक्स्ट में त्रुटि हो तो मूल एन्कोडिंग चुनकर फिर खोलें।
publisherDecoding|Decoding Publisher locally…|Decodificando Publisher localmente…|Đang giải mã Publisher cục bộ…|فك Publisher محلياً…|正在本地解码 Publisher…|Publisher स्थानीय रूप से खुल रहा है…
automatic|Automatic|Automático|Tự động|تلقائي|自动|स्वचालित
importSuite|Import SplatWorks content|Importar contenido SplatWorks|Nhập nội dung SplatWorks|استيراد محتوى SplatWorks|导入 SplatWorks 内容|SplatWorks सामग्री आयात करें
importText|Import text into this frame|Importar texto en este marco|Nhập văn bản vào khung|استيراد نص إلى الإطار|导入文字到此框|इस फ़्रेम में टेक्स्ट आयात करें
appendText|Append text from a file|Añadir texto de un archivo|Thêm văn bản từ tệp|إلحاق نص من ملف|追加文件中的文字|फ़ाइल से टेक्स्ट जोड़ें
pasteText|Paste text into this frame|Pegar texto en este marco|Dán văn bản vào khung|لصق النص في الإطار|粘贴文字到此框|इस फ़्रेम में टेक्स्ट चिपकाएँ
replacePicture|Replace picture|Reemplazar imagen|Thay ảnh|استبدال الصورة|替换图片|चित्र बदलें
replaceVideo|Replace video|Reemplazar vídeo|Thay video|استبدال الفيديو|替换视频|वीडियो बदलें
editTable|Edit table|Editar tabla|Sửa bảng|تحرير الجدول|编辑表格|तालिका संपादित करें
copyObject|Copy objects|Copiar objetos|Sao chép đối tượng|نسخ العناصر|复制对象|वस्तुएँ कॉपी करें
pasteObject|Paste objects|Pegar objetos|Dán đối tượng|لصق العناصر|粘贴对象|वस्तुएँ चिपकाएँ
lockObject|Lock objects|Bloquear objetos|Khóa đối tượng|قفل العناصر|锁定对象|वस्तुएँ लॉक करें
unlockObject|Unlock objects|Desbloquear objetos|Mở khóa đối tượng|فتح العناصر|解锁对象|वस्तुएँ अनलॉक करें
textImportError|Text could not be imported. Keep stories under 100,000 characters.|No se pudo importar. Máximo 100.000 caracteres.|Không thể nhập. Giữ bài dưới 100.000 ký tự.|تعذر استيراد النص. الحد 100000 حرف.|无法导入文字。文章限 100,000 字符。|टेक्स्ट आयात नहीं हुआ। लेख 100,000 अक्षर तक रखें।
clipboardHint|Allow clipboard access, or import a text file instead.|Permite el portapapeles o importa texto.|Cho phép bảng nhớ tạm hoặc nhập tệp văn bản.|اسمح بالحافظة أو استورد ملف نص.|请允许剪贴板访问或导入文字文件。|क्लिपबोर्ड पहुँच दें या टेक्स्ट फ़ाइल आयात करें।
postcard|Postcards|Postales|Bưu thiếp|بطاقات بريدية|明信片|पोस्टकार्ड
poster|Posters|Carteles|Áp phích|ملصقات|海报|पोस्टर
letterhead|Letterheads|Membretes|Giấy tiêu đề|ورق مراسلات|信笺|लेटरहेड
rack-card|Rack cards|Tarjetas promocionales|Thẻ quảng bá|بطاقات عرض|宣传卡|प्रचार कार्ड
datasheet|Data sheets|Fichas técnicas|Tờ thông tin|أوراق بيانات|资料页|डेटा शीट
menu|Menus|Menús|Thực đơn|قوائم الطعام|菜单|मेनू
invitation|Invitations|Invitaciones|Thiệp mời|دعوات|邀请函|निमंत्रण
certificate|Certificates|Certificados|Giấy chứng nhận|شهادات|证书|प्रमाणपत्र
sector-education|Education & training|Educación y formación|Giáo dục và đào tạo|التعليم والتدريب|教育与培训|शिक्षा और प्रशिक्षण
sector-community|Community & civic|Comunidad y ciudadanía|Cộng đồng|المجتمع والعمل المدني|社区与公共事务|समुदाय और नागरिक
sector-nonprofit|Nonprofit & causes|Organizaciones sin fines de lucro|Phi lợi nhuận|المؤسسات غير الربحية|公益与非营利|गैरलाभकारी संस्थाएँ
sector-technology|Technology & innovation|Tecnología e innovación|Công nghệ và đổi mới|التكنولوجيا والابتكار|科技与创新|तकनीक और नवाचार
sector-professional|Professional services|Servicios profesionales|Dịch vụ chuyên nghiệp|الخدمات المهنية|专业服务|पेशेवर सेवाएँ
sector-real-estate|Real estate & property|Bienes raíces|Bất động sản|العقارات|房地产|अचल संपत्ति
sector-wellness|Health & wellness|Salud y bienestar|Sức khỏe|الصحة والعافية|健康与保健|स्वास्थ्य
sector-food|Food & restaurants|Comida y restaurantes|Ẩm thực và nhà hàng|الطعام والمطاعم|餐饮|भोजन और रेस्तराँ
sector-retail|Retail & shops|Comercio y tiendas|Bán lẻ và cửa hàng|البيع بالتجزئة|零售与商店|खुदरा और दुकानें
sector-arts|Arts & culture|Arte y cultura|Nghệ thuật và văn hóa|الفنون والثقافة|艺术与文化|कला और संस्कृति
sector-travel|Travel & hospitality|Viajes y hospitalidad|Du lịch|السفر والضيافة|旅游与酒店|यात्रा और आतिथ्य
sector-sports|Sports & recreation|Deportes y ocio|Thể thao và giải trí|الرياضة والترفيه|体育与休闲|खेल और मनोरंजन
sector-environment|Environment & sustainability|Medioambiente y sostenibilidad|Môi trường và bền vững|البيئة والاستدامة|环境与可持续发展|पर्यावरण
sector-construction|Construction & trades|Construcción y oficios|Xây dựng|البناء والحرف|建筑与行业|निर्माण और व्यवसाय
sector-finance|Financial & business|Finanzas y negocios|Tài chính và kinh doanh|المال والأعمال|金融与商业|वित्त और व्यापार
sector-library|Libraries & literacy|Bibliotecas y lectura|Thư viện và đọc viết|المكتبات والقراءة|图书馆与阅读|पुस्तकालय और साक्षरता
sector-celebration|Events & celebrations|Eventos y celebraciones|Sự kiện và lễ hội|الفعاليات والاحتفالات|活动与庆典|कार्यक्रम और उत्सव
sector-manufacturing|Manufacturing & engineering|Industria e ingeniería|Sản xuất và kỹ thuật|التصنيع والهندسة|制造与工程|विनिर्माण और इंजीनियरिंग
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
helpScope|Use templates, rich text, masters, mail merge, media imports, and File → Export. Review conversion reports before printing.|Usa plantillas, texto enriquecido, maestras, combinación, medios y exportación. Revisa los informes antes de imprimir.|Dùng mẫu, văn bản phong phú, trang chủ, trộn thư, media và xuất. Xem báo cáo trước khi in.|استخدم القوالب والنص المنسق والرئيسية والدمج والوسائط والتصدير. راجع التقارير قبل الطباعة.|使用模板、富文本、母版、邮件合并、媒体和导出。打印前请检查报告。|टेम्पलेट, रिच टेक्स्ट, मास्टर, मेल मर्ज, मीडिया और निर्यात उपयोग करें। प्रिंट से पहले रिपोर्ट देखें।
helpSave|Work is saved in this browser when storage is available. Download a project to keep a portable copy. Bundled and imported fonts travel with saved projects.|El trabajo se guarda en este navegador si hay almacenamiento. Descarga una copia portátil. Se usan las fuentes instaladas en el equipo.|Công việc được lưu trong trình duyệt khi có bộ nhớ. Tải dự án để giữ bản di động. Phông chữ theo máy tính.|يُحفظ العمل في المتصفح عند توفر التخزين. نزّل المشروع لنسخة محمولة. الخطوط تعتمد على المثبت في الجهاز.|存储可用时，工作保存在本浏览器中。下载项目以保留可携带副本。字体取决于电脑安装情况。|स्टोरेज उपलब्ध होने पर कार्य इस ब्राउज़र में सहेजा जाता है। पोर्टेबल प्रतिलिपि के लिए प्रोजेक्ट डाउनलोड करें। फ़ॉन्ट कंप्यूटर पर स्थापित फ़ॉन्ट का उपयोग करते हैं।
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
pageLimit|This release supports up to 500 pages and 200 objects per page.|Esta versión admite 500 páginas y 200 objetos por página.|Bản này hỗ trợ 500 trang và 200 đối tượng mỗi trang.|هذه النسخة تدعم 500 صفحة و200 عنصر لكل صفحة.|本版支持最多 500 页，每页 200 个对象。|यह संस्करण 500 पृष्ठ और प्रति पृष्ठ 200 वस्तुओं तक समर्थित है।
exported|HTML publication downloaded|Publicación HTML descargada|Đã tải ấn phẩm HTML|تم تنزيل منشور HTML|HTML 出版物已下载|HTML प्रकाशन डाउनलोड हुआ
printReady|Choose Save as PDF in your browser's print dialog.|Elige Guardar PDF en el diálogo de impresión.|Chọn Lưu PDF trong hộp thoại in.|اختر حفظ PDF في حوار الطباعة.|请在浏览器打印对话框中选择保存 PDF。|प्रिंट संवाद में PDF सहेजें चुनें।
newText|Type your story here.|Escribe aquí tu texto.|Nhập bài viết tại đây.|اكتب النص هنا.|在此输入文章。|अपना लेख यहाँ लिखें।
saveFailed|Could not prepare the download. Your publication is still open; try again.|No se pudo descargar. La publicación sigue abierta; inténtalo otra vez.|Không tạo được bản tải. Ấn phẩm vẫn mở; thử lại.|تعذر تجهيز التنزيل. المنشور لا يزال مفتوحاً؛ حاول مجدداً.|无法准备下载。出版物仍然打开，请重试。|डाउनलोड तैयार नहीं हुआ। प्रकाशन खुला है; फिर प्रयास करें।
isolatedDraft|Imported project opened in a separate draft. Download a project before closing.|Proyecto importado en borrador separado. Descarga antes de cerrar.|Dự án nhập mở trong bản nháp riêng. Tải trước khi đóng.|المشروع المستورد في مسودة منفصلة. نزّله قبل الإغلاق.|导入项目已在独立草稿中打开。关闭前请下载。|आयातित प्रोजेक्ट अलग ड्राफ़्ट में खुला। बंद करने से पहले डाउनलोड करें।
guideAdded|Guide added. Double-click it to remove it.|Guía añadida. Doble clic para eliminarla.|Đã thêm đường gióng. Nhấp đúp để xóa.|تمت إضافة دليل. انقر مرتين لحذفه.|参考线已添加。双击删除。|गाइड जुड़ा। हटाने के लिए दो बार क्लिक करें।
lockedNotice|Unlock this object in Properties before editing it.|Desbloquea el objeto en Propiedades antes de editar.|Mở khóa trong Thuộc tính trước khi sửa.|افتح قفل العنصر في الخصائص قبل تحريره.|编辑前请在属性中解锁对象。|संपादन से पहले गुण में वस्तु का लॉक खोलें।
exportScope|HTML keeps fixed pages and uses the fonts available on the viewing computer.|HTML mantiene páginas fijas y usa las fuentes del equipo.|HTML giữ trang cố định và dùng phông chữ trên máy xem.|HTML يحافظ على الصفحات ويستخدم خطوط جهاز العرض.|HTML 保留固定页面并使用查看电脑的字体。|HTML निश्चित पृष्ठ और देखने वाले कंप्यूटर के फ़ॉन्ट उपयोग करता है।
templates|Templates|Plantillas de publicaciones|Mẫu ấn phẩm|قوالب المنشورات|出版物模板|प्रकाशन टेम्पलेट
saveTemplate|Save as template|Guardar como plantilla|Lưu thành mẫu|حفظ كقالب|另存为模板|टेम्पलेट सहेजें
masterPages|Master pages|Páginas maestras|Trang chủ|الصفحات الرئيسية|母版页|मास्टर पृष्ठ
mailMerge|Mail merge|Combinar correspondencia|Trộn thư|دمج البريد|邮件合并|मेल मर्ज
exports|Export & share|Exportar y compartir|Xuất và chia sẻ|تصدير ومشاركة|导出与分享|निर्यात और साझा करें
moreTools|More tools|Más herramientas|Công cụ khác|أدوات إضافية|更多工具|और उपकरण
richText|Rich text editor|Editor de texto enriquecido|Soạn thảo văn bản có định dạng|محرر النص المنسق|富文本编辑器|रिच टेक्स्ट संपादक
table|Table|Tabla|Bảng|جدول|表格|तालिका
drawPath|Draw a path|Dibujar un trazo|Vẽ đường|رسم مسار|绘制路径|पथ बनाएँ
customShape|Custom SVG path|Trazo SVG personalizado|Đường SVG tùy chỉnh|مسار SVG مخصص|自定义 SVG 路径|अपना SVG पथ
arrow|Arrow|Flecha|Mũi tên|سهم|箭头|तीर
triangle|Triangle|Triángulo|Tam giác|مثلث|三角形|त्रिभुज
star|Star|Estrella|Ngôi sao|نجمة|星形|तारा
heart|Heart|Corazón|Trái tim|قلب|心形|दिल
callout|Callout|Bocadillo|Chú thích|وسيلة شرح|标注|कॉलआउट
borderArt|Border art|Borde decorativo|Viền trang trí|زخرفة الحدود|艺术边框|सजावटी बॉर्डर
watermark|Picture watermark|Marca de agua de imagen|Hình mờ|علامة مائية للصورة|图片水印|चित्र वॉटरमार्क
formatPainter|Format painter|Copiar formato|Sao chép định dạng|نسخ التنسيق|格式刷|फ़ॉर्मैट पेंटर
dropCap|Drop cap lines|Líneas de capitular|Dòng chữ cái lớn|أسطر الحرف الاستهلالي|首字下沉行数|ड्रॉप कैप पंक्तियाँ
tracking|Tracking (pt)|Espaciado (pt)|Giãn ký tự (pt)|تباعد الأحرف (pt)|字距 (pt)|अक्षर अंतर (pt)
autoFit|AutoFit|Ajuste automático|Tự động khớp|ملاءمة تلقائية|自动适应|ऑटोफ़िट
noAutoFit|Keep font size|Mantener tamaño|Giữ cỡ chữ|الحفاظ على حجم الخط|保持字号|फ़ॉन्ट आकार रखें
shrinkText|Shrink to fit|Reducir para ajustar|Thu nhỏ cho vừa|تصغير للملاءمة|缩小以适应|फ़िट करने के लिए छोटा करें
growChoice|Grow frame on request|Ampliar marco al solicitarlo|Mở rộng khung khi yêu cầu|توسيع الإطار عند الطلب|按需扩大文本框|अनुरोध पर फ़्रेम बढ़ाएँ
minimumSize|Minimum size (pt)|Tamaño mínimo (pt)|Cỡ tối thiểu (pt)|أقل حجم (pt)|最小字号 (pt)|न्यूनतम आकार (pt)
growFrame|Grow overflowing frame|Ampliar marco desbordado|Mở rộng khung tràn|توسيع إطار النص الزائد|扩大溢出文本框|ओवरफ़्लो फ़्रेम बढ़ाएँ
wordArt|WordArt|WordArt|Chữ nghệ thuật|نص فني|艺术字|वर्डआर्ट
normalText|Normal text|Texto normal|Chữ thường|نص عادي|普通文本|साधारण टेक्स्ट
shadowText|Shadow|Sombra|Bóng|ظل|阴影|छाया
outlineText|Outline|Contorno|Viền|مخطط|轮廓|आउटलाइन
curveText|Curved title|Título curvo|Tiêu đề cong|عنوان منحني|弧形标题|घुमावदार शीर्षक
paragraphStyle|Paragraph style|Estilo de párrafo|Kiểu đoạn|نمط الفقرة|段落样式|अनुच्छेद शैली
bodyStyle|Body|Cuerpo|Nội dung|المتن|正文|मुख्य टेक्स्ट
headingStyle|Heading|Encabezado|Tiêu đề|عنوان|标题|शीर्षक
captionStyle|Caption|Pie de imagen|Chú thích|تعليق|图注|कैप्शन
applyStyle|Apply style|Aplicar estilo|Áp dụng kiểu|تطبيق النمط|应用样式|शैली लागू करें
saveStyle|Update named style|Actualizar estilo|Cập nhật kiểu|تحديث النمط|更新命名样式|नामित शैली अपडेट करें
textWrap|Text wrap|Ajuste de texto|Bọc văn bản|التفاف النص|文字环绕|टेक्स्ट रैप
noWrap|No wrapping|Sin ajuste|Không bọc|بدون التفاف|无环绕|रैप नहीं
squareWrap|Around picture|Alrededor de imagen|Quanh ảnh|حول الصورة|环绕图片|चित्र के चारों ओर
altText|Picture description|Descripción de imagen|Mô tả ảnh|وصف الصورة|图片描述|चित्र विवरण
cropX|Crop X (%)|Recorte X (%)|Cắt X (%)|قص X (%)|裁剪 X (%)|क्रॉप X (%)
cropY|Crop Y (%)|Recorte Y (%)|Cắt Y (%)|قص Y (%)|裁剪 Y (%)|क्रॉप Y (%)
cropWidth|Crop width (%)|Ancho del recorte (%)|Rộng vùng cắt (%)|عرض القص (%)|裁剪宽度 (%)|क्रॉप चौड़ाई (%)
cropHeight|Crop height (%)|Alto del recorte (%)|Cao vùng cắt (%)|ارتفاع القص (%)|裁剪高度 (%)|क्रॉप ऊँचाई (%)
applyCrop|Apply crop|Aplicar recorte|Áp dụng cắt|تطبيق القص|应用裁剪|क्रॉप लागू करें
arrange|Arrange|Organizar|Sắp xếp|ترتيب|排列|व्यवस्थित करें
multiHint|Shift-click to select several objects. Alt-click selects an object within a group.|Mayús-clic selecciona varios objetos. Alt-clic selecciona dentro de un grupo.|Shift-nhấp để chọn nhiều đối tượng. Alt-nhấp chọn trong nhóm.|Shift مع النقر لتحديد عناصر متعددة. Alt للنقر داخل المجموعة.|按 Shift 点击多选。按 Alt 点击选择组内对象。|Shift-क्लिक से कई वस्तुएँ चुनें। Alt-क्लिक से समूह के अंदर चुनें।
selectAll|Select all|Seleccionar todo|Chọn tất cả|تحديد الكل|全选|सब चुनें
group|Group|Agrupar|Nhóm|تجميع|组合|समूह बनाएँ
ungroup|Ungroup|Desagrupar|Bỏ nhóm|فك التجميع|取消组合|समूह हटाएँ
top|Top|Arriba|Trên|أعلى|顶部|ऊपर
middle|Middle|Medio|Giữa|وسط|中部|मध्य
bottom|Bottom|Abajo|Dưới|أسفل|底部|नीचे
distributeH|Distribute horizontally|Distribuir horizontalmente|Phân bố ngang|توزيع أفقي|水平分布|क्षैतिज वितरित करें
distributeV|Distribute vertically|Distribuir verticalmente|Phân bố dọc|توزيع عمودي|垂直分布|लंबवत वितरित करें
theme|Design theme|Tema de diseño|Chủ đề thiết kế|سمة التصميم|设计主题|डिज़ाइन थीम
templateHint|Choose a publication type. Every text frame and object stays editable.|Elige un tipo de publicación. Todos los objetos siguen editables.|Chọn loại ấn phẩm. Mọi khung và đối tượng đều sửa được.|اختر نوع المنشور. تبقى جميع العناصر قابلة للتحرير.|选择出版物类型。所有文本框和对象均可编辑。|प्रकाशन प्रकार चुनें। सभी फ़्रेम और वस्तुएँ संपादन योग्य हैं।
flyer|Flyers|Folletos de una página|Tờ rơi|منشورات دعائية|传单|फ़्लायर
brochure|Brochures|Trípticos|Tờ gấp|كتيبات|折页|ब्रोशर
newsletter|Newsletters|Boletines|Bản tin|نشرات إخبارية|通讯|समाचार पत्र
business-card|Business cards|Tarjetas de visita|Danh thiếp|بطاقات أعمال|名片|बिज़नेस कार्ड
catalog|Catalogs|Catálogos|Danh mục|كتالوجات|目录|कैटलॉग
greeting-card|Greeting cards|Tarjetas de felicitación|Thiệp|بطاقات تهنئة|贺卡|ग्रीटिंग कार्ड
labels|Labels|Etiquetas|Nhãn|ملصقات|标签|लेबल
italic|Italic|Cursiva|Nghiêng|مائل|斜体|तिरछा
underline|Underline|Subrayado|Gạch chân|تسطير|下划线|रेखांकित
link|Link|Enlace|Liên kết|رابط|链接|लिंक
masterHint|Create a master from the selection, or from this page when nothing is selected. Master objects appear behind page objects. Edit the master to update every assigned page.|Crea una página maestra de la selección o de toda la página. Sus objetos aparecen detrás. Editarla actualiza las páginas asignadas.|Tạo trang chủ từ lựa chọn hoặc cả trang. Đối tượng chủ nằm phía sau. Sửa trang chủ cập nhật mọi trang được gán.|أنشئ صفحة رئيسية من التحديد أو الصفحة كاملة. تظهر عناصرها بالخلف وتحديثها يطبق على الصفحات المعينة.|从所选对象或整页创建母版。母版对象在页面对象后方。编辑母版会更新所有应用页面。|चयन या पूरे पृष्ठ से मास्टर बनाएँ। इसके ऑब्जेक्ट पीछे दिखते हैं। मास्टर संपादन सभी जुड़े पृष्ठ अपडेट करता है।
master|Master|Maestra|Trang chủ|رئيسية|母版|मास्टर
createMaster|Create master|Crear maestra|Tạo trang chủ|إنشاء رئيسية|创建母版|मास्टर बनाएँ
applyMaster|Apply to this page|Aplicar a esta página|Áp dụng cho trang này|تطبيق على هذه الصفحة|应用于本页|इस पृष्ठ पर लागू करें
applyMasterAll|Apply to all pages|Aplicar a todas las páginas|Áp dụng cho mọi trang|تطبيق على كل الصفحات|应用于所有页面|सभी पृष्ठों पर लागू करें
editMaster|Edit master / Return to pages|Editar maestra / Volver|Sửa trang chủ / Quay lại|تحرير الرئيسية / العودة|编辑母版 / 返回页面|मास्टर संपादन / पृष्ठों पर लौटें
override|Local override|Cambio local|Ghi đè cục bộ|تجاوز محلي|本页覆盖|स्थानीय बदलाव
hideMasterObject|Hide on this page|Ocultar en esta página|Ẩn trên trang này|إخفاء في هذه الصفحة|在本页隐藏|इस पृष्ठ पर छिपाएँ
resetOverrides|Reset overrides|Restablecer cambios|Đặt lại ghi đè|إعادة التجاوزات|重置覆盖|बदलाव रीसेट करें
pageNumbers|Insert page numbers|Insertar números de página|Chèn số trang|إدراج أرقام الصفحات|插入页码|पृष्ठ संख्या डालें
tableHint|Enter tab-separated cells, one row per line. The first row can be a header.|Introduce celdas separadas por tabuladores, una fila por línea. La primera puede ser encabezado.|Nhập ô ngăn bằng tab, mỗi dòng một hàng. Hàng đầu có thể là tiêu đề.|أدخل خلايا مفصولة بعلامة تبويب، صفاً لكل سطر. يمكن جعل الأول عنواناً.|输入制表符分隔的单元格，每行一行数据。首行可作为表头。|टैब से अलग सेल लिखें, हर पंक्ति एक रो। पहली रो हेडर हो सकती है।
headerRow|Header row|Fila de encabezado|Hàng tiêu đề|صف العنوان|表头行|हेडर रो
noMaster|No master|Sin maestra|Không có trang chủ|بدون رئيسية|无母版|मास्टर नहीं
editingMaster|Editing master:|Editando maestra:|Đang sửa trang chủ:|تحرير الرئيسية:|正在编辑母版：|मास्टर संपादन:
chooseMasterObject|Choose a master object|Elige un objeto maestro|Chọn đối tượng chủ|اختر عنصراً رئيسياً|选择母版对象|मास्टर ऑब्जेक्ट चुनें
selectedCount|{count} objects selected|{count} objetos seleccionados|Đã chọn {count} đối tượng|تم تحديد {count} عناصر|已选择 {count} 个对象|{count} वस्तुएँ चुनी गईं
linkPrompt|Enter an HTTP(S) or mailto link.|Introduce enlace HTTP(S) o mailto.|Nhập liên kết HTTP(S) hoặc mailto.|أدخل رابط HTTP(S) أو mailto.|输入 HTTP(S) 或 mailto 链接。|HTTP(S) या mailto लिंक दें।
paintHint|Choose a text frame to apply this formatting.|Elige un marco para aplicar el formato.|Chọn khung để áp dụng định dạng.|اختر إطار نص لتطبيق التنسيق.|选择文本框以应用格式。|फ़ॉर्मैट लगाने के लिए टेक्स्ट फ़्रेम चुनें।
masterName|Master name|Nombre de maestra|Tên trang chủ|اسم الرئيسية|母版名称|मास्टर नाम
pageNumberPrompt|Page number text. Use {page} and {total}.|Texto de página. Usa {page} y {total}.|Chữ số trang. Dùng {page} và {total}.|نص رقم الصفحة. استخدم {page} و{total}.|页码文本。使用 {page} 和 {total}。|पृष्ठ संख्या टेक्स्ट। {page} और {total} उपयोग करें।
drawHint|Drag across the page to draw. Esc cancels.|Arrastra en la página para dibujar. Esc cancela.|Kéo trên trang để vẽ. Esc để hủy.|اسحب عبر الصفحة للرسم. Esc للإلغاء.|在页面上拖动绘制。按 Esc 取消。|पृष्ठ पर खींचकर बनाएँ। Esc रद्द करता है।
pathPrompt|Enter SVG path coordinates in points.|Introduce coordenadas SVG en puntos.|Nhập tọa độ đường SVG theo point.|أدخل إحداثيات مسار SVG بالنقاط.|以磅为单位输入 SVG 路径坐标。|SVG पथ के निर्देशांक पॉइंट में दें।
missingAlt|Add a picture description for the reading edition.|Añade descripción para la versión de lectura.|Thêm mô tả ảnh cho bản đọc.|أضف وصف الصورة لنسخة القراءة.|请为阅读版添加图片描述。|पठन संस्करण के लिए चित्र विवरण दें।
tableOverflow|Table rows need a taller frame.|La tabla necesita un marco más alto.|Bảng cần khung cao hơn.|الجدول يحتاج إطاراً أطول.|表格需要更高的框架。|तालिका को ऊँचा फ़्रेम चाहिए।
mergeUnresolved|Merge fields need a data source or final text.|Los campos necesitan datos o texto final.|Trường trộn cần dữ liệu hoặc chữ cuối.|حقول الدمج تحتاج بيانات أو نصاً نهائياً.|合并字段需要数据源或最终文本。|मर्ज फ़ील्ड को डेटा या अंतिम टेक्स्ट चाहिए।
dropCapWrap|Drop caps are suppressed while picture wrapping is active in this frame.|Las capitulares se omiten mientras se ajusta texto alrededor de imágenes.|Chữ cái lớn tắt khi bọc văn bản quanh ảnh.|الحروف الاستهلالية تتوقف مع التفاف الصور.|此框启用图片环绕时不显示首字下沉。|चित्र रैप सक्रिय होने पर ड्रॉप कैप नहीं दिखता।
video|Video|Vídeo|Video|فيديو|视频|वीडियो
previewMedia|Play imported media|Reproducir medios importados|Phát nội dung đã nhập|تشغيل الوسائط المستوردة|播放导入的媒体|आयातित मीडिया चलाएँ
conversionReport|Import / conversion report|Informe de importación / conversión|Báo cáo nhập / chuyển đổi|تقرير الاستيراد / التحويل|导入 / 转换报告|आयात / रूपांतरण रिपोर्ट
importingMedia|Importing media locally…|Importando medios localmente…|Đang nhập nội dung cục bộ…|جارٍ استيراد الوسائط محلياً…|正在本地导入媒体…|मीडिया स्थानीय रूप से आयात हो रहा है…
mediaImportError|This file could not be imported. Your publication is unchanged.|No se pudo importar. La publicación sigue igual.|Không thể nhập tệp. Ấn phẩm không thay đổi.|تعذر الاستيراد. المنشور لم يتغير.|无法导入文件。出版物未更改。|फ़ाइल आयात नहीं हुई। प्रकाशन अपरिवर्तित है।
returnToPages|Return from master editing before changing publication pages.|Sal de la maestra antes de cambiar páginas.|Thoát chỉnh sửa trang chủ trước khi đổi trang.|عُد من تحرير الرئيسية قبل تغيير الصفحات.|请先退出母版编辑再更改页面。|पृष्ठ बदलने से पहले मास्टर संपादन से लौटें।
mergePrivacy|Choose local CSV, TSV, Excel, GridSplat JSON, or ListSplat JSON data. Recipient data stays in this browser and is not saved with the template.|Elige CSV, TSV, Excel, GridSplat JSON o ListSplat JSON locales. Los destinatarios quedan en este navegador y no se guardan en la plantilla.|Chọn CSV, TSV, Excel, GridSplat JSON hoặc ListSplat JSON cục bộ. Dữ liệu người nhận ở trong trình duyệt và không lưu trong mẫu.|اختر CSV أو TSV أو Excel أو GridSplat JSON أو ListSplat JSON محلياً. بيانات المستلمين تبقى في المتصفح ولا تُحفظ في القالب.|选择本地 CSV、TSV、Excel、GridSplat JSON 或 ListSplat JSON。收件人数据保留在此浏览器中，不随模板保存。|स्थानीय CSV, TSV, Excel, GridSplat JSON या ListSplat JSON चुनें। प्राप्तकर्ता डेटा ब्राउज़र में रहता है और टेम्पलेट में नहीं सहेजा जाता।
dataSource|Data source|Origen de datos|Nguồn dữ liệu|مصدر البيانات|数据源|डेटा स्रोत
worksheet|Worksheet|Hoja de cálculo|Trang tính|ورقة العمل|工作表|वर्कशीट
filterField|Filter column|Columna de filtro|Cột lọc|عمود التصفية|筛选列|फ़िल्टर कॉलम
filterText|Contains|Contiene|Chứa|يحتوي|包含|शामिल है
firstRecord|First record|Primer registro|Bản ghi đầu|السجل الأول|首条记录|पहला रिकॉर्ड
lastRecord|Last record|Último registro|Bản ghi cuối|السجل الأخير|最后记录|अंतिम रिकॉर्ड
previewRecord|Preview record|Vista previa del registro|Xem trước bản ghi|معاينة السجل|预览记录|रिकॉर्ड पूर्वावलोकन
checkRecords|Check every record|Revisar todos los registros|Kiểm tra mọi bản ghi|فحص كل سجل|检查每条记录|सभी रिकॉर्ड जाँचें
generateMerge|Generate publications|Generar publicaciones|Tạo ấn phẩm|إنشاء المنشورات|生成出版物|प्रकाशन बनाएँ
unmapped|Choose column|Elige columna|Chọn cột|اختر عموداً|选择列|कॉलम चुनें
allRecords|All records|Todos los registros|Mọi bản ghi|كل السجلات|所有记录|सभी रिकॉर्ड
recordCount|{count} records; {fields} merge fields.|{count} registros; {fields} campos.|{count} bản ghi; {fields} trường.|{count} سجل؛ {fields} حقل.|{count} 条记录；{fields} 个合并字段。|{count} रिकॉर्ड; {fields} मर्ज फ़ील्ड।
mergeDataError|Choose valid data with unique column names and at least one record.|Elige datos válidos con columnas únicas y al menos un registro.|Chọn dữ liệu hợp lệ với tên cột riêng và ít nhất một bản ghi.|اختر بيانات صحيحة بأسماء أعمدة فريدة وسجل واحد على الأقل.|请选择列名唯一且至少有一条记录的有效数据。|अलग कॉलम नाम और कम से कम एक रिकॉर्ड वाला डेटा चुनें।
checkingRecords|Checking {count} of {total} records…|Revisando {count} de {total}…|Đang kiểm tra {count}/{total}…|فحص {count} من {total}…|正在检查 {count}/{total} 条记录…|{total} में से {count} रिकॉर्ड जाँचे जा रहे हैं…
mergeCheckResult|{count} of {total} records need attention. Record numbers:|{count} de {total} necesitan revisión. Números:|{count}/{total} bản ghi cần xem lại. Số bản ghi:|{count} من {total} تحتاج مراجعة. أرقام السجلات:|{total} 条中有 {count} 条需检查。记录编号：|{total} में से {count} रिकॉर्ड देखें। रिकॉर्ड संख्या:
mergeReplace|Replace this document with the generated publications? Save the template first if needed.|¿Reemplazar con las publicaciones? Guarda la plantilla si la necesitas.|Thay tài liệu bằng các ấn phẩm đã tạo? Lưu mẫu trước nếu cần.|استبدال المستند بالمنشورات؟ احفظ القالب أولاً عند الحاجة.|用生成的出版物替换此文档？如需模板请先保存。|दस्तावेज़ को बने प्रकाशनों से बदलें? आवश्यकता हो तो टेम्पलेट पहले सहेजें।
mergeGenerated|Personalized publications generated.|Publicaciones personalizadas generadas.|Đã tạo ấn phẩm cá nhân hóa.|تم إنشاء المنشورات المخصصة.|已生成个性化出版物。|व्यक्तिगत प्रकाशन बन गए।
mergeLimit|Generation failed. Choose mapped fields and a record range producing no more than 500 pages.|No se generó. Asigna campos y elige hasta 500 páginas.|Không thể tạo. Ánh xạ trường và chọn phạm vi tối đa 500 trang.|تعذر الإنشاء. اربط الحقول واختر نطاقاً لا يتجاوز 500 صفحة.|生成失败。请映射字段并选择不超过 500 页的记录范围。|निर्माण विफल। फ़ील्ड मैप करें और 500 पृष्ठ तक का रिकॉर्ड दायरा चुनें।
outputFormat|Format|Formato|Định dạng|الصيغة|格式|फ़ॉर्मैट
proofPdf|PDF — high-resolution proof|PDF — prueba de alta resolución|PDF — bản kiểm tra độ phân giải cao|PDF — نسخة مراجعة عالية الدقة|PDF — 高分辨率校样|PDF — उच्च रिज़ॉल्यूशन प्रूफ़
fixedHtml|HTML — fixed layout + media|HTML — diseño fijo y medios|HTML — bố cục cố định và media|HTML — تخطيط ثابت ووسائط|HTML — 固定布局和媒体|HTML — स्थिर लेआउट और मीडिया
readingEdition|HTML — reading edition|HTML — edición de lectura|HTML — bản đọc|HTML — نسخة القراءة|HTML — 阅读版|HTML — पठन संस्करण
packGo|Pack and Go — printer package|Empaquetar — paquete de imprenta|Đóng gói — gói nhà in|حزمة الطباعة والنقل|打包 — 印刷包|पैक करें — प्रिंटर पैकेज
pageRange|Pages (blank = all)|Páginas (vacío = todas)|Trang (trống = tất cả)|الصفحات (فارغ = الكل)|页码（留空表示全部）|पृष्ठ (खाली = सभी)
resolution|Resolution (ppi)|Resolución (ppp)|Độ phân giải (ppi)|الدقة (ppi)|分辨率（ppi）|रिज़ॉल्यूशन (ppi)
bleed|Bleed (pt)|Sangrado (pt)|Tràn lề (pt)|نزف الطباعة (نقطة)|出血（磅）|ब्लीड (pt)
cropMarks|Crop marks (PDF)|Marcas de corte (PDF)|Dấu cắt (PDF)|علامات القص (PDF)|裁切标记（PDF）|कट मार्क (PDF)
printerProfile|Printer ICC profile (optional)|Perfil ICC de imprenta (opcional)|Hồ sơ ICC nhà in (tùy chọn)|ملف ICC للمطبعة (اختياري)|印刷 ICC 配置（可选）|प्रिंटर ICC प्रोफ़ाइल (वैकल्पिक)
proofNotice|Downloadable PDF preserves appearance as pixels. Print / Save as PDF keeps selectable text and vectors. An ICC profile alone does not certify PDF/X. Read the desktop conversion report.|El PDF descargable conserva la apariencia como píxeles. Imprimir / Guardar PDF mantiene texto seleccionable y vectores. ICC no certifica PDF/X. Lee el informe de conversión.|PDF tải về giữ hình thức bằng điểm ảnh. In / Lưu PDF giữ chữ có thể chọn và vector. ICC không chứng nhận PDF/X. Đọc báo cáo chuyển đổi.|PDF القابل للتنزيل يحفظ الشكل بالبكسل. الطباعة تحفظ النص القابل للتحديد والمتجهات. ملف ICC وحده لا يثبت PDF/X. اقرأ تقرير التحويل.|下载 PDF 以像素保留外观。打印 / 保存 PDF 保留可选文本和矢量。ICC 配置本身不认证 PDF/X。请阅读转换报告。|डाउनलोड PDF पिक्सेल में रूप रखता है। प्रिंट / PDF सहेजें चयन योग्य टेक्स्ट और वेक्टर रखता है। केवल ICC से PDF/X प्रमाणित नहीं होता। रूपांतरण रिपोर्ट पढ़ें।
download|Download|Descargar|Tải xuống|تنزيل|下载|डाउनलोड
share|Share|Compartir|Chia sẻ|مشاركة|分享|साझा करें
currentPage|Current page|Página actual|Trang hiện tại|الصفحة الحالية|当前页|वर्तमान पृष्ठ
emailPreview|Email preview|Vista previa del correo|Xem trước email|معاينة البريد|邮件预览|ईमेल पूर्वावलोकन
openEmailDraft|Open email draft|Abrir borrador de correo|Mở thư nháp|فتح مسودة البريد|打开邮件草稿|ईमेल ड्राफ़्ट खोलें
exportProgress|Preparing page {page} of {total}…|Preparando página {page} de {total}…|Đang chuẩn bị trang {page}/{total}…|تجهيز الصفحة {page} من {total}…|正在准备第 {page}/{total} 页…|{total} में से पृष्ठ {page} तैयार हो रहा है…
exportReady|File ready.|Archivo listo.|Tệp đã sẵn sàng.|الملف جاهز.|文件已准备好。|फ़ाइल तैयार है।
shareReady|File ready. Click Share again to open your device's sharing menu.|Archivo listo. Pulsa Compartir otra vez.|Tệp sẵn sàng. Bấm Chia sẻ lần nữa.|الملف جاهز. اضغط مشاركة مرة أخرى.|文件已准备好。再次点击分享。|फ़ाइल तैयार है। साझा करें फिर दबाएँ।
shareFallback|Downloaded instead. Attach or share the downloaded file.|Se descargó. Adjunta o comparte el archivo.|Đã tải về. Đính kèm hoặc chia sẻ tệp.|تم التنزيل. أرفق الملف أو شاركه.|文件已下载。请附加或分享下载文件。|डाउनलोड हो गया। फ़ाइल संलग्न या साझा करें।
emailSubject|Subject|Asunto|Tiêu đề|الموضوع|主题|विषय
emailAttachment|Attachment|Adjunto|Tệp đính kèm|المرفق|附件|अटैचमेंट
emailAttachHint|Download the file, then attach it to your email. Nothing is sent automatically.|Descarga el archivo y adjúntalo al correo. No se envía automáticamente.|Tải tệp và đính kèm vào email. Không tự động gửi.|نزّل الملف وأرفقه بالبريد. لا يُرسل شيء تلقائياً.|请下载文件并附加到邮件。不会自动发送。|फ़ाइल डाउनलोड कर ईमेल में संलग्न करें। कुछ स्वतः नहीं भेजा जाता।
openLayoutProject|Open LayoutSplat project|Abrir proyecto LayoutSplat|Mở dự án LayoutSplat|فتح مشروع LayoutSplat|打开 LayoutSplat 项目|LayoutSplat प्रोजेक्ट खोलें
browseAllTemplates|Browse all designs|Ver todos los diseños|Xem mọi thiết kế|تصفح كل التصاميم|浏览所有设计|सभी डिज़ाइन देखें
labelTemplates|Avery labels & name badges|Etiquetas Avery y gafetes|Nhãn Avery và thẻ tên|ملصقات Avery وبطاقات الأسماء|Avery 标签与姓名牌|Avery लेबल और नाम बैज
nameBadges|Name badges|Gafetes|Thẻ tên|بطاقات الأسماء|姓名牌|नाम बैज
labelKind|Label / badge type|Tipo de etiqueta / gafete|Loại nhãn / thẻ|نوع الملصق / البطاقة|标签／姓名牌类型|लेबल / बैज प्रकार
labelSettings|Label sheet & printer alignment|Hoja de etiquetas y alineación|Trang nhãn và căn chỉnh máy in|ورقة الملصقات ومحاذاة الطابعة|标签纸与打印对齐|लेबल शीट और प्रिंटर संरेखण
labelOffsetX|Move right (pt; negative = left)|Mover a la derecha (pt; negativo = izquierda)|Dịch phải (pt; âm = trái)|تحريك يميناً (نقطة؛ السالب يسار)|向右移动（点；负数向左）|दाएँ खिसकाएँ (pt; ऋणात्मक = बाएँ)
labelOffsetY|Move down (pt; negative = up)|Mover abajo (pt; negativo = arriba)|Dịch xuống (pt; âm = lên)|تحريك لأسفل (نقطة؛ السالب لأعلى)|向下移动（点；负数向上）|नीचे खिसकाएँ (pt; ऋणात्मक = ऊपर)
labelStart|First unused label on first sheet|Primera etiqueta libre de la primera hoja|Nhãn trống đầu tiên trên trang đầu|أول ملصق غير مستخدم في الورقة الأولى|第一页首个未使用的标签|पहली शीट पर पहला खाली लेबल
labelPrintHint|Print at Actual size / 100% on the matching paper size. Disable Fit to page, headers, and footers. Test on plain paper first.|Imprime al tamaño real / 100% con el papel correcto. Desactiva Ajustar, encabezados y pies. Prueba en papel normal.|In kích thước thật / 100% với đúng cỡ giấy. Tắt co vừa trang, đầu và chân trang. Thử giấy thường trước.|اطبع بالحجم الفعلي / 100% وبمقاس الورق الصحيح. عطّل الملاءمة والرؤوس والتذييلات. اختبر على ورق عادي أولاً.|按实际大小／100% 和正确纸张打印。关闭适合页面、页眉和页脚。先用普通纸测试。|सही कागज़ पर वास्तविक आकार / 100% में प्रिंट करें। फ़िट, हेडर और फ़ुटर बंद करें। पहले सामान्य कागज़ पर जाँचें।
labelOfficialSource|Avery product details|Detalles del producto Avery|Thông tin sản phẩm Avery|تفاصيل منتج Avery|Avery 产品详情|Avery उत्पाद विवरण
import|Import|Importar|Nhập|استيراد|导入|आयात
importIllustrator|Adobe Illustrator — PDF-compatible artwork|Adobe Illustrator — arte compatible con PDF|Adobe Illustrator — đồ họa tương thích PDF|Adobe Illustrator — رسم متوافق مع PDF|Adobe Illustrator — PDF 兼容图稿|Adobe Illustrator — PDF संगत आर्टवर्क
importInDesign|Adobe InDesign — IDML / packaged images|Adobe InDesign — IDML / imágenes empaquetadas|Adobe InDesign — IDML / ảnh đóng gói|Adobe InDesign — IDML / صور مجمّعة|Adobe InDesign — IDML／打包图片|Adobe InDesign — IDML / पैक चित्र
importPages|Apple Pages — legacy XML layouts|Apple Pages — diseños XML antiguos|Apple Pages — bố cục XML cũ|Apple Pages — تخطيطات XML القديمة|Apple Pages — 旧版 XML 布局|Apple Pages — पुराने XML लेआउट
importEps|EPS / PostScript — artwork|EPS / PostScript — arte|EPS / PostScript — đồ họa|EPS / PostScript — رسوم|EPS／PostScript — 图稿|EPS / PostScript — आर्टवर्क
importImagesVideo|Images & video — place on this page|Imágenes y vídeo — colocar en la página|Ảnh và video — đặt trên trang|صور وفيديو — وضع في هذه الصفحة|图像与视频 — 放置于当前页|चित्र और वीडियो — इस पृष्ठ पर रखें
importPublisher|Microsoft Publisher — native .pub|Microsoft Publisher — .pub nativo|Microsoft Publisher — .pub gốc|Microsoft Publisher — ملف .pub أصلي|Microsoft Publisher — 原生 .pub|Microsoft Publisher — मूल .pub
importPdf|PDF — page artwork|PDF — arte de páginas|PDF — đồ họa trang|PDF — رسوم الصفحات|PDF — 页面图稿|PDF — पृष्ठ आर्टवर्क
importQuark|QuarkXPress — conversion required|QuarkXPress — requiere conversión|QuarkXPress — cần chuyển đổi|QuarkXPress — يتطلب تحويلاً|QuarkXPress — 需要转换|QuarkXPress — रूपांतरण आवश्यक
importScribus|Scribus — SLA / packaged images|Scribus — SLA / imágenes empaquetadas|Scribus — SLA / ảnh đóng gói|Scribus — SLA / صور مجمّعة|Scribus — SLA／打包图片|Scribus — SLA / पैक चित्र
importSvg|SVG — editable supported objects|SVG — objetos compatibles editables|SVG — đối tượng hỗ trợ có thể sửa|SVG — عناصر مدعومة قابلة للتحرير|SVG — 可编辑的受支持对象|SVG — समर्थित संपादन योग्य वस्तुएँ
export|Export|Exportar|Xuất|تصدير|导出|निर्यात
exportJson|LayoutSplat JSON — editable project|LayoutSplat JSON — proyecto editable|LayoutSplat JSON — dự án có thể sửa|LayoutSplat JSON — مشروع قابل للتحرير|LayoutSplat JSON — 可编辑项目|LayoutSplat JSON — संपादन योग्य प्रोजेक्ट
exportPng|PNG image|Imagen PNG|Ảnh PNG|صورة PNG|PNG 图像|PNG चित्र
exportJpeg|JPEG image|Imagen JPEG|Ảnh JPEG|صورة JPEG|JPEG 图像|JPEG चित्र
exportSvg|SVG vectors & text|Vectores y texto SVG|Vector và văn bản SVG|متجهات ونص SVG|SVG 矢量与文本|SVG वेक्टर और पाठ
exportIdml|InDesign IDML package|Paquete InDesign IDML|Gói InDesign IDML|حزمة InDesign IDML|InDesign IDML 包|InDesign IDML पैक
exportSla|Scribus SLA package|Paquete Scribus SLA|Gói Scribus SLA|حزمة Scribus SLA|Scribus SLA 包|Scribus SLA पैक
exportWriteSplat|WriteSplat document|Documento WriteSplat|Tài liệu WriteSplat|مستند WriteSplat|WriteSplat 文档|WriteSplat दस्तावेज़
exportShowSplat|ShowSplat presentation|Presentación ShowSplat|Bản trình chiếu ShowSplat|عرض ShowSplat|ShowSplat 演示文稿|ShowSplat प्रस्तुति
exportGridSplat|GridSplat workbook|Libro GridSplat|Sổ GridSplat|دفتر GridSplat|GridSplat 工作簿|GridSplat वर्कबुक
exportListSplat|ListSplat database|Base de datos ListSplat|Cơ sở dữ liệu ListSplat|قاعدة ListSplat|ListSplat 数据库|ListSplat डेटाबेस

importSuiteContent|SplatWorks content|Contenido SplatWorks|Nội dung SplatWorks|محتوى SplatWorks|SplatWorks 内容|SplatWorks सामग्री
importTextBox|Text into selected text box|Texto en el cuadro seleccionado|Văn bản vào hộp đã chọn|نص في المربع المحدد|文本导入选中文本框|चुने हुए टेक्स्ट बॉक्स में पाठ
fontCategory|Font category|Categoría de fuente|Loại phông chữ|فئة الخط|字体类别|फ़ॉन्ट श्रेणी
serif|Serif|Con serifas|Có chân|ذو زوائد|衬线|सेरिफ़
sansSerif|Sans serif|Sin serifas|Không chân|بلا زوائد|无衬线|सैंस सेरिफ़
kerning|Kerning (letter pairs)|Kerning (pares de letras)|Kerning (cặp chữ)|تباعد أزواج الحروف|字偶距|कर्निंग (अक्षर जोड़े)
kerningOn|Font metrics|Métricas de la fuente|Theo phông chữ|مقاييس الخط|使用字体度量|फ़ॉन्ट मेट्रिक्स
kerningOff|Off|Desactivado|Tắt|إيقاف|关闭|बंद
wordSpacing|Word spacing (pt)|Espacio entre palabras (pt)|Khoảng cách từ (pt)|تباعد الكلمات (نقطة)|词间距（点）|शब्द अंतर (pt)
horizontalScale|Horizontal scale (%)|Escala horizontal (%)|Tỷ lệ ngang (%)|المقياس الأفقي (%)|水平缩放（%）|क्षैतिज स्केल (%)
ligatures|Common ligatures|Ligaduras comunes|Chữ ghép thông dụng|وصلات الحروف الشائعة|常用连字|सामान्य संयुक्त अक्षर
importFont|Import a font file|Importar archivo de fuente|Nhập tệp phông chữ|استيراد ملف خط|导入字体文件|फ़ॉन्ट फ़ाइल आयात करें
importWordText|Microsoft Word — DOC / DOCX text|Microsoft Word — texto DOC / DOCX|Microsoft Word — văn bản DOC / DOCX|Microsoft Word — نص DOC / DOCX|Microsoft Word — DOC／DOCX 文本|Microsoft Word — DOC / DOCX पाठ
importOdtText|LibreOffice Writer — ODT text|LibreOffice Writer — texto ODT|LibreOffice Writer — văn bản ODT|LibreOffice Writer — نص ODT|LibreOffice Writer — ODT 文本|LibreOffice Writer — ODT पाठ
importFontMenu|Fonts — TTF / OTF / WOFF / WOFF2|Fuentes — TTF / OTF / WOFF / WOFF2|Phông chữ — TTF / OTF / WOFF / WOFF2|خطوط — TTF / OTF / WOFF / WOFF2|字体 — TTF／OTF／WOFF／WOFF2|फ़ॉन्ट — TTF / OTF / WOFF / WOFF2
`;
  const langs = ['en', 'es', 'vi', 'ar', 'zh', 'uh'], dict = Object.fromEntries(langs.map(l => [l, {}]));
  rows.trim().split('\n').forEach(row => { const [key, ...values] = row.split('|'); langs.forEach((lang, i) => { dict[lang][key] = values[i]; }); });
  WidgetI18n.register('layoutsplat', dict);
})();
