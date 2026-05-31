// Graph Maker — i18n strings. AI-seeded; native-speaker review pending.
(function () {
  function reg(lang, strings) {
    if (window.WidgetI18n) window.WidgetI18n.register('graph-maker', strings, lang);
  }

  // English (source of truth)
  reg('en', {
    'page.title': 'Graph Maker — DrawSplat™ Tools',
    'header.eyebrow': 'DrawSplat™ Tools',
    'header.allTools': 'All Tools',
    'header.home': 'Home',
    'hero.title': 'Graph Maker',
    'hero.subtitle': 'Build a Cartesian coordinate grid, plot points, and draw lines for math lessons.',

    'group.grid': 'Coordinate grid',
    'group.points': 'Points',
    'group.line': 'Line: y = m·x + b',

    'form.titleLabel': 'Graph title',
    'form.titlePlaceholder': 'My Coordinate Plane',

    'form.quadrants': 'Quadrants',
    'form.quad1': '1 quadrant (positives only)',
    'form.quad4': '4 quadrants (origin centered)',

    'form.xMin': 'x min',
    'form.xMax': 'x max',
    'form.yMin': 'y min',
    'form.yMax': 'y max',
    'form.step': 'Step (gridline spacing)',

    'form.showGrid': 'Show gridlines',
    'form.showNumbers': 'Show axis numbers',
    'form.showLabels': 'Show point labels',
    'form.connect': 'Connect points (line graph)',

    'form.pointsLabel': 'Points — one per line: x,y or x,y,label',
    'form.pointsPlaceholder': '2,3\n-4,1\n5,-2',
    'form.pointsHint': 'Example: 2,3,A  draws a point at (2, 3) labeled A.',

    'form.enableLine': 'Draw y = m·x + b line',
    'form.slope': 'm (slope)',
    'form.intercept': 'b (y-intercept)',

    'stage.preview': 'Preview',
    'action.png': 'Download PNG',
    'action.svg': 'Download SVG',

    'err.heading': 'Something went wrong',
    'msg.noPoints': 'Add coordinate pairs to plot points.'
  });

  // Spanish — AI-seeded; native-speaker review pending.
  reg('es', {
    'page.title': 'Creador de Gráficas — DrawSplat™ Tools',
    'header.eyebrow': 'DrawSplat™ Tools',
    'header.allTools': 'Todas las herramientas',
    'header.home': 'Inicio',
    'hero.title': 'Creador de Gráficas',
    'hero.subtitle': 'Crea un plano cartesiano, marca puntos y traza rectas para clases de matemáticas.',

    'group.grid': 'Cuadrícula de coordenadas',
    'group.points': 'Puntos',
    'group.line': 'Recta: y = m·x + b',

    'form.titleLabel': 'Título de la gráfica',
    'form.titlePlaceholder': 'Mi plano cartesiano',

    'form.quadrants': 'Cuadrantes',
    'form.quad1': '1 cuadrante (solo positivos)',
    'form.quad4': '4 cuadrantes (origen centrado)',

    'form.xMin': 'x mín',
    'form.xMax': 'x máx',
    'form.yMin': 'y mín',
    'form.yMax': 'y máx',
    'form.step': 'Paso (separación de líneas)',

    'form.showGrid': 'Mostrar cuadrícula',
    'form.showNumbers': 'Mostrar números de ejes',
    'form.showLabels': 'Mostrar etiquetas de puntos',
    'form.connect': 'Conectar puntos (gráfica de líneas)',

    'form.pointsLabel': 'Puntos — uno por línea: x,y o x,y,etiqueta',
    'form.pointsPlaceholder': '2,3\n-4,1\n5,-2',
    'form.pointsHint': 'Ejemplo: 2,3,A traza un punto en (2, 3) con la etiqueta A.',

    'form.enableLine': 'Trazar recta y = m·x + b',
    'form.slope': 'm (pendiente)',
    'form.intercept': 'b (ordenada al origen)',

    'stage.preview': 'Vista previa',
    'action.png': 'Descargar PNG',
    'action.svg': 'Descargar SVG',

    'err.heading': 'Algo salió mal',
    'msg.noPoints': 'Agrega pares de coordenadas para marcar puntos.'
  });

  // Vietnamese — AI-seeded; native-speaker review pending.
  reg('vi', {
    'page.title': 'Trình Tạo Đồ Thị — DrawSplat™ Tools',
    'header.eyebrow': 'DrawSplat™ Tools',
    'header.allTools': 'Tất cả công cụ',
    'header.home': 'Trang chủ',
    'hero.title': 'Trình Tạo Đồ Thị',
    'hero.subtitle': 'Tạo lưới tọa độ Descartes, vẽ điểm và đường thẳng cho bài học toán.',

    'group.grid': 'Lưới tọa độ',
    'group.points': 'Điểm',
    'group.line': 'Đường thẳng: y = m·x + b',

    'form.titleLabel': 'Tiêu đề đồ thị',
    'form.titlePlaceholder': 'Mặt phẳng tọa độ của tôi',

    'form.quadrants': 'Góc phần tư',
    'form.quad1': '1 góc phần tư (chỉ số dương)',
    'form.quad4': '4 góc phần tư (gốc ở giữa)',

    'form.xMin': 'x nhỏ nhất',
    'form.xMax': 'x lớn nhất',
    'form.yMin': 'y nhỏ nhất',
    'form.yMax': 'y lớn nhất',
    'form.step': 'Bước (khoảng cách lưới)',

    'form.showGrid': 'Hiện đường lưới',
    'form.showNumbers': 'Hiện số trên trục',
    'form.showLabels': 'Hiện nhãn điểm',
    'form.connect': 'Nối các điểm (đồ thị đường)',

    'form.pointsLabel': 'Điểm — mỗi dòng một điểm: x,y hoặc x,y,nhãn',
    'form.pointsPlaceholder': '2,3\n-4,1\n5,-2',
    'form.pointsHint': 'Ví dụ: 2,3,A vẽ một điểm tại (2, 3) có nhãn A.',

    'form.enableLine': 'Vẽ đường y = m·x + b',
    'form.slope': 'm (hệ số góc)',
    'form.intercept': 'b (giao điểm trục y)',

    'stage.preview': 'Xem trước',
    'action.png': 'Tải PNG',
    'action.svg': 'Tải SVG',

    'err.heading': 'Đã xảy ra lỗi',
    'msg.noPoints': 'Thêm các cặp tọa độ để vẽ điểm.'
  });

  // Arabic — AI-seeded; native-speaker review pending.
  reg('ar', {
    'page.title': 'صانع الرسوم البيانية — DrawSplat™ Tools',
    'header.eyebrow': 'DrawSplat™ Tools',
    'header.allTools': 'كل الأدوات',
    'header.home': 'الرئيسية',
    'hero.title': 'صانع الرسوم البيانية',
    'hero.subtitle': 'أنشئ شبكة إحداثيات ديكارتية وارسم النقاط والخطوط لدروس الرياضيات.',

    'group.grid': 'شبكة الإحداثيات',
    'group.points': 'النقاط',
    'group.line': 'الخط: y = m·x + b',

    'form.titleLabel': 'عنوان الرسم',
    'form.titlePlaceholder': 'مستوى الإحداثيات الخاص بي',

    'form.quadrants': 'الأرباع',
    'form.quad1': 'ربع واحد (القيم الموجبة فقط)',
    'form.quad4': 'أربعة أرباع (الأصل في المنتصف)',

    'form.xMin': 'أصغر x',
    'form.xMax': 'أكبر x',
    'form.yMin': 'أصغر y',
    'form.yMax': 'أكبر y',
    'form.step': 'الخطوة (تباعد خطوط الشبكة)',

    'form.showGrid': 'إظهار خطوط الشبكة',
    'form.showNumbers': 'إظهار أرقام المحاور',
    'form.showLabels': 'إظهار تسميات النقاط',
    'form.connect': 'وصل النقاط (رسم خطي)',

    'form.pointsLabel': 'النقاط — واحدة في كل سطر: x,y أو x,y,التسمية',
    'form.pointsPlaceholder': '2,3\n-4,1\n5,-2',
    'form.pointsHint': 'مثال: 2,3,A يرسم نقطة عند (2، 3) بالتسمية A.',

    'form.enableLine': 'ارسم الخط y = m·x + b',
    'form.slope': 'm (الميل)',
    'form.intercept': 'b (التقاطع مع المحور y)',

    'stage.preview': 'معاينة',
    'action.png': 'تنزيل PNG',
    'action.svg': 'تنزيل SVG',

    'err.heading': 'حدث خطأ ما',
    'msg.noPoints': 'أضف أزواج إحداثيات لرسم النقاط.'
  });

  // Chinese (Simplified) — AI-seeded; native-speaker review pending.
  reg('zh', {
    'page.title': '坐标图制作器 — DrawSplat™ Tools',
    'header.eyebrow': 'DrawSplat™ Tools',
    'header.allTools': '所有工具',
    'header.home': '主页',
    'hero.title': '坐标图制作器',
    'hero.subtitle': '为数学课构建笛卡尔坐标网格、绘制点和直线。',

    'group.grid': '坐标网格',
    'group.points': '点',
    'group.line': '直线：y = m·x + b',

    'form.titleLabel': '图表标题',
    'form.titlePlaceholder': '我的坐标平面',

    'form.quadrants': '象限',
    'form.quad1': '1 个象限（仅正值）',
    'form.quad4': '4 个象限（原点居中）',

    'form.xMin': 'x 最小值',
    'form.xMax': 'x 最大值',
    'form.yMin': 'y 最小值',
    'form.yMax': 'y 最大值',
    'form.step': '步长（网格间距）',

    'form.showGrid': '显示网格线',
    'form.showNumbers': '显示坐标轴数字',
    'form.showLabels': '显示点标签',
    'form.connect': '连接各点（折线图）',

    'form.pointsLabel': '点 — 每行一个：x,y 或 x,y,标签',
    'form.pointsPlaceholder': '2,3\n-4,1\n5,-2',
    'form.pointsHint': '示例：2,3,A 在 (2, 3) 处绘制一个标记为 A 的点。',

    'form.enableLine': '绘制 y = m·x + b 直线',
    'form.slope': 'm（斜率）',
    'form.intercept': 'b（y 截距）',

    'stage.preview': '预览',
    'action.png': '下载 PNG',
    'action.svg': '下载 SVG',

    'err.heading': '出了点问题',
    'msg.noPoints': '添加坐标对以绘制点。'
  });

  // Hawaiian — AI-seeded; native-speaker review pending.
  reg('uh', {
    'page.title': 'Mea Hana Pakuhi — DrawSplat™ Tools',
    'header.eyebrow': 'DrawSplat™ Tools',
    'header.allTools': 'Nā Mea Hana a Pau',
    'header.home': 'Home',
    'hero.title': 'Mea Hana Pakuhi',
    'hero.subtitle': 'E kūkulu i kahi mākālua hōʻailona, e kaha i nā kiko a me nā laina no nā haʻawina makemakika.',

    'group.grid': 'Mākālua hōʻailona',
    'group.points': 'Nā kiko',
    'group.line': 'Laina: y = m·x + b',

    'form.titleLabel': 'Poʻo inoa o ka pakuhi',
    'form.titlePlaceholder': 'Kuʻu mākālua hōʻailona',

    'form.quadrants': 'Nā hapahā',
    'form.quad1': '1 hapahā (nā helu maikaʻi wale nō)',
    'form.quad4': '4 hapahā (waena ke kumu)',

    'form.xMin': 'x liʻiliʻi',
    'form.xMax': 'x nui',
    'form.yMin': 'y liʻiliʻi',
    'form.yMax': 'y nui',
    'form.step': 'Kaʻina (kaʻawale o nā laina)',

    'form.showGrid': 'Hōʻike i nā laina mākālua',
    'form.showNumbers': 'Hōʻike i nā helu o nā koʻo',
    'form.showLabels': 'Hōʻike i nā lepili kiko',
    'form.connect': 'E hoʻopili i nā kiko (pakuhi laina)',

    'form.pointsLabel': 'Nā kiko — hoʻokahi i kēlā me kēia laina: x,y a i ʻole x,y,lepili',
    'form.pointsPlaceholder': '2,3\n-4,1\n5,-2',
    'form.pointsHint': 'Laʻana: 2,3,A e kaha i kahi kiko ma (2, 3) me ka lepili A.',

    'form.enableLine': 'E kaha i ka laina y = m·x + b',
    'form.slope': 'm (kahua)',
    'form.intercept': 'b (ke kikoʻī y)',

    'stage.preview': 'Nānā mua',
    'action.png': 'Hoʻoiho PNG',
    'action.svg': 'Hoʻoiho SVG',

    'err.heading': 'Ua hewa kekahi mea',
    'msg.noPoints': 'E hoʻohui i nā pālua hōʻailona e kaha ai i nā kiko.'
  });
})();
