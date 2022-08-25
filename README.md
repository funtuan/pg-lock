# PG Lock

## Description

參考 [colonist4/pg-mutex-lock](https://github.com/colonist4/pg-mutex-lock) 完善 postgres 諮詢鎖功能，並使用 [pg pool](https://node-postgres.com/api/pool#poolconnect) 解決斷線自動重連
<br><br>
Refer to [colonist4/pg-mutex-lock](https://github.com/colonist4/pg-mutex-lock) to improve postgres advisory lock function, and use [pg pool](https://node-postgres.com/api/pool#poolconnect) to solve disconnection and automatic reconnection

## Feature

- Support multi-process mutex lock
- Support single-process mutex lock
- Support retry, timeout configuration
- Full typescript support
- Support pg pool

## API

### class PGLock

This class is entry point of features.
All functions are located under this class instance.

**Options**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|----|
| pool | Pool | no | undefined | use other pg pool (Create if empty) |
| poolConfig | PoolConfig | yes | undefined | refer to [PoolConfig](https://node-postgres.com/api/pool) |
| timeout | number | no | 10 * 1000 | acquire lock timeout |
| retryCount | number | no | 3 | acquire lock retry count |

<br>

### Method acquireLock (client: PoolClient, key: string) : Promise\<boolean\>

Try to acquire lock for given key.
If success, will be resolved with true.
If failed, will be rejected.

<br>

### Method releaseLock (client: PoolClient, key: string) : Promise\<boolean\>

Try to release lock for given key.
It directly return results of pg_advisory_unlock.

<br>

### Method lock (key: string, func: () => Promise\<any\>) : Promise\<any\>

Mutex lock by async function.

## Example

```javascript
import { PGLock } from 'pglock-v2'

const pgLock = new PGLock({
  poolConfig: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'password',
    database: 'database',
  },
})

setTimeout(async () => {
  console.log('start A')
  await pgLock.lock('test', async () => {
    console.log('locked A')
    await wait(1000)
    console.log('unlocked A')
  })
}, 100)

setTimeout(async () => {
  console.log('start B')
  await pgLock.lock('test', async () => {
    console.log('locked B')
    await wait(100)
    console.log('unlocked B')
  })
}, 300)
```

## Dependencies

- pg (<https://github.com/brianc/node-postgres>)
