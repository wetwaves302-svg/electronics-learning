import ExcelJS from 'exceljs'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { addTeacher, at, client, mkAttempt, setupClass, startEnv, type TestEnv } from './helpers.ts'
import { one } from '../src/db.ts'

let env: TestEnv
beforeEach(async () => { env = await startEnv() })
afterEach(async () => { await env.close() })

describe('帳號與登入', () => {
  it('教師登入成功;帳號或密碼錯誤的訊息一致(不洩漏帳號是否存在)', async () => {
    addTeacher(env.db, 'teacher1')
    const { call } = client(env)
    const ok = await call('POST', '/api/auth/login', { body: { username: 'teacher1', password: 'teacher-pass-1' } })
    expect(ok.status).toBe(200)
    expect(ok.data.user.role).toBe('teacher')
    const wrongPw = await call('POST', '/api/auth/login', { body: { username: 'teacher1', password: 'nope-nope' } })
    const noUser = await call('POST', '/api/auth/login', { body: { username: 'ghost', password: 'nope-nope' } })
    expect(wrongPw.status).toBe(401)
    expect(noUser.status).toBe(401)
    expect(wrongPw.data.error).toBe(noUser.data.error)
  })
  it('密碼以 scrypt 雜湊儲存,資料庫裡沒有明文', async () => {
    addTeacher(env.db, 'teacher1', 'secret-password-xyz')
    const row = one<{ pass_hash: string; pass_salt: string }>(env.db, 'SELECT pass_hash, pass_salt FROM users WHERE username = ?', 'teacher1')!
    expect(row.pass_hash).not.toContain('secret-password-xyz')
    expect(row.pass_hash).toHaveLength(128)
    expect(row.pass_salt).toHaveLength(32)
  })
  it('連續登入失敗會被限制(第 9 次回 429),成功登入會重置', async () => {
    addTeacher(env.db, 'teacher1')
    const { call } = client(env)
    for (let i = 0; i < 8; i++) expect((await call('POST', '/api/auth/login', { body: { username: 'teacher1', password: 'bad-password' } })).status).toBe(401)
    expect((await call('POST', '/api/auth/login', { body: { username: 'teacher1', password: 'bad-password' } })).status).toBe(429)
    expect((await call('POST', '/api/auth/login', { body: { username: 'teacher1', password: 'teacher-pass-1' } })).status).toBe(429) // 被鎖住期間連正確密碼也不放行
    env.clock.t += 11 * 60_000
    expect((await call('POST', '/api/auth/login', { body: { username: 'teacher1', password: 'teacher-pass-1' } })).status).toBe(200)
  })
  it('學生用班級代碼註冊;代碼錯誤、帳號重複、密碼太短都被擋下', async () => {
    const { cls, c } = await setupClass(env)
    const ok = await c.call('POST', '/api/auth/register-student', { body: { classCode: cls.code, username: 'newkid', password: 'abcdef', name: '小明' } })
    expect(ok.status).toBe(200)
    expect(ok.data.user.classId).toBe(cls.id)
    expect((await c.call('POST', '/api/auth/register-student', { body: { classCode: 'ZZZZZZ', username: 'kid2', password: 'abcdef' } })).status).toBe(400)
    expect((await c.call('POST', '/api/auth/register-student', { body: { classCode: cls.code, username: 'NEWKID', password: 'abcdef' } })).status).toBe(409) // 帳號不分大小寫
    expect((await c.call('POST', '/api/auth/register-student', { body: { classCode: cls.code, username: 'kid3', password: '123' } })).status).toBe(400)
    expect((await c.call('POST', '/api/auth/register-student', { body: { classCode: cls.code, username: "a'; DROP TABLE users;--", password: 'abcdef' } })).status).toBe(400)
  })
  it('登入逾期後 token 失效;登出後 token 失效', async () => {
    const { stuTokens, c } = await setupClass(env)
    expect((await c.call('GET', '/api/me', { token: stuTokens.s1 })).status).toBe(200)
    await c.call('POST', '/api/auth/logout', { token: stuTokens.s1 })
    expect((await c.call('GET', '/api/me', { token: stuTokens.s1 })).status).toBe(401)
    const t2 = await c.login('s2', 'pass-s2-1')
    env.clock.t += 31 * 86_400_000
    expect((await c.call('GET', '/api/me', { token: t2 })).status).toBe(401)
  })
  it('改密碼:需要舊密碼;舊 token 失效、舊密碼失效、新密碼可登入', async () => {
    const { stuTokens, c } = await setupClass(env)
    expect((await c.call('POST', '/api/auth/password', { token: stuTokens.s1, body: { oldPassword: 'wrong-old', newPassword: 'brand-new-1' } })).status).toBe(400)
    const r = await c.call('POST', '/api/auth/password', { token: stuTokens.s1, body: { oldPassword: 'pass-s1-1', newPassword: 'brand-new-1' } })
    expect(r.status).toBe(200)
    expect((await c.call('GET', '/api/me', { token: stuTokens.s1 })).status).toBe(401)
    expect((await c.call('GET', '/api/me', { token: r.data.token })).status).toBe(200)
    expect((await c.call('POST', '/api/auth/login', { body: { username: 's1', password: 'pass-s1-1' } })).status).toBe(401)
    expect((await c.call('POST', '/api/auth/login', { body: { username: 's1', password: 'brand-new-1' } })).status).toBe(200)
  })
})

