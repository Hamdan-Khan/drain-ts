import { describe, expect, it } from "vitest";
import { Drain } from "../src/drain/drain.js";

describe("Drain.match", () => {
  it("matches known clusters and rejects unknown messages", () => {
    const model = new Drain();
    model.addLogMessage("aa aa aa");
    model.addLogMessage("aa aa bb");
    model.addLogMessage("aa aa cc");
    model.addLogMessage("xx yy zz");

    const match1 = model.match("aa aa tt");
    const match2 = model.match("xx yy zz");
    const noMatch1 = model.match("xx yy rr");
    const noMatch2 = model.match("nothing");

    expect(match1?.id).toBe(1);
    expect(match2?.id).toBe(2);
    expect(noMatch1).toBeNull();
    expect(noMatch2).toBeNull();
  });

  it("supports never and always search strategies", () => {
    const drain = new Drain();

    drain.addLogMessage("training4Model start");
    drain.addLogMessage("loadModel start");
    drain.addLogMessage("loadModel stop");
    drain.addLogMessage("this is a test");

    expect(drain.match("loadModel start", "always")).not.toBeNull();
    expect(drain.match("loadModel start", "never")).toBeNull();

    drain.addLogMessage("loadModel start");

    expect(drain.match("loadModel start", "always")).not.toBeNull();
    expect(drain.match("loadModel start", "never")).not.toBeNull();
  });

  it("does not mutate clusters or sizes during match", () => {
    const drain = new Drain();
    const [cluster] = drain.addLogMessage("service ready");
    const sizeBefore = cluster.size;
    const totalSizeBefore = drain.getTotalClusterSize();

    const matched = drain.match("service ready", "always");

    expect(matched?.id).toBe(cluster.id);
    expect(cluster.size).toBe(sizeBefore);
    expect(drain.getTotalClusterSize()).toBe(totalSizeBefore);
  });

  it("returns null for same semantic text with different token count", () => {
    const drain = new Drain();
    drain.addLogMessage("rrr qqq 456");

    expect(drain.match("rrr qqq", "always")).toBeNull();
    expect(drain.match("rrr qqq 555.2", "always")).toBeNull();
    expect(drain.match("rrr qqq num", "always")).toBeNull();
  });
});
