import { useEffect, useState } from "react"
import { BrowserRouter } from "react-router-dom"
import { ThemeProvider } from "./contexts/ThemeContext"
import { AssistantProvider } from "./contexts/AssistantContext"
import MainLayout from "./components/layout/MainLayout"
import AppRoutes from "./routes/AppRoutes"
import MetaSpinner from "./components/ui/MetaSpinner"
import "./i18n"

const API_BASE = import.meta.env.VITE_API_BASE_URL

// M=0ms E=420ms T=840ms A=1260ms formed at ~1960ms + 640ms hold
const SPLASH_DURATION = 2600

function App() {
  const [splashVisible, setSplashVisible] = useState(true)
  const [splashFading, setSplashFading] = useState(false)

  // Keep backend alive — ping every 30s so Render free tier doesn't sleep
  useEffect(() => {
    const ping = () => fetch(`${API_BASE}/api/health`).catch(() => {})
    ping()
    const id = setInterval(ping, 30000)
    return () => clearInterval(id)
  }, [])

  // Splash: fade out at SPLASH_DURATION, remove from DOM 400ms after
  useEffect(() => {
    const fadeTimer = setTimeout(() => setSplashFading(true), SPLASH_DURATION)
    const removeTimer = setTimeout(() => setSplashVisible(false), SPLASH_DURATION + 400)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  return (
    <>
      {/* ── Full app always mounted so Router / OAuth work immediately ── */}
      <BrowserRouter>
        <ThemeProvider>
          <AssistantProvider>
            <MainLayout>
              <AppRoutes />
            </MainLayout>
          </AssistantProvider>
        </ThemeProvider>
      </BrowserRouter>

      {/* ── Splash overlay — sits on top, fades away ── */}
      {splashVisible && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
            zIndex: 9999,
            transition: "opacity 0.4s ease",
            opacity: splashFading ? 0 : 1,
            pointerEvents: splashFading ? "none" : "all",
          }}
        >
          <MetaSpinner size={110} label="Assembling your universe…" />
          <p
            style={{
              marginTop: "1.5rem",
              fontSize: "0.7rem",
              letterSpacing: "0.25em",
              color: "#475569",
              textTransform: "uppercase",
            }}
          >
            MetaGuide AI
          </p>
        </div>
      )}
    </>
  )
}

export default App
