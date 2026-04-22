import { Redis } from "ioredis";
import { PersistenceHandler } from "./persistenceHandler.js";

export class RedisPersistenceHandler extends PersistenceHandler {
  private client: Redis;
  private readonly key: string;
  private readonly ownsClient: boolean;

  /**
   * Creates a Redis-backed persistence handler.
   *
   * @param options Redis and snapshot options.
   */
  constructor(
    options: {
      host?: string;
      port?: number;
      key?: string;
      password?: string;
      db?: number;
      client?: Redis;
    } = {},
  ) {
    super();
    this.key = options.key ?? "drain3_state";

    if (options.client) {
      this.client = options.client;
      this.ownsClient = false;
      return;
    }

    this.client = new Redis({
      host: options.host ?? "localhost",
      port: options.port ?? 6379,
      password: options.password,
      db: options.db,
    });
    this.ownsClient = true;
  }

  /**
   * Persists state to Redis under the configured key.
   *
   * @param state Serialized state payload.
   */
  async save(state: string): Promise<void> {
    await this.client.set(this.key, state);
  }

  /**
   * Loads state from Redis.
   *
   * @returns Serialized state payload or `null` when no key exists.
   */
  async load(): Promise<string | null> {
    const raw = await this.client.get(this.key);
    if (!raw) {
      return null;
    }

    return raw;
  }

  /**
   * Closes the Redis connection when this handler created it.
   */
  async close(): Promise<void> {
    if (!this.ownsClient) {
      return;
    }

    await this.client.quit();
  }
}
