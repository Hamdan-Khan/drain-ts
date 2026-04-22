import { Writable } from "node:stream";
import { describe, expect, it, vi } from "vitest";
import { Drain } from "../src/index.js";

describe("DrainBase public utility behavior", () => {
  it("enforces maxClusters and updates LRU order on cluster access", () => {
    const drain = new Drain(4, 0.4, 100, 1);

    drain.addLogMessage("A format 1");
    drain.addLogMessage("A format 2");
    drain.addLogMessage("B format 1");

    expect(drain.clusters).toHaveLength(1);
    expect(drain.match("A format 2", "always")).toBeNull();

    const [cluster, update] = drain.addLogMessage("B format 2");
    expect(update).toBe("cluster_template_changed");
    expect(cluster.template).toEqual(["B", "format", "<*>"]);
  });

  it("prints tree output to a writable stream", () => {
    const drain = new Drain();
    drain.addLogMessage("hello world");
    drain.addLogMessage("hello there");

    let output = "";
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        output += chunk.toString();
        callback();
      },
    });

    drain.printTree(stream, 10);

    expect(output).toContain("<root>");
    expect(output).toContain("cluster_count=");
    expect(output).toContain('"hello"');
  });

  it("prints tree to console when no writable stream is provided", () => {
    const drain = new Drain();
    drain.addLogMessage("service up");

    const consoleSpy = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);
    try {
      drain.printTree();
      expect(consoleSpy).toHaveBeenCalled();
    } finally {
      consoleSpy.mockRestore();
    }
  });

  it("counts wildcard tokens in similarity when includeParams is true", () => {
    const drain = new Drain();

    const [withoutParams] = drain.getSeqDistance(
      ["a", "<*>", "c"],
      ["a", "b", "c"],
      false,
    );
    const [withParams, paramCount] = drain.getSeqDistance(
      ["a", "<*>", "c"],
      ["a", "b", "c"],
      true,
    );

    expect(withoutParams).toBeCloseTo(2 / 3, 8);
    expect(withParams).toBe(1);
    expect(paramCount).toBe(1);
  });
});
