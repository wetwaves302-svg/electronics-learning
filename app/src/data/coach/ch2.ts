import type { CoachStep, Variant } from '../types'
import { halfWave, pivCenterTapFullWave, pivHalfWave, sinePeak, transformerSecondaryPeak } from '../../core/physics'

const pick = <T,>(arr: T[], seed: number) => arr[((seed % arr.length) + arr.length) % arr.length]
const r2 = (x: number) => Math.round(x * 100) / 100

/* ─────────── WB2-MC-08:半波整流的 PIV ─────────── */
export const coach_WB2_MC_08: CoachStep[] = [
  {
    id: 'read', title: '讀懂題目',
    teach: '已知:半波整流電路,輸入 Vi(t) = 100 sinωt V,二極體為理想。要求:二極體承受的峰值逆向電壓 PIV。',
    ask: { prompt: 'PIV(峰值逆向電壓)指的是?', options: ['二極體「截止」時,兩端承受的最大反向電壓', '二極體導通時的壓降', '輸出電壓的峰值'], answer: 0, why: 'PIV 是二極體截止時,陰極比陽極高出的最大電壓。選二極體時,額定逆向耐壓必須大於它。' },
    commonMistake: '把 PIV 和輸出電壓的峰值搞混。輸出峰值是導通時的,PIV 是截止時的。',
    hints: ['PIV 的 I 是 Inverse(逆向)。', '逆向就是二極體不導通的時候。', 'PIV 是截止時承受的最大電壓。'],
  },
  {
    id: 'analyze', title: '分析電路',
    teach: '負半週時 Vi 是負的,二極體截止,電路中沒有電流。沒有電流,負載電阻 RL 上就沒有壓降,所以整個輸入電壓都加在二極體兩端。',
    ask: { prompt: '負半週的最低點(Vi = −100 V),負載 RL 上的電壓是多少?', options: ['0 V(沒有電流)', '−100 V', '+100 V'], answer: 0, why: '二極體截止,電路是斷路,I = 0,所以 RL 上的電壓 = I × RL = 0 V。因此輸入電壓全部落在二極體上:V_AK = −100 V。' },
    commonMistake: '以為負載也會分到一部分電壓。截止時電流為零,RL 沒有壓降。',
    hints: ['截止的二極體像一條斷掉的線。', '串聯電路斷了,電流是多少?', '電流為 0,RL 上的電壓就是 0。'],
  },
  {
    id: 'principle', title: '選擇原理',
    teach: '由上一步:二極體承受的最大逆向電壓,就是輸入電壓的峰值。半波整流 PIV = Vm。(中心抽頭全波的 PIV 是 2 倍,之後再學。)',
    ask: { prompt: '半波整流(無濾波)的 PIV 是?', options: ['PIV = Vm', 'PIV = 2 Vm', 'PIV = Vm / √2'], answer: 0, why: '半波:PIV = Vm。2Vm 是中心抽頭全波;Vm/√2 是弦波的有效值,與 PIV 無關。' },
    commonMistake: '把 PIV 公式與其他整流電路混用。',
    hints: ['想想剛才:截止時整個輸入電壓都加在二極體上。', '輸入電壓最高時是峰值。', 'PIV 等於輸入電壓的峰值。'],
  },
  {
    id: 'formula', title: '建立算式',
    teach: '從 Vi(t) = 100 sinωt 讀出峰值:sin 前面的係數就是峰值 Vm = 100 V。所以 PIV = Vm = 100 V。',
    ask: { prompt: 'Vi(t) = 100 sinωt 的峰值 Vm 是?', options: ['100 V', '70.7 V', '141.4 V'], answer: 0, why: '瞬時式 v(t) = Vm sinωt 中,係數就是峰值。100 就是 Vm,不需要換算。' },
    commonMistake: '看到「100」就以為是有效值而去乘 1.414。這題是瞬時式,100 就是峰值。',
    hints: ['對照 v(t) = Vm sinωt。', 'sinωt 前面的數字就是 Vm。', 'Vm = 100 V。'],
  },
  {
    id: 'compute', title: '逐步運算',
    teach: '這題不需要算,答案直接等於峰值:PIV = 100 V。但要注意:如果題目給的是「AC 100 V」(有效值),就必須先換成峰值 100 × 1.414 = 141.4 V。',
    ask: { prompt: '如果輸入改成「AC 100 V」(有效值),PIV = ?', options: ['141.4 V', '100 V', '70.7 V'], answer: 0, why: 'AC 100 V 是有效值,Vm = √2 × 100 = 141.4 V,PIV = Vm = 141.4 V。' },
    commonMistake: '分不清題目給的是峰值還是有效值。',
    hints: ['AC 100 V 是有效值還是峰值?', '電源標示的電壓都是有效值。', 'Vm = √2 × Vrms。'],
  },
  {
    id: 'verify', title: '驗證結果',
    teach: '單位是 V,為正值。合理性:截止時二極體承受的電壓不可能比輸入峰值小,所以 PIV 至少要等於 100 V。',
    ask: { prompt: '哪一個答案不合理?', options: ['50 V(比輸入峰值還小)', '100 V', '141.4 V(若輸入是有效值 100 V)'], answer: 0, why: '截止時輸入電壓全部加在二極體上,PIV 不可能小於輸入峰值 100 V,所以 50 V 不合理。' },
    commonMistake: '算完不檢查。PIV 小於輸入峰值就是明顯錯誤。',
    hints: ['回想步驟 2:輸入電壓全部加在二極體上。', 'PIV 至少要等於輸入峰值。', '比 100 V 小的都不合理。'],
  },
]
export const variant_WB2_MC_08: Variant = {
  make: (seed) => {
    const vm = pick([50, 120, 170, 200], seed)
    const asRms = seed % 2 === 1
    const stem = asRms
      ? `半波整流電路(二極體理想、無濾波),輸入為 AC ${vm} V(有效值),二極體的 PIV 是多少?(請連同單位,例如 100 V)`
      : `半波整流電路(二極體理想、無濾波),輸入 Vi(t) = ${vm} sinωt V,二極體的 PIV 是多少?(請連同單位,例如 100 V)`
    return { stem, part: { label: 'PIV', value: pivHalfWave(asRms ? sinePeak(vm) : vm), unit: 'V', relTol: 0.01 } }
  },
}

