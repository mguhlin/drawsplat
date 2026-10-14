"""Build the ecosystem feature reference; require coverage for every public component."""
from pathlib import Path
import json
ROOT = Path(__file__).resolve().parents[1]
registry = json.loads((ROOT/'data/drawsplat-tools.json').read_text())
features = json.loads((ROOT/'data/tool-features.json').read_text())
tools = [t for t in registry['tools'] if t['type'] in ('tool', 'widget', 'game', 'workspace')]
assert set(features) == {t['id'] for t in tools}, 'Update tool-features.json for registry additions/removals'
assert all(len(features[t['id']]) >= 3 for t in tools), 'Each component needs at least three features'
lines = ['# SplatWorks ecosystem: tools, widgets, and features', '',
 'DrawSplat is an ecosystem of creative tools, classroom widgets, games, and SplatWorks applications. The whiteboard is one component. Open any linked component directly, or browse [Studio](../studio/index.html).', '',
 'This reference follows the same categories as Studio. Components appear in every category they support. Each entry links to the application and lists its main features. The complete suite installation includes these components; selected tools keep their own saving and integration behavior.', '',
 '[Install the complete ecosystem](district-selfhost.html) · [Download packages](../pages/download.html) · [Whiteboard classroom guide](../guides/project-reference.html)', '',
 'Most tools work locally in the browser. Brain Sort, Clock Wizard, Step-Splat, Toneshifter, and Vibe Check offer optional external AI connections. Editable QR codes and cloud integrations require their own configuration. See the individual application for supported formats and options.', '']
lines += ['## Choosing a keyboarding activity', '', 'Use these activities to build keyboard familiarity, accuracy, and typing fluency. Age equivalents are approximate guidance based on the available grade bands; choose by reading ability and keyboard readiness. The games complement teacher instruction in posture, finger placement, and touch typing.', '', '| Component | Keyboarding purpose | Suggested learners |', '| --- | --- | --- |', '| [Paws & Keys Adventure](../games/paws-and-keys-adventure/) | Key locations and finger hints; gentle first-key practice. | Ages 4–9; beginning keyboard users. |', '| [Cipher Chase](../games/cipher-chase/) | Type target words accurately while playing an arcade driving game. | Grades 3–12 (about ages 8–18); bands 3–5, 6–8, 9–12. |', '| [Wordfall Reactor](../games/wordfall-reactor/) | Word entry, spelling, and vocabulary; rack-tile input is also available. | Grades 3–12 (about ages 8–18); everyday words or grade-banded TEKS vocabulary. |', '| [Story Sprint](../games/story-sprint/) | Copy passages with punctuation; measure typing speed and accuracy. | K–12 (about ages 5–18); bands K–2, 3–5, 6–8, 9–12; custom passages. |', '']
for category in registry['categories']:
    members = sorted([t for t in tools if category['id'] in t['categories']], key=lambda t: t['name'].casefold())
    lines += ['## '+category['name'], '', 'Category: **'+category['shortName']+'** · '+str(len(members))+' components', '']
    for t in members:
        url = t['url']
        lines += ['### '+t['name'], '', '**'+t['type'].capitalize()+'** · [Open '+t['name']+'](..'+url+')', '']
        lines += ['- '+f for f in features[t['id']]] + ['']
lines += ['## Widgets inside the whiteboard', '', 'These classroom widgets are opened on a whiteboard page. Use the [classroom widgets guide](../guides/classroom-widgets-tools.html) for the board workflow.', '', '| Category | Widget | Features |', '| --- | --- | --- |', '| Classroom | Poll | Collect quick visible responses. |', '| Classroom | Random Pick | Choose names, groups, or topics. |', '| Classroom | Wheel Spinner | Spin options for prompts or teams. |', '| Classroom | Timer | Show work time directly on the board. |', '| Classroom | Traffic Light | Display classroom status. |', '| Classroom | Work Mode | Display the current classroom working mode. |', '| Classroom / Play | Scoreboard | Track review-game scores. |', '| Classroom / Play | Progress Race | Track group progress. |', '| Classroom | Big Link | Post a large readable URL or resource link. |', '']
lines += ['## Meme Puzzle instructional activity library', '', '[Browse and filter the PuzzleMaker Library](../solutions/memepuzzle/library/) by grade band or content area, then download a ready-to-use setup. Students answer questions to reveal image tiles. The following topics and standards labels come from the bundled activity metadata; suggested classroom uses elsewhere on this page are teaching ideas rather than additional built-in lesson packs.', '', '| Activity | Grades | Subject | Standards labels in the activity |', '| --- | --- | --- |']
library = ROOT/'solutions/memepuzzle/library'
import re
files = re.findall(r'"([^"/]+\.json)"', (library/'index.html').read_text())
for name in files:
    activity = json.loads((library/name).read_text())
    meta = activity['metadata']
    lines.append('| '+activity['title']+' | '+meta['gradeBand']+' | '+meta['subject']+' | '+', '.join(meta['standards'])+' |')
lines += ['']
(ROOT/'docs/tools-widgets-features.md').write_text('\n'.join(lines))
