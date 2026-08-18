import { validateProject, type VideoSplatProject } from "../domain/project";

export function downloadProject(project: VideoSplatProject) {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${project.name.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-|-$/g, "") || "project"}.videosplat.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function readProject(file: File): Promise<VideoSplatProject> {
  if (file.size > 10 * 1024 * 1024) throw new Error("Project manifest is unexpectedly large.");
  return validateProject(JSON.parse(await file.text()));
}
