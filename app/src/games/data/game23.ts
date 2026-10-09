import type { CircuitName, ChoiceItem, GameDef, GameItem, SymbolName } from '../types'
import { fullWave, halfWave, pivBridge, pivCenterTapFullWave, pivHalfWave, sinePeak, filteredDc, transformerSecondaryPeak } from '../../core/physics'
import { solveRectifier } from '../../core/rectifier'

const r2 = (x: number) => Math.round(x * 100) / 100
const circ = (circuit: CircuitName, v = 1) => ({ kind: 'circuit' as const, circuit, v, plain: true })
const sym = (symbol: SymbolName) => ({ kind: 'symbol' as const, symbol })

/** 由求解器取得某瞬間導通的二極體,格式「D1、D3」;沒有則「沒有二極體導通」 */
const onSet = (kind: CircuitName, v: number) => {
  const s = solveRectifier(kind, v, 100)
  const ids = Object.keys(s.on).filter((k) => s.on[k])
  return ids.length ? ids.join('、') : '沒有二極體導通'
}

const NAMES: Record<CircuitName, string> = { half: '半波整流', centerTap: '中心抽頭全波整流', bridge: '橋式全波整流' }

/* 1. 電路偵探:符號 → 電路類型 → 導通狀態 */
const circuit: GameDef = {
  id: 'g23-circuit', unit: '2-3', title: '電路偵探', kind: ['symbol', 'figure'],
  blurb: '認得元件符號、分辨整流電路,再判斷這一刻誰導通。', outcomeVerb: '辨識與判讀',
  levels: [
    {
      level: 1, goal: '辨識:這是什麼元件?',
      items: ([
        ['diode', '二極體', ['電阻', '二極體', '電容', '變壓器']],
        ['resistor', '電阻', ['電阻', '二極體', '電容', '接地']],
        ['capacitor', '電容', ['電阻', '變壓器', '電容', '二極體']],
        ['transformer', '變壓器', ['交流電源', '電容', '二極體', '變壓器']],
        ['ground', '接地', ['接地', '電阻', '電容', '交流電源']],
        ['acSource', '交流電源', ['變壓器', '接地', '交流電源', '電阻']],
      ] as const).map(([s, name, opts]) => ({
        kind: 'choice' as const, kp: 'KP-23-07', can: name, prompt: '這個符號代表什麼?', visual: sym(s),
        options: opts.map((text) => ({ text })), answer: (opts as readonly string[]).indexOf(name),
        hint: s === 'diode' ? '三角形加一條直線,電流從三角形的底邊流向直線。' : s === 'resistor' ? '鋸齒狀的折線。' : s === 'capacitor' ? '兩片平行的板子。' : s === 'transformer' ? '兩組線圈中間隔著鐵芯。' : s === 'ground' ? '像一個倒立的階梯。' : '圓圈裡有一個正弦波。',
        explain: `這是${name}的符號。`,
      })),
    },
    {
      level: 2, goal: '理解:這是哪一種整流電路?',
      items: ([['half', 1], ['centerTap', 1], ['bridge', 1], ['bridge', -1], ['half', -1], ['centerTap', -1]] as [CircuitName, number][]).map(([c, v]) => ({
        kind: 'choice' as const, kp: 'KP-23-07', can: NAMES[c], prompt: '這是哪一種整流電路?', visual: circ(c, v),
        options: (['half', 'centerTap', 'bridge'] as CircuitName[]).map((k) => ({ text: NAMES[k] })), answer: (['half', 'centerTap', 'bridge'] as CircuitName[]).indexOf(c),
        hint: c === 'half' ? '數一數二極體有幾顆。' : c === 'centerTap' ? '變壓器次級有一個接地的中心抽頭,有 2 顆二極體。' : '有 4 顆二極體排成方框。',
        explain: `${NAMES[c]}:${c === 'half' ? '1 顆二極體' : c === 'centerTap' ? '2 顆二極體 + 次級中心抽頭' : '4 顆二極體排成橋'}。`,
      })),
    },
    {
      level: 3, goal: '應用:這一刻哪些二極體導通?',
      items: ([['half', 1], ['half', -1], ['centerTap', 1], ['centerTap', -1], ['bridge', 1], ['bridge', -1]] as [CircuitName, number][]).map(([c, v]) => {
        const optsByKind: Record<CircuitName, string[]> = {
          half: ['D1', '沒有二極體導通'],
          centerTap: ['D1', 'D2', 'D1、D2', '沒有二極體導通'],
          bridge: ['D1、D3', 'D2、D4', 'D1、D4', 'D2、D3'],
        }
        const opts = optsByKind[c]
        const ans = onSet(c, v)
        return {
          kind: 'choice' as const, kp: 'KP-23-02', can: `${NAMES[c]}的導通路徑`,
          prompt: `輸入電壓目前${v > 0 ? '上端為正' : '下端為正'}(圖上有標 + −)。哪些二極體導通?`, visual: circ(c, v),
          options: opts.map((text) => ({ text })), answer: opts.indexOf(ans),
          hint: '二極體的陽極電位高於陰極時才導通。先找出目前電位最高的那一端,順著箭頭方向走。',
          explain: `答案:${ans}。電流從電位高的端出發,經導通的二極體與負載,再回到電源。`,
        } satisfies ChoiceItem
      }),
    },
  ],
}

