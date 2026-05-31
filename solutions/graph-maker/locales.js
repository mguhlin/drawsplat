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
    'hero.subtitle': 'Make bar, line, area, and pie charts from your data — plus a coordinate plane mode for plotting points and lines in math lessons.',

    'form.typeLabel': 'Graph type',
    'type.bar': 'Bar',
    'type.line': 'Line',
    'type.area': 'Area',
    'type.pie': 'Pie',
    'type.coord': 'Coordinate Plane',

    'group.data': 'Data',
    'group.labels': 'Labels',
    'group.grid': 'Coordinate grid',
    'group.points': 'Points',
    'group.line': 'Line: y = m·x + b',

    'form.dataLabel': 'Data — one row per line: Category,Value',
    'form.dataPlaceholder': 'Pizza,12\nTacos,8\nSalad,5\nSushi,6',
    'form.dataHint': 'Example: Pizza,12 makes a bar (or slice) for Pizza worth 12.',
    'form.xLabel': 'X-axis label',
    'form.xLabelPlaceholder': 'Category',
    'form.yLabel': 'Y-axis label (ignored for pie)',
    'form.yLabelPlaceholder': 'Value',
    'form.sourceLabel': 'Source / attribution (optional)',
    'form.sourcePlaceholder': 'Class survey',
    'form.chartTitlePlaceholder': 'Class favorites',

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
    'msg.noPoints': 'Add coordinate pairs to plot points.',
    'msg.emptyData': 'Add Category,Value rows to draw a chart.',
    'msg.defaultTitle': 'Graph',
    'msg.sourcePrefix': 'Source:'
  });

  // Spanish — AI-seeded; native-speaker review pending.
  reg('es', {
    'page.title': 'Creador de Gráficas — DrawSplat™ Tools',
    'header.eyebrow': 'DrawSplat™ Tools',
    'header.allTools': 'Todas las herramientas',
    'header.home': 'Inicio',
    'hero.title': 'Creador de Gráficas',
    'hero.subtitle': 'Crea gráficas de barras, líneas, áreas y circulares con tus datos, además de un modo de plano cartesiano para marcar puntos y rectas en clases de matemáticas.',

    'form.typeLabel': 'Tipo de gráfica',
    'type.bar': 'Barras',
    'type.line': 'Líneas',
    'type.area': 'Área',
    'type.pie': 'Circular',
    'type.coord': 'Plano cartesiano',

    'group.data': 'Datos',
    'group.labels': 'Etiquetas',
    'group.grid': 'Cuadrícula de coordenadas',
    'group.points': 'Puntos',
    'group.line': 'Recta: y = m·x + b',

    'form.dataLabel': 'Datos — una fila por línea: Categoría,Valor',
    'form.dataPlaceholder': 'Pizza,12\nTacos,8\nEnsalada,5\nSushi,6',
    'form.dataHint': 'Ejemplo: Pizza,12 crea una barra (o sector) de Pizza con valor 12.',
    'form.xLabel': 'Etiqueta del eje X',
    'form.xLabelPlaceholder': 'Categoría',
    'form.yLabel': 'Etiqueta del eje Y (se ignora en circular)',
    'form.yLabelPlaceholder': 'Valor',
    'form.sourceLabel': 'Fuente / atribución (opcional)',
    'form.sourcePlaceholder': 'Encuesta de clase',
    'form.chartTitlePlaceholder': 'Favoritos de la clase',

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
    'msg.noPoints': 'Agrega pares de coordenadas para marcar puntos.',
    'msg.emptyData': 'Agrega filas Categoría,Valor para dibujar una gráfica.',
    'msg.defaultTitle': 'Gráfica',
    'msg.sourcePrefix': 'Fuente:'
  });

  // Vietnamese — AI-seeded; native-speaker review pending.
  reg('vi', {
    'page.title': 'Trình Tạo Đồ Thị — DrawSplat™ Tools',
    'header.eyebrow': 'DrawSplat™ Tools',
    'header.allTools': 'Tất cả công cụ',
    'header.home': 'Trang chủ',
    'hero.title': 'Trình Tạo Đồ Thị',
    'hero.subtitle': 'Tạo biểu đồ cột, đường, vùng và tròn từ dữ liệu của bạn — kèm chế độ mặt phẳng tọa độ để vẽ điểm và đường thẳng cho bài học toán.',

    'form.typeLabel': 'Loại đồ thị',
    'type.bar': 'Cột',
    'type.line': 'Đường',
    'type.area': 'Vùng',
    'type.pie': 'Tròn',
    'type.coord': 'Mặt phẳng tọa độ',

    'group.data': 'Dữ liệu',
    'group.labels': 'Nhãn',
    'group.grid': 'Lưới tọa độ',
    'group.points': 'Điểm',
    'group.line': 'Đường thẳng: y = m·x + b',

    'form.dataLabel': 'Dữ liệu — mỗi dòng một hàng: Danh mục,Giá trị',
    'form.dataPlaceholder': 'Pizza,12\nTacos,8\nSalad,5\nSushi,6',
    'form.dataHint': 'Ví dụ: Pizza,12 tạo một cột (hoặc lát) cho Pizza với giá trị 12.',
    'form.xLabel': 'Nhãn trục X',
    'form.xLabelPlaceholder': 'Danh mục',
    'form.yLabel': 'Nhãn trục Y (bỏ qua với biểu đồ tròn)',
    'form.yLabelPlaceholder': 'Giá trị',
    'form.sourceLabel': 'Nguồn / ghi công (tùy chọn)',
    'form.sourcePlaceholder': 'Khảo sát lớp học',
    'form.chartTitlePlaceholder': 'Yêu thích của lớp',

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
    'msg.noPoints': 'Thêm các cặp tọa độ để vẽ điểm.',
    'msg.emptyData': 'Thêm các hàng Danh mục,Giá trị để vẽ biểu đồ.',
    'msg.defaultTitle': 'Đồ thị',
    'msg.sourcePrefix': 'Nguồn:'
  });

  // Arabic — AI-seeded; native-speaker review pending.
  reg('ar', {
    'page.title': 'صانع الرسوم البيانية — DrawSplat™ Tools',
    'header.eyebrow': 'DrawSplat™ Tools',
    'header.allTools': 'كل الأدوات',
    'header.home': 'الرئيسية',
    'hero.title': 'صانع الرسوم البيانية',
    'hero.subtitle': 'أنشئ رسومًا بيانية بالأعمدة والخطوط والمساحات والدوائر من بياناتك، بالإضافة إلى وضع المستوى الإحداثي لرسم النقاط والخطوط في دروس الرياضيات.',

    'form.typeLabel': 'نوع الرسم',
    'type.bar': 'أعمدة',
    'type.line': 'خطي',
    'type.area': 'مساحي',
    'type.pie': 'دائري',
    'type.coord': 'المستوى الإحداثي',

    'group.data': 'البيانات',
    'group.labels': 'التسميات',
    'group.grid': 'شبكة الإحداثيات',
    'group.points': 'النقاط',
    'group.line': 'الخط: y = m·x + b',

    'form.dataLabel': 'البيانات — صف واحد في كل سطر: الفئة،القيمة',
    'form.dataPlaceholder': 'Pizza,12\nTacos,8\nSalad,5\nSushi,6',
    'form.dataHint': 'مثال: Pizza,12 ينشئ عمودًا (أو قطاعًا) للبيتزا بقيمة 12.',
    'form.xLabel': 'تسمية المحور X',
    'form.xLabelPlaceholder': 'الفئة',
    'form.yLabel': 'تسمية المحور Y (تُتجاهَل في الدائري)',
    'form.yLabelPlaceholder': 'القيمة',
    'form.sourceLabel': 'المصدر / الإسناد (اختياري)',
    'form.sourcePlaceholder': 'استطلاع الصف',
    'form.chartTitlePlaceholder': 'مفضلات الصف',

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
    'msg.noPoints': 'أضف أزواج إحداثيات لرسم النقاط.',
    'msg.emptyData': 'أضف صفوف الفئة،القيمة لرسم رسم بياني.',
    'msg.defaultTitle': 'رسم بياني',
    'msg.sourcePrefix': 'المصدر:'
  });

  // Chinese (Simplified) — AI-seeded; native-speaker review pending.
  reg('zh', {
    'page.title': '坐标图制作器 — DrawSplat™ Tools',
    'header.eyebrow': 'DrawSplat™ Tools',
    'header.allTools': '所有工具',
    'header.home': '主页',
    'hero.title': '坐标图制作器',
    'hero.subtitle': '用你的数据制作柱状图、折线图、面积图和饼图，还有坐标平面模式可在数学课上绘制点和直线。',

    'form.typeLabel': '图表类型',
    'type.bar': '柱状图',
    'type.line': '折线图',
    'type.area': '面积图',
    'type.pie': '饼图',
    'type.coord': '坐标平面',

    'group.data': '数据',
    'group.labels': '标签',
    'group.grid': '坐标网格',
    'group.points': '点',
    'group.line': '直线：y = m·x + b',

    'form.dataLabel': '数据 — 每行一条：类别,数值',
    'form.dataPlaceholder': 'Pizza,12\nTacos,8\nSalad,5\nSushi,6',
    'form.dataHint': '示例：Pizza,12 为 Pizza 生成一个数值为 12 的柱（或扇区）。',
    'form.xLabel': 'X 轴标签',
    'form.xLabelPlaceholder': '类别',
    'form.yLabel': 'Y 轴标签（饼图忽略）',
    'form.yLabelPlaceholder': '数值',
    'form.sourceLabel': '来源 / 署名（可选）',
    'form.sourcePlaceholder': '课堂调查',
    'form.chartTitlePlaceholder': '班级最爱',

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
    'msg.noPoints': '添加坐标对以绘制点。',
    'msg.emptyData': '添加“类别,数值”行以绘制图表。',
    'msg.defaultTitle': '图表',
    'msg.sourcePrefix': '来源：'
  });

  // Hawaiian — AI-seeded; native-speaker review pending.
  reg('uh', {
    'page.title': 'Mea Hana Pakuhi — DrawSplat™ Tools',
    'header.eyebrow': 'DrawSplat™ Tools',
    'header.allTools': 'Nā Mea Hana a Pau',
    'header.home': 'Home',
    'hero.title': 'Mea Hana Pakuhi',
    'hero.subtitle': 'E hana i nā pakuhi kolamu, laina, ʻāpana, a poepoe mai kāu ʻikepili — me ke ʻano mākālua hōʻailona no ke kaha ʻana i nā kiko a me nā laina no nā haʻawina makemakika.',

    'form.typeLabel': 'ʻAno pakuhi',
    'type.bar': 'Kolamu',
    'type.line': 'Laina',
    'type.area': 'ʻĀpana',
    'type.pie': 'Poepoe',
    'type.coord': 'Mākālua hōʻailona',

    'group.data': 'ʻIkepili',
    'group.labels': 'Nā lepili',
    'group.grid': 'Mākālua hōʻailona',
    'group.points': 'Nā kiko',
    'group.line': 'Laina: y = m·x + b',

    'form.dataLabel': 'ʻIkepili — hoʻokahi lālani i kēlā me kēia laina: Māhele,Waiwai',
    'form.dataPlaceholder': 'Pizza,12\nTacos,8\nSalad,5\nSushi,6',
    'form.dataHint': 'Laʻana: Pizza,12 e hana i kahi kolamu (a ʻāpana paha) no Pizza me ka waiwai 12.',
    'form.xLabel': 'Lepili koʻo X',
    'form.xLabelPlaceholder': 'Māhele',
    'form.yLabel': 'Lepili koʻo Y (haʻalele ʻia no ka poepoe)',
    'form.yLabelPlaceholder': 'Waiwai',
    'form.sourceLabel': 'Kumu / hōʻaiā (koho)',
    'form.sourcePlaceholder': 'Noiʻi papa',
    'form.chartTitlePlaceholder': 'Nā punahele o ka papa',

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
    'msg.noPoints': 'E hoʻohui i nā pālua hōʻailona e kaha ai i nā kiko.',
    'msg.emptyData': 'E hoʻohui i nā lālani Māhele,Waiwai e kaha ai i kahi pakuhi.',
    'msg.defaultTitle': 'Pakuhi',
    'msg.sourcePrefix': 'Kumu:'
  });
})();
