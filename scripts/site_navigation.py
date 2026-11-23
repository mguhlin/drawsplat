"""Single source for DrawSplat's public site navigation."""
from pathlib import Path
from html import escape
import os
ROOT=Path(__file__).resolve().parents[1]
def nav_html(current):
    def link(path,label):
        base,sep,fragment=path.partition('#')
        url=os.path.relpath(ROOT/base,(ROOT/current).parent)+('/' if base.endswith('/') else '')+(sep+fragment if sep else '')
        return '<a data-no-action-icon href="'+escape(url,quote=True)+'">'+escape(label)+'</a>'
    more=[('pages/splatworks.html','SplatWorks overview'),('wiki/for-technology-admins.html','For schools and technology admins'),('wiki/about-developer.html','About the developer'),('blog/index.html','Blog'),('index.html#guestbook','Guestbook'),('legal/terms-privacy.html','Privacy')]
    def dropdown(label,items):return '<details name="drawsplat-site-menu" class="site-nav-dropdown"><summary>'+label+'</summary><div class="site-nav-menu">'+''.join(link(p,t) for p,t in items)+'</div></details>'
    return '<nav class="site-nav" aria-label="Primary navigation">'+link('studio/index.html','Browser apps')+link('pages/download.html#desktop-apps','Desktop apps')+link('wiki/index.html','Help')+dropdown('More',more)+'</nav>'
