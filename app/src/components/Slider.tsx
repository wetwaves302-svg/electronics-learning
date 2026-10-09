interface Props {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (v: number) => void
}

export default function Slider({ label, value, min, max, step = 1, unit = '', onChange }: Props) {
  return (
    <label className="block">
      <span className="flex justify-between text-sm font-medium">
        <span>{label}</span>
        <span className="rounded-md bg-sun-100 px-2 font-bold text-navy-900">{value}{unit}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-8 accent-teal-600" />
    </label>
  )
}