/* ─────────── WB2-MC-10:全波整流的輸出頻率 ─────────── */
export const coach_WB2_MC_10: CoachStep[] = [
  {
    id: 'read', title: '讀懂題目',
    teach: '已知:輸入 60 Hz,經「全波整流」。要求:負載上電壓波形的頻率。',
    ask: { prompt: '這題問的頻率是哪一個?', options: ['整流後「輸出」的頻率', '輸入電源的頻率', '二極體的切換速度'], answer: 0, why: '題目問「負載上之電壓波形頻率」,是輸出頻率;輸入頻率已知是 60 Hz。' },
    commonMistake: '直接回答輸入頻率 60 Hz。',
    hints: ['看清楚是「負載上」的波形。', '輸出波形和輸入波形不一樣。', '要求的是輸出頻率。'],
  },
  {
    id: 'analyze', title: '分析電路',
    teach: '全波整流會把負半週「翻」到正半週,所以輸出不再有負的部分,每個輸入週期會出現兩個正的脈動。',
    ask: { prompt: '輸入一個完整週期內,全波整流輸出有幾個脈動?', options: ['2 個', '1 個', '4 個'], answer: 0, why: '正半週一個脈動,負半週被翻轉後又一個脈動,共 2 個。半波整流才只有 1 個。' },
    commonMistake: '把全波與半波混在一起。半波整流把負半週擋掉,只剩 1 個脈動。',
    hints: ['全波整流有沒有浪費負半週?', '負半週也被利用,翻成正的。', '一個週期有 2 個脈動。'],
  },
  {
    id: 'principle', title: '選擇原理',
    teach: '輸出頻率 = 每秒的脈動次數。全波:fo = 2 fi;半波:fo = fi。',
    ask: { prompt: '全波整流的輸出頻率與輸入頻率的關係是?', options: ['fo = 2 fi', 'fo = fi', 'fo = fi / 2'], answer: 0, why: '每個輸入週期有 2 個輸出脈動,所以每秒的脈動次數是輸入的 2 倍。' },
    commonMistake: '以為整流後頻率不變,或變成一半。',
    hints: ['每秒有幾個輸入週期?60 個。', '每個輸入週期有 2 個脈動。', '每秒脈動 = 60 × 2。'],
  },
  {
    id: 'formula', title: '建立算式',
    teach: '代入:fo = 2 × fi = 2 × 60 Hz。',
    ask: { prompt: '代入後的式子是?', options: ['fo = 2 × 60 Hz', 'fo = 60 Hz ÷ 2', 'fo = 60 Hz + 2'], answer: 0, why: '倍數關係用乘法。加法或除法都沒有物理意義。' },
    commonMistake: '把倍數寫成加法。',
    hints: ['「2 倍」要用哪種運算?', '要用乘法:「2 倍」就是乘 2。', 'fo = 2 × 60。'],
  },
  {
    id: 'compute', title: '逐步運算',
    teach: '2 × 60 = 120,單位 Hz。所以 fo = 120 Hz。',
    ask: { prompt: '2 × 60 等於?', options: ['120', '30', '62'], answer: 0, why: '2 × 60 = 120。30 是 60 ÷ 2;62 是 60 + 2。' },
    commonMistake: '運算符號看錯。',
    hints: ['先決定用乘還是除:「2 倍」要用乘法。', '60 要乘上 2,就是 60 的兩倍。', '60 + 60 = 120,所以是 120。'],
  },
  {
    id: 'verify', title: '驗證結果',
    teach: '單位 Hz。反推週期:輸入週期 1/60 ≈ 16.7 ms,輸出週期 1/120 ≈ 8.33 ms,剛好是一半,符合「一個輸入週期有兩個脈動」。',
    ask: { prompt: '輸出 120 Hz 的週期約是?', options: ['8.33 ms', '16.7 ms', '33.3 ms'], answer: 0, why: 'T = 1/120 s ≈ 8.33 ms,是輸入週期 16.7 ms 的一半。' },
    commonMistake: '反推時單位換錯(秒、毫秒)。',
    hints: ['用 T = 1/f。', '1 ÷ 120 = 0.00833 s。', '0.00833 s = 8.33 ms。'],
  },
]
export const variant_WB2_MC_10: Variant = {
  make: (seed) => {
    const f = pick([50, 60, 400, 100], seed)
    const full = seed % 2 === 0
    return {
      stem: `${f} Hz 的交流電壓經${full ? '全波' : '半波'}整流後(無濾波),負載上電壓波形的頻率是多少?(請連同單位,例如 120 Hz)`,
      part: { label: '輸出頻率', value: f * (full ? 2 : 1), unit: 'Hz', relTol: 0.01 },
    }
  },
}