describe('權限', () => {
  it('未登入不能用需要登入的 API;學生不能用教師 API;教師不能同步學生紀錄', async () => {
    const { c, stuTokens, teacherToken, cls } = await setupClass(env)
    expect((await c.call('GET', '/api/classes')).status).toBe(401)
    expect((await c.call('GET', '/api/classes', { token: stuTokens.s1 })).status).toBe(403)
    expect((await c.call('GET', `/api/classes/${cls.id}/analytics`, { token: stuTokens.s1 })).status).toBe(403)
    expect((await c.call('PUT', '/api/teacher/questions/WB1-MC-07', { token: stuTokens.s1, body: { solution: 'x' } })).status).toBe(403)
    expect((await c.call('POST', '/api/attempts/sync', { token: teacherToken, body: { attempts: [] } })).status).toBe(403)
    expect((await c.call('GET', '/api/attempts/mine', { token: teacherToken })).status).toBe(403)
  })
  it('教師 B 看不到教師 A 的班級與學生(一律 404,不洩漏存在與否)', async () => {
    const a = await setupClass(env, 'tA', ['sa1'])
    addTeacher(env.db, 'tB')
    const tb = await a.c.login('tB', 'teacher-pass-1')
    const id = a.cls.id
    for (const p of [`/api/classes/${id}/students`, `/api/classes/${id}/analytics`, `/api/classes/${id}/assignments`, `/api/classes/${id}/export.xlsx`, `/api/students/${a.ids.sa1}/history`]) {
      expect((await a.c.call('GET', p, { token: tb })).status, p).toBe(404)
    }
    expect((await a.c.call('POST', `/api/students/${a.ids.sa1}/reset-password`, { token: tb })).status).toBe(404)
    expect((await a.c.call('POST', `/api/students/${a.ids.sa1}/disable`, { token: tb, body: { disabled: true } })).status).toBe(404)
    expect((await a.c.call('POST', `/api/classes/${id}/students`, { token: tb, body: { lines: 'x1,甲' } })).status).toBe(404)
    expect((await a.c.call('POST', `/api/classes/${id}/assignments`, { token: tb, body: { title: 'x', questionIds: ['WB1-MC-07'] } })).status).toBe(404)
    expect((await a.c.call('GET', '/api/classes', { token: tb })).data.classes).toEqual([])
  })
  it('學生只能讀自己的紀錄,且不會取得他人資料', async () => {
    const { c, stuTokens } = await setupClass(env)
    await c.call('POST', '/api/attempts/sync', { token: stuTokens.s1, body: { attempts: [mkAttempt('WB1-MC-07', true, 'firstIndependent', at(env))] } })
    await c.call('POST', '/api/attempts/sync', { token: stuTokens.s2, body: { attempts: [mkAttempt('WB1-MC-08', false, 'firstIndependent', at(env))] } })
    const mine = (await c.call('GET', '/api/attempts/mine', { token: stuTokens.s1 })).data.attempts
    expect(mine).toHaveLength(1)
    expect(mine[0].itemId).toBe('WB1-MC-07')
    expect((await c.call('GET', '/api/students/1/history', { token: stuTokens.s1 })).status).toBe(403)
  })
  it('停用的學生不能登入,既有 token 立即失效;重設密碼後舊密碼失效', async () => {
    const { c, teacherToken, ids, stuTokens } = await setupClass(env)
    await c.call('POST', `/api/students/${ids.s1}/disable`, { token: teacherToken, body: { disabled: true } })
    expect((await c.call('GET', '/api/me', { token: stuTokens.s1 })).status).toBe(401)
    expect((await c.call('POST', '/api/auth/login', { body: { username: 's1', password: 'pass-s1-1' } })).status).toBe(401)
    const rp = await c.call('POST', `/api/students/${ids.s2}/reset-password`, { token: teacherToken })
    expect(rp.data.password).toMatch(/^\d{6}$/)
    expect((await c.call('GET', '/api/me', { token: stuTokens.s2 })).status).toBe(401)
    expect((await c.call('POST', '/api/auth/login', { body: { username: 's2', password: 'pass-s2-1' } })).status).toBe(401)
    expect((await c.call('POST', '/api/auth/login', { body: { username: 's2', password: rp.data.password } })).status).toBe(200)
  })
})

