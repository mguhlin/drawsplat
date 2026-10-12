"""Build the ecosystem feature reference; require coverage for every public component."""
from pathlib import Path
import json
ROOT = Path(__file__).resolve().parents[1]
registry = json.loads((ROOT/'data/drawsplat-tools.json').read_text())
features = json.loads((ROOT/'data/tool-features.json').read_text())
tools = [t for t in registry['tools'] if t['type'] in ('tool', 'widget', 'game', 'workspace')]
assert set(features) == {t['id'] for t in tools}, 'Update tool-features.json for registry additions/removals'
assert all(len(features[t['id']]) >= 3 for t in tools), 'Each component needs at least three features'
lines = ['# DrawSplat ecosystem: tools, widgets, and features', '',
 'DrawSplat is an ecosystem of creative tools, classroom widgets, games, and SplatWorks applications. The whiteboard is one component. Open any linked component directly, or browse [Studio](../studio/index.html).', '',
 'This reference follows the same categories as Studio. Components appear in every category they support. Each entry links to the application and lists its main features. The complete suite installation includes these components; selected tools keep their own saving and integration behavior.', '',
 '[Install the complete ecosystem](district-selfhost.html) · [Download packages](../pages/download.html) · [Whiteboard classroom guide](../guides/project-reference.html)', '',
 'Most tools work locally in the browser. Brain Sort, Clock Wizard, Step-Splat, Toneshifter, and Vibe Check offer optional external AI connections. Editable QR codes and cloud integrations require their own configuration. See the individual application for supported formats and options.', '']
for category in registry['categories']:
    members = sorted([t for t in tools if category['id'] in t['categories']], key=lambda t: t['name'].casefold())
    lines += ['## '+category['name'], '', 'Category: **'+category['shortName']+'** · '+str(len(members))+' components', '']
    for t in members:
        url = t['url']
        lines += ['### '+t['name'], '', '**'+t['type'].capitalize()+'** · [Open '+t['name']+'](..'+url+')', '']
        lines += ['- '+f for f in features[t['id']]] + ['']
lines += ['## Widgets inside the whiteboard', '', 'These classroom widgets are opened on a whiteboard page. Use the [classroom widgets guide](../guides/classroom-widgets-tools.html) for the board workflow.', '', '| Category | Widget | Features |', '| --- | --- | --- |', '| Classroom | Poll | Collect quick visible responses. |', '| Classroom | Random Pick | Choose names, groups, or topics. |', '| Classroom | Wheel Spinner | Spin options for prompts or teams. |', '| Classroom | Timer | Show work time directly on the board. |', '| Classroom | Traffic Light | Display classroom status. |', '| Classroom | Work Mode | Display the current classroom working mode. |', '| Classroom / Play | Scoreboard | Track review-game scores. |', '| Classroom / Play | Progress Race | Track group progress. |', '| Classroom | Big Link | Post a large readable URL or resource link. |', '']
(ROOT/'docs/tools-widgets-features.md').write_text('\n'.join(lines))
