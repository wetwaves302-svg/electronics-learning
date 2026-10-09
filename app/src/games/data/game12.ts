import type { GameDef, WaveSpec } from '../types'
import { dutyCycle, frequencyFromPeriod, pulseAverage, sineRms, sinePeak } from '../../core/physics'

const w = (type: WaveSpec['type'], extra: Partial<WaveSpec> = {}): WaveSpec => ({ type, vm: 1, ...extra })
const vis = (wave: WaveSpec) => ({ kind: 'wave' as const, wave })
const r2 = (x: number) => Math.round(x * 100) / 100

/** 示波器方格:水平每格 tPerDiv 秒、垂直每格 vPerDiv 伏,共 10×10 格 */
const scope = (type: WaveSpec['type'], vm: number, f: number, tPerDiv: number, vPerDiv: number): WaveSpec => ({
  type, vm, f, grid: { tPerDiv, vPerDiv, xDiv: 10, yDiv: 10 },
})

/* 1. 波形辨識與讀圖(圖像辨識 → 理解 → 簡單計算) */
const wave: GameDef = {
  id: 'g12-wave', unit: '1-2', title: '波形偵探', kind: ['symbol', 'figure', 'calc'],
  blurb: '看圖認出波形、讀懂圖上的資訊,再算出頻率與有效值。', outcomeVerb: '正確辨識與判讀',
  levels: [
    {
      level: 1, goal: '辨識:這是哪一種波形?',
      items: ([
        ['sine', '弦波', ['弦波', '方波', '三角波', '鋸齒波']],
        ['square', '方波', ['三角波', '方波', '鋸齒波', '直流']],
        ['triangle', '三角波', ['弦波', '方波', '三角波', '脈動直流']],
        ['sawtooth', '鋸齒波', ['鋸齒波', '三角波', '弦波', '方波']],
        ['dc', '直流', ['交流', '直流', '方波', '三角波']],
        ['pdc', '脈動直流', ['純直流', '弦波', '脈動直流', '方波']],
      ] as const).map(([t, name, opts]) => ({
        kind: 'choice' as const, kp: t === 'dc' || t === 'pdc' ? 'KP-12-01' : 'KP-12-09', can: name,
        prompt: '這是哪一種波形?', visual: vis(w(t)), options: opts.map((text) => ({ text })), answer: (opts as readonly string[]).indexOf(name),
        hint: t === 'dc' ? '電壓大小有沒有隨時間改變?' : t === 'pdc' ? '波形一直在 0 V 以上,極性沒有改變,但大小在變。' : t === 'sawtooth' ? '慢慢上升、突然掉下來。' : '看看波形的轉折是圓滑的還是尖的、是直上直下的還是斜線。',
        explain: `這是${name}。`,
      })),
    },
    {
      level: 2, goal: '理解:波形有什麼特性?',
      items: [
        { kind: 'choice', kp: 'KP-12-01', can: '交流', prompt: '哪一個是「交流」?(極性會正負交替)', options: [{ visual: vis(w('dc')) }, { visual: vis(w('pdc')) }, { visual: vis(w('sine')) }, { visual: vis(w('pulse', { duty: 0.4 })) }], answer: 2, hint: '交流的波形會穿過 0 V,有正的也有負的。', explain: '只有弦波有正有負;其他三個都在 0 V 以上,極性沒變。' },
        { kind: 'choice', kp: 'KP-12-06', can: '波形因數', prompt: '哪一個波形的波形因數 FF 與波峰因數 CF 都等於 1?', options: [{ visual: vis(w('sine')) }, { visual: vis(w('square')) }, { visual: vis(w('triangle')) }, { visual: vis(w('sawtooth')) }], answer: 1, hint: '這個波形的峰值、有效值、平均值(取絕對值)一樣大。', explain: '方波的電壓不是 +Vm 就是 −Vm,所以 Vm = Vrms = Vav,FF = CF = 1。' },
        { kind: 'choice', kp: 'KP-12-04', can: '正弦與餘弦', prompt: '這個弦波在 t = 0 時就在最高點,它是?', visual: vis(w('cosine')), options: [{ text: '正弦波 sin' }, { text: '餘弦波 cos' }], answer: 1, hint: 'sin 0° = 0;cos 0° = 1。t = 0 時的值是多少?', explain: '餘弦波在 t = 0 時是最大值,而 cos x = sin(x + 90°),就是把正弦波往左移 90°。' },
        { kind: 'choice', kp: 'KP-12-05', can: '工作週期', prompt: '矩形波中,「高位準時間 ÷ 整個週期」叫做?', visual: vis(w('pulse', { duty: 0.3 })), options: [{ text: '工作週期' }, { text: '頻率' }, { text: '波形因數' }], answer: 0, hint: '它是一個百分比,0%~100%。', explain: '工作週期 D = tH / (tH + tL)。圖中高位準約占 30%。' },
        { kind: 'choice', kp: 'KP-12-09', can: '波形合成', prompt: '哪一種波形可以組合出任何週期波形?', options: [{ text: '三角波' }, { text: '正弦波' }, { text: '方波' }], answer: 1, hint: '它也被稱為「各種交流的基本波」。', explain: '不同頻率的正弦波相加,可組合成任意週期波形。' },
        { kind: 'choice', kp: 'KP-12-03', can: '有效值', prompt: '弦波的有效值與峰值的關係是?', options: [{ text: 'Vrms = Vm × √2' }, { text: 'Vrms = Vm ÷ √2' }, { text: 'Vrms = Vm ÷ 2' }], answer: 1, hint: '有效值會比峰值小。', explain: 'Vrms = Vm/√2 ≈ 0.707 Vm。乘 √2 是由有效值求峰值。' },
      ],
    },
    {
      level: 3, goal: '應用:讀圖、換算、計算',
      items: [
        { kind: 'calc', kp: 'KP-12-02', can: '由波形圖求頻率', prompt: '示波器水平每格 5 ms,垂直每格 2 V。這個弦波的頻率是多少?(提示:數一個完整週期占幾格)', visual: vis(scope('sine', 6, 50, 0.005, 2)), part: { label: '頻率 f', value: 50, unit: 'Hz' }, hint: '從波形的一個波峰數到下一個波峰,占 4 格;1 格 = 5 ms。', explain: 'T = 4 格 × 5 ms = 20 ms,f = 1/T = 50 Hz。' },
        { kind: 'calc', kp: 'KP-12-03', can: '由波形圖求有效值', prompt: '示波器垂直每格 2 V。這個弦波的峰值是 6 V(3 格)。有效值是多少?', visual: vis(scope('sine', 6, 50, 0.005, 2)), part: { label: '有效值 Vrms', value: sineRms(6), unit: 'V', relTol: 0.01 }, hint: 'Vrms = Vm ÷ √2。', explain: `Vrms = 6 ÷ 1.414 ≈ ${r2(sineRms(6))} V。` },
        { kind: 'calc', kp: 'KP-12-02', can: '週期換頻率', prompt: '波形的週期是 50 μs,頻率是多少?(例如 20 kHz)', part: { label: '頻率 f', value: frequencyFromPeriod(50e-6), unit: 'Hz', relTol: 0.01 }, hint: 'f = 1 / T,先把 μs 換成秒:50 μs = 50×10⁻⁶ s。', explain: 'f = 1 / (50×10⁻⁶ s) = 20,000 Hz = 20 kHz。' },
        { kind: 'calc', kp: 'KP-12-03', can: '有效值換峰值', prompt: '插座上標示 AC 110 V,這個電壓的峰值約是多少?', part: { label: '峰值 Vm', value: sinePeak(110), unit: 'V', relTol: 0.01 }, hint: 'Vm = √2 × Vrms。', explain: `Vm = 1.414 × 110 ≈ ${r2(sinePeak(110))} V。` },
        { kind: 'calc', kp: 'KP-12-05', can: '計算工作週期', prompt: '脈波高位準時間 tH = 3 ms,低位準時間 tL = 2 ms,工作週期是多少?(例如 60%)', part: { label: '工作週期 D', value: dutyCycle(3, 2) * 100, unit: '%', relTol: 0.01 }, hint: 'D = tH ÷ (tH + tL)。', explain: 'D = 3 ÷ (3 + 2) = 60%。' },
        { kind: 'calc', kp: 'KP-12-05', can: '計算脈波平均值', prompt: '脈波高位準 5 V、低位準 0 V、工作週期 40%,平均值是多少?', part: { label: '平均值 Vav', value: pulseAverage(5, 0, 0.4), unit: 'V', relTol: 0.01 }, hint: 'Vav = VH × D + VL × (1 − D)。', explain: 'Vav = 5 × 0.4 + 0 × 0.6 = 2 V。' },
      ],
    },
  ],
}

