import { describe, expect, it } from "vitest";
import { Drain } from "../src/index.js";

describe("Drain edge cases", () => {
  it("handles empty log lines consistently", () => {
    const drain = new Drain();

    const [cluster1, update1] = drain.addLogMessage("");
    const [cluster2, update2] = drain.addLogMessage("    ");

    expect(update1).toBe("cluster_created");
    expect(update2).toBe("none");
    expect(cluster2.id).toBe(cluster1.id);
    expect(cluster2.template).toEqual([]);
    expect(cluster2.size).toBe(2);
  });

  it("keeps single-token lines separated when similarity is zero", () => {
    const drain = new Drain();

    const [cluster1, update1] = drain.addLogMessage("start");
    const [cluster2, update2] = drain.addLogMessage("stop");

    expect(update1).toBe("cluster_created");
    expect(update2).toBe("cluster_created");
    expect(cluster2.id).not.toBe(cluster1.id);
  });

  it("handles all-parameter-token input deterministically", () => {
    const drain = new Drain();

    const [, update1] = drain.addLogMessage("<*> <*> <*>");
    const [, update2] = drain.addLogMessage("<*> <*> <*>");

    expect(update1).toBe("cluster_created");
    expect(update2).toBe("cluster_created");
    expect(drain.clusters).toHaveLength(2);
  });

  it("keeps a single cluster for identical repeated lines", () => {
    const drain = new Drain();
    const line = "order-service completed successfully";

    let lastUpdate: string | null = null;
    for (let index = 0; index < 10; index += 1) {
      const [, update] = drain.addLogMessage(line);
      lastUpdate = update;
    }

    expect(lastUpdate).toBe("none");
    expect(drain.clusters).toHaveLength(1);
    expect(drain.getTotalClusterSize()).toBe(10);
  });
});
