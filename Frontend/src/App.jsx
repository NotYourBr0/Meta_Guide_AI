import { useEffect } from "react"
import { BrowserRouter } from "react-router-dom"
import { ThemeProvider } from "./contexts/ThemeContext"
import { AssistantProvider } from "./contexts/AssistantContext"
import MainLayout from "./components/layout/MainLayout"
import AppRoutes from "./routes/AppRoutes"
import "./i18n"

const API_BASE = import.meta.env.VITE_API_BASE_URL

function App() {
  // Keep backend alive — ping every 30s so Render free tier doesn't sleep
  useEffect(() => {
    const ping = () => fetch(`${API_BASE}/api/health`).catch(() => {})
    ping() // immediate first ping
    const id = setInterval(ping, 30000)
    return () => clearInterval(id)
  }, [])

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AssistantProvider>
          <MainLayout>
            <AppRoutes />
          </MainLayout>
        </AssistantProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App

