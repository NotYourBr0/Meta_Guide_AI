import { BrowserRouter } from "react-router-dom"
import { ThemeProvider } from "./contexts/ThemeContext"
import MainLayout from "./components/layout/MainLayout"
import AppRoutes from "./routes/AppRoutes"
import "./i18n"

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <MainLayout>
          <AppRoutes />
        </MainLayout>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