/* 2. 公式配對(符號 → 公式 → 情境) */
const formula: GameDef = {
  id: 'g12-formula', unit: '1-2', title: '公式配對', kind: ['formulaMatch'],
  blurb: '把符號、公式與它代表的意思配成一對。', outcomeVerb: '連結符號與公式',
  levels: [
    {
      level: 1, goal: '辨識:符號代表什麼?',
      items: [{
        kind: 'match', prompt: '把左邊的符號,配上右邊的名稱。', hint: '先配最有把握的。T 和 f 是一對互相有關的量。', explain: 'f 頻率、T 週期、V_m 峰值、V_rms 有效值、D 工作週期、FF 波形因數。',
        pairs: [
          { left: 'f', right: '頻率', kp: 'KP-12-02', can: '頻率 f', leftTex: true },
          { left: 'T', right: '週期', kp: 'KP-12-02', can: '週期 T', leftTex: true },
          { left: 'V_m', right: '峰值', kp: 'KP-12-03', can: '峰值 Vm', leftTex: true },
          { left: 'V_{rms}', right: '有效值', kp: 'KP-12-03', can: '有效值 Vrms', leftTex: true },
          { left: 'D', right: '工作週期', kp: 'KP-12-05', can: '工作週期 D', leftTex: true },
          { left: 'FF', right: '波形因數', kp: 'KP-12-06', can: '波形因數 FF', leftTex: true },
        ],
      }],
    },
    {
      level: 2, goal: '記憶與理解:公式代表什麼關係?',
      items: [{
        kind: 'match', prompt: '把公式配上它的意思。', hint: '看公式裡有哪些符號:有 t_H 的和時間比例有關;有 V_rms 的和有效值有關。', explain: '每個公式都有適用條件,例如 V_rms = V_m/√2 只適用弦波。',
        pairs: [
          { left: 'f=\\dfrac{1}{T}', right: '頻率與週期互為倒數', kp: 'KP-12-02', can: '頻率與週期的關係', leftTex: true },
          { left: 'V_{rms}=\\dfrac{V_m}{\\sqrt{2}}', right: '弦波的有效值', kp: 'KP-12-03', can: '弦波有效值公式', leftTex: true },
          { left: 'D=\\dfrac{t_H}{t_H+t_L}', right: '工作週期', kp: 'KP-12-05', can: '工作週期公式', leftTex: true },
          { left: 'FF=\\dfrac{V_{rms}}{V_{av}}', right: '波形因數', kp: 'KP-12-06', can: '波形因數公式', leftTex: true },
          { left: 'CF=\\dfrac{V_m}{V_{rms}}', right: '波峰因數', kp: 'KP-12-06', can: '波峰因數公式', leftTex: true },
          { left: 'V_{av}=V_H D+V_L(1-D)', right: '脈波的平均值', kp: 'KP-12-05', can: '脈波平均值公式', leftTex: true },
        ],
      }],
    },
    {
      level: 3, goal: '應用:遇到這種題目,該用哪個公式?',
      items: [{
        kind: 'match', prompt: '把題目情境配上該用的公式。', hint: '先找題目「給了什麼」和「要求什麼」。', explain: '選公式要看已知與未知,不是看關鍵字。',
        pairs: [
          { left: '已知週期 T,求頻率', right: 'f=\\dfrac{1}{T}', kp: 'KP-12-02', can: '週期求頻率', rightTex: true },
          { left: '已知 AC 110 V(有效值),求峰值', right: 'V_m=\\sqrt{2}\\,V_{rms}', kp: 'KP-12-03', can: '有效值求峰值', rightTex: true },
          { left: '已知 t_H 與 t_L,求工作週期', right: 'D=\\dfrac{t_H}{t_H+t_L}', kp: 'KP-12-05', can: '求工作週期', rightTex: true },
          { left: '已知高低位準與 D,求平均值', right: 'V_{av}=V_H D+V_L(1-D)', kp: 'KP-12-05', can: '求脈波平均值', rightTex: true },
          { left: '已知 V_rms 與整流平均值,求 FF', right: 'FF=\\dfrac{V_{rms}}{V_{av}}', kp: 'KP-12-06', can: '求波形因數', rightTex: true },
        ],
      }],
    },
  ],
}

