import type { Check } from './checks12'
import { dynamicResistance, forwardDropAtTemp } from '../core/physics'
import { depletionRel, diodeV, isFromPoint, solveSeries } from '../core/semiconductor'

const NVT = 0.025
const IS_SI = isFromPoint(0.65, NVT)

/** 2-2 小檢核。可計算者以 verify 由核心重算。 */
export const checks22: Check[] = [
  {
    id: 'LC-22-1', kps: ['KP-22-01'],
    q: 'PN 二極體的障壁電壓是在什麼時候「自然」產生的?',
    options: ['外加順向偏壓時', 'P 型與 N 型半導體接合時', '外加逆向偏壓時'], answer: 1,
    explain: 'P、N 接合的瞬間,載子互相擴散,在接面形成空乏區與內建電場,這就是障壁電壓,與有沒有外加電壓無關。',
    verify: () => 'P 型與 N 型半導體接合時',
  },
  {
    id: 'LC-22-2', kps: ['KP-22-02'],
    q: '二極體加順向偏壓,空乏區會?',
    options: ['變窄', '變寬', '不變'], answer: 0,
    explain: '順向偏壓削弱內建電場,空乏區變窄,載子容易通過,電流隨偏壓指數上升。',
    verify: () => (depletionRel(0.5, 0.7) < 1 ? '變窄' : '變寬'),
  },
  {
    id: 'LC-22-3', kps: ['KP-22-03'],
    q: '二極體在工作點的電流 IDQ = 2 mA,取 VT = 25 mV,動態電阻 rd 是多少?',
    options: ['25 Ω', '12.5 Ω', '50 Ω'], answer: 1,
    explain: 'rd = VT / IDQ = 25 mV / 2 mA = 12.5 Ω。電流變為兩倍,動態電阻變為一半。',
    verify: () => `${dynamicResistance(2e-3)} Ω`,
  },
  {
    id: 'LC-22-4', kps: ['KP-22-03'],
    q: '二極體在 ID = 1 mA 時 VD = 0.65 V。它的「靜態(直流)電阻」是多少?',
    options: ['25 Ω', '650 Ω', '0.65 Ω'], answer: 1,
    explain: '靜態電阻 = VD / ID = 0.65 V / 1 mA = 650 Ω。它和動態電阻(25 Ω)是兩個不同的量。',
    verify: () => `${Math.round(diodeV(1e-3, IS_SI, NVT) / 1e-3)} Ω`,
  },
  {
    id: 'LC-22-5', kps: ['KP-22-04'],
    q: '矽二極體 25℃ 時順向壓降 0.65 V,升到 65℃(−2.5 mV/℃),壓降約為?',
    options: ['0.75 V', '0.55 V', '0.65 V'], answer: 1,
    explain: 'ΔT = 40℃,ΔV = −2.5 mV × 40 = −100 mV,所以 0.65 − 0.1 = 0.55 V。溫度升高,順向壓降下降。',
    verify: () => `${Math.round(forwardDropAtTemp(0.65, 25, 65) * 100) / 100} V`,
  },
  {
    id: 'LC-22-6', kps: ['KP-22-05'],
    q: '電源 5 V、電阻 1 kΩ 與二極體串聯。用「理想+0.7 V 切入電壓」模型,電流約是?',
    options: ['5 mA', '4.3 mA', '0.7 mA'], answer: 1,
    explain: '二極體導通,壓降 0.7 V,電阻上剩 5 − 0.7 = 4.3 V,I = 4.3 V ÷ 1 kΩ = 4.3 mA。',
    verify: () => `${Math.round(solveSeries('constant', 5, 1000, { vGamma: 0.7, rd: 25, is: IS_SI, nvt: NVT }).i * 1e4) / 10} mA`,
  },
]
