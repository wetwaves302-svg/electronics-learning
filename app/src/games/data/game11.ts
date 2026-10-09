import type { GameDef } from '../types'
import { FOUR_C, IC_LEVELS, MFG_STEPS, PERIODS } from '../../lessons/data11'
import { ch, classify, match, pair, thing } from './helpers'

/** 人物 → 所屬時期(取自講義第 2~7 頁的分頁歸屬) */
const periodOf = (name: string) => PERIODS.find((p) => p.people.some((x) => x.name === name))!.id
const bucketIdx = (id: string) => ['tube', 'transistor', 'ic'].indexOf(id)

/* 1. 電子學歷史 */
const history: GameDef = {
  id: 'g11-history', unit: '1-1', title: '電子學時光機', kind: ['symbol', 'classify', 'formulaMatch'],
  blurb: '認識真空管、電晶體、積體電路三個時期的人物與發明。', outcomeVerb: '說出發展史',
  levels: [
    {
      level: 1, goal: '辨識:誰發明了什麼?',
      items: [
        ch(0, 'KP-11-01', '佛來明的發明', '佛來明發明的是?', '二極真空管', ['三極管', '點觸式電晶體', '積體電路'], '佛來明屬於真空管時期,圖 1-6 是佛來明二極管。', '佛來明發明二極真空管(二極管)。'),
        ch(1, 'KP-11-01', '德福萊斯的發明', '德福萊斯發明的是?', '三極管', ['二極真空管', '點觸式電晶體', '積體電路'], '它比二極管多了一個控制電極,可以放大。', '德福萊斯發明三極管(圖 1-8)。'),
        ch(2, 'KP-11-01', '巴定等人的發明', '巴定、卜拉登、蕭特力共同發明了?', '點觸式固態放大器(電晶體)', ['三極管', '第一個積體電路', '布朗真空管'], '他們是電晶體時期的人物。', '三位 1956 年獲諾貝爾物理獎,發明點觸式固態放大器(圖 1-14)。'),
        ch(3, 'KP-11-01', '基爾比的發明', '基爾比做出的是?', '第一個鍺積體電路', ['點觸式電晶體', '二極真空管', '三極管'], '他是積體電路時期的人物,2000 年獲諾貝爾物理獎。', '基爾比做出第一個鍺積體電路(圖 1-18)。'),
        ch(4, 'KP-11-01', '真空管時期', '下列哪一個元件屬於真空管時期?', '三極管', ['點觸式固態放大器', '超大型積體電路', '第一個鍺積體電路'], '真空管時期的元件都是真空玻璃管。', '二極管、三極管、四極管、五極管都屬於真空管。'),
        ch(5, 'KP-11-01', '電晶體取代真空管', '點觸式固態放大器取代了哪種元件的放大功能?', '真空管', ['電阻', '變壓器', '二極體'], '固態元件取代體積大的元件。', '電晶體時期的固態放大器取代了真空管。'),
      ],
    },
    {
      level: 2, goal: '理解:這個人屬於哪個時期?',
      items: [classify('這位人物屬於哪一個時期?', ['真空管時期', '電晶體時期', '積體電路時期'],
        ['佛來明', '德福萊斯', '卜拉登', '巴定', '蕭特力', '基爾比', '迪耳'].map((n) => thing(n, bucketIdx(periodOf(n)), 'KP-11-01', `${n}的時期`)),
        '電晶體時期有三位 1956 年的諾貝爾獎得主;真空管時期有二極管與三極管的發明者。', '佛來明、德福萊斯:真空管時期;卜拉登、巴定、蕭特力:電晶體時期;基爾比、迪耳:積體電路時期(講義第 3~7 頁)。')],
    },
    {
      level: 3, goal: '記憶:諾貝爾物理獎的年份',
      items: [match('把人物配上他獲得諾貝爾物理獎的年份。', [
        pair('羅倫茲', '1902 年', 'KP-11-01', '羅倫茲的獎項'), pair('湯姆生', '1906 年', 'KP-11-01', '湯姆生的獎項'), pair('布朗', '1909 年', 'KP-11-01', '布朗的獎項'),
        pair('基爾比', '2000 年', 'KP-11-01', '基爾比的獎項'), pair('巴定', '1956 與 1972 年(兩度)', 'KP-11-01', '巴定的獎項'),
      ], '先配出年代最早的與最晚的。', '講義:羅倫茲 1902、湯姆生 1906、布朗 1909、基爾比 2000,巴定 1956 與 1972 兩度獲獎。')],
    },
  ],
}

