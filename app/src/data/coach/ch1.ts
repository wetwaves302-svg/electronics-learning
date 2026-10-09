import type { CoachStep, Variant } from '../types'
import { dutyFromAverage, frequencyFromPeriod, sineRms } from '../../core/physics'

const pick = <T,>(arr: T[], seed: number) => arr[((seed % arr.length) + arr.length) % arr.length]
const fmt = (x: number) => String(Math.round(x * 100) / 100)

/* ─────────── WB1-MC-07:弦波峰值 → 有效值 ─────────── */
export const coach_WB1_MC_07: CoachStep[] = [
  {
    id: 'read', title: '讀懂題目',
    teach: '題目給的是「峰值 100 V」,要求的是「有效值」。先把已知與未知寫出來:已知 Vm = 100 V,未知 Vrms。',
    ask: { prompt: '題目給的 100 V 是什麼電壓?', options: ['峰值 Vm(波形最高點)', '有效值 Vrms', '平均值'], answer: 0, why: '題目寫「正弦波之峰值為 100 V」,100 V 是波形的最高點,也就是峰值 Vm。' },
    commonMistake: '把題目給的數字直接當成有效值。電源標示的 110 V 是有效值,但這題明講是峰值。',
    hints: ['把題目的關鍵字圈出來:「峰值」。', '峰值是波形最高點;有效值是等效直流的大小。', '所以已知 Vm = 100 V,未知 Vrms。'],
  },
  {
    id: 'analyze', title: '分析波形',
    teach: '這是一個正弦波,上下對稱。峰值是它能到達的最大電壓,但它大部分時間都比峰值小,所以「等效直流」會比峰值小。',
    ask: { prompt: '有效值會比峰值大還是小?', options: ['比峰值小', '比峰值大', '一樣大'], answer: 0, why: '波形只有在最高點才等於峰值,其他時刻都比較小,所以有效值一定小於峰值。這個想法後面可以拿來檢查答案。' },
    commonMistake: '以為有效值比較「有效」所以比較大。有效值是等效直流的大小,不會超過峰值。',
    hints: ['想一想:波形多數時間是在峰值,還是在比峰值低的地方?', '波形多半比峰值小。', '所以有效值 < 峰值。'],
  },
  {
    id: 'principle', title: '選擇原理',
    teach: '弦波的有效值與峰值之間有固定比例:有效值 = 峰值 ÷ √2。這個關係只適用於「弦波」,方波、三角波的比例不同。',
    ask: { prompt: '哪一個關係適用於弦波?', options: ['Vrms = Vm / √2', 'Vrms = Vm × √2', 'Vrms = Vm / 2'], answer: 0, why: '弦波 Vrms = Vm/√2 ≈ 0.707 Vm。乘 √2 是反過來的(由有效值求峰值);除以 2 是半波整流輸出的有效值,不是這題。' },
    commonMistake: '把「由峰值求有效值」與「由有效值求峰值」用反,結果變成 141.4 V。',
    hints: ['有效值會比峰值小,所以要「除」以一個大於 1 的數。', '弦波:Vrms = Vm 除以 √2。', 'Vrms = 100 / √2。'],
  },
  {
    id: 'formula', title: '建立算式',
    teach: '先寫符號公式,再代入已知數值。Vrms = Vm / √2 = 100 V / √2。單位:伏特(V)。',
    ask: { prompt: '代入後的式子是?', options: ['Vrms = 100 V / √2', 'Vrms = 100 V × √2', 'Vrms = 100 V / 2'], answer: 0, why: '把 Vm = 100 V 代進 Vrms = Vm/√2 即可。' },
    commonMistake: '忘記寫單位,或把 √2 當成 2。',
    hints: ['把已知的數字放進符號公式的位置。', 'Vm 的位置換成 100 V。', 'Vrms = 100 V / √2。'],
    math: [{ title: '√2 是什麼?', text: '√2 是「平方後等於 2 的數」,約等於 1.414。計算器上有 √ 鍵,也可以記 1.414。' }],
  },
  {
    id: 'compute', title: '逐步運算',
    teach: '100 ÷ 1.414 ≈ 70.7。可以先估一估:1.414 比 1.4 略大,100 ÷ 1.4 ≈ 71.4,所以答案應該略小於 71.4,70.7 合理。',
    ask: { prompt: '100 ÷ 1.414 約等於多少?', options: ['70.7', '141.4', '50'], answer: 0, why: '1.414 × 70.7 ≈ 100。141.4 是 100 × 1.414(乘錯);50 是 100 ÷ 2。' },
    commonMistake: '除法與乘法混淆。除以大於 1 的數,答案會變小。',
    hints: ['除以一個大於 1 的數,答案會比 100 小還是大?', '會變小,所以 141.4 不可能。', '用計算器:100 ÷ 1.414 ≈ 70.7。'],
    math: [{ title: '除以 √2 等於乘以 0.707', tex: '\\dfrac{1}{\\sqrt{2}}\\approx 0.707', text: '所以也可以用 100 × 0.707 = 70.7。兩種算法結果相同。' }],
  },
  {
    id: 'verify', title: '驗證結果',
    teach: '三個檢查:①單位是 V。②正負號:有效值為正。③合理性:70.7 V < 100 V,符合「有效值比峰值小」的判斷。',
    ask: { prompt: '哪一個答案不合理?', options: ['141.4 V(比峰值還大)', '70.7 V', '63.3 V'], answer: 0, why: '有效值不會超過峰值,141.4 V 比 100 V 大,所以不可能是有效值。這是選項 (D) 的陷阱。' },
    commonMistake: '算完不檢查。有效值大於峰值是明顯的警訊。',
    hints: ['回想步驟 2 的判斷。', '有效值應該比峰值小。', '大於 100 V 的答案一定不合理。'],
  },
]
export const variant_WB1_MC_07: Variant = {
  make: (seed) => {
    const vm = pick([50, 120, 200, 311], seed)
    return { stem: `正弦波之峰值為 ${vm} V,則有效值為多少?(請連同單位,例如 70.7 V)`, part: { label: '有效值 Vrms', value: sineRms(vm), unit: 'V', relTol: 0.01 } }
  },
}

