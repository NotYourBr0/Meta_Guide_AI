import { useEffect, useRef } from 'react'

/**
 * MetaSpinner — animated "META" dust-particle formation loader.
 * Each letter assembles from scattered particles, one by one, smoothly.
 * Pure CSS + Canvas, zero external deps.
 *
 * Props:
 *   label  {string?}  — optional subtitle text beneath the animation
 *   size   {number?}  — canvas height in px, default 90
 */
const MetaSpinner = ({ label, size = 90 }) => {
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const W = canvas.width
    const H = canvas.height
    const letters = ['M', 'E', 'T', 'A']
    const PARTICLES_PER_LETTER = 32
    const LETTER_REVEAL_INTERVAL = 420  // ms between each letter starting
    const LETTER_FORM_DURATION = 700    // ms for particles to travel to target

    // --- Build pixel targets for each letter ---
    function getLetterPixels(char, offsetX) {
      const offscreen = document.createElement('canvas')
      offscreen.width = W
      offscreen.height = H
      const oc = offscreen.getContext('2d')
      const fontSize = H * 0.72
      oc.font = `900 ${fontSize}px 'Inter', 'Segoe UI', sans-serif`
      oc.fillStyle = '#fff'
      oc.textAlign = 'left'
      oc.textBaseline = 'middle'
      oc.fillText(char, offsetX, H / 2)
      const data = oc.getImageData(0, 0, W, H).data
      const pixels = []
      for (let y = 0; y < H; y += 3) {
        for (let x = 0; x < W; x += 3) {
          const idx = (y * W + x) * 4
          if (data[idx + 3] > 80) pixels.push({ x, y })
        }
      }
      return pixels
    }

    // Layout letters evenly
    const letterWidth = W / letters.length
    const allLetterPixels = letters.map((ch, i) =>
      getLetterPixels(ch, i * letterWidth + letterWidth * 0.12)
    )

    // Gradient palette per letter
    const colors = [
      ['#38bdf8', '#818cf8'],  // M — sky→indigo
      ['#a78bfa', '#f472b6'],  // E — violet→pink
      ['#34d399', '#06b6d4'],  // T — emerald→cyan
      ['#fb923c', '#facc15'],  // A — orange→yellow
    ]

    // Build particle groups
    const groups = letters.map((_, li) => {
      const targets = allLetterPixels[li]
      return Array.from({ length: PARTICLES_PER_LETTER }, (_, pi) => {
        const target = targets[Math.floor(Math.random() * targets.length)] || { x: W / 2, y: H / 2 }
        return {
          x: Math.random() * W,
          y: Math.random() * H,
          tx: target.x,
          ty: target.y,
          startTime: null,      // set when this letter's phase begins
          opacity: 0,
          size: 1.5 + Math.random() * 2,
          color: colors[li][pi % 2],
          delay: Math.random() * 200, // small per-particle delay within letter
        }
      })
    })

    const startTime = performance.now()
    let frame

    function lerp(a, b, t) { return a + (b - a) * t }
    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3) }

    function draw(now) {
      ctx.clearRect(0, 0, W, H)

      groups.forEach((particles, li) => {
        const letterStart = startTime + li * LETTER_REVEAL_INTERVAL

        particles.forEach(p => {
          const effectiveStart = letterStart + p.delay
          const elapsed = now - effectiveStart
          if (elapsed < 0) return

          const t = Math.min(elapsed / LETTER_FORM_DURATION, 1)
          const ease = easeOutCubic(t)

          p.x = lerp(p.x, p.tx, 0.08)   // soft spring-like approach
          p.y = lerp(p.y, p.ty, 0.08)
          p.opacity = Math.min(t * 2, 1)

          // After fully formed, gentle pulse
          const pulse = t >= 1 ? 0.82 + 0.18 * Math.sin((now - letterStart) / 400 + li) : ease
          ctx.globalAlpha = p.opacity * pulse

          // Glow
          ctx.shadowColor = p.color
          ctx.shadowBlur = 6

          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()

          ctx.shadowBlur = 0
          ctx.globalAlpha = 1
        })
      })

      frame = requestAnimationFrame(draw)
    }

    frame = requestAnimationFrame(draw)
    animRef.current = frame

    return () => cancelAnimationFrame(frame)
  }, [size])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 0',
        gap: '0.75rem',
        userSelect: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        width={size * 3.6}
        height={size}
        style={{ display: 'block' }}
        aria-label="Loading…"
      />
      {label && (
        <p
          style={{
            fontSize: '0.82rem',
            color: '#94a3b8',
            letterSpacing: '0.04em',
            animation: 'metaPulse 1.6s ease-in-out infinite',
          }}
        >
          {label}
        </p>
      )}

      <style>{`
        @keyframes metaPulse {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1;   }
        }
      `}</style>
    </div>
  )
}

export default MetaSpinner