/* 2. IC 規模與製造 */
const phaseOf = (name: string) => (MFG_STEPS.find((s) => s.name === name)!.phase === '晶圓處理' ? 0 : 1)
const nextOf = (name: string) => MFG_STEPS[MFG_STEPS.findIndex((s) => s.name === name) + 1].name
const others = (...ex: string[]) => MFG_STEPS.map((s) => s.name).filter((n) => !ex.includes(n))
const ic: GameDef = {
  id: 'g11-ic', unit: '1-1', title: 'IC 工廠', kind: ['symbol', 'classify', 'figure'],
  blurb: '認識 IC 的規模名稱,並走一遍 IC 的製造流程。', outcomeVerb: '認識 IC',
  levels: [
    {
      level: 1, goal: '辨識:這個縮寫是什麼?',
      items: IC_LEVELS.slice(1).map((l, i) => {
        const zh = l.full.match(/^([^(]+)/)![1]
        const pool = IC_LEVELS.slice(1).filter((x) => x.id !== l.id).map((x) => x.full.match(/^([^(]+)/)![1])
        return ch(i + 1, 'KP-11-02', `${l.name} 的名稱`, `「${l.name}」是哪一種積體電路?`, zh, pool.slice(0, 3), '字母:S 小、M 中、L 大、V 超大、U 極大。', `${l.name} = ${l.full}。由少到多:單電晶體、SSI、MSI、LSI、VLSI、ULSI。`)
      }).concat([ch(0, 'KP-11-02', '規模排序', '下列哪一種 IC 所含的邏輯閘最多?', 'ULSI', ['VLSI', 'LSI', 'MSI'], '字母 U 代表 Ultra(極大)。', 'ULSI 是最大的一級。')]),
    },
    {
      level: 2, goal: '理解:這一步在製造流程的哪一段?',
      items: [classify('這個步驟屬於哪一段?', ['晶圓處理(做出電路)', '測試與封裝'],
        ['晶圓切片與拋光', '蝕刻', '薄膜沉積', '打線', '晶粒切割', '包裝並測試'].map((n) => thing(n, phaseOf(n), 'KP-11-03', `${n}屬於哪一段`)),
        '前半段在晶圓上做出電路;後半段把晶圓切開、接線、封裝並測試。', '晶圓處理:切片拋光、氧化擴散、光罩、蝕刻、薄膜沉積;測試與封裝:晶圓測試、切割、貼附、打線、包裝測試(講義圖 1-20)。')],
    },
    {
      level: 3, goal: '應用:下一步是什麼?',
      items: ['光罩', '晶圓測試', '晶粒切割', '晶粒貼附', '打線', '包裝並測試'].map((n, i) =>
        ch(i, 'KP-11-03', `${n}的下一步`, `「${n}」的下一個步驟是?`, nextOf(n), others(n, nextOf(n)).filter((x) => x !== MFG_STEPS[MFG_STEPS.findIndex((s) => s.name === n) - 1]?.name).slice(0, 3), '回想講義圖 1-20 的箭頭方向。', `順序:${MFG_STEPS.map((s) => s.name).join(' → ')}。`)),
    },
  ],
}

/* 3. 4C */
const appKind = (en: string) => (FOUR_C.application.items.some(([e]) => e === en) ? 0 : 1)
const c4: GameDef = {
  id: 'g11-4c', unit: '1-1', title: '4C 大冒險', kind: ['termMatch', 'classify'],
  blurb: '分清楚兩種 4C,並把生活中的電子產品歸類。', outcomeVerb: '分辨 4C',
  levels: [
    {
      level: 1, goal: '辨識:電子應用產品的 4C',
      items: [match('把英文配上中文。', [
        ...FOUR_C.application.items.map(([en, zh]) => pair(en, zh, 'KP-11-04', `${en} = ${zh}`)),
        pair('4C', '電腦、通訊、消費性電子與車用電子的整合應用', 'KP-11-04', '4C 的意思'),
      ], 'Car 是汽車,Consumer 是消費者。', '電子應用產品的 4C:Computer 電腦、Communication 通訊、Consumer 消費性電子、Car 車用電子。')],
    },
    {
      level: 2, goal: '理解:這屬於哪一種 4C?',
      items: [classify('這個 C 屬於哪一種 4C?', ['電子應用產品的 4C', '元件、通訊、計算、控制的 4C'],
        [...FOUR_C.application.items, ...FOUR_C.integration.items].map(([n]) => n).filter((n) => n !== 'Communication').map((n) => thing(n, appKind(n), 'KP-11-04', `${n} 屬於哪種 4C`)),
        'Components、Computation、Control 只出現在「整合與應用」那一種。', '講義第 8 頁有兩種 4C。Communication(通訊)兩種都有,所以這題沒有考它。')],
    },
    {
      level: 3, goal: '應用:這個產品屬於哪個 C?',
      items: [classify('這個產品最屬於哪一個 C?', ['Computer 電腦', 'Communication 通訊', 'Consumer 消費性電子', 'Car 車用電子'],
        [thing('筆記型電腦', 0, 'KP-11-04', '電腦類產品'), thing('智慧型手機', 1, 'KP-11-04', '通訊類產品'), thing('電視機', 2, 'KP-11-04', '消費性電子產品'), thing('倒車雷達', 3, 'KP-11-04', '車用電子產品'), thing('網路路由器', 1, 'KP-11-04', '通訊設備'), thing('電視遊樂器', 2, 'KP-11-04', '消費性電子')],
        '想想這個產品主要用在哪裡:桌面、通話上網、客廳、還是汽車上。', '筆電是電腦;手機與路由器是通訊;電視與遊樂器是消費性電子;倒車雷達是車用電子。(生活應用舉例,同一產品可能跨多類,這裡取最主要的類別。)')],
    },
  ],
}

export const games11: GameDef[] = [history, ic, c4]