/* 2. 公式配對 */
const formula: GameDef = {
  id: 'g23-formula', unit: '2-3', title: '整流公式配對', kind: ['formulaMatch'],
  blurb: '把整流的符號、公式與適用情境配成對。', outcomeVerb: '連結整流的符號與公式',
  levels: [
    {
      level: 1, goal: '辨識:符號代表什麼?',
      items: [{
        kind: 'match', prompt: '把符號配上名稱。', hint: '先配 V_m 和 V_rms,它們你在 1-2 學過。', explain: 'V_m 峰值、V_dc 直流平均值、V_rms 有效值、PIV 峰值逆向電壓、r 漣波因數、V_r(pp) 漣波峰對峰值。',
        pairs: [
          { left: 'V_m', right: '峰值', kp: 'KP-23-03', can: '峰值 Vm', leftTex: true },
          { left: 'V_{dc}', right: '直流平均值', kp: 'KP-23-03', can: '直流平均值 Vdc', leftTex: true },
          { left: 'V_{rms}', right: '有效值', kp: 'KP-23-03', can: '有效值 Vrms', leftTex: true },
          { left: 'PIV', right: '峰值逆向電壓', kp: 'KP-23-01', can: 'PIV' },
          { left: 'r', right: '漣波因數', kp: 'KP-23-04', can: '漣波因數 r', leftTex: true },
          { left: 'V_{r(pp)}', right: '漣波峰對峰值', kp: 'KP-23-05', can: '漣波峰對峰值', leftTex: true },
        ],
      }],
    },
    {
      level: 2, goal: '記憶與理解:這個公式用在哪裡?',
      items: [{
        kind: 'match', prompt: '把公式配上它的用途。', hint: '看係數:有 2 的通常是全波;分母是 π 的是平均值。', explain: '半波:V_dc = V_m/π,V_rms = V_m/2;全波:V_dc = 2V_m/π,V_rms = V_m/√2。',
        pairs: [
          { left: 'V_{dc}=\\dfrac{V_m}{\\pi}', right: '半波整流的直流平均值', kp: 'KP-23-03', can: '半波 Vdc 公式', leftTex: true },
          { left: 'V_{dc}=\\dfrac{2V_m}{\\pi}', right: '全波整流的直流平均值', kp: 'KP-23-03', can: '全波 Vdc 公式', leftTex: true },
          { left: 'V_{rms}=\\dfrac{V_m}{2}', right: '半波整流輸出的有效值', kp: 'KP-23-03', can: '半波 Vrms 公式', leftTex: true },
          { left: 'V_{rms}=\\dfrac{V_m}{\\sqrt{2}}', right: '全波整流輸出的有效值', kp: 'KP-23-03', can: '全波 Vrms 公式', leftTex: true },
          { left: 'r=\\sqrt{\\left(\\dfrac{V_{rms}}{V_{dc}}\\right)^{2}-1}', right: '漣波因數', kp: 'KP-23-04', can: '漣波因數公式', leftTex: true },
          { left: 'V_{dc}\\approx V_p-\\dfrac{V_{r(pp)}}{2}', right: '濾波後的直流平均值(近似)', kp: 'KP-23-05', can: '濾波直流公式', leftTex: true },
        ],
      }],
    },
    {
      level: 3, goal: '應用:遇到這種題目,該用哪個公式?',
      items: [{
        kind: 'match', prompt: '把題目情境配上該用的公式。', hint: '先確定「已知什麼、要求什麼」,再挑公式。', explain: '先用變壓器公式換出次級峰值,再依整流方式套公式。',
        pairs: [
          { left: '已知 N1:N2 與輸入峰值,求次級峰值', right: 'V_{s(m)}=\\dfrac{N_2}{N_1}V_{i(m)}', kp: 'KP-23-06', can: '變壓器求次級峰值', rightTex: true },
          { left: '中心抽頭全波,已知每半邊峰值,求 PIV', right: 'PIV=2V_{s(m)}', kp: 'KP-23-02', can: '中心抽頭的 PIV', rightTex: true },
          { left: '已知輸入頻率,求全波輸出頻率', right: 'f_o=2f_i', kp: 'KP-23-03', can: '全波輸出頻率', rightTex: true },
          { left: '已知濾波後峰值與漣波峰對峰,求平均', right: 'V_{dc}\\approx V_p-\\dfrac{V_{r(pp)}}{2}', kp: 'KP-23-05', can: '濾波後的平均值', rightTex: true },
          { left: '已知半波整流峰值,求直流平均', right: 'V_{dc}=\\dfrac{V_m}{\\pi}', kp: 'KP-23-03', can: '半波直流平均', rightTex: true },
        ],
      }],
    },
  ],
}

