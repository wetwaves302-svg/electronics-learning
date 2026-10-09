import type { Question } from '../types'

const F = '習作本詳解_第2章.pdf'
const s = (page: number, label: string) => ({ file: F, page, label })
const opts = (...t: string[]) => t.map((text) => ({ text }))

/**
 * 習作第 2 章:範圍內(2-1、2-2、2-3 整流濾波)共 20 題。
 * 範圍外(稽納、LED 等)不收錄:選擇題 13–20、問答 4–6、歷屆 6。
 */
export const ch2Questions: Question[] = [
  {
    id: 'WB2-MC-01', type: 'mc', unit: '2-1', source: s(7, '選擇題 1'), kps: ['KP-21-01'],
    stem: '下列關於價電子與自由電子的敘述,何者錯誤?',
    options: opts('價電子位於原子核最外層軌道', '價電子成為自由電子會釋放熱能', '自由電子位於傳導帶', '價電子脫離原來的軌道所留下的空缺,稱為電洞'), answer: 1,
    solution: '價電子必須「吸收」大於能隙的能量,才能脫離共價鍵成為自由電子,不是釋放熱能。', review: 'pending',
  },
  {
    id: 'WB2-MC-02', type: 'mc', unit: '2-1', source: s(7, '選擇題 2'), kps: ['KP-21-03', 'KP-21-04'],
    stem: '下列敘述何者不正確?',
    options: opts('矽(Si)及鍺(Ge)皆是本質半導體(intrinsic semiconductor)', '將磷(P)或砷(As)加入一本質半導體可以將此半導體變為 P 型外質半導體(extrinsic semiconductor)', '在 P 型半導體中之多數載子(majority carrier)為電洞', '在摻有銻(Sb)的半導體中,Sb 扮演的角色是施體(donor)'), answer: 1,
    solution: '磷、砷、銻是 5 價元素,摻入後多出自由電子,成為 N 型半導體,雜質稱為施體。', review: 'pending',
  },
  {
    id: 'WB2-MC-03', type: 'mc', unit: '2-1', source: s(7, '選擇題 3'), kps: ['KP-21-04'],
    stem: '一純矽半導體中,本質濃度 ni = 1.5×10¹⁰/cm³,原子密度為 5×10²²/cm³,若於每 10⁹ 個矽原子摻入 1 個施體(donor)雜質,則其電洞濃度為多少?',
    options: opts('4.5×10⁵/cm³', '4.5×10⁶/cm³', '4.5×10⁷/cm³', '4.5×10⁸/cm³'), answer: 1,
    solution: '施體濃度 Nd = 5×10²² / 10⁹ = 5×10¹³/cm³。因 Nd ≫ ni,電子濃度 n ≈ Nd。電洞濃度 p = ni²/n = (1.5×10¹⁰)² / (5×10¹³) = 4.5×10⁶ /cm³。(適用條件:摻雜濃度遠大於本質濃度。)',
    review: 'calcVerified', solutionAuthoredByUs: true,
  },
  {
    id: 'WB2-MC-04', type: 'mc', unit: '2-2', source: s(7, '選擇題 4'), kps: ['KP-22-01'],
    stem: 'P-N 二極體產生障壁電壓(barrier potential)的原因,下列何者正確?',
    options: opts('P 型半導體自然產生', 'N 型半導體自然產生', '加偏壓後自然產生', 'P-N 結合時自然產生'), answer: 3,
    solution: 'P、N 結合的瞬間,載子擴散形成空乏區,內建電場即障壁電壓。與是否外加偏壓無關。', review: 'pending',
  },
  {
    id: 'WB2-MC-05', type: 'mc', unit: '2-2', source: s(7, '選擇題 5'), kps: ['KP-22-03'],
    stem: '已知在室溫下時,二極體導通電流 ID = 1mA,電壓 VD = 0.6V,則二極體的動態電阻 rd 為?',
    options: [{ text: '2.5Ω', errorType: 'unit' }, { text: '25Ω' }, { text: '60Ω', errorType: 'formulaChoice' }, { text: '600Ω', errorType: 'formulaChoice' }], answer: 1,
    solution: 'rd = VT / IDQ = 25 mV / 1 mA = 25 Ω。VD = 0.6 V 是直流壓降,與動態電阻無關。室溫下 VT 約 25～26 mV,本題取 25 mV。', review: 'calcVerified',
  },
  {
    id: 'WB2-MC-06', type: 'mc', unit: '2-2', source: s(8, '選擇題 6'), kps: ['KP-22-02', 'KP-22-04'],
    stem: '下列有關 PN 接面二極體的敘述,何者有誤?',
    options: opts('矽二極體的障壁電壓(barrier potential)較鍺二極體高', '二極體加順向偏壓後,空乏區變窄', '溫度上升時,障壁電壓上升', '溫度上升時,漏電流上升'), answer: 2,
    solution: '溫度上升時,矽二極體的障壁電壓(順向壓降)下降,約每升 1℃ 減少 1～2.5 mV。', review: 'pending',
  },
  {
    id: 'WB2-MC-07', type: 'mc', unit: '2-2', source: s(8, '選擇題 7'), kps: ['KP-22-05'],
    stem: '圖所示,設 D1、D2 為理想二極體,試求 Vo = ?',
    figure: 'wb2-mc07',
    figureNote: '12V 電源經 D1 與 3kΩ 接到輸出;2V 電源經 D2 與 1kΩ 接到同一輸出;輸出對地接 1kΩ 負載。',
    options: opts('1V', '2V', '3V', '4V'), answer: 2,
    solution: 'D1 的陽極側為 12V,比 D2 的 2V 高,先導通。假設 D1 導通、D2 截止:Vo = 12 × 1k/(3k+1k) = 3 V。檢查:D2 陰極 3 V > 陽極 2 V,確實截止,假設成立。', review: 'calcVerified',
  },
  {
    id: 'WB2-MC-08', type: 'mc', unit: '2-3', source: s(8, '選擇題 8'), kps: ['KP-23-01'],
    stem: '在半波整流電路中,若輸入 Vi(t) = 100 sinωt (V),則電路中二極體(假設為理想)所承受的峰值逆向電壓(PIV)為?',
    options: opts('50V', '100V', '150V', '200V'), answer: 1,
    solution: '半波整流(無濾波)時,二極體截止期間承受輸入電壓峰值,PIV = Vi(m) = 100 V。', review: 'calcVerified',
  },
  {
    id: 'WB2-MC-09', type: 'mc', unit: '2-3', source: s(8, '選擇題 9'), kps: ['KP-23-02'],
    stem: '如圖所示之橋式整流電路,假設二極體均為理想二極體,當輸入交流電壓 Vi(t) > 0V 時,請問二極體的狀態,下列描述何者正確?',
    figure: 'wb2-mc09',
    figureNote: '變壓器兩端的黑點(同名端)表示 Vi 為正時次級上端為正。RL 的 + 端接在 D1、D2 之間(左側中點),− 端接地。',
    options: opts('D1、D3 on,D2、D4 off', 'D2、D4 on,D1、D3 off', 'D1、D4 on,D2、D3 off', 'D2、D3 on,D1、D4 off'), answer: 0,
    solution: 'Vi > 0 時次級上端為正。電流路徑:上端 → D1 → RL(由 + 到 −)→ D3 → 次級下端。所以 D1、D3 導通,D2、D4 截止。', review: 'calcVerified', solutionAuthoredByUs: true,
  },
  {
    id: 'WB2-MC-10', type: 'mc', unit: '2-3', source: s(8, '選擇題 10'), kps: ['KP-23-03'],
    stem: '一個 60Hz 的交流電壓經全波整流後,負載上之電壓波形頻率為?',
    options: opts('60', '100', '120', '180 Hz'), answer: 2,
    solution: '全波整流把負半週翻到正半週,每個輸入週期輸出兩個脈動,fo = 2fi = 120 Hz。', review: 'calcVerified',
  },
  {
    id: 'WB2-MC-11', type: 'mc', unit: '2-3', source: s(9, '選擇題 11'), kps: ['KP-23-04'],
    stem: '在全波整流電路中,濾波僅包括負載電阻,其漣波因數是?',
    options: opts('142%', '121%', '100%', '48%'), answer: 3,
    solution: '全波整流輸出:Vdc = 2Vm/π,Vrms = Vm/√2。漣波因數 r = √[(Vrms/Vdc)² − 1] = √[(π/(2√2))² − 1] = √(1.2337 − 1) ≈ 0.483 = 48%。(半波為 121%。)',
    review: 'calcVerified', solutionAuthoredByUs: true,
  },
  {
    id: 'WB2-MC-12', type: 'mc', unit: '2-3', source: s(9, '選擇題 12'), kps: ['KP-23-05'],
    stem: '一電源濾波電路之輸出,已知其峰值電壓 18V,漣波電壓峰對峰值為 2V,則其輸出平均值電壓為?',
    options: opts('16V', '17V', '18V', '20V'), answer: 1,
    solution: 'Vo(dc) ≈ Vo(p) − Vr(p-p)/2 = 18 − 2/2 = 17 V。(此為漣波近似三角形時的算法。)', review: 'calcVerified', solutionAuthoredByUs: true,
  },
  {
    id: 'WB2-QA-01', type: 'open', unit: '2-1', source: s(10, '問答 1'), kps: ['KP-21-02', 'KP-21-03'],
    stem: '如圖所示,「−」代表自由電子,「+」代表電洞,請找出絕緣體、本質半導體、P 型半導體、N 型半導體、導體各為何?',
    figure: 'wb2-qa01', figureNote: '圖 (7) 有 A～E 五個方塊。原圖符號為示意手繪;本平台改以數量嚴格的重繪版呈現。',
    modelAnswer: 'A:絕緣體(無載子);B:導體(載子全為電子);C:N 型(電子多於電洞);D:P 型(電洞多於電子);E:本質半導體(電子數等於電洞數)。',
    checklist: ['A 絕緣體', 'B 導體', 'C N 型', 'D P 型', 'E 本質半導體'],
    solution: '依載子種類與數量判斷。', review: 'calcVerified',
  },
  {
    id: 'WB2-QA-02', type: 'numeric', unit: '2-2', source: s(11, '問答 2'), kps: ['KP-22-05'],
    stem: '圖所示電路中之二極體為理想,求電壓 Vo 及電流 I 之值?',
    figure: 'wb2-qa02',
    figureNote: '12V 經 5kΩ 到節點;節點接 D1 陽極,節點對地有 20kΩ;D1 陰極為 Vo,Vo 對地有 20kΩ;I 為流過 D1 的電流。',
    parts: [
      { label: '電壓 Vo', value: 8, unit: 'V' },
      { label: '電流 I', value: 0.0004, unit: 'A' },
    ],
    solution: '以戴維寧化簡二極體左側:Vth = 12 × 20k/(5k+20k) = 9.6 V,Rth = 5k // 20k = 4 kΩ。Vth > 0,二極體順向導通。I = 9.6 V / (4k + 20k) = 0.4 mA,Vo = I × 20k = 8 V。', review: 'calcVerified',
  },
  {
    id: 'WB2-QA-03', type: 'numeric', unit: '2-3', source: s(11, '問答 3'), kps: ['KP-23-06', 'KP-23-03'],
    stem: '圖電路(變壓器 10:1,Vi = 100V/50Hz,半波整流,RL = 100Ω)之輸出電壓 Vo(p)、Vo(dc)、Vo(rms) 及輸出電流 Io(p)、Io(dc)、Io(rms) 分別為多少?已知二極體為理想二極體。',
    figure: 'wb2-qa03', figureNote: 'Vi 100 V 視為有效值(詳解以 Vi(m) = 100√2 V 計算)。',
    parts: [
      { label: 'Vo(p)', value: 14.142, unit: 'V', relTol: 0.01 },
      { label: 'Vo(dc)', value: 4.502, unit: 'V', relTol: 0.01 },
      { label: 'Vo(rms)', value: 7.071, unit: 'V', relTol: 0.01 },
      { label: 'Io(p)', value: 0.14142, unit: 'A', relTol: 0.01 },
      { label: 'Io(dc)', value: 0.04502, unit: 'A', relTol: 0.01 },
      { label: 'Io(rms)', value: 0.07071, unit: 'A', relTol: 0.01 },
    ],
    solution: 'Vs(m) = (N2/N1) Vi(m) = (1/10) × 100√2 = 10√2 ≈ 14.1 V。半波整流:Vo(p) = 14.1 V,Vo(dc) = Vo(p)/π ≈ 4.5 V,Vo(rms) = Vo(p)/2 ≈ 7.07 V。除以 RL = 100 Ω:Io(p) = 141 mA,Io(dc) = 45 mA,Io(rms) ≈ 70.7 mA。', review: 'calcVerified',
  },
  {
    id: 'WB2-PY-01', type: 'mc', unit: '2-1', source: s(12, '歷屆 108 年統測 1'), kps: ['KP-21-05'],
    stem: '下列有關電子伏特(eV)之敘述,何者正確?',
    options: opts('為能量單位', '為功率單位', '為電壓單位', '為電阻單位'), answer: 0,
    solution: 'W = Q × V,1 eV = 1.6×10⁻¹⁹ C × 1 V = 1.6×10⁻¹⁹ J,是能量單位。', review: 'calcVerified',
  },
  {
    id: 'WB2-PY-02', type: 'mc', unit: '2-2', source: s(13, '歷屆 108 年統測 2'), kps: ['KP-22-02'],
    stem: '小明做二極體特性實驗時,量測並繪得二條 I-V 曲線,如圖所示之實線與虛線,則下列敘述何者錯誤?',
    figure: 'wb2-py02',
    options: opts('逆向偏壓時,曲線中斜率較大的部分其內阻較大', '若分別是矽與鍺二極體的量測,則曲線 (1) 是鍺二極體', '順向偏壓時,曲線中斜率較大的部分其內阻較小', '若是同一矽二極體在不同工作溫度下的量測,則曲線 (1) 比曲線 (2) 溫度高'), answer: 0,
    solution: '斜率 = ΔI/ΔV = 1/R,斜率愈大內阻愈小,所以 (A) 錯誤。導通電壓較低的是鍺;溫度升高時導通電壓下降,曲線向左移。', review: 'calcVerified',
  },
  {
    id: 'WB2-PY-03', type: 'mc', unit: '2-2', source: s(13, '歷屆 108 年統測 3'), kps: ['KP-22-04'],
    stem: '假設矽二極體在 25°C 時,其順向電壓降為 0.65V,則當溫度上升至 65°C 時,其順向電壓降約為何?',
    options: opts('0.75V', '0.65V', '0.55V', '0.25V'), answer: 2,
    solution: '溫度每升 1℃,順向壓降下降約 2.5 mV。ΔT = 65 − 25 = 40℃,下降 2.5 mV × 40 = 100 mV,故 0.65 − 0.1 = 0.55 V。', review: 'calcVerified',
  },
  {
    id: 'WB2-PY-04', type: 'mc', unit: '2-3', source: s(13, '歷屆 108 年統測 4'), kps: ['KP-23-04'],
    stem: '單相橋式全波整流電路,若其整流二極體視為理想,則輸出電壓漣波百分率約為何?',
    options: opts('121%', '48%', '21%', '0%'), answer: 1,
    solution: '無濾波的全波整流漣波因數 r ≈ 48%;半波為 121%。', review: 'calcVerified',
  },
  {
    id: 'WB2-PY-05', type: 'mc', unit: '2-3', source: s(13, '歷屆 108 年統測 5'), kps: ['KP-23-02', 'KP-23-06'],
    stem: '實驗時,使用主級線圈與次級線圈比例為 110:24 之變壓器裝配如圖所示之全波整流電路(AC 110V、60Hz),若二極體順向導通時兩端的電壓為零。下列選用的二極體之額定峰值逆向電壓(Peak Inverse Voltage),何者較為適當?',
    figure: 'wb2-py05', figureNote: '次級為中心抽頭,中心抽頭接地;兩個二極體陽極各接次級兩端,陰極共接輸出。',
    options: opts('28V', '30V', '32V', '34V'), answer: 3,
    solution: '110 V rms 的峰值 110√2 V。次級全部 24 V rms,中心抽頭後每半邊 Vs(m) = 12√2 ≈ 16.97 V。中心抽頭全波整流的 PIV = 2·Vs(m) = 24√2 ≈ 33.94 V。選項中只有 34 V 高於 33.94 V。(實務上應選額定值更高、留有餘裕的二極體。)', review: 'calcVerified', solutionAuthoredByUs: true,
  },
]
