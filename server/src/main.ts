import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createApp } from './app.ts'
import { openDb } from './db.ts'

const arg = (name: string) => { const i = process.argv.indexOf(`--${name}`); return i >= 0 ? process.argv[i + 1] : undefined }
const port = Number(arg('port') ?? process.env.PORT ?? 8787)
const here = (rel: string) => fileURLToPath(new URL(rel, import.meta.url))
const dbPath = arg('db') ?? process.env.DB_PATH ?? here('../data/electronics.db')
const staticDir = process.env.STATIC_DIR ?? here('../../app/dist')
const db = openDb(dbPath)
const handler = createApp({ db, staticDir: existsSync(staticDir) ? staticDir : undefined, corsOrigin: process.env.CORS_ORIGIN })
createServer((req, res) => { void handler(req, res) }).listen(port, () => {
  console.log(`伺服器已啟動:http://localhost:${port}`)
  console.log(`資料庫:${dbPath}`)
  console.log(existsSync(staticDir) ? `靜態網站:${staticDir}` : '(尚未建置網站:請先在 app 資料夾執行 npm run build)')
})