/* ─────────── WB1-MC-10:週期 → 頻率 ─────────── */
export const coach_WB1_MC_10: CoachStep[] = [
  {
    id: 'read', title: '讀懂題目',
    teach: '已知:週期 T = 50 μs。未知:頻率 f。注意單位是微秒(μs)。',
    ask: { prompt: '題目給了什麼、要求什麼?', options: ['給週期 T,求頻率 f', '給頻率 f,求週期 T', '給峰值,求有效值'], answer: 0, why: '題目寫「波形之週期為 50 μs,即其頻率為?」所以已知 T,求 f。' },
    commonMistake: '把 μs 看成 ms 或 s,後面單位就全錯。μ 是 10⁻⁶。',
    hints: ['圈出題目中的單位。', 'μs 是微秒,= 10⁻⁶ 秒。', '已知 T = 50×10⁻⁶ s,求 f。'],
    math: [{ title: '單位前綴', text: 'm(毫)= 10⁻³;μ(微)= 10⁻⁶;k(仟)= 10³。50 μs = 50 × 10⁻⁶ s = 0.00005 s。' }],
  },
  {
    id: 'analyze', title: '分析波形',
    teach: '週期是波形重複一次所需的時間。週期很短,表示一秒鐘可以重複很多次,所以頻率會很高。',
    ask: { prompt: '週期是 50 μs(很短),頻率會是?', options: ['很高(上千 Hz 以上)', '很低(幾 Hz)', '無法判斷'], answer: 0, why: '週期愈短、頻率愈高。50 μs 比 1 ms 還短,頻率會超過 1 kHz。' },
    commonMistake: '以為週期短頻率也低。兩者是倒數關係:一個變小另一個就變大。',
    hints: ['想像一秒鐘內能放幾個 50 μs 的週期。', '1 秒 = 1,000,000 μs。', '一秒可放 1,000,000 ÷ 50 個週期。'],
  },
  {
    id: 'principle', title: '選擇原理',
    teach: '頻率與週期互為倒數:f = 1/T。',
    ask: { prompt: '由週期求頻率,用哪個式子?', options: ['f = 1/T', 'f = T', 'f = 2πT'], answer: 0, why: 'f = 1/T,單位是 Hz(= 1/秒)。f = T 與 f = 2πT 的單位都不對。' },
    commonMistake: '把 f = 1/T 與 ω = 2πf 混在一起。',
    hints: ['週期的單位是秒,頻率的單位是 1/秒。', '所以 f 等於 1 除以 T。', 'f = 1/T。'],
  },
  {
    id: 'formula', title: '建立算式',
    teach: '代入:f = 1 / (50 × 10⁻⁶ s)。重點:先把單位換成「秒」再代入。',
    ask: { prompt: '正確的代入式是?', options: ['f = 1 / (50 × 10⁻⁶ s)', 'f = 1 / (50 × 10⁻³ s)', 'f = 1 / 50 s'], answer: 0, why: 'μ = 10⁻⁶。用 10⁻³ 是 ms,不是 μs。' },
    commonMistake: '漏換單位,直接用 50 當作秒。',
    hints: ['先換單位:μs → s。', '1 μs = 10⁻⁶ s。', 'T = 50 × 10⁻⁶ s。'],
  },
  {
    id: 'compute', title: '逐步運算',
    teach: '1 ÷ (50 × 10⁻⁶) = (1 ÷ 50) × 10⁶ = 0.02 × 10⁶ = 20,000 Hz = 20 kHz。',
    ask: { prompt: '1 ÷ 50 等於多少?', options: ['0.02', '0.2', '0.5'], answer: 0, why: '50 × 0.02 = 1,所以 1 ÷ 50 = 0.02。' },
    commonMistake: '10⁻⁶ 在分母,要變成 10⁶ 在分子(符號反過來)。',
    hints: ['先算分數部分:1 ÷ 50。', '1 ÷ 50 = 0.02。', '再乘 10⁶:0.02 × 10⁶ = 20,000。'],
    math: [{ title: '分母的負指數', tex: '\\dfrac{1}{10^{-6}}=10^{6}', text: '分母的 10⁻⁶ 搬到分子,指數的正負號會反過來。' }],
  },
  {
    id: 'verify', title: '驗證結果',
    teach: '單位:Hz。合理性:週期 50 μs 很短,頻率 20 kHz 很高,與步驟 2 一致。反推:1 ÷ 20,000 Hz = 0.00005 s = 50 μs ✓。',
    ask: { prompt: '把 f = 20 kHz 反推週期,得到?', options: ['50 μs', '20 μs', '5 ms'], answer: 0, why: 'T = 1/f = 1/20,000 = 0.00005 s = 50 μs,與題目相同。' },
    commonMistake: '反推時又換錯單位。0.00005 s = 50 × 10⁻⁶ s = 50 μs。',
    hints: ['用 T = 1/f 反推。', '1 ÷ 20,000 = 0.00005。', '0.00005 s = 50 μs。'],
  },
]
export const variant_WB1_MC_10: Variant = {
  make: (seed) => {
    const t = pick([20, 25, 40, 80, 125], seed)
    return { stem: `波形之週期為 ${t} μs,則頻率為多少?(請連同單位,例如 20 kHz)`, part: { label: '頻率 f', value: frequencyFromPeriod(t * 1e-6), unit: 'Hz', relTol: 0.01 } }
  },
}