/* 3. 整流分類站 */
const classify: GameDef = {
  id: 'g23-classify', unit: '2-3', title: '整流分類站', kind: ['classify'],
  blurb: '把電路特性分到半波、中心抽頭全波或橋式。', outcomeVerb: '分類整流電路',
  levels: [
    {
      level: 1, goal: '辨識:哪一種電路?',
      items: [{
        kind: 'classify', prompt: '這句話描述的是哪一種整流電路?', buckets: ['半波整流', '中心抽頭全波', '橋式全波'], hint: '先想二極體各有幾顆、變壓器有沒有中心抽頭。', explain: '半波 1 顆二極體;中心抽頭全波 2 顆 + 中心抽頭;橋式 4 顆。',
        things: [
          { text: '只需要 1 顆二極體', bucket: 0, kp: 'KP-23-07', can: '半波的二極體數量' },
          { text: '變壓器次級要有中心抽頭', bucket: 1, kp: 'KP-23-07', can: '中心抽頭電路的特徵' },
          { text: '需要 4 顆二極體', bucket: 2, kp: 'KP-23-07', can: '橋式的二極體數量' },
          { text: '輸出頻率等於輸入頻率', bucket: 0, kp: 'KP-23-03', can: '半波的輸出頻率' },
          { text: '任何時刻都有 2 顆二極體同時導通', bucket: 2, kp: 'KP-23-02', can: '橋式的導通數量' },
          { text: '每個半週輪流由 1 顆二極體導通,共 2 顆', bucket: 1, kp: 'KP-23-02', can: '中心抽頭的導通方式' },
        ],
      }],
    },
    {
      level: 2, goal: '理解:PIV 怎麼算?',
      items: [{
        kind: 'classify', prompt: '這個電路的 PIV 屬於哪一類?(Vs(m) 為每半邊或次級的峰值,依電路而定)', buckets: ['PIV = 次級峰值', 'PIV = 2 × 每半邊峰值'], hint: '只有一種電路的二極體截止時,另一半邊的電壓也會加進來。', explain: '半波與橋式的 PIV = 次級峰值;中心抽頭全波截止的二極體承受兩個半邊,PIV = 2 × 每半邊峰值。',
        things: [
          { visual: circ('half'), bucket: 0, kp: 'KP-23-01', can: '半波的 PIV' },
          { visual: circ('centerTap'), bucket: 1, kp: 'KP-23-02', can: '中心抽頭的 PIV' },
          { visual: circ('bridge'), bucket: 0, kp: 'KP-23-02', can: '橋式的 PIV' },
          { text: '只用 1 顆二極體的整流電路', bucket: 0, kp: 'KP-23-01', can: '半波的 PIV' },
          { text: '次級有中心抽頭、2 顆二極體的整流電路', bucket: 1, kp: 'KP-23-02', can: '中心抽頭的 PIV' },
        ],
      }],
    },
    {
      level: 3, goal: '應用:輸出頻率是多少?(輸入 60 Hz)',
      items: [{
        kind: 'classify', prompt: '輸入 60 Hz 的交流,下列電路的輸出(或漣波)頻率是?', buckets: ['60 Hz', '120 Hz'], hint: '半波每個輸入週期一個脈動;全波兩個。濾波不改變脈動的頻率。', explain: '半波:60 Hz;中心抽頭全波與橋式:120 Hz。加上濾波電容,漣波頻率不變。',
        things: [
          { visual: circ('half'), bucket: 0, kp: 'KP-23-03', can: '半波的輸出頻率' },
          { visual: circ('centerTap'), bucket: 1, kp: 'KP-23-03', can: '中心抽頭的輸出頻率' },
          { visual: circ('bridge'), bucket: 1, kp: 'KP-23-03', can: '橋式的輸出頻率' },
          { text: '半波整流後再接濾波電容的漣波', bucket: 0, kp: 'KP-23-05', can: '半波濾波後的漣波頻率' },
          { text: '橋式整流後再接濾波電容的漣波', bucket: 1, kp: 'KP-23-05', can: '全波濾波後的漣波頻率' },
        ],
      }],
    },
  ],
}

