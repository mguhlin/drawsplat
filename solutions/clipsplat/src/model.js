const PRESETS = { reel: { label: "Reel", width: 1080, height: 1920, max: 180 }, story: { label: "Story", width: 1080, height: 1920, max: 60 }, feed: { label: "Feed portrait", width: 1080, height: 1350, max: 180 } };
function timeline(duration, start, end, intro, outro, preset) {
  const values = [duration, start, end, intro, outro];
  if (values.some((v) => !Number.isFinite(v))) throw new Error("Enter valid times.");
  if (start < 0 || end > duration + 0.05 || end <= start) throw new Error("The end time must follow the start and stay within your video.");
  if (intro < 0 || outro < 0 || intro > 10 || outro > 10) throw new Error("Title panels must last between 0 and 10 seconds.");
  const total = end - start + intro + outro;
  if (total < 3) throw new Error("Use at least 3 seconds including title panels.");
  if (total > PRESETS[preset].max + 0.01) throw new Error(`This preset allows ${PRESETS[preset].max} seconds including panels. Shorten the clip or panels.`);
  return { start, end, intro, outro, total };
}
function videoFilter(width, height, fit) {
  return fit === "crop" ? `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1,fps=30,format=yuv420p` : `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=0x122c32,setsar=1,fps=30,format=yuv420p`;
}
export {
  PRESETS,
  timeline,
  videoFilter
};
