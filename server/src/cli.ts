import { fileURLToPath } from 'node:url'
import { hashPassword, USERNAME_RE } from './auth.ts'
import { one, openDb, run } from './db.ts'

const [cmd, username, password, ...nameParts] = process.argv.slice(2)
if (cmd !== 'create-teacher' || !username || !password) {
  console.log('用法:npm run create-teacher -- <帳號> <密碼(至少 8 字)> [姓名]')
  process.exit(1)
}
if (!USERNAME_RE.test(username)) { console.error('帳號格式不正確(2~32 字,英數、中文、_ . -)'); process.exit(1) }
if (password.length < 8) { console.error('教師密碼至少 8 個字元'); process.exit(1) }
const db = openDb(process.env.DB_PATH ?? fileURLToPath(new URL('../data/electronics.db', import.meta.url)))
if (one(db, 'SELECT 1 FROM users WHERE username = ?', username)) { console.error('這個帳號已經存在'); process.exit(1) }
const { salt, hash } = hashPassword(password)
run(db, 'INSERT INTO users (username, name, role, pass_hash, pass_salt, created_at) VALUES (?,?,?,?,?,?)', username, nameParts.join(' ') || username, 'teacher', hash, salt, Date.now())
console.log(`已建立教師帳號:${username}`)
