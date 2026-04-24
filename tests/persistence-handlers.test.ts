import { describe, expect, it, vi } from "vitest";
import {
  InMemoryPersistenceHandler,
  RedisPersistenceHandler,
} from "../src/index.js";

describe("InMemoryPersistenceHandler", () => {
  it("saves and loads a string payload and close is a no-op", async () => {
    const handler = new InMemoryPersistenceHandler();
    const payload = '{"hello":"world"}';

    await handler.save(payload);

    expect(await handler.load()).toBe(payload);
    await expect(handler.close()).resolves.toBeUndefined();
  });

  it("delete clears only its own state across multiple handlers", async () => {
    const handlerA = new InMemoryPersistenceHandler();
    const handlerB = new InMemoryPersistenceHandler();

    await handlerA.save("state-a");
    await handlerB.save("state-b");

    await handlerA.delete();

    await expect(handlerA.load()).resolves.toBeNull();
    await expect(handlerB.load()).resolves.toBe("state-b");
  });
});

describe("RedisPersistenceHandler with injected client", () => {
  it("save uses configured key and payload", async () => {
    const client = {
      set: vi.fn().mockResolvedValue("OK"),
      get: vi.fn(),
      quit: vi.fn(),
    };

    const handler = new RedisPersistenceHandler({
      key: "custom_state_key",
      client: client as never,
    });

    await handler.save("payload-123");

    expect(client.set).toHaveBeenCalledWith("custom_state_key", "payload-123");
  });

  it("load returns payload or null", async () => {
    const client = {
      set: vi.fn(),
      get: vi
        .fn()
        .mockResolvedValueOnce("persisted-state")
        .mockResolvedValueOnce(null),
      quit: vi.fn(),
    };

    const handler = new RedisPersistenceHandler({
      client: client as never,
    });

    await expect(handler.load()).resolves.toBe("persisted-state");
    await expect(handler.load()).resolves.toBeNull();
  });

  it("close does not call quit when client is injected", async () => {
    const client = {
      set: vi.fn(),
      get: vi.fn(),
      del: vi.fn(),
      quit: vi.fn().mockResolvedValue("OK"),
    };

    const handler = new RedisPersistenceHandler({
      client: client as never,
    });

    await handler.close();

    expect(client.quit).not.toHaveBeenCalled();
  });

  it("delete removes only the configured key in a multi-handler setup", async () => {
    const store = new Map<string, string>();
    const client = {
      set: vi.fn(async (key: string, value: string) => {
        store.set(key, value);
        return "OK";
      }),
      get: vi.fn(async (key: string) => store.get(key) ?? null),
      del: vi.fn(async (key: string) => {
        store.delete(key);
        return 1;
      }),
      quit: vi.fn(),
    };

    const handlerA = new RedisPersistenceHandler({
      key: "drain:logSource:1",
      client: client as never,
    });

    const handlerB = new RedisPersistenceHandler({
      key: "drain:logSource:2",
      client: client as never,
    });

    await handlerA.save("state-1");
    await handlerB.save("state-2");

    await handlerA.delete();

    await expect(handlerA.load()).resolves.toBeNull();
    await expect(handlerB.load()).resolves.toBe("state-2");
    expect(client.del).toHaveBeenCalledTimes(1);
    expect(client.del).toHaveBeenCalledWith("drain:logSource:1");
  });
});
