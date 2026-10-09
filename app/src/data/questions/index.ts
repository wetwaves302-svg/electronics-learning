import { ch1Questions } from './ch1'
import { ch2Questions } from './ch2'
import type { Question } from '../types'
import * as c1 from '../coach/ch1'
import * as c2 from '../coach/ch2'
import * as b1 from '../coach/ch1b'
import * as b2 from '../coach/ch2b'
import * as cc from '../coach/concept'
import { spreadCoach } from '../coach/spread'

/** 教練內容以題目 ID 附加,與題目本身分離維護 */
const coach: Record<string, Pick<Question, 'coach' | 'variant'>> = {
  'WB1-MC-07': { coach: c1.coach_WB1_MC_07, variant: c1.variant_WB1_MC_07 },
  'WB1-MC-10': { coach: c1.coach_WB1_MC_10, variant: c1.variant_WB1_MC_10 },
  'WB1-MC-14': { coach: c1.coach_WB1_MC_14, variant: c1.variant_WB1_MC_14 },
  'WB1-MC-08': { coach: b1.coach_WB1_MC_08, variant: b1.variant_WB1_MC_08 },
  'WB1-MC-11': { coach: b1.coach_WB1_MC_11, variant: b1.variant_sineStatements },
  'WB1-MC-13': { coach: b1.coach_WB1_MC_13, variant: b1.variant_duty },
  'WB1-MC-15': { coach: b1.coach_WB1_MC_15, variant: b1.variant_waveMetric },
  'WB1-MC-16': { coach: b1.coach_WB1_MC_16, variant: b1.variant_waveMetric },
  'WB1-MC-17': { coach: b1.coach_WB1_MC_17, variant: b1.variant_waveCompare },
  'WB1-MC-18': { coach: b1.coach_WB1_MC_18, variant: b1.variant_waveCompare },
  'WB1-MC-20': { coach: b1.coach_WB1_MC_20, variant: b1.variant_mixedRms },
  'WB1-QA-03': { coach: b1.coach_WB1_QA_03, variant: b1.variant_QA03 },
  'WB1-QA-04': { coach: b1.coach_WB1_QA_04, variant: b1.variant_QA04 },
  'WB1-QA-05': { coach: b1.coach_WB1_QA_05, variant: b1.variant_QA05 },
  'WB1-PY-01': { coach: b1.coach_WB1_PY_01, variant: b1.variant_sineStatements },
  'WB1-PY-02': { coach: b1.coach_WB1_PY_02, variant: b1.variant_duty },
  'WB1-PY-03': { coach: c1.coach_WB1_MC_14, variant: c1.variant_WB1_MC_14 },
  'WB1-PY-04': { coach: b1.coach_WB1_PY_04, variant: b1.variant_PY04 },
  'WB2-MC-03': { coach: b2.coach_WB2_MC_03, variant: b2.variant_WB2_MC_03 },
  'WB2-MC-05': { coach: b2.coach_WB2_MC_05, variant: b2.variant_WB2_MC_05 },
  'WB2-MC-07': { coach: b2.coach_WB2_MC_07, variant: b2.variant_WB2_MC_07 },
  'WB2-MC-09': { coach: b2.coach_WB2_MC_09, variant: b2.variant_WB2_MC_09 },
  'WB2-MC-11': { coach: b2.coach_WB2_MC_11, variant: b2.variant_WB2_MC_11 },
  'WB2-MC-12': { coach: b2.coach_WB2_MC_12, variant: b2.variant_WB2_MC_12 },
  'WB2-QA-01': { coach: b2.coach_WB2_QA_01, variant: b2.variant_WB2_QA_01 },
  'WB2-QA-02': { coach: b2.coach_WB2_QA_02, variant: b2.variant_WB2_QA_02 },
  'WB2-PY-02': { coach: b2.coach_WB2_PY_02, variant: b2.variant_WB2_PY_02 },
  'WB2-PY-03': { coach: b2.coach_WB2_PY_03, variant: b2.variant_WB2_PY_03 },
  'WB2-PY-04': { coach: b2.coach_WB2_MC_11, variant: b2.variant_WB2_MC_11 },
  'WB1-MC-01': { coach: cc.coach_WB1_MC_01, variant: cc.variant_hist },
  'WB1-MC-02': { coach: cc.coach_WB1_MC_02, variant: cc.variant_hist },
  'WB1-MC-03': { coach: cc.coach_WB1_MC_03, variant: cc.variant_icOrder },
  'WB1-MC-04': { coach: cc.coach_WB1_MC_04, variant: cc.variant_icOrder },
  'WB1-MC-05': { coach: cc.coach_WB1_MC_05, variant: cc.variant_icProcess },
  'WB1-MC-06': { coach: cc.coach_WB1_MC_06, variant: cc.variant_dcTypes },
  'WB1-MC-09': { coach: cc.coach_WB1_MC_09, variant: cc.variant_sinePool },
  'WB1-MC-12': { coach: cc.coach_WB1_MC_12, variant: cc.variant_sinePool },
  'WB1-MC-19': { coach: cc.coach_WB1_MC_19, variant: cc.variant_sinePool },
  'WB1-QA-01': { coach: cc.coach_WB1_QA_01, variant: cc.variant_icOrder },
  'WB1-QA-02': { coach: cc.coach_WB1_QA_02, variant: cc.variant_4c },
  'WB2-MC-01': { coach: cc.coach_WB2_MC_01, variant: cc.variant_carrier },
  'WB2-MC-02': { coach: cc.coach_WB2_MC_02, variant: cc.variant_doping },
  'WB2-MC-04': { coach: cc.coach_WB2_MC_04, variant: cc.variant_barrier },
  'WB2-MC-06': { coach: cc.coach_WB2_MC_06, variant: cc.variant_tempDiode },
  'WB2-PY-01': { coach: cc.coach_WB2_PY_01, variant: cc.variant_eV },
  'WB2-MC-08': { coach: c2.coach_WB2_MC_08, variant: c2.variant_WB2_MC_08 },
  'WB2-MC-10': { coach: c2.coach_WB2_MC_10, variant: c2.variant_WB2_MC_10 },
  'WB2-PY-05': { coach: c2.coach_WB2_PY_05, variant: c2.variant_WB2_PY_05 },
  'WB2-QA-03': { coach: c2.coach_WB2_QA_03, variant: c2.variant_WB2_QA_03 },
}

export const questions: Question[] = [...ch1Questions, ...ch2Questions].map((q) => {
  const c = coach[q.id]
  return c ? { ...q, coach: spreadCoach(q.id, c.coach!), variant: c.variant } : q
})
export const questionById = (id: string) => questions.find((q) => q.id === id)
