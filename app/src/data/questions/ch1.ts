import type { Question } from '../types'

const F = '習作本詳解_第1章.pdf'
const s = (page: number, label: string) => ({ file: F, page, label })
const opts = (...t: string[]) => t.map((text) => ({ text }))

/** 習作第 1 章:1-1、1-2 全部 29 題。題幹、選項、標準答案取自習作;解析為習作詳解或我方補寫。 */
export const ch1Questions: Question[] = [
  {
    id: 'WB1-MC-01', type: 'mc', unit: '1-1', source: s(2, '選擇題 1'), kps: ['KP-11-01'],
    stem: '以下何者未參與點觸式固態放大器的發明?',
    options: opts('巴定', '卜拉登', '基爾比', '蕭特力'), answer: 2,
    solution: '點觸式電晶體由巴定(巴丁)、卜拉登(布拉頓)與蕭特力(蕭克利)發明;基爾比發明的是積體電路。', review: 'pending',
  },
  {
    id: 'WB1-MC-02', type: 'mc', unit: '1-1', source: s(2, '選擇題 2'), kps: ['KP-11-01', 'KP-11-02'],
    stem: '誰利用單一鍺半導體做出第一個積體電路?',
    options: opts('迪耳', '桑德斯', '基爾比', '葛洛夫'), answer: 2,
    solution: '基爾比(Kilby)於 1958 年以鍺做出第一個積體電路,講義圖 1-17、1-18 可對照。', review: 'pending',
  },
  {
    id: 'WB1-MC-03', type: 'mc', unit: '1-1', source: s(2, '選擇題 3'), kps: ['KP-11-02'],
    stem: '超大型積體電路(VLSI)的基本邏輯閘容量大約為?(單位:個以上)',
    options: opts('10', '100', '1,000', '10,000'), answer: 2,
    solution: '依本教材分類,VLSI 的邏輯閘數在 1,000 個以上。注意:各教科書的分類界線不盡相同,考試以教材為準。', review: 'calcVerified',
  },
  {
    id: 'WB1-MC-04', type: 'mc', unit: '1-1', source: s(2, '選擇題 4'), kps: ['KP-11-02'],
    stem: '積體電路中,依邏輯閘數目之多寡分類,且由多到少排序,何者正確?',
    options: opts('SSI > MSI > LSI > VLSI', 'VLSI > ULSI > LSI > MSI', 'ULSI > VLSI > SSI > LSI', 'ULSI > VLSI > MSI > SSI'), answer: 3,
    solution: '完整順序由多到少為 ULSI > VLSI > LSI > MSI > SSI。(A) 順序整個顛倒;(B) 把 VLSI 排在 ULSI 前面;(C) 把 SSI 排在 LSI 前面;只有 (D) 的先後順序正確(省略了 LSI,但沒有排錯)。', review: 'pending',
  },
  {
    id: 'WB1-MC-05', type: 'mc', unit: '1-1', source: s(2, '選擇題 5'), kps: ['KP-11-03'],
    stem: '以下何者非 IC 製造之主要流程?',
    options: opts('晶粒切割', '打線', '測試', '銷售'), answer: 3,
    solution: '銷售不屬於 IC 製造流程。', review: 'pending',
  },
  {
    id: 'WB1-MC-06', type: 'mc', unit: '1-2', source: s(2, '選擇題 6'), kps: ['KP-12-01'],
    stem: '有一個週期性之電流,其瞬間值只有大小改變,而極性不變,則此電流為?',
    options: opts('交流電流', '純直流電流', '脈動直流電流', '正弦交流'), answer: 2,
    solution: '極性不變、大小隨時間改變的是「脈動直流」;大小也不變才是純直流;極性會改變才是交流。', review: 'pending',
  },
  {
    id: 'WB1-MC-07', type: 'mc', unit: '1-2', source: s(2, '選擇題 7'), kps: ['KP-12-03'],
    stem: '正弦波之峰值為 100V,則有效值為?',
    options: [{ text: '63.3V' }, { text: '70.7V' }, { text: '90V' }, { text: '141.4V', errorType: 'formulaChoice' }], answer: 1,
    solution: 'Vrms = Vm/√2 = 100/1.414 ≈ 70.7 V。141.4 V 是把有效值公式用反(乘以 √2)的結果。', review: 'calcVerified',
    related: ['WB1-MC-08'],
  },
  {
    id: 'WB1-MC-08', type: 'mc', unit: '1-2', source: s(2, '選擇題 8'), kps: ['KP-12-03'],
    stem: '電源 AC 100V 之最大值為?',
    options: [{ text: '100V', errorType: 'concept' }, { text: '141.4V' }, { text: '150V' }, { text: '200V' }], answer: 1,
    solution: 'AC 100 V 是有效值。Vm = √2 × Vrms = 1.414 × 100 ≈ 141.4 V。', review: 'calcVerified',
    related: ['WB1-MC-07'],
  },
  {
    id: 'WB1-MC-09', type: 'mc', unit: '1-2', source: s(2, '選擇題 9'), kps: ['KP-12-09'],
    stem: '各種交流的基本波是?',
    options: opts('正弦波', '方波', '三角波', '鋸齒波'), answer: 0,
    solution: '任何週期波都可分解為不同頻率正弦波的和,所以正弦波是交流的基本波。', review: 'pending',
  },
  {
    id: 'WB1-MC-10', type: 'mc', unit: '1-2', source: s(2, '選擇題 10'), kps: ['KP-12-02'],
    stem: '波形之週期為 50μs,即其頻率為?',
    options: [{ text: '200kHz', errorType: 'unit' }, { text: '20kHz' }, { text: '2kHz', errorType: 'unit' }, { text: '200Hz', errorType: 'unit' }], answer: 1,
    solution: 'f = 1/T = 1 / (50×10⁻⁶ s) = 20,000 Hz = 20 kHz。', review: 'calcVerified',
  },
  {
    id: 'WB1-MC-11', type: 'mc', unit: '1-2', source: s(3, '選擇題 11'), kps: ['KP-12-04', 'KP-12-03', 'KP-12-02'],
    stem: '弦波 v(t) = 2 sin(314t + 30°) V,下列何者錯誤?',
    options: opts('有效值 1.414V', '相角 30 度', '頻率 314Hz', '週期 20ms'), answer: 2,
    solution: 'Vm = 2 V,Vrms = Vm/√2 = √2 ≈ 1.414 V;相角 = 30°;ω = 314 rad/s,f = ω/2π ≈ 50 Hz,T = 1/f = 20 ms。314 是角頻率 ω(rad/s),不是頻率 f,故 (C) 錯誤。', review: 'calcVerified',
  },
  {
    id: 'WB1-MC-12', type: 'mc', unit: '1-2', source: s(3, '選擇題 12'), kps: ['KP-12-09'],
    stem: '方波訊號可由何種波形相加組合而成?',
    options: opts('正弦波', '三角波', '鋸齒波', '直流'), answer: 0,
    solution: '方波可由基本波與奇次諧波的正弦波相加組成。', review: 'pending',
  },
  {
    id: 'WB1-MC-13', type: 'mc', unit: '1-2', source: s(3, '選擇題 13'), kps: ['KP-12-05'],
    stem: '週期性的脈波之 tH = 3ms,tL = 2ms,其工作週期為?',
    options: opts('60%', '40%', '30%', '20%'), answer: 0,
    solution: 'D = tH/(tH+tL) = 3/(3+2) = 60%。', review: 'calcVerified',
  },
  {
    id: 'WB1-MC-14', type: 'mc', unit: '1-2', source: s(3, '選擇題 14'), kps: ['KP-12-05'],
    stem: '一週期性脈波信號其 VH = 10V,VL = −2V。若平均值為 5.2V,則工作週期(duty cycle)為?',
    options: opts('70%', '60%', '50%', '40%'), answer: 1,
    solution: 'Vav = VH·D + VL·(1−D) = 10D − 2(1−D) = 12D − 2 = 5.2,D = 7.2/12 = 60%。', review: 'calcVerified',
    related: ['WB1-PY-03'],
  },
  {
    id: 'WB1-MC-15', type: 'mc', unit: '1-2', source: s(3, '選擇題 15'), kps: ['KP-12-06'],
    stem: '正弦波的波形因數為?',
    options: opts('1', '√3', '√2', 'π/(2√2)'), answer: 3,
    solution: 'FF = Vrms/Vav = (Vm/√2)/(2Vm/π) = π/(2√2) ≈ 1.11。', review: 'calcVerified',
  },
  {
    id: 'WB1-MC-16', type: 'mc', unit: '1-2', source: s(4, '選擇題 16'), kps: ['KP-12-06'],
    stem: '三角波的波峰因數為?',
    options: opts('2/√3', '√3', '√2', 'π/(2√2)'), answer: 1,
    solution: 'CF = Vm/Vrms = Vm/(Vm/√3) = √3 ≈ 1.732。', review: 'calcVerified',
  },
  {
    id: 'WB1-MC-17', type: 'mc', unit: '1-2', source: s(4, '選擇題 17'), kps: ['KP-12-06'],
    stem: '何種波形之波峰因數與波形因數相等?',
    options: opts('三角波', '正弦波', '方波', '餘弦波'), answer: 2,
    solution: '方波的 Vm = Vrms = Vav,所以 CF = FF = 1。', review: 'calcVerified',
  },
  {
    id: 'WB1-MC-18', type: 'mc', unit: '1-2', source: s(4, '選擇題 18'), kps: ['KP-12-06'],
    stem: '何種波形之波形因數最大?',
    options: opts('三角波', '正弦波', '方波', '餘弦波'), answer: 0,
    solution: '三角波 FF = 2/√3 ≈ 1.155;正弦波 ≈ 1.11;方波 = 1。', review: 'calcVerified',
  },
  {
    id: 'WB1-MC-19', type: 'mc', unit: '1-2', source: s(4, '選擇題 19'), kps: ['KP-12-09'],
    stem: '何種波形可組合成任意波形?',
    options: opts('三角波', '正弦波', '方波', '矩形波'), answer: 1,
    solution: '不同頻率的正弦波可組合成任意週期波形。', review: 'pending',
  },
  {
    id: 'WB1-MC-20', type: 'mc', unit: '1-2', source: s(4, '選擇題 20'), kps: ['KP-12-08'],
    stem: '交直流混合波 vo(t) = 3 − 4√2 cos 2ωt (V),其有效值 Vrms 和最大值 Vm 為?(單位:V)',
    options: opts('3,3 + 4√2', '5,3 + 4√2', '5,7', '5√2,7√2'), answer: 1,
    solution: 'DC = 3 V,交流峰值 4√2 V → 交流有效值 4 V。Vrms = √(3² + 4²) = 5 V。瞬時最大值 = 3 + 4√2 V(cos 為 −1 時)。', review: 'calcVerified',
  },
  {
    id: 'WB1-QA-01', type: 'open', unit: '1-1', source: s(4, '問答 1'), kps: ['KP-11-02'],
    stem: '積體電路依所含元件數量之多寡,可分為哪幾類?',
    modelAnswer: '單電晶體、SSI、MSI、LSI、VLSI、ULSI 等六類。',
    checklist: ['寫出六類', '順序由少到多'],
    solution: '單電晶體、SSI、MSI、LSI、VLSI、ULSI。', review: 'pending',
  },
  {
    id: 'WB1-QA-02', type: 'open', unit: '1-1', source: s(4, '問答 2'), kps: ['KP-11-04'],
    stem: '電子元件主要的應用發展方向為何?',
    modelAnswer: '4C:電腦(Computer)、通訊(Communication)、消費性電子(Consumer)和汽車電子(Car)的整合應用。',
    checklist: ['寫出四個 C', '能對應電腦、通訊、消費性電子、汽車電子'],
    solution: '主要應用發展方向為 4C。', review: 'pending',
  },
  {
    id: 'WB1-QA-03', type: 'open', unit: '1-2', source: s(5, '問答 3'), kps: ['KP-12-04', 'KP-12-02'],
    stem: '如圖所示,已知水平一格為 5ms,垂直一格為 2V,請寫出弦波瞬時表示式。',
    figure: 'wb1-qa03',
    modelAnswer: 'Vm = 2V × 4 = 8V;T = 5ms × 4 = 20ms,f = 50Hz;波形自 0 向下,故 v(t) = −8 sin(100πt) V。',
    checklist: ['由格數讀出 Vm = 8 V', '由格數讀出 T = 20 ms,算出 f = 50 Hz', 'ω = 2πf = 100π rad/s', '依起始方向決定負號'],
    solution: 'Vm=8V,f=50Hz,v(t) = −8 sin 100πt (V)。', review: 'calcVerified',
  },
  {
    id: 'WB1-QA-04', type: 'numeric', unit: '1-2', source: s(5, '問答 4'), kps: ['KP-12-06'],
    stem: '如圖所示波形之 Vm = 9V(每個週期一個三角脈波,脈波寬為 T/3),試求平均值、有效值、波形因數及波峰因數。',
    figure: 'wb1-qa04',
    parts: [
      { label: '平均值 Vav', value: 1.5, unit: 'V' },
      { label: '有效值 Vrms', value: 3, unit: 'V' },
      { label: '波形因數 FF', value: 2, unit: '' },
      { label: '波峰因數 CF', value: 3, unit: '' },
    ],
    solution: 'Vav = (Vm/2 × T/3)/T = Vm/6 = 1.5 V;Vrms = √[(Vm/√3)² × (T/3)/T] = Vm/3 = 3 V;FF = 3/1.5 = 2;CF = 9/3 = 3。', review: 'calcVerified',
  },
  {
    id: 'WB1-QA-05', type: 'numeric', unit: '1-2', source: s(5, '問答 5'), kps: ['KP-12-08', 'KP-12-07'],
    stem: '若 vo(t) = 3√3 + 4√2 sinωt + 5√2 sin(ωt + 37°) (V),求 vo 之有效值 Vrms。(提示:頻率相同但相角不同時,必須先化簡合併後,再求有效值。取 sin37° = 0.6、cos37° = 0.8)',
    parts: [{ label: '有效值 Vrms', value: 10, unit: 'V' }],
    solution: '展開 5√2 sin(ωt+37°) = 4√2 sinωt + 3√2 cosωt。合併:vo = 3√3 + 8√2 sinωt + 3√2 cosωt。交流有效值 = √(8² + 3²) = √73。Vrms = √[(3√3)² + 73] = √(27 + 73) = 10 V。', review: 'calcVerified',
  },
  {
    id: 'WB1-PY-01', type: 'mc', unit: '1-2', source: s(6, '歷屆 108 年統測 1'), kps: ['KP-12-03', 'KP-12-04'],
    stem: '若正弦波電壓信號 v(t) = 0.1 sin(1000πt) V,則下列敘述何者正確?',
    options: opts('有效值為 0.1V', '平均值為 0.05V', '頻率為 500Hz', '時間 t = 0.01 秒時,其電壓值為 0.1V'), answer: 2,
    solution: '(A) Vrms = 0.1/√2;(B) 一週期平均值 = 0;(C) 2πf = 1000π → f = 500 Hz;(D) v(0.01) = 0.1 sin(10π) = 0。', review: 'calcVerified',
  },
  {
    id: 'WB1-PY-02', type: 'mc', unit: '1-2', source: s(6, '歷屆 106 年統測 2'), kps: ['KP-12-05'],
    stem: '如圖所示之 v1(t) 為週期性電壓波形,若 Vp = 10V,T1 = 3s,T2 = 2s,則其工作週期(duty cycle)為何?',
    figure: 'wb1-py02', figureNote: 'T1 為高電位時間,T2 為低電位時間(原題印刷多了一個等號,已更正)。',
    options: opts('30%', '40%', '60%', '80%'), answer: 2,
    solution: 'D = T1/(T1+T2) = 3/(3+2) = 60%。', review: 'calcVerified',
  },
  {
    id: 'WB1-PY-03', type: 'mc', unit: '1-2', source: s(6, '歷屆 105 年統測 3'), kps: ['KP-12-05'],
    stem: '一週期性脈波信號其正峰值電壓為 +10V,負峰值電壓為 −2V。若此信號的平均值為 +5.2V,則工作週期(duty cycle)約為下列何值?',
    options: opts('70%', '60%', '50%', '40%'), answer: 1,
    solution: '10D − 2(1−D) = 5.2 → 12D = 7.2 → D = 60%。', review: 'calcVerified', related: ['WB1-MC-14'],
  },
  {
    id: 'WB1-PY-04', type: 'mc', unit: '1-2', source: s(6, '歷屆 104 年統測 4'), kps: ['KP-12-07'],
    stem: '兩電壓 v1(t) = 8cos(20πt + 13°) V 及 v2(t) = 4sin(20πt + 45°) V,則兩電壓之相位差為多少度?',
    options: opts('58', '45', '32', '13'), answer: 0,
    solution: '先統一成 sin:v1 = 8 sin(20πt + 13° + 90°) = 8 sin(20πt + 103°)。相位差 = 103° − 45° = 58°。', review: 'calcVerified',
  },
]