describe('批次新增學生', () => {
  it('有效行建立帳號(可用初始密碼登入);重複與格式錯誤回報在 errors', async () => {
    const { c, teacherToken, cls } = await setupClass(env, 't1', ['exists'])
    const r = await c.call('POST', `/api/classes/${cls.id}/students`, { token: teacherToken, body: { lines: 'a1,王小明\na2\nexists,重複\n壞 帳號!,x\na3,李小華,mypass-77' } })
    expect(r.data.created.map((x: any) => x.username)).toEqual(['a1', 'a2', 'a3'])
    expect(r.data.errors).toHaveLength(2)
    expect(r.data.created[0].password).toMatch(/^\d{6}$/)
    expect(r.data.created[2].password).toBe('mypass-77')
    for (const u of r.data.created) expect((await c.call('POST', '/api/auth/login', { body: { username: u.username, password: u.password } })).status).toBe(200)
  })
})

describe('作答紀錄同步', () => {
  it('同步是冪等的:重複送出不會重複計算;後補的錯誤類型會更新', async () => {
    const { c, stuTokens } = await setupClass(env)
    const a = mkAttempt('WB1-MC-07', false, 'firstIndependent', at(env))
    expect((await c.call('POST', '/api/attempts/sync', { token: stuTokens.s1, body: { attempts: [a] } })).data.saved).toBe(1)
    await c.call('POST', '/api/attempts/sync', { token: stuTokens.s1, body: { attempts: [a, a] } })
    expect((await c.call('GET', '/api/attempts/mine', { token: stuTokens.s1 })).data.attempts).toHaveLength(1)
    await c.call('POST', '/api/attempts/sync', { token: stuTokens.s1, body: { attempts: [{ ...a, errorType: 'unit' }] } })
    const got = (await c.call('GET', '/api/attempts/mine', { token: stuTokens.s1 })).data.attempts
    expect(got).toHaveLength(1)
    expect(got[0].errorType).toBe('unit')
  })
  it('格式不合法的紀錄被拒絕,而且整批不會寫入(交易)', async () => {
    const { c, stuTokens } = await setupClass(env)
    const good = mkAttempt('WB1-MC-07', true, 'firstIndependent', at(env))
    const bads = [
      { ...good, source: 'hack' }, { ...good, kind: 'cheat' }, { ...good, correct: 'yes' }, { ...good, at: env.clock.t + 10 * 86_400_000 },
      { ...good, at: 5 }, { ...good, itemId: '' }, { ...good, at: 1.5 },
    ]
    for (const bad of bads) {
      expect((await c.call('POST', '/api/attempts/sync', { token: stuTokens.s1, body: { attempts: [good, bad] } })).status).toBe(400)
    }
    expect((await c.call('GET', '/api/attempts/mine', { token: stuTokens.s1 })).data.attempts).toHaveLength(0)
    expect((await c.call('POST', '/api/attempts/sync', { token: stuTokens.s1, body: { attempts: 'x' } })).status).toBe(400)
    const many = Array.from({ length: 2001 }, (_, i) => mkAttempt('WB1-MC-07', true, 'firstIndependent', at(env, i)))
    expect((await c.call('POST', '/api/attempts/sync', { token: stuTokens.s1, body: { attempts: many } })).status).toBe(413)
  })
})

