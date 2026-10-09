import { touchProject, type VideoSplatProject, type TimelineMarker } from '../domain/project';
export const MARKER_COLORS = ['#f5b942', '#9489ff', '#3ddc97', '#ff6b7a', '#64c8ff'];
export function addMarker(project: VideoSplatProject, time: number): VideoSplatProject {
  if (!Number.isFinite(time) || time < 0) return project;
  const marker: TimelineMarker = {id:crypto.randomUUID(), name:`Marker ${(project.markers?.length ?? 0)+1}`,
    time:Math.round(time*project.canvas.frameRate)/project.canvas.frameRate, color:MARKER_COLORS[0]};
  return touchProject(project, {markers:[...(project.markers ?? []), marker]});
}
export function updateMarker(project: VideoSplatProject, id: string, patch: Pick<TimelineMarker,'name'|'time'|'color'>): VideoSplatProject {
  if (!project.markers?.some(marker=>marker.id===id) || !patch.name.trim() || patch.name.trim().length>120 ||
    !Number.isFinite(patch.time) || patch.time<0 || !/^#[0-9a-f]{6}$/i.test(patch.color)) return project;
  return touchProject(project,{markers:project.markers.map(marker=>marker.id===id?{...marker,...patch,name:patch.name.trim(),
    time:Math.round(patch.time*project.canvas.frameRate)/project.canvas.frameRate}:marker)});
}
export function removeMarker(project: VideoSplatProject, id: string): VideoSplatProject {
  if (!project.markers?.some(marker=>marker.id===id)) return project;
  return touchProject(project,{markers:project.markers.filter(marker=>marker.id!==id)});
}
export function nearbyMarker(markers: TimelineMarker[], time: number, direction: -1|1): TimelineMarker|undefined {
  const candidates = [...markers].sort((a,b)=>a.time-b.time).filter(marker=>direction===1?marker.time>time+1e-6:marker.time<time-1e-6);
  return direction===1?candidates[0]:candidates.at(-1);
}
