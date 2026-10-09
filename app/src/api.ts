/** 與伺服器溝通。未連線時(純前端模式)所有功能仍可使用,只是紀錄不會同步。 */
const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
const TOKEN_KEY = 'electronics-token-v1'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) } catch { return null } }
export const setToken = (t: string | null) => { try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY) } catch { /* ignore */ } }

export async function api<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken()
  let res: Response
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'content-type': 'application/json' } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, '連不到伺服器')
  }
  const text = await res.text()
  let data: unknown
  try { data = text ? JSON.parse(text) : undefined } catch { data = undefined }
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string } | undefined)?.error ?? `錯誤 ${res.status}`)
  return data as T
}

/** 下載檔案(帶登入資訊) */
export async function download(path: string, filename: string) {
  const token = getToken()
  const res = await fetch(BASE + path, { headers: token ? { authorization: `Bearer ${token}` } : {} })
  if (!res.ok) throw new ApiError(res.status, '下載失敗')
  const url = URL.createObjectURL(await res.blob())
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