/* 3. 名詞配對 */
const term: GameDef = {
  id: 'g12-term', unit: '1-2', title: '名詞配對', kind: ['termMatch'],
  blurb: '把電子學名詞和它的單位、定義、生活例子連起來。', outcomeVerb: '說出名詞的意思',
  levels: [
    {
      level: 1, goal: '辨識:名詞和單位',
      items: [{
        kind: 'match', prompt: '把物理量配上它的單位。', hint: '頻率的單位是以一位科學家命名的。', explain: '週期 s、頻率 Hz、電壓 V、電流 A、電阻 Ω。',
        pairs: [
          { left: '週期', right: '秒(s)', kp: 'KP-12-02', can: '週期的單位' },
          { left: '頻率', right: '赫茲(Hz)', kp: 'KP-12-02', can: '頻率的單位' },
          { left: '電壓', right: '伏特(V)', kp: 'KP-12-03', can: '電壓的單位' },
          { left: '電流', right: '安培(A)', kp: 'KP-12-03', can: '電流的單位' },
          { left: '電阻', right: '歐姆(Ω)', kp: 'KP-12-03', can: '電阻的單位' },
        ],
      }],
    },
    {
      level: 2, goal: '理解:名詞的定義',
      items: [{
        kind: 'match', prompt: '把名詞配上它的定義。', hint: '有效值和「發熱」有關;工作週期是一個「比例」。', explain: '有效值是與直流在同一電阻上產生相同熱效應的電壓。',
        pairs: [
          { left: '週期', right: '波形重複一次所需的時間', kp: 'KP-12-02', can: '週期的定義' },
          { left: '頻率', right: '每秒重複的次數', kp: 'KP-12-02', can: '頻率的定義' },
          { left: '峰值', right: '波形的最高點電壓', kp: 'KP-12-03', can: '峰值的定義' },
          { left: '有效值', right: '與直流在電阻上產生相同熱量的電壓', kp: 'KP-12-03', can: '有效值的定義' },
          { left: '工作週期', right: '高位準時間占整個週期的比例', kp: 'KP-12-05', can: '工作週期的定義' },
          { left: '相位差', right: '同頻率兩波形的角度差', kp: 'KP-12-07', can: '相位差的定義' },
        ],
      }],
    },
    {
      level: 3, goal: '應用:生活中哪裡看得到?',
      items: [{
        kind: 'match', prompt: '把波形配上它常出現的地方。', hint: '想想乾電池、家裡的插座,還有整流器的輸出。', explain: '乾電池輸出純直流;插座是弦波交流;整流後未濾波是脈動直流;示波器掃描用鋸齒波;數位電路的時脈是方波/脈波。',
        pairs: [
          { left: '純直流', right: '乾電池的輸出', kp: 'KP-12-01', can: '純直流的例子' },
          { left: '弦波交流', right: '家用插座的電源', kp: 'KP-12-01', can: '交流的例子' },
          { left: '脈動直流', right: '整流後還沒濾波的輸出', kp: 'KP-12-01', can: '脈動直流的例子' },
          { left: '鋸齒波', right: '示波器的掃描信號', kp: 'KP-12-09', can: '鋸齒波的例子' },
          { left: '方波(脈波)', right: '數位電路的時脈信號', kp: 'KP-12-09', can: '方波的例子' },
        ],
      }],
    },
  ],
}

