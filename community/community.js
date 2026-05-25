const SCRIPT_URL='https://script.google.com/macros/s/AKfycbwH_tYTRSwetnMJjQPg0RNG8SYTGBDmi8uuewSY8HXZ5DghXdwWiJvCkngaU9hsRJRn/exec';
const GOOGLE_CLIENT_ID='963195660019-rk8867orle2cs0kk6si705en68t55cos.apps.googleusercontent.com';
const MICROSOFT_CLIENT_ID='PASTE_MICROSOFT_OAUTH_CLIENT_ID_HERE';
const MICROSOFT_TENANT='common';
const CATEGORIES=['General','Classroom and Pedagogy','Tools','Administration','Suggestion Box'];
const REFRESH_SECONDS=60;
const STORAGE_KEY='drawsplat-community-user-v2';
const LOCALE_KEY='drawsplat-community-locale';
const RTL_LOCALES=['ar','ur'];
const SUPPORTED_LOCALES=['en','es','vi','zh','ar','ur','hi'];

const CATEGORY_KEYS={
  'General':'cat_general',
  'Classroom and Pedagogy':'cat_classroom',
  'Tools':'cat_tools',
  'Administration':'cat_admin',
  'Suggestion Box':'cat_suggestions'
};

const I18N={
  en:{
    brand_community:'Community',
    nav_home:'Home',nav_whiteboard:'Whiteboard',nav_support:'Support',nav_moderator:'Moderator',nav_new_post:'New Post',
    hero_eyebrow:'A bulletin board for the DrawSplat™ community',
    hero_title_em:'Community',
    hero_lede:'Share classroom ideas, ask questions about pedagogy, swap tool tips, talk shop with fellow administrators, or drop a suggestion in the box. Pick a category to see what’s posted, then jump in with a reply.',
    cat_general:'General',cat_classroom:'Classroom and Pedagogy',cat_tools:'Tools',cat_admin:'Administration',cat_suggestions:'Suggestion Box',
    action_refresh:'Refresh',action_new_post_plus:'+ New Post',action_cancel:'Cancel',
    search_placeholder:'Search posts and replies',sort_newest:'Newest first',sort_oldest:'Oldest first',sort_busiest:'Most replies',
    post_by:'by',post_reply_one:'{n} reply',post_reply_many:'{n} replies',
    post_empty_title:'No posts in {category} yet',post_empty_sub:'Be the first — start the conversation with a new post.',
    reply_placeholder:'Write a reply…',reply_placeholder_signedout:'Sign in on the right to reply',
    reply_submit:'Submit reply',reply_sending:'Sending…',reply_empty:'No replies yet. Be the first to respond.',
    signin_title:'Your account',signin_signout:'Sign out',signin_via:'via {provider}',
    signin_google:'Continue with Google',signin_microsoft:'Continue with Microsoft',
    signin_hint:'Sign in with the account you already use. We never see your password — your provider verifies you and shares only your name and email.',
    signin_unavailable:'Sign-in is not configured yet. Ask the site host to set up Google or Microsoft sign-in.',
    signin_or_email:'Or use email and password',
    signin_email_label:'Email',signin_password_label:'Password',signin_name_label:'Display name',
    signin_email_submit:'Sign in',signin_email_signup:'Create account',signin_email_haveaccount:'Have an account?',signin_email_working:'Working…',
    signin_email_hint:'Minimum 8 characters. No automatic password reset — if you forget, a moderator can clear your row so you can re-register.',
    guidelines_title:'Community guidelines',
    guidelines_body:'Posts and replies are moderated before they appear. Keep it kind, on-topic, and don’t share personal info about students or staff. Moderators may edit or remove posts.',
    modal_new_post:'New post',modal_category_label:'Category',modal_title_label:'Title',
    modal_title_placeholder:'Give your post a short, descriptive title',modal_message_label:'Message',
    modal_message_placeholder:'What would you like to share or ask?',modal_char_suffix:'/2000 characters',
    modal_submit:'Submit post',modal_submitting:'Submitting…',
    about_title:'About this board',
    about_general:'<strong>General</strong> — introductions, announcements, general DrawSplat™ chat.',
    about_classroom:'<strong>Classroom and Pedagogy</strong> — share lessons, strategies, and student work ideas.',
    about_tools:'<strong>Tools</strong> — talk about DrawSplat™ tools, integrations, and workflows.',
    about_admin:'<strong>Administration</strong> — for school and district leaders working with rollouts.',
    about_suggestions:'<strong>Suggestion Box</strong> — feature ideas, feedback, and wish-list items.',
    footer_text:'DrawSplat<sup class="tm">TM</sup> Community is part of the DrawSplat<sup class="tm">TM</sup> project.',
    footer_back:'Back to DrawSplat<sup class="tm">TM</sup>',
    status_loading:'Loading…',status_connection_issue:'Connection issue',
    status_summary_one:'{n} approved post · Moderation {state}',
    status_summary_many:'{n} approved posts · Moderation {state}',
    status_mod_on:'ON',status_mod_off:'OFF',
    status_backend_unconfigured:'Set SCRIPT_URL in community.js to your Apps Script Web App URL.',
    msg_signin_first_post:'Sign in first to create a post.',msg_signin_first_reply:'Sign in to reply.',
    msg_title_required:'Title is required.',msg_message_required:'Message is required.',msg_reply_empty:'Reply cannot be empty.',
    msg_post_submitted_pending:'Submitted. A moderator will review your post shortly.',msg_post_posted:'Posted!',
    msg_reply_submitted_pending:'Reply submitted. A moderator will review it shortly.',msg_reply_posted:'Reply posted.',
    msg_welcome_account:'Account created. Welcome!',msg_signed_in_as:'Signed in as {name}.',
    msg_signin_canceled:'Sign-in canceled.',msg_session_expired:'Your session expired. Please sign in again.',
    msg_email_invalid:'Please enter a valid email.',msg_password_required:'Please enter your password.',
    msg_password_too_short:'Password must be at least 8 characters.',msg_name_required:'Please enter a display name.',
    msg_google_lib_loading:'Google sign-in library not loaded yet. Try again in a moment.',
    msg_microsoft_not_configured:'Microsoft sign-in is not configured.',msg_google_not_configured:'Google sign-in is not configured.',
    msg_microsoft_no_token:'Microsoft did not return an access token.',msg_microsoft_lib_failed:'Microsoft sign-in library failed to load.',
    msg_backend_not_configured:'Backend not configured. Paste your Apps Script Web App URL into SCRIPT_URL.',
    msg_request_failed:'Request failed.'
  },
  es:{
    brand_community:'Comunidad',
    nav_home:'Inicio',nav_whiteboard:'Pizarra',nav_support:'Soporte',nav_moderator:'Moderador',nav_new_post:'Nueva publicación',
    hero_eyebrow:'Un tablón de anuncios para la comunidad DrawSplat™',
    hero_title_em:'Comunidad',
    hero_lede:'Comparte ideas de aula, haz preguntas sobre pedagogía, intercambia consejos de herramientas, conversa con otros administradores o deja una sugerencia. Elige una categoría para ver lo publicado y responde.',
    cat_general:'General',cat_classroom:'Aula y pedagogía',cat_tools:'Herramientas',cat_admin:'Administración',cat_suggestions:'Buzón de sugerencias',
    action_refresh:'Actualizar',action_new_post_plus:'+ Nueva publicación',action_cancel:'Cancelar',
    search_placeholder:'Buscar publicaciones y respuestas',sort_newest:'Más recientes',sort_oldest:'Más antiguas',sort_busiest:'Con más respuestas',
    post_by:'por',post_reply_one:'{n} respuesta',post_reply_many:'{n} respuestas',
    post_empty_title:'Aún no hay publicaciones en {category}',post_empty_sub:'Sé el primero: inicia la conversación con una nueva publicación.',
    reply_placeholder:'Escribe una respuesta…',reply_placeholder_signedout:'Inicia sesión a la derecha para responder',
    reply_submit:'Enviar respuesta',reply_sending:'Enviando…',reply_empty:'Aún no hay respuestas. Sé el primero en responder.',
    signin_title:'Tu cuenta',signin_signout:'Cerrar sesión',signin_via:'vía {provider}',
    signin_google:'Continuar con Google',signin_microsoft:'Continuar con Microsoft',
    signin_hint:'Inicia sesión con la cuenta que ya usas. Nunca vemos tu contraseña: tu proveedor te verifica y comparte solo tu nombre y correo.',
    signin_unavailable:'Aún no se configuró el inicio de sesión. Pide al administrador del sitio que configure Google o Microsoft.',
    signin_or_email:'O usar correo y contraseña',
    signin_email_label:'Correo',signin_password_label:'Contraseña',signin_name_label:'Nombre público',
    signin_email_submit:'Iniciar sesión',signin_email_signup:'Crear cuenta',signin_email_haveaccount:'¿Ya tienes cuenta?',signin_email_working:'Procesando…',
    signin_email_hint:'Mínimo 8 caracteres. No hay restablecimiento automático: si la olvidas, un moderador puede borrar tu fila para que te registres de nuevo.',
    guidelines_title:'Normas de la comunidad',
    guidelines_body:'Las publicaciones y respuestas se moderan antes de aparecer. Sé amable, mantente en el tema y no compartas información personal de estudiantes o personal. Los moderadores pueden editar o eliminar publicaciones.',
    modal_new_post:'Nueva publicación',modal_category_label:'Categoría',modal_title_label:'Título',
    modal_title_placeholder:'Dale a tu publicación un título breve y descriptivo',modal_message_label:'Mensaje',
    modal_message_placeholder:'¿Qué te gustaría compartir o preguntar?',modal_char_suffix:'/2000 caracteres',
    modal_submit:'Publicar',modal_submitting:'Enviando…',
    about_title:'Acerca de este tablón',
    about_general:'<strong>General</strong> — presentaciones, avisos y conversación general sobre DrawSplat™.',
    about_classroom:'<strong>Aula y pedagogía</strong> — comparte lecciones, estrategias e ideas de trabajos.',
    about_tools:'<strong>Herramientas</strong> — habla sobre herramientas, integraciones y flujos de trabajo de DrawSplat™.',
    about_admin:'<strong>Administración</strong> — para liderazgo escolar y de distrito que implementa DrawSplat™.',
    about_suggestions:'<strong>Buzón de sugerencias</strong> — ideas, comentarios y lista de deseos.',
    footer_text:'La Comunidad DrawSplat<sup class="tm">TM</sup> es parte del proyecto DrawSplat<sup class="tm">TM</sup>.',
    footer_back:'Volver a DrawSplat<sup class="tm">TM</sup>',
    status_loading:'Cargando…',status_connection_issue:'Problema de conexión',
    status_summary_one:'{n} publicación aprobada · Moderación {state}',
    status_summary_many:'{n} publicaciones aprobadas · Moderación {state}',
    status_mod_on:'ACTIVA',status_mod_off:'INACTIVA',
    status_backend_unconfigured:'Establece SCRIPT_URL en community.js con la URL de tu Web App de Apps Script.',
    msg_signin_first_post:'Inicia sesión primero para crear una publicación.',msg_signin_first_reply:'Inicia sesión para responder.',
    msg_title_required:'El título es obligatorio.',msg_message_required:'El mensaje es obligatorio.',msg_reply_empty:'La respuesta no puede estar vacía.',
    msg_post_submitted_pending:'Enviada. Un moderador revisará tu publicación pronto.',msg_post_posted:'¡Publicada!',
    msg_reply_submitted_pending:'Respuesta enviada. Un moderador la revisará pronto.',msg_reply_posted:'Respuesta publicada.',
    msg_welcome_account:'¡Cuenta creada! Te damos la bienvenida.',msg_signed_in_as:'Sesión iniciada como {name}.',
    msg_signin_canceled:'Inicio de sesión cancelado.',msg_session_expired:'Tu sesión caducó. Inicia sesión nuevamente.',
    msg_email_invalid:'Ingresa un correo válido.',msg_password_required:'Ingresa tu contraseña.',
    msg_password_too_short:'La contraseña debe tener al menos 8 caracteres.',msg_name_required:'Ingresa un nombre público.',
    msg_google_lib_loading:'La librería de Google aún no carga. Intenta de nuevo en un momento.',
    msg_microsoft_not_configured:'El inicio de sesión con Microsoft no está configurado.',msg_google_not_configured:'El inicio de sesión con Google no está configurado.',
    msg_microsoft_no_token:'Microsoft no devolvió un token de acceso.',msg_microsoft_lib_failed:'La librería de Microsoft no pudo cargarse.',
    msg_backend_not_configured:'Backend no configurado. Pega la URL de tu Web App de Apps Script en SCRIPT_URL.',
    msg_request_failed:'Solicitud fallida.'
  },
  vi:{
    brand_community:'Cộng đồng',
    nav_home:'Trang chủ',nav_whiteboard:'Bảng',nav_support:'Hỗ trợ',nav_moderator:'Kiểm duyệt',nav_new_post:'Bài mới',
    hero_eyebrow:'Bảng tin cho cộng đồng DrawSplat™',
    hero_title_em:'Cộng đồng',
    hero_lede:'Chia sẻ ý tưởng lớp học, hỏi về phương pháp sư phạm, trao đổi mẹo công cụ, bàn việc với quản trị viên hoặc gởi góp ý. Chọn một danh mục để xem bài đã đăng và tham gia trả lời.',
    cat_general:'Tổng quát',cat_classroom:'Lớp học và sư phạm',cat_tools:'Công cụ',cat_admin:'Quản trị',cat_suggestions:'Hộp góp ý',
    action_refresh:'Làm mới',action_new_post_plus:'+ Bài mới',action_cancel:'Hủy',
    search_placeholder:'Tìm bài đăng và trả lời',sort_newest:'Mới nhất trước',sort_oldest:'Cũ nhất trước',sort_busiest:'Nhiều trả lời nhất',
    post_by:'bởi',post_reply_one:'{n} trả lời',post_reply_many:'{n} trả lời',
    post_empty_title:'Chưa có bài nào trong {category}',post_empty_sub:'Hãy là người đầu tiên — bắt đầu với một bài đăng mới.',
    reply_placeholder:'Viết trả lời…',reply_placeholder_signedout:'Đăng nhập bên phải để trả lời',
    reply_submit:'Gởi trả lời',reply_sending:'Đang gởi…',reply_empty:'Chưa có trả lời. Hãy là người đầu tiên.',
    signin_title:'Tài khoản của bạn',signin_signout:'Đăng xuất',signin_via:'qua {provider}',
    signin_google:'Tiếp tục với Google',signin_microsoft:'Tiếp tục với Microsoft',
    signin_hint:'Đăng nhập với tài khoản bạn sẵn có. Chúng tôi không thấy mật khẩu — nhà cung cấp xác minh bạn và chỉ chia sẻ tên và email.',
    signin_unavailable:'Chưa cấu hình đăng nhập. Hãy yêu cầu quản trị viên thiết lập Google hoặc Microsoft.',
    signin_or_email:'Hoặc dùng email và mật khẩu',
    signin_email_label:'Email',signin_password_label:'Mật khẩu',signin_name_label:'Tên hiển thị',
    signin_email_submit:'Đăng nhập',signin_email_signup:'Tạo tài khoản',signin_email_haveaccount:'Đã có tài khoản?',signin_email_working:'Đang xử lý…',
    signin_email_hint:'Tối thiểu 8 ký tự. Không có đặt lại mật khẩu tự động — nếu quên, kiểm duyệt viên có thể xóa dòng để bạn đăng ký lại.',
    guidelines_title:'Quy tắc cộng đồng',
    guidelines_body:'Bài đăng và trả lời được kiểm duyệt trước khi xuất hiện. Hãy lịch sự, đúng chủ đề, không chia sẻ thông tin cá nhân của học sinh hay nhân viên. Kiểm duyệt viên có thể chỉnh sửa hoặc xóa bài.',
    modal_new_post:'Bài mới',modal_category_label:'Danh mục',modal_title_label:'Tiêu đề',
    modal_title_placeholder:'Đặt cho bài đăng một tiêu đề ngắn gọn',modal_message_label:'Nội dung',
    modal_message_placeholder:'Bạn muốn chia sẻ hay hỏi gì?',modal_char_suffix:'/2000 ký tự',
    modal_submit:'Đăng bài',modal_submitting:'Đang gởi…',
    about_title:'Về bảng tin này',
    about_general:'<strong>Tổng quát</strong> — giới thiệu, thông báo, trò chuyện chung về DrawSplat™.',
    about_classroom:'<strong>Lớp học và sư phạm</strong> — chia sẻ bài giảng, chiến lược và ý tưởng học sinh.',
    about_tools:'<strong>Công cụ</strong> — bàn về công cụ, tích hợp và quy trình của DrawSplat™.',
    about_admin:'<strong>Quản trị</strong> — dành cho lãnh đạo trường và khu vực triển khai.',
    about_suggestions:'<strong>Hộp góp ý</strong> — ý tưởng tính năng, phản hồi và mong muốn.',
    footer_text:'Cộng đồng DrawSplat<sup class="tm">TM</sup> là một phần của dự án DrawSplat<sup class="tm">TM</sup>.',
    footer_back:'Về DrawSplat<sup class="tm">TM</sup>',
    status_loading:'Đang tải…',status_connection_issue:'Vấn đề kết nối',
    status_summary_one:'{n} bài được duyệt · Kiểm duyệt {state}',
    status_summary_many:'{n} bài được duyệt · Kiểm duyệt {state}',
    status_mod_on:'BẬT',status_mod_off:'TẮT',
    status_backend_unconfigured:'Thiết lập SCRIPT_URL trong community.js đến URL Web App của Apps Script.',
    msg_signin_first_post:'Đăng nhập trước khi tạo bài.',msg_signin_first_reply:'Đăng nhập để trả lời.',
    msg_title_required:'Tiêu đề là bắt buộc.',msg_message_required:'Nội dung là bắt buộc.',msg_reply_empty:'Trả lời không được rỗng.',
    msg_post_submitted_pending:'Đã gởi. Kiểm duyệt viên sẽ xem bài sớm.',msg_post_posted:'Đã đăng!',
    msg_reply_submitted_pending:'Đã gởi trả lời. Kiểm duyệt viên sẽ xem sớm.',msg_reply_posted:'Đã đăng trả lời.',
    msg_welcome_account:'Tài khoản đã tạo. Chào mừng!',msg_signed_in_as:'Đã đăng nhập với {name}.',
    msg_signin_canceled:'Đã hủy đăng nhập.',msg_session_expired:'Phiên đã hết hạn. Hãy đăng nhập lại.',
    msg_email_invalid:'Hãy nhập email hợp lệ.',msg_password_required:'Hãy nhập mật khẩu.',
    msg_password_too_short:'Mật khẩu tối thiểu 8 ký tự.',msg_name_required:'Hãy nhập tên hiển thị.',
    msg_google_lib_loading:'Thư viện Google chưa tải xong. Thử lại sau chốc lát.',
    msg_microsoft_not_configured:'Đăng nhập Microsoft chưa được cấu hình.',msg_google_not_configured:'Đăng nhập Google chưa được cấu hình.',
    msg_microsoft_no_token:'Microsoft không trả về token truy cập.',msg_microsoft_lib_failed:'Thư viện Microsoft không tải được.',
    msg_backend_not_configured:'Backend chưa cấu hình. Dán URL Web App Apps Script vào SCRIPT_URL.',
    msg_request_failed:'Yêu cầu thất bại.'
  },
  zh:{
    brand_community:'社区',
    nav_home:'首页',nav_whiteboard:'白板',nav_support:'支持',nav_moderator:'审核',nav_new_post:'新帖',
    hero_eyebrow:'一个为 DrawSplat™ 社区打造的公告板',
    hero_title_em:'社区',
    hero_lede:'分享课堂思路，提出教学问题，交流工具技巧，与同行管理者交流，或提出建议。选择一个分类查看已发布的内容，然后参与回复。',
    cat_general:'总体',cat_classroom:'课堂与教学法',cat_tools:'工具',cat_admin:'管理',cat_suggestions:'建议箱',
    action_refresh:'刷新',action_new_post_plus:'+ 新帖',action_cancel:'取消',
    search_placeholder:'搜索帖子和回复',sort_newest:'最新优先',sort_oldest:'最早优先',sort_busiest:'回复最多',
    post_by:'作者',post_reply_one:'{n} 条回复',post_reply_many:'{n} 条回复',
    post_empty_title:'{category} 还没有帖子',post_empty_sub:'成为第一人 — 发一个新帖开启讨论。',
    reply_placeholder:'写下回复…',reply_placeholder_signedout:'请在右侧登录后回复',
    reply_submit:'发送回复',reply_sending:'发送中…',reply_empty:'还没有回复。成为第一个回复的人吧。',
    signin_title:'你的账户',signin_signout:'退出登录',signin_via:'通过 {provider}',
    signin_google:'使用 Google 继续',signin_microsoft:'使用 Microsoft 继续',
    signin_hint:'使用你已经有的账户登录。我们从不看到你的密码 — 你的提供商验证你并仅分享你的姓名和邮箱。',
    signin_unavailable:'尚未配置登录。请让站点管理员设置 Google 或 Microsoft 登录。',
    signin_or_email:'或使用邮箱和密码',
    signin_email_label:'邮箱',signin_password_label:'密码',signin_name_label:'显示名',
    signin_email_submit:'登录',signin_email_signup:'创建账户',signin_email_haveaccount:'已有账户？',signin_email_working:'处理中…',
    signin_email_hint:'至少 8 个字符。暂无自动重置密码 — 如忘记，审核员可以清除你的记录以便重新注册。',
    guidelines_title:'社区准则',
    guidelines_body:'帖子和回复出现前需审核。保持友善、切合主题，不要分享学生或员工的个人信息。审核员可能会编辑或删除帖子。',
    modal_new_post:'新帖',modal_category_label:'分类',modal_title_label:'标题',
    modal_title_placeholder:'为你的帖子给个简短明了的标题',modal_message_label:'正文',
    modal_message_placeholder:'你想分享或提问什么？',modal_char_suffix:'/2000 字符',
    modal_submit:'发布',modal_submitting:'提交中…',
    about_title:'关于本公告板',
    about_general:'<strong>总体</strong> — 自我介绍、公告、关于 DrawSplat™ 的一般对话。',
    about_classroom:'<strong>课堂与教学法</strong> — 分享课程、策略和学生作品思路。',
    about_tools:'<strong>工具</strong> — 讨论 DrawSplat™ 的工具、集成与工作流。',
    about_admin:'<strong>管理</strong> — 面向推行部署的学校和区域领导。',
    about_suggestions:'<strong>建议箱</strong> — 功能设想、反馈和心愿。',
    footer_text:'DrawSplat<sup class="tm">TM</sup> 社区是 DrawSplat<sup class="tm">TM</sup> 项目的一部分。',
    footer_back:'返回 DrawSplat<sup class="tm">TM</sup>',
    status_loading:'加载中…',status_connection_issue:'连接问题',
    status_summary_one:'{n} 条已批准的帖子 · 审核 {state}',
    status_summary_many:'{n} 条已批准的帖子 · 审核 {state}',
    status_mod_on:'开启',status_mod_off:'关闭',
    status_backend_unconfigured:'在 community.js 中设置 SCRIPT_URL 为你的 Apps Script Web App URL。',
    msg_signin_first_post:'请先登录后再发帖。',msg_signin_first_reply:'请登录后回复。',
    msg_title_required:'标题不能为空。',msg_message_required:'正文不能为空。',msg_reply_empty:'回复不能为空。',
    msg_post_submitted_pending:'已提交。审核员会尽快查看你的帖子。',msg_post_posted:'已发布！',
    msg_reply_submitted_pending:'回复已提交。审核员会尽快查看。',msg_reply_posted:'回复已发布。',
    msg_welcome_account:'账户已创建。欢迎你！',msg_signed_in_as:'以 {name} 身份登录。',
    msg_signin_canceled:'登录已取消。',msg_session_expired:'会话已过期。请重新登录。',
    msg_email_invalid:'请输入有效的邮箱。',msg_password_required:'请输入密码。',
    msg_password_too_short:'密码至少需要 8 个字符。',msg_name_required:'请输入显示名。',
    msg_google_lib_loading:'Google 登录库尚未加载完。稍后重试。',
    msg_microsoft_not_configured:'未配置 Microsoft 登录。',msg_google_not_configured:'未配置 Google 登录。',
    msg_microsoft_no_token:'Microsoft 未返回访问令牌。',msg_microsoft_lib_failed:'Microsoft 登录库加载失败。',
    msg_backend_not_configured:'后端未配置。将 Apps Script Web App URL 粘贴到 SCRIPT_URL。',
    msg_request_failed:'请求失败。'
  },
  ar:{
    brand_community:'المجتمع',
    nav_home:'الرئيسية',nav_whiteboard:'السبّورة',nav_support:'الدعم',nav_moderator:'الإشراف',nav_new_post:'منشور جديد',
    hero_eyebrow:'لوحة إعلانات لمجتمع DrawSplat™',
    hero_title_em:'المجتمع',
    hero_lede:'شارك أفكار الصف واطرح أسئلة تربوية وتبادل نصائح الأدوات وتحدّث مع المسؤولين أو أرسل اقتراحًا. اختر فئة لرؤية ما نُشر ثم انضمّ للرد.',
    cat_general:'عام',cat_classroom:'الصف والتربية',cat_tools:'الأدوات',cat_admin:'الإدارة',cat_suggestions:'صندوق الاقتراحات',
    action_refresh:'تحديث',action_new_post_plus:'+ منشور جديد',action_cancel:'إلغاء',
    search_placeholder:'ابحث في المنشورات والردود',sort_newest:'الأحدث أولاً',sort_oldest:'الأقدم أولاً',sort_busiest:'الأكثر ردوداً',
    post_by:'بواسطة',post_reply_one:'{n} رد',post_reply_many:'{n} رد',
    post_empty_title:'لا توجد منشورات في {category} بعد',post_empty_sub:'كن الأول — ابدأ المحادثة بمنشور جديد.',
    reply_placeholder:'اكتب ردّا…',reply_placeholder_signedout:'سجّل الدخول على اليمين للرد',
    reply_submit:'إرسال الرد',reply_sending:'جارٍ الإرسال…',reply_empty:'لا توجد ردود بعد. كن أول من يرد.',
    signin_title:'حسابك',signin_signout:'تسجيل الخروج',signin_via:'عبر {provider}',
    signin_google:'المتابعة بـ Google',signin_microsoft:'المتابعة بـ Microsoft',
    signin_hint:'سجّل الدخول بحسابك الحالي. لا نرى كلمة السر أبدًا — يقوم الموفّر بالتحقّق ويشاركنا فقط اسمك وبريدك.',
    signin_unavailable:'لم يتم إعداد تسجيل الدخول بعد. اطلب من مسؤول الموقع إعداد Google أو Microsoft.',
    signin_or_email:'أو استخدم البريد وكلمة السر',
    signin_email_label:'البريد',signin_password_label:'كلمة السر',signin_name_label:'الاسم المعروض',
    signin_email_submit:'تسجيل الدخول',signin_email_signup:'إنشاء حساب',signin_email_haveaccount:'لديك حساب؟',signin_email_working:'جارٍ…',
    signin_email_hint:'8 حروف على الأقل. لا توجد إعادة تعيين تلقائية — إذا نسيتها، يمكن للمشرف مسح صفّك لتعيد التسجيل.',
    guidelines_title:'مبادئ المجتمع',
    guidelines_body:'تخضع المنشورات والردود للإشراف قبل النشر. كن لطيفًا، التزم بالموضوع، ولا تشارك معلومات شخصية عن الطلاب أو العاملين. يحق للمشرفين التعديل أو الحذف.',
    modal_new_post:'منشور جديد',modal_category_label:'الفئة',modal_title_label:'العنوان',
    modal_title_placeholder:'أعط منشورك عنوانًا قصيرًا وواضحًا',modal_message_label:'الرسالة',
    modal_message_placeholder:'ماذا تودّ مشاركته أو سؤاله؟',modal_char_suffix:'/2000 حرف',
    modal_submit:'نشر',modal_submitting:'جارٍ الإرسال…',
    about_title:'حول هذه اللوحة',
    about_general:'<strong>عام</strong> — تعريفات وإعلانات ودردشة عامة حول DrawSplat™.',
    about_classroom:'<strong>الصف والتربية</strong> — شارك دروسًا واستراتيجيات وأفكار عمل الطلاب.',
    about_tools:'<strong>الأدوات</strong> — تحدّث عن أدوات DrawSplat™ والتكاملات.',
    about_admin:'<strong>الإدارة</strong> — لقادة المدارس والإدارات في مرحلة التبني.',
    about_suggestions:'<strong>صندوق الاقتراحات</strong> — أفكار الميزات والملاحظات والأمنيات.',
    footer_text:'مجتمع DrawSplat<sup class="tm">TM</sup> جزء من مشروع DrawSplat<sup class="tm">TM</sup>.',
    footer_back:'العودة إلى DrawSplat<sup class="tm">TM</sup>',
    status_loading:'جارٍ التحميل…',status_connection_issue:'مشكلة في الاتصال',
    status_summary_one:'{n} منشور معتمد · الإشراف {state}',
    status_summary_many:'{n} منشورات معتمدة · الإشراف {state}',
    status_mod_on:'مفعّل',status_mod_off:'غير مفعّل',
    status_backend_unconfigured:'عيّن SCRIPT_URL في community.js إلى رابط Web App لـ Apps Script.',
    msg_signin_first_post:'سجّل الدخول أولاً لإنشاء منشور.',msg_signin_first_reply:'سجّل الدخول للرد.',
    msg_title_required:'العنوان مطلوب.',msg_message_required:'الرسالة مطلوبة.',msg_reply_empty:'لا يمكن إرسال رد فارغ.',
    msg_post_submitted_pending:'تم الإرسال. سيراجع المشرف منشورك قريبًا.',msg_post_posted:'تم النشر！',
    msg_reply_submitted_pending:'تم إرسال الرد. سيراجعه المشرف قريبًا.',msg_reply_posted:'تم نشر الرد.',
    msg_welcome_account:'تم إنشاء الحساب. أهلاً بك！',msg_signed_in_as:'تم تسجيل الدخول باسم {name}.',
    msg_signin_canceled:'تم إلغاء تسجيل الدخول.',msg_session_expired:'انتهت الجلسة. سجّل الدخول مرّة أخرى.',
    msg_email_invalid:'أدخل بريدًا صحيحًا.',msg_password_required:'أدخل كلمة السر.',
    msg_password_too_short:'يجب أن تتكوّن كلمة السر من 8 حروف على الأقل.',msg_name_required:'أدخل اسمًا معروضًا.',
    msg_google_lib_loading:'لم تتحمّل مكتبة Google بعد. حاول بعد لحظة.',
    msg_microsoft_not_configured:'تسجيل Microsoft غير مفعّل.',msg_google_not_configured:'تسجيل Google غير مفعّل.',
    msg_microsoft_no_token:'لم تعد Microsoft رمز وصول.',msg_microsoft_lib_failed:'فشل تحميل مكتبة Microsoft.',
    msg_backend_not_configured:'لم يتم إعداد الخلفية. الصق رابط Apps Script في SCRIPT_URL.',
    msg_request_failed:'فشل الطلب.'
  },
  ur:{
    brand_community:'کمیونٹی',
    nav_home:'ہوم',nav_whiteboard:'وائٹ بورڈ',nav_support:'مدد',nav_moderator:'نگران',nav_new_post:'نیا پوسٹ',
    hero_eyebrow:'DrawSplat™ کمیونٹی کے لیے بلٹن بورڈ',
    hero_title_em:'کمیونٹی',
    hero_lede:'کلاس کے خیالات شیئر کریں، تدریسی سوالات پوچھیں، ٹولز پر تجاویز دیں، اور منتظمین کے ساتھ گفتگو کریں۔ زمرہ چنیں، پوسٹ دیکھیں اور جواب دیں۔',
    cat_general:'عام',cat_classroom:'کلاس اور تدریس',cat_tools:'ٹولز',cat_admin:'انتظامیہ',cat_suggestions:'تجاویز باکس',
    action_refresh:'تازہ کریں',action_new_post_plus:'+ نیا پوسٹ',action_cancel:'منسوخ کریں',
    search_placeholder:'پوسٹ اور جوابات تلاش کریں',sort_newest:'نئی سے پرانی',sort_oldest:'پرانی سے نئی',sort_busiest:'سب سے زیادہ جوابات',
    post_by:'برائے',post_reply_one:'{n} جواب',post_reply_many:'{n} جوابات',
    post_empty_title:'{category} میں ابهی کوئی پوسٹ نہیں',post_empty_sub:'پہلے بنیں — نئے پوسٹ سے دی بحث شروع کریں۔',
    reply_placeholder:'جواب لکھیں…',reply_placeholder_signedout:'جواب دینے کے لیے دائیں سائن ان کریں',
    reply_submit:'جواب بھیجیں',reply_sending:'بھیجا جا رہا ہے…',reply_empty:'ابهی تک کوئی جواب نہیں۔ پہلا جواب دیں۔',
    signin_title:'آپ کا اکاؤنٹ',signin_signout:'سائن آؤٹ',signin_via:'بذریعہ {provider}',
    signin_google:'Google کے ساتھ جاری رکھیں',signin_microsoft:'Microsoft کے ساتھ جاری رکھیں',
    signin_hint:'وہی اکاؤنٹ استعمال کریں جو آپ پہلے سے رکھتے ہیں۔ ہم آپ کا پاس ورڈ کبھی نہیں دیکھتے — فراہم کنندہ تصدیق کرتا ہے اور صرف نام اور ایمیل بتاتا ہے۔',
    signin_unavailable:'لاگ ان ابهی سیٹ نہیں۔ سائٹ منتظم سے Google یا Microsoft سیٹ اپ کروائیں۔',
    signin_or_email:'یا ایمیل اور پاس ورڈ استعمال کریں',
    signin_email_label:'ایمیل',signin_password_label:'پاس ورڈ',signin_name_label:'ظاہری نام',
    signin_email_submit:'سائن ان',signin_email_signup:'اکاؤنٹ بنائیں',signin_email_haveaccount:'اکاؤنٹ پہلے سے ہے؟',signin_email_working:'جاری…',
    signin_email_hint:'کم از کم 8 حروف۔ خودکار پاس ورڈ ری سیٹ نہیں — بھول جائیں تو منتظم آپ کی سطر صاف کر سکتا ہے۔',
    guidelines_title:'کمیونٹی کے اصول',
    guidelines_body:'پوسٹ اور جوابات ظاہر ہونے سے پہلے نگرانی کے لیے جاتے ہیں۔ مہربان رہیں، موضوع پر رہیں، اور طلبا یا عملے کی ذاتی معلومات شیئر نہ کریں۔ منتظمین پوسٹ متعدّل یا حذف کر سکتے ہیں۔',
    modal_new_post:'نیا پوسٹ',modal_category_label:'زمرہ',modal_title_label:'عنوان',
    modal_title_placeholder:'پوسٹ کو چھوٹا سا تعریفی عنوان دیں',modal_message_label:'پیغام',
    modal_message_placeholder:'آپ کیا شیئر یا پوچھنا چاہتے ہیں؟',modal_char_suffix:'/2000 حروف',
    modal_submit:'پوسٹ جمع کریں',modal_submitting:'بھیجا جا رہا ہے…',
    about_title:'اس بورڈ کے بارے میں',
    about_general:'<strong>عام</strong> — تعارف، اعلانات، DrawSplat™ کی عام گفتگو۔',
    about_classroom:'<strong>کلاس اور تدریس</strong> — سبق، حکمتت عملی، اور طالب علم کام کے خیالات۔',
    about_tools:'<strong>ٹولز</strong> — DrawSplat™ کے ٹولز، انتیگریشنز اور ورک فلو پر گفتگو۔',
    about_admin:'<strong>انتظامیہ</strong> — اسکول اور ضلع کے رھنماؤں کے لیے۔',
    about_suggestions:'<strong>تجاویز باکس</strong> — فیچرز، رائے، اور خواہشات۔',
    footer_text:'DrawSplat<sup class="tm">TM</sup> کمیونٹی DrawSplat<sup class="tm">TM</sup> پراجیکٹ کا حصّہ ہے۔',
    footer_back:'DrawSplat<sup class="tm">TM</sup> پر واپسی',
    status_loading:'لوڈ ہو رہا ہے…',status_connection_issue:'کنیکشن کا مسئلہ',
    status_summary_one:'{n} منظور شدہ پوسٹ · نگرانی {state}',
    status_summary_many:'{n} منظور شدہ پوسٹس · نگرانی {state}',
    status_mod_on:'آن',status_mod_off:'آف',
    status_backend_unconfigured:'community.js میں SCRIPT_URL کو اپنے Apps Script Web App URL کے ساتھ سیٹ کریں۔',
    msg_signin_first_post:'پوسٹ بنانے کے لیے پہلے سائن ان کریں۔',msg_signin_first_reply:'جواب دینے کے لیے سائن ان کریں۔',
    msg_title_required:'عنوان لازمی ہے۔',msg_message_required:'پیغام لازمی ہے۔',msg_reply_empty:'خالی جواب نہیں ہو سکتا۔',
    msg_post_submitted_pending:'جمع ہو گیا۔ منتظم جلد جائزہ لے گا۔',msg_post_posted:'پوسٹ ہو گیا！',
    msg_reply_submitted_pending:'جواب جمع ہو گیا۔ منتظم جلد جائزہ لے گا۔',msg_reply_posted:'جواب پوسٹ ہو گیا۔',
    msg_welcome_account:'اکاؤنٹ بن گیا۔ خوش آمدید！',msg_signed_in_as:'بحیثیت {name} سائن ان۔',
    msg_signin_canceled:'سائن ان منسوخ ہوا۔',msg_session_expired:'سیشن ورثا چکا۔ دوبارہ سائن ان کریں۔',
    msg_email_invalid:'درست ایمیل درج کریں۔',msg_password_required:'پاس ورڈ درج کریں۔',
    msg_password_too_short:'پاس ورڈ کم از کم 8 حروف والا ہو۔',msg_name_required:'ظاہری نام درج کریں۔',
    msg_google_lib_loading:'Google لائبریری ابهی تک لوڈ نہیں ہوئی۔ تھوڑی دیر بعد واپس کوشش کریں۔',
    msg_microsoft_not_configured:'Microsoft سائن ان سیٹ نہیں۔',msg_google_not_configured:'Google سائن ان سیٹ نہیں۔',
    msg_microsoft_no_token:'Microsoft سے ایکسیس ٹوکن نہیں ملا۔',msg_microsoft_lib_failed:'Microsoft لائبریری لوڈ نہیں ہو سکی۔',
    msg_backend_not_configured:'بیک اینڈ سیٹ نہیں۔ Apps Script Web App URL کو SCRIPT_URL میں پیسٹ کریں۔',
    msg_request_failed:'درخواست ناکام ہوئی۔'
  },
  hi:{
    brand_community:'समुदाय',
    nav_home:'होम',nav_whiteboard:'व्हाइटबोर्ड',nav_support:'सहायता',nav_moderator:'माडरेटर',nav_new_post:'नई पोस्ट',
    hero_eyebrow:'DrawSplat™ समुदाय के लिए एक बुलेटिन बोर्ड',
    hero_title_em:'समुदाय',
    hero_lede:'कक्षा के विचार साझा करें, शिक्षणशास्त्र पर प्रश्न पूछें, टूल्स टिप्स बांटें, व्यवस्थापकों से बात करें, या सुझाव दें। चर्चाएँ देखने के लिए एक श्रेणी चुनें, फिर जवाब दें।',
    cat_general:'सामान्य',cat_classroom:'कक्षा और शिक्षण',cat_tools:'टूल्स',cat_admin:'प्रशासन',cat_suggestions:'सुझाव पेटी',
    action_refresh:'रिफ़्रेश',action_new_post_plus:'+ नई पोस्ट',action_cancel:'रद्द करें',
    search_placeholder:'पोस्ट और जवाब खोजें',sort_newest:'नवीनतम पहले',sort_oldest:'पुराने पहले',sort_busiest:'सबसे ज़्यादा जवाब',
    post_by:'द्वारा',post_reply_one:'{n} जवाब',post_reply_many:'{n} जवाब',
    post_empty_title:'{category} में अभी कोई पोस्ट नहीं',post_empty_sub:'पहले बनें — एक नई पोस्ट से चर्चा शुरू करें।',
    reply_placeholder:'जवाब लिखें…',reply_placeholder_signedout:'जवाब देने के लिए दाएँ साइन इन करें',
    reply_submit:'जवाब भेजें',reply_sending:'भेज रहे हैं…',reply_empty:'अभी कोई जवाब नहीं। पहले जवाब देने वाले बनें।',
    signin_title:'आपका खाता',signin_signout:'साइन आउट',signin_via:'{provider} के ज़रिए',
    signin_google:'Google से जारी रखें',signin_microsoft:'Microsoft से जारी रखें',
    signin_hint:'अपने मौजूदा खाते से साइन इन करें। हम कभी आपका पासवर्ड नहीं देखते — आपका प्रदाता सत्यापन करता है और केवल नाम और ईमेल साझा करता है।',
    signin_unavailable:'साइन इन अभी कॉन्फ़िगर नहीं है। Google या Microsoft को सेट करने के लिए साइट एडमिन से कहें।',
    signin_or_email:'या ईमेल और पासवर्ड से',
    signin_email_label:'ईमेल',signin_password_label:'पासवर्ड',signin_name_label:'दिखाई देने वाला नाम',
    signin_email_submit:'साइन इन',signin_email_signup:'खाता बनाएँ',signin_email_haveaccount:'पहले से खाता है?',signin_email_working:'चल रहा है…',
    signin_email_hint:'कम से कम 8 अक्षर। स्वतः रीसेट नहीं — भूल जाएँ तो मॉडरेटर आपकी पंक्ति साफ़ कर सकता है।',
    guidelines_title:'समुदाय दिशानिर्देश',
    guidelines_body:'पोस्ट और जवाब दिखाई देने से पहले मॉडरेट किए जाते हैं। विनम्र रहें, विषय पर रहें, और छात्रों या कर्मचारियों की निजी जानकारी साझा न करें। मॉडरेटर पोस्ट्स संपादित या हटा सकते हैं।',
    modal_new_post:'नई पोस्ट',modal_category_label:'श्रेणी',modal_title_label:'शीर्षक',
    modal_title_placeholder:'अपनी पोस्ट को एक छोटा वर्णनात्मक शीर्षक दें',modal_message_label:'संदेश',
    modal_message_placeholder:'आप क्या साझा या पूछना चाहते हैं?',modal_char_suffix:'/2000 अक्षर',
    modal_submit:'पोस्ट करें',modal_submitting:'जमा किया जा रहा है…',
    about_title:'इस बोर्ड के बारे में',
    about_general:'<strong>सामान्य</strong> — परिचय, घोषणाएँ, DrawSplat™ की सामान्य चर्चा।',
    about_classroom:'<strong>कक्षा और शिक्षण</strong> — पाठ, रणनीति और छात्र कार्य के विचार साझा करें।',
    about_tools:'<strong>टूल्स</strong> — DrawSplat™ के टूल्स, एकीकरण और वर्कफ़्लो पर बात करें।',
    about_admin:'<strong>प्रशासन</strong> — स्कूल और ज़िला नेताओं के लिए।',
    about_suggestions:'<strong>सुझाव पेटी</strong> — फ़ीचर विचार, फ़ीडबैक, और इच्छा सूची।',
    footer_text:'DrawSplat<sup class="tm">TM</sup> समुदाय DrawSplat<sup class="tm">TM</sup> प्रोजेक्ट का हिस्सा है।',
    footer_back:'DrawSplat<sup class="tm">TM</sup> पर वापस',
    status_loading:'लोड हो रहा है…',status_connection_issue:'कनेक्शन समस्या',
    status_summary_one:'{n} अनुमोदित पोस्ट · मॉडरेशन {state}',
    status_summary_many:'{n} अनुमोदित पोस्ट्स · मॉडरेशन {state}',
    status_mod_on:'चालू',status_mod_off:'बंद',
    status_backend_unconfigured:'community.js में SCRIPT_URL को अपने Apps Script Web App URL पर सेट करें।',
    msg_signin_first_post:'पोस्ट बनाने के लिए पहले साइन इन करें।',msg_signin_first_reply:'जवाब देने के लिए साइन इन करें।',
    msg_title_required:'शीर्षक आवश्यक है।',msg_message_required:'संदेश आवश्यक है।',msg_reply_empty:'जवाब खाली नहीं हो सकता।',
    msg_post_submitted_pending:'जमा हो गयी। मॉडरेटर जल्दी समीक्षा करेगा।',msg_post_posted:'पोस्ट हो गयी!',
    msg_reply_submitted_pending:'जवाब जमा हो गया। मॉडरेटर जल्दी समीक्षा करेगा।',msg_reply_posted:'जवाब पोस्ट हो गया।',
    msg_welcome_account:'खाता बनाया गया। स्वागत है!',msg_signed_in_as:'{name} के रूप में साइन इन।',
    msg_signin_canceled:'साइन इन रद्द किया गया।',msg_session_expired:'सेशन समाप्त हो गया। कृपया पुनः साइन इन करें।',
    msg_email_invalid:'मान्य ईमेल दर्ज करें।',msg_password_required:'अपना पासवर्ड दर्ज करें।',
    msg_password_too_short:'पासवर्ड कम से कम 8 अक्षरों का होना चाहिए।',msg_name_required:'दिखाई देने वाला नाम दर्ज करें।',
    msg_google_lib_loading:'Google साइन इन लाइब्रेरी अभी लोड नहीं हुई। कुछ समय बाद पुनः कोशिश करें।',
    msg_microsoft_not_configured:'Microsoft साइन इन कॉन्फ़िगर नहीं है।',msg_google_not_configured:'Google साइन इन कॉन्फ़िगर नहीं है।',
    msg_microsoft_no_token:'Microsoft ने एक्सेस टोकन नहीं लौटाया।',msg_microsoft_lib_failed:'Microsoft लाइब्रेरी लोड नहीं हो सकी।',
    msg_backend_not_configured:'बैकएंड कॉन्फ़िगर नहीं है। अपना Apps Script Web App URL SCRIPT_URL में पेस्ट करें।',
    msg_request_failed:'अनुरोध विफल रहा।'
  }
};