/* 4. 簡單計算 */
const calcItem = (kp: string, can: string, prompt: string, label: string, value: number, unit: string, hint: string, explain: string, relTol = 0.01): GameItem => ({
  kind: 'calc', kp, can, prompt, part: { label, value, unit, relTol }, hint, explain,
})
const calc: GameDef = {
  id: 'g23-calc', unit: '2-3', title: '整流小算盤', kind: ['calc'],
  blurb: '用公式代入,算出頻率、PIV、直流平均與有效值。', outcomeVerb: '計算',
  levels: [
    {
      level: 1, goal: '辨識:直接套用一個公式',
      items: [
        calcItem('KP-23-01', '半波的 PIV', '半波整流,次級峰值 20 V,二極體的 PIV 是多少?', 'PIV', pivHalfWave(20), 'V', '半波:PIV = Vm。', 'PIV = Vm = 20 V。'),
        calcItem('KP-23-03', '全波的輸出頻率', '60 Hz 的交流經全波整流,輸出頻率是多少?(例如 120 Hz)', '輸出頻率', 60 * fullWave(1).freqMultiplier, 'Hz', '全波輸出頻率是輸入的幾倍?', 'fo = 2 × 60 = 120 Hz。'),
        calcItem('KP-23-03', '半波的輸出頻率', '50 Hz 的交流經半波整流,輸出頻率是多少?', '輸出頻率', 50 * halfWave(1).freqMultiplier, 'Hz', '半波每個輸入週期只有一個脈動。', 'fo = 50 Hz,與輸入相同。'),
        calcItem('KP-23-02', '橋式的 PIV', '橋式整流,次級峰值 15 V,每顆二極體的 PIV 是多少?', 'PIV', pivBridge(15), 'V', '橋式:PIV = 次級峰值。', 'PIV = 15 V。'),
        calcItem('KP-23-03', '半波有效值', '半波整流輸出的峰值 10 V,有效值是多少?', 'Vrms', halfWave(10).vo_rms, 'V', '半波:Vrms = Vm/2。', 'Vrms = 10/2 = 5 V。'),
        calcItem('KP-23-03', '全波有效值', '全波整流輸出的峰值 10 V,有效值是多少?', 'Vrms', fullWave(10).vo_rms, 'V', '全波:Vrms = Vm/√2。', `Vrms = 10/1.414 ≈ ${r2(fullWave(10).vo_rms)} V。`),
      ],
    },
    {
      level: 2, goal: '記憶與理解:直流平均值',
      items: [
        calcItem('KP-23-03', '半波直流平均', '半波整流輸出的峰值 10 V,直流平均值是多少?', 'Vdc', halfWave(10).vo_dc, 'V', 'Vdc = Vm/π(π ≈ 3.14)。', `Vdc = 10/3.14 ≈ ${r2(halfWave(10).vo_dc)} V。`),
        calcItem('KP-23-03', '全波直流平均', '全波整流輸出的峰值 10 V,直流平均值是多少?', 'Vdc', fullWave(10).vo_dc, 'V', 'Vdc = 2Vm/π。', `Vdc = 20/3.14 ≈ ${r2(fullWave(10).vo_dc)} V。`),
        calcItem('KP-23-03', '半波直流平均', '半波整流輸出的峰值 20 V,直流平均值是多少?', 'Vdc', halfWave(20).vo_dc, 'V', 'Vdc = Vm/π。', `Vdc = 20/3.14 ≈ ${r2(halfWave(20).vo_dc)} V。`),
        calcItem('KP-23-03', '直流電流', '全波整流的 Vdc = 6.37 V,負載 RL = 100 Ω,直流電流是多少?(例如 63.7 mA)', 'Idc', 6.37 / 100, 'A', '歐姆定律:I = V / R。', 'Idc = 6.37 V / 100 Ω = 0.0637 A = 63.7 mA。'),
        calcItem('KP-23-04', '漣波因數', '全波整流(無濾波)的漣波因數是多少?(請寫百分比)', '漣波因數 r', Math.round(fullWave(10).rippleFactor * 100), '%', 'r = √[(Vrms/Vdc)² − 1],全波 Vrms/Vdc ≈ 1.11。', 'r = √(1.11² − 1) ≈ 0.48 = 48%。', 0.02),
        calcItem('KP-23-04', '半波漣波因數', '半波整流(無濾波)的漣波因數是多少?(請寫百分比)', '漣波因數 r', Math.round(halfWave(10).rippleFactor * 100), '%', '半波 Vrms/Vdc = π/2 ≈ 1.57。', 'r = √(1.57² − 1) ≈ 1.21 = 121%。', 0.02),
      ],
    },
    {
      level: 3, goal: '應用:變壓器、濾波與 PIV',
      items: [
        calcItem('KP-23-06', '變壓器求次級峰值', '輸入 AC 100 V(有效值),變壓器 10:1,次級峰值是多少?', 'Vs(m)', transformerSecondaryPeak(sinePeak(100), 10, 1), 'V', '先把有效值換成峰值,再乘匝數比 N2/N1。', `Vs(m) = (1/10) × 141.4 ≈ ${r2(transformerSecondaryPeak(sinePeak(100), 10, 1))} V。`),
        calcItem('KP-23-03', '變壓器加半波整流', '輸入 AC 100 V,變壓器 10:1,半波整流。輸出直流平均值是多少?', 'Vdc', halfWave(transformerSecondaryPeak(sinePeak(100), 10, 1)).vo_dc, 'V', '先求次級峰值 14.14 V,再 Vdc = Vm/π。', 'Vdc = 14.14/3.14 ≈ 4.5 V。'),
        calcItem('KP-23-03', '電流的直流平均', '上一題輸出 Vdc ≈ 4.5 V,RL = 100 Ω,直流電流是多少?(例如 45 mA)', 'Idc', halfWave(transformerSecondaryPeak(sinePeak(100), 10, 1)).vo_dc / 100, 'A', 'I = V / R。', 'Idc ≈ 4.5 / 100 = 0.045 A = 45 mA。'),
        calcItem('KP-23-05', '濾波後直流', '濾波電路輸出峰值 18 V,漣波峰對峰值 2 V,直流平均值是多少?', 'Vdc', filteredDc(18, 2), 'V', 'Vdc ≈ Vp − Vr(pp)/2。', 'Vdc = 18 − 2/2 = 17 V。'),
        calcItem('KP-23-02', '中心抽頭的 PIV', '輸入 AC 110 V,變壓器 110:24,中心抽頭全波整流,PIV 約是多少?(例如 33.9 V)', 'PIV', pivCenterTapFullWave(transformerSecondaryPeak(sinePeak(110), 110, 24) / 2), 'V', '每半邊有效值 12 V → 峰值 12√2;PIV = 2 × 每半邊峰值。', 'PIV = 2 × 12 × 1.414 ≈ 33.9 V。'),
        calcItem('KP-23-03', '全波輸出頻率', '輸入頻率 400 Hz(飛機電源),橋式整流,輸出頻率是多少?', '輸出頻率', 800, 'Hz', '橋式是全波整流。', 'fo = 2 × 400 = 800 Hz。'),
      ],
    },
  ],
}

