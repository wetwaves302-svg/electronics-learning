import type { UnitId } from './data/types'

export interface UnitInfo { id: UnitId; title: string; blurb: string }

/** 第一次段考範圍(習作編號) */
export const units: UnitInfo[] = [
  { id: '1-1', title: '電子元件發展', blurb: '從真空管到積體電路,認識 IC 的分類與 4C。' },
  { id: '1-2', title: '基本波形', blurb: '週期、頻率、有效值、工作週期、波形因數與相位。' },
  { id: '2-1', title: '半導體物理', blurb: '價電子、電洞、N 型與 P 型半導體、載子濃度。' },
  { id: '2-2', title: 'PN 接面二極體', blurb: '障壁電壓、偏壓、動態電阻與理想二極體電路。' },
  { id: '2-3', title: '整流與濾波電路', blurb: '半波、全波、橋式整流,PIV、漣波與濾波。' },
]