let currentLocale='en';

function detectLocale(){
  try{const saved=localStorage.getItem(LOCALE_KEY);if(saved&&I18N[saved])return saved}catch(e){}
  const langs=(navigator.languages&&navigator.languages.length)?navigator.languages:[navigator.language||'en'];
  for(const l of langs){const base=String(l||'').toLowerCase().split('-')[0];if(I18N[base])return base}
  return 'en';
}

function t(key,vars){
  const dict=I18N[currentLocale]||I18N.en;
  const tpl=(dict&&dict[key])!=null?dict[key]:(I18N.en[key]!=null?I18N.en[key]:key);
  if(!vars)return tpl;
  return String(tpl).replace(/\{(\w+)\}/g,(_,k)=>vars[k]!=null?vars[k]:'');
}

function catLabel(name){const k=CATEGORY_KEYS[name];return k?t(k):name}

function applyI18n(){
  document.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=t(el.dataset.i18n)});
  document.querySelectorAll('[data-i18n-html]').forEach(el=>{el.innerHTML=t(el.dataset.i18nHtml)});
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{el.placeholder=t(el.dataset.i18nPlaceholder)});
  document.documentElement.setAttribute('lang',currentLocale);
  document.documentElement.setAttribute('dir',RTL_LOCALES.indexOf(currentLocale)!==-1?'rtl':'ltr');
}

