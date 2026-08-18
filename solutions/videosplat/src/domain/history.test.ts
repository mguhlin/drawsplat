import { describe, expect, it } from "vitest";
import { History } from "./history";

describe("history", () => {
  it("supports bounded undo and redo", () => {
    const history = new History(0, 2);
    history.commit(1); history.commit(2); history.commit(3);
    expect(history.undo()).toBe(2);
    expect(history.undo()).toBe(1);
    expect(history.undo()).toBe(1);
    expect(history.redo()).toBe(2);
  });
  it("clears redo after a new commit", () => {
    const history = new History("a"); history.commit("b"); history.undo(); history.commit("c");
    expect(history.canRedo).toBe(false);
  });
});
