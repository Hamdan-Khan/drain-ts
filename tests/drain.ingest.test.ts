import { describe, expect, it } from "vitest";
import { Drain } from "../src/index.js";

describe("Drain.addLogMessage", () => {
  it("routes by token length so different lengths do not collide", () => {
    const drain = new Drain();

    const [c1, u1] = drain.addLogMessage("alpha beta gamma");
    const [c2, u2] = drain.addLogMessage("alpha beta");
    const [c3, u3] = drain.addLogMessage("alpha beta gamma");

    expect(u1).toBe("cluster_created");
    expect(u2).toBe("cluster_created");
    expect(u3).toBe("none");
    expect(c3.id).toBe(c1.id);
    expect(c2.id).not.toBe(c1.id);
    expect(drain.clusters).toHaveLength(2);
  });

  it("creates a new cluster when no match exists", () => {
    const drain = new Drain();

    const [firstCluster, firstUpdate] = drain.addLogMessage("A format 1");
    const [secondCluster, secondUpdate] = drain.addLogMessage("B format 1");

    expect(firstUpdate).toBe("cluster_created");
    expect(secondUpdate).toBe("cluster_created");
    expect(secondCluster.id).not.toBe(firstCluster.id);
    expect(drain.clusters).toHaveLength(2);
  });

  it("keeps template unchanged and increments size for exact matches", () => {
    const drain = new Drain();

    const [cluster1, update1] = drain.addLogMessage("worker started");
    const [cluster2, update2] = drain.addLogMessage("worker started");

    expect(update1).toBe("cluster_created");
    expect(update2).toBe("none");
    expect(cluster2.id).toBe(cluster1.id);
    expect(cluster2.template).toEqual(["worker", "started"]);
    expect(cluster2.size).toBe(2);
  });

  it("refines template and increments size when partial matches occur", () => {
    const drain = new Drain();

    const [cluster1] = drain.addLogMessage("loadModel start");
    const [cluster2, update2] = drain.addLogMessage("loadModel stop");

    expect(cluster2.id).toBe(cluster1.id);
    expect(update2).toBe("cluster_template_changed");
    expect(cluster2.template).toEqual(["loadModel", "<*>"]);
    expect(cluster2.size).toBe(2);
  });

  it("changes behavior when numeric token parameterization is disabled", () => {
    const withNumericParam = new Drain(
      4,
      0.4,
      100,
      null,
      [],
      undefined,
      "<*>",
      true,
    );
    const withoutNumericParam = new Drain(
      4,
      0.4,
      100,
      null,
      [],
      undefined,
      "<*>",
      false,
    );

    const numericInputs = ["user1 login ok", "user2 login ok"];

    const [, updateA2] = withNumericParam.addLogMessage(numericInputs[0]);
    const [clusterA2, updateB2] = withNumericParam.addLogMessage(
      numericInputs[1],
    );

    const [, updateA3] = withoutNumericParam.addLogMessage(numericInputs[0]);
    const [clusterB2, updateB3] = withoutNumericParam.addLogMessage(
      numericInputs[1],
    );

    expect(updateA2).toBe("cluster_created");
    expect(updateB2).toBe("cluster_template_changed");
    expect(clusterA2.template).toEqual(["<*>", "login", "ok"]);

    expect(updateA3).toBe("cluster_created");
    expect(updateB3).toBe("cluster_created");
    expect(clusterB2.template).toEqual(["user2", "login", "ok"]);
  });

  it("supports shorter-than-depth messages without duplicate clusters", () => {
    const drain = new Drain(4);

    const [, update1] = drain.addLogMessage("hello");
    const [, update2] = drain.addLogMessage("hello");
    const [, update3] = drain.addLogMessage("otherword");

    expect(update1).toBe("cluster_created");
    expect(update2).toBe("none");
    expect(update3).toBe("cluster_created");
    expect(drain.clusters).toHaveLength(2);
  });

  it("returns cluster ids for a token-length branch", () => {
    const drain = new Drain();

    const [cluster1] = drain.addLogMessage("aa aa aa");
    const [cluster2] = drain.addLogMessage("xx yy zz");
    drain.addLogMessage("aa aa bb");

    const ids = drain.getClustersIdsForSeqLen(3);

    expect(ids).toContain(cluster1.id);
    expect(ids).toContain(cluster2.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
