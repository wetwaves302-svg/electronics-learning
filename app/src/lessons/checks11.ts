import type { Check } from './checks12'
import { FOUR_C, IC_LEVELS, MFG_STEPS, PERIODS } from './data11'

const nobelCount = (name: string) => (PERIODS.flatMap((p) => p.people).find((x) => x.name === name)?.nobel?.match(/\d{4}/g) ?? []).length

/** 1-1 小檢核。可驗證者以 verify 由教學資料重算。 */
export const checks11: Check[] = [
  {
    id: 'LC-11-1', kps: ['KP-11-01'],
    q: '下列哪一個時期最早?',
    options: ['真空管時期', '電晶體時期', '積體電路時期'], answer: 0,
    explain: '依序是真空管時期、電晶體時期、積體電路時期。',
    verify: () => PERIODS.filter((p) => p.id !== 'before')[0].title.startsWith('真空管') ? '真空管時期' : '?',
  },
  {
    id: 'LC-11-2', kps: ['KP-11-01'],
    q: '講義中,哪一位做出第一個鍺積體電路?',
    options: ['佛來明', '基爾比', '卜拉登'], answer: 1,
    explain: '基爾比(圖 1-17)做出第一個鍺積體電路(圖 1-18),2000 年獲諾貝爾物理獎。',
    verify: () => PERIODS.flatMap((p) => p.people.filter((x) => x.note.includes('第一個鍺積體電路'))).map((x) => x.name).join(),
  },
  {
    id: 'LC-11-3', kps: ['KP-11-01'],
    q: '講義中,巴定獲得過幾次諾貝爾物理獎?',
    options: ['1 次', '2 次', '3 次'], answer: 1,
    explain: '巴定在 1956 年與 1972 年兩度獲得諾貝爾物理獎。',
    verify: () => `${nobelCount('巴定')} 次`,
  },
  {
    id: 'LC-11-4', kps: ['KP-11-02'],
    q: 'ULSI 與 SSI 相比,哪一個所含的邏輯閘較多?',
    options: ['SSI', 'ULSI', '一樣多'], answer: 1,
    explain: 'ULSI 是極大型,SSI 是小型。由少到多:單電晶體、SSI、MSI、LSI、VLSI、ULSI。',
    verify: () => (IC_LEVELS.findIndex((l) => l.name === 'ULSI') > IC_LEVELS.findIndex((l) => l.name === 'SSI') ? 'ULSI' : 'SSI'),
  },
  {
    id: 'LC-11-5', kps: ['KP-11-03'],
    q: 'IC 製造流程中,「打線」發生在「晶粒切割」之前還是之後?',
    options: ['之前', '之後', '同時'], answer: 1,
    explain: '先把晶圓切成晶粒(h),貼附到底座(i),再打線(j)。',
    verify: () => (MFG_STEPS.findIndex((s) => s.name === '打線') > MFG_STEPS.findIndex((s) => s.name === '晶粒切割') ? '之後' : '之前'),
  },
  {
    id: 'LC-11-6', kps: ['KP-11-04'],
    q: '電子應用產品的 4C 中,「Car」指的是?',
    options: ['電腦', '通訊', '車用(汽車)電子'], answer: 2,
    explain: '4C = 電腦(Computer)、通訊(Communication)、消費性電子(Consumer)、車用電子(Car)。',
    verify: () => FOUR_C.application.items.find(([en]) => en === 'Car')![1],
  },
]
