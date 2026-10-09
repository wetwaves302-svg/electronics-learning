import { describe, expect, it } from 'vitest'
import { bootstrapTeacher } from '../src/bootstrap.ts'
import { all, openDb } from '../src/db.ts'
import { verifyPassword } from '../src/auth.ts'

describe('第一次啟動建立教師帳號', () => {
  it('沒有環境變數:不建立', () => {
    const db = openDb(':memory:')
    expect(bootstrapTeacher(db, {})).toBe('skipped')
    expect(all(db, 'SELECT * FROM users')).toHaveLength(0)
  })
  it('有環境變數且還沒有教師:建立一位,密碼以雜湊儲存', () => {
    const db = openDb(':memory:')
    expect(bootstrapTeacher(db, { ADMIN_USERNAME: 'boss', ADMIN_PASSWORD: 'long-secret-1', ADMIN_NAME: '王老師' })).toBe('created')
    const u = all<{ username: string; name: string; role: string; pass_hash: string; pass_salt: string }>(db, 'SELECT * FROM users')
    expect(u).toHaveLength(1)
    expect(u[0]).toMatchObject({ username: 'boss', name: '王老師', role: 'teacher' })
    expect(u[0].pass_hash).not.toContain('long-secret-1')
    expect(verifyPassword('long-secret-1', u[0].pass_salt, u[0].pass_hash)).toBe(true)
  })
  it('已經有教師:不會再建立,也不會改動既有帳號(重啟或環境變數被改都一樣)', () => {
    const db = openDb(':memory:')
    bootstrapTeacher(db, { ADMIN_USERNAME: 'boss', ADMIN_PASSWORD: 'long-secret-1' })
    expect(bootstrapTeacher(db, { ADMIN_USERNAME: 'intruder', ADMIN_PASSWORD: 'another-pass-9' })).toBe('skipped')
    const u = all<{ username: string }>(db, 'SELECT username FROM users')
    expect(u.map((x) => x.username)).toEqual(['boss'])
  })
  it('帳號或密碼不合規則:不建立', () => {
    const db = openDb(':memory:')
    expect(bootstrapTeacher(db, { ADMIN_USERNAME: 'boss', ADMIN_PASSWORD: 'short' })).toBe('invalid')
    expect(bootstrapTeacher(db, { ADMIN_USERNAME: 'a b!', ADMIN_PASSWORD: 'long-secret-1' })).toBe('invalid')
    expect(all(db, 'SELECT * FROM users')).toHaveLength(0)
  })
})
