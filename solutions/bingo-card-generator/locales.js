/* Bingo Card Generator — locale dictionary. AI-seeded; native-speaker
   review pending.

   The default vocabulary items in the textarea stay English (subject-specific
   ELA terms — teachers paste their own content for non-English bingo).
   The literal English keyword "FREE" still triggers the center-square logic
   in the engine; the displayed center square uses the translated FREE word
   from this dictionary. */
WidgetI18n.register('bingo-cards', {

  en: {
    'doc.title':        'Bingo Card Generator — DrawSplat',
    'nav.brandAria':    'DrawSplat™ home',
    'nav.aria':         'Bingo card generator navigation',
    'nav.features':     'Features',
    'nav.support':      'Support',
    'nav.bingoCaller':  'Live Bingo Caller',
    'nav.whiteboard':   'Whiteboard',
    'nav.openWhiteboard':'Open Whiteboard',

    'hero.eyebrow':     'Classroom Widget',
    'hero.h1':          'Bingo Card Generator',
    'hero.subtitle':    'Create printable bingo cards from words, questions, vocabulary, names, concepts, or traditional B-I-N-G-O numbers.',

    'field.title':      'Card Title',
    'field.titleDefault':'Classroom Bingo',
    'field.size':       'Grid Size',
    'field.count':      'Cards',
    'field.bg':         'Background',
    'field.accent':     'Header Color',
    'check.free':       'Use center FREE space when possible',
    'check.columns':    'Shuffle only within columns',
    'field.items':      'Items / Words / Phrases',
    'items.hint':       'Use one item per line. For traditional number bingo, click "Load B-I-N-G-O Numbers."',

    'button.generate':  'Generate Cards',
    'button.loadNums':  'Load B-I-N-G-O Numbers',
    'button.exportPdf': 'Export All to PDF',
    'button.print':     'Print',
    'button.clear':     'Clear',
    'button.downloadPng':'Download PNG',

    'notice.tip.html':  '<strong>Tip:</strong> Paste vocabulary, review questions, names, or concepts. PNG exports download one card at a time; PDF export places one card per page.',
    'callList.headingHtml':'<strong>Call List:</strong><br>',

    'card.headingN':    'Card {n}',
    'card.titleDefault':'Bingo',
    'canvas.generatedWith':'Generated with DrawSplat™',
    'canvas.free':      'FREE',

    'status.fewerItems':'Note: You entered fewer items than squares, so some items may repeat.',
    'status.generated': 'Generated {n} card(s).',
    'alert.atLeastOne': 'Add at least one bingo item.',
    'alert.atLeastOneFree':'Add at least one bingo item besides FREE.',

    'footer.attributionHtml':'DrawSplat<sup class="tm">TM</sup> Bingo Card Generator.',
    'footer.openCaller':'Open Live Bingo Caller',
  },

  es: {
    'doc.title':        'Generador de Cartones de Bingo — DrawSplat',
    'nav.brandAria':    'Inicio de DrawSplat™',
    'nav.aria':         'Navegación del generador de cartones de bingo',
    'nav.features':     'Funciones',
    'nav.support':      'Soporte',
    'nav.bingoCaller':  'Cantador de Bingo en Vivo',
    'nav.whiteboard':   'Pizarra',
    'nav.openWhiteboard':'Abrir Pizarra',

    'hero.eyebrow':     'Widget para el aula',
    'hero.h1':          'Generador de Cartones de Bingo',
    'hero.subtitle':    'Crea cartones de bingo imprimibles a partir de palabras, preguntas, vocabulario, nombres, conceptos o números tradicionales B-I-N-G-O.',

    'field.title':      'Título del cartón',
    'field.titleDefault':'Bingo del aula',
    'field.size':       'Tamaño de la cuadrícula',
    'field.count':      'Cartones',
    'field.bg':         'Fondo',
    'field.accent':     'Color del encabezado',
    'check.free':       'Usar el espacio central GRATIS cuando sea posible',
    'check.columns':    'Mezclar solo dentro de las columnas',
    'field.items':      'Elementos / Palabras / Frases',
    'items.hint':       'Un elemento por línea. Para bingo numérico tradicional, haz clic en "Cargar números B-I-N-G-O".',

    'button.generate':  'Generar cartones',
    'button.loadNums':  'Cargar números B-I-N-G-O',
    'button.exportPdf': 'Exportar todo a PDF',
    'button.print':     'Imprimir',
    'button.clear':     'Borrar',
    'button.downloadPng':'Descargar PNG',

    'notice.tip.html':  '<strong>Consejo:</strong> Pega vocabulario, preguntas de repaso, nombres o conceptos. PNG descarga un cartón a la vez; PDF coloca un cartón por página.',
    'callList.headingHtml':'<strong>Lista de llamadas:</strong><br>',

    'card.headingN':    'Cartón {n}',
    'card.titleDefault':'Bingo',
    'canvas.generatedWith':'Generado con DrawSplat™',
    'canvas.free':      'GRATIS',

    'status.fewerItems':'Nota: Ingresaste menos elementos que casillas, por lo que algunos pueden repetirse.',
    'status.generated': 'Se generaron {n} cartón(es).',
    'alert.atLeastOne': 'Agrega al menos un elemento de bingo.',
    'alert.atLeastOneFree':'Agrega al menos un elemento de bingo además de FREE.',

    'footer.attributionHtml':'Generador de Cartones de Bingo DrawSplat<sup class="tm">TM</sup>.',
    'footer.openCaller':'Abrir cantador de bingo en vivo',
  },

  vi: {
    'doc.title':        'Trình tạo Thẻ Bingo — DrawSplat',
    'nav.brandAria':    'Trang chủ DrawSplat™',
    'nav.aria':         'Điều hướng trình tạo thẻ bingo',
    'nav.features':     'Tính năng',
    'nav.support':      'Hỗ trợ',
    'nav.bingoCaller':  'Người gọi Bingo trực tiếp',
    'nav.whiteboard':   'Bảng trắng',
    'nav.openWhiteboard':'Mở bảng trắng',

    'hero.eyebrow':     'Tiện ích lớp học',
    'hero.h1':          'Trình tạo Thẻ Bingo',
    'hero.subtitle':    'Tạo thẻ bingo có thể in từ từ vựng, câu hỏi, tên, khái niệm, hoặc các số B-I-N-G-O truyền thống.',

    'field.title':      'Tiêu đề thẻ',
    'field.titleDefault':'Bingo lớp học',
    'field.size':       'Kích thước lưới',
    'field.count':      'Số thẻ',
    'field.bg':         'Nền',
    'field.accent':     'Màu tiêu đề',
    'check.free':       'Dùng ô trung tâm MIỄN PHÍ khi có thể',
    'check.columns':    'Chỉ xáo trộn trong cột',
    'field.items':      'Mục / Từ / Cụm từ',
    'items.hint':       'Mỗi mục một dòng. Cho bingo số truyền thống, nhấp "Tải số B-I-N-G-O".',

    'button.generate':  'Tạo thẻ',
    'button.loadNums':  'Tải số B-I-N-G-O',
    'button.exportPdf': 'Xuất tất cả ra PDF',
    'button.print':     'In',
    'button.clear':     'Xóa',
    'button.downloadPng':'Tải PNG',

    'notice.tip.html':  '<strong>Mẹo:</strong> Dán từ vựng, câu hỏi ôn tập, tên, hoặc khái niệm. PNG tải từng thẻ một; PDF đặt một thẻ mỗi trang.',
    'callList.headingHtml':'<strong>Danh sách gọi:</strong><br>',

    'card.headingN':    'Thẻ {n}',
    'card.titleDefault':'Bingo',
    'canvas.generatedWith':'Tạo bằng DrawSplat™',
    'canvas.free':      'MIỄN PHÍ',

    'status.fewerItems':'Lưu ý: Bạn nhập ít mục hơn số ô, nên một số mục có thể lặp lại.',
    'status.generated': 'Đã tạo {n} thẻ.',
    'alert.atLeastOne': 'Thêm ít nhất một mục bingo.',
    'alert.atLeastOneFree':'Thêm ít nhất một mục bingo ngoài FREE.',

    'footer.attributionHtml':'Trình tạo Thẻ Bingo DrawSplat<sup class="tm">TM</sup>.',
    'footer.openCaller':'Mở Người gọi Bingo trực tiếp',
  },

  ar: {
    'doc.title':        'منشئ بطاقات البينغو — DrawSplat',
    'nav.brandAria':    'الصفحة الرئيسية لـ DrawSplat™',
    'nav.aria':         'تنقّل منشئ بطاقات البينغو',
    'nav.features':     'الميزات',
    'nav.support':      'الدعم',
    'nav.bingoCaller':  'منادي بينغو مباشر',
    'nav.whiteboard':   'السبورة',
    'nav.openWhiteboard':'فتح السبورة',

    'hero.eyebrow':     'أداة الفصل',
    'hero.h1':          'منشئ بطاقات البينغو',
    'hero.subtitle':    'أنشئ بطاقات بينغو قابلة للطباعة من كلمات أو أسئلة أو مفردات أو أسماء أو مفاهيم أو أرقام B-I-N-G-O التقليدية.',

    'field.title':      'عنوان البطاقة',
    'field.titleDefault':'بينغو الفصل',
    'field.size':       'حجم الشبكة',
    'field.count':      'البطاقات',
    'field.bg':         'الخلفية',
    'field.accent':     'لون العنوان',
    'check.free':       'استخدم الخانة المركزية المجانية عند الإمكان',
    'check.columns':    'اخلط داخل الأعمدة فقط',
    'field.items':      'العناصر / الكلمات / العبارات',
    'items.hint':       'عنصر واحد في كل سطر. لبينغو الأرقام التقليدي، انقر "تحميل أرقام B-I-N-G-O".',

    'button.generate':  'أنشئ البطاقات',
    'button.loadNums':  'تحميل أرقام B-I-N-G-O',
    'button.exportPdf': 'تصدير الكل إلى PDF',
    'button.print':     'طباعة',
    'button.clear':     'مسح',
    'button.downloadPng':'تنزيل PNG',

    'notice.tip.html':  '<strong>نصيحة:</strong> الصق المفردات أو أسئلة المراجعة أو الأسماء أو المفاهيم. PNG ينزّل بطاقة واحدة في المرة؛ PDF يضع بطاقة لكل صفحة.',
    'callList.headingHtml':'<strong>قائمة النداء:</strong><br>',

    'card.headingN':    'بطاقة {n}',
    'card.titleDefault':'بينغو',
    'canvas.generatedWith':'أُنشئ بواسطة DrawSplat™',
    'canvas.free':      'مجانية',

    'status.fewerItems':'ملاحظة: أدخلت عناصر أقل من المربعات، لذلك قد تتكرر بعض العناصر.',
    'status.generated': 'تم إنشاء {n} بطاقة (بطاقات).',
    'alert.atLeastOne': 'أضف عنصر بينغو واحدًا على الأقل.',
    'alert.atLeastOneFree':'أضف عنصر بينغو واحدًا على الأقل بخلاف FREE.',

    'footer.attributionHtml':'منشئ بطاقات البينغو من DrawSplat<sup class="tm">TM</sup>.',
    'footer.openCaller':'فتح منادي بينغو المباشر',
  },

  zh: {
    'doc.title':        '宾果卡片生成器 — DrawSplat',
    'nav.brandAria':    'DrawSplat™ 主页',
    'nav.aria':         '宾果卡片生成器导航',
    'nav.features':     '功能',
    'nav.support':      '支持',
    'nav.bingoCaller':  '现场宾果叫号员',
    'nav.whiteboard':   '白板',
    'nav.openWhiteboard':'打开白板',

    'hero.eyebrow':     '课堂小工具',
    'hero.h1':          '宾果卡片生成器',
    'hero.subtitle':    '从词语、问题、词汇、姓名、概念或传统 B-I-N-G-O 数字创建可打印的宾果卡片。',

    'field.title':      '卡片标题',
    'field.titleDefault':'课堂宾果',
    'field.size':       '网格尺寸',
    'field.count':      '卡片数',
    'field.bg':         '背景',
    'field.accent':     '标题颜色',
    'check.free':       '在可能时使用中心免费格',
    'check.columns':    '仅在列内打乱',
    'field.items':      '项目 / 词语 / 短语',
    'items.hint':       '每行一个项目。要使用传统数字宾果，请点击"加载 B-I-N-G-O 数字"。',

    'button.generate':  '生成卡片',
    'button.loadNums':  '加载 B-I-N-G-O 数字',
    'button.exportPdf': '导出全部为 PDF',
    'button.print':     '打印',
    'button.clear':     '清空',
    'button.downloadPng':'下载 PNG',

    'notice.tip.html':  '<strong>提示：</strong>粘贴词汇、复习问题、姓名或概念。PNG 一次下载一张；PDF 每页一张。',
    'callList.headingHtml':'<strong>呼叫列表：</strong><br>',

    'card.headingN':    '第 {n} 张',
    'card.titleDefault':'宾果',
    'canvas.generatedWith':'由 DrawSplat™ 生成',
    'canvas.free':      '免费',

    'status.fewerItems':'注意：你输入的项目少于方格数，因此有些项目可能会重复。',
    'status.generated': '已生成 {n} 张卡片。',
    'alert.atLeastOne': '请至少添加一个宾果项目。',
    'alert.atLeastOneFree':'请至少添加一个除 FREE 之外的宾果项目。',

    'footer.attributionHtml':'DrawSplat<sup class="tm">TM</sup> 宾果卡片生成器。',
    'footer.openCaller':'打开现场宾果叫号员',
  },

  uh: {
    'doc.title':        'बिंगो कार्ड जनरेटर — DrawSplat',
    'nav.brandAria':    'DrawSplat™ मुख पृष्ठ',
    'nav.aria':         'बिंगो कार्ड जनरेटर नेविगेशन',
    'nav.features':     'विशेषताएँ',
    'nav.support':      'सहायता',
    'nav.bingoCaller':  'लाइव बिंगो कॉलर',
    'nav.whiteboard':   'व्हाइटबोर्ड',
    'nav.openWhiteboard':'व्हाइटबोर्ड खोलें',

    'hero.eyebrow':     'कक्षा विजेट',
    'hero.h1':          'बिंगो कार्ड जनरेटर',
    'hero.subtitle':    'शब्दों, प्रश्नों, शब्दावली, नामों, अवधारणाओं या पारंपरिक B-I-N-G-O संख्याओं से प्रिंट करने योग्य बिंगो कार्ड बनाएँ।',

    'field.title':      'कार्ड शीर्षक',
    'field.titleDefault':'कक्षा बिंगो',
    'field.size':       'ग्रिड आकार',
    'field.count':      'कार्ड',
    'field.bg':         'पृष्ठभूमि',
    'field.accent':     'शीर्षक रंग',
    'check.free':       'जब संभव हो तब केंद्र मुफ़्त स्थान का उपयोग करें',
    'check.columns':    'केवल कॉलम के भीतर शफ़ल करें',
    'field.items':      'मद / शब्द / वाक्यांश',
    'items.hint':       'प्रति पंक्ति एक मद। पारंपरिक संख्या बिंगो के लिए, "B-I-N-G-O संख्याएँ लोड करें" पर क्लिक करें।',

    'button.generate':  'कार्ड बनाएँ',
    'button.loadNums':  'B-I-N-G-O संख्याएँ लोड करें',
    'button.exportPdf': 'सब PDF में निर्यात करें',
    'button.print':     'प्रिंट',
    'button.clear':     'साफ़ करें',
    'button.downloadPng':'PNG डाउनलोड',

    'notice.tip.html':  '<strong>सुझाव:</strong> शब्दावली, समीक्षा प्रश्न, नाम या अवधारणाएँ चिपकाएँ। PNG एक बार में एक कार्ड डाउनलोड करता है; PDF प्रति पृष्ठ एक कार्ड रखता है।',
    'callList.headingHtml':'<strong>कॉल सूची:</strong><br>',

    'card.headingN':    'कार्ड {n}',
    'card.titleDefault':'बिंगो',
    'canvas.generatedWith':'DrawSplat™ से बनाया गया',
    'canvas.free':      'मुफ़्त',

    'status.fewerItems':'नोट: आपने वर्गों से कम मद दर्ज किए हैं, इसलिए कुछ मद दोहराए जा सकते हैं।',
    'status.generated': '{n} कार्ड बनाए।',
    'alert.atLeastOne': 'कम से कम एक बिंगो मद जोड़ें।',
    'alert.atLeastOneFree':'FREE के अलावा कम से कम एक बिंगो मद जोड़ें।',

    'footer.attributionHtml':'DrawSplat<sup class="tm">TM</sup> बिंगो कार्ड जनरेटर।',
    'footer.openCaller':'लाइव बिंगो कॉलर खोलें',
  },

});