/* 4. 分類 */
const classify: GameDef = {
  id: 'g12-classify', unit: '1-2', title: '波形分類站', kind: ['classify'],
  blurb: '把波形或說法分到正確的類別。', outcomeVerb: '分類',
  levels: [
    {
      level: 1, goal: '辨識:直流、脈動直流還是交流?',
      items: [{
        kind: 'classify', prompt: '這個波形是哪一類?', buckets: ['純直流', '脈動直流', '交流'], hint: '看兩件事:大小有沒有變?極性(正負)有沒有變?', explain: '大小不變:純直流;大小變、極性不變:脈動直流;極性會變:交流。',
        things: [
          { visual: vis(w('dc')), bucket: 0, kp: 'KP-12-01', can: '純直流' },
          { visual: vis(w('pdc')), bucket: 1, kp: 'KP-12-01', can: '脈動直流' },
          { visual: vis(w('sine')), bucket: 2, kp: 'KP-12-01', can: '弦波是交流' },
          { visual: vis(w('pulse', { duty: 0.5 })), bucket: 1, kp: 'KP-12-01', can: '正的矩形脈波是脈動直流' },
          { visual: vis(w('square')), bucket: 2, kp: 'KP-12-01', can: '方波是交流' },
          { visual: vis(w('triangle')), bucket: 2, kp: 'KP-12-01', can: '三角波是交流' },
        ],
      }],
    },
    {
      level: 2, goal: '記憶:波峰因數是多少?',
      items: [{
        kind: 'classify', prompt: '這個波形的波峰因數 CF 是哪一個?', buckets: ['CF = 1', 'CF = √2', 'CF = √3'], hint: '方波最小(是 1)。弦波的 Vm/Vrms = √2。三角波的 Vrms = Vm/√3。', explain: '方波 CF = 1;弦波 CF = √2 ≈ 1.414;三角波、鋸齒波 CF = √3 ≈ 1.732。',
        things: [
          { visual: vis(w('square')), bucket: 0, kp: 'KP-12-06', can: '方波的波峰因數' },
          { visual: vis(w('sine')), bucket: 1, kp: 'KP-12-06', can: '弦波的波峰因數' },
          { visual: vis(w('triangle')), bucket: 2, kp: 'KP-12-06', can: '三角波的波峰因數' },
          { visual: vis(w('sawtooth')), bucket: 2, kp: 'KP-12-06', can: '鋸齒波的波峰因數' },
          { visual: vis(w('cosine')), bucket: 1, kp: 'KP-12-06', can: '餘弦波的波峰因數' },
        ],
      }],
    },
    {
      level: 3, goal: '應用:這是峰值、有效值還是平均值?',
      items: [{
        kind: 'classify', prompt: '這句話在說哪一個量?', buckets: ['峰值', '有效值', '平均值'], hint: '峰值是最高點;有效值和發熱有關;平均值是「依時間比例加權」。', explain: '插座上標示的 110 V 是有效值;波形最高點是峰值;V_H·D + V_L·(1−D) 是平均值。',
        things: [
          { text: '插座上標示的 110 V', bucket: 1, kp: 'KP-12-03', can: '插座電壓是有效值' },
          { text: '波形最高點的電壓', bucket: 0, kp: 'KP-12-03', can: '峰值' },
          { text: '與直流在電阻上產生相同熱量', bucket: 1, kp: 'KP-12-03', can: '有效值的意義' },
          { text: 'VH × D + VL × (1 − D)', bucket: 2, kp: 'KP-12-05', can: '脈波平均值' },
          { text: '示波器上波峰到 0 V 的高度', bucket: 0, kp: 'KP-12-03', can: '由圖讀峰值' },
        ],
      }],
    },
  ],
}