/* ─────────── WB2-PY-05:中心抽頭全波的 PIV ─────────── */
export const coach_WB2_PY_05: CoachStep[] = [
  {
    id: 'read', title: '讀懂題目',
    teach: '已知:變壓器匝數比 110:24,輸入 AC 110 V、60 Hz,中心抽頭全波整流,二極體順向壓降視為 0。要求:選用二極體的額定 PIV,哪個「較適當」。',
    ask: { prompt: '題目中的「AC 110 V」是什麼電壓?', options: ['有效值', '峰值', '平均值'], answer: 0, why: '交流電源標示的電壓是有效值。要算峰值,必須乘 √2。' },
    commonMistake: '把 110 V 當成峰值。',
    hints: ['AC 電源標示的是哪一種電壓?', '插座上的 110 V 是有效值。', '峰值 = 110 × √2。'],
  },
  {
    id: 'analyze', title: '分析電路',
    teach: '次級有中心抽頭並接地,每一半邊的電壓是整個次級的一半。當上半邊為正:D1 導通,D2 截止。這時 D2 的陰極接到輸出(約等於上半邊的峰值),陽極在下半邊(負的峰值)。',
    ask: { prompt: '上半邊為正峰值時,D2 的陽極與陰極電位大約是?', options: ['陽極 −Vs(m)、陰極 +Vs(m)', '陽極 +Vs(m)、陰極 −Vs(m)', '兩端都是 0'], answer: 0, why: 'Vs(m) 指每半邊的峰值。D2 陽極接下半邊 = −Vs(m);陰極接輸出 ≈ +Vs(m)。V_AK = −Vs(m) − Vs(m) = −2Vs(m),所以逆向電壓是每半邊峰值的 2 倍。' },
    commonMistake: '只看到一半次級的電壓,以為 PIV = Vs(m)。',
    hints: ['D2 的陰極接到哪裡?輸出端。', '輸出端此時約等於上半邊的峰值。', 'D2 兩端電位差 = 下半邊負峰值 − 輸出峰值。'],
  },
  {
    id: 'principle', title: '選擇原理',
    teach: '中心抽頭全波整流:PIV = 2 × 每半邊峰值。(橋式和半波則是 PIV = 次級峰值。)',
    ask: { prompt: '中心抽頭全波整流的 PIV 是?', options: ['2 × 每半邊峰值', '每半邊峰值', '每半邊有效值'], answer: 0, why: '由上一步:V_AK = −2Vs(m)(每半邊峰值)。這也等於整個次級電壓的峰值。' },
    commonMistake: '把中心抽頭的 PIV 公式用在橋式,或反過來。',
    hints: ['回想 D2 兩端的電位差。', '是每半邊峰值的兩倍。', 'PIV = 2 Vs(m)。'],
  },
  {
    id: 'formula', title: '建立算式',
    teach: '次級全部有效值 = 110 × 24/110 = 24 V,每半邊 12 V(有效值)。每半邊峰值 = 12√2 V。PIV = 2 × 12√2 = 24√2 V。',
    ask: { prompt: '次級全部是 24 V(有效值),中心抽頭後每半邊有效值是?', options: ['12 V', '24 V', '48 V'], answer: 0, why: '中心抽頭把次級分成兩個相等的半邊,每半邊是全部的一半,12 V。' },
    commonMistake: '忘記中心抽頭把電壓分成一半。',
    hints: ['中心抽頭在次級的正中間。', '分成兩個一樣的半邊。', '24 ÷ 2 = 12。'],
  },
  {
    id: 'compute', title: '逐步運算',
    teach: 'PIV = 24√2 ≈ 24 × 1.414 = 33.94 V。',
    ask: { prompt: '24 × 1.414 約等於?', options: ['33.9', '24', '48'], answer: 0, why: '24 × 1.414 ≈ 33.94。24 是少乘了 √2;48 是乘了 2。' },
    commonMistake: '漏乘 √2 或乘錯數。',
    hints: ['24 乘上 1.414。', '24 × 1 = 24,再加 24 × 0.414 ≈ 9.9。', '約 33.9。'],
    math: [{ title: '估算', text: '1.414 比 1.4 大一點。24 × 1.4 = 33.6,所以答案應該略大於 33.6。33.9 合理。' }],
  },
  {
    id: 'verify', title: '驗證結果',
    teach: '單位 V。選項 28、30、32 V 都小於 33.94 V,二極體會被擊穿;只有 34 V 大於 33.94 V。實務上還會再留一些餘裕,但題目選項中只有 34 V 符合。',
    ask: { prompt: '為什麼 28 V、30 V、32 V 不適合?', options: ['額定值比實際承受的 33.94 V 小,會被擊穿', '額定值太大,浪費', '二極體的額定值不影響安全'], answer: 0, why: '額定 PIV 必須大於實際承受的逆向電壓,否則二極體可能被逆向擊穿。' },
    commonMistake: '以為「接近就好」。額定值要大於實際值。',
    hints: ['比較每個選項與 33.94 V。', '額定值必須大於實際承受的電壓。', '只有大於 33.94 V 的才安全。'],
  },
]
export const variant_WB2_PY_05: Variant = {
  make: (seed) => {
    const [vin, n1, n2] = pick([[110, 110, 24], [220, 220, 12], [110, 110, 48], [220, 110, 24], [110, 220, 36]] as [number, number, number][], seed)
    const half = transformerSecondaryPeak(sinePeak(vin), n1, n2) / 2
    return {
      stem: `中心抽頭全波整流電路,輸入 AC ${vin} V(有效值),變壓器匝數比 ${n1}:${n2},二極體為理想。二極體實際承受的 PIV 是多少?(請連同單位,例如 33.9 V)`,
      part: { label: 'PIV', value: pivCenterTapFullWave(half), unit: 'V', relTol: 0.01 },
    }
  },
}