function setLocale(locale){
  if(!I18N[locale])locale='en';
  currentLocale=locale;
  try{localStorage.setItem(LOCALE_KEY,locale)}catch(e){}
  applyI18n();
  if(newCategorySel)populateNewCategorySelect();
  renderTabs();
  render();
  renderUser();
  updateStatusText();
  setEmailMode(typeof emailMode!=='undefined'?emailMode:'signin');
  const sel=document.getElementById('localeSwitch');if(sel)sel.value=locale;
}

function populateNewCategorySelect(){
  newCategorySel.innerHTML=CATEGORIES.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(catLabel(c))}</option>`).join('');
}

function updateStatusText(){
  if(!loadedOnce)return;
  const total=posts.length;
  const stateLabel=moderationEnabled?t('status_mod_on'):t('status_mod_off');
  statusText.textContent=t(total===1?'status_summary_one':'status_summary_many',{n:total,state:stateLabel});
}

let posts=[];
let currentCategory='General';
let openPostId=null;
let user=null;
let counts={};
let moderationEnabled=true;
let loadedOnce=false;

const $=id=>document.getElementById(id);
const tabsEl=$('tabs'),postsEl=$('posts'),statusText=$('statusText'),catTitle=$('catTitle');
const searchInput=$('searchInput'),sortSelect=$('sortSelect');
const newCategorySel=$('newCategory'),newTitle=$('newTitle'),newBody=$('newBody'),newCount=$('newCount'),postMsg=$('postMsg');
const postModal=$('postModal'),signinPanel=$('signinPanel'),whoBox=$('whoBox'),signinForm=$('signinForm'),signinMsg=$('signinMsg');

populateNewCategorySelect();

function escapeHtml(s){return String(s==null?'':s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
/* renderMarkdown is defined in markdown.js, loaded before this script. */
function timeLabel(v){const d=new Date(v);return isNaN(d)?'':d.toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}
function showMsg(el,text,kind){el.className='msg '+kind;el.textContent=text}
function clearMsg(el){el.className='msg';el.textContent=''}

function googleEnabled(){return !!GOOGLE_CLIENT_ID&&GOOGLE_CLIENT_ID.indexOf('PASTE_')!==0}
function microsoftEnabled(){return !!MICROSOFT_CLIENT_ID&&MICROSOFT_CLIENT_ID.indexOf('PASTE_')!==0}

function loadUser(){
  try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){user=JSON.parse(raw)}}catch(e){user=null}
  renderUser();
}
function saveUser(u){user=u;try{localStorage.setItem(STORAGE_KEY,JSON.stringify(u))}catch(e){}renderUser()}
function signOut(){
  user=null;
  try{localStorage.removeItem(STORAGE_KEY)}catch(e){}
  try{if(window.google&&google.accounts&&google.accounts.id)google.accounts.id.disableAutoSelect()}catch(e){}
  try{if(msalApp){const a=msalApp.getAllAccounts()[0];if(a)msalApp.logoutPopup({account:a,postLogoutRedirectUri:window.location.href.split('?')[0].split('#')[0]}).catch(()=>{})}}catch(e){}
  renderUser();
}
function renderUser(){
  if(user&&user.name&&user.email&&user.sessionToken){
    const tag=user.provider?` <small>${escapeHtml(t('signin_via',{provider:user.provider}))}</small>`:'';
    whoBox.innerHTML=`<div class="who"><div><strong>${escapeHtml(user.name)}</strong><small>${escapeHtml(user.email)}${tag}</small></div><button type="button" id="signoutBtn">${escapeHtml(t('signin_signout'))}</button></div>`;
    signinForm.style.display='none';
    $('signoutBtn').addEventListener('click',signOut);
  }else{
    whoBox.innerHTML='';
    signinForm.style.display='block';
    const anyEnabled=googleEnabled()||microsoftEnabled();
    $('ssoHint').style.display=anyEnabled?'':'none';
    $('ssoUnavailable').style.display=anyEnabled?'none':'';
    const gFallback=$('googleBtnFallback');
    if(gFallback)gFallback.style.display=googleEnabled()?'':'none';
    const mBtn=$('microsoftBtn');
    if(mBtn)mBtn.style.display=microsoftEnabled()?'':'none';
  }
}

function renderTabs(){
  tabsEl.innerHTML=CATEGORIES.map(c=>{
    const cnt=counts[c]||0;
    const active=c===currentCategory?' active':'';
    return `<button class="tab${active}" data-cat="${escapeHtml(c)}" type="button" role="tab" aria-selected="${c===currentCategory}">${escapeHtml(catLabel(c))}<span class="count">${cnt}</span></button>`;
  }).join('');
  tabsEl.querySelectorAll('.tab').forEach(btn=>{
    btn.addEventListener('click',()=>{currentCategory=btn.dataset.cat;openPostId=null;catTitle.textContent=catLabel(currentCategory);render();renderTabs()});
  });
  catTitle.textContent=catLabel(currentCategory);
}

function filteredPosts(){
  let list=posts.filter(p=>p.category===currentCategory);
  const q=searchInput.value.trim().toLowerCase();
  if(q){
    list=list.filter(p=>{
      const inPost=[p.title,p.body,p.authorName].join(' ').toLowerCase().includes(q);
      const inReplies=(p.replies||[]).some(r=>[r.body,r.authorName].join(' ').toLowerCase().includes(q));
      return inPost||inReplies;
    });
  }
  const sort=sortSelect.value;
  if(sort==='oldest')list.sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp));
  else if(sort==='busiest')list.sort((a,b)=>(b.replies?.length||0)-(a.replies?.length||0)||new Date(b.timestamp)-new Date(a.timestamp));
  else list.sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
  return list;
}

function render(){
  const list=filteredPosts();
  if(!list.length){
    postsEl.innerHTML=`<div class="empty"><strong>${escapeHtml(t('post_empty_title',{category:catLabel(currentCategory)}))}</strong>${escapeHtml(t('post_empty_sub'))}</div>`;
    return;
  }
  postsEl.innerHTML=list.map(p=>{
    const replies=p.replies||[];
    const open=p.id===openPostId;
    const replyCountTpl=replies.length===1?'post_reply_one':'post_reply_many';
    return `<article class="post${open?' open':''}" data-id="${escapeHtml(p.id)}">
      <div class="post-head" data-toggle="${escapeHtml(p.id)}">
        <div class="meta">
          <span class="post-cat">${escapeHtml(catLabel(p.category))}</span>
          <h3 class="post-title">${escapeHtml(p.title)}</h3>
          <div class="post-sub">
            <span>${escapeHtml(t('post_by'))} <strong>${escapeHtml(p.authorName||'Anonymous')}</strong></span>
            <span>${timeLabel(p.timestamp)}</span>
            <span class="replies-pill">${escapeHtml(t(replyCountTpl,{n:replies.length}))}</span>
          </div>
        </div>
      </div>
      ${open?`
        <div class="post-body markdown-body">${renderMarkdown(p.body)}</div>
        <div class="replies">
          ${replies.length?replies.map(r=>`<div class="reply">
            <div class="reply-meta"><strong>${escapeHtml(r.authorName||'Anonymous')}</strong> · ${timeLabel(r.timestamp)}</div>
            <div class="reply-body markdown-body">${renderMarkdown(r.body)}</div>
          </div>`).join(''):`<p style="color:var(--muted);margin:0;font-size:14px">${escapeHtml(t('reply_empty'))}</p>`}
          <form class="reply-form" data-postid="${escapeHtml(p.id)}">
            <textarea name="body" maxlength="1500" placeholder="${escapeHtml(user?t('reply_placeholder'):t('reply_placeholder_signedout'))}" ${user?'':'disabled'}></textarea>
            <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">
              <button class="btn sm" type="submit" ${user?'':'disabled'}>${escapeHtml(t('reply_submit'))}</button>
            </div>
            <div class="msg reply-msg"></div>
          </form>
        </div>
      `:''}
    </article>`;
  }).join('');
  postsEl.querySelectorAll('.post-head').forEach(el=>{
    el.addEventListener('click',()=>{const id=el.dataset.toggle;openPostId=openPostId===id?null:id;render()});
  });
  postsEl.querySelectorAll('.reply-form').forEach(f=>{
    f.addEventListener('submit',e=>{e.preventDefault();submitReply(f)});
  });
}

async function api(action,extra,method){
  if(SCRIPT_URL.indexOf('PASTE_YOUR')===0)throw new Error(t('msg_backend_not_configured'));
  const url=SCRIPT_URL;
  const payload={action,...(extra||{})};
  if((method||'GET')==='GET'){
    const params=new URLSearchParams({...payload,_:Date.now()});
    const res=await fetch(url+'?'+params.toString());
    const data=await res.json();
    if(!data.ok)throw apiError(data);
    return data;
  }
  const body=new URLSearchParams(payload);
  const res=await fetch(url,{method:'POST',body});
  const data=await res.json();
  if(!data.ok)throw apiError(data);
  return data;
}
function apiError(data){
  const err=new Error(data.error||'Request failed.');
  err.code=data.code||'';
  return err;
}
function handleAuthError(err){
  if(err&&err.code==='auth_required'){
    user=null;
    try{localStorage.removeItem(STORAGE_KEY)}catch(e){}
    renderUser();
    return t('msg_session_expired');
  }
  return err.message;
}

async function load(){
  try{
    const data=await api('list',{});
    posts=data.posts||[];
    counts={};
    posts.forEach(p=>counts[p.category]=(counts[p.category]||0)+1);
    const total=posts.length;
    moderationEnabled=!!data.moderationEnabled;
    loadedOnce=true;
    updateStatusText();
    renderTabs();
    render();
  }catch(err){
    statusText.textContent=t('status_connection_issue');
    postsEl.innerHTML=`<div class="empty"><strong>${escapeHtml(err.message)}</strong>${escapeHtml(t('status_backend_unconfigured'))}</div>`;
  }
}

async function submitReply(form){
  const msgEl=form.querySelector('.reply-msg');
  clearMsg(msgEl);
  if(!user){showMsg(msgEl,t('msg_signin_first_reply'),'err');return}
  const body=form.querySelector('textarea').value.trim();
  if(!body){showMsg(msgEl,t('msg_reply_empty'),'err');return}
  const btn=form.querySelector('button[type="submit"]');
  btn.disabled=true;btn.innerHTML='<span class="spinner"></span> '+t('reply_sending');
  try{
    const data=await api('reply',{postId:form.dataset.postid,body,sessionToken:user.sessionToken},'POST');
    showMsg(msgEl,data.status==='pending'?t('msg_reply_submitted_pending'):t('msg_reply_posted'),'info');
    form.reset();
    await load();
  }catch(err){showMsg(msgEl,handleAuthError(err),'err')}
  finally{btn.disabled=false;btn.textContent=t('reply_submit')}
}

async function submitPost(){
  clearMsg(postMsg);
  if(!user){showMsg(postMsg,t('msg_signin_first_post'),'err');return}
  const category=newCategorySel.value;
  const title=newTitle.value.trim();
  const body=newBody.value.trim();
  if(!title){showMsg(postMsg,t('msg_title_required'),'err');return}
  if(!body){showMsg(postMsg,t('msg_message_required'),'err');return}
  const btn=$('submitPost');
  btn.disabled=true;btn.innerHTML='<span class="spinner"></span> '+t('modal_submitting');
  try{
    const data=await api('post',{category,title,body,sessionToken:user.sessionToken},'POST');
    showMsg(postMsg,data.status==='pending'?t('msg_post_submitted_pending'):t('msg_post_posted'),'ok');
    newTitle.value='';newBody.value='';newCount.textContent='0';
    setTimeout(()=>{postModal.classList.remove('open');clearMsg(postMsg)},1400);
    currentCategory=category;
    await load();
  }catch(err){showMsg(postMsg,handleAuthError(err),'err')}
  finally{btn.disabled=false;btn.textContent='Submit post'}
}

async function completeSignIn(provider,tokens){
  clearMsg(signinMsg);
  try{
    const data=await api('signIn',{provider,...tokens},'POST');
    saveUser({name:data.user.name,email:data.user.email,provider:data.user.provider,sessionToken:data.sessionToken});
    showMsg(signinMsg,t('msg_signed_in_as',{name:data.user.name}),'ok');
    setTimeout(()=>clearMsg(signinMsg),2200);
  }catch(err){showMsg(signinMsg,err.message,'err')}
}

let msalApp=null;
let googleReady=false;

function whenReady(check,cb,tries){
  if(tries==null)tries=60;
  if(check())return cb();
  if(tries<=0)return;
  setTimeout(()=>whenReady(check,cb,tries-1),120);
}

function initGoogle(){
  if(!googleEnabled())return;
  whenReady(()=>window.google&&google.accounts&&google.accounts.id,()=>{
    try{
      google.accounts.id.initialize({
        client_id:GOOGLE_CLIENT_ID,
        callback:resp=>completeSignIn('google',{idToken:resp.credential})
      });
      const host=$('googleBtnHost');
      if(host)google.accounts.id.renderButton(host,{theme:'outline',size:'large',shape:'pill',text:'continue_with',width:240});
      googleReady=true;
    }catch(e){console.warn('Google init failed:',e)}
  });
}

function initMicrosoft(){
  if(!microsoftEnabled())return;
  whenReady(()=>window.msal&&msal.PublicClientApplication,()=>{
    try{
      msalApp=new msal.PublicClientApplication({
        auth:{
          clientId:MICROSOFT_CLIENT_ID,
          authority:'https://login.microsoftonline.com/'+MICROSOFT_TENANT,
          redirectUri:window.location.href.split('?')[0].split('#')[0]
        },
        cache:{cacheLocation:'sessionStorage'}
      });
      const init=msalApp.initialize?msalApp.initialize():Promise.resolve();
      Promise.resolve(init).catch(e=>console.warn('MSAL init error:',e));
    }catch(e){console.warn('Microsoft init failed:',e)}
  });
}

async function microsoftSignIn(){
  clearMsg(signinMsg);
  if(!microsoftEnabled()){showMsg(signinMsg,t('msg_microsoft_not_configured'),'err');return}
  const btn=$('microsoftBtn');
  btn.disabled=true;
  try{
    if(!msalApp)initMicrosoft();
    let tries=30;while((!msalApp||!msalApp.loginPopup)&&tries-->0){await new Promise(r=>setTimeout(r,120))}
    if(!msalApp||!msalApp.loginPopup)throw new Error(t('msg_microsoft_lib_failed'));
    const result=await msalApp.loginPopup({scopes:['User.Read'],prompt:'select_account'});
    if(!result||!result.accessToken)throw new Error(t('msg_microsoft_no_token'));
    await completeSignIn('microsoft',{accessToken:result.accessToken});
  }catch(err){
    const m=String(err&&err.message||err);
    if(/user_cancelled|popup_window_error|popup closed/i.test(m))showMsg(signinMsg,t('msg_signin_canceled'),'info');
    else showMsg(signinMsg,m,'err');
  }finally{btn.disabled=false}
}

function googleFallbackSignIn(){
  clearMsg(signinMsg);
  if(!googleEnabled()){showMsg(signinMsg,t('msg_google_not_configured'),'err');return}
  if(!window.google||!google.accounts||!google.accounts.id){showMsg(signinMsg,t('msg_google_lib_loading'),'err');return}
  try{google.accounts.id.prompt()}catch(e){showMsg(signinMsg,e.message,'err')}
}

function openNew(e){
  if(e)e.preventDefault();
  if(!user){showMsg(signinMsg,t('msg_signin_first_post'),'err');return}
  newCategorySel.value=currentCategory;
  clearMsg(postMsg);
  postModal.classList.add('open');
}

newBody.addEventListener('input',()=>newCount.textContent=newBody.value.length);
[searchInput,sortSelect].forEach(el=>el.addEventListener('input',render));
$('refreshBtn').addEventListener('click',load);
$('newPostBtn').addEventListener('click',openNew);
$('newPostBtnTop').addEventListener('click',openNew);
$('cancelPost').addEventListener('click',()=>postModal.classList.remove('open'));
$('submitPost').addEventListener('click',submitPost);
$('microsoftBtn').addEventListener('click',microsoftSignIn);
$('googleBtnFallback').addEventListener('click',googleFallbackSignIn);

const emailField=$('emailField'),passwordField=$('passwordField'),nameField=$('nameField');
const nameFieldWrap=$('nameFieldWrap'),emailSubmitBtn=$('emailSubmitBtn'),emailModeBtn=$('emailModeBtn');
let emailMode='signin';
function setEmailMode(mode){
  emailMode=mode;
  if(mode==='signup'){
    nameFieldWrap.hidden=false;
    passwordField.autocomplete='new-password';
    emailSubmitBtn.textContent=t('signin_email_signup');
    emailModeBtn.textContent=t('signin_email_haveaccount');
  }else{
    nameFieldWrap.hidden=true;
    passwordField.autocomplete='current-password';
    emailSubmitBtn.textContent=t('signin_email_submit');
    emailModeBtn.textContent=t('signin_email_signup');
  }
}
async function submitEmailAuth(){
  clearMsg(signinMsg);
  const email=emailField.value.trim();
  const password=passwordField.value;
  const name=nameField.value.trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){showMsg(signinMsg,t('msg_email_invalid'),'err');return}
  if(!password){showMsg(signinMsg,t('msg_password_required'),'err');return}
  if(emailMode==='signup'){
    if(password.length<8){showMsg(signinMsg,t('msg_password_too_short'),'err');return}
    if(!name){showMsg(signinMsg,t('msg_name_required'),'err');return}
  }
  const originalText=emailSubmitBtn.textContent;
  emailSubmitBtn.disabled=true;
  emailSubmitBtn.innerHTML='<span class="spinner"></span> '+t('signin_email_working');
  try{
    if(emailMode==='signup'){
      const data=await api('registerEmail',{email,password,name},'POST');
      saveUser({name:data.user.name,email:data.user.email,provider:data.user.provider,sessionToken:data.sessionToken});
      showMsg(signinMsg,t('msg_welcome_account'),'ok');
    }else{
      await completeSignIn('email',{email,password});
    }
    passwordField.value='';
  }catch(err){showMsg(signinMsg,err.message,'err')}
  finally{
    emailSubmitBtn.disabled=false;
    emailSubmitBtn.textContent=originalText;
  }
}
emailSubmitBtn.addEventListener('click',submitEmailAuth);
emailModeBtn.addEventListener('click',()=>setEmailMode(emailMode==='signin'?'signup':'signin'));
[emailField,passwordField,nameField].forEach(el=>el.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submitEmailAuth()}}));

postModal.addEventListener('click',e=>{if(e.target===postModal)postModal.classList.remove('open')});

currentLocale=detectLocale();
const localeSwitch=document.getElementById('localeSwitch');
if(localeSwitch){localeSwitch.value=currentLocale;localeSwitch.addEventListener('change',e=>setLocale(e.target.value))}
applyI18n();
populateNewCategorySelect();
setEmailMode(emailMode);

initGoogle();
initMicrosoft();
loadUser();
renderTabs();
load();
setInterval(load,REFRESH_SECONDS*1000);
