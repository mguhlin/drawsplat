"""Single source for DrawSplat's public site navigation."""
from pathlib import Path
from html import escape
import os
ROOT=Path(__file__).resolve().parents[1]
def nav_html(current):
    def link(path,label):
        base,sep,fragment=path.partition('#')
        url=os.path.relpath(ROOT/base,(ROOT/current).parent)+(sep+fragment if sep else '')
        return '<a data-no-action-icon href="'+escape(url,quote=True)+'">'+escape(label)+'</a>'
    apps=[('app/whiteboard.html','Whiteboard'),('studio/index.html','All apps'),('pages/tools.html','Tools and widgets'),('games/index.html','Games')]
    suite=[('pages/splatworks.html','SplatWorks overview'),('wiki/layoutsplat.html','LayoutSplat'),('pages/writesplat.html','WriteSplat'),('pages/listsplat.html','ListSplat'),('pages/showsplat.html','ShowSplat'),('pages/gridsplat.html','GridSplat')]
    def dropdown(label,items):return '<details name="drawsplat-site-menu" class="site-nav-dropdown"><summary>'+label+'</summary><div class="site-nav-menu">'+''.join(link(p,t) for p,t in items)+'</div></details>'
    return '<nav class="site-nav" aria-label="Primary navigation">'+dropdown('Apps',apps)+dropdown('SplatWorks',suite)+link('blog/index.html','Blog')+link('index.html#guestbook','Guestbook')+link('wiki/index.html','Wiki')+link('legal/terms-privacy.html','Privacy')+'</nav>'
