import { SubtitleGenerationDialog, type Source, type Cue } from '@splat/local-subtitles';
export function GenerateSubtitlesDialog({ source, autoStart, onUse, onClose }: { source: Source; autoStart?: boolean; onUse: (cues: Cue[]) => void; onClose: () => void }) {
  return <SubtitleGenerationDialog source={source} autoStart={autoStart} onUse={onUse} onClose={onClose} actionLabel="Add subtitles to timeline" description="Captions will be added on a new track at the selected clip’s timeline position. Existing captions are kept. After adding them, you can edit captions on the timeline or save the project’s captions from the File menu."/>;
}
