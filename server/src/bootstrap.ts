import { hashPassword, USERNAME_RE } from './auth.ts'
import { one, run, type DB } from './db.ts'

/**
 * 第一次啟動時,依環境變數建立第一個教師帳號。
 * 只有在「資料庫裡還沒有任何教師」時才會建立;之後即使環境變數還在,也不會再改動任何帳號。
 */
export function bootstrapTeacher(db: DB, env: Record<string, string | undefined>, now = Date.now()): 'created' | 'skipped' | 'invalid' {
  const username = env.ADMIN_USERNAME?.trim()
  const password = env.ADMIN_PASSWORD
  if (!username || !password) return 'skipped'
  if (one(db, "SELECT 1 FROM users WHERE role = 'teacher' LIMIT 1")) return 'skipped'
  if (!USERNAME_RE.test(username) || password.length < 8) return 'invalid'
  const { salt, hash } = hashPassword(password)
  run(db, 'INSERT INTO users (username, name, role, pass_hash, pass_salt, created_at) VALUES (?,?,?,?,?,?)', username, env.ADMIN_NAME?.trim() || username, 'teacher', hash, salt, now)
  return 'created'
}
