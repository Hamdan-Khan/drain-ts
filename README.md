# drain-ts

TypeScript implementation of the Drain log template clustering algorithm.

More on Drain algorithm: [Drain3](https://github.com/logpai/Drain3)

## Install

```bash
npm install drain-ts
```

```bash
pnpm install drain-ts
```

```bash
yarn add drain-ts
```

## Quick Start

```typescript
import {
  InMemoryPersistenceHandler,
  TemplateMiner,
  TemplateMinerConfig,
} from "drain-ts";

const config = new TemplateMinerConfig({
  drainSimTh: 0.5,
  drainDepth: 4,
});

const persistence = new InMemoryPersistenceHandler();
const miner = new TemplateMiner(config, persistence);

await miner.initialize();

const result = await miner.addLogMessage("User 42 logged in from 192.168.1.1");

console.log(result.changeType);
console.log(result.logCluster.template.join(" "));

await miner.close();
```

`initialize()` must be awaited before calling `addLogMessage()` or query methods.

## Redis Persistence

```typescript
import {
  RedisPersistenceHandler,
  TemplateMiner,
  TemplateMinerConfig,
} from "drain-ts";

const miner = new TemplateMiner(
  new TemplateMinerConfig(),
  new RedisPersistenceHandler({
    host: "localhost",
    port: 6379,
    key: "my_drain_state",
  }),
);

await miner.initialize();
```

## Exports

- `TemplateMiner`
- `TemplateMinerConfig`
- `PersistenceHandler`
- `InMemoryPersistenceHandler`
- `RedisPersistenceHandler`