describe('教師分析', () => {
  it('首次答對率、覆蓋率、需補救名單、題目統計、單元完成率、常見錯誤都與手算一致', async () => {
    const { c, teacherToken, cls, stuTokens, ids } = await setupClass(env)
    const unit12 = ['WB1-MC-07', 'WB1-MC-08', 'WB1-MC-10', 'WB1-MC-13', 'WB1-MC-14', 'WB1-MC-15']
    // s1:6 題都「第一次獨立」答對
    await c.call('POST', '/api/attempts/sync', { token: stuTokens.s1, body: { attempts: unit12.map((q, i) => mkAttempt(q, true, 'firstIndependent', at(env, i))) } })
    // s2:6 題第一次獨立都答錯(單位錯),之後用提示答對 2 題
    await c.call('POST', '/api/attempts/sync', { token: stuTokens.s2, body: { attempts: [
      ...unit12.map((q, i) => mkAttempt(q, false, 'firstIndependent', at(env, i), { errorType: 'unit' })),
      mkAttempt('WB1-MC-07', true, 'hinted', at(env, 100)), mkAttempt('WB1-MC-08', true, 'hinted', at(env, 101)),
    ] } })
    const a = (await c.call('GET', `/api/classes/${cls.id}/analytics`, { token: teacherToken })).data
    const s1 = a.students.find((x: any) => x.id === ids.s1)
    const s2 = a.students.find((x: any) => x.id === ids.s2)
    const s3 = a.students.find((x: any) => x.id === ids.s3)
    expect([s1.tried, s1.firstTotal, s1.firstCorrect, s1.firstRate, s1.independent, s1.stuck, s1.needsHelp]).toEqual([6, 6, 6, 1, 6, 0, false])
    // s2:首次 0/6;「用提示後答對」只算曾經答對,不算獨立;4 題一直沒答對
    expect([s2.tried, s2.firstTotal, s2.firstCorrect, s2.firstRate, s2.independent, s2.stuck]).toEqual([6, 6, 0, 0, 0, 4])
    expect(s2.needsHelp).toBe(true)
    expect(s2.helpReasons.join()).toContain('首次獨立答對率 0%')
    expect(s2.helpReasons.join()).toContain('有 4 題還沒答對過')
    expect([s3.tried, s3.firstTotal, s3.firstRate, s3.lastActive, s3.needsHelp]).toEqual([0, 0, null, null, false])
    expect(a.needHelp.map((x: any) => x.id)).toEqual([ids.s2])
    const q07 = a.questions.find((x: any) => x.id === 'WB1-MC-07')
    expect([q07.firstTotal, q07.firstCorrect, q07.firstRate, q07.students, q07.topError]).toEqual([2, 1, 0.5, 2, 'unit'])
    expect(a.commonErrors[0]).toEqual(['unit', 6])
    const u12 = a.units.find((x: any) => x.unit === '1-2')
    expect(u12.questions).toBe(22)
    expect(u12.avgIndependentRatio).toBeCloseTo((6 / 22 + 0 + 0) / 3, 9)
    expect(u12.studentsDone).toBe(0)
    expect(a.hardest).toEqual([]) // 每題首次作答人次不足 3 筆,不列入「最難的題目」
  })
  it('「最難的題目」:首次作答 ≥ 3 筆才列入,依首次答對率由低到高', async () => {
    const { c, teacherToken, cls, stuTokens } = await setupClass(env)
    const sync = (u: string, list: unknown[]) => c.call('POST', '/api/attempts/sync', { token: stuTokens[u], body: { attempts: list } })
    await sync('s1', [mkAttempt('WB1-MC-07', true, 'firstIndependent', at(env, 1)), mkAttempt('WB1-MC-08', false, 'firstIndependent', at(env, 2))])
    await sync('s2', [mkAttempt('WB1-MC-07', true, 'firstIndependent', at(env, 3)), mkAttempt('WB1-MC-08', false, 'firstIndependent', at(env, 4))])
    await sync('s3', [mkAttempt('WB1-MC-07', false, 'firstIndependent', at(env, 5)), mkAttempt('WB1-MC-08', false, 'firstIndependent', at(env, 6))])
    const a = (await c.call('GET', `/api/classes/${cls.id}/analytics`, { token: teacherToken })).data
    expect(a.hardest.map((x: any) => [x.id, x.firstRate])).toEqual([['WB1-MC-08', 0], ['WB1-MC-07', 2 / 3]])
  })
  it('學生個別歷程:逐題首次是否答對、最近作答', async () => {
    const { c, teacherToken, stuTokens, ids } = await setupClass(env)
    await c.call('POST', '/api/attempts/sync', { token: stuTokens.s1, body: { attempts: [mkAttempt('WB1-MC-07', false, 'firstIndependent', at(env, 1)), mkAttempt('WB1-MC-07', true, 'hinted', at(env, 2))] } })
    const h = (await c.call('GET', `/api/students/${ids.s1}/history`, { token: teacherToken })).data
    expect(h.perQuestion).toHaveLength(1)
    expect(h.perQuestion[0]).toMatchObject({ id: 'WB1-MC-07', tries: 2, firstCorrect: false, everCorrect: true })
    expect(h.recent[0].at).toBeGreaterThan(h.recent[1].at)
    expect(h.summary.independent).toBe(0)
  })
})

