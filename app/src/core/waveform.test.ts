import { describe, expect, it } from 'vitest'
import { makePulse, makeTriangularPulse, makeWave, measure } from './waveform'
import { dutyCycle, pulseAverage, pulseRms, symmetricWave, triangularPulse } from './physics'

const close = (a: number, b: number, rel = 0.005) => expect(Math.abs(a - b)).toBeLessThanOrEqual(Math.abs(b) * rel + 1e-9)

describe('波形公式與數值積分互相驗證', () => {
  for (const kind of ['sine', 'square', 'triangle', 'sawtooth'] as const) {
    it(`${kind}:有效值、整流平均值、FF、CF`, () => {
      const vm = 7
      const f = 50
      const m = measure(makeWave(kind, vm, f), 1 / f)
      const w = symmetricWave(kind, vm)
      close(m.rms, w.rms)
      close(m.rms / m.absAvg, w.formFactor)
      close(m.max / m.rms, w.crestFactor)
      expect(Math.abs(m.avg)).toBeLessThan(vm * 1e-3)
    })
  }
  it('脈波平均值與有效值', () => {
    const m = measure(makePulse(10, -2, 0.6, 1000), 1 / 1000)
    close(m.avg, pulseAverage(10, -2, 0.6))
    close(m.rms, pulseRms(10, -2, 0.6))
    close(0.6, dutyCycle(3, 2))
  })
  it('三角脈波(寬 T/3、Vm=9V):1.5V、3V', () => {
    const m = measure(makeTriangularPulse(9, 1 / 3, 1), 1)
    const c = triangularPulse(9, 1 / 3)
    close(m.avg, 1.5)
    close(m.rms, 3)
    close(m.avg, c.avg)
    close(m.rms, c.rms)
  })
  it('習作 QA-03 弦波 −8 sin(100πt):週期 20ms、峰值 8V', () => {
    const f = 50
    const fn = makeWave('sine', 8, f, 180) // −sin = sin(x+180°)
    close(fn(0.005), -8, 0.001)
    close(fn(0.015), 8, 0.001)
    const m = measure(fn, 1 / f)
    close(m.max, 8, 0.001)
  })
})