/* 5. 公式拼圖 */
const pz = (kp: string, can: string, prompt: string, tokens: string[], hint: string, explain: string): GameItem => ({ kind: 'puzzle', kp, can, prompt, tokens, hint, explain })
const puzzle: GameDef = {
  id: 'g23-puzzle', unit: '2-3', title: '整流公式拼圖', kind: ['puzzle'],
  blurb: '把打散的方塊拼成整流的公式。', outcomeVerb: '拼出整流公式',
  levels: [
    {
      level: 1, goal: '辨識:基本公式',
      items: [
        pz('KP-23-03', '半波直流公式', '拼出半波整流的直流平均值公式。', ['V_{dc}', '=', '\\dfrac{V_m}{\\pi}'], '半波:峰值除以 π。', 'V_dc = V_m / π。'),
        pz('KP-23-03', '全波直流公式', '拼出全波整流的直流平均值公式。', ['V_{dc}', '=', '\\dfrac{2V_m}{\\pi}'], '全波是半波的 2 倍。', 'V_dc = 2V_m / π。'),
        pz('KP-23-03', '半波有效值公式', '拼出半波整流輸出的有效值公式。', ['V_{rms}', '=', '\\dfrac{V_m}{2}'], '半波的有效值是峰值的一半。', 'V_rms = V_m / 2。'),
        pz('KP-23-03', '全波有效值公式', '拼出全波整流輸出的有效值公式。', ['V_{rms}', '=', '\\dfrac{V_m}{\\sqrt{2}}'], '與弦波有效值的關係相同。', 'V_rms = V_m / √2。'),
        pz('KP-23-03', '輸出頻率公式', '拼出全波整流輸出頻率與輸入頻率的關係。', ['f_o', '=', '2', 'f_i'], '輸出是輸入的 2 倍。', 'f_o = 2 f_i。'),
      ],
    },
    {
      level: 2, goal: '記憶與理解:變壓器、PIV 與濾波',
      items: [
        pz('KP-23-06', '變壓器公式', '拼出次級峰值與初級峰值的關係。', ['V_{s(m)}', '=', '\\dfrac{N_2}{N_1}', 'V_{i(m)}'], '次級 N2 在上、初級 N1 在下。', 'V_s(m) = (N2/N1) V_i(m)。'),
        pz('KP-23-02', '中心抽頭 PIV', '拼出中心抽頭全波整流的 PIV 公式(Vs(m) 為每半邊峰值)。', ['PIV', '=', '2', 'V_{s(m)}'], '截止的二極體承受兩個半邊。', 'PIV = 2 V_s(m)。'),
        pz('KP-23-05', '濾波直流公式', '拼出濾波後直流平均值的近似式。', ['V_{dc}', '\\approx', 'V_p', '-', '\\dfrac{V_{r(pp)}}{2}'], '平均值落在峰值與谷值的中間。', 'V_dc ≈ V_p − V_r(pp)/2。'),
        pz('KP-23-04', '漣波因數定義', '拼出漣波因數的定義式。', ['r', '=', '\\dfrac{V_{r(rms)}}{V_{dc}}'], '交流成分有效值 ÷ 直流。', 'r = V_r(rms) / V_dc。'),
        pz('KP-23-01', '半波 PIV', '拼出半波整流的 PIV 公式。', ['PIV', '=', 'V_m'], 'PIV 就是輸入峰值。', 'PIV = V_m。'),
      ],
    },
    {
      level: 3, goal: '應用:較完整的公式',
      items: [
        pz('KP-23-04', '漣波因數公式', '拼出由 Vrms 與 Vdc 求漣波因數的公式。', ['r', '=', '\\sqrt{\\left(\\dfrac{V_{rms}}{V_{dc}}\\right)^{2}-1}'], '交流成分 = √(總有效值² − 直流²)。', 'r = √[(V_rms/V_dc)² − 1]。'),
        pz('KP-23-05', '漣波電壓近似', '拼出全波整流濾波電路的漣波峰對峰近似式。', ['V_{r(pp)}', '\\approx', '\\dfrac{V_p}{2fRC}'], '電容放電時,電壓降 ≈ 電流 × 時間 / C。', 'V_r(pp) ≈ V_p / (2fRC)(全波,近似式略偏大)。'),
        pz('KP-23-03', '直流電流公式', '拼出由直流電壓求直流電流的公式。', ['I_{dc}', '=', '\\dfrac{V_{dc}}{R_L}'], '歐姆定律,用「直流」配「直流」。', 'I_dc = V_dc / R_L。'),
        pz('KP-23-01', '橋式 PIV', '拼出橋式整流每顆二極體的 PIV(Vs(m) 為次級峰值)。', ['PIV_{bridge}', '=', 'V_{s(m)}'], '橋式的 PIV 與半波相同。', 'PIV = V_s(m)。'),
        pz('KP-23-03', '總有效值', '拼出直流與交流成分合成的有效值公式。', ['V_{rms}', '=', '\\sqrt{V_{dc}^{2}+V_{r(rms)}^{2}}'], '先平方、再相加、再開根號。', 'V_rms = √(V_dc² + V_r(rms)²)。'),
      ],
    },
  ],
}

export const games23: GameDef[] = [circuit, formula, classify, calc, puzzle]