describe('指定練習', () => {
  it('老師指定 → 學生看到並顯示進度;不存在的題目被拒;別的老師不能刪', async () => {
    const { c, teacherToken, cls, stuTokens } = await setupClass(env)
    expect((await c.call('POST', `/api/classes/${cls.id}/assignments`, { token: teacherToken, body: { title: '壞', questionIds: ['NOPE-01'] } })).status).toBe(400)
    expect((await c.call('POST', `/api/classes/${cls.id}/assignments`, { token: teacherToken, body: { title: '空', questionIds: [] } })).status).toBe(400)
    const mk = await c.call('POST', `/api/classes/${cls.id}/assignments`, { token: teacherToken, body: { title: '波形基礎', questionIds: ['WB1-MC-07', 'WB1-MC-08', 'WB1-MC-07'], due: env.clock.t + 86_400_000 } })
    expect(mk.status).toBe(200)
    await c.call('POST', '/api/attempts/sync', { token: stuTokens.s1, body: { attempts: [mkAttempt('WB1-MC-07', true, 'firstIndependent', at(env, 1)), mkAttempt('WB1-MC-08', true, 'hinted', at(env, 2))] } })
    const mine = (await c.call('GET', '/api/assignments/mine', { token: stuTokens.s1 })).data.assignments
    expect(mine).toHaveLength(1)
    expect(mine[0].questionIds).toEqual(['WB1-MC-07', 'WB1-MC-08']) // 去除重複
    expect(mine[0].progress).toEqual({ studentId: expect.any(Number), done: 2, independent: 1, total: 2 })
    const t = (await c.call('GET', `/api/classes/${cls.id}/assignments`, { token: teacherToken })).data
    expect(t.assignments[0].progress).toHaveLength(3)
    addTeacher(env.db, 'other')
    const tb = await c.login('other', 'teacher-pass-1')
    expect((await c.call('DELETE', `/api/assignments/${mk.data.id}`, { token: tb })).status).toBe(404)
    expect((await c.call('DELETE', `/api/assignments/${mk.data.id}`, { token: teacherToken })).status).toBe(200)
    expect((await c.call('GET', '/api/assignments/mine', { token: stuTokens.s1 })).data.assignments).toHaveLength(0)
  })
})

