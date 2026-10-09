import { createHash, randomBytes, randomInt, scryptSync, timingSafeEqual } from 'node:crypto'

const KEYLEN = 64

export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = randomBytes(16).toString('hex')
  return { salt, hash: scryptSync(password, salt, KEYLEN).toString('hex') }
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  const a = scryptSync(password, salt, KEYLEN)
  const b = Buffer.from(hash, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}

export const newToken = () => randomBytes(32).toString('base64url')
export const tokenHash = (t: string) => createHash('sha256').update(t).digest('hex')

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const newClassCode = () => Array.from({ length: 6 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('')
export const newInitialPassword = () => String(randomInt(100000, 1000000))

/** 簡易速率限制:同一個 key 在視窗內超過次數就拒絕 */
export class RateLimiter {
  private hits = new Map<string, { n: number; reset: number }>()
  constructor(private max: number, private windowMs: number, private now: () => number = Date.now) {}
  check(key: string): boolean {
    const t = this.now()
    const h = this.hits.get(key)
    if (!h || h.reset <= t) { this.hits.set(key, { n: 1, reset: t + this.windowMs }); return true }
    h.n++
    return h.n <= this.max
  }
  clear(key: string) { this.hits.delete(key) }
}

export const USERNAME_RE = /^[A-Za-z0-9_.\-一-鿿]{2,32}$/
