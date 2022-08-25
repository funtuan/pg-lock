
const { PGLock } = require('./dist/index.js')

const wait = (delay = 0) =>
  new Promise((resolve) => setTimeout(resolve, delay))

const pgLock = new PGLock({
  poolConfig: {
    host: 'localhost',
    port: 5490,
    user: 'postgres',
    password: 'tnmongodevlocal',
    database: 'bob-backend-clone',
  },
})

async function run () {
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

  setTimeout(async () => {
    console.log('start C')
    await pgLock.lock('test', async () => {
      console.log('locked C')
      await wait(100)
      console.log('unlocked C')
    })
  }, 600)
}

setTimeout(run, 0)