describe('題目審核、編輯與版本紀錄', () => {
  it('編輯解析:保留原始內容為版本 0,每次修改新增版本,不覆蓋已驗證內容', async () => {
    const { c, teacherToken } = await setupClass(env)
    const list = (await c.call('GET', '/api/teacher/questions', { token: teacherToken })).data.questions
    const orig = list.find((q: any) => q.id === 'WB1-MC-07')
    expect(orig.version).toBe(0)
    const v1 = await c.call('PUT', '/api/teacher/questions/WB1-MC-07', { token: teacherToken, body: { solution: '第一次修改', status: 'teacherChecked', note: '改寫' } })
    expect(v1.data.version).toBe(1)
    const v2 = await c.call('PUT', '/api/teacher/questions/WB1-MC-07', { token: teacherToken, body: { solution: '第二次修改' } })
    expect(v2.data.version).toBe(2)
    const vs = (await c.call('GET', '/api/teacher/questions/WB1-MC-07/versions', { token: teacherToken })).data.versions
    expect(vs.map((v: any) => v.version)).toEqual([2, 1, 0])
    expect(vs[2].solution).toBe(orig.solution) // 版本 0 = 原始內容
    expect(vs[2].status).toBe('calcVerified')
    expect(vs[1]).toMatchObject({ solution: '第一次修改', status: 'teacherChecked', note: '改寫' })
    expect(vs[0].status).toBe('teacherChecked') // 未指定 status 時沿用
    const now = (await c.call('GET', '/api/teacher/questions', { token: teacherToken })).data.questions.find((q: any) => q.id === 'WB1-MC-07')
    expect([now.solution, now.status, now.version]).toEqual(['第二次修改', 'teacherChecked', 2])
    const ov = (await c.call('GET', '/api/questions/overrides')).data
    expect(ov.edits['WB1-MC-07']).toMatchObject({ solution: '第二次修改', status: 'teacherChecked', version: 2 })
  })
  it('還原舊版本會新增一個版本,歷史完整保留', async () => {
    const { c, teacherToken } = await setupClass(env)
    await c.call('PUT', '/api/teacher/questions/WB1-MC-08', { token: teacherToken, body: { solution: 'A 版' } })
    await c.call('PUT', '/api/teacher/questions/WB1-MC-08', { token: teacherToken, body: { solution: 'B 版' } })
    const r = await c.call('POST', '/api/teacher/questions/WB1-MC-08/restore', { token: teacherToken, body: { version: 1 } })
    expect(r.data.version).toBe(3)
    const vs = (await c.call('GET', '/api/teacher/questions/WB1-MC-08/versions', { token: teacherToken })).data.versions
    expect(vs.map((v: any) => v.version)).toEqual([3, 2, 1, 0])
    expect(vs[0].solution).toBe('A 版')
    expect(vs[0].note).toContain('還原自版本 1')
    expect((await c.call('POST', '/api/teacher/questions/WB1-MC-08/restore', { token: teacherToken, body: { version: 99 } })).status).toBe(404)
  })
  it('狀態與題號驗證', async () => {
    const { c, teacherToken } = await setupClass(env)
    expect((await c.call('PUT', '/api/teacher/questions/WB1-MC-07', { token: teacherToken, body: { status: 'hacked' } })).status).toBe(400)
    expect((await c.call('PUT', '/api/teacher/questions/NOPE-1', { token: teacherToken, body: { solution: 'x' } })).status).toBe(404)
    for (const s of ['pending', 'calcVerified', 'teacherChecked', 'needsFix', 'published']) expect((await c.call('PUT', '/api/teacher/questions/WB1-MC-09', { token: teacherToken, body: { status: s } })).status).toBe(200)
  })
  it('新增題目(選擇題與數值題):驗證輸入、進入題庫、可被指定、可編輯並有版本', async () => {
    const { c, teacherToken, cls } = await setupClass(env)
    const bad = (b: object) => c.call('POST', '/api/teacher/questions', { token: teacherToken, body: b })
    const base = { unit: '1-2', type: 'mc', kps: ['KP-12-03'], stem: '正弦波峰值 20 V,有效值約?', options: ['10 V', '14.1 V', '28.3 V'], answer: 1, solution: '20/1.414 ≈ 14.1' }
    expect((await bad({ ...base, unit: '3-1' })).status).toBe(400)
    expect((await bad({ ...base, answer: 5 })).status).toBe(400)
    expect((await bad({ ...base, options: ['只有一個'] })).status).toBe(400)
    expect((await bad({ ...base, kps: ['KP-XX-99'] })).status).toBe(400)
    expect((await bad({ ...base, type: 'essay' })).status).toBe(400)
    expect((await bad({ ...base, type: 'numeric', parts: [{ label: 'x', value: 'abc' }] })).status).toBe(400)
    const ok = await bad(base)
    expect(ok.data.id).toBe('CUS-001')
    const num = await bad({ unit: '2-3', type: 'numeric', kps: ['KP-23-03'], stem: '半波整流 Vm=10 V,Vdc?', parts: [{ label: 'Vdc', value: 3.18, unit: 'V' }], solution: 'Vm/π' })
    expect(num.data.id).toBe('CUS-002')
    const ov = (await c.call('GET', '/api/questions/overrides')).data
    expect(ov.custom).toHaveLength(2)
    expect(ov.custom[0]).toMatchObject({ id: 'CUS-001', type: 'mc', answer: 1, options: [{ text: '10 V' }, { text: '14.1 V' }, { text: '28.3 V' }], review: 'pending' })
    expect(ov.custom[1].parts[0]).toMatchObject({ label: 'Vdc', value: 3.18, unit: 'V', relTol: 0.01 })
    expect((await c.call('POST', `/api/classes/${cls.id}/assignments`, { token: teacherToken, body: { title: '自訂題', questionIds: ['CUS-001', 'WB1-MC-07'] } })).status).toBe(200)
    const e = await c.call('PUT', '/api/teacher/questions/CUS-001', { token: teacherToken, body: { solution: '改過的解析', status: 'published' } })
    expect(e.data.version).toBe(2)
    const vs = (await c.call('GET', '/api/teacher/questions/CUS-001/versions', { token: teacherToken })).data.versions
    expect(vs.map((v: any) => v.version)).toEqual([2, 1])
    const list = (await c.call('GET', '/api/teacher/questions', { token: teacherToken })).data.questions
    expect(list.filter((q: any) => q.custom)).toHaveLength(2)
    expect(list.find((q: any) => q.id === 'CUS-001')).toMatchObject({ solution: '改過的解析', status: 'published', unit: '1-2' })
  })
})