/* ─────────── WB2-QA-03:半波整流輸出電壓(含變壓器) ─────────── */
export const coach_WB2_QA_03: CoachStep[] = [
  {
    id: 'read', title: '讀懂題目',
    teach: '已知:變壓器 10:1,輸入 Vi = 100 V、50 Hz(有效值),半波整流,RL = 100 Ω,二極體理想。要求:輸出電壓的峰值、直流平均、有效值,以及對應的三個電流,共 6 個量。',
    ask: { prompt: '題目要求哪些量?', options: ['電壓 3 個、電流 3 個(峰值、直流、有效值)', '只有電壓', '只有電流的峰值'], answer: 0, why: '題目列出 Vo(p)、Vo(dc)、Vo(rms) 與 Io(p)、Io(dc)、Io(rms),共 6 個。' },
    commonMistake: '漏掉其中幾個量。建議把 6 個列成清單,逐一算完打勾。',
    hints: ['數一數題目裡有幾個符號。', '電壓、電流各有 p、dc、rms。', '共 6 個。'],
  },
  {
    id: 'analyze', title: '分析電路',
    teach: '變壓器把 100 V 降到次級的 1/10。二極體只在正半週導通,輸出是「半個弦波」:有正半週的波形,負半週為 0。',
    ask: { prompt: '半波整流的輸出波形是?', options: ['只有正半週,負半週為 0', '正負半週都變成正的', '完整的正弦波'], answer: 0, why: '半波整流把負半週擋掉。負半週都翻成正的是全波整流。' },
    commonMistake: '把半波整流想成全波。',
    hints: ['只用一顆二極體,負半週它會導通嗎?', '負半週截止,沒有電流。', '所以負半週輸出為 0。'],
  },
  {
    id: 'principle', title: '選擇原理',
    teach: '分兩段:①用變壓器匝數比求次級峰值 Vs(m);②用半波整流公式求輸出電壓;③用歐姆定律 I = V/RL 求電流(峰值對峰值、平均對平均、有效對有效)。',
    ask: { prompt: '求 Io(dc) 應該用哪個電壓除以 RL?', options: ['Vo(dc)', 'Vo(p)', 'Vo(rms)'], answer: 0, why: '歐姆定律對「同一種量」成立:平均電流 = 平均電壓 / R。用 Vo(p) 除會得到峰值電流 Io(p)。' },
    commonMistake: '電壓、電流的種類配錯,例如用峰值電壓算平均電流。',
    hints: ['Io(dc) 是哪一種電流?直流平均。', '要用同一種電壓來除。', '用 Vo(dc) ÷ RL。'],
  },
  {
    id: 'formula', title: '建立算式',
    teach: 'Vs(m) = (N2/N1) × Vi(m),Vi(m) = √2 × 100 V。所以 Vs(m) = (1/10) × 100√2 = 10√2 V。再 Vo(p) = Vs(m);Vo(dc) = Vo(p)/π;Vo(rms) = Vo(p)/2。',
    ask: { prompt: 'Vi = 100 V(有效值)的峰值 Vi(m) 是?', options: ['100√2 ≈ 141.4 V', '100 V', '70.7 V'], answer: 0, why: '題目的 100 V 是有效值,必須先乘 √2 才是峰值。變壓器的比例要用在同一種量上。' },
    commonMistake: '直接把 100 V 當成峰值去除以 10。',
    hints: ['100 V 是有效值還是峰值?', '有效值要乘 √2 換成峰值。', 'Vi(m) = 100 × 1.414。'],
  },
  {
    id: 'compute', title: '逐步運算',
    teach: 'Vo(p) = 10√2 ≈ 14.14 V。Vo(dc) = 14.14/π ≈ 4.50 V。Vo(rms) = 14.14/2 = 7.07 V。電流除以 100 Ω:Io(p) = 141 mA、Io(dc) = 45 mA、Io(rms) ≈ 70.7 mA。',
    ask: { prompt: '14.14 ÷ π(≈ 3.14)約等於?', options: ['4.5', '9', '44.4'], answer: 0, why: '14.14 ÷ 3.14 ≈ 4.5。可以先估:14 ÷ 3 ≈ 4.7,所以答案略小於 4.7。' },
    commonMistake: '除以 π 時估錯大小。',
    hints: ['π 約 3.14。', '14 ÷ 3 約 4.7。', '14.14 ÷ 3.14 ≈ 4.5。'],
    math: [{ title: '電流單位換算', tex: '\\dfrac{14.14\\,\\mathrm{V}}{100\\,\\Omega}=0.1414\\,\\mathrm{A}=141.4\\,\\mathrm{mA}', text: '1 A = 1000 mA,0.1414 A 乘 1000 得 141.4 mA。' }],
  },
  {
    id: 'verify', title: '驗證結果',
    teach: '半波的 Vo(dc) = 4.5 V 小於 Vo(rms) = 7.07 V,又小於 Vo(p) = 14.14 V。比值:Vo(rms)/Vo(dc) = π/2 ≈ 1.57 ✓(漣波因數 121% 的來源)。',
    ask: { prompt: '三個電壓由小到大的順序是?', options: ['dc < rms < p', 'rms < dc < p', 'p < dc < rms'], answer: 0, why: '4.5 V < 7.07 V < 14.14 V。峰值一定最大,平均值(半波只有 1/π)最小。' },
    commonMistake: '以為有效值比平均值小。對半波整流,有效值比平均值大。',
    hints: ['峰值一定最大。', '半波的平均值是峰值的 1/π ≈ 0.32,有效值是 1/2。', '0.32 < 0.5 < 1。'],
  },
]
export const variant_WB2_QA_03: Variant = {
  make: (seed) => {
    const [vin, n1, n2] = pick([[100, 10, 1], [220, 10, 1], [110, 5, 1], [220, 20, 1], [110, 10, 2]] as [number, number, number][], seed)
    const vm = transformerSecondaryPeak(sinePeak(vin), n1, n2)
    return {
      stem: `半波整流電路,輸入 ${vin} V(有效值),變壓器匝數比 ${n1}:${n2},二極體為理想。輸出電壓的直流平均值 Vo(dc) 是多少?(請連同單位,例如 4.5 V)`,
      part: { label: 'Vo(dc)', value: r2(halfWave(vm).vo_dc), unit: 'V', relTol: 0.01 },
    }
  },
}