/* 5. 公式拼圖 */
const puzzle: GameDef = {
  id: 'g12-puzzle', unit: '1-2', title: '公式拼圖', kind: ['puzzle'],
  blurb: '把打散的方塊,依序拼成正確的公式。', outcomeVerb: '拼出公式',
  levels: [
    {
      level: 1, goal: '辨識:簡單公式',
      items: ([
        ['KP-12-02', '頻率公式', '把週期換成頻率的公式', ['f', '=', '\\dfrac{1}{T}']],
        ['KP-12-02', '週期公式', '把頻率換成週期的公式', ['T', '=', '\\dfrac{1}{f}']],
        ['KP-12-06', '波形因數公式', '波形因數 FF 的公式', ['FF', '=', '\\dfrac{V_{rms}}{V_{av}}']],
        ['KP-12-06', '波峰因數公式', '波峰因數 CF 的公式', ['CF', '=', '\\dfrac{V_m}{V_{rms}}']],
        ['KP-12-03', '峰值公式', '由有效值求峰值的公式', ['V_m', '=', '\\sqrt{2}', 'V_{rms}']],
      ] as const).map(([kp, can, prompt, tokens]) => ({ kind: 'puzzle' as const, kp, can, prompt: `拼出${prompt}。`, tokens: [...tokens], hint: '等號左邊是要求的量。', explain: `${tokens.join(' ')}。` })),
    },
    {
      level: 2, goal: '記憶與理解:有分數與加法的公式',
      items: [
        { kind: 'puzzle', kp: 'KP-12-03', can: '弦波有效值公式', prompt: '拼出弦波有效值公式。', tokens: ['V_{rms}', '=', '\\dfrac{V_m}{\\sqrt{2}}'], hint: '有效值比峰值小,所以峰值要「除」以 √2。', explain: 'V_rms = V_m / √2。' },
        { kind: 'puzzle', kp: 'KP-12-05', can: '工作週期公式', prompt: '拼出工作週期公式。', tokens: ['D', '=', '\\dfrac{t_H}{t_H+t_L}'], hint: '分子是高位準時間,分母是整個週期。', explain: 'D = t_H / (t_H + t_L)。' },
        { kind: 'puzzle', kp: 'KP-12-05', can: '脈波平均值公式', prompt: '拼出脈波平均值公式。', tokens: ['V_{av}', '=', 'V_H', 'D', '+', 'V_L', '(1-D)'], hint: '兩個位準各乘上自己所占的時間比例,再相加。', explain: 'V_av = V_H·D + V_L·(1 − D)。' },
        { kind: 'puzzle', kp: 'KP-12-04', can: '弦波瞬時式', prompt: '拼出弦波瞬時值表示式。', tokens: ['v(t)', '=', 'V_m', '\\sin', '(2\\pi f t)'], hint: '峰值乘上正弦函數,角度是 2πft。', explain: 'v(t) = V_m sin(2πft)。' },
        { kind: 'puzzle', kp: 'KP-12-07', can: '餘弦換正弦', prompt: '拼出把 cos 換成 sin 的關係式。', tokens: ['\\cos x', '=', '\\sin', '(x+90^\\circ)'], hint: 'cos 比 sin 超前 90°。', explain: 'cos x = sin(x + 90°)。' },
      ],
    },
    {
      level: 3, goal: '應用:較完整的公式',
      items: [
        { kind: 'puzzle', kp: 'KP-12-08', can: '混合波有效值公式', prompt: '拼出交直流混合波的有效值公式。', tokens: ['V_{rms}', '=', '\\sqrt{V_{dc}^{2}+V_{ac,rms}^{2}}'], hint: '先平方、再相加、再開根號;不是直接把有效值相加。', explain: 'V_rms = √(V_dc² + V_ac,rms²)。' },
        { kind: 'puzzle', kp: 'KP-12-05', can: '由平均值反求工作週期', prompt: '把平均值公式移項,拼出由平均值求工作週期 D 的式子。', tokens: ['D', '=', '\\dfrac{V_{av}-V_L}{V_H-V_L}'], hint: '從 V_av = V_L + D(V_H − V_L) 移項。', explain: 'D = (V_av − V_L) / (V_H − V_L)。' },
        { kind: 'puzzle', kp: 'KP-12-04', can: '角頻率與頻率', prompt: '拼出由頻率求角頻率 ω 的公式。', tokens: ['\\omega', '=', '2\\pi', 'f'], hint: '一圈是 2π 弧度,每秒轉 f 圈。', explain: 'ω = 2πf。例如 f = 50 Hz,ω ≈ 314 rad/s(習作第 1 章選擇題 11 的 314)。' },
        { kind: 'puzzle', kp: 'KP-12-04', can: '由角頻率求頻率', prompt: '拼出由角頻率 ω 求頻率 f 的公式。', tokens: ['f', '=', '\\dfrac{\\omega}{2\\pi}'], hint: '把 ω = 2πf 移項。', explain: 'f = ω / 2π。例如 ω = 314 rad/s,f ≈ 50 Hz。' },
        { kind: 'puzzle', kp: 'KP-12-06', can: '弦波波形因數', prompt: '拼出弦波波形因數的式子。', tokens: ['FF', '=', '\\dfrac{\\pi}{2\\sqrt{2}}', '\\approx 1.11'], hint: '把 V_rms = V_m/√2 和 V_av = 2V_m/π 代入 FF = V_rms/V_av。', explain: 'FF = (V_m/√2) / (2V_m/π) = π/(2√2) ≈ 1.11。' },
      ],
    },
  ],
}

export const games12: GameDef[] = [wave, formula, term, classify, puzzle]
