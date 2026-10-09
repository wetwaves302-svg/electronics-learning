/** 1-1 教學資料,取自講義第 2~10 頁。年代、獎項、圖號皆依講義。 */

export interface Person { name: string; years: string; nobel?: string; note: string; fig?: string }
export interface Period { id: 'before' | 'tube' | 'transistor' | 'ic'; title: string; people: Person[]; devices: string[]; summary: string }

export const PERIODS: Period[] = [
  {
    id: 'before', title: '先驅(講義第 2 頁)',
    summary: '三位諾貝爾物理獎得主的研究,為電子學打下基礎;布朗發明的布朗管是早期的陰極射線管。',
    people: [
      { name: '羅倫茲', years: '1853~1928', nobel: '1902 諾貝爾物理獎', note: '圖 1-1', fig: '1-1' },
      { name: '湯姆生', years: '1856~1940', nobel: '1906 諾貝爾物理獎', note: '圖 1-2', fig: '1-2' },
      { name: '布朗', years: '1850~1918', nobel: '1909 諾貝爾物理獎', note: '圖 1-3;布朗真空管(圖 1-4)', fig: '1-3' },
    ],
    devices: ['布朗真空管(圖 1-4)'],
  },
  {
    id: 'tube', title: '真空管時期(講義第 3~4 頁)',
    summary: '用真空玻璃管控制電子流動,可以整流與放大,但體積大、耗電。',
    people: [
      { name: '佛來明', years: '1849~1945', note: '發明二極真空管(佛來明二極管,圖 1-5、1-6)', fig: '1-5' },
      { name: '德福萊斯', years: '1873~1961', note: '發明三極管(圖 1-7、1-8)', fig: '1-7' },
    ],
    devices: ['二極管(圖 1-6)', '三極管(圖 1-8)', '四極管、五極管(圖 1-9)', '真空管音響擴大機(圖 1-10)'],
  },
  {
    id: 'transistor', title: '電晶體時期(講義第 5 頁)',
    summary: '1956 年諾貝爾物理獎表彰三位發明點觸式固態放大器(電晶體)的科學家,固態元件開始取代真空管。',
    people: [
      { name: '卜拉登', years: '1902~1987', nobel: '1956 諾貝爾物理獎', note: '圖 1-11', fig: '1-11' },
      { name: '巴定', years: '1908~1991', nobel: '1956、1972 諾貝爾物理獎', note: '圖 1-12;兩度獲得諾貝爾物理獎', fig: '1-12' },
      { name: '蕭特力', years: '1910~1989', nobel: '1956 諾貝爾物理獎', note: '圖 1-13', fig: '1-13' },
    ],
    devices: ['點觸式固態放大器(圖 1-14)'],
  },
  {
    id: 'ic', title: '積體電路時期(講義第 6~7 頁)',
    summary: '把許多元件整合到同一片半導體上,元件數量從單一電晶體一路增加到極大型積體電路。',
    people: [
      { name: '迪耳', years: '1907~2003', note: '圖 1-15;與第一個接面型鍺電晶體(圖 1-16)有關', fig: '1-15' },
      { name: '基爾比', years: '1923~2005', nobel: '2000 諾貝爾物理獎', note: '圖 1-17;做出第一個鍺積體電路(圖 1-18)', fig: '1-17' },
    ],
    devices: ['第一個接面型鍺電晶體(圖 1-16)', '第一個鍺積體電路(圖 1-18)', '各種不同容量的積體電路(圖 1-19)'],
  },
]

/** IC 規模,由少到多(講義圖 1-19 由右到左) */
export const IC_LEVELS: { id: string; name: string; full: string }[] = [
  { id: 'single', name: '單電晶體', full: '單一個電晶體' },
  { id: 'ssi', name: 'SSI', full: '小型積體電路(Small Scale Integration)' },
  { id: 'msi', name: 'MSI', full: '中型積體電路(Medium Scale Integration)' },
  { id: 'lsi', name: 'LSI', full: '大型積體電路(Large Scale Integration)' },
  { id: 'vlsi', name: 'VLSI', full: '超大型積體電路(Very Large Scale Integration)' },
  { id: 'ulsi', name: 'ULSI', full: '極大型積體電路(Ultra Large Scale Integration)' },
]

/** IC 製造流程(講義圖 1-20 與第 9 頁),依序 */
export interface MfgStep { letter: string; name: string; phase: '晶圓處理' | '測試與封裝'; what: string }
export const MFG_STEPS: MfgStep[] = [
  { letter: 'a', name: '晶圓切片與拋光', phase: '晶圓處理', what: '把矽晶柱切成薄片(晶圓),並把表面拋光平整。' },
  { letter: 'b', name: '氧化、擴散', phase: '晶圓處理', what: '在表面長出氧化層;並以擴散方式摻入雜質。' },
  { letter: 'c', name: '光罩', phase: '晶圓處理', what: '塗上光阻,透過光罩曝光,把電路圖形轉印到晶圓上。' },
  { letter: 'd', name: '蝕刻', phase: '晶圓處理', what: '把沒有被保護的部分去除,留下需要的圖形。' },
  { letter: 'e', name: '薄膜沉積', phase: '晶圓處理', what: '沉積導線或絕緣的薄膜材料。' },
  { letter: 'f', name: 'IC 剖面圖', phase: '晶圓處理', what: '重複上面的步驟,在晶圓上做出完整的電晶體與連線結構。' },
  { letter: 'g', name: '晶圓測試', phase: '測試與封裝', what: '在切開之前,先測試晶圓上每一顆晶粒的功能。' },
  { letter: 'h', name: '晶粒切割', phase: '測試與封裝', what: '把晶圓切成一顆一顆的晶粒。' },
  { letter: 'i', name: '晶粒貼附', phase: '測試與封裝', what: '把好的晶粒貼到封裝用的底座上。' },
  { letter: 'j', name: '打線', phase: '測試與封裝', what: '用細金屬線把晶粒的接點接到封裝的腳位。' },
  { letter: 'k', name: '包裝並測試', phase: '測試與封裝', what: '用外殼封裝保護晶粒,並再次測試。' },
  { letter: 'l', name: 'IC 完成品', phase: '測試與封裝', what: '完成,可以裝到電路板上使用。' },
]

export const FOUR_C = {
  application: { title: '電子應用產品的 4C', items: [['Computer', '電腦'], ['Communication', '通訊'], ['Consumer', '消費性電子'], ['Car', '車用(汽車)電子']] as [string, string][] },
  integration: { title: '4C 的整合與應用', items: [['Components', '元件'], ['Communication', '通訊'], ['Computation', '計算'], ['Control', '控制']] as [string, string][] },
}
