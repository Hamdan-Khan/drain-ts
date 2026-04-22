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
      quit: vi.fn().mockResolvedValue("OK"),
    };

    const handler = new RedisPersistenceHandler({
      client: client as never,
    });

    await handler.close();

    expect(client.quit).not.toHaveBeenCalled();
  });
});
