import type { Check } from './checks12'
import { fullWave, halfWave, pivHalfWave } from '../core/physics'
import { simulateFilter } from '../core/filter'
import { solveRectifier } from '../core/rectifier'

const f2 = (x: number) => String(Math.round(x * 100) / 100)

/** 2-3 教學區塊的小檢核。可計算者以 verify 由核心或求解器重算。 */
export const checks23: Check[] = [
  {
    id: 'LC-23-1', kps: ['KP-23-01'],
    q: '半波整流電路,次級電壓峰值 20 V,二極體承受的峰值逆向電壓 PIV 是多少?',
    options: ['10 V', '20 V', '40 V', '0 V'], answer: 1,
    explain: '負半週二極體截止,整個次級電壓都加在它兩端,所以 PIV = Vm = 20 V。',
    verify: () => `${pivHalfWave(20)} V`,
  },
  {
    id: 'LC-23-2', kps: ['KP-23-03'],
    q: '60 Hz 的交流經橋式整流後,輸出電壓波形的頻率是多少?',
    options: ['30 Hz', '60 Hz', '120 Hz', '180 Hz'], answer: 2,
    explain: '全波整流把負半週翻到正半週,每個輸入週期有兩個脈動,輸出頻率是輸入的 2 倍,120 Hz。',
    verify: () => `${60 * fullWave(1).freqMultiplier} Hz`,
  },
  {
    id: 'LC-23-3', kps: ['KP-23-02'],
    q: '橋式整流電路中,同一時刻有幾顆二極體導通?',
    options: ['1 顆', '2 顆', '3 顆', '4 顆'], answer: 1,
    explain: '電流從一顆二極體流入負載,再從對角的另一顆流回電源,所以同時導通 2 顆(正半週 D1、D3,負半週 D2、D4)。',
    verify: () => { const a = solveRectifier('bridge', 10); const b = solveRectifier('bridge', -10); return `${Object.values(a.on).filter(Boolean).length},${Object.values(b.on).filter(Boolean).length}` },
  },
  {
    id: 'LC-23-4', kps: ['KP-23-03'],
    q: '半波整流,次級峰值 10 V,輸出直流平均值 Vdc 約是多少?',
    options: ['3.18 V', '5 V', '6.37 V', '7.07 V'], answer: 0,
    explain: '半波 Vdc = Vm/π = 10/3.14 ≈ 3.18 V。6.37 V 是全波的 2Vm/π;5 V 是 Vm/2,不是平均值。',
    verify: () => `${f2(halfWave(10).vo_dc)} V`,
  },
  {
    id: 'LC-23-5', kps: ['KP-23-04'],
    q: '沒有濾波的全波整流輸出,漣波因數約是多少?',
    options: ['121%', '48%', '21%', '0%'], answer: 1,
    explain: '全波未濾波 r ≈ 48%;半波是 121%。漣波因數愈小,輸出愈接近純直流。',
    verify: () => `${Math.round(fullWave(10).rippleFactor * 100)}%`,
  },
  {
    id: 'LC-23-6', kps: ['KP-23-05'],
    q: '濾波電容換成容量更大的,輸出的漣波電壓會怎麼變?',
    options: ['變大', '變小', '不變'], answer: 1,
    explain: '電容愈大,放電愈慢、電壓掉得愈少,漣波愈小,直流平均值也愈接近峰值。',
    verify: () => {
      const a = simulateFilter({ vm: 10, f: 60, r: 100, c: 470e-6, full: true }).vrPP
      const b = simulateFilter({ vm: 10, f: 60, r: 100, c: 2200e-6, full: true }).vrPP
      return b < a ? '變小' : '不是變小'
    },
  },
]
