import type { Check } from './checks12'
import { EV_TO_JOULE, dopantConcentration } from '../core/physics'
import { MATERIALS, dopedCarriers, niAt } from '../core/semiconductor'

const si = MATERIALS[0]

/** 2-1 小檢核。可計算者以 verify 由核心重算。 */
export const checks21: Check[] = [
  {
    id: 'LC-21-1', kps: ['KP-21-01'],
    q: '矽原子的最外層(價電子層)有幾個價電子?',
    options: ['2 個', '4 個', '8 個'], answer: 1,
    explain: '矽是 4 價元素,最外層有 4 個價電子,與鄰近的 4 個矽原子形成共價鍵。',
    verify: () => '4 個',
  },
  {
    id: 'LC-21-2', kps: ['KP-21-01'],
    q: '矽的能隙約 1.12 eV。一個能量 0.8 eV 的光子被價電子吸收,能讓它成為自由電子嗎?',
    options: ['能,任何能量都可以', '不能,能量小於能隙', '能,但只能產生電洞'], answer: 1,
    explain: '價電子必須吸收「大於(或等於)能隙」的能量才能脫離共價鍵。0.8 eV < 1.12 eV,不夠。',
    verify: () => (0.8 >= si.egEv ? '能' : '不能'),
  },
  {
    id: 'LC-21-3', kps: ['KP-21-02'],
    q: '溫度升高時,純矽的本質載子濃度 ni 會?',
    options: ['變大', '變小', '不變'], answer: 0,
    explain: '溫度愈高,熱能愈大,愈多價電子獲得足夠能量成為自由電子(同時留下電洞),所以 ni 變大。',
    verify: () => (niAt(si, 350) > niAt(si, 300) ? '變大' : '變小'),
  },
  {
    id: 'LC-21-4', kps: ['KP-21-03'],
    q: '在純矽中摻入磷(5 價元素),得到哪一型半導體?',
    options: ['P 型', 'N 型', '仍是本質半導體'], answer: 1,
    explain: '磷有 5 個價電子,與矽共價後多出 1 個自由電子,所以是 N 型,磷稱為施體。',
    verify: () => 'N 型',
  },
  {
    id: 'LC-21-5', kps: ['KP-21-04'],
    q: '在 N 型半導體中,電洞是?',
    options: ['多數載子', '少數載子', '施體'], answer: 1,
    explain: 'N 型的多數載子是電子;電洞是少數載子(由熱擾動產生)。',
    verify: () => { const c = dopedCarriers(1.5e10, 1e15, true); return c.p < c.n ? '少數載子' : '多數載子' },
  },
  {
    id: 'LC-21-6', kps: ['KP-21-04'],
    q: '每 10⁹ 個矽原子摻入 1 個施體(矽原子密度 5×10²² /cm³),電子濃度約是多少?',
    options: ['5×10⁹ /cm³', '5×10¹³ /cm³', '5×10²² /cm³'], answer: 1,
    explain: 'Nd = 5×10²² ÷ 10⁹ = 5×10¹³ /cm³,而且 Nd 遠大於 ni,所以電子濃度 ≈ Nd。',
    verify: () => `${Math.floor(Math.log10(dopantConcentration(5e22, 1e9)))} 次方`,
  },
  {
    id: 'LC-21-7', kps: ['KP-21-05'],
    q: '1 電子伏特(1 eV)等於多少焦耳?',
    options: ['1.6×10⁻¹⁹ J', '1 J', '1.6×10¹⁹ J'], answer: 0,
    explain: '1 eV = 1.6×10⁻¹⁹ C × 1 V = 1.6×10⁻¹⁹ J,是很小的能量單位,適合描述電子的能量。',
    verify: () => `${EV_TO_JOULE}`,
  },
]
