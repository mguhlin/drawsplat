import { describe, expect, it } from "vitest"; import { acceptedMedia } from "./metadata";
describe("acceptedMedia", () => { it.each(["clip.mp4", "film.mkv", "legacy.WMV", "sound.ogg", "voice.mp3", "capture.m2ts"])("accepts %s", name => expect(acceptedMedia(new File([], name))).toBe(true)); it("rejects unrelated files", () => expect(acceptedMedia(new File([], "notes.pdf"))).toBe(false)); });
