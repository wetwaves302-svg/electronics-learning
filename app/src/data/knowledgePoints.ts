import type { KnowledgePoint } from './types'

/** 知識點編號:題庫與遊戲共用 */
export const knowledgePoints: KnowledgePoint[] = [
  { id: 'KP-11-01', unit: '1-1', title: '電子學發展三時期', summary: '真空管、電晶體、積體電路時期與代表人物。', prereq: [] },
  { id: 'KP-11-02', unit: '1-1', title: 'IC 依閘數分類', summary: '單電晶體、SSI、MSI、LSI、VLSI、ULSI 由少到多。', prereq: ['KP-11-01'] },
  { id: 'KP-11-03', unit: '1-1', title: 'IC 製造流程', summary: '晶圓製造、晶粒切割、封裝、打線、測試。', prereq: ['KP-11-01'] },
  { id: 'KP-11-04', unit: '1-1', title: '4C 與應用方向', summary: '電腦、通訊、消費性電子、汽車電子。', prereq: [] },

  { id: 'KP-12-01', unit: '1-2', title: '直流、脈動直流與交流', summary: '依極性是否改變、大小是否改變分辨波形。', prereq: [] },
  { id: 'KP-12-02', unit: '1-2', title: '週期與頻率', summary: 'f = 1/T,單位換算 μs、ms、kHz。', prereq: [] },
  { id: 'KP-12-03', unit: '1-2', title: '弦波峰值與有效值', summary: 'Vrms = Vm/√2,Vm = √2·Vrms。', prereq: ['KP-12-01'] },
  { id: 'KP-12-04', unit: '1-2', title: '弦波瞬時式', summary: 'v(t) = Vm sin(2πft + φ),由式或波形圖讀出 Vm、f、T、φ。', prereq: ['KP-12-02', 'KP-12-03'] },
  { id: 'KP-12-05', unit: '1-2', title: '工作週期與脈波平均值', summary: 'D = tH/(tH+tL);Vav = VH·D + VL·(1−D)。', prereq: ['KP-12-02'] },
  { id: 'KP-12-06', unit: '1-2', title: '波形因數與波峰因數', summary: 'FF = Vrms/Vav,CF = Vm/Vrms;各波形的值。', prereq: ['KP-12-03'] },
  { id: 'KP-12-07', unit: '1-2', title: '相位差與 sin/cos 轉換', summary: 'cos x = sin(x+90°),同頻波才有相位差。', prereq: ['KP-12-04'] },
  { id: 'KP-12-08', unit: '1-2', title: '交直流混合波有效值', summary: 'Vrms² = Vdc² + Σ(Vm/√2)²;同頻波須先合成。', prereq: ['KP-12-03', 'KP-12-07'] },
  { id: 'KP-12-09', unit: '1-2', title: '諧波與波形合成', summary: '任意週期波可由不同頻率的正弦波組合而成。', prereq: ['KP-12-04'] },

  { id: 'KP-21-01', unit: '2-1', title: '價電子、自由電子與電洞', summary: '價電子吸收大於能隙的能量成為自由電子,留下電洞。', prereq: [] },
  { id: 'KP-21-02', unit: '2-1', title: '導體、半導體與絕緣體', summary: '以能隙大小與可用載子數量分辨。', prereq: ['KP-21-01'] },
  { id: 'KP-21-03', unit: '2-1', title: '本質與外質半導體', summary: '5 價摻雜成 N 型(施體),3 價摻雜成 P 型(受體)。', prereq: ['KP-21-01', 'KP-21-02'] },
  { id: 'KP-21-04', unit: '2-1', title: '多數與少數載子', summary: 'N 型多數為電子,P 型多數為電洞;n·p = ni²。', prereq: ['KP-21-03'] },
  { id: 'KP-21-05', unit: '2-1', title: '電子伏特', summary: '1 eV = 1.6×10⁻¹⁹ J,為能量單位。', prereq: [] },

  { id: 'KP-22-01', unit: '2-2', title: 'PN 接面與障壁電壓', summary: 'P、N 結合時自然形成空乏區與障壁電壓。', prereq: ['KP-21-03', 'KP-21-04'] },
  { id: 'KP-22-02', unit: '2-2', title: '偏壓與 I-V 特性', summary: '順向偏壓空乏區變窄,逆向偏壓變寬;矽與鍺的差異。', prereq: ['KP-22-01'] },
  { id: 'KP-22-03', unit: '2-2', title: '二極體動態電阻', summary: 'rd = VT/IDQ,VT 約 25～26 mV(本教材習作取 25 mV)。', prereq: ['KP-22-02'] },
  { id: 'KP-22-04', unit: '2-2', title: '溫度對二極體的影響', summary: '溫度上升,順向壓降下降約 1～2.5 mV/℃,漏電流上升。', prereq: ['KP-22-02'] },
  { id: 'KP-22-05', unit: '2-2', title: '理想二極體電路判斷', summary: '先判斷導通或截止,再用串並聯與分壓求解。', prereq: ['KP-22-02'] },

  { id: 'KP-23-01', unit: '2-3', title: '半波整流與 PIV', summary: '半波整流的峰值逆向電壓 PIV = Vm。', prereq: ['KP-22-05', 'KP-12-03'] },
  { id: 'KP-23-02', unit: '2-3', title: '全波與橋式整流路徑', summary: '依輸入極性判斷哪些二極體導通。', prereq: ['KP-22-05'] },
  { id: 'KP-23-03', unit: '2-3', title: '整流輸出頻率與平均、有效值', summary: '全波輸出頻率為輸入 2 倍;半波 Vdc=Vm/π、Vrms=Vm/2。', prereq: ['KP-12-02', 'KP-12-06'] },
  { id: 'KP-23-04', unit: '2-3', title: '漣波因數', summary: '未濾波:半波 121%,全波 48%。', prereq: ['KP-23-03'] },
  { id: 'KP-23-05', unit: '2-3', title: '濾波輸出', summary: 'Vdc ≈ Vp − Vr(pp)/2(三角形漣波近似)。', prereq: ['KP-23-03'] },
  { id: 'KP-23-07', unit: '2-3', title: '整流電路的元件符號與電路辨識', summary: '認得二極體、電阻、電容、變壓器、接地、交流電源的符號,並分辨半波、中心抽頭全波與橋式電路。', prereq: [] },
  { id: 'KP-23-06', unit: '2-3', title: '變壓器與次級電壓', summary: 'Vs(m) = (N2/N1)·Vi(m);中心抽頭每半邊為次級一半。', prereq: ['KP-12-03'] },
]

export const kpById = (id: string) => knowledgePoints.find((k) => k.id === id)
