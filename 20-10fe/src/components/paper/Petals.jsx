// Cánh hoa rơi làm nền — 3–4 cánh mỗi màn, tắt với prefers-reduced-motion (CSS)
const PRESETS = [
  { left: '12%', width: 14, height: 18, color: '#f3c9ad', duration: 11, delay: 0 },
  { left: '38%', width: 11, height: 15, color: '#eab89a', duration: 13, delay: 3 },
  { left: '70%', width: 13, height: 17, color: '#f3c9ad', duration: 12, delay: 6 },
  { left: '88%', width: 10, height: 14, color: '#e8b090', duration: 14, delay: 1.5 },
]

function Petals({ count = 4, fast = false }) {
  return (
    <div className="petals" aria-hidden="true">
      {PRESETS.slice(0, count).map((petal) => (
        <span
          key={petal.left}
          className="petal"
          style={{
            left: petal.left,
            width: petal.width,
            height: petal.height,
            background: petal.color,
            '--petal-dur': `${fast ? petal.duration - 3 : petal.duration}s`,
            '--petal-delay': `${petal.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

export default Petals
