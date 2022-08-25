
import { PoolClient, Pool, PoolConfig } from 'pg'
import { createHash } from 'crypto'

interface ConstructionOptions {
  pool?: Pool
  poolConfig: PoolConfig
  /** timeout in milliseconds (default: 10 * 1000 ms) */
  timeout?: number
  /** (default: 3) */
  retryCount?: number
}

export class PGLock {
    private readonly timeout: number;
    private readonly retryCount: number;
    private readonly pool: Pool;

    constructor ({
      pool,
      poolConfig,
      timeout = 10 * 1000,
      retryCount = 3,
    }: ConstructionOptions) {
      if (pool == null) {
        this.pool = new Pool(poolConfig)
      } else {
        this.pool = pool
      }

      this.timeout = timeout
      this.retryCount = retryCount

      this.acquireLock = this.acquireLock.bind(this)
      this.releaseLock = this.releaseLock.bind(this)
    }

    async getClient (): Promise<PoolClient> {
      return await this.pool.connect()
    }

    async acquireLock (client: PoolClient, key: string): Promise<boolean> {
      const [classid, objid] = strToKey(key)

      // Check in session lock
      for (let i = 0; i < this.retryCount; i++) {
        const time = +new Date()
        while (+new Date() - time < this.timeout) {
          const res = await client.query('SELECT pg_try_advisory_lock($1, $2)', [classid, objid])
          if (res.rows[0].pg_try_advisory_lock === true) return true

          await sleep(100)
        }
      }

      throw Error('Cannot acquire lock')
    }

    async releaseLock (client: PoolClient, key: string): Promise<boolean> {
      const [classid, objid] = strToKey(key)

      const res = await client.query(`
            SELECT pg_advisory_unlock($1, $2);
        `, [classid, objid])

      return res.rows[0].pg_advisory_unlock
    }

    async lock (key: string, func: () => Promise<any>): Promise<any> {
      const client = await this.pool.connect()
      try {
        await this.acquireLock(client, key)
        return await func()
      } finally {
        await this.releaseLock(client, key)
      }
    }
}

function strToKey (str: string): [number, number] {
  const buf = createHash('sha256').update(str).digest()
  return [buf.readInt32LE(0), buf.readInt32LE(4)]
}

async function sleep (time: number): Promise<void> {
  return await new Promise((resolve) => setTimeout(resolve, time))
}
