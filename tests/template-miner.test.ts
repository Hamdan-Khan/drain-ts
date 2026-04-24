import { describe, expect, it } from "vitest";
import {
  InMemoryPersistenceHandler,
  RedisPersistenceHandler,
  TemplateMiner,
  TemplateMinerConfig,
} from "../src/index.js";

describe("TemplateMiner", () => {
  it("requires initialize before use", async () => {
    const miner = new TemplateMiner();

    await expect(miner.addLogMessage("hello world")).rejects.toThrow(
      "initialize",
    );
  });

  it("loads persisted state from in-memory persistence", async () => {
    const persistence = new InMemoryPersistenceHandler();
    const config = new TemplateMinerConfig({ snapshotIntervalMinutes: 0 });

    const minerA = new TemplateMiner(config, persistence);
    await minerA.initialize();
    await minerA.addLogMessage("User 42 logged in");
    await minerA.saveSnapshot();
    await minerA.close();

    const minerB = new TemplateMiner(config, persistence);
    await minerB.initialize();

    expect(minerB.clusterCount()).toBe(1);
    expect(minerB.getTemplate("User 73 logged in")).toBe("User <*> logged in");

    await minerB.close();
  });

  it("returns created/updated changeType and supports getClusterById", async () => {
    const miner = new TemplateMiner();
    await miner.initialize();

    const first = await miner.addLogMessage("User Alice logged in");
    const second = await miner.addLogMessage("User Bob logged in");

    expect(first.changeType).toBe("created");
    expect(second.changeType).toBe("updated");

    const cluster = miner.getClusterById(first.logCluster.id);
    expect(cluster).not.toBeNull();
    expect(cluster?.id).toBe(first.logCluster.id);

    await miner.close();
  });

  it("auto-snapshots uncompressed state when interval is zero", async () => {
    const persistence = new InMemoryPersistenceHandler();
    const config = new TemplateMinerConfig({
      snapshotIntervalMinutes: 0,
      snapshotCompressState: false,
    });

    const miner = new TemplateMiner(config, persistence);
    await miner.initialize();
    await miner.addLogMessage("Session abc started");

    const raw = await persistence.load();
    expect(raw).not.toBeNull();
    expect(raw).toContain('"clusters"');

    const state = JSON.parse(raw as string) as { clusters: unknown[] };
    expect(state.clusters).toHaveLength(1);

    await miner.close();
  });

  it("round-trips compressed snapshots across miner instances", async () => {
    const persistence = new InMemoryPersistenceHandler();
    const config = new TemplateMinerConfig({
      snapshotIntervalMinutes: 0,
      snapshotCompressState: true,
    });

    const minerA = new TemplateMiner(config, persistence);
    await minerA.initialize();
    await minerA.addLogMessage("Payment for Alice failed");
    await minerA.addLogMessage("Payment for Bob failed");

    const payload = await persistence.load();
    expect(payload).not.toBeNull();
    expect(() => JSON.parse(payload as string)).toThrow();

    const minerB = new TemplateMiner(config, persistence);
    await minerB.initialize();

    expect(minerB.clusterCount()).toBe(1);
    expect(minerB.getTemplate("Payment for Carol failed")).toBe(
      "Payment for <*> failed",
    );

    await minerA.close();
    await minerB.close();
  });

  it("deleteState removes only the current miner persisted key", async () => {
    const store = new Map<string, string>();
    const client = {
      set: async (key: string, value: string) => {
        store.set(key, value);
        return "OK";
      },
      get: async (key: string) => store.get(key) ?? null,
      del: async (key: string) => {
        store.delete(key);
        return 1;
      },
      quit: async () => "OK",
    };

    const config = new TemplateMinerConfig({ snapshotIntervalMinutes: 0 });

    const persistenceA = new RedisPersistenceHandler({
      key: "drain:logSource:101",
      client: client as never,
    });
    const persistenceB = new RedisPersistenceHandler({
      key: "drain:logSource:202",
      client: client as never,
    });

    const minerA = new TemplateMiner(config, persistenceA);
    const minerB = new TemplateMiner(config, persistenceB);

    await minerA.initialize();
    await minerB.initialize();

    await minerA.addLogMessage("service-A event 1");
    await minerB.addLogMessage("service-B event 1");

    await expect(persistenceA.load()).resolves.not.toBeNull();
    await expect(persistenceB.load()).resolves.not.toBeNull();

    await minerA.deleteState();

    await expect(persistenceA.load()).resolves.toBeNull();
    await expect(persistenceB.load()).resolves.not.toBeNull();

    await minerA.close();
    await minerB.close();
  });
});
