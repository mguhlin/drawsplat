/* Bingo Caller — locale dictionary. AI-seeded; native-speaker review pending.

   The B-I-N-G-O letter prefixes and ball numbers stay literal English/numeric
   so traditional bingo gameplay is preserved across locales. Custom call
   items typed by the teacher in the textarea are shown verbatim. */
WidgetI18n.register('bingo-caller', {

  en: {
    'doc.title':        'Bingo Caller — DrawSplat',
    'nav.brandAria':    'DrawSplat™ home',
    'nav.aria':         'Bingo navigation',
    'nav.features':     'Features',
    'nav.support':      'Support',
    'nav.cardGen':      'Bingo Card Generator',
    'nav.whiteboard':   'Whiteboard',
    'nav.openWhiteboard':'Open Whiteboard',

    'hero.eyebrow':     'Classroom Widget',
    'hero.h1':          'Live Bingo Caller',
    'hero.subtitle':    'Run a bingo-style call board with an animated ball picker. Players can generate a card and mark spaces on the same device or same-browser tabs.',

    'field.mode':       'Mode',
    'mode.caller':      'Caller / Host',
    'mode.player':      'Player Card',
    'button.newGame':   'New Game',
    'button.pickBall':  'Pick Ball',
    'field.room':       'Room Name',
    'room.default':     'classroom-bingo',
    'hint.room':        'Same-device tabs sync through this room name. Remote internet play requires a small relay service such as Firebase, Supabase, or a WebSocket server.',
    'field.playerName': 'Player Name',
    'playerName.ph':    'Student name',
    'button.join':      'Create / Refresh Player Card',
    'limit.online.html':'<strong>Online note:</strong> This standalone page is self-contained. For 50 remote players, connect <code>saveState()</code> and <code>loadState()</code> to a hosted database.',
    'field.customCalls':'Custom Call Items',
    'customCalls.ph':   'Optional: one call item per line. Leave blank for traditional B-I-N-G-O numbers.',
    'button.useCustom': 'Use Custom Call List',

    'stage.ready':      'Ready',
    'stage.allCalled':  'All balls called',
    'button.repeat':    'Repeat Current',
    'button.resetMarks':'Clear Player Marks',

    'card.h2':          'Player Card',
    'card.free':        'FREE',
    'winner.text':      'BINGO! Check this card with the caller.',

    'alert.needItems':  'Add custom call items or leave blank for traditional numbers.',

    'footer.attributionHtml':'DrawSplat<sup class="tm">TM</sup> Live Bingo Caller.',
    'footer.cards':     'Create printable cards',
  },

  es: {
    'doc.title':        'Cantador de Bingo — DrawSplat',
    'nav.brandAria':    'Inicio de DrawSplat™',
    'nav.aria':         'Navegación de bingo',
    'nav.features':     'Funciones',
    'nav.support':      'Soporte',
    'nav.cardGen':      'Generador de Cartones de Bingo',
    'nav.whiteboard':   'Pizarra',
    'nav.openWhiteboard':'Abrir Pizarra',

    'hero.eyebrow':     'Widget para el aula',
    'hero.h1':          'Cantador de Bingo en Vivo',
    'hero.subtitle':    'Lleva un tablero de canto tipo bingo con un selector de bolas animado. Los jugadores pueden generar un cartón y marcar casillas en el mismo dispositivo o en pestañas del mismo navegador.',

    'field.mode':       'Modo',
    'mode.caller':      'Cantador / Anfitrión',
    'mode.player':      'Cartón del jugador',
    'button.newGame':   'Nuevo juego',
    'button.pickBall':  'Sacar bola',
    'field.room':       'Nombre de la sala',
    'room.default':     'bingo-del-aula',
    'hint.room':        'Las pestañas del mismo dispositivo se sincronizan con este nombre de sala. El juego remoto por Internet requiere un servicio de relay como Firebase, Supabase o un servidor WebSocket.',
    'field.playerName': 'Nombre del jugador',
    'playerName.ph':    'Nombre del estudiante',
    'button.join':      'Crear / Actualizar cartón del jugador',
    'limit.online.html':'<strong>Nota en línea:</strong> Esta página es autónoma. Para 50 jugadores remotos, conecta <code>saveState()</code> y <code>loadState()</code> a una base de datos alojada.',
    'field.customCalls':'Elementos personalizados',
    'customCalls.ph':   'Opcional: un elemento por línea. Deja en blanco para números B-I-N-G-O tradicionales.',
    'button.useCustom': 'Usar lista personalizada',

    'stage.ready':      'Listo',
    'stage.allCalled':  'Todas las bolas cantadas',
    'button.repeat':    'Repetir actual',
    'button.resetMarks':'Borrar marcas del jugador',

    'card.h2':          'Cartón del jugador',
    'card.free':        'GRATIS',
    'winner.text':      '¡BINGO! Verifica este cartón con el cantador.',

    'alert.needItems':  'Agrega elementos personalizados o deja en blanco para números tradicionales.',

    'footer.attributionHtml':'Cantador de Bingo en Vivo DrawSplat<sup class="tm">TM</sup>.',
    'footer.cards':     'Crear cartones imprimibles',
  },

  vi: {
    'doc.title':        'Người gọi Bingo — DrawSplat',
    'nav.brandAria':    'Trang chủ DrawSplat™',
    'nav.aria':         'Điều hướng Bingo',
    'nav.features':     'Tính năng',
    'nav.support':      'Hỗ trợ',
    'nav.cardGen':      'Trình tạo Thẻ Bingo',
    'nav.whiteboard':   'Bảng trắng',
    'nav.openWhiteboard':'Mở bảng trắng',

    'hero.eyebrow':     'Tiện ích lớp học',
    'hero.h1':          'Người gọi Bingo Trực tiếp',
    'hero.subtitle':    'Chạy một bảng gọi kiểu bingo với bộ chọn bóng có hiệu ứng. Người chơi có thể tạo thẻ và đánh dấu trên cùng một thiết bị hoặc các tab cùng trình duyệt.',

    'field.mode':       'Chế độ',
    'mode.caller':      'Người gọi / Chủ trì',
    'mode.player':      'Thẻ người chơi',
    'button.newGame':   'Trò chơi mới',
    'button.pickBall':  'Chọn bóng',
    'field.room':       'Tên phòng',
    'room.default':     'bingo-lop-hoc',
    'hint.room':        'Các tab trên cùng thiết bị đồng bộ qua tên phòng. Chơi từ xa qua Internet cần một dịch vụ relay như Firebase, Supabase, hoặc máy chủ WebSocket.',
    'field.playerName': 'Tên người chơi',
    'playerName.ph':    'Tên học sinh',
    'button.join':      'Tạo / Làm mới thẻ người chơi',
    'limit.online.html':'<strong>Lưu ý trực tuyến:</strong> Trang này độc lập. Cho 50 người chơi từ xa, hãy kết nối <code>saveState()</code> và <code>loadState()</code> với cơ sở dữ liệu.',
    'field.customCalls':'Mục gọi tùy chỉnh',
    'customCalls.ph':   'Tùy chọn: mỗi dòng một mục. Để trống cho số B-I-N-G-O truyền thống.',
    'button.useCustom': 'Dùng danh sách tùy chỉnh',

    'stage.ready':      'Sẵn sàng',
    'stage.allCalled':  'Đã gọi hết bóng',
    'button.repeat':    'Lặp lại',
    'button.resetMarks':'Xóa đánh dấu',

    'card.h2':          'Thẻ người chơi',
    'card.free':        'MIỄN PHÍ',
    'winner.text':      'BINGO! Kiểm tra thẻ này với người gọi.',

    'alert.needItems':  'Thêm mục gọi tùy chỉnh hoặc để trống cho số truyền thống.',

    'footer.attributionHtml':'Người gọi Bingo Trực tiếp DrawSplat<sup class="tm">TM</sup>.',
    'footer.cards':     'Tạo thẻ in được',
  },

  ar: {
    'doc.title':        'منادي البينغو — DrawSplat',
    'nav.brandAria':    'الصفحة الرئيسية لـ DrawSplat™',
    'nav.aria':         'تنقّل البينغو',
    'nav.features':     'الميزات',
    'nav.support':      'الدعم',
    'nav.cardGen':      'منشئ بطاقات البينغو',
    'nav.whiteboard':   'السبورة',
    'nav.openWhiteboard':'فتح السبورة',

    'hero.eyebrow':     'أداة الفصل',
    'hero.h1':          'منادي البينغو المباشر',
    'hero.subtitle':    'شغّل لوحة نداء بأسلوب البينغو مع منتقي كرات متحرك. يمكن للاعبين إنشاء بطاقة ووضع علامات على نفس الجهاز أو في تبويبات نفس المتصفح.',

    'field.mode':       'الوضع',
    'mode.caller':      'المنادي / المضيف',
    'mode.player':      'بطاقة اللاعب',
    'button.newGame':   'لعبة جديدة',
    'button.pickBall':  'اختر كرة',
    'field.room':       'اسم الغرفة',
    'room.default':     'بينغو-الفصل',
    'hint.room':        'تتزامن تبويبات نفس الجهاز عبر اسم الغرفة. اللعب عن بُعد عبر الإنترنت يتطلب خدمة ترحيل مثل Firebase أو Supabase أو خادم WebSocket.',
    'field.playerName': 'اسم اللاعب',
    'playerName.ph':    'اسم الطالب',
    'button.join':      'إنشاء / تحديث بطاقة اللاعب',
    'limit.online.html':'<strong>ملاحظة عبر الإنترنت:</strong> هذه الصفحة مستقلة. لـ 50 لاعبًا عن بعد، اربط <code>saveState()</code> و <code>loadState()</code> بقاعدة بيانات مستضافة.',
    'field.customCalls':'عناصر نداء مخصصة',
    'customCalls.ph':   'اختياري: عنصر واحد في كل سطر. اترك فارغًا للأرقام التقليدية.',
    'button.useCustom': 'استخدم قائمة مخصصة',

    'stage.ready':      'جاهز',
    'stage.allCalled':  'تم نداء جميع الكرات',
    'button.repeat':    'كرّر الحالي',
    'button.resetMarks':'مسح علامات اللاعب',

    'card.h2':          'بطاقة اللاعب',
    'card.free':        'مجانية',
    'winner.text':      'بينغو! تحقّق من هذه البطاقة مع المنادي.',

    'alert.needItems':  'أضف عناصر نداء مخصصة أو اتركها فارغة للأرقام التقليدية.',

    'footer.attributionHtml':'منادي البينغو المباشر من DrawSplat<sup class="tm">TM</sup>.',
    'footer.cards':     'إنشاء بطاقات قابلة للطباعة',
  },

  zh: {
    'doc.title':        '宾果叫号员 — DrawSplat',
    'nav.brandAria':    'DrawSplat™ 主页',
    'nav.aria':         '宾果导航',
    'nav.features':     '功能',
    'nav.support':      '支持',
    'nav.cardGen':      '宾果卡片生成器',
    'nav.whiteboard':   '白板',
    'nav.openWhiteboard':'打开白板',

    'hero.eyebrow':     '课堂小工具',
    'hero.h1':          '现场宾果叫号员',
    'hero.subtitle':    '运行带有动画选球器的宾果叫号板。玩家可以在同一设备或同一浏览器标签页中生成卡片并标记格子。',

    'field.mode':       '模式',
    'mode.caller':      '叫号员 / 主持',
    'mode.player':      '玩家卡片',
    'button.newGame':   '新游戏',
    'button.pickBall':  '抽球',
    'field.room':       '房间名称',
    'room.default':     '课堂宾果',
    'hint.room':        '同一设备上的标签页通过此房间名称同步。远程联机需要小型中继服务，如 Firebase、Supabase 或 WebSocket 服务器。',
    'field.playerName': '玩家名称',
    'playerName.ph':    '学生姓名',
    'button.join':      '创建 / 刷新玩家卡片',
    'limit.online.html':'<strong>在线说明：</strong>此页面是自包含的。如果有 50 名远程玩家，请将 <code>saveState()</code> 和 <code>loadState()</code> 连接到托管数据库。',
    'field.customCalls':'自定义叫号项',
    'customCalls.ph':   '可选：每行一项。留空使用传统 B-I-N-G-O 数字。',
    'button.useCustom': '使用自定义列表',

    'stage.ready':      '就绪',
    'stage.allCalled':  '所有球已叫完',
    'button.repeat':    '重复当前',
    'button.resetMarks':'清除玩家标记',

    'card.h2':          '玩家卡片',
    'card.free':        '免费',
    'winner.text':      '宾果！请向叫号员核对此卡。',

    'alert.needItems':  '添加自定义叫号项或留空使用传统数字。',

    'footer.attributionHtml':'DrawSplat<sup class="tm">TM</sup> 现场宾果叫号员。',
    'footer.cards':     '制作可打印卡片',
  },

  uh: {
    'doc.title':        'बिंगो कॉलर — DrawSplat',
    'nav.brandAria':    'DrawSplat™ मुख पृष्ठ',
    'nav.aria':         'बिंगो नेविगेशन',
    'nav.features':     'विशेषताएँ',
    'nav.support':      'सहायता',
    'nav.cardGen':      'बिंगो कार्ड जनरेटर',
    'nav.whiteboard':   'व्हाइटबोर्ड',
    'nav.openWhiteboard':'व्हाइटबोर्ड खोलें',

    'hero.eyebrow':     'कक्षा विजेट',
    'hero.h1':          'लाइव बिंगो कॉलर',
    'hero.subtitle':    'एनिमेटेड बॉल पिकर के साथ बिंगो-शैली का कॉल बोर्ड चलाएँ। खिलाड़ी एक ही डिवाइस या एक ही ब्राउज़र के टैब्स पर कार्ड बना सकते हैं और स्थान चिह्नित कर सकते हैं।',

    'field.mode':       'मोड',
    'mode.caller':      'कॉलर / होस्ट',
    'mode.player':      'खिलाड़ी कार्ड',
    'button.newGame':   'नया खेल',
    'button.pickBall':  'गेंद चुनें',
    'field.room':       'कमरे का नाम',
    'room.default':     'कक्षा-बिंगो',
    'hint.room':        'एक ही डिवाइस के टैब इस कमरे के नाम से सिंक होते हैं। दूरस्थ इंटरनेट खेल के लिए Firebase, Supabase, या WebSocket सर्वर जैसी रिले सेवा चाहिए।',
    'field.playerName': 'खिलाड़ी का नाम',
    'playerName.ph':    'छात्र का नाम',
    'button.join':      'खिलाड़ी कार्ड बनाएँ / ताज़ा करें',
    'limit.online.html':'<strong>ऑनलाइन नोट:</strong> यह पृष्ठ स्वतंत्र है। 50 दूरस्थ खिलाड़ियों के लिए, <code>saveState()</code> और <code>loadState()</code> को होस्टेड डेटाबेस से जोड़ें।',
    'field.customCalls':'कस्टम कॉल आइटम',
    'customCalls.ph':   'वैकल्पिक: प्रति पंक्ति एक आइटम। पारंपरिक B-I-N-G-O संख्याओं के लिए खाली छोड़ें।',
    'button.useCustom': 'कस्टम कॉल सूची उपयोग करें',

    'stage.ready':      'तैयार',
    'stage.allCalled':  'सभी गेंदें कॉल हो गईं',
    'button.repeat':    'वर्तमान दोहराएँ',
    'button.resetMarks':'खिलाड़ी चिह्न साफ़ करें',

    'card.h2':          'खिलाड़ी कार्ड',
    'card.free':        'मुफ़्त',
    'winner.text':      'बिंगो! इस कार्ड की कॉलर से जाँच करें।',

    'alert.needItems':  'कस्टम कॉल आइटम जोड़ें या पारंपरिक संख्याओं के लिए खाली छोड़ें।',

    'footer.attributionHtml':'DrawSplat<sup class="tm">TM</sup> लाइव बिंगो कॉलर।',
    'footer.cards':     'प्रिंट करने योग्य कार्ड बनाएँ',
  },

});
