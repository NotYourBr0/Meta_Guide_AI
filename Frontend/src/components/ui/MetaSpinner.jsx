import { useEffect, useRef } from 'react'

/**
 * MetaSpinner — Optimized animated "META" dust-particle formation loader.
 * High particle count + exact easing for crisp letter formation.
 */
const MetaSpinner = ({ label, size = 90 }) => {
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    // Handle high DPI screens for crisp rendering
    const dpr = window.devicePixelRatio || 1
    const cssW = size * 3.6
    const cssH = size
    
    canvas.width = cssW * dpr
    canvas.height = cssH * dpr
    ctx.scale(dpr, dpr)

    const W = cssW
    const H = cssH
    const letters = ['M', 'E', 'T', 'A']
    
    // Animation timing configuration
    const LETTER_REVEAL_INTERVAL = 300  // ms between each letter starting
    const LETTER_FORM_DURATION = 1100   // Smooth, longer travel time

    // --- Build pixel targets for each letter ---
    function getLetterPixels(char, offsetX) {
      const offscreen = document.createElement('canvas')
      offscreen.width = W
      offscreen.height = H
      const oc = offscreen.getContext('2d')
      
      const fontSize = H * 0.75 
      oc.font = `900 ${fontSize}px 'Inter', 'Segoe UI', sans-serif`
      oc.fillStyle = '#fff'
      oc.textAlign = 'left'
      oc.textBaseline = 'middle'
      oc.fillText(char, offsetX, H / 2)
      
      const data = oc.getImageData(0, 0, W, H).data
      const pixels = []
      
      // Sample every 4th pixel for a dense, recognizable shape
      for (let y = 0; y < H; y += 4) {
        for (let x = 0; x < W; x += 4) {
          const idx = (y * W + x) * 4
          // Stricter alpha check for crisp edges
          if (data[idx + 3] > 128) pixels.push({ x, y }) 
        }
      }
      return pixels
    }

    // Layout letters evenly
    const letterWidth = W / letters.length
    const allLetterPixels = letters.map((ch, i) =>
      getLetterPixels(ch, i * letterWidth + letterWidth * 0.1)
    )

    // Gradient palette per letter
    const colors = [
      ['#38bdf8', '#818cf8'],  // M — sky→indigo
      ['#a78bfa', '#f472b6'],  // E — violet→pink
      ['#34d399', '#06b6d4'],  // T — emerald→cyan
      ['#fb923c', '#facc15'],  // A — orange→yellow
    ]

    // Create particles EXACTLY matching the pixel targets
    const groups = letters.map((_, li) => {
      const targets = allLetterPixels[li]
      return targets.map((target, pi) => {
        return {
          sx: W / 2 + (Math.random() - 0.5) * 60, // Start clustered near the center
          sy: H / 2 + (Math.random() - 0.5) * 60,
          tx: target.x,
          ty: target.y,
          size: 1.2 + Math.random() * 1.5, // Slightly smaller, refined dots
          color: colors[li][pi % 2],
          delay: Math.random() * 400, // Staggered start times
        }
      })
    })

    const startTime = performance.now()
    let frame

    // Smooth cubic easing for precise, snappy landings
    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3) }

    function draw(now) {
      ctx.clearRect(0, 0, W, H)

      groups.forEach((particles, li) => {
        const letterStart = startTime + li * LETTER_REVEAL_INTERVAL

        particles.forEach(p => {
          const effectiveStart = letterStart + p.delay
          const elapsed = now - effectiveStart
          if (elapsed < 0) return

          // Lock t between 0 and 1
          const t = Math.min(elapsed / LETTER_FORM_DURATION, 1)
          const ease = easeOutCubic(t)

          // Exact easing formula from start to target guarantees perfectly formed letters
          const currentX = p.sx + (p.tx - p.sx) * ease
          const currentY = p.sy + (p.ty - p.sy) * ease
          
          const opacity = Math.min(t * 2, 1)

          // Gentle vertical breathing effect after the letter is fully formed
          const floatY = t >= 1 ? Math.sin((now - letterStart) / 600 + p.tx) * 1.5 : 0

          ctx.globalAlpha = opacity
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(currentX, currentY + floatY, p.size, 0, Math.PI * 2)
          ctx.fill()
        })
      })

      ctx.globalAlpha = 1 // Reset alpha
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
        style={{ 
          display: 'block',
          width: `${size * 3.6}px`, 
          height: `${size}px` 
        }}
        aria-label="Loading…"
      />
      {label && (
        <p
          style={{
            fontSize: '0.82rem',
            color: '#94a3b8',
            letterSpacing: '0.04em',
            animation: 'metaPulse 1.6s ease-in-out infinite',
            margin: 0,
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