describe('匯出 Excel', () => {
  it('可以匯出,工作表與數字與分析一致', async () => {
    const { c, teacherToken, cls, stuTokens } = await setupClass(env)
    await c.call('POST', '/api/attempts/sync', { token: stuTokens.s1, body: { attempts: [mkAttempt('WB1-MC-07', true, 'firstIndependent', at(env, 1)), mkAttempt('WB1-MC-08', false, 'firstIndependent', at(env, 2), { errorType: 'unit' })] } })
    await c.call('POST', `/api/classes/${cls.id}/assignments`, { token: teacherToken, body: { title: '練習一', questionIds: ['WB1-MC-07'] } })
    const { status, res } = await c.call('GET', `/api/classes/${cls.id}/export.xlsx`, { token: teacherToken, raw: true }) as any
    expect(status).toBe(200)
    expect(res.headers.get('content-type')).toContain('spreadsheetml')
    expect(res.headers.get('content-disposition')).toContain('.xlsx')
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(Buffer.from(await res.arrayBuffer()) as any)
    expect(wb.worksheets.map((w) => w.name)).toEqual(['學生總表', '單元完成率', '題目分析', '指定練習', '作答紀錄', '說明'])
    const s1 = wb.getWorksheet('學生總表')!
    expect(s1.rowCount).toBe(4) // 標題 + 3 位學生
    const row = (s1.getRows(2, 3) ?? []).find((r) => r.getCell(2).value === 's1')!
    expect(row.getCell(1).value).toBe('s1姓名')
    expect(row.getCell(3).value).toBe(2) // 已練習 2 題
    expect(row.getCell(5).value).toBe(2) // 首次作答 2 次
    expect(row.getCell(6).value).toBe(0.5) // 首次答對率 50%
    expect(row.getCell(7).value).toBe(1) // 能獨立答對 1 題
    const rec = wb.getWorksheet('作答紀錄')!
    expect(rec.rowCount).toBe(3)
    expect(rec.getRow(3).getCell(8).value).toBe('單位換算')
    expect(wb.getWorksheet('題目分析')!.rowCount).toBe(50) // 標題 + 49 題
    expect(wb.getWorksheet('指定練習')!.rowCount).toBe(4)
  })
})

describe('基本防護', () => {
  it('錯誤路徑 404、不支援的方法 405、壞 JSON 400、過大內容 413', async () => {
    const { c } = await setupClass(env)
    expect((await c.call('GET', '/api/nothing')).status).toBe(404)
    expect((await c.call('DELETE', '/api/auth/login')).status).toBe(405)
    const bad = await fetch(env.base + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{not json' })
    expect(bad.status).toBe(400)
    const big = await fetch(env.base + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'a'.repeat(3 * 1024 * 1024), password: 'x' }) })
    expect(big.status).toBe(413)
  })
  it('回應帶有安全標頭;API 不被快取', async () => {
    const r = await fetch(env.base + '/api/health')
    expect(r.headers.get('x-content-type-options')).toBe('nosniff')
    expect(r.headers.get('x-frame-options')).toBe('DENY')
    expect(r.headers.get('cache-control')).toBe('no-store')
  })
  it('SQL 注入字串只會被當成一般文字', async () => {
    const { c, teacherToken, cls } = await setupClass(env)
    const r = await c.call('POST', '/api/classes', { token: teacherToken, body: { name: "x'); DROP TABLE users;--" } })
    expect(r.status).toBe(200)
    expect((await c.call('GET', '/api/classes', { token: teacherToken })).data.classes).toHaveLength(2)
    expect((await c.call('GET', `/api/classes/${cls.id}/students`, { token: teacherToken })).status).toBe(200)
  })
})