/* ─────────── WB1-MC-14:脈波平均值 → 工作週期 ─────────── */
export const coach_WB1_MC_14: CoachStep[] = [
  {
    id: 'read', title: '讀懂題目',
    teach: '已知:高位準 VH = 10 V,低位準 VL = −2 V(注意是負的),平均值 Vav = 5.2 V。要求:工作週期 D。',
    ask: { prompt: '這題要求的是什麼?', options: ['工作週期 D(高位準時間所占的比例)', '頻率 f', '有效值 Vrms'], answer: 0, why: '題目問「工作週期」。已知的 5.2 V 是平均值,不是答案。' },
    commonMistake: '漏看 VL 的負號。',
    hints: ['圈出題目中每個數字旁邊的符號與單位。', 'VL = −2 V 是負的。', '已知 VH、VL、Vav,求 D。'],
  },
  {
    id: 'analyze', title: '分析波形',
    teach: '脈波在 10 V 與 −2 V 之間切換。平均值一定落在兩個位準之間。D 愈大,高位準停留愈久,平均值就愈靠近 10 V。',
    ask: { prompt: '平均值 5.2 V 離哪一個位準比較近?', options: ['10 V(離 VH 較近:差 4.8)', '−2 V(離 VL 較近:差 7.2)', '一樣近'], answer: 0, why: '5.2 − (−2) = 7.2;10 − 5.2 = 4.8。離 10 V 比較近,所以高位準的時間比較長,D 應該超過 50%。' },
    commonMistake: '以為平均值就是兩位準的中間值。只有 D = 50% 時才是。',
    hints: ['算算 5.2 離 10 V 和 −2 V 各差多少。', '離 10 V 差 4.8,離 −2 V 差 7.2。', '所以 D 應該大於 50%。'],
  },
  {
    id: 'principle', title: '選擇原理',
    teach: '平均值 = 各位準 × 該位準所占的時間比例加總:Vav = VH·D + VL·(1 − D)。',
    ask: { prompt: '哪個式子正確?', options: ['Vav = VH·D + VL·(1 − D)', 'Vav = (VH + VL) / 2', 'Vav = VH / √2'], answer: 0, why: '(VH+VL)/2 只在 D = 50% 時成立;÷√2 是弦波的有效值關係,與脈波平均值無關。不能看到「平均」就套 (a+b)/2。' },
    commonMistake: '看到「平均」就用 (VH + VL) / 2。',
    hints: ['平均值要考慮「各停留多久」。', '高位準占 D,低位準占 1 − D。', 'Vav = VH·D + VL·(1 − D)。'],
  },
  {
    id: 'formula', title: '建立算式',
    teach: '代入:5.2 = 10 × D + (−2) × (1 − D)。負號要跟著 VL 一起代入。',
    ask: { prompt: '代入後正確的式子是?', options: ['5.2 = 10D − 2(1 − D)', '5.2 = 10D + 2(1 − D)', '5.2 = 10 + (−2)D'], answer: 0, why: 'VL = −2,所以 (−2) × (1 − D) = −2(1 − D)。寫成「+ 2(1 − D)」是漏了負號;寫成「10 + (−2)D」是沒有乘上時間比例。' },
    commonMistake: '把 VL 的負號漏掉。',
    hints: ['VL 是 −2,不是 2。', 'VL 要乘上它的時間比例 (1 − D)。', '5.2 = 10D + (−2)(1 − D)。'],
  },
  {
    id: 'compute', title: '逐步運算',
    teach: '展開:10D − 2 + 2D = 12D − 2。所以 12D − 2 = 5.2 → 12D = 7.2 → D = 0.6 = 60%。',
    ask: { prompt: '12D − 2 = 5.2,D = ?', options: ['0.6', '0.27', '0.43'], answer: 0, why: '等號兩邊同加 2:12D = 7.2,再同除以 12:D = 0.6。0.27 是把 +2 做成 −2;0.43 是忘了加 2。' },
    commonMistake: '移項時符號沒變。−2 搬到右邊要變成 +2。',
    hints: ['先把 −2 移到等號右邊。', '移項後變 +2:12D = 5.2 + 2。', 'D = 7.2 ÷ 12。'],
    math: [{ title: '移項', tex: '12D-2=5.2\\;\\Rightarrow\\;12D=5.2+2=7.2\\;\\Rightarrow\\;D=\\dfrac{7.2}{12}=0.6', text: '等號兩邊做同樣的事,等式仍然成立。把 −2 搬到右邊,等於兩邊同時加 2。' }],
  },
  {
    id: 'verify', title: '驗證結果',
    teach: '回代:10 × 0.6 + (−2) × 0.4 = 6 − 0.8 = 5.2 ✓。D = 60% 介於 0~100%,而且大於 50%,與步驟 2 的判斷一致。',
    ask: { prompt: '把 D = 0.6 回代,平均值是?', options: ['5.2 V', '6 V', '4.8 V'], answer: 0, why: '10 × 0.6 = 6;(−2) × 0.4 = −0.8;6 − 0.8 = 5.2 V,與題目相同。' },
    commonMistake: '回代時只算高位準那一項(6 V)。',
    hints: ['兩個位準都要算。', '10 × 0.6 與 (−2) × 0.4。', '6 + (−0.8) = 5.2。'],
  },
]
export const variant_WB1_MC_14: Variant = {
  make: (seed) => {
    const vh = pick([8, 10, 12, 6, 5], seed)
    const vl = pick([-2, -4, 0, -1, -3], seed + 2)
    const d = pick([0.25, 0.4, 0.5, 0.6, 0.75], seed + 1)
    const avg = vh * d + vl * (1 - d)
    return {
      stem: `一週期性脈波信號,VH = ${vh} V,VL = ${vl} V,平均值為 ${fmt(avg)} V,則工作週期為多少?(請寫百分比,例如 60%)`,
      part: { label: '工作週期 D', value: dutyFromAverage(vh, vl, avg) * 100, unit: '%', relTol: 0.01 },
    }
  },
}